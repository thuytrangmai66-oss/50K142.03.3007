import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseApprovalService } from '../../src/services/purchase-approvals';
import { purchaseApprovalSchema } from '../../src/domain/purchases';

let db: CoCoDatabase;
let auth: AuthService;
let ownerToken: string;
let staffToken: string;
let draftService: PurchaseDraftService;
let approvalService: PurchaseApprovalService;

beforeEach(async () => {
  db = new CoCoDatabase('T03ApprovalServiceTests');
  auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'approval-test!', fullName: 'Chủ', phone: '0900000001' });
  ownerToken = (await auth.login('owner', 'approval-test!')).token;
  draftService = new PurchaseDraftService(db, () => ownerToken);
  approvalService = new PurchaseApprovalService(db, () => ownerToken);
  await new LocalReferenceData(db, () => ownerToken).createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
  // Create a staff account for testing role restrictions.
  const staffSvc = (await import('../../src/services/staff-accounts')).StaffAccountsService;
  const staffAccounts = new staffSvc(db, () => ownerToken);
  await staffAccounts.create({ name: 'Nhân Viên', phone: '0900000002', username: 'staff01', password: 'staff-pass!' });
  staffToken = (await auth.login('staff01', 'staff-pass!')).token;
});

afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

describe('T04 recipient results and rejected-price revision', () => {
  it('continues adding products and selecting a customer after a superseded rejection and second approval', async () => {
    const { approvalId, approval, draftId } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'Giá cao' });
    const historical = await db.table('purchaseApprovals').get(approvalId);
    await draftService.reviseRejected(await draftService.load(draftId), approval.lineId, '130000', crypto.randomUUID());
    const revised = await draftService.load(draftId), next = revised.approvals.find(item => item.id !== approvalId)!;
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId: next.id, expectedRevision: next.revision, action: 'approve' });
    const bundle = await draftService.load(draftId), [bracket] = await draftService.catalog();
    await draftService.commit(await draftService.prepareAdd(bundle, bracket, 1, '80001'));
    const data = new LocalReferenceData(db, () => ownerToken);
    const customerId = await data.createCustomer({ name: 'Khách tiếp tục', phone: '0900000010' });
    const current = await draftService.load(draftId);
    await draftService.commit({ operationId: crypto.randomUUID(), expectedRevision: current.draft.revision,
      draft: { ...current.draft, customerId, revision: current.draft.revision + 1 }, lines: current.lines, approvals: current.approvals });
    expect((await draftService.load(draftId)).lines).toHaveLength(2);
    expect(await db.table('purchaseApprovals').get(approvalId)).toEqual(historical);
  });

  it.each(['approve', 'reject'] as const)('delivers %s only to its creator and acknowledges once', async action => {
    const { approvalId, approval, draftId } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action, reason: 'Giá cao' });
    const [result] = await draftService.pendingResults(draftId);
    expect(result.approval.decision.status).toBe(action === 'approve' ? 'approved' : 'rejected');
    const staffDrafts = new PurchaseDraftService(db, () => staffToken);
    await expect(staffDrafts.pendingResults(draftId)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(staffDrafts.acknowledgeResult(result.notice.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const decision = await db.table('purchaseApprovals').get(approvalId);
    await draftService.acknowledgeResult(result.notice.id);
    const auditCount = await db.auditEntries.count();
    await draftService.acknowledgeResult(result.notice.id);
    expect(await db.auditEntries.count()).toBe(auditCount);
    expect(await draftService.pendingResults(draftId)).toEqual([]);
    expect(await db.table('purchaseApprovals').get(approvalId)).toEqual(decision);
    expect(await db.table('purchaseNotices').get(result.notice.id)).toMatchObject({ delivery: 'delivered', readAt: expect.any(String), deliveredAt: expect.any(String) });
  });

  it.each(['80000', '130000'])('revises rejected price %s without changing old history and replays once', async price => {
    const { approvalId, approval, draftId } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'Giá cao' });
    const old = await db.table('purchaseApprovals').get(approvalId), bundle = await draftService.load(draftId), operationId = crypto.randomUUID();
    await draftService.reviseRejected(bundle, approval.lineId, price, operationId);
    const after = await draftService.load(draftId);
    expect(after.lines).toHaveLength(1);
    expect(after.lines[0]).toMatchObject({ unitCost: Number(price), quantity: 1, revision: 2, status: price === '80000' ? 'priced' : 'pending' });
    expect(await db.table('purchaseApprovals').get(approvalId)).toEqual(old);
    expect(after.approvals).toHaveLength(price === '80000' ? 1 : 2);
    if (price === '130000') expect(after.approvals.find(item => item.id !== approvalId)).toMatchObject({ lineId: approval.lineId, lineRevision: 2, unitCost: 130000, decision: { status: 'pending' } });
    await draftService.reviseRejected(bundle, approval.lineId, price, operationId);
    expect(await draftService.load(draftId)).toEqual(after);
    await expect(draftService.reviseRejected(bundle, approval.lineId, price, crypto.randomUUID())).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await db.hoaDonThuMua.count()).toBe(0); expect(await db.sanPham.count()).toBe(0);
  });

  it('rolls back acknowledgement and price revision after audit failure', async () => {
    const { approvalId, approval, draftId } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'Giá cao' });
    const [result] = await draftService.pendingResults(draftId), bundle = await draftService.load(draftId);
    vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit failed'));
    await expect(draftService.acknowledgeResult(result.notice.id)).rejects.toThrow('audit failed');
    expect((await draftService.pendingResults(draftId))[0]).toEqual(result);
    vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit failed'));
    await expect(draftService.reviseRejected(bundle, approval.lineId, '130000', crypto.randomUUID())).rejects.toThrow('audit failed');
    expect(await draftService.load(draftId)).toEqual(bundle);
  });

  it('uses the newly displayed bracket revision while preserving the original rejected snapshot', async () => {
    const { approvalId, approval, draftId } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'Giá cao' });
    const old = await db.table('purchaseApprovals').get(approvalId);
    const data = new LocalReferenceData(db, () => ownerToken);
    const bracket = await data.bracket(approval.bracket.id);
    await data.updateBracket(bracket.record.MaKhungGia, bracket.version, { productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '150000' });
    const [current] = await draftService.catalog();
    await draftService.reviseRejected(await draftService.load(draftId), approval.lineId, '130000', crypto.randomUUID(), current.revision);
    const saved = await draftService.load(draftId);
    expect(saved.lines[0]).toMatchObject({ status: 'priced', bracket: { revision: current.revision, max: 150000 } });
    expect(await db.table('purchaseApprovals').get(approvalId)).toEqual(old);
    expect(saved.approvals).toHaveLength(1);
  });

  it('blocks invalid price, non-rejected lines, foreign sessions and changed brackets', async () => {
    const { approvalId, approval, draftId } = await createPendingRequest(), bundle = await draftService.load(draftId);
    await expect(draftService.reviseRejected(bundle, approval.lineId, '0', crypto.randomUUID())).rejects.toThrow('Hãy nhập lại');
    await expect(draftService.reviseRejected(bundle, approval.lineId, '80000', crypto.randomUUID())).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(new PurchaseDraftService(db, () => staffToken).reviseRejected(bundle, approval.lineId, '80000', crypto.randomUUID())).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'Giá cao' });
    const key = JSON.stringify(['khungGiaThuMua', approval.bracket.id]);
    await db.recordVersions.update(key, { version: approval.bracket.revision + 1 });
    await expect(draftService.reviseRejected(await draftService.load(draftId), approval.lineId, '80000', crypto.randomUUID())).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it.each(['remove', 'cancel'] as const)('does not show a stale result after %s', async action => {
    const { approvalId, approval, draftId } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' });
    await draftService.removeOrCancel(await draftService.load(draftId), crypto.randomUUID(), action === 'remove' ? approval.lineId : undefined);
    expect(await draftService.pendingResults(draftId)).toEqual([]);
  });
});

