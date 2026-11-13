import Dexie from 'dexie';
import { afterEach, expect, it } from 'vitest';
import { PHASE_2_STORES } from '../fixtures/phase2-schema';
import { CoCoDatabase } from '../../src/db/schema';
import { PURCHASE_METADATA_STORES, registerPurchaseMetadataCandidate } from '../../src/db/purchase-metadata';
import { PURCHASE_FORMAT, purchaseDraftSchema, purchaseLineSchema, purchaseApprovalSchema, purchaseNoticeSchema,
  purchaseSubtotal, assertFinalizable, approvalMatchesLine, assertPendingDecision,
  type PurchaseDraft, type PurchaseLine, type PurchaseApproval } from '../../src/domain/purchases';

const now = '2026-11-11T01:00:00.000Z';
const bracket = { id: 'KG1', revision: 1, type: 'Áo', brand: 'CoCo', condition: 2 as const, min: 50000, max: 100000 };
const draft: PurchaseDraft = { id: 'D1', format: PURCHASE_FORMAT, employeeId: 'NV1', createdBy: 'staff', status: 'editing', revision: 1, createdAt: now, updatedAt: now };
const line: PurchaseLine = { id: 'line-1', draftId: 'D1', revision: 1, bracket, quantity: 1, unitCost: 80001, status: 'priced' };
const pendingLine: PurchaseLine = { ...line, id: 'line-2', unitCost: 120000, status: 'pending', approvalId: 'YC1' };
const request: PurchaseApproval = { id: 'YC1', draftId: 'D1', lineId: 'line-2', lineRevision: 1, revision: 1, requestedBy: 'staff', requestedAt: now, bracket, quantity: 1, unitCost: 120000, decision: { status: 'pending' } };
const databases: Dexie[] = [];
afterEach(async () => { for (const db of databases.splice(0)) await db.delete(); });

