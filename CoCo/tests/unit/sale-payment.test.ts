import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseFinalizationService } from '../../src/services/purchase-finalization';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';
import { SalesDraftService } from '../../src/services/sales';
import { SalesPaymentService, saleInvoiceKey } from '../../src/services/sales-payment';
import { paidSaleSchema, type CheckoutInput, type FinalizeSale } from '../../src/domain/sale-payment';
import { recordVersionKey } from '../../src/repositories';
import { StaffAccountsService } from '../../src/services/staff-accounts';
import { SalesQueriesService } from '../../src/services/sales-queries';
import { DiscountScheduler } from '../../src/services/discount-scheduler';
import * as cryptoHelpers from '../../src/services/auth/crypto';

let db: CoCoDatabase, auth: AuthService, token: string, carts: SalesDraftService, payments: SalesPaymentService;
let productId: string, customerId: string, checkout: CheckoutInput;
beforeEach(async () => {
  db = new CoCoDatabase('G8PaymentTests'); auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'payment-test!', fullName: 'Chủ', phone: '0900000001' });
  token = (await auth.login('owner', 'payment-test!')).token;
  const reference = new LocalReferenceData(db, () => token);
  await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
  customerId = await reference.createCustomer({ name: 'Khách thanh toán', phone: '0900000002' });
  const purchases = new PurchaseDraftService(db, () => token), [bracket] = await purchases.catalog();
  let purchase = await purchases.prepareDraft();
  await purchases.commit(await purchases.prepareAdd(purchase, bracket, 2, '80001'));
  purchase = await purchases.load(purchase.draft.id);
  await purchases.commit({ operationId: crypto.randomUUID(), expectedRevision: purchase.draft.revision,
    draft: { ...purchase.draft, customerId, revision: purchase.draft.revision + 1 }, lines: purchase.lines, approvals: purchase.approvals });
  purchase = await purchases.load(purchase.draft.id);
  await new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING).finalize({
    operationId: crypto.randomUUID(), draftId: purchase.draft.id, expectedRevision: purchase.draft.revision });
  productId = (await db.sanPham.toArray())[0].MaSP;
  carts = new SalesDraftService(db, () => token); payments = new SalesPaymentService(db, () => token);
  checkout = await newCart(productId);
});
afterEach(async () => { vi.useRealTimers(); vi.restoreAllMocks(); await db.delete(); });
async function newCart(id: string): Promise<CheckoutInput> {
  const draft = await carts.prepareDraft(), product = await carts.lookupProduct(id);
  const saved = await carts.addProduct({ operationId: crypto.randomUUID(), draftId: draft.draft.id,
    expectedRevision: 0, productId: id, expectedProductVersion: product.version });
  return { draftId: saved.draft.id, expectedRevision: saved.draft.revision, customerId, method: 'cash', useMembershipDiscount: false };
}
async function command(input = checkout): Promise<FinalizeSale> {
  const quote = await payments.quote(input);
  return { operationId: crypto.randomUUID(), checkout: input, invoiceId: quote.snapshot.invoiceId,
    fingerprint: quote.fingerprint, snapshot: quote.snapshot };
}
async function rows() { return Promise.all(db.tables.map(async table => ({ name: table.name, rows: await table.toArray() }))); }
async function member(points = 50) {
  await carts.registerMembership({ operationId: crypto.randomUUID(), customerId, consent: true });
  await db.khachHang.update(customerId, { DiemTichLuy: points });
}