it.each(['price', 'quantity', 'bracket'] as const)('rejects a changed %s snapshot before deciding and keeps decision/event/audit unchanged', async field => {
  const { approvalId, approval } = await createPendingRequest();
  const line = await db.table('purchaseLines').get(approval.lineId);
  const changed = field === 'price' ? { ...line, unitCost: line.unitCost + 1 } : field === 'quantity' ? { ...line, quantity: 2 } : { ...line, bracket: { ...line.bracket, revision: line.bracket.revision + 1 } };
  await db.table('purchaseLines').put(changed); // Isolated corrupted/stale fixture only.
  const before = { audit: await db.auditEntries.count(), operations: await db.operations.count(), notices: await db.table('purchaseNotices').count() };
  expect((await approvalService.loadRequest(approvalId)).eligible).toBe(false);
  expect((await approvalService.listRequests({ status: 'pending', draftId: '' }, 1)).rows[0].eligible).toBe(false);
  await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' })).rejects.toMatchObject({ code: 'CONFLICT' });
  expect(await db.table('purchaseApprovals').get(approvalId)).toEqual(approval);
  expect(await db.table('purchaseLines').get(approval.lineId)).toEqual(changed);
  expect({ audit: await db.auditEntries.count(), operations: await db.operations.count(), notices: await db.table('purchaseNotices').count() }).toEqual(before);
});

