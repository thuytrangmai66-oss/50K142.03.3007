import type { CoCoDatabase } from '../db/schema';
import { AuthService } from './auth/service';
import { AuthError } from './auth/errors';
import { randomHex, sha256 } from './auth/crypto';
import { RepositoryError, validateReferences } from '../repositories/constraints';
import { requireCandidate, canonical, historicalEmployee, validateCandidatePurchaseReferences } from '../repositories/purchase-links';
import { calendarDate } from '../domain/records';
import {
  purchaseDraftSchema, purchaseLineSchema, purchaseApprovalSchema, purchaseNoticeSchema,
  approvalMatchesLine,
  type PurchaseApproval, type PurchaseLine,
} from '../domain/purchases';
import { paginate } from '../domain/pagination';

export interface ApprovalFilters { status: 'pending' | 'decided' | 'all'; draftId: string; employeeName?: string; sentOn?: string }

/** A pending request item for the owner's review list (UI28). */
export interface ApprovalListItem {
  approvalId: string;
  draftId: string;
  lineId: string;
  requestedBy: string;
  employeeName: string;
  requestedAt: string;
  bracket: PurchaseApproval['bracket'];
  quantity: number;
  unitCost: number;
  decision: PurchaseApproval['decision'];
  /** Current approval revision for CAS. */
  approvalRevision: number;
  /** Active line still linked to an editing draft and not removed. */
  eligible: boolean;
}

export interface DecideCommand {
  operationId: string;
  approvalId: string;
  expectedRevision: number;
  action: 'approve' | 'reject';
  /** Required when action === 'reject'. */
  reason?: string;
}

export class ApprovalInputError extends Error {
  constructor(message: string, public readonly fields: Record<string, string> = {}) { super(message); }
}

/** T03: owner-only approve/reject service with atomic decision + persistent notice.
 *  Activation requires the G6 candidate database (v4).
 *  T04 delivery and T05 finalization remain in their own dependent tasks.
 */
export class PurchaseApprovalService {
  private readonly auth: AuthService;
  constructor(private readonly db: CoCoDatabase, private readonly token: () => string | null) {
    requireCandidate(db);
    this.auth = new AuthService(db);
  }

