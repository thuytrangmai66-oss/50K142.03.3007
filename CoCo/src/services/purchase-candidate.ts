import { z } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { purchaseDraftSchema, purchaseLineSchema, purchaseApprovalSchema,
  purchaseFinalizationSchema, approvalMatchesLine, purchaseSubtotal } from '../domain/purchases';
import { validateReferences, RepositoryError } from '../repositories/constraints';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { sha256 } from './auth/crypto';
import { conditionMetadataKey, CONDITION_CATALOG_VERSION } from '../domain/conditions';

import { canonical, requireCandidate, referenceFailure, historicalEmployee, validateCandidatePurchaseReferences } from '../repositories/purchase-links';
export { validateCandidatePurchaseReferences } from '../repositories/purchase-links';

const draftCommandSchema = z.object({
  operationId: z.string().trim().min(1).max(150), expectedRevision: z.number().int().nonnegative(),
  draft: purchaseDraftSchema, lines: z.array(purchaseLineSchema), approvals: z.array(purchaseApprovalSchema),
}).strict();
export type CandidateDraftCommand = z.infer<typeof draftCommandSchema>;

/** T01 transaction foundation, activated for T02 after explicit acceptance.
 * Finalization and approval decisions remain in their dependent tasks.
 */
export class CandidatePurchaseTransactions {
  private readonly auth: AuthService;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null) { requireCandidate(db); this.auth = new AuthService(db); }
  async saveEditingDraft(input: CandidateDraftCommand): Promise<{ duplicate: boolean }> {
    const command = draftCommandSchema.parse(structuredClone(input));
    if (command.draft.status !== 'editing' || command.draft.revision !== command.expectedRevision + 1) throw new RepositoryError('VALIDATION', 'Invalid editing draft revision');
    if (new Set(command.lines.map(line => line.id)).size !== command.lines.length || new Set(command.approvals.map(row => row.id)).size !== command.approvals.length) throw new RepositoryError('DUPLICATE', 'Duplicate identity');
    purchaseSubtotal(command.lines);
    const fingerprint = await sha256(canonical(command)), guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'purchases.create');
    const operationId = `g6-draft:${command.operationId}`;
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard();
      if (await historicalEmployee(this.db, command.draft.createdBy) !== actor.employeeId || command.draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      const receipt = await this.db.operations.get(operationId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Operation payload changed');
        return { duplicate: true };
      }
      const previous = await this.db.table('purchaseDrafts').get(command.draft.id);
      if ((previous?.revision ?? 0) !== command.expectedRevision || previous && previous.status !== 'editing') throw new RepositoryError('CONFLICT', 'Stale draft');
      if (previous && (previous.createdBy !== command.draft.createdBy || previous.createdAt !== command.draft.createdAt)) throw new RepositoryError('IMMUTABLE', 'Draft provenance changed');
      // Editing/removal of existing lines needs the invalidation/cancellation
      // contract in T02/T04. Do not silently overwrite or erase history here.
      for (const old of await this.db.table('purchaseLines').where('draftId').equals(command.draft.id).toArray()) {
        const next = command.lines.find(line => line.id === old.id);
        if (!next || canonical(next) !== canonical(old)) throw new RepositoryError('IMMUTABLE', 'Existing line changes require invalidation contract');
      }
      for (const line of command.lines) {
        const old = await this.db.table('purchaseLines').get(line.id);
        if (line.draftId !== command.draft.id || (!old && !['priced', 'pending'].includes(line.status))) throw referenceFailure();
        if (old && canonical(old) !== canonical(line)) throw new RepositoryError('CONFLICT', 'Line identity reused');
        const bracket = await this.db.khungGiaThuMua.get(line.bracket.id);
        if (!old && (await this.db.appMetadata.get(conditionMetadataKey(line.bracket.id)))?.value !== CONDITION_CATALOG_VERSION) throw new RepositoryError('CONFLICT', 'Legacy condition mapping requires review');
        if (!old && (!bracket || bracket.LoaiSanPham !== line.bracket.type || bracket.ThuongHieu !== line.bracket.brand || bracket.TinhTrang !== line.bracket.condition || bracket.GiaMin !== line.bracket.min || bracket.GiaMax !== line.bracket.max ||
          (await this.db.recordVersions.get(JSON.stringify(['khungGiaThuMua', line.bracket.id])))?.version !== line.bracket.revision)) throw new RepositoryError('CONFLICT', 'Bracket snapshot changed');
      }
      for (const approval of command.approvals) {
        const line = command.lines.find(item => item.id === approval.lineId);
        const old = await this.db.table('purchaseApprovals').get(approval.id);
        if ((!old && (approval.requestedBy !== actor.username || approval.decision.status !== 'pending')) || await historicalEmployee(this.db, approval.requestedBy) !== actor.employeeId || !line) throw referenceFailure();
        // Superseded decisions retain their immutable snapshots. Only a new or
        // currently linked request must match the current line revision.
        if ((!old || line.approvalId === approval.id) && !approvalMatchesLine(approval, line)) throw referenceFailure();
        if (old && canonical(old) !== canonical(approval)) throw new RepositoryError('IMMUTABLE', 'Request history changed');
      }
      await this.db.table('purchaseDrafts').put(command.draft);
      await this.db.table('purchaseLines').bulkPut(command.lines);
      await this.db.table('purchaseApprovals').bulkPut(command.approvals);
      await validateReferences(this.db);
      await validateCandidatePurchaseReferences(this.db);
      const executedAt = new Date().toISOString();
      await this.db.operations.add({ id: operationId, fingerprint, executedAt });
      await this.db.auditEntries.add({ id: operationId, actor: actor.username, executedAt, changed: [`purchaseDrafts:${command.draft.id}`, ...command.lines.map(line => `purchaseLines:${line.id}`), ...command.approvals.map(row => `purchaseApprovals:${row.id}`)] });
      return { duplicate: false };
    });
  }
}

/** Read-only adapter: legacy state stays a raw number, never inferred finalized. */
export async function readCandidatePurchase(db: CoCoDatabase, invoiceId: string) {
  return db.transaction('r', db.tables, async () => {
    const invoice = await db.hoaDonThuMua.get(invoiceId);
    if (!invoice) return undefined;
    const raw = db.tables.some(table => table.name === 'purchaseFinalizations') ? await db.table('purchaseFinalizations').get(invoiceId) : undefined;
    if (raw) {
      await validateReferences(db);
      const snapshot = purchaseFinalizationSchema.parse(raw);
      if (snapshot.subtotal !== invoice.TongTienTM) throw referenceFailure();
      return { source: 'purchase-lines-v1' as const, invoice, lines: snapshot.lines, subtotal: snapshot.subtotal, finalizedAt: snapshot.finalizedAt };
    }
    if (db.tables.some(table => table.name === 'purchaseProvenance') && await db.table('purchaseProvenance').where('invoiceId').equals(invoiceId).count()) throw referenceFailure();
    if (await db.appMetadata.get(`purchase-status-mapping:${invoiceId}`)) throw referenceFailure();
    if (db.tables.some(table => table.name === 'purchaseDrafts') && await db.table('purchaseDrafts').filter(row => row.invoiceId === invoiceId).count()) throw referenceFailure();
    return { source: 'legacy' as const, invoice, lines: await db.chiTietHoaDonTM.where('MaHDTM').equals(invoiceId).toArray(), subtotal: invoice.TongTienTM, finalizedAt: undefined };
  });
}
