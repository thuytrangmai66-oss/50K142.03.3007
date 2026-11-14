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
  // One transaction snapshot, bulk reads instead of repeated native IDB round trips.
  // Keep every existing FK/snapshot/cardinality check below unchanged.
  const [drafts, lines, approvals, notices, finalizations, origins, products, costs, invoices, employees, customers, brackets, accounts, metadata] = await Promise.all([
    db.table('purchaseDrafts').toArray(), db.table('purchaseLines').toArray(), db.table('purchaseApprovals').toArray(),
    db.table('purchaseNotices').toArray(), db.table('purchaseFinalizations').toArray(), db.table('purchaseProvenance').toArray(),
    db.sanPham.toArray(), db.productCosts.toArray(), db.hoaDonThuMua.toArray(), db.nhanVien.toArray(), db.khachHang.toArray(),
    db.khungGiaThuMua.toArray(), db.taiKhoan.toArray(), db.appMetadata.toArray(),
  ]);
  const draftById = new Map(drafts.map(row => [row.id, row])), lineById = new Map(lines.map(row => [row.id, row]));
  const approvalById = new Map(approvals.map(row => [row.id, row])), finalById = new Map(finalizations.map(row => [row.invoiceId, row]));
  const productById = new Map(products.map(row => [row.MaSP, row])), costById = new Map(costs.map(row => [row.MaSP, row]));
  const invoiceById = new Map(invoices.map(row => [row.MaHDTM, row])), employeeById = new Map(employees.map(row => [row.MaNV, row]));
  const customerById = new Map(customers.map(row => [row.MaKH, row])), bracketById = new Map(brackets.map(row => [row.MaKhungGia, row]));
  const accountById = new Map(accounts.map(row => [row.TenDangNhap, row])), metadataById = new Map(metadata.map(row => [row.key, row.value]));
  const employeeFor = (username: string) => accountById.get(username)?.MaNV ?? metadataById.get(`account-identity:${username}`);
  for (const raw of drafts) {
    const draft = purchaseDraftSchema.parse(raw);
    if (employeeFor(draft.createdBy) !== draft.employeeId || !employeeById.get(draft.employeeId)) throw referenceFailure();
    if (draft.customerId && !customerById.get(draft.customerId)) throw referenceFailure();
    if (draft.invoiceId && !invoiceById.get(draft.invoiceId)) throw referenceFailure();
  }
  for (const raw of lines) {
    const line = purchaseLineSchema.parse(raw);
    if (!draftById.get(line.draftId) || !bracketById.get(line.bracket.id)) throw referenceFailure();
    if (line.approvalId) {
      const rawApproval = approvalById.get(line.approvalId);
      if (!rawApproval) throw referenceFailure();
      const approval = purchaseApprovalSchema.parse(rawApproval);
      if (!approvalMatchesLine(approval, line) || line.status !== approval.decision.status) throw referenceFailure();
    }
  }
  for (const raw of approvals) {
    const approval = purchaseApprovalSchema.parse(raw), draft = draftById.get(approval.draftId);
    const line = lineById.get(approval.lineId);
    if (!draft || !line || line.draftId !== approval.draftId || employeeFor(approval.requestedBy) !== draft.employeeId) throw referenceFailure();
    if (!bracketById.get(approval.bracket.id)) throw referenceFailure();
    if (approval.decision.status !== 'pending') {
      // Historical actor remains an identity; do not require they stay active.
      if (!employeeFor(approval.decision.actor)) throw referenceFailure();
    }
  }
  for (const raw of notices) {
    const notice = purchaseNoticeSchema.parse(raw), approval = approvalById.get(notice.approvalId);
    if (!approval || approval.requestedBy !== notice.recipient || approval.decision.status === 'pending' || !employeeFor(notice.recipient)) throw referenceFailure();
  }
  for (const raw of finalizations) {
    const finalized = purchaseFinalizationSchema.parse(raw), invoice = invoiceById.get(finalized.invoiceId);
    const draft = draftById.get(finalized.draftId);
    if (!invoice || invoice.TongTienTM !== finalized.subtotal || !draft || draft.status !== 'finalized' || draft.invoiceId !== invoice.MaHDTM || draft.customerId !== invoice.MaKH || draft.employeeId !== invoice.MaNV) throw referenceFailure();
    for (const line of finalized.lines) {
      const stored = lineById.get(line.id);
      if (!stored || canonical(stored) !== canonical(line)) throw referenceFailure();
    }
  }
  const counts = new Map<string, number>();
  for (const raw of origins) {
    const origin = purchaseProvenanceSchema.parse(raw), product = productById.get(origin.productId);
    const finalized = finalById.get(origin.invoiceId);
    const line = finalized?.lines.find((item: { id: string }) => item.id === origin.lineId);
    const cost = costById.get(origin.productId);
    if (!product || product.MaHDTM !== origin.invoiceId || !line || line.bracket.id !== product.MaKhungGia || line.unitCost !== origin.unitCost || !cost || cost.unitCost !== origin.unitCost || cost.MaHDTM !== origin.invoiceId || cost.MaKhungGia !== line.bracket.id) throw referenceFailure();
    const count = (counts.get(origin.lineId) ?? 0) + 1; counts.set(origin.lineId, count);
    if (count > line.quantity) throw referenceFailure();
  }
  for (const finalized of finalizations) {
    for (const line of finalized.lines) if (counts.get(line.id) !== line.quantity) throw referenceFailure();
  }
}

export interface PurchaseReferenceSnapshot {
  origins: ReadonlyMap<string, unknown>;
  finalizations: ReadonlyMap<string, unknown>;
}
/** Select a new-format FK only with a complete, validated explicit marker. */
export async function resolveCandidatePurchaseDetail(db: CoCoDatabase, product: RecordMap['sanPham']): Promise<boolean> {
  const rawOrigin = await db.table('purchaseProvenance').get(product.MaSP);
  const rawSnapshot = await db.table('purchaseFinalizations').get(product.MaHDTM);
  return checkCandidatePurchaseDetail(product, rawOrigin, rawSnapshot);
}
/** Pure joins must stay synchronous inside an IndexedDB transaction: awaiting
 * an already-resolved native promise per row can exhaust Dexie's microtick
 * scope and let Chromium commit before the final receipt/audit writes.
 */
export function resolveCandidatePurchaseDetailSnapshot(product: RecordMap['sanPham'], snapshot: PurchaseReferenceSnapshot): boolean {
  return checkCandidatePurchaseDetail(product, snapshot.origins.get(product.MaSP), snapshot.finalizations.get(product.MaHDTM));
}
function checkCandidatePurchaseDetail(product: RecordMap['sanPham'], rawOrigin: unknown, rawSnapshot: unknown): boolean {
  if (!rawOrigin && !rawSnapshot) return false;
  if (!rawOrigin || !rawSnapshot) throw referenceFailure();
  const origin = purchaseProvenanceSchema.parse(rawOrigin), finalized = purchaseFinalizationSchema.parse(rawSnapshot);
  const line = finalized.lines.find(item => item.id === origin.lineId);
  if (origin.productId !== product.MaSP || origin.invoiceId !== product.MaHDTM || !line || line.bracket.id !== product.MaKhungGia || line.unitCost !== origin.unitCost) throw referenceFailure();
  return true;
}
