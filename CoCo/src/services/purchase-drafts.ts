import type { CoCoDatabase } from '../db/schema';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { randomHex, sha256 } from './auth/crypto';
import { CandidatePurchaseTransactions, type CandidateDraftCommand } from './purchase-candidate';
import { canonical, historicalEmployee, validateCandidatePurchaseReferences } from '../repositories/purchase-links';
import { RepositoryError, validateReferences } from '../repositories/constraints';
import { conditionMetadataKey, CONDITION_CATALOG_VERSION } from '../domain/conditions';
import { PURCHASE_FORMAT, bracketSnapshotSchema, purchaseDraftSchema, purchaseNoticeSchema, purchaseApprovalSchema, purchaseLineSchema, approvalMatchesLine, purchaseSubtotal, type PurchaseDraft, type PurchaseLine, type PurchaseApproval } from '../domain/purchases';
import { queryPurchases, purchaseInvoice, type PurchaseFilters } from './purchase-queries';
export type { PurchaseFilters } from './purchase-queries';




export interface DraftBundle { draft: PurchaseDraft; lines: PurchaseLine[]; approvals: PurchaseApproval[] }
export type PurchaseBracket = ReturnType<typeof bracketSnapshotSchema.parse>;
export class PurchaseInputError extends Error {
  constructor(message: string, public readonly fields: Record<string, string> = {}) { super(message); }
}
export class PurchaseDraftService {
  private readonly auth: AuthService;
  private readonly transactions: CandidatePurchaseTransactions;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null) {
    this.auth = new AuthService(db); this.transactions = new CandidatePurchaseTransactions(db, token);
  }
  async listTransactions(filters: PurchaseFilters, page: number, pageSize?: number) {
    return this.auth.readAuthorized(this.token() ?? '', 'purchases.read', () => queryPurchases(this.db, filters, page, pageSize));
  }
  transaction(invoiceId: string) {
    return this.auth.readAuthorized(this.token() ?? '', 'purchases.read', () => purchaseInvoice(this.db, invoiceId));
  }
  prepareDraft(): Promise<DraftBundle> {
    return this.auth.readAuthorized(this.token() ?? '', 'purchases.create', async actor => {
      const now = new Date().toISOString();
      return { draft: { id: `D${randomHex(4)}`, format: PURCHASE_FORMAT, employeeId: actor.employeeId, createdBy: actor.username, status: 'editing', revision: 0, createdAt: now, updatedAt: now }, lines: [], approvals: [] };
    });
  }
  load(id: string): Promise<DraftBundle> {
    return this.auth.readAuthorized(this.token() ?? '', 'purchases.create', async actor => {
      const raw = await this.db.table('purchaseDrafts').get(id);
      if (!raw) throw new PurchaseInputError('Không tìm thấy giao dịch đang tạo');
      const draft = purchaseDraftSchema.parse(raw);
      if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      const lines: PurchaseLine[] = await this.db.table('purchaseLines').where('draftId').equals(id).toArray();
      lines.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id.localeCompare(b.id));
      return { draft, lines, approvals: await this.db.table('purchaseApprovals').where('draftId').equals(id).toArray() };
    });
  }
  catalog(): Promise<PurchaseBracket[]> {
    return this.auth.readAuthorized(this.token() ?? '', 'purchases.create', async () => {
      const result: PurchaseBracket[] = [];
      for (const row of await this.db.khungGiaThuMua.toArray()) {
        if ((await this.db.appMetadata.get(conditionMetadataKey(row.MaKhungGia)))?.value !== CONDITION_CATALOG_VERSION) continue;
        const revision = (await this.db.recordVersions.get(JSON.stringify(['khungGiaThuMua', row.MaKhungGia])))?.version;
        const parsed = bracketSnapshotSchema.safeParse({ id: row.MaKhungGia, revision, type: row.LoaiSanPham, brand: row.ThuongHieu, condition: row.TinhTrang, min: row.GiaMin, max: row.GiaMax });
        if (parsed.success) result.push(parsed.data);
      }
      return result;
    });
  }
  async findBracket(input: { type: string; brand: string; condition: string; quantity: string }) {
    const fields: Record<string, string> = {};
    for (const key of ['type', 'brand', 'condition', 'quantity'] as const) if (!input[key].trim()) fields[key] = 'Hãy điền đầy đủ thông tin';
    if (input.quantity.trim() && (!/^\d+$/.test(input.quantity) || Number(input.quantity) < 1 || Number(input.quantity) > 2147483647)) fields.quantity = 'Số lượng phải là số nguyên lớn hơn 0';
    if (Object.keys(fields).length) throw new PurchaseInputError('Hãy điền đầy đủ thông tin', fields);
    const bracket = (await this.catalog()).find(row => row.type.toLocaleLowerCase('vi') === input.type.trim().toLocaleLowerCase('vi') && row.brand.toLocaleLowerCase('vi') === input.brand.trim().toLocaleLowerCase('vi') && row.condition === Number(input.condition));
    if (!bracket) throw new PurchaseInputError('Không tìm thấy khung giá thu mua phù hợp');
    return { bracket, quantity: Number(input.quantity) };
  }
  async prepareAdd(bundle: DraftBundle, bracket: PurchaseBracket, quantity: number, price: string): Promise<CandidateDraftCommand> {
    if (!/^\d+$/.test(price) || !Number.isSafeInteger(Number(price)) || Number(price) <= 0) throw new PurchaseInputError('Hãy nhập lại giá thu mua', { price: 'Hãy nhập lại giá thu mua' });
    return this.auth.readAuthorized(this.token() ?? '', 'purchases.create', async actor => {
      if (bundle.draft.employeeId !== actor.employeeId || bundle.draft.status !== 'editing') throw new AuthError('FORBIDDEN');
      const now = new Date().toISOString(), unitCost = Number(price), aboveMax = unitCost > bracket.max;
      const approvalId = aboveMax ? `Y${randomHex(4)}` : undefined;
      const line: PurchaseLine = { id: crypto.randomUUID(), draftId: bundle.draft.id, revision: 1, position: Math.max(0, ...bundle.lines.map(item => item.position ?? 0)) + 1, bracket, quantity, unitCost, status: aboveMax ? 'pending' : 'priced', ...(approvalId ? { approvalId } : {}) };
      const approvals = [...bundle.approvals];
      if (approvalId) approvals.push({ id: approvalId, draftId: bundle.draft.id, lineId: line.id, lineRevision: 1, revision: 1, requestedBy: actor.username, requestedAt: now, bracket, quantity, unitCost, decision: { status: 'pending' } });
      return { operationId: crypto.randomUUID(), expectedRevision: bundle.draft.revision, draft: { ...bundle.draft, revision: bundle.draft.revision + 1, updatedAt: now }, lines: [...bundle.lines, line], approvals };
    });
  }
  commit(command: CandidateDraftCommand) { return this.transactions.saveEditingDraft(command); }
  async pendingResults(draftId: string) {
    return this.auth.readAuthorized(this.token() ?? '', 'purchases.create', async actor => {
      const draft = await this.db.table('purchaseDrafts').get(draftId);
      if (!draft || draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      if (draft.status !== 'editing') return [];
      const results = [];
      for (const raw of await this.db.table('purchaseNotices').toArray()) {
        const notice = purchaseNoticeSchema.parse(raw);
        if (notice.readAt || await historicalEmployee(this.db, notice.recipient) !== actor.employeeId) continue;
        const approval = purchaseApprovalSchema.parse(await this.db.table('purchaseApprovals').get(notice.approvalId));
        const line = await this.db.table('purchaseLines').get(approval.lineId);
        if (approval.draftId === draftId && approval.decision.status !== 'pending' && line && !line.removedAt && approvalMatchesLine(approval, line)) results.push({ notice, approval });
      }
      return results.sort((a, b) => a.notice.createdAt.localeCompare(b.notice.createdAt) || a.notice.id.localeCompare(b.notice.id));
    });
  }
  async acknowledgeResult(noticeId: string) {
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'purchases.create');
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard();
      const notice = purchaseNoticeSchema.parse(await this.db.table('purchaseNotices').get(noticeId));
      if (await historicalEmployee(this.db, notice.recipient) !== actor.employeeId) throw new AuthError('FORBIDDEN');
      if (notice.readAt) return;
      const now = new Date().toISOString();
      await this.db.table('purchaseNotices').put({ ...notice, delivery: 'delivered', deliveredAt: notice.deliveredAt ?? now, readAt: now });
      await validateCandidatePurchaseReferences(this.db);
      await this.db.auditEntries.add({ id: `purchase-result:${noticeId}`, actor: actor.username, executedAt: now, changed: [`purchaseNotices:${noticeId}`] });
    });
  }
  async reviseRejected(bundle: DraftBundle, lineId: string, price: string, operationId: string, bracketRevision = bundle.lines.find(line => line.id === lineId)?.bracket.revision) {
    if (typeof operationId !== 'string' || !operationId.trim() || operationId.length > 150) throw new PurchaseInputError('Mã thao tác không hợp lệ');
    if (!/^\d+$/.test(price) || !Number.isSafeInteger(Number(price)) || Number(price) <= 0) throw new PurchaseInputError('Hãy nhập lại giá thu mua', { price: 'Hãy nhập lại giá thu mua' });
    const fingerprint = await sha256(canonical({ draftId: bundle.draft.id, expectedRevision: bundle.draft.revision, lineId, price, bracketRevision }));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'purchases.create');
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard(), receiptId = `purchase-reprice:${operationId}`;
      const draft = purchaseDraftSchema.parse(await this.db.table('purchaseDrafts').get(bundle.draft.id));
      if (draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      const receipt = await this.db.operations.get(receiptId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Operation payload changed');
        return;
      }
      const line = purchaseLineSchema.parse(await this.db.table('purchaseLines').get(lineId));
      if (draft.status !== 'editing' || draft.revision !== bundle.draft.revision || line.draftId !== draft.id || line.removedAt || line.status !== 'rejected' || !line.approvalId) throw new RepositoryError('CONFLICT', 'Dòng sản phẩm không còn đủ điều kiện nhập lại giá');
      const oldApproval = purchaseApprovalSchema.parse(await this.db.table('purchaseApprovals').get(line.approvalId));
      if (oldApproval.decision.status !== 'rejected' || !approvalMatchesLine(oldApproval, line)) throw new RepositoryError('CONFLICT', 'Snapshot yêu cầu đã thay đổi');
      const bracketRow = await this.db.khungGiaThuMua.get(line.bracket.id);
      const bracketVersion = await this.db.recordVersions.get(JSON.stringify(['khungGiaThuMua', line.bracket.id]));
      if (!bracketRow || bracketVersion?.version !== bracketRevision || bracketRow.LoaiSanPham !== line.bracket.type || bracketRow.ThuongHieu !== line.bracket.brand || bracketRow.TinhTrang !== line.bracket.condition || (await this.db.appMetadata.get(conditionMetadataKey(line.bracket.id)))?.value !== CONDITION_CATALOG_VERSION) throw new RepositoryError('CONFLICT', 'Khung giá đã thay đổi, cần đối chiếu lại');
      const bracket = bracketSnapshotSchema.parse({ id: bracketRow.MaKhungGia, revision: bracketRevision, type: bracketRow.LoaiSanPham, brand: bracketRow.ThuongHieu, condition: bracketRow.TinhTrang, min: bracketRow.GiaMin, max: bracketRow.GiaMax });
      const now = new Date().toISOString(), unitCost = Number(price), approvalId = unitCost > bracket.max ? `Y${randomHex(4)}` : undefined;
      const updated = purchaseLineSchema.parse({ ...line, bracket, revision: line.revision + 1, unitCost, status: approvalId ? 'pending' : 'priced', approvalId });
      const lines = await this.db.table('purchaseLines').where('draftId').equals(draft.id).toArray();
      purchaseSubtotal(lines.map(item => item.id === lineId ? updated : item));
      await this.db.table('purchaseLines').put(updated);
      if (approvalId) await this.db.table('purchaseApprovals').add(purchaseApprovalSchema.parse({ id: approvalId, draftId: draft.id, lineId, lineRevision: updated.revision, revision: 1, requestedBy: actor.username, requestedAt: now, bracket: updated.bracket, quantity: updated.quantity, unitCost, decision: { status: 'pending' } }));
      await this.db.table('purchaseDrafts').put({ ...draft, revision: draft.revision + 1, updatedAt: now });
      await validateReferences(this.db);
      await validateCandidatePurchaseReferences(this.db);
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt: now });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt: now, changed: [`purchaseDrafts:${draft.id}`, `purchaseLines:${lineId}`, ...(approvalId ? [`purchaseApprovals:${approvalId}`] : [])] });
    });
  }
  async removeOrCancel(bundle: DraftBundle, operationId: string, lineId?: string) {
    const expected = bundle.draft.revision, id = bundle.draft.id;
    if (expected === 0) return;
    const fingerprint = await sha256(canonical({ id, expected, lineId }));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'purchases.create');
    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard(), draft = await this.db.table('purchaseDrafts').get(id), receiptId = `purchase-edit:${operationId}`;
      if (!draft || draft.employeeId !== actor.employeeId) throw new AuthError('FORBIDDEN');
      const receipt = await this.db.operations.get(receiptId);
      if (receipt) { if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Operation changed'); return; }
      if (draft.revision !== expected || draft.status !== 'editing') throw new RepositoryError('CONFLICT', 'Dữ liệu đã thay đổi ở tab khác. Vui lòng tải lại.');
      const now = new Date().toISOString();
      if (lineId) {
        const line = await this.db.table('purchaseLines').get(lineId);
        if (!line || line.draftId !== id || line.removedAt) throw new RepositoryError('CONFLICT', 'Dòng không còn trong giao dịch');
        // Preserve request snapshot/history; T03 only processes active editing lines.
        await this.db.table('purchaseLines').put({ ...line, removedAt: now });
      }
      await this.db.table('purchaseDrafts').put({ ...draft, revision: expected + 1, updatedAt: now, status: lineId ? 'editing' : 'cancelled' });
      await validateReferences(this.db);
      await this.db.operations.add({ id: receiptId, fingerprint, executedAt: now });
      await this.db.auditEntries.add({ id: receiptId, actor: actor.username, executedAt: now, changed: [`purchaseDrafts:${id}`, ...(lineId ? [`purchaseLines:${lineId}`] : [])] });
    });
  }
}

