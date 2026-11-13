import { beforeEach, afterEach, expect, it } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseFinalizationService } from '../../src/services/purchase-finalization';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';
import { StaffAccountsService } from '../../src/services/staff-accounts';

let db: CoCoDatabase, auth: AuthService, reference: LocalReferenceData, drafts: PurchaseDraftService;
let token: string, customerId: string, bracketId: string, invoiceId: string;
const empty = { id: '', phone: '', name: '', date: '' };
async function snapshot() { return Object.fromEntries(await Promise.all(db.tables.map(async t => [t.name, await t.toArray()]))); }
beforeEach(async () => {
  db = new CoCoDatabase('T06Queries'); auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'query-tests!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'query-tests!')).token;
  reference = new LocalReferenceData(db, () => token); drafts = new PurchaseDraftService(db, () => token);
  bracketId = await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
  customerId = await reference.createCustomer({ name: 'Khách lịch sử', phone: '0900000002' });
  let bundle = await drafts.prepareDraft();
  const [bracket] = await drafts.catalog();
  await drafts.commit(await drafts.prepareAdd(bundle, bracket, 2, '80005'));
  bundle = await drafts.load(bundle.draft.id);
  await drafts.commit(await drafts.prepareAdd(bundle, bracket, 1, '90000'));
  bundle = await drafts.load(bundle.draft.id);
  await drafts.commit({ operationId: crypto.randomUUID(), expectedRevision: bundle.draft.revision,
    draft: { ...bundle.draft, customerId, revision: bundle.draft.revision + 1 }, lines: bundle.lines, approvals: bundle.approvals });
  bundle = await drafts.load(bundle.draft.id);
  invoiceId = (await new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING).finalize({
    operationId: crypto.randomUUID(), draftId: bundle.draft.id, expectedRevision: bundle.draft.revision })).invoiceId;
});
afterEach(async () => { await db.delete(); });

it('reads canonical mixed prices, actor and status without writes or current bracket repricing', async () => {
  await db.khungGiaThuMua.update(bracketId, { GiaMin: 1, GiaMax: 2, LoaiSanPham: 'Tên mới' });
  const before = await snapshot(), invoice = await drafts.transaction(invoiceId);
  expect(invoice).toMatchObject({ source: 'purchase-lines-v1', statusCode: 1, statusLabel: 'Hoàn tất', total: 250010, employee: { name: 'Chủ' } });
  expect(invoice.lines.map(l => [l.name, l.quantity, l.unitPrice, l.total])).toEqual([
    ['Áo CoCo', 2, 80005, 160010], ['Áo CoCo', 1, 90000, 90000],
  ]);
  expect((await drafts.listTransactions(empty, 1)).total).toBe(1);
  expect((await reference.history(customerId, 'sales')).rows[0]).toMatchObject({ id: invoiceId, statusLabel: 'Hoàn tất' });
  expect((await reference.history(customerId, 'purchases')).rows).toEqual([]);
  expect(await reference.invoice(customerId, 'sales', invoiceId)).toEqual(invoice);
  expect(await snapshot()).toEqual(before);
});

it('combines trimmed case-insensitive ID/name, phone and Vietnam calendar date with real pagination', async () => {
  // Keep immutable finalized timestamp intact; install independent valid legacy rows.
  const actor = (await auth.session(token))!;
  for (let i = 1; i <= 25; i++) await db.hoaDonThuMua.add({ MaHDTM: `TM${String(i).padStart(2, '0')}`, MaNV: actor.employeeId,
    MaKH: customerId, NgayThuMua: '2026-11-10T18:00:00Z', TongTienTM: 80000, TrangThai: 90 });
  const filters = { id: ' tm ', phone: ' 000002 ', name: ' LỊCH SỬ ', date: '2026-11-11' };
  const first = await drafts.listTransactions(filters, 1, 10), last = await drafts.listTransactions(filters, 3, 10);
  expect(first.total).toBe(25); expect(first.rows.map(r => r.id)).toEqual(Array.from({ length: 10 }, (_, i) => `TM${String(i + 1).padStart(2, '0')}`));
  expect(last.rows.map(r => r.id)).toEqual(['TM21', 'TM22', 'TM23', 'TM24', 'TM25']);
  expect((await drafts.listTransactions({ ...filters, date: '2026-11-10' }, 1)).total).toBe(0);
  expect((await drafts.listTransactions({ ...filters, id: 'TM01' }, 8)).page).toBe(1);
  await expect(drafts.listTransactions({ ...empty, date: '2026-02-30' }, 1)).rejects.toMatchObject({ code: 'VALIDATION' });
});