  /** List all approval requests visible to the owner, filtered and paginated (UI28). */
  async listRequests(filters: ApprovalFilters, page: number, pageSize?: number) {
    if (filters.sentOn && !calendarDate.safeParse(filters.sentOn).success) throw new ApprovalInputError('Ngày gửi không hợp lệ');
    return this.auth.readAuthorized(this.token() ?? '', 'approvals.read', async () => {
      const rawApprovals: unknown[] = await this.db.table('purchaseApprovals').toArray();
      const rawDrafts: unknown[] = await this.db.table('purchaseDrafts').toArray();
      const rawLines: unknown[] = await this.db.table('purchaseLines').toArray();

      const draftMap = new Map(rawDrafts.map(d => { const draft = purchaseDraftSchema.parse(d); return [draft.id, draft]; }));
      const lineMap = new Map(rawLines.map(l => { const line = purchaseLineSchema.parse(l); return [line.id, line]; }));

      const items: ApprovalListItem[] = await Promise.all(rawApprovals.map(async raw => {
        const approval = purchaseApprovalSchema.parse(raw);
        const draft = draftMap.get(approval.draftId);
        const line = lineMap.get(approval.lineId);
        // A request is eligible only if the draft is still editing and
        // the exact line revision still exists and has not been removed.
        const eligible = Boolean(approval.decision.status === 'pending' && draft && draft.status === 'editing' && line && line.status === 'pending' && !line.removedAt &&
          approvalMatchesLine(approval, line));
        const employeeId = await historicalEmployee(this.db, approval.requestedBy);
        const employeeName = employeeId ? (await this.db.nhanVien.get(employeeId))?.HoTen ?? approval.requestedBy : approval.requestedBy;
        return { approvalId: approval.id, approvalRevision: approval.revision, draftId: approval.draftId, lineId: approval.lineId, requestedBy: approval.requestedBy, employeeName, requestedAt: approval.requestedAt, bracket: approval.bracket, quantity: approval.quantity, unitCost: approval.unitCost, decision: approval.decision, eligible };
      }));

      let filtered = items;
      if (filters.status === 'pending') filtered = items.filter(item => item.decision.status === 'pending');
      else if (filters.status === 'decided') filtered = items.filter(item => item.decision.status !== 'pending');
      if (filters.draftId.trim()) filtered = filtered.filter(item => item.draftId.toLocaleLowerCase('vi').includes(filters.draftId.trim().toLocaleLowerCase('vi')));
      if (filters.employeeName?.trim()) filtered = filtered.filter(item => item.employeeName.toLocaleLowerCase('vi').includes(filters.employeeName!.trim().toLocaleLowerCase('vi')));
      if (filters.sentOn) filtered = filtered.filter(item => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(item.requestedAt)) === filters.sentOn);

      // Newest requests first; pending before decided within the same timestamp.
      filtered.sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt) || a.approvalId.localeCompare(b.approvalId));
      return paginate(filtered, page, pageSize);
    });
  }

  /** Load a single approval with its draft and line snapshot for the detail view (UI29). */
  async loadRequest(approvalId: string): Promise<ApprovalListItem & { draft: ReturnType<typeof purchaseDraftSchema.parse> | undefined; line: PurchaseLine | undefined }> {
    return this.auth.readAuthorized(this.token() ?? '', 'approvals.read', async () => {
      const raw = await this.db.table('purchaseApprovals').get(approvalId);
      if (!raw) throw new ApprovalInputError('Không tìm thấy yêu cầu phê duyệt');
      const approval = purchaseApprovalSchema.parse(raw);
      const rawDraft = await this.db.table('purchaseDrafts').get(approval.draftId);
      const rawLine = await this.db.table('purchaseLines').get(approval.lineId);
      const draft = rawDraft ? purchaseDraftSchema.parse(rawDraft) : undefined;
      const line = rawLine ? purchaseLineSchema.parse(rawLine) : undefined;
      const eligible = Boolean(approval.decision.status === 'pending' && draft && draft.status === 'editing' && line && line.status === 'pending' && !line.removedAt && approvalMatchesLine(approval, line));
      const employeeId = await historicalEmployee(this.db, approval.requestedBy);
      const employeeName = employeeId ? (await this.db.nhanVien.get(employeeId))?.HoTen ?? approval.requestedBy : approval.requestedBy;
      return { approvalId: approval.id, approvalRevision: approval.revision, draftId: approval.draftId, lineId: approval.lineId, requestedBy: approval.requestedBy, employeeName, requestedAt: approval.requestedAt, bracket: approval.bracket, quantity: approval.quantity, unitCost: approval.unitCost, decision: approval.decision, eligible, draft, line };
    });
  }

  /**
   * T03 — owner decides a pending approval request.
   *
   * Atomic transaction (rw all tables):
   * 1. Fresh session + approvals.decide permission guard.
   * 2. Operation receipt deduplication (fingerprint of the full command).
   * 3. CAS: approval.revision === command.expectedRevision && decision.status === 'pending'.
   * 4. Write approval (with decision actor/decidedAt/reason), update line status.
   * 5. Write a persistent purchaseNotices record (delivery: 'pending') for T04.
   * 6. Write audit + operation receipt.
   * 7. Cross-validate candidate references.
   *
   * Error semantics (per PLAN_PHASE_6 §6 and UC6 steps 7a/9a):
   * - If (3) fails → 'CONFLICT' (stale): the owner must refresh and retry.
   * - If (1) or (4–7) fail mid-write → transaction rollback; decision NOT stored.
   * - Lỗi phát thông báo after commit is T04's concern; T03 only persists the notice record.
   */
  async decide(input: DecideCommand): Promise<{ duplicate: boolean }> {
    if (typeof input.operationId !== 'string' || !input.operationId.trim() || input.operationId.length > 150) throw new ApprovalInputError('Mã thao tác không hợp lệ');
    if (!['approve', 'reject'].includes(input.action)) throw new ApprovalInputError('Quyết định không hợp lệ');
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) throw new ApprovalInputError('Phiên bản yêu cầu không hợp lệ');
    if (input.action === 'reject') {
      const reason = input.reason?.trim() ?? '';
      if (!reason) throw new ApprovalInputError('Hãy nhập lý do từ chối', { reason: 'Hãy nhập lý do từ chối' });
      if (reason.length > 100) throw new ApprovalInputError('Lý do từ chối tối đa 100 ký tự', { reason: 'Lý do từ chối tối đa 100 ký tự' });
    }

    const fingerprint = await sha256(canonical({ operationId: input.operationId, approvalId: input.approvalId, expectedRevision: input.expectedRevision, action: input.action, reason: input.reason ?? '' }));
    const guard = await this.auth.prepareTransactionGuard(this.token() ?? '', 'approvals.decide');
    const operationId = `g6-approval:${input.operationId}`;

    return this.db.transaction('rw', this.db.tables, async () => {
      const actor = await guard();

      // --- Idempotency receipt ---
      const receipt = await this.db.operations.get(operationId);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new RepositoryError('OPERATION_REUSED', 'Operation payload changed');
        return { duplicate: true };
      }

      // --- Load and CAS-lock the approval ---
      const rawApproval = await this.db.table('purchaseApprovals').get(input.approvalId);
      if (!rawApproval) throw new ApprovalInputError('Không tìm thấy yêu cầu phê duyệt');
      const approval = purchaseApprovalSchema.parse(rawApproval);

      // CAS guard: same semantics as assertPendingDecision but throws RepositoryError for consistent code.
      if (actor.role !== 'owner') throw new AuthError('FORBIDDEN');
      if (approval.revision !== input.expectedRevision || approval.decision.status !== 'pending')
        throw new RepositoryError('CONFLICT', 'Yêu cầu không còn ở trạng thái chờ hoặc đã được xử lý ở revision này');

      // --- Load active draft and line; guard stale ---
      const rawDraft = await this.db.table('purchaseDrafts').get(approval.draftId);
      if (!rawDraft) throw new RepositoryError('CONFLICT', 'Giao dịch không còn tồn tại');
      const draft = purchaseDraftSchema.parse(rawDraft);
      if (draft.status !== 'editing') throw new RepositoryError('CONFLICT', 'Giao dịch không còn ở trạng thái đang tạo');

      const rawLine = await this.db.table('purchaseLines').get(approval.lineId);
      if (!rawLine) throw new RepositoryError('CONFLICT', 'Dòng sản phẩm không còn tồn tại');
      const line = purchaseLineSchema.parse(rawLine);

      // T03 must skip requests whose line has been removed or whose revision has changed.
      // SC135/SC142: "Request no longer eligible."
      if (line.removedAt || line.status !== 'pending' || !approvalMatchesLine(approval, line)) {
        throw new RepositoryError('CONFLICT', 'Yêu cầu không còn đủ điều kiện xử lý (dòng đã bị xóa hoặc thay đổi)');
      }

      const now = new Date().toISOString();
      const newStatus = input.action === 'approve' ? 'approved' : 'rejected';

      // --- Build updated approval with decision snapshot ---
      const updatedApproval: PurchaseApproval = {
        ...approval,
        revision: approval.revision + 1,
        decision: input.action === 'approve'
          ? { status: 'approved', actor: actor.username, decidedAt: now }
          : { status: 'rejected', actor: actor.username, decidedAt: now, reason: input.reason!.trim() },
      };

      // --- Build updated line mirroring the new status ---
      const updatedLine: PurchaseLine = { ...line, status: newStatus };

      // --- Persistent notice record (delivery channel for T04) ---
      const noticeId = `N${randomHex(4)}-${input.operationId.slice(0, 8)}`;
      const notice = {
        id: noticeId,
        approvalId: approval.id,
        recipient: approval.requestedBy,
        createdAt: now,
        delivery: 'pending' as const,
      };
      purchaseNoticeSchema.parse(notice); // validate before writing

      // --- Atomic writes ---
      await this.db.table('purchaseApprovals').put(updatedApproval);
      await this.db.table('purchaseLines').put(updatedLine);
      await this.db.table('purchaseNotices').add(notice);
      await validateReferences(this.db);
      await validateCandidatePurchaseReferences(this.db);
      await this.db.operations.add({ id: operationId, fingerprint, executedAt: now });
      await this.db.auditEntries.add({
        id: operationId,
        actor: actor.username,
        executedAt: now,
        changed: [`purchaseApprovals:${approval.id}`, `purchaseLines:${line.id}`, `purchaseNotices:${noticeId}`],
      });

      return { duplicate: false };
    });
  }

  /** Signal an already committed decision. Durable notices remain pending until
   * the T04 recipient acknowledges delivery. Reopening may publish again. */
  async publishDecision(approvalId: string): Promise<void> {
    const request = await this.loadRequest(approvalId);
    if (request.decision.status === 'pending') return;
    const channel = new BroadcastChannel('coco:purchase-approvals');
    try { channel.postMessage({ approvalId, revision: request.approvalRevision }); }
    finally { channel.close(); }
  }
}
