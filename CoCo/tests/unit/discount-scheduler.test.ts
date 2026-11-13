import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseFinalizationService } from '../../src/services/purchase-finalization';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';
import { DiscountScheduler } from '../../src/services/discount-scheduler';
import { InventoryService, type InventoryEdit } from '../../src/services/inventory';
import { addCalendarDays } from '../../src/domain/inventory';

let db: CoCoDatabase, token: string, scheduler: DiscountScheduler, inventory: InventoryService, productId: string, baseDay: string, now: Date;
const atDay = (day: number) => { now = new Date(`${addCalendarDays(baseDay, day)}T12:34:56+07:00`); };
async function stores() { return Object.fromEntries(await Promise.all(db.tables.map(async t => [t.name, await t.toArray()]))); }
async function priceCommand(price: string): Promise<InventoryEdit> {
  const item = await inventory.item(productId);
  return { operationId: crypto.randomUUID(), id: item.id, expectedVersion: item.version, name: item.name, type: item.type, brand: item.brand,
    condition: item.conditionCode!, price, enteredOn: item.enteredOn, status: item.status };
}
beforeEach(async () => {
  db = new CoCoDatabase('G7SchedulerTests'); const auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'scheduler-test!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'scheduler-test!')).token;
  const reference = new LocalReferenceData(db, () => token);
  await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
  const customerId = await reference.createCustomer({ name: 'Khách', phone: '0900000002' }), drafts = new PurchaseDraftService(db, () => token);
  const [bracket] = await drafts.catalog(); let bundle = await drafts.prepareDraft();
  await drafts.commit(await drafts.prepareAdd(bundle, bracket, 2, '80005')); bundle = await drafts.load(bundle.draft.id);
  await drafts.commit({ operationId: crypto.randomUUID(), expectedRevision: bundle.draft.revision, draft: { ...bundle.draft, customerId, revision: bundle.draft.revision + 1 }, lines: bundle.lines, approvals: bundle.approvals });
  bundle = await drafts.load(bundle.draft.id);
  await new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING).finalize({ operationId: crypto.randomUUID(), draftId: bundle.draft.id, expectedRevision: bundle.draft.revision });
  const product = (await db.sanPham.toArray())[0]; productId = product.MaSP; baseDay = product.NgayNhapKho; atDay(0);
  scheduler = new DiscountScheduler(db, () => now); inventory = new InventoryService(db, () => token, () => now);
});
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