it('creates a read-only post-discount transfer quote with exact bank/account and no fake invoice', async () => {
  await member(); const before = await rows();
  const quote = await payments.quote({ ...checkout, method: 'transfer', useMembershipDiscount: true });
  expect(quote.snapshot).toMatchObject({ subtotal: 104001, discount: 20800, total: 83201,
    customer: { pointsBefore: 50, pointsUsed: 50, pointsEarned: 8, pointsAfter: 8 } });
  expect(quote.qrPayload).toContain('000697044301100947800469');
  expect(quote.qrPayload).toContain('540583201');
  const fields = (payload: string) => {
    const result: Record<string, string> = {};
    for (let offset = 0; offset < payload.length;) {
      const tag = payload.slice(offset, offset + 2), length = Number(payload.slice(offset + 2, offset + 4));
      const value = payload.slice(offset + 4, offset + 4 + length);
      expect(value).toHaveLength(length); expect(result[tag]).toBeUndefined();
      result[tag] = value; offset += 4 + length;
    }
    return result;
  };
  const root = fields(quote.qrPayload!), provider = fields(root['38']), beneficiary = fields(provider['01']);
  expect(root).toMatchObject({ '00': '01', '01': '12', '53': '704', '54': '83201', '58': 'VN' });
  expect(provider).toMatchObject({ '00': 'A000000727', '02': 'QRIBFTTA' });
  expect(beneficiary).toEqual({ '00': '970443', '01': '0947800469' });
  expect(fields(root['62'])['08']).toBe(quote.snapshot.invoiceId);
  expect(await rows()).toEqual(before);
});

it('G10 quote allocation skips legacy, issued and version-tombstoned sales IDs without writing a reservation', async () => {
  const actor = (await auth.session(token))!;
  const legacy = { MaHDBH: 'BHaaaaaaaa', NgayBan: '2020-01-01T00:00:00Z', TongTien: 7, TienKhuyenMai: 0,
    TichDiem: 0, PTTT: 90, TrangThai: 90, MaKH: customerId, MaNV: actor.employeeId };
  await db.hoaDonBanHang.add(legacy);
  const issued = { key: recordVersionKey('hoaDonBanHang', 'BHbbbbbbbb'), issuedAt: '2020-01-01T00:00:00Z' };
  const version = { key: recordVersionKey('hoaDonBanHang', 'BHcccccccc'), version: 5, updatedAt: '2020-01-01T00:00:00Z' };
  await db.issuedIdentifiers.add(issued); await db.recordVersions.add(version);
  const before = await rows(), random = vi.spyOn(cryptoHelpers, 'randomHex');
  for (const suffix of ['aaaaaaaa', 'bbbbbbbb', 'cccccccc', 'dddddddd']) random.mockReturnValueOnce(suffix);
  const quote = await payments.quote(checkout);
  expect(quote.snapshot.invoiceId).toBe('BHdddddddd');
  expect(await rows()).toEqual(before);
  const result = await payments.finalize({ operationId: crypto.randomUUID(), checkout,
    invoiceId: quote.snapshot.invoiceId, fingerprint: quote.fingerprint, snapshot: quote.snapshot });
  expect(result.invoiceId).toBe('BHdddddddd');
  expect(await db.hoaDonBanHang.get(legacy.MaHDBH)).toEqual(legacy);
  expect(await db.issuedIdentifiers.get(issued.key)).toEqual(issued);
  expect(await db.recordVersions.get(version.key)).toEqual(version);
  expect(await db.hoaDonBanHang.count()).toBe(2);
});

it('G10 exhausted sales IDs do not create an invoice, reservation or payment side effects', async () => {
  await db.issuedIdentifiers.add({ key: recordVersionKey('hoaDonBanHang', 'BHaaaaaaaa'), issuedAt: '2020-01-01T00:00:00Z' });
  const before = await rows(), random = vi.spyOn(cryptoHelpers, 'randomHex').mockReturnValue('aaaaaaaa');
  await expect(payments.quote(checkout)).rejects.toMatchObject({ code: 'DUPLICATE' });
  expect(await rows()).toEqual(before);
  random.mockRestore();
  expect((await payments.quote(checkout)).snapshot.invoiceId).not.toBe('BHaaaaaaaa');
  expect(await rows()).toEqual(before);
});

it('G10 existing member points remain usable after one year and reload without a date-based reset', async () => {
  await member();
  const membership = await db.memberships.get(customerId), future = new Date(Date.now() + 365 * 86400000);
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    vi.setSystemTime(future);
    // Renew the login so an expired authentication session cannot masquerade
    // as point expiry; account data and membership remain the original rows.
    token = (await auth.login('owner', 'payment-test!')).token;
    db.close(); await db.open();
    const before = await rows(), quote = await payments.quote({ ...checkout, useMembershipDiscount: true });
    expect(quote.snapshot.customer).toMatchObject({ pointsBefore: 50, pointsUsed: 50, pointsEarned: 8, pointsAfter: 8 });
    expect((await db.khachHang.get(customerId))?.DiemTichLuy).toBe(50);
    expect(await db.memberships.get(customerId)).toEqual(membership);
    expect(await rows()).toEqual(before);
  } finally { vi.useRealTimers(); }
});

