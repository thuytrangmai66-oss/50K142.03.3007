import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseFinalizationService } from '../../src/services/purchase-finalization';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';
import { InventoryService, inventoryFilters, stockDays, type InventoryEdit } from '../../src/services/inventory';
import { cycleKey, inventoryAttributesKey, priceAtThirtyDays, pendingMilestone, nextVietnamMidnight } from '../../src/domain/inventory';
import { StaffAccountsService } from '../../src/services/staff-accounts';

let db: CoCoDatabase, auth: AuthService, token: string, reference: LocalReferenceData, inventory: InventoryService;
let bracketId: string, invoiceId: string, productId: string;
const now = new Date('2026-11-13T17:00:00Z');
async function snapshot() { return Object.fromEntries(await Promise.all(db.tables.map(async table => [table.name, await table.toArray()]))); }
beforeEach(async () => {
  db = new CoCoDatabase('T01Inventory'); auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'inventory-test!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'inventory-test!')).token;
  reference = new LocalReferenceData(db, () => token); inventory = new InventoryService(db, () => token, () => now);
  bracketId = await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
  const customerId = await reference.createCustomer({ name: 'Khách', phone: '0900000002' });
  const drafts = new PurchaseDraftService(db, () => token), [bracket] = await drafts.catalog();
  let bundle = await drafts.prepareDraft();
  await drafts.commit(await drafts.prepareAdd(bundle, bracket, 2, '80005'));
  bundle = await drafts.load(bundle.draft.id);
  await drafts.commit({ operationId: crypto.randomUUID(), expectedRevision: bundle.draft.revision,
    draft: { ...bundle.draft, customerId, revision: bundle.draft.revision + 1 }, lines: bundle.lines, approvals: bundle.approvals });
  bundle = await drafts.load(bundle.draft.id);
  invoiceId = (await new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING).finalize({ operationId: crypto.randomUUID(), draftId: bundle.draft.id, expectedRevision: bundle.draft.revision })).invoiceId;
  productId = (await db.sanPham.toArray())[0].MaSP;
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

it.each([
  ['2026-11-01', '2026-11-10T16:59:59Z', 9], ['2026-11-01', '2026-11-10T17:00:00Z', 10],
  ['2024-02-28', '2024-03-01T00:00:00+07:00', 2], ['2026-12-31', '2027-01-01T00:00:00+07:00', 1],
])('computes calendar stock days %s at %s without device timezone dependence', (date, at, expected) => {
  expect(stockDays(date, new Date(at))).toBe(expected);
});

it('projects real inventory without writes, price recalculation or losing physical item identities', async () => {
  const before = await snapshot(), rows = await inventory.list(inventoryFilters, 1, 1);
  expect(rows).toMatchObject({ total: 2, pages: 2, types: ['Áo'], brands: ['CoCo'] });
  const item = await inventory.item(productId);
  expect(item).toMatchObject({ id: productId, name: 'Áo', type: 'Áo', brand: 'CoCo', condition: 'Tốt', price: 104007, status: 'available', statusLabel: 'Còn hàng' });
  expect(item.discount).toBeUndefined();
  const second = await inventory.list(inventoryFilters, 2, 1);
  expect(second.rows[0].id).not.toBe(rows.rows[0].id);
  expect(await snapshot()).toEqual(before);
});

it('combines code/name, type, brand and entry day, including empty result and invalid calendar', async () => {
  const product = (await db.sanPham.get(productId))!;
  expect((await inventory.list({ query: ' áo ', type: 'Áo', brand: 'CoCo', date: product.NgayNhapKho }, 1)).total).toBe(2);
  expect((await inventory.list({ ...inventoryFilters, query: productId.toLowerCase() }, 1)).total).toBe(1);
  expect((await inventory.list({ ...inventoryFilters, brand: 'Khác' }, 1)).total).toBe(0);
  await expect(inventory.list({ ...inventoryFilters, date: '2026-02-30' }, 1)).rejects.toThrow();
});

it('reads frozen acquisition attributes after shared bracket rename without changing historical data', async () => {
  await db.khungGiaThuMua.update(bracketId, { LoaiSanPham: 'Quần', ThuongHieu: 'Nhãn mới', GiaMin: 1, GiaMax: 2 });
  const before = await snapshot();
  expect(await inventory.item(productId)).toMatchObject({ type: 'Áo', brand: 'CoCo', price: 104007 });
  expect(await snapshot()).toEqual(before);
});

it('shows sold only through the invoice-specific approved mapping and never changes status while reading', async () => {
  await db.sanPham.update(productId, { TrangThai: 2 });
  const before = await snapshot(); expect((await inventory.item(productId)).status).toBe('sold'); expect(await snapshot()).toEqual(before);
});

it('does not interpret raw legacy codes as the new mapping, including condition code 2', async () => {
  const invoice = (await db.hoaDonThuMua.get(invoiceId))!;
  await db.khungGiaThuMua.add({ MaKhungGia: 'KGOLD', LoaiSanPham: 'Quần', ThuongHieu: 'Cũ', TinhTrang: 2, GiaMin: 1, GiaMax: 100000, MaNV: invoice.MaNV });
  await db.hoaDonThuMua.add({ ...invoice, MaHDTM: 'TMOLD', TongTienTM: 50000, TrangThai: 90 });
  await db.chiTietHoaDonTM.add({ MaHDTM: 'TMOLD', MaKhungGia: 'KGOLD', SoLuong: 1, DonGia: 50000, ThanhTien: 50000 });
  await db.sanPham.add({ ...(await db.sanPham.get(productId))!, MaSP: 'SPOLD', MaHDTM: 'TMOLD', MaKhungGia: 'KGOLD', TrangThai: 1 });
  const before = await snapshot();
  expect(await inventory.item('SPOLD')).toMatchObject({ status: 'legacy', statusLabel: 'Chưa xác định', condition: 'Chưa đối chiếu (mã 2)' });
  expect(await snapshot()).toEqual(before);
});

it.each([30, 45] as const)('displays stored milestone %s only when tied to the current cycle and current price', async milestone => {
  const product = (await db.sanPham.get(productId))!, price = milestone === 30 ? 72805 : 20000;
  await db.sanPham.update(productId, { GiaBanHienHanh: price });
  await db.discountApplications.add({ MaSP: productId, cycleStartedOn: product.NgayBatDauChuKyGiam, milestone,
    scheduledFor: '2026-12-30', executedAt: '2026-12-30T00:00:00+07:00', priceBefore: product.GiaBanHienHanh, priceAfter: price });
  const before = await snapshot(); expect(await inventory.item(productId)).toMatchObject({ price, discount: milestone, originalPrice: 104007 });
  expect(await snapshot()).toEqual(before);
});

it.each(['missing-bracket', 'missing-origin', 'missing-snapshot', 'unknown-status'] as const)('fails visibly for %s instead of fabricating inventory metadata', async mode => {
  if (mode === 'missing-bracket') await db.khungGiaThuMua.delete(bracketId);
  if (mode === 'missing-origin') await db.table('purchaseProvenance').delete(productId);
  if (mode === 'missing-snapshot') await db.table('purchaseFinalizations').delete(invoiceId);
  if (mode === 'unknown-status') await db.sanPham.update(productId, { TrangThai: 250 });
  const before = await snapshot(); await expect(inventory.item(productId)).rejects.toThrow(); expect(await snapshot()).toEqual(before);
});

it('supports both authenticated roles and rejects invalid/revoked sessions without writes', async () => {
  await new StaffAccountsService(db, () => token).create({ name: 'Nhân viên', phone: '0900000003', username: 'staff', password: 'staff-test!' });
  const owner = token; token = (await auth.login('staff', 'staff-test!')).token;
  const before = await snapshot(); expect((await inventory.item(productId)).price).toBe(104007); expect(await snapshot()).toEqual(before);
  await auth.logout(token); await expect(inventory.list(inventoryFilters, 1)).rejects.toThrow();
  token = owner; expect((await inventory.item(productId)).id).toBe(productId);
  token = ''; await expect(inventory.item(productId)).rejects.toThrow();
});

async function edit(price?: string): Promise<InventoryEdit> {
  const item = await inventory.item(productId);
  return { operationId: crypto.randomUUID(), id: item.id, expectedVersion: item.version, name: item.name, type: item.type, brand: item.brand,
    condition: item.conditionCode!, price: price ?? String(item.price), enteredOn: item.enteredOn, status: item.status };
}
it.each(['owner', 'staff'] as const)('resets cycle on a real price change by %s, preserving entry date, costs and invoice snapshots', async role => {
  if (role === 'staff') {
    await new StaffAccountsService(db, () => token).create({ name: 'Nhân viên', phone: '0900000003', username: 'staff', password: 'staff-test!' });
    token = (await auth.login('staff', 'staff-test!')).token;
  }
  const before = await snapshot(), input = await edit('110001'); await inventory.update(input);
  const product = (await db.sanPham.get(productId))!;
  expect(product).toMatchObject({ NgayNhapKho: input.enteredOn, GiaBanHienHanh: 110001, GiaGocChuKyGiam: 110001, NgayBatDauChuKyGiam: '2026-11-14' });
  for (const name of ['hoaDonThuMua', 'chiTietHoaDonTM', 'purchaseFinalizations', 'purchaseProvenance', 'productCosts', 'khungGiaThuMua']) expect(await db.table(name).toArray()).toEqual(before[name]);
  expect(JSON.parse((await db.appMetadata.get(cycleKey(productId)))!.value)).toMatchObject({ productId, startedOn: '2026-11-14' });
});
it('updates only one item current attributes, without resetting unchanged price or editing the shared bracket', async () => {
  const input = await edit(), before = await snapshot();
  await inventory.update({ ...input, name: 'Tên mới', type: 'Quần', brand: 'Nhãn khác', condition: 3 });
  expect(await inventory.item(productId)).toMatchObject({ name: 'Tên mới', type: 'Quần', brand: 'Nhãn khác', condition: 'Mới' });
  expect(await db.khungGiaThuMua.toArray()).toEqual(before.khungGiaThuMua);
  expect((await db.sanPham.get(productId))!.NgayBatDauChuKyGiam).toBe(before.sanPham.find((row: { MaSP: string }) => row.MaSP === productId).NgayBatDauChuKyGiam);
  const other = (await db.sanPham.toArray()).find(row => row.MaSP !== productId)!;
  expect(await inventory.item(other.MaSP)).toMatchObject({ type: 'Áo', brand: 'CoCo', condition: 'Tốt' });
});
it('replays exactly once, rejects changed operation payloads and rechecks revoked sessions on replay', async () => {
  const input = await edit('110000'); await inventory.update(input); const before = await snapshot();
  expect(await inventory.update(input)).toEqual({ duplicate: true }); expect(await snapshot()).toEqual(before);
  await expect(inventory.update({ ...input, price: '120000' })).rejects.toMatchObject({ code: 'OPERATION_REUSED' });
  await auth.logout(token); await expect(inventory.update(input)).rejects.toThrow();
});
it('serializes two connections against one product version and prevents stale overwrite', async () => {
  const otherDb = new CoCoDatabase(db.name), other = new InventoryService(otherDb, () => token, () => now);
  try {
    const input = await edit('110000');
    const results = await Promise.allSettled([inventory.update(input), other.update({ ...input, operationId: crypto.randomUUID(), price: '120000' })]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
    expect((await inventory.item(productId)).version).toBe(input.expectedVersion + 1);
    await expect(inventory.update({ ...input, operationId: crypto.randomUUID() })).rejects.toMatchObject({ code: 'CONFLICT' });
  } finally { otherDb.close(); }
});
it.each(['metadata', 'audit'] as const)('rolls back product/cycle/attributes/version/receipt after %s failure and retries safely', async target => {
  const input = await edit('110000'), before = await snapshot();
  const spy = target === 'metadata' ? vi.spyOn(db.appMetadata, 'put').mockRejectedValue(new Error('metadata failure')) : vi.spyOn(db.auditEntries, 'add').mockRejectedValue(new Error('audit failure'));
  await expect(inventory.update(input)).rejects.toThrow(); spy.mockRestore(); expect(await snapshot()).toEqual(before);
  await inventory.update(input); expect((await inventory.item(productId)).price).toBe(110000);
});
it.each(['fixed-date', 'fixed-status', 'sold', 'empty-name', 'zero-price', 'invalid-condition'] as const)('refuses %s without partial mutation', async mode => {
  const input = await edit();
  if (mode === 'fixed-date') input.enteredOn = '2026-01-01';
  if (mode === 'fixed-status') input.status = 'sold';
  if (mode === 'sold') await db.sanPham.update(productId, { TrangThai: 2 });
  if (mode === 'empty-name') input.name = ' ';
  if (mode === 'zero-price') input.price = '0';
  if (mode === 'invalid-condition') input.condition = 90;
  const before = await snapshot(); await expect(inventory.update(input)).rejects.toThrow(); expect(await snapshot()).toEqual(before);
});
it('refuses corrupt current attribute metadata instead of falling back to an acquisition snapshot', async () => {
  await db.appMetadata.put({ key: inventoryAttributesKey(productId), value: '{bad' });
  await expect(inventory.item(productId)).rejects.toThrow();
});
it.each([[1, 1], [5, 4], [10, 7], [104007, 72805]])('rounds original cycle price %s to final 70%% price %s half-up', (original, expected) => {
  expect(priceAtThirtyDays(original)).toBe(expected);
});
it('prioritizes 45 over missed 30, never applies a milestone twice, and schedules the next Vietnam midnight', () => {
  expect(pendingMilestone('2026-01-01', '2026-01-30', [])).toBeUndefined();
  expect(pendingMilestone('2026-01-01', '2026-01-31', [])).toBe(30);
  expect(pendingMilestone('2026-01-01', '2026-02-14', [30])).toBeUndefined();
  expect(pendingMilestone('2026-01-01', '2026-02-15', [])).toBe(45);
  expect(pendingMilestone('2026-01-01', '2026-02-15', [30])).toBe(45);
  expect(pendingMilestone('2026-01-01', '2026-03-01', [45])).toBeUndefined();
  expect(nextVietnamMidnight(new Date('2026-11-12T16:59:59Z')).toISOString()).toBe('2026-11-12T17:00:00.000Z');
});