it('stores draft identity without fabricating customer or invoice and validates finalization identity', () => {
  expect(purchaseDraftSchema.parse(draft).customerId).toBeUndefined();
  expect(purchaseDraftSchema.safeParse({ ...draft, status: 'finalized' }).success).toBe(false);
  expect(purchaseDraftSchema.safeParse({ ...draft, invoiceId: 'TM1' }).success).toBe(false);
  expect(purchaseDraftSchema.parse({ ...draft, status: 'finalized', customerId: 'KH1', invoiceId: 'TM1' }).invoiceId).toBe('TM1');
});
it('preserves two same-bracket costs and an odd total without averaging', () => {
  expect(purchaseSubtotal([line, pendingLine])).toBe(200001);
  expect(line.unitCost).toBe(80001); expect(pendingLine.unitCost).toBe(120000);
});
it('does not create a below-Min rule and requires approval strictly above Max', () => {
  expect(purchaseLineSchema.parse({ ...line, unitCost: 1 }).unitCost).toBe(1);
  expect(purchaseLineSchema.parse({ ...line, unitCost: 100000 }).status).toBe('priced');
  expect(purchaseLineSchema.safeParse({ ...line, unitCost: 100001 }).success).toBe(false);
});
it.each([{ quantity: 0 }, { quantity: 1.5 }, { unitCost: 0 }, { unitCost: -1 }, { unitCost: 1.5 }, { bracket: { ...bracket, condition: 90 } }, { bracket: { ...bracket, min: 200000 } }])('rejects invalid line input %j', mutation => {
  expect(purchaseLineSchema.safeParse({ ...line, ...mutation }).success).toBe(false);
});
it('rejects duplicate line identities and arithmetic overflow instead of rounding', () => {
  expect(() => purchaseSubtotal([line, line])).toThrow('Duplicate');
  expect(() => purchaseSubtotal([{ ...line, quantity: 2, unitCost: Number.MAX_SAFE_INTEGER, bracket: { ...bracket, max: Number.MAX_SAFE_INTEGER } }])).toThrow();
});
it('requires a nonblank refusal reason and does not attach decision fields to pending state', () => {
  expect(purchaseApprovalSchema.safeParse({ ...request, decision: { status: 'rejected', actor: 'owner', decidedAt: now, reason: ' ' } }).success).toBe(false);
  expect(purchaseApprovalSchema.safeParse({ ...request, decision: { status: 'pending', actor: 'owner' } }).success).toBe(false);
  expect(purchaseApprovalSchema.parse({ ...request, decision: { status: 'rejected', actor: 'owner', decidedAt: now, reason: 'Còn tồn kho' } }).decision.status).toBe('rejected');
});
it('rejects staff decisions, stale versions and repeat processing', () => {
  expect(() => assertPendingDecision(request, 'owner', 1)).not.toThrow();
  expect(() => assertPendingDecision(request, 'staff', 1)).toThrow('owner');
  expect(() => assertPendingDecision(request, 'owner', 2)).toThrow('pending');
  expect(() => assertPendingDecision({ ...request, decision: { status: 'approved', actor: 'owner', decidedAt: now } }, 'owner', 1)).toThrow('pending');
});
it('binds approval to exact line revision, price, quantity and bracket snapshot', () => {
  expect(approvalMatchesLine(request, pendingLine)).toBe(true);
  for (const changed of [{ ...pendingLine, revision: 2 }, { ...pendingLine, unitCost: 130000 }, { ...pendingLine, quantity: 2 }, { ...pendingLine, bracket: { ...bracket, revision: 2 } }]) expect(approvalMatchesLine(request, changed)).toBe(false);
});
it('requires customer/items and valid approvals without reusing a decision after an edit', () => {
  expect(() => assertFinalizable(draft, [line], [])).toThrow();
  const withCustomer = { ...draft, customerId: 'KH1' };
  expect(() => assertFinalizable(withCustomer, [], [])).toThrow();
  expect(() => assertFinalizable(withCustomer, [pendingLine], [request])).toThrow();
  const approved = { ...request, decision: { status: 'approved' as const, actor: 'owner', decidedAt: now } };
  expect(() => assertFinalizable(withCustomer, [line, { ...pendingLine, status: 'approved' }], [approved])).not.toThrow();
  expect(() => assertFinalizable(withCustomer, [{ ...pendingLine, status: 'approved', revision: 2 }], [approved])).toThrow();
  expect(() => assertFinalizable(withCustomer, [{ ...line, draftId: 'D2' }], [])).toThrow();
});
it('separates durable notice from delivery and does not claim a delivery without its time', () => {
  const notice = { id: 'event:YC1', approvalId: 'YC1', recipient: 'staff', createdAt: now, delivery: 'pending' };
  expect(purchaseNoticeSchema.parse(notice).delivery).toBe('pending');
  expect(purchaseNoticeSchema.safeParse({ ...notice, delivery: 'delivered' }).success).toBe(false);
  expect(purchaseNoticeSchema.parse({ ...notice, delivery: 'delivered', deliveredAt: now }).deliveredAt).toBe(now);
});
it('migrates a real frozen v3 test DB additively and preserves all legacy keys and records', async () => {
  const name = 'G6CandidateMigration'; const legacy = new Dexie(name); databases.push(legacy);
  legacy.version(3).stores({ ...PHASE_2_STORES, authSessions: '&tokenHash, username' });
  await legacy.open();
  for (const table of legacy.tables) {
    if (table.name === 'appMetadata') await table.put({ key: 'sentinel', value: 'keep' });
  }
  await legacy.table('khachHang').put({ MaKH: 'KHOLD', TenKH: 'Khách cũ', SoDienThoaiKH: '0123456789', DiemTichLuy: 50 });
  await legacy.table('nhanVien').put({ MaNV: 'NVOLD', HoTen: 'Nhân viên cũ', SoDienThoai: '0900000001' });
  await legacy.table('khungGiaThuMua').put({ MaKhungGia: 'KGOLD', LoaiSanPham: 'Áo', ThuongHieu: 'Cũ', TinhTrang: 90, GiaMin: 50000, GiaMax: 100000, MaNV: 'NVOLD' });
  await legacy.table('hoaDonThuMua').put({ MaHDTM: 'TMOLD', NgayThuMua: now, TongTienTM: 160002, TrangThai: 90, MaKH: 'KHOLD', MaNV: 'NVOLD' });
  await legacy.table('chiTietHoaDonTM').put({ MaHDTM: 'TMOLD', MaKhungGia: 'KGOLD', SoLuong: 2, DonGia: 80001, ThanhTien: 160002 });
  const before = await Promise.all(legacy.tables.map(async table => ({ name: table.name, key: table.schema.primKey.src, rows: await table.toArray() })));
  legacy.close();
  const candidate = new CoCoDatabase(name); registerPurchaseMetadataCandidate(candidate); databases.push(candidate);
  await candidate.open(); expect(candidate.verno).toBe(4);
  for (const entry of before) { expect(candidate.table(entry.name).schema.primKey.src).toBe(entry.key); expect(await candidate.table(entry.name).toArray()).toEqual(entry.rows); }
  for (const store of Object.keys(PURCHASE_METADATA_STORES)) expect(await candidate.table(store).count()).toBe(0);
  await candidate.table('purchaseDrafts').add(purchaseDraftSchema.parse(draft));
  await candidate.table('purchaseLines').bulkAdd([line, pendingLine]);
  expect(purchaseSubtotal(await candidate.table('purchaseLines').toArray())).toBe(200001);
  candidate.close();
});
it('activates the accepted v4 schema with all six additive stores', () => {
  const runtime = new CoCoDatabase('G6RuntimeContract'); databases.push(runtime);
  expect(runtime.verno).toBe(4); expect(runtime.tables).toHaveLength(27);
  expect(runtime.tables.some(table => table.name === 'purchaseDrafts')).toBe(true);
});
it('rolls back a failed schema upgrade itself, retaining native v3 stores and data', async () => {
  const name = 'G6UpgradeAbort', legacy = new Dexie(name); databases.push(legacy);
  const frozen = { ...PHASE_2_STORES, authSessions: '&tokenHash, username' };
  legacy.version(3).stores(frozen); await legacy.open();
  await legacy.table('appMetadata').put({ key: 'upgrade-sentinel', value: 'keep' }); legacy.close();
  const broken = new CoCoDatabase(name); registerPurchaseMetadataCandidate(broken); databases.push(broken);
  broken.version(4).upgrade(async tx => { await tx.table('appMetadata').put({ key: 'upgrade-sentinel', value: 'wrong' }); throw new Error('upgrade failure'); });
  await expect(broken.open()).rejects.toThrow('upgrade failure'); broken.close();
  const reopened = new Dexie(name); reopened.version(3).stores(frozen); databases.push(reopened); await reopened.open();
  expect(reopened.backendDB().version).toBe(30); expect(reopened.tables).toHaveLength(21);
  expect((await reopened.table('appMetadata').get('upgrade-sentinel')).value).toBe('keep'); reopened.close();
});
it('rolls back candidate draft and lines on a late transaction failure without touching legacy rows', async () => {
  const candidate = new CoCoDatabase('G6CandidateRollback'); registerPurchaseMetadataCandidate(candidate); databases.push(candidate);
  await candidate.open(); await candidate.appMetadata.put({ key: 'keep', value: 'unchanged' });
  await expect(candidate.transaction('rw', ['purchaseDrafts', 'purchaseLines', 'appMetadata'], async () => {
    await candidate.table('purchaseDrafts').add(draft);
    await candidate.table('purchaseLines').add(line);
    await candidate.appMetadata.put({ key: 'keep', value: 'wrong' });
    await candidate.table('purchaseLines').add(line); // Late duplicate aborts earlier writes.
  })).rejects.toBeTruthy();
  expect(await candidate.table('purchaseDrafts').count()).toBe(0);
  expect(await candidate.table('purchaseLines').count()).toBe(0);
  expect((await candidate.appMetadata.get('keep'))?.value).toBe('unchanged');
});