for (const method of ['cash', 'transfer'] as const) it(`finalizes ${method} atomically and never reinterprets a legacy invoice`, async () => {
  await member();
  const employee = await auth.readAuthorized(token, 'sales.create', async actor => actor);
  const legacy = { MaHDBH: 'BHlegacy01', NgayBan: '2020-01-01T00:00:00Z', TongTien: 7, TienKhuyenMai: 3,
    TichDiem: 9, PTTT: 8, TrangThai: 7, MaNV: employee.employeeId, MaKH: customerId };
  await db.hoaDonBanHang.add(legacy);
  const action = await command({ ...checkout, method, useMembershipDiscount: true });
  const result = await payments.finalize(action);
  expect(result.duplicate).toBe(false);
  expect(await db.hoaDonBanHang.get(result.invoiceId)).toMatchObject({ TongTien: 83201, TienKhuyenMai: 20800,
    TichDiem: 8, TrangThai: 1, PTTT: method === 'cash' ? 1 : 2 });
  expect((await db.khachHang.get(customerId))?.DiemTichLuy).toBe(8);
  expect((await db.sanPham.get(productId))?.TrangThai).toBe(2);
  expect(await db.chiTietHoaDonBH.count()).toBe(1);
  expect((await carts.load(checkout.draftId)).draft).toMatchObject({ status: 'finalized', invoiceId: result.invoiceId });
  const paid = paidSaleSchema.parse(JSON.parse((await db.appMetadata.get(saleInvoiceKey(result.invoiceId)))!.value));
  expect(paid.snapshot).toEqual(action.snapshot);
  expect(paid.paidAt).toBe((await db.hoaDonBanHang.get(result.invoiceId))?.NgayBan);
  const after = await rows();
  expect(await payments.finalize(action)).toEqual({ invoiceId: result.invoiceId, duplicate: true });
  expect(await rows()).toEqual(after);
  await expect(payments.finalize({ ...action, operationId: crypto.randomUUID() })).rejects.toThrow();
  await expect(payments.finalize({ ...action, checkout: { ...action.checkout, method: method === 'cash' ? 'transfer' : 'cash' } })).rejects.toMatchObject({ code: 'OPERATION_REUSED' });
  expect(await db.hoaDonBanHang.get(legacy.MaHDBH)).toEqual(legacy);
  expect(await db.appMetadata.get(saleInvoiceKey(legacy.MaHDBH))).toBeUndefined();
});

for (const store of ['hoaDonBanHang', 'chiTietHoaDonBH', 'sanPham', 'khachHang', 'appMetadata', 'issuedIdentifiers', 'recordVersions', 'operations', 'auditEntries'] as const) {
  it(`rolls back the entire sale on ${store} failure and permits the identical retry`, async () => {
    await member(); const action = await command({ ...checkout, useMembershipDiscount: true }), before = await rows();
    const method = ['sanPham', 'khachHang', 'recordVersions'].includes(store) ? 'put' : 'add';
    const failure = vi.spyOn(db[store], method).mockRejectedValueOnce(new Error('injected sale failure'));
    await expect(payments.finalize(action)).rejects.toThrow('injected sale failure');
    failure.mockRestore(); expect(await rows()).toEqual(before);
    await expect(payments.finalize(action)).resolves.toMatchObject({ duplicate: false });
  });
}

