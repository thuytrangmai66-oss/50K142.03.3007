import { z } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { entitySchemas, metadataSchemas, identifier } from '../domain/records';
import { assertFinalizable, initialSalePrice, purchaseDraftSchema, purchaseLineSchema,
  purchaseApprovalSchema, purchaseFinalizationSchema, purchaseProvenanceSchema, purchaseSubtotal,
  PURCHASE_FORMAT } from '../domain/purchases';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { randomHex, sha256 } from './auth/crypto';
import { canonical, requireCandidate } from '../repositories/purchase-links';
import { RepositoryError, validateReferences } from '../repositories/constraints';
import { recordVersionKey } from '../repositories';

const code = z.number().int().min(0).max(255);
export const statusMappingSchema = z.object({ invoiceCompleted: code, productAvailable: code, productSold: code })
  .strict().refine(value => value.productAvailable !== value.productSold, 'Product states must differ');
export type PurchaseStatusMapping = z.infer<typeof statusMappingSchema>;
const commandSchema = z.object({
  operationId: z.string().trim().min(1).max(150), draftId: identifier,
  expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict();
export type FinalizePurchaseCommand = z.infer<typeof commandSchema>;

/** Explicit mapping is snapshotted per invoice, keeping legacy numeric states
 * independent. The shared runtime mapping is bound by AuthProvider. */
export class PurchaseFinalizationService {
  private readonly auth: AuthService;
  private readonly statuses: Readonly<PurchaseStatusMapping>;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null, mapping: PurchaseStatusMapping) {
    requireCandidate(db);
    this.auth = new AuthService(db);
    this.statuses = Object.freeze(statusMappingSchema.parse(mapping));
  }

  private async issueCode(table: 'hoaDonThuMua' | 'sanPham', prefix: string, executedAt: string) {
    for (let attempt = 0; attempt < 16; attempt++) {
      const id = `${prefix}${randomHex(4)}`, key = recordVersionKey(table, id);
      if (await this.db.table(table).get(id) || await this.db.issuedIdentifiers.get(key) || await this.db.recordVersions.get(key)) continue;
      await this.db.issuedIdentifiers.add({ key, issuedAt: executedAt });
      await this.db.recordVersions.add({ key, version: 1, updatedAt: executedAt });
      return id;
    }
    throw new RepositoryError('DUPLICATE', 'Không thể cấp mã duy nhất, hãy thử lại');
  }

  private async issueProductCodes(count: number, executedAt: string) {
    // Reserve against the current write transaction, including deleted IDs and
    // version tombstones. Local sets also prevent duplicates within this batch.
    const [existing, issued, versions] = await Promise.all([
      this.db.sanPham.toCollection().primaryKeys(), this.db.issuedIdentifiers.toCollection().primaryKeys(),
      this.db.recordVersions.toCollection().primaryKeys(),
    ]);
    const products = new Set(existing), reserved = new Set([...issued, ...versions]), ids: string[] = [];
    for (let item = 0; item < count; item++) {
      let selected: string | undefined;
      for (let attempt = 0; attempt < 16; attempt++) {
        const id = `SP${randomHex(4)}`, key = recordVersionKey('sanPham', id);
        if (products.has(id) || reserved.has(key)) continue;
        products.add(id); reserved.add(key); selected = id; break;
      }
      if (!selected) throw new RepositoryError('DUPLICATE', 'Không thể cấp mã duy nhất, hãy thử lại');
      ids.push(selected);
    }
    await Promise.all(ids.map(async id => {
      const key = recordVersionKey('sanPham', id);
      await this.db.issuedIdentifiers.add({ key, issuedAt: executedAt });
      await this.db.recordVersions.add({ key, version: 1, updatedAt: executedAt });
    }));
    return ids;
  }

  async finalize(input: FinalizePurchaseCommand): Promise<{ invoiceId: string; duplicate: boolean }> {
    const command = commandSchema.parse(input);
    const fingerprint = await sha256(canonical(command));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'purchases.create');
    const receiptId = `purchase-finalize:${command.operationId}`;
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard();
      const draft = purchaseDraftSchema.parse(await this.db.table('purchaseDrafts').get(command.draftId));
      if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      const receipt = await this.db.operations.get(receiptId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Operation payload changed');
        const saved = await this.db.table('purchaseFinalizations').where('draftId').equals(draft.id).first();
        if (!saved || saved.invoiceId !== draft.invoiceId || draft.status !== 'finalized') throw new RepositoryError('REFERENCE', 'Kết quả hoàn tất không nhất quán');
        return { invoiceId: saved.invoiceId, duplicate: true };
      }
      if (draft.status !== 'editing' || draft.revision !== command.expectedRevision) throw new RepositoryError('CONFLICT', 'Giao dịch đã thay đổi hoặc đã hoàn tất');
      const lines = (await this.db.table('purchaseLines').where('draftId').equals(draft.id).toArray())
        .map(raw => purchaseLineSchema.parse(raw)).filter(line => !line.removedAt);
      lines.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id.localeCompare(b.id));
      const approvals = (await this.db.table('purchaseApprovals').where('draftId').equals(draft.id).toArray())
        .map(raw => purchaseApprovalSchema.parse(raw));
      assertFinalizable(draft, lines, approvals);
      if (!draft.customerId || !await this.db.khachHang.get(draft.customerId)) throw new RepositoryError('REFERENCE', 'Hãy chọn khách hàng hợp lệ');
      const executedAt = new Date().toISOString();
      const importedOn = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(executedAt));
      const subtotal = purchaseSubtotal(lines);
      const invoiceId = await this.issueCode('hoaDonThuMua', 'TM', executedAt);
      await this.db.hoaDonThuMua.add(entitySchemas.hoaDonThuMua.parse({
        MaHDTM: invoiceId, NgayThuMua: executedAt, TongTienTM: subtotal,
        TrangThai: this.statuses.invoiceCompleted, MaKH: draft.customerId, MaNV: actor.employeeId,
      }));
      await this.db.table('purchaseDrafts').put({ ...draft, status: 'finalized', invoiceId,
        revision: draft.revision + 1, updatedAt: executedAt });
      await this.db.table('purchaseFinalizations').add(purchaseFinalizationSchema.parse({
        format: PURCHASE_FORMAT, invoiceId, draftId: draft.id, lines, subtotal, paidTotal: subtotal,
        finalizedAt: executedAt, paidAt: executedAt,
      }));
      await this.db.appMetadata.add({ key: `purchase-status-mapping:${invoiceId}`, value: canonical(this.statuses) });
      const changed = [`hoaDonThuMua:${invoiceId}`, `purchaseDrafts:${draft.id}`, `purchaseFinalizations:${invoiceId}`];
      for (const line of lines) {
        const salePrice = initialSalePrice(line.unitCost);
        const productIds = await this.issueProductCodes(line.quantity, executedAt);
        // Queue independent item writes together; the enclosing transaction
        // still aborts every row/reservation on any failed add or FK check.
        await Promise.all(productIds.map(async productId => {
          await this.db.sanPham.add(entitySchemas.sanPham.parse({
            MaSP: productId, TenSP: line.bracket.type, NgayNhapKho: importedOn,
            GiaGocChuKyGiam: salePrice, GiaBanHienHanh: salePrice, TrangThai: this.statuses.productAvailable,
            NgayBatDauChuKyGiam: importedOn, MaHDTM: invoiceId, MaKhungGia: line.bracket.id,
          }));
          await this.db.productCosts.add(metadataSchemas.productCosts.parse({
            MaSP: productId, MaHDTM: invoiceId, MaKhungGia: line.bracket.id, unitCost: line.unitCost, recordedAt: executedAt,
          }));
          await this.db.table('purchaseProvenance').add(purchaseProvenanceSchema.parse({
            format: PURCHASE_FORMAT, productId, invoiceId, lineId: line.id,
            unitCost: line.unitCost, recordedAt: executedAt,
          }));
        }));
        for (const productId of productIds) changed.push(`sanPham:${productId}`, `productCosts:${productId}`, `purchaseProvenance:${productId}`);
      }
      await validateReferences(this.db);
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt, changed });
      return { invoiceId, duplicate: false };
    });
  }
}
