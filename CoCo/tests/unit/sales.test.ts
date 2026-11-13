import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { calculateSalesPromotion, salesSubtotal } from '../../src/domain/sales';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseFinalizationService } from '../../src/services/purchase-finalization';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';
import { SalesDraftService } from '../../src/services/sales';
import { DiscountScheduler } from '../../src/services/discount-scheduler';
import { addCalendarDays } from '../../src/domain/inventory';
import { StaffAccountsService } from '../../src/services/staff-accounts';
import { recordVersionKey } from '../../src/repositories';

let db: CoCoDatabase, auth: AuthService, token: string, sales: SalesDraftService;
let productId: string, purchaseId: string, customerId: string;

beforeEach(async () => {
  db = new CoCoDatabase('G8T01SalesTests');
  auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'sales-test!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'sales-test!')).token;
  const reference = new LocalReferenceData(db, () => token);
  await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
  customerId = await reference.createCustomer({ name: 'Khách kiểm thử', phone: '0900000002' });
  const purchases = new PurchaseDraftService(db, () => token);
  const [bracket] = await purchases.catalog();
  let draft = await purchases.prepareDraft();
  await purchases.commit(await purchases.prepareAdd(draft, bracket, 1, '80001'));
  draft = await purchases.load(draft.draft.id);
  await purchases.commit({
    operationId: crypto.randomUUID(), expectedRevision: draft.draft.revision,
    draft: { ...draft.draft, customerId, revision: draft.draft.revision + 1 },
    lines: draft.lines, approvals: draft.approvals,
  });
  draft = await purchases.load(draft.draft.id);
  const result = await new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING).finalize({
    operationId: crypto.randomUUID(), draftId: draft.draft.id, expectedRevision: draft.draft.revision,
  });
  purchaseId = result.invoiceId;
  productId = (await db.sanPham.toArray())[0].MaSP;
  sales = new SalesDraftService(db, () => token);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

function addCommand(draftId: string, expectedRevision: number, version: number, operationId = crypto.randomUUID()) {
  return { operationId, draftId, expectedRevision, productId, expectedProductVersion: version };
}

it('snapshots one available mapped product, computes integer subtotal and does not finalize a sale', async () => {
  const draft = await sales.prepareDraft();
  const snapshot = await sales.lookupProduct(productId);
  expect(snapshot).toMatchObject({ id: productId, unitPrice: 104001, version: 1 });
  const saved = await sales.addProduct(addCommand(draft.draft.id, 0, snapshot.version));
  expect(saved.draft.revision).toBe(1);
  expect(saved.lines[0]).toMatchObject({
    productId, sourcePurchaseId: purchaseId, quantity: 1, unitPrice: 104001, lineTotal: 104001, productVersion: 1,
  });
  expect(await sales.validateDraft(saved.draft.id, saved.draft.revision)).toBe(104001);
  await expect(sales.addProduct(addCommand(saved.draft.id, 1, snapshot.version))).rejects.toThrow('Sản phẩm đã có trong giỏ hàng');
  expect(await db.hoaDonBanHang.count()).toBe(0);
  expect(await db.chiTietHoaDonBH.count()).toBe(0);
  expect(await db.memberships.count()).toBe(0);
  expect((await db.sanPham.get(productId))?.TrangThai).toBe(PURCHASE_STATUS_MAPPING.productAvailable);
  expect((await db.khachHang.toArray())[0].DiemTichLuy).toBe(0);
});

it('persists explicit membership opt-in immediately, audits the actor, and leaves points and sales unchanged', async () => {
  expect(await sales.customerMembership(customerId)).toMatchObject({
    customerId, name: 'Khách kiểm thử', phone: '0900000002', isMember: false, pointsBalance: 0,
  });
  const command = { operationId: crypto.randomUUID(), customerId, consent: true as const };
  const registered = await sales.registerMembership(command);
  expect(registered).toMatchObject({ customerId, isMember: true, pointsBalance: 0 });
  expect(await db.memberships.get(customerId)).toMatchObject({ MaKH: customerId, registeredBy: 'owner' });
  expect(await sales.registerMembership(command)).toEqual(registered);
  expect(await db.memberships.count()).toBe(1);
  expect(await db.operations.get(`sales-membership:${command.operationId}`)).toBeDefined();
  expect(await db.auditEntries.get(`sales-membership:${command.operationId}`)).toMatchObject({ actor: 'owner' });
  expect((await db.khachHang.get(customerId))?.DiemTichLuy).toBe(0);
  expect(await db.hoaDonBanHang.count()).toBe(0);
  expect(await db.chiTietHoaDonBH.count()).toBe(0);
});

it('serializes competing membership opt-ins without duplicate events', async () => {
  const otherDb = new CoCoDatabase(db.name);
  const otherSales = new SalesDraftService(otherDb, () => token);
  const results = await Promise.all([
    sales.registerMembership({ operationId: crypto.randomUUID(), customerId, consent: true }),
    otherSales.registerMembership({ operationId: crypto.randomUUID(), customerId, consent: true }),
  ]);
  expect(results.every(result => result.isMember)).toBe(true);
  expect(await db.memberships.count()).toBe(1);
  const audits = await db.auditEntries.toArray();
  expect(audits.filter(entry => entry.changed.includes(recordVersionKey('memberships', customerId)))).toHaveLength(1);
  otherDb.close();
});

it('rolls back membership if its audit write fails and rejects invalid customer/session access', async () => {
  const command = { operationId: crypto.randomUUID(), customerId, consent: true as const };
  const audit = vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit failure'));
  await expect(sales.registerMembership(command)).rejects.toThrow('audit failure');
  audit.mockRestore();
  expect(await db.memberships.get(customerId)).toBeUndefined();
  await expect(sales.customerMembership('KH00000000')).rejects.toThrow('Không tìm thấy khách hàng');
  await expect(sales.registerMembership({ ...command, customerId: 'KH00000000' })).rejects.toThrow('Không tìm thấy khách hàng');
  await auth.logout(token);
  await expect(sales.registerMembership(command)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('rejects unmapped, sold and missing products without creating a draft', async () => {
  const missing = await sales.prepareDraft();
  await expect(sales.lookupProduct('SP00000000')).rejects.toThrow('Không tìm thấy sản phẩm');
  await expect(sales.addProduct({
    operationId: crypto.randomUUID(), draftId: missing.draft.id, expectedRevision: 0,
    productId: 'SP00000000', expectedProductVersion: 0,
  })).rejects.toThrow('Không tìm thấy sản phẩm');
  await db.appMetadata.delete(`purchase-status-mapping:${purchaseId}`);
  await expect(sales.lookupProduct(productId)).rejects.toThrow('Không thể xác minh trạng thái bán');
  await db.appMetadata.put({ key: `purchase-status-mapping:${purchaseId}`, value: JSON.stringify(PURCHASE_STATUS_MAPPING) });
  await db.sanPham.update(productId, { TrangThai: PURCHASE_STATUS_MAPPING.productSold });
  await expect(sales.lookupProduct(productId)).rejects.toThrow('Sản phẩm không còn đủ điều kiện bán');
  expect(await db.appMetadata.get(`sales-draft:${missing.draft.id}`)).toBeUndefined();
  expect(await db.hoaDonBanHang.count()).toBe(0);
});

it('rejects a stale cart after the G7 scheduler changes the current price and version', async () => {
  const draft = await sales.prepareDraft();
  const product = await sales.lookupProduct(productId);
  const saved = await sales.addProduct(addCommand(draft.draft.id, 0, product.version));
  const record = (await db.sanPham.get(productId))!;
  const dueAt = new Date(`${addCalendarDays(record.NgayBatDauChuKyGiam, 30)}T12:34:56+07:00`);
  await new DiscountScheduler(db, () => dueAt).runDue();
  expect((await db.sanPham.get(productId))?.GiaBanHienHanh).toBe(72801);
  await expect(sales.validateDraft(saved.draft.id, saved.draft.revision)).rejects.toMatchObject({ code: 'CONFLICT' });
  expect((await sales.load(saved.draft.id)).lines[0].unitPrice).toBe(product.unitPrice);
  expect(await db.hoaDonBanHang.count()).toBe(0);
});

it('rejects a product that becomes sold while its snapshot remains in a saved cart', async () => {
  const draft = await sales.prepareDraft();
  const product = await sales.lookupProduct(productId);
  const saved = await sales.addProduct(addCommand(draft.draft.id, 0, product.version));
  await db.sanPham.update(productId, { TrangThai: PURCHASE_STATUS_MAPPING.productSold });
  await expect(sales.validateDraft(saved.draft.id, saved.draft.revision)).rejects.toThrow('Sản phẩm không còn đủ điều kiện bán');
  expect(await db.hoaDonBanHang.count()).toBe(0);
});

it('serializes competing writes to one draft and permits independent unfinalized carts', async () => {
  const draft = await sales.prepareDraft();
  const product = await sales.lookupProduct(productId);
  const otherDb = new CoCoDatabase(db.name);
  const otherSales = new SalesDraftService(otherDb, () => token);
  const results = await Promise.allSettled([
    sales.addProduct(addCommand(draft.draft.id, 0, product.version)),
    otherSales.addProduct(addCommand(draft.draft.id, 0, product.version)),
  ]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect((await sales.load(draft.draft.id)).lines).toHaveLength(1);

  const secondDraft = await otherSales.prepareDraft();
  const secondProduct = await otherSales.lookupProduct(productId);
  await otherSales.addProduct(addCommand(secondDraft.draft.id, 0, secondProduct.version));
  expect(await sales.validateDraft(draft.draft.id, 1)).toBe(product.unitPrice);
  expect(await otherSales.validateDraft(secondDraft.draft.id, 1)).toBe(product.unitPrice);
  expect((await db.sanPham.get(productId))?.TrangThai).toBe(PURCHASE_STATUS_MAPPING.productAvailable);
  expect(await db.hoaDonBanHang.count()).toBe(0);
  otherDb.close();
});

it('rolls back a failed audit write and replays an idempotent add without duplicates', async () => {
  const draft = await sales.prepareDraft();
  const product = await sales.lookupProduct(productId);
  const command = addCommand(draft.draft.id, 0, product.version);
  const audit = vi.spyOn(db.auditEntries, 'add').mockRejectedValueOnce(new Error('audit failure'));
  await expect(sales.addProduct(command)).rejects.toThrow('audit failure');
  audit.mockRestore();
  expect(await db.appMetadata.get(`sales-draft:${draft.draft.id}`)).toBeUndefined();
  expect(await db.operations.where('id').startsWith('sales-cart:').count()).toBe(0);
  expect(await db.hoaDonBanHang.count()).toBe(0);
  const first = await sales.addProduct(command);
  const replay = await sales.addProduct(command);
  expect(replay).toEqual(first);
  expect(replay.lines).toHaveLength(1);
  await expect(sales.addProduct({ ...command, expectedProductVersion: product.version + 1 })).rejects.toMatchObject({ code: 'OPERATION_REUSED' });
});

it('enforces per-employee draft access while both roles can create their own carts', async () => {
  const ownerDraft = await sales.prepareDraft();
  const ownerProduct = await sales.lookupProduct(productId);
  await sales.addProduct(addCommand(ownerDraft.draft.id, 0, ownerProduct.version));
  const staffAccounts = new StaffAccountsService(db, () => token);
  await staffAccounts.create({ name: 'Nhân viên', phone: '0900000003', username: 'staff', password: 'sales-test!' });
  const staffToken = (await auth.login('staff', 'sales-test!')).token;
  const staffSales = new SalesDraftService(db, () => staffToken);
  const staffDraft = await staffSales.prepareDraft();
  const product = await staffSales.lookupProduct(productId);
  const saved = await staffSales.addProduct(addCommand(staffDraft.draft.id, 0, product.version));
  expect(saved.lines).toHaveLength(1);
  await expect(staffSales.load(ownerDraft.draft.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(sales.load(staffDraft.draft.id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await auth.logout(staffToken);
  await expect(staffSales.validateDraft(staffDraft.draft.id, saved.draft.revision)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('cancels a draft without selling the product and rejects empty carts', async () => {
  const draft = await sales.prepareDraft();
  await expect(sales.validateDraft(draft.draft.id, 0)).rejects.toThrow('Hãy thêm ít nhất một sản phẩm');
  const product = await sales.lookupProduct(productId);
  const saved = await sales.addProduct(addCommand(draft.draft.id, 0, product.version));
  await sales.cancelDraft({ operationId: crypto.randomUUID(), draftId: saved.draft.id, expectedRevision: saved.draft.revision });
  await expect(sales.validateDraft(saved.draft.id, saved.draft.revision)).rejects.toMatchObject({ code: 'CONFLICT' });
  expect((await sales.load(saved.draft.id)).draft.status).toBe('cancelled');
  expect((await db.sanPham.get(productId))?.TrangThai).toBe(PURCHASE_STATUS_MAPPING.productAvailable);
  expect(await db.hoaDonBanHang.count()).toBe(0);
});

it('rejects safe-integer subtotal overflow', () => {
  const selectedAt = '2026-11-13T00:00:00.000Z';
  const line = (productId: string, amount: number) => ({
    productId, sourcePurchaseId: 'TM00000001', name: 'Áo', quantity: 1 as const,
    unitPrice: amount, lineTotal: amount, productVersion: 1, selectedAt,
  });
  expect(salesSubtotal([line('SP00000001', Number.MAX_SAFE_INTEGER)])).toBe(Number.MAX_SAFE_INTEGER);
  expect(() => salesSubtotal([line('SP00000001', Number.MAX_SAFE_INTEGER), line('SP00000002', 1)])).toThrow('vượt quá giới hạn');
});

it('rounds member discount on subtotal and awards points only on the amount actually paid', () => {
  expect(calculateSalesPromotion({
    subtotal: 100_003, isMember: true, pointsBalance: 51, useMembershipDiscount: true,
  })).toEqual({
    subtotal: 100_003, discount: 20_001, total: 80_002, isMember: true,
    pointsBefore: 51, pointsUsed: 50, pointsEarned: 8, pointsAfter: 9,
  });
  expect(calculateSalesPromotion({
    subtotal: 100_002, isMember: true, pointsBalance: 50, useMembershipDiscount: true,
  }).discount).toBe(20_000);
});

it('requires 50 member points for the discount and allows members not to use it', () => {
  expect(() => calculateSalesPromotion({
    subtotal: 50_000, isMember: true, pointsBalance: 49, useMembershipDiscount: true,
  })).toThrow('tối thiểu 50 điểm');
  expect(calculateSalesPromotion({
    subtotal: 50_000, isMember: true, pointsBalance: 49, useMembershipDiscount: false,
  })).toMatchObject({ discount: 0, total: 50_000, pointsUsed: 0, pointsEarned: 5, pointsAfter: 54 });
});

it('does not grant member benefits to nonmembers or change their point balance', () => {
  expect(calculateSalesPromotion({
    subtotal: 50_000, isMember: false, pointsBalance: 0, useMembershipDiscount: false,
  })).toMatchObject({ discount: 0, total: 50_000, pointsUsed: 0, pointsEarned: 0, pointsAfter: 0 });
  expect(() => calculateSalesPromotion({
    subtotal: 50_000, isMember: false, pointsBalance: 0, useMembershipDiscount: true,
  })).toThrow('Chỉ thành viên');
});

it('rejects applying member points to an empty cart and point balance overflow', () => {
  expect(() => calculateSalesPromotion({
    subtotal: 0, isMember: true, pointsBalance: 50, useMembershipDiscount: true,
  })).toThrow('giỏ hàng trống');
  expect(() => calculateSalesPromotion({
    subtotal: Number.MAX_SAFE_INTEGER, isMember: true, pointsBalance: 0, useMembershipDiscount: false,
  })).toThrow('vượt quá giới hạn');
});

it('does not permit a stale version when a product is re-priced between lookup and add', async () => {
  const draft = await sales.prepareDraft();
  const snapshot = await sales.lookupProduct(productId);
  const key = recordVersionKey('sanPham', productId);
  const version = (await db.recordVersions.get(key))!;
  await db.sanPham.update(productId, { GiaBanHienHanh: snapshot.unitPrice + 1 });
  await db.recordVersions.put({ ...version, version: version.version + 1 });
  await expect(sales.addProduct(addCommand(draft.draft.id, 0, snapshot.version))).rejects.toMatchObject({ code: 'CONFLICT' });
  expect(await db.appMetadata.get(`sales-draft:${draft.draft.id}`)).toBeUndefined();
});