it.each([{ action: 'invalid' }, { expectedRevision: 0 }, { expectedRevision: 1.5 }, { operationId: '' }])('rejects malformed decision input %j without writes', async patch => {
  const { approvalId, approval } = await createPendingRequest();
  const command = { operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve', ...patch };
  const count = await db.auditEntries.count();
  await expect(approvalService.decide(command as Parameters<PurchaseApprovalService['decide']>[0])).rejects.toThrow();
  expect(await db.table('purchaseApprovals').get(approvalId)).toEqual(approval); expect(await db.auditEntries.count()).toBe(count);
  expect(await db.table('purchaseNotices').count()).toBe(0);
});

/** Helper: create a pending approval. Returns draftId and approvalId. */
async function createPendingRequest(price = '120000') {
  const bundle = await draftService.prepareDraft();
  const match = await draftService.findBracket({ type: 'Áo', brand: 'CoCo', condition: '2', quantity: '1' });
  const command = await draftService.prepareAdd(bundle, match.bracket, 1, price);
  await draftService.commit(command);
  const state = await draftService.load(bundle.draft.id);
  return { draftId: state.draft.id, approvalId: state.approvals[0].id, approval: state.approvals[0] };
}

describe('listRequests', () => {
  it('filters employee names and Vietnam calendar date', async () => {
    const { approval } = await createPendingRequest();
    const sentOn = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(approval.requestedAt));
    expect((await approvalService.listRequests({ status: 'all', draftId: '', employeeName: 'chủ', sentOn }, 1)).total).toBe(1);
    expect((await approvalService.listRequests({ status: 'all', draftId: '', employeeName: 'missing', sentOn }, 1)).total).toBe(0);
    expect((await approvalService.listRequests({ status: 'all', draftId: '', sentOn: '2000-01-01' }, 1)).total).toBe(0);
    await expect(approvalService.listRequests({ status: 'all', draftId: '', sentOn: 'invalid' }, 1)).rejects.toThrow();
  });

  it.each(['approve', 'reject'] as const)('preserves an existing %s decision when adding another product', async action => {
    const { draftId, approvalId, approval } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action, reason: action === 'reject' ? 'Giá cao' : undefined });
    const saved = await db.table('purchaseApprovals').get(approvalId);
    const bundle = await draftService.load(draftId);
    const match = await draftService.findBracket({ type: 'Áo', brand: 'CoCo', condition: '2', quantity: '1' });
    await draftService.commit(await draftService.prepareAdd(bundle, match.bracket, 1, '80000'));
    expect((await draftService.load(draftId)).lines).toHaveLength(2);
    expect(await db.table('purchaseApprovals').get(approvalId)).toEqual(saved);
    expect(await db.table('purchaseNotices').count()).toBe(1);
  });

  it('returns empty list when no approvals exist', async () => {
    const result = await approvalService.listRequests({ status: 'pending', draftId: '' }, 1);
    expect(result.total).toBe(0);
    expect(result.rows).toHaveLength(0);
  });

  it('shows pending request and marks it eligible', async () => {
    await createPendingRequest();
    const result = await approvalService.listRequests({ status: 'pending', draftId: '' }, 1);
    expect(result.total).toBe(1);
    expect(result.rows[0].eligible).toBe(true);
    expect(result.rows[0].decision.status).toBe('pending');
  });

  it('marks request ineligible when line is removed', async () => {
    const { draftId, approval } = await createPendingRequest();
    const state = await draftService.load(draftId);
    await draftService.removeOrCancel(state, 'remove-t03', approval.lineId);
    const result = await approvalService.listRequests({ status: 'all', draftId: '' }, 1);
    expect(result.rows[0].eligible).toBe(false);
  });

  it('filters by status=decided after a decision', async () => {
    const { approvalId, approval } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' });
    const pending = await approvalService.listRequests({ status: 'pending', draftId: '' }, 1);
    expect(pending.total).toBe(0);
    const decided = await approvalService.listRequests({ status: 'decided', draftId: '' }, 1);
    expect(decided.total).toBe(1);
  });

  it('requires approvals.read permission', async () => {
    const staffApprovalSvc = new PurchaseApprovalService(db, () => staffToken);
    await expect(staffApprovalSvc.listRequests({ status: 'pending', draftId: '' }, 1)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('loadRequest', () => {
  it('loads approval with draft and line context', async () => {
    const { approvalId, draftId } = await createPendingRequest();
    const detail = await approvalService.loadRequest(approvalId);
    expect(detail.approvalId).toBe(approvalId);
    expect(detail.draftId).toBe(draftId);
    expect(detail.eligible).toBe(true);
    expect(detail.draft?.status).toBe('editing');
  });

  it('throws for unknown approvalId', async () => {
    await expect(approvalService.loadRequest('UNKNOWN')).rejects.toThrow('Không tìm thấy');
  });

  it('requires approvals.read permission', async () => {
    const { approvalId } = await createPendingRequest();
    const staffApprovalSvc = new PurchaseApprovalService(db, () => staffToken);
    await expect(staffApprovalSvc.loadRequest(approvalId)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('decide — approve', () => {
  it('approves a pending request atomically and writes persistent notice', async () => {
    const { approvalId, approval } = await createPendingRequest();
    const opId = crypto.randomUUID();
    const result = await approvalService.decide({ operationId: opId, approvalId, expectedRevision: approval.revision, action: 'approve' });
    expect(result.duplicate).toBe(false);

    // Approval updated.
    const updated = purchaseApprovalSchema.parse(await db.table('purchaseApprovals').get(approvalId));
    expect(updated.decision.status).toBe('approved');
    expect(updated.revision).toBe(approval.revision + 1);

    // Line mirrors approved status.
    const line = await db.table('purchaseLines').get(approval.lineId);
    expect(line.status).toBe('approved');

    // Notice written with delivery=pending for T04.
    const notices = await db.table('purchaseNotices').where('approvalId').equals(approvalId).toArray();
    expect(notices).toHaveLength(1);
    expect(notices[0].delivery).toBe('pending');
    expect(notices[0].recipient).toBe(approval.requestedBy);

    // Audit recorded.
    expect(await db.auditEntries.get(`g6-approval:${opId}`)).toBeTruthy();

    // No invoice or stock written.
    expect(await db.hoaDonThuMua.count()).toBe(0);
    expect(await db.sanPham.count()).toBe(0);
  });

  it('replays the same operationId without duplicating data', async () => {
    const { approvalId, approval } = await createPendingRequest();
    const opId = crypto.randomUUID();
    const cmd = { operationId: opId, approvalId, expectedRevision: approval.revision, action: 'approve' as const };
    await approvalService.decide(cmd);
    const second = await approvalService.decide(cmd);
    expect(second.duplicate).toBe(true);
    expect(await db.table('purchaseNotices').count()).toBe(1);
  });
});

describe('decide — reject', () => {
  it('rejects with reason, updates approval and line, writes notice', async () => {
    const { approvalId, approval } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'Giá quá cao' });

    const updated = purchaseApprovalSchema.parse(await db.table('purchaseApprovals').get(approvalId));
    expect(updated.decision.status).toBe('rejected');
    if (updated.decision.status === 'rejected') expect(updated.decision.reason).toBe('Giá quá cao');

    const line = await db.table('purchaseLines').get(approval.lineId);
    expect(line.status).toBe('rejected');

    const notices = await db.table('purchaseNotices').where('approvalId').equals(approvalId).toArray();
    expect(notices).toHaveLength(1);
    expect(notices[0].delivery).toBe('pending');
  });

  it('requires non-empty reason when rejecting', async () => {
    const { approvalId, approval } = await createPendingRequest();
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: '' }))
      .rejects.toMatchObject({ fields: { reason: expect.stringContaining('lý do') } });
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject' }))
      .rejects.toMatchObject({ fields: { reason: expect.any(String) } });
  });

  it('rejects reason longer than 100 characters', async () => {
    const { approvalId, approval } = await createPendingRequest();
    const longReason = 'x'.repeat(101);
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: longReason }))
      .rejects.toMatchObject({ fields: { reason: expect.any(String) } });
  });
});

