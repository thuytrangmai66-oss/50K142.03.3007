import type { CoCoDatabase } from '../db/schema';
import type { AuthUser } from '../domain/auth';
import { entitySchemas, metadataSchemas } from '../domain/records';
import { salesDraftSchema, calculateSalesPromotion, salesSubtotal } from '../domain/sales';
import { checkoutInputSchema, finalizeSaleSchema, SALE_CODES, saleSnapshotSchema, paidSaleSchema,
  type CheckoutInput, type FinalizeSale, type SaleQuote, type SaleSnapshot } from '../domain/sale-payment';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { randomHex, sha256 } from './auth/crypto';
import { canonical } from '../repositories/purchase-links';
import { RepositoryError, validateReferences } from '../repositories/constraints';
import { recordVersionKey } from '../repositories';
import { statusMappingSchema } from './purchase-finalization';
import { createVietQr } from '../lib/payment/vietqr';

export const saleInvoiceKey = (id: string) => `sales-invoice:${id}`;
const draftKey = (id: string) => `sales-draft:${id}`;

export class SalesPaymentService {
  private readonly auth: AuthService;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null) { this.auth = new AuthService(db); }

  private async draft(id: string) {
    const row = await this.db.appMetadata.get(draftKey(id));
    if (!row) throw new RepositoryError('REFERENCE', 'Không tìm thấy giỏ hàng');
    return salesDraftSchema.parse(JSON.parse(row.value));
  }

  private async snapshot(input: CheckoutInput, invoiceId: string, actor: AuthUser): Promise<SaleSnapshot> {
    const draft = await this.draft(input.draftId);
    if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
    if (draft.status !== 'editing' || draft.revision !== input.expectedRevision) throw new RepositoryError('CONFLICT', 'Giỏ hàng đã thay đổi hoặc đã hoàn tất');
    if (!draft.lines.length) throw new RepositoryError('VALIDATION', 'Hãy thêm ít nhất một sản phẩm');
    const customer = entitySchemas.khachHang.parse(await this.db.khachHang.get(input.customerId));
    const memberRow = await this.db.memberships.get(customer.MaKH);
    const member = memberRow ? metadataSchemas.memberships.parse(memberRow) : undefined;
    for (const line of draft.lines) {
      const product = entitySchemas.sanPham.parse(await this.db.sanPham.get(line.productId));
      const mapping = await this.db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
      if (!mapping) throw new RepositoryError('REFERENCE', 'Không thể xác minh trạng thái bán của sản phẩm này');
      const statuses = statusMappingSchema.parse(JSON.parse(mapping.value));
      const version = (await this.db.recordVersions.get(recordVersionKey('sanPham', product.MaSP)))?.version ?? 0;
      if (product.TrangThai !== statuses.productAvailable || product.GiaBanHienHanh !== line.unitPrice
        || product.MaHDTM !== line.sourcePurchaseId || version !== line.productVersion) {
        throw new RepositoryError('CONFLICT', `Sản phẩm ${product.MaSP} đã thay đổi trạng thái hoặc giá. Hãy xóa sản phẩm và thêm lại.`);
      }
    }
    const promotion = calculateSalesPromotion({ subtotal: salesSubtotal(draft.lines), isMember: Boolean(member),
      pointsBalance: customer.DiemTichLuy, useMembershipDiscount: Boolean(member) && customer.DiemTichLuy >= 50 });
    return saleSnapshotSchema.parse({ format: 'sales-invoice-v1', invoiceId, draftId: draft.id, revision: draft.revision,
      method: input.method, mapping: SALE_CODES, employee: { id: actor.employeeId, username: actor.username, name: actor.displayName },
      customer: { id: customer.MaKH, name: customer.TenKH, phone: customer.SoDienThoaiKH,
        version: (await this.db.recordVersions.get(recordVersionKey('khachHang', customer.MaKH)))?.version ?? 0,
        registeredAt: member?.registeredAt ?? null, isMember: Boolean(member), pointsBefore: promotion.pointsBefore,
        pointsUsed: promotion.pointsUsed, pointsEarned: promotion.pointsEarned, pointsAfter: promotion.pointsAfter },
      lines: draft.lines, subtotal: promotion.subtotal, discount: promotion.discount, total: promotion.total });
  }

  async quote(raw: CheckoutInput): Promise<SaleQuote> {
    const input = checkoutInputSchema.parse(raw);
    const snapshot = await this.auth.readAuthorized(this.token() ?? '', 'sales.create', async actor => {
      for (let attempt = 0; attempt < 16; attempt++) {
        const id = `BH${randomHex(4)}`, key = recordVersionKey('hoaDonBanHang', id);
        if (await this.db.hoaDonBanHang.get(id) || await this.db.issuedIdentifiers.get(key) || await this.db.recordVersions.get(key)) continue;
        return this.snapshot(input, id, actor);
      }
      throw new RepositoryError('DUPLICATE', 'Không thể cấp mã hóa đơn, vui lòng thử lại');
    });
    return { snapshot, fingerprint: await sha256(canonical(snapshot)),
      ...(input.method === 'transfer' ? { qrPayload: createVietQr(snapshot.total, snapshot.invoiceId) } : {}) };
  }

  private async bump(table: 'sanPham' | 'khachHang' | 'chiTietHoaDonBH' | 'hoaDonBanHang', id: string | [string, string], at: string) {
    const key = recordVersionKey(table, id), old = await this.db.recordVersions.get(key);
    const version = (old?.version ?? 0) + 1;
    if (!Number.isSafeInteger(version)) throw new RepositoryError('CONFLICT', 'Phiên bản dữ liệu vượt giới hạn');
    await this.db.recordVersions.put({ key, version, updatedAt: at });
  }

  async finalize(raw: FinalizeSale): Promise<{ invoiceId: string; duplicate: boolean }> {
    const input = finalizeSaleSchema.parse(raw), fingerprint = await sha256(canonical(input));
    const expectedSnapshot = canonical(input.snapshot);
    if (await sha256(expectedSnapshot) !== input.fingerprint) throw new RepositoryError('CONFLICT', 'Thông tin thanh toán không hợp lệ');
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'sales.create');
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard(), draft = await this.draft(input.checkout.draftId);
      if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      const receiptId = `sale-finalize:${input.operationId}`, receipt = await this.db.operations.get(receiptId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Dữ liệu thao tác đã thay đổi');
        const saved = await this.db.appMetadata.get(saleInvoiceKey(input.invoiceId));
        const paid = saved && paidSaleSchema.parse(JSON.parse(saved.value));
        if (!paid || draft.invoiceId !== input.invoiceId || draft.status !== 'finalized' || paid.operationId !== input.operationId
          || !await this.db.hoaDonBanHang.get(input.invoiceId)) throw new RepositoryError('REFERENCE', 'Kết quả thanh toán không nhất quán');
        return { invoiceId: input.invoiceId, duplicate: true };
      }
      const snapshot = await this.snapshot(input.checkout, input.invoiceId, actor);
      // No WebCrypto work inside IndexedDB transactions. Canonical comparison
      // uses a pre-hashed quote digest computed before entering the transaction.
      if (canonical(snapshot) !== expectedSnapshot) throw new RepositoryError('CONFLICT', 'Thông tin thanh toán đã thay đổi. Vui lòng mở lại thanh toán.');
      const invoiceKey = recordVersionKey('hoaDonBanHang', snapshot.invoiceId);
      if (await this.db.hoaDonBanHang.get(snapshot.invoiceId) || await this.db.issuedIdentifiers.get(invoiceKey)
        || await this.db.recordVersions.get(invoiceKey)) throw new RepositoryError('DUPLICATE', 'Mã hóa đơn đã được sử dụng. Vui lòng mở lại thanh toán.');
      const paidAt = new Date().toISOString(), changed: string[] = [];
      await this.db.hoaDonBanHang.add(entitySchemas.hoaDonBanHang.parse({ MaHDBH: snapshot.invoiceId, NgayBan: paidAt,
        TongTien: snapshot.total, TienKhuyenMai: snapshot.discount, TichDiem: snapshot.customer.pointsEarned,
        PTTT: SALE_CODES[snapshot.method], TrangThai: SALE_CODES.completed, MaNV: actor.employeeId, MaKH: snapshot.customer.id }));
      await this.db.issuedIdentifiers.add({ key: invoiceKey, issuedAt: paidAt });
      await this.bump('hoaDonBanHang', snapshot.invoiceId, paidAt);
      for (const line of snapshot.lines) {
        await this.db.chiTietHoaDonBH.add(entitySchemas.chiTietHoaDonBH.parse({ MaHDBH: snapshot.invoiceId, MaSP: line.productId,
          SoLuong: line.quantity, DonGia: line.unitPrice, ThanhTien: line.lineTotal }));
        const product = entitySchemas.sanPham.parse(await this.db.sanPham.get(line.productId));
        const mapping = await this.db.appMetadata.get(`purchase-status-mapping:${product.MaHDTM}`);
        const statuses = statusMappingSchema.parse(JSON.parse(mapping!.value));
        await this.db.sanPham.put({ ...product, TrangThai: statuses.productSold });
        await this.bump('sanPham', product.MaSP, paidAt);
        await this.bump('chiTietHoaDonBH', [snapshot.invoiceId, product.MaSP], paidAt);
        changed.push(recordVersionKey('sanPham', product.MaSP), recordVersionKey('chiTietHoaDonBH', [snapshot.invoiceId, product.MaSP]));
      }
      if (snapshot.customer.isMember) {
        const customer = entitySchemas.khachHang.parse(await this.db.khachHang.get(snapshot.customer.id));
        await this.db.khachHang.put({ ...customer, DiemTichLuy: snapshot.customer.pointsAfter });
        await this.bump('khachHang', customer.MaKH, paidAt);
        changed.push(recordVersionKey('khachHang', customer.MaKH));
      }
      await this.db.appMetadata.add({ key: saleInvoiceKey(snapshot.invoiceId), value: canonical(paidSaleSchema.parse({ snapshot, paidAt, operationId: input.operationId })) });
      await this.db.appMetadata.put({ key: draftKey(draft.id), value: canonical(salesDraftSchema.parse({ ...draft,
        status: 'finalized', invoiceId: snapshot.invoiceId, revision: draft.revision + 1, updatedAt: paidAt })) });
      await validateReferences(this.db);
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt: paidAt });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt: paidAt,
        changed: [invoiceKey, saleInvoiceKey(snapshot.invoiceId), draftKey(draft.id), ...changed] });
      return { invoiceId: snapshot.invoiceId, duplicate: false };
    });
  }
}
