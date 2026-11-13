import type { CoCoDatabase } from '../db/schema';
import type { RecordMap } from '../domain/records';
import { purchaseDraftSchema, purchaseLineSchema, purchaseApprovalSchema, purchaseNoticeSchema, purchaseFinalizationSchema, purchaseProvenanceSchema, approvalMatchesLine } from '../domain/purchases';
import { RepositoryError } from './errors';

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function requireCandidate(db: CoCoDatabase) {
  if (db.verno !== 4 || !db.tables.some(table => table.name === 'purchaseDrafts')) throw new Error('Unactivated G6 candidate database required');
}
export const referenceFailure = () => new RepositoryError('REFERENCE', 'Invalid candidate purchase link');
export async function historicalEmployee(db: CoCoDatabase, username: string): Promise<string | undefined> {
  return (await db.taiKhoan.get(username))?.MaNV ?? (await db.appMetadata.get(`account-identity:${username}`))?.value;
}

/** Validates candidate metadata before its explicit FK selector can be used.
 * The v3 runtime never registers these stores or executes this validator.
 */
export async function validateCandidatePurchaseReferences(db: CoCoDatabase): Promise<void> {
  requireCandidate(db);
  for (const raw of await db.table('purchaseDrafts').toArray()) {
    const draft = purchaseDraftSchema.parse(raw);
    if (await historicalEmployee(db, draft.createdBy) !== draft.employeeId || !await db.nhanVien.get(draft.employeeId)) throw referenceFailure();
    if (draft.customerId && !await db.khachHang.get(draft.customerId)) throw referenceFailure();
    if (draft.invoiceId && !await db.hoaDonThuMua.get(draft.invoiceId)) throw referenceFailure();
  }
  for (const raw of await db.table('purchaseLines').toArray()) {
    const line = purchaseLineSchema.parse(raw);
    if (!await db.table('purchaseDrafts').get(line.draftId) || !await db.khungGiaThuMua.get(line.bracket.id)) throw referenceFailure();
    if (line.approvalId) {
      const rawApproval = await db.table('purchaseApprovals').get(line.approvalId);
      if (!rawApproval) throw referenceFailure();
      const approval = purchaseApprovalSchema.parse(rawApproval);
      if (!approvalMatchesLine(approval, line) || line.status !== approval.decision.status) throw referenceFailure();
    }
  }
  for (const raw of await db.table('purchaseApprovals').toArray()) {
    const approval = purchaseApprovalSchema.parse(raw), draft = await db.table('purchaseDrafts').get(approval.draftId);
    const line = await db.table('purchaseLines').get(approval.lineId);
    if (!draft || !line || line.draftId !== approval.draftId || await historicalEmployee(db, approval.requestedBy) !== draft.employeeId) throw referenceFailure();
    if (!await db.khungGiaThuMua.get(approval.bracket.id)) throw referenceFailure();
    if (approval.decision.status !== 'pending') {
      // Historical actor remains an identity; do not require they stay active.
      if (!await historicalEmployee(db, approval.decision.actor)) throw referenceFailure();
    }
  }
  for (const raw of await db.table('purchaseNotices').toArray()) {
    const notice = purchaseNoticeSchema.parse(raw), approval = await db.table('purchaseApprovals').get(notice.approvalId);
    if (!approval || approval.requestedBy !== notice.recipient || approval.decision.status === 'pending' || !await historicalEmployee(db, notice.recipient)) throw referenceFailure();
  }
  for (const raw of await db.table('purchaseFinalizations').toArray()) {
    const finalized = purchaseFinalizationSchema.parse(raw), invoice = await db.hoaDonThuMua.get(finalized.invoiceId);
    const draft = await db.table('purchaseDrafts').get(finalized.draftId);
    if (!invoice || invoice.TongTienTM !== finalized.subtotal || !draft || draft.status !== 'finalized' || draft.invoiceId !== invoice.MaHDTM || draft.customerId !== invoice.MaKH || draft.employeeId !== invoice.MaNV) throw referenceFailure();
    for (const line of finalized.lines) {
      const stored = await db.table('purchaseLines').get(line.id);
      if (!stored || canonical(stored) !== canonical(line)) throw referenceFailure();
    }
  }
  const counts = new Map<string, number>();
  for (const raw of await db.table('purchaseProvenance').toArray()) {
    const origin = purchaseProvenanceSchema.parse(raw), product = await db.sanPham.get(origin.productId);
    const finalized = await db.table('purchaseFinalizations').get(origin.invoiceId);
    const line = finalized?.lines.find((item: { id: string }) => item.id === origin.lineId);
    const cost = await db.productCosts.get(origin.productId);
    if (!product || product.MaHDTM !== origin.invoiceId || !line || line.bracket.id !== product.MaKhungGia || line.unitCost !== origin.unitCost || !cost || cost.unitCost !== origin.unitCost || cost.MaHDTM !== origin.invoiceId || cost.MaKhungGia !== line.bracket.id) throw referenceFailure();
    const count = (counts.get(origin.lineId) ?? 0) + 1; counts.set(origin.lineId, count);
    if (count > line.quantity) throw referenceFailure();
  }
  for (const finalized of await db.table('purchaseFinalizations').toArray()) {
    for (const line of finalized.lines) if (counts.get(line.id) !== line.quantity) throw referenceFailure();
  }
}

/** Select a new-format FK only with a complete, validated explicit marker. */
export async function resolveCandidatePurchaseDetail(db: CoCoDatabase, product: RecordMap['sanPham']): Promise<boolean> {
  const rawOrigin = await db.table('purchaseProvenance').get(product.MaSP);
  const rawSnapshot = await db.table('purchaseFinalizations').get(product.MaHDTM);
  if (!rawOrigin && !rawSnapshot) return false;
  if (!rawOrigin || !rawSnapshot) throw referenceFailure();
  const origin = purchaseProvenanceSchema.parse(rawOrigin), finalized = purchaseFinalizationSchema.parse(rawSnapshot);
  const line = finalized.lines.find(item => item.id === origin.lineId);
  if (origin.productId !== product.MaSP || origin.invoiceId !== product.MaHDTM || !line || line.bracket.id !== product.MaKhungGia || line.unitCost !== origin.unitCost) throw referenceFailure();
  return true;
}
