import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { registerPurchaseMetadataCandidate } from '../../src/db/purchase-metadata';
import { AuthService } from '../../src/services/auth/service';
import { CoCoRepository } from '../../src/repositories';
import { CandidatePurchaseTransactions, readCandidatePurchase, validateCandidatePurchaseReferences, type CandidateDraftCommand } from '../../src/services/purchase-candidate';
import { PURCHASE_FORMAT } from '../../src/domain/purchases';
import { conditionMetadataKey, CONDITION_CATALOG_VERSION } from '../../src/domain/conditions';
import { StaffAccountsService } from '../../src/services/staff-accounts';
import { validateReferences } from '../../src/repositories/constraints';
import { installFinalizedPurchaseGraph } from '../fixtures/purchase-finalized-graph';

const now = '2026-11-11T01:00:00Z';
let db: CoCoDatabase, auth: AuthService, repo: CoCoRepository, ownerToken: string, staffToken: string, ownerId: string;
beforeEach(async () => {
  db = new CoCoDatabase('G6CandidateTransactions'); registerPurchaseMetadataCandidate(db);
  auth = new AuthService(db); repo = new CoCoRepository(db);
  await auth.bootstrap({ username: 'owner', password: 'owner-test!', fullName: 'Chủ test', phone: '0900000001' });
  const login = await auth.login('owner', 'owner-test!'); ownerToken = login.token; ownerId = login.user.employeeId;
  const security = (await db.accountSecurity.get('owner'))!;
  await repo.commit({ id: 'fixture', changes: [
    { table: 'nhanVien', kind: 'create', value: { MaNV: 'NVSTAFF', HoTen: 'Nhân viên', SoDienThoai: '0900000002' } },
    { table: 'taiKhoan', kind: 'create', value: { TenDangNhap: 'staff', MaNV: 'NVSTAFF' } },
    { table: 'accountSecurity', kind: 'create', value: { ...security, TenDangNhap: 'staff', role: 'staff' } },
    { table: 'khungGiaThuMua', kind: 'create', value: { MaKhungGia: 'KG1', LoaiSanPham: 'Áo', ThuongHieu: 'CoCo', TinhTrang: 2, GiaMin: 50000, GiaMax: 100000, MaNV: ownerId } },
    { table: 'khachHang', kind: 'create', value: { MaKH: 'KH1', TenKH: 'Khách', SoDienThoaiKH: '0900000003', DiemTichLuy: 0 } },
  ] });
  await db.appMetadata.put({ key: conditionMetadataKey('KG1'), value: CONDITION_CATALOG_VERSION });
  staffToken = (await auth.login('staff', 'owner-test!')).token;
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });
const service = (token = staffToken) => new CandidatePurchaseTransactions(db, () => token);
function command(owner = false): CandidateDraftCommand {
  return { operationId: 'create-1', expectedRevision: 0,
    draft: { id: 'D1', format: PURCHASE_FORMAT, employeeId: owner ? ownerId : 'NVSTAFF', createdBy: owner ? 'owner' : 'staff', status: 'editing', revision: 1, createdAt: now, updatedAt: now },
    lines: [{ id: 'line1', draftId: 'D1', revision: 1, bracket: { id: 'KG1', revision: 1, type: 'Áo', brand: 'CoCo', condition: 2, min: 50000, max: 100000 }, quantity: 1, unitCost: 80001, status: 'priced' }], approvals: [] };
}
async function snapshot() { const result: Record<string, unknown[]> = {}; for (const table of db.tables) result[table.name] = await table.toArray(); return result; }