describe('decide — permission and CAS guards', () => {
  it('prevents staff from deciding approvals', async () => {
    const { approvalId, approval } = await createPendingRequest();
    const staffApprovalSvc = new PurchaseApprovalService(db, () => staffToken);
    await expect(staffApprovalSvc.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    // Approval still pending after rejected attempt.
    const unchanged = purchaseApprovalSchema.parse(await db.table('purchaseApprovals').get(approvalId));
    expect(unchanged.decision.status).toBe('pending');
  });

  it('rejects stale expectedRevision (CAS)', async () => {
    const { approvalId, approval } = await createPendingRequest();
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision + 5, action: 'approve' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('rejects deciding an already-decided approval', async () => {
    const { approvalId, approval } = await createPendingRequest();
    await approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' });
    // Second owner tries to decide the same approval.
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'too late' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('two owners collide: second sees CONFLICT and first decision is preserved', async () => {
    const { approvalId, approval } = await createPendingRequest();
    // Simulate two owners reading the same revision then racing to commit.
    const ownerB = new PurchaseApprovalService(db, () => ownerToken); // same token for simplicity
    const op1 = crypto.randomUUID(), op2 = crypto.randomUUID();
    // First owner wins.
    await approvalService.decide({ operationId: op1, approvalId, expectedRevision: approval.revision, action: 'approve' });
    // Second owner sees stale revision.
    await expect(ownerB.decide({ operationId: op2, approvalId, expectedRevision: approval.revision, action: 'reject', reason: 'Race' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    // Decision remains approved.
    const final = purchaseApprovalSchema.parse(await db.table('purchaseApprovals').get(approvalId));
    expect(final.decision.status).toBe('approved');
    expect(await db.table('purchaseNotices').count()).toBe(1);
  });

  it('rolls back all writes on audit failure — no partial state', async () => {
    const { approvalId, approval } = await createPendingRequest();
    const spy = vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit fail'));
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' }))
      .rejects.toThrow('audit fail');
    spy.mockRestore();
    // All stores unchanged.
    const unchanged = purchaseApprovalSchema.parse(await db.table('purchaseApprovals').get(approvalId));
    expect(unchanged.decision.status).toBe('pending');
    expect(await db.table('purchaseNotices').count()).toBe(0);
    expect(await db.table('purchaseLines').get(approval.lineId)).toMatchObject({ status: 'pending' });
  });

  it('refuses to decide a request where the line has been removed', async () => {
    const { draftId, approvalId, approval } = await createPendingRequest();
    const state = await draftService.load(draftId);
    await draftService.removeOrCancel(state, 'remove-first', approval.lineId);
    // SC135/SC142: ineligible request — approval itself still at original revision,
    // but line.removedAt is set so the service must reject it.
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('requires auth session for decide', async () => {
    const { approvalId, approval } = await createPendingRequest();
    await auth.logout(ownerToken);
    await expect(approvalService.decide({ operationId: crypto.randomUUID(), approvalId, expectedRevision: approval.revision, action: 'approve' }))
      .rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  });
});
