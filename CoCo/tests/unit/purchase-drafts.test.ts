import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { purchaseSubtotal } from '../../src/domain/purchases';

let db: CoCoDatabase, auth: AuthService, service: PurchaseDraftService, token: string;
beforeEach(async () => {
  db = new CoCoDatabase('T02DraftServiceTests'); auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'draft-test!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'draft-test!')).token; service = new PurchaseDraftService(db, () => token);
  await new LocalReferenceData(db, () => token).createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });
const query = { type: 'Áo', brand: 'CoCo', condition: '2', quantity: '1' };
it('prepares without writes and finds the exact tagged bracket for a valid quantity', async () => {
  const draft = await service.prepareDraft(); expect(draft.draft.revision).toBe(0); expect(await db.table('purchaseDrafts').count()).toBe(0);
  expect((await service.findBracket({ ...query, type: ' áo ', brand: 'coco' })).bracket.max).toBe(100000);
});
it.each(['', '0', '-1', '1.2', '2147483648', 'abc'])('rejects invalid quantity %s before writing', async quantity => {
  await expect(service.findBracket({ ...query, quantity })).rejects.toThrow(); expect(await db.table('purchaseLines').count()).toBe(0);
});
it('returns required field errors and does not match a different condition or missing brand', async () => {
  await expect(service.findBracket({ type: '', brand: '', condition: '', quantity: '' })).rejects.toMatchObject({ fields: { type: 'Hãy điền đầy đủ thông tin', brand: 'Hãy điền đầy đủ thông tin', condition: 'Hãy điền đầy đủ thông tin', quantity: 'Hãy điền đầy đủ thông tin' } });
  await expect(service.findBracket({ ...query, condition: '3' })).rejects.toThrow('Không tìm thấy');
  await expect(service.findBracket({ ...query, brand: 'Other' })).rejects.toThrow('Không tìm thấy');
});
it.each(['0', '-1', '1.5', 'abc', '9007199254740992'])('rejects invalid proposed price %s', async price => {
  const bundle = await service.prepareDraft(), match = await service.findBracket(query);
  await expect(service.prepareAdd(bundle, match.bracket, match.quantity, price)).rejects.toThrow('Hãy nhập lại');
});
it('creates a single real pending request only above Max and replays one command without duplicate', async () => {
  const bundle = await service.prepareDraft(), match = await service.findBracket(query);
  const prepared = await service.prepareAdd(bundle, match.bracket, 1, '100001');
  await service.commit(prepared); await service.commit(prepared);
  const state = await service.load(bundle.draft.id); expect(state.lines).toHaveLength(1); expect(state.approvals).toHaveLength(1);
  expect(state.lines[0].approvalId).toBe(state.approvals[0].id); expect(state.approvals[0].decision.status).toBe('pending');
  expect(await db.hoaDonThuMua.count()).toBe(0); expect(await db.sanPham.count()).toBe(0);
});
it('accepts Max and positive below-Min prices without inventing extra approval rules', async () => {
  const match = await service.findBracket(query);
  for (const price of ['100000', '1']) { const prepared = await service.prepareAdd(await service.prepareDraft(), match.bracket, 1, price); await service.commit(prepared); }
  expect(await db.table('purchaseLines').count()).toBe(2); expect(await db.table('purchaseApprovals').count()).toBe(0);
});
it('soft-removes a pending line, retains its request snapshot and does not reuse a cancelled draft', async () => {
  const match = await service.findBracket(query), original = await service.prepareDraft();
  await service.commit(await service.prepareAdd(original, match.bracket, 1, '120000'));
  const state = await service.load(original.draft.id); await service.removeOrCancel(state, 'remove-once', state.lines[0].id); await service.removeOrCancel(state, 'remove-once', state.lines[0].id);
  const removed = await service.load(original.draft.id); expect(removed.lines[0].removedAt).toBeTruthy(); expect(removed.approvals[0]).toEqual(state.approvals[0]);
  expect(purchaseSubtotal(removed.lines)).toBe(0);
  await service.commit(await service.prepareAdd(removed, match.bracket, 2, '80001'));
  const added = await service.load(original.draft.id);
  expect(added.lines.map(line => line.position)).toEqual([1, 2]); expect(purchaseSubtotal(added.lines)).toBe(160002);
  expect(added.approvals).toEqual(state.approvals);
  await expect(service.removeOrCancel(removed, 'stale-cancel')).rejects.toMatchObject({ code: 'CONFLICT' });
  await service.removeOrCancel(added, 'cancel-once'); expect((await service.load(original.draft.id)).draft.status).toBe('cancelled');
  await expect(service.prepareAdd(await service.load(original.draft.id), match.bracket, 1, '90000')).rejects.toThrow();
});
it('rolls back remove/cancel on audit failure and rejects revoked sessions', async () => {
  const match = await service.findBracket(query), bundle = await service.prepareDraft(); await service.commit(await service.prepareAdd(bundle, match.bracket, 1, '80000'));
  const state = await service.load(bundle.draft.id); const spy = vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit fail'));
  await expect(service.removeOrCancel(state, 'fail-remove', state.lines[0].id)).rejects.toThrow('audit fail'); spy.mockRestore();
  expect(await service.load(bundle.draft.id)).toEqual(state);
  await auth.logout(token); await expect(service.catalog()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' }); await expect(service.load(bundle.draft.id)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('lists persisted invoices with customer data, combined filters and Vietnam calendar dates; excludes drafts', async () => {
  const actor = (await db.taiKhoan.get('owner'))!;
  await db.khachHang.add({ MaKH: 'KHOLD', TenKH: 'Khách Nguyễn', SoDienThoaiKH: '0900000042', DiemTichLuy: 0 });
  await db.hoaDonThuMua.bulkAdd(Array.from({ length: 10 }, (_, i) => ({ MaHDTM: `TM${String(i + 1).padStart(2, '0')}`, MaKH: 'KHOLD', MaNV: actor.MaNV, NgayThuMua: '2026-11-10T18:00:00Z', TongTienTM: 80000, TrangThai: 90 })));
  const empty = { id: '', phone: '', name: '', date: '' };
  const first = await service.listTransactions(empty, 1, 9); expect(first.total).toBe(10); expect(first.pages).toBe(2); expect(first.rows[0].id).toBe('TM01');
  expect((await service.listTransactions(empty, 2, 9)).rows.map(row => row.id)).toEqual(['TM10']);
  expect((await service.listTransactions({ id: 'tm01', phone: '0042', name: 'nguyễn', date: '2026-11-11' }, 1)).total).toBe(1);
  expect((await service.listTransactions({ ...empty, date: '2026-11-10' }, 1)).total).toBe(0);
  const match = await service.findBracket(query); await service.commit(await service.prepareAdd(await service.prepareDraft(), match.bracket, 1, '120000'));
  expect((await service.listTransactions(empty, 1)).total).toBe(10);
  expect((await db.hoaDonThuMua.get('TM01'))?.TrangThai).toBe(90);
  await expect(service.listTransactions({ ...empty, date: '2026-02-30' }, 1)).rejects.toThrow('Ngày tìm kiếm');
  await auth.logout(token); await expect(service.listTransactions(empty, 1)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});