it('serializes two tabs selling the same item and rejects a replay after logout', async () => {
  const other = await newCart(productId), a = await command(), b = await command(other);
  const results = await Promise.allSettled([payments.finalize(a), payments.finalize(b)]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(await db.hoaDonBanHang.count()).toBe(1);
  const winner = results[0].status === 'fulfilled' ? a : b;
  await auth.logout(token);
  await expect(payments.finalize(winner)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('rejects stale customer points/version even when two different items are purchased', async () => {
  await member();
  const second = (await db.sanPham.toArray()).find(product => product.MaSP !== productId)!;
  const a = await command({ ...checkout, useMembershipDiscount: true });
  const b = await command({ ...await newCart(second.MaSP), useMembershipDiscount: true });
  await payments.finalize(a);
  await expect(payments.finalize(b)).rejects.toThrow();
  expect(await db.hoaDonBanHang.count()).toBe(1);
  expect((await db.sanPham.get(second.MaSP))?.TrangThai).toBe(1);
});

it('preserves individual sale prices for products from the same bracket and never rewrites purchase history', async () => {
  await member();
  const other = (await db.sanPham.toArray()).find(product => product.MaSP !== productId)!;
  await db.sanPham.update(other.MaSP, { GiaBanHienHanh: 104002 });
  const product = await carts.lookupProduct(other.MaSP);
  const saved = await carts.addProduct({ operationId: crypto.randomUUID(), draftId: checkout.draftId,
    expectedRevision: checkout.expectedRevision, productId: product.id, expectedProductVersion: product.version });
  const history = await Promise.all([db.productCosts.toArray(), db.table('purchaseFinalizations').toArray(), db.table('purchaseProvenance').toArray()]);
  const action = await command({ ...checkout, expectedRevision: saved.draft.revision, useMembershipDiscount: true });
  expect(action.snapshot).toMatchObject({ subtotal: 208003, discount: 41601, total: 166402 });
  const result = await payments.finalize(action);
  expect((await db.chiTietHoaDonBH.toArray()).map(line => line.DonGia).sort()).toEqual([104001, 104002]);
  expect(await Promise.all([db.productCosts.toArray(), db.table('purchaseFinalizations').toArray(), db.table('purchaseProvenance').toArray()])).toEqual(history);
  const receipt = (await db.appMetadata.get(saleInvoiceKey(result.invoiceId)))!.value;
  await db.khungGiaThuMua.update(other.MaKhungGia, { GiaMax: 150000 });
  expect((await db.appMetadata.get(saleInvoiceKey(result.invoiceId)))!.value).toBe(receipt);
});

it('rejects stale revision, stock price/version, and tampered snapshot without any partial writes', async () => {
  const action = await command(), before = await rows();
  await expect(payments.finalize({ ...action, snapshot: { ...action.snapshot, total: 1 } })).rejects.toThrow();
  await expect(payments.finalize({ ...action, checkout: { ...checkout, expectedRevision: 99 } })).rejects.toThrow();
  expect(await rows()).toEqual(before);
  await db.sanPham.update(productId, { GiaBanHienHanh: 99000 });
  await db.recordVersions.update(recordVersionKey('sanPham', productId), { version: 99 });
  await expect(payments.finalize(action)).rejects.toMatchObject({ code: 'CONFLICT' });
  expect(await db.hoaDonBanHang.count()).toBe(0);
});

it('permits nonmember purchases without changing points and refuses a foreign employee cart', async () => {
  const staffAccounts = new StaffAccountsService(db, () => token);
  await staffAccounts.create({ name: 'Nhân viên', phone: '0900000003', username: 'staff', password: 'staff-test!' });
  const staffToken = (await auth.login('staff', 'staff-test!')).token;
  await expect(new SalesPaymentService(db, () => staffToken).quote(checkout)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await payments.finalize(await command());
  expect((await db.khachHang.get(customerId))?.DiemTichLuy).toBe(0);
  expect((await db.hoaDonBanHang.toArray())[0].TichDiem).toBe(0);
});



for (const points of [0, 49, 50, 51]) it(`automatically applies the new discount rule at ${points} points without trusting the old selection flag`, async () => {
  await member(points);
  const quote = await payments.quote({ ...checkout, useMembershipDiscount: false });
  expect(quote.snapshot.customer.pointsUsed).toBe(points >= 50 ? 50 : 0);
  expect(quote.snapshot.discount).toBe(points >= 50 ? 20800 : 0);
  expect((await db.khachHang.get(customerId))?.DiemTichLuy).toBe(points);
});

it('queries real finalized sales with combined filters and stable historical detail without writing data', async () => {
  await member(); const action = await command(), paid = await payments.finalize(action);
  const queries = new SalesQueriesService(db, () => token);
  const empty = { id: '', name: '', phone: '', date: '' };
  let before = await rows();
  const list = await queries.list(empty, 1);
  expect(list.total).toBe(1);
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(list.rows[0].date));
  expect((await queries.list({ id: paid.invoiceId.slice(-4), name: 'THANH TOÁN', phone: '00000002', date }, 1)).total).toBe(1);
  expect((await queries.list({ ...empty, name: 'Không tồn tại', date }, 1)).total).toBe(0);
  const detail = await queries.invoice(paid.invoiceId);
  expect(detail).toMatchObject({ total: 83201, subtotal: 104001, discount: 20800, paymentLabel: 'Tiền mặt', customer: { points: 8 } });
  expect(await rows()).toEqual(before);
  await db.khachHang.update(customerId, { TenKH: 'Tên đã đổi', SoDienThoaiKH: '0900000099' });
  before = await rows();
  expect((await queries.list({ ...empty, name: 'Tên đã đổi', phone: '0099' }, 1)).total).toBe(1);
  expect((await queries.invoice(paid.invoiceId)).customer).toEqual(detail.customer);
  expect(await rows()).toEqual(before);
  await expect(queries.list({ ...empty, date: '2026-02-30' }, 1)).rejects.toThrow();
  await expect(queries.invoice('identifier-too-long')).rejects.toThrow();
  await auth.logout(token);
  await expect(queries.list(empty, 1)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('paginates compatible legacy sales without assigning new meanings or backfilling snapshots', async () => {
  const result = await payments.finalize(await command()), template = (await db.hoaDonBanHang.get(result.invoiceId))!;
  for (let i = 1; i <= 25; i++) {
    const id = `LG${String(i).padStart(8, '0')}`;
    await db.hoaDonBanHang.add({ ...template, MaHDBH: id, TrangThai: 7, PTTT: 8 });
    await db.chiTietHoaDonBH.add({ MaHDBH: id, MaSP: productId, DonGia: 104001, SoLuong: 1, ThanhTien: 104001 });
  }
  const before = await rows(), queries = new SalesQueriesService(db, () => token), filters = { id: 'LG', name: '', phone: '', date: '' };
  const pages = await Promise.all([1, 2, 3].map(page => queries.list(filters, page, 9)));
  expect(pages.map(page => page.rows.length)).toEqual([9, 9, 7]);
  expect(new Set(pages.flatMap(page => page.rows.map(row => row.id))).size).toBe(25);
  expect(await queries.invoice('LG00000001')).toMatchObject({ source: 'legacy', paymentLabel: 'Chưa xác định', customer: { points: undefined } });
  expect(await rows()).toEqual(before);
});

it('refuses malformed or inconsistent saved snapshots instead of falling back to legacy display', async () => {
  const result = await payments.finalize(await command()), queries = new SalesQueriesService(db, () => token);
  const key = saleInvoiceKey(result.invoiceId), original = (await db.appMetadata.get(key))!.value;
  await db.appMetadata.put({ key, value: '{invalid' });
  await expect(queries.invoice(result.invoiceId)).rejects.toThrow();
  await db.appMetadata.put({ key, value: original });
  await db.chiTietHoaDonBH.update([result.invoiceId, productId], { DonGia: 1, ThanhTien: 1 });
  await expect(queries.invoice(result.invoiceId)).rejects.toThrow();
});

it('reads pre-D05 optional-discount invoices without retroactively applying the automatic rule', async () => {
  await member();
  const action = await command(), result = await payments.finalize(action);
  const key = saleInvoiceKey(result.invoiceId), paid = JSON.parse((await db.appMetadata.get(key))!.value);
  paid.snapshot.discount = 0; paid.snapshot.total = 104001;
  Object.assign(paid.snapshot.customer, { pointsUsed: 0, pointsEarned: 10, pointsAfter: 60 });
  await db.appMetadata.put({ key, value: JSON.stringify(paid) });
  await db.hoaDonBanHang.update(result.invoiceId, { TongTien: 104001, TienKhuyenMai: 0, TichDiem: 10 });
  const before = await rows();
  expect(await new SalesQueriesService(db, () => token).invoice(result.invoiceId)).toMatchObject({ total: 104001, discount: 0, customer: { points: 60 } });
  expect(await rows()).toEqual(before);
});

it('allows both roles to read invoices through the service and refuses missing legacy details', async () => {
  const result = await payments.finalize(await command());
  await new StaffAccountsService(db, () => token).create({ name: 'Nhân viên', phone: '0900000003', username: 'staff', password: 'staff-test!' });
  const staffToken = (await auth.login('staff', 'staff-test!')).token;
  const before = await rows();
  expect((await new SalesQueriesService(db, () => staffToken).invoice(result.invoiceId)).id).toBe(result.invoiceId);
  expect(await rows()).toEqual(before);
  const invoice = (await db.hoaDonBanHang.get(result.invoiceId))!;
  await db.hoaDonBanHang.add({ ...invoice, MaHDBH: 'LG00000001' });
  await expect(new SalesQueriesService(db, () => token).invoice('LG00000001')).rejects.toThrow();
});

it('joins paid customer history by customer ID and keeps invoice snapshots after profile changes', async () => {
  await member(); const result = await payments.finalize(await command());
  const gateway = new LocalReferenceData(db, () => token), before = await rows();
  expect((await gateway.history(customerId, 'purchases')).rows).toMatchObject([{ id: result.invoiceId, statusLabel: 'Hoàn tất' }]);
  const invoice = await gateway.invoice(customerId, 'purchases', result.invoiceId);
  expect(invoice).toMatchObject({ source: 'sales-invoice-v1', subtotal: 104001, total: 83201, discount: 20800,
    paymentLabel: 'Tiền mặt', customerPoints: 8, customer: { TenKH: 'Khách thanh toán', SoDienThoaiKH: '0900000002' } });
  expect(await rows()).toEqual(before);
  const customer = await gateway.customer(customerId);
  await gateway.updateCustomer(customerId, customer.version, { name: 'Tên mới', phone: '0900000099' });
  const afterEdit = await rows();
  expect((await gateway.history(customerId, 'purchases')).rows.map(row => row.id)).toEqual([result.invoiceId]);
  expect(await gateway.invoice(customerId, 'purchases', result.invoiceId)).toEqual(invoice);
  expect(await rows()).toEqual(afterEdit);
});

it('does not hide a corrupt paid snapshot behind customer-history legacy fallback', async () => {
  const result = await payments.finalize(await command()), gateway = new LocalReferenceData(db, () => token);
  await db.appMetadata.put({ key: saleInvoiceKey(result.invoiceId), value: '{broken' });
  const before = await rows();
  await expect(gateway.history(customerId, 'purchases')).rejects.toThrow();
  await expect(gateway.invoice(customerId, 'purchases', result.invoiceId)).rejects.toThrow();
  expect(await rows()).toEqual(before);
});

it('serializes the scheduler with payment: sold items cannot be discounted and repriced quotes cannot be paid', async () => {
  const action = await command(), initial = (await db.sanPham.get(productId))!;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(Date.now() + 35 * 86400000));
  const [sale] = await Promise.allSettled([payments.finalize(action), new DiscountScheduler(db).runDue()]);
  const product = (await db.sanPham.get(productId))!;
  const events = (await db.discountApplications.toArray()).filter(event => event.MaSP === productId);
  if (sale.status === 'fulfilled') {
    expect(product.TrangThai).toBe(2); expect(product.GiaBanHienHanh).toBe(initial.GiaBanHienHanh);
    expect(events).toHaveLength(0); expect(await db.hoaDonBanHang.count()).toBe(1);
  } else {
    expect(sale.reason).toMatchObject({ code: 'CONFLICT' });
    expect(product.TrangThai).toBe(1); expect(product.GiaBanHienHanh).toBe(72801);
    expect(events).toHaveLength(1); expect(await db.hoaDonBanHang.count()).toBe(0);
    await expect(payments.finalize(action)).rejects.toThrow();
  }
});