it.each([false, true])('atomically saves a real authorized draft, without invoice/customer fabrication; owner=%s', async owner => {
  const before = await db.khachHang.count(); await service(owner ? ownerToken : staffToken).saveEditingDraft(command(owner));
  expect(await db.table('purchaseDrafts').count()).toBe(1); expect(await db.table('purchaseLines').count()).toBe(1);
  expect(await db.hoaDonThuMua.count()).toBe(0); expect(await db.sanPham.count()).toBe(0); expect(await db.khachHang.count()).toBe(before);
  await validateCandidatePurchaseReferences(db);
});
it('replays identical commands once and rejects changed payloads without mutation', async () => {
  const input = command(); await service().saveEditingDraft(input); const before = await snapshot();
  expect(await service().saveEditingDraft(input)).toEqual({ duplicate: true }); expect(await snapshot()).toEqual(before);
  await expect(service().saveEditingDraft({ ...input, draft: { ...input.draft, customerId: 'KH1' } })).rejects.toMatchObject({ code: 'OPERATION_REUSED' });
  expect(await snapshot()).toEqual(before);
});
it('serializes two connections with the same expected revision into a single winner', async () => {
  await service().saveEditingDraft(command());
  const other = new CoCoDatabase(db.name); registerPurchaseMetadataCandidate(other); await other.open();
  try {
    const base = command(), next = { ...base, expectedRevision: 1, draft: { ...base.draft, revision: 2, customerId: 'KH1' } };
    const results = await Promise.allSettled([service().saveEditingDraft({ ...next, operationId: 'race-a' }), new CandidatePurchaseTransactions(other, () => staffToken).saveEditingDraft({ ...next, operationId: 'race-b' })]);
    expect(results.filter(row => row.status === 'fulfilled')).toHaveLength(1);
    expect((await db.table('purchaseDrafts').get('D1')).revision).toBe(2);
  } finally { other.close(); }
});
it('rejects forged provenance and revoked sessions, including replay of a committed command', async () => {
  const before = await snapshot(); await expect(service().saveEditingDraft(command(true))).rejects.toMatchObject({ code: 'FORBIDDEN' }); expect(await snapshot()).toEqual(before);
  const input = command(); await service().saveEditingDraft(input); await auth.logout(staffToken); const revoked = await snapshot();
  await expect(service().saveEditingDraft(input)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' }); expect(await snapshot()).toEqual(revoked);
});
it('preserves historical draft actor across real G5 rename, requires new session and records current audit actor', async () => {
  const input = command(); await service().saveEditingDraft(input);
  const accounts = new StaffAccountsService(db, () => ownerToken), profile = await accounts.detail('NVSTAFF');
  await accounts.update('NVSTAFF', profile.revision, { name: 'Nhân viên', phone: '0900000002', username: 'renamed' });
  await validateCandidatePurchaseReferences(db);
  await expect(service().saveEditingDraft(input)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  const token = (await auth.login('renamed', 'owner-test!')).token;
  const next = { ...input, operationId: 'after-rename', expectedRevision: 1, draft: { ...input.draft, revision: 2, customerId: 'KH1' } };
  await service(token).saveEditingDraft(next);
  expect((await db.table('purchaseDrafts').get('D1')).createdBy).toBe('staff');
  expect((await db.auditEntries.get('g6-draft:after-rename'))?.actor).toBe('renamed');
});
it.each(['customer', 'bracket', 'request', 'cross-draft'])('rejects invalid %s link and rolls back all tables', async mode => {
  const input = command();
  if (mode === 'customer') input.draft.customerId = 'MISSING';
  if (mode === 'bracket') input.lines[0].bracket.id = 'MISSING';
  if (mode === 'cross-draft') input.lines[0].draftId = 'D2';
  if (mode === 'request') { input.lines[0].unitCost = 120000; input.lines[0].status = 'pending'; input.lines[0].approvalId = 'YC1'; }
  const before = await snapshot(); await expect(service().saveEditingDraft(input)).rejects.toThrow(); expect(await snapshot()).toEqual(before);
});
it('keeps pending price bound to the exact snapshot, cannot inject an approved decision', async () => {
  const input = command(); const line = input.lines[0]; line.unitCost = 120000; line.status = 'pending'; line.approvalId = 'YC1';
  input.approvals.push({ id: 'YC1', draftId: 'D1', lineId: line.id, lineRevision: 1, revision: 1, requestedBy: 'staff', requestedAt: now, bracket: line.bracket, quantity: 1, unitCost: 120000, decision: { status: 'pending' } });
  await service().saveEditingDraft(input); const before = await snapshot();
  const forged = structuredClone(input); forged.operationId = 'forged'; forged.expectedRevision = 1; forged.draft.revision = 2;
  forged.approvals[0].decision = { status: 'approved', actor: 'owner', decidedAt: now };
  await expect(service().saveEditingDraft(forged)).rejects.toThrow(); expect(await snapshot()).toEqual(before);
});
it('rejects changed bracket versions and preserves old lines until invalidation is implemented', async () => {
  const input = command(); input.lines[0].bracket.revision = 2; const before = await snapshot();
  await expect(service().saveEditingDraft(input)).rejects.toMatchObject({ code: 'CONFLICT' }); expect(await snapshot()).toEqual(before);
  input.lines[0].bracket.revision = 1; await service().saveEditingDraft(input); const saved = await snapshot();
  await expect(service().saveEditingDraft({ ...input, operationId: 'edit', expectedRevision: 1, draft: { ...input.draft, revision: 2 }, lines: [] })).rejects.toMatchObject({ code: 'IMMUTABLE' }); expect(await snapshot()).toEqual(saved);
});
it('does not reinterpret an untagged legacy condition even when its numeric value is 2', async () => {
  await db.appMetadata.delete(conditionMetadataKey('KG1')); const before = await snapshot();
  await expect(service().saveEditingDraft(command())).rejects.toMatchObject({ code: 'CONFLICT' }); expect(await snapshot()).toEqual(before);
});
it('rolls back draft/lines/receipt when audit fails, then retries exactly once', async () => {
  const before = await snapshot(); const audit = vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit test failure'));
  await expect(service().saveEditingDraft(command())).rejects.toThrow('audit test failure'); expect(await snapshot()).toEqual(before);
  audit.mockRestore(); await service().saveEditingDraft(command()); expect((await db.operations.get('g6-draft:create-1'))?.id).toBe('g6-draft:create-1');
});
it('reads legacy status without interpretation and refuses an incomplete new-format snapshot', async () => {
  await repo.commit({ id: 'legacy-invoice', changes: [{ table: 'hoaDonThuMua', kind: 'create', value: { MaHDTM: 'TM1', NgayThuMua: now, TongTienTM: 80001, TrangThai: 90, MaNV: ownerId, MaKH: 'KH1' } },
    { table: 'chiTietHoaDonTM', kind: 'create', value: { MaHDTM: 'TM1', MaKhungGia: 'KG1', SoLuong: 1, DonGia: 80001, ThanhTien: 80001 } }] });
  const legacy = await readCandidatePurchase(db, 'TM1'); expect(legacy?.source).toBe('legacy'); expect(legacy?.invoice.TrangThai).toBe(90); expect(legacy?.finalizedAt).toBeUndefined();
  await db.table('purchaseFinalizations').put({ format: PURCHASE_FORMAT, invoiceId: 'TM1', draftId: 'D1', lines: command().lines, subtotal: 80001, paidTotal: 80001, finalizedAt: now, paidAt: now });
  await expect(readCandidatePurchase(db, 'TM1')).rejects.toMatchObject({ code: 'REFERENCE' });
});
it('detects orphan notification/provenance and inconsistent finalized snapshot', async () => {
  await db.table('purchaseNotices').put({ id: 'N1', approvalId: 'missing', recipient: 'staff', createdAt: now, delivery: 'pending' });
  await expect(validateCandidatePurchaseReferences(db)).rejects.toMatchObject({ code: 'REFERENCE' }); await db.table('purchaseNotices').clear();
  await db.table('purchaseProvenance').put({ format: PURCHASE_FORMAT, productId: 'SP1', invoiceId: 'TM1', lineId: 'L1', unitCost: 10, recordedAt: now });
  await expect(validateCandidatePurchaseReferences(db)).rejects.toMatchObject({ code: 'REFERENCE' });
});
it('checks a complete candidate provenance graph, cost binding and exact physical item count', async () => {
  const input = command(); await service().saveEditingDraft(input);
  const invoice = { MaHDTM: 'TM1', NgayThuMua: now, TongTienTM: 80001, TrangThai: 90, MaNV: 'NVSTAFF', MaKH: 'KH1' };
  // Finalized fixture tests validators only; no finalize service/UI is claimed.
  await db.hoaDonThuMua.add(invoice);
  await db.table('purchaseDrafts').put({ ...input.draft, customerId: 'KH1', status: 'finalized', invoiceId: 'TM1' });
  await db.table('purchaseFinalizations').put({ format: PURCHASE_FORMAT, invoiceId: 'TM1', draftId: 'D1', lines: input.lines, subtotal: 80001, paidTotal: 80001, finalizedAt: now, paidAt: now });
  await db.sanPham.add({ MaSP: 'SP1', TenSP: 'Áo', NgayNhapKho: '2026-11-11', GiaGocChuKyGiam: 104001, GiaBanHienHanh: 104001, TrangThai: 90, NgayBatDauChuKyGiam: '2026-11-11', MaHDTM: 'TM1', MaKhungGia: 'KG1' });
  await db.productCosts.add({ MaSP: 'SP1', MaHDTM: 'TM1', MaKhungGia: 'KG1', unitCost: 80001, recordedAt: now });
  const origin = { format: PURCHASE_FORMAT, productId: 'SP1', invoiceId: 'TM1', lineId: 'line1', unitCost: 80001, recordedAt: now };
  await db.table('purchaseProvenance').add(origin); await validateCandidatePurchaseReferences(db);
  await db.table('purchaseProvenance').put({ ...origin, unitCost: 80002 }); await expect(validateCandidatePurchaseReferences(db)).rejects.toMatchObject({ code: 'REFERENCE' });
  await db.table('purchaseProvenance').clear(); await expect(validateCandidatePurchaseReferences(db)).rejects.toMatchObject({ code: 'REFERENCE' });
});
it('validates the new-format mixed-price FK without a fabricated legacy aggregate line', async () => {
  await installFinalizedPurchaseGraph(db, { employeeId: 'NVSTAFF', createdBy: 'staff', ownerId });
  expect(await db.chiTietHoaDonTM.count()).toBe(0);
  const before = await snapshot(); await validateReferences(db); expect(await snapshot()).toEqual(before);
  const view = await readCandidatePurchase(db, 'TMGRAPH'); expect(view?.source).toBe(PURCHASE_FORMAT);
  expect(view?.subtotal).toBe(200001); expect(view?.lines).toHaveLength(2);
});
it.each(['missing-origin', 'wrong-line', 'wrong-invoice', 'missing-snapshot', 'wrong-cost', 'unmarked-extra-product'])('rejects damaged explicit metadata: %s without legacy fallback', async mode => {
  await installFinalizedPurchaseGraph(db, { employeeId: 'NVSTAFF', createdBy: 'staff', ownerId });
  if (mode === 'missing-origin') await db.table('purchaseProvenance').delete('SPGRAPH1');
  if (mode === 'wrong-line') await db.table('purchaseProvenance').update('SPGRAPH1', { lineId: 'graph-line2' });
  if (mode === 'wrong-invoice') await db.table('purchaseProvenance').update('SPGRAPH1', { invoiceId: 'OTHER' });
  if (mode === 'missing-snapshot') await db.table('purchaseFinalizations').delete('TMGRAPH');
  if (mode === 'wrong-cost') await db.productCosts.update('SPGRAPH1', { unitCost: 80002 });
  if (mode === 'unmarked-extra-product') await db.sanPham.add({ ...(await db.sanPham.get('SPGRAPH1'))!, MaSP: 'SPEXTRA' });
  const before = await snapshot(); await expect(validateReferences(db)).rejects.toMatchObject({ code: 'REFERENCE' });
  await expect(readCandidatePurchase(db, 'TMGRAPH')).rejects.toMatchObject({ code: 'REFERENCE' }); expect(await snapshot()).toEqual(before);
});
it('keeps legacy product FK strict in candidate schema when no new-format marker exists', async () => {
  await repo.commit({ id: 'legacy-parent', changes: [{ table: 'hoaDonThuMua', kind: 'create', value: { MaHDTM: 'TMOLD', NgayThuMua: now, TongTienTM: 10, TrangThai: 90, MaNV: ownerId, MaKH: 'KH1' } }] });
  await db.sanPham.add({ MaSP: 'SPOLD', TenSP: 'Legacy', MaHDTM: 'TMOLD', MaKhungGia: 'KG1', NgayNhapKho: '2026-11-11', NgayBatDauChuKyGiam: '2026-11-11', GiaGocChuKyGiam: 13, GiaBanHienHanh: 13, TrangThai: 90 });
  await expect(validateReferences(db)).rejects.toMatchObject({ code: 'REFERENCE' });
  await db.chiTietHoaDonTM.add({ MaHDTM: 'TMOLD', MaKhungGia: 'KG1', SoLuong: 1, DonGia: 10, ThanhTien: 10 });
  const before = await snapshot(); await validateReferences(db); expect(await snapshot()).toEqual(before);
});
it('rolls back a transaction which breaks a new-format reverse FK after earlier writes', async () => {
  await installFinalizedPurchaseGraph(db, { employeeId: 'NVSTAFF', createdBy: 'staff', ownerId }); const before = await snapshot();
  await expect(db.transaction('rw', db.tables, async () => {
    await db.khachHang.add({ MaKH: 'ROLLBACK', TenKH: 'Do not persist', SoDienThoaiKH: '0900000077', DiemTichLuy: 0 });
    await db.productCosts.delete('SPGRAPH1'); await validateReferences(db);
  })).rejects.toMatchObject({ code: 'REFERENCE' }); expect(await snapshot()).toEqual(before);
});

it('revalidates later writes in the same transaction instead of reusing a prior valid FK snapshot', async () => {
  await installFinalizedPurchaseGraph(db, { employeeId: 'NVSTAFF', createdBy: 'staff', ownerId });
  const before = await snapshot();
  await expect(db.transaction('rw', db.tables, async () => {
    await validateReferences(db);
    await db.productCosts.delete('SPGRAPH1');
    await validateReferences(db);
  })).rejects.toMatchObject({ code: 'REFERENCE' });
  expect(await snapshot()).toEqual(before);
});