it.each([[29, 104007, 0], [30, 72805, 30], [44, 72805, 30], [45, 20000, 45], [80, 20000, 45]])('handles day %s using original cycle price and 45-day catch-up priority', async (age, price, milestone) => {
  atDay(age); const before = await db.sanPham.get(productId); await scheduler.runDue();
  expect((await db.sanPham.get(productId))!.GiaBanHienHanh).toBe(price);
  expect((await db.sanPham.get(productId))!.NgayNhapKho).toBe(before!.NgayNhapKho);
  const applied = await db.discountApplications.where('MaSP').equals(productId).toArray();
  expect(applied.map(r => r.milestone)).toEqual(milestone ? [milestone] : []);
  if (milestone) expect(applied[0]).toMatchObject({ scheduledFor: addCalendarDays(baseDay, milestone), executedAt: now.toISOString() });
  expect((await scheduler.read(token)).latest).toMatchObject({ status: 'success', scanned: 2, errors: 0 });
});
it('applies 30 then 45 once across reload/day checks without compounding or rewriting history', async () => {
  const before = await stores(); atDay(30); await scheduler.runDue(); const after30 = await stores();
  await scheduler.runDue(); expect(await stores()).toEqual(after30);
  atDay(31); await scheduler.runDue(); expect((await db.sanPham.get(productId))!.GiaBanHienHanh).toBe(72805);
  atDay(45); await scheduler.runDue(); expect((await db.discountApplications.where('MaSP').equals(productId).toArray()).map(r => r.milestone)).toEqual([30, 45]);
  for (const table of ['hoaDonThuMua', 'purchaseFinalizations', 'purchaseProvenance', 'productCosts', 'issuedIdentifiers']) expect(await db.table(table).toArray()).toEqual(before[table]);
});
it('sets exactly 20000 even when the current/base price is lower, per confirmed P10', async () => {
  await inventory.update(await priceCommand('10000')); atDay(45); await scheduler.runDue();
  expect((await db.sanPham.get(productId))!.GiaBanHienHanh).toBe(20000);
  expect((await db.discountApplications.where('MaSP').equals(productId).toArray())[0]).toMatchObject({ priceBefore: 10000, priceAfter: 20000, milestone: 45 });
});
it('skips sold products, preserving their prices and never inventing a legacy code mapping', async () => {
  await db.sanPham.update(productId, { TrangThai: 2 }); atDay(45); await scheduler.runDue();
  expect((await db.sanPham.get(productId))!.GiaBanHienHanh).toBe(104007);
  expect(await db.discountApplications.where('MaSP').equals(productId).count()).toBe(0);
});
it('serializes two browser connections, producing a single run and one event per product/cycle/milestone', async () => {
  const otherDb = new CoCoDatabase(db.name), other = new DiscountScheduler(otherDb, () => now);
  try {
    atDay(30); await Promise.all([scheduler.runDue(), other.runDue()]);
    expect(await db.discountApplications.count()).toBe(2);
    expect((await scheduler.read(token)).runs).toHaveLength(1);
    expect((await db.auditEntries.filter(r => r.id.startsWith('discount:')).toArray())).toHaveLength(2);
  } finally { otherDb.close(); }
});
it('rolls back a failed price/milestone/version/audit transaction and retries only missing milestones', async () => {
  atDay(30); const original = db.auditEntries.add.bind(db.auditEntries);
  const spy = vi.spyOn(db.auditEntries, 'add').mockImplementation((...args) => args[0].id.startsWith('discount:') ? Promise.reject(new Error('audit failure')) as never : original(...args));
  await scheduler.runDue(); spy.mockRestore();
  expect(await db.discountApplications.count()).toBe(0); expect((await db.sanPham.get(productId))!.GiaBanHienHanh).toBe(104007);
  expect((await scheduler.read(token)).latest).toMatchObject({ status: 'error', scanned: 2, errors: 2, updated: 0 });
  await scheduler.runDue(); expect(await db.discountApplications.count()).toBe(2); expect((await scheduler.read(token)).latest.status).toBe('success');
});
it('recovers an expired interrupted claim after partial commit without applying the first product twice', async () => {
  atDay(30); const put = db.appMetadata.put.bind(db.appMetadata); let interrupted = false;
  const spy = vi.spyOn(db.appMetadata, 'put').mockImplementation((...args) => {
    const row = args[0];
    if (row.key.startsWith('discount-run:') && JSON.parse(row.value).scanned >= 2) interrupted = true;
    if (interrupted) return Promise.reject(new Error('process interrupted')) as never;
    return put(...args);
  });
  await scheduler.runDue(); spy.mockRestore(); expect(await db.discountApplications.count()).toBe(1);
  now = new Date(now.getTime() + 31000); await scheduler.runDue();
  expect(await db.discountApplications.count()).toBe(2);
  expect((await scheduler.read(token)).runs.some(r => r.status === 'interrupted')).toBe(true);
  expect((await db.auditEntries.filter(r => r.id.startsWith('discount:')).toArray())).toHaveLength(2);
});
it('rejects stale editor saves after an automatic price update and resets the new cycle after a fresh save', async () => {
  atDay(30); const stale = await priceCommand('120000'); await scheduler.runDue();
  await expect(inventory.update(stale)).rejects.toMatchObject({ code: 'CONFLICT' });
  await inventory.update(await priceCommand('120000')); expect((await db.sanPham.get(productId))!.NgayNhapKho).toBe(baseDay);
  atDay(31); await scheduler.runDue(); expect((await db.sanPham.get(productId))!.GiaBanHienHanh).toBe(120000);
});
it('requires monitor read permission/session and has no UI run capability', async () => {
  await expect(scheduler.read('')).rejects.toThrow();
});
it('does not conceal a daily completion receipt whose journal is missing', async () => {
  const day = baseDay; await db.appMetadata.put({ key: `discount-day:${day}`, value: 'missing-run' });
  const before = await stores();
  await expect(scheduler.runDue()).rejects.toThrow(); await expect(scheduler.read(token)).rejects.toThrow();
  expect(await stores()).toEqual(before);
});