it('keeps history by customer ID after name/phone change and rejects another customer detail route', async () => {
  const current = await reference.customer(customerId);
  await reference.updateCustomer(customerId, current.version, { name: 'Tên mới', phone: '0900000003' });
  const before = await snapshot();
  expect((await reference.history(customerId, 'sales')).rows.map(r => r.id)).toEqual([invoiceId]);
  expect((await drafts.transaction(invoiceId)).customer).toMatchObject({ MaKH: customerId, TenKH: 'Tên mới', SoDienThoaiKH: '0900000003' });
  await expect(reference.invoice('KHOTHER', 'sales', invoiceId)).rejects.toThrow();
  expect(await snapshot()).toEqual(before);
});

it('retains legacy codes and unit prices without inferring their meaning or changing stored rows', async () => {
  const actor = (await auth.session(token))!;
  await db.hoaDonThuMua.add({ MaHDTM: 'TMOLD', MaNV: actor.employeeId, MaKH: customerId, NgayThuMua: '2026-11-10T18:00:00Z', TongTienTM: 70000, TrangThai: 90 });
  await db.chiTietHoaDonTM.add({ MaHDTM: 'TMOLD', MaKhungGia: bracketId, SoLuong: 2, DonGia: 35000, ThanhTien: 70000 });
  const before = await snapshot();
  expect(await drafts.transaction('TMOLD')).toMatchObject({ source: 'legacy', statusCode: 90, statusLabel: 'Chưa xác định', total: 70000,
    lines: [{ quantity: 2, unitPrice: 35000, total: 70000 }] });
  expect(await snapshot()).toEqual(before);
  await db.close(); await db.open();
  expect((await drafts.transaction('TMOLD')).total).toBe(70000);
});

it.each(['customer', 'employee', 'snapshot', 'cost', 'product', 'mapping', 'total'] as const)('rejects corrupt finalized %s without legacy fallback or repairs', async mode => {
  if (mode === 'customer') await db.khachHang.delete(customerId);
  if (mode === 'employee') await db.nhanVien.delete((await auth.session(token))!.employeeId);
  if (mode === 'snapshot') await db.table('purchaseFinalizations').delete(invoiceId);
  if (mode === 'cost') await db.productCosts.clear();
  if (mode === 'product') await db.sanPham.clear();
  if (mode === 'mapping') await db.appMetadata.put({ key: `purchase-status-mapping:${invoiceId}`, value: '{bad' });
  if (mode === 'total') await db.hoaDonThuMua.update(invoiceId, { TongTienTM: 1 });
  const before = await snapshot();
  await expect(drafts.transaction(invoiceId)).rejects.toThrow();
  expect(await snapshot()).toEqual(before);
});

it.each(['missing-lines', 'wrong-total', 'missing-bracket'] as const)('rejects legacy %s without inventing history', async mode => {
  const actor = (await auth.session(token))!;
  await db.hoaDonThuMua.add({ MaHDTM: 'TMOLD', MaNV: actor.employeeId, MaKH: customerId, NgayThuMua: '2026-11-10T18:00:00Z', TongTienTM: 70000, TrangThai: 90 });
  if (mode !== 'missing-lines') await db.chiTietHoaDonTM.add({ MaHDTM: 'TMOLD', MaKhungGia: mode === 'missing-bracket' ? 'MISSING' : bracketId, SoLuong: 1, DonGia: 60000, ThanhTien: 60000 });
  const before = await snapshot(); await expect(drafts.transaction('TMOLD')).rejects.toThrow(); expect(await snapshot()).toEqual(before);
});

it('requires a valid session for all read entry points', async () => {
  token = '';
  await expect(drafts.transaction(invoiceId)).rejects.toThrow();
  await expect(drafts.listTransactions(empty, 1)).rejects.toThrow();
  await expect(reference.history(customerId, 'sales')).rejects.toThrow();
  await expect(reference.invoice(customerId, 'sales', invoiceId)).rejects.toThrow();
});

it('allows staff to read an owner transaction while keeping role/session and every store unchanged', async () => {
  await new StaffAccountsService(db, () => token).create({ name: 'Nhân viên T06', phone: '0900000004', username: 'staff', password: 'staff-tests!' });
  const ownerToken = token, staffToken = (await auth.login('staff', 'staff-tests!')).token;
  token = staffToken;
  const before = await snapshot();
  expect((await drafts.listTransactions(empty, 1)).rows[0].id).toBe(invoiceId);
  expect((await drafts.transaction(invoiceId)).employee?.name).toBe('Chủ');
  expect((await reference.history(customerId, 'sales')).rows[0].id).toBe(invoiceId);
  expect((await reference.invoice(customerId, 'sales', invoiceId)).total).toBe(250010);
  expect((await auth.session(ownerToken))?.role).toBe('owner');
  expect((await auth.session(staffToken))?.role).toBe('staff');
  expect(await snapshot()).toEqual(before);
});
