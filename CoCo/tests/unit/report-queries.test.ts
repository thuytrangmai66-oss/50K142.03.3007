import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CoCoDatabase } from '../../src/db/schema';
import { AuthService } from '../../src/services/auth/service';
import { LocalReferenceData } from '../../src/services/reference-data/local';
import { PurchaseDraftService } from '../../src/services/purchase-drafts';
import { PurchaseFinalizationService } from '../../src/services/purchase-finalization';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';
import { SalesDraftService } from '../../src/services/sales';
import { SalesPaymentService, saleInvoiceKey } from '../../src/services/sales-payment';
import { StaffAccountsService } from '../../src/services/staff-accounts';
import { ReportQueriesService } from '../../src/services/report-queries';
import { paidSaleSchema, type CheckoutInput } from '../../src/domain/sale-payment';
import { DashboardService } from '../../src/services/dashboard';

let db: CoCoDatabase, auth: AuthService, token: string, customerId: string, products: string[];
let reference: LocalReferenceData, carts: SalesDraftService, payments: SalesPaymentService, reports: ReportQueriesService;
const year = { kind: 'year', value: '2026' } as const;

it('T05 staff summary counts all-store verified purchases/imports, sales and existing newly created profiles by Vietnam day', async () => {
  // Fixture was purchased/created the previous VN day by the owner, not staff.
  const dashboard = new DashboardService(db, () => token, () => new Date('2026-11-12T23:00:00+07:00'));
  expect(await dashboard.staffSummary()).toMatchObject({ date: '2026-11-12', purchaseOrders: 1, importedProducts: 2,
    salesOrders: 0, customers: { newCustomerCount: 1 } });
  await pay([products[0]]);
  const before = await rows(), today = await new DashboardService(db, () => token).staffSummary();
  expect(today).toMatchObject({ date: '2026-11-13', purchaseOrders: 0, importedProducts: 0, salesOrders: 1, customers: { newCustomerCount: 0 } });
  expect(today).not.toHaveProperty('revenue'); expect(today).not.toHaveProperty('pendingApprovals'); expect(await rows()).toEqual(before);
});

it.each(['duplicate-lines', 'unsafe-total'])('T06 invalid purchase snapshot %s is quarantined without hiding storage errors', async kind => {
  const [snapshot] = await db.table('purchaseFinalizations').toArray();
  const lines = kind === 'duplicate-lines' ? [snapshot.lines[0], snapshot.lines[0]]
    : [{ ...snapshot.lines[0], unitCost: Number.MAX_SAFE_INTEGER }];
  await db.table('purchaseFinalizations').put({ ...snapshot, lines });
  const before = await rows(), result = await reports.purchaseCost(year);
  expect(result.coverage.unverifiedRecords).toBe(1);
  expect(result.summary.totalCost).toBe(0);
  expect(await rows()).toEqual(before);
});

it('T05 owner KPI uses verified paid instants, stock markers and a readonly consistent snapshot', async () => {
  await pay([products[0]], '2026-11-12T23:59:59+07:00');
  await pay([products[1]], '2026-11-13T00:00:00+07:00');
  const before = await rows(), summary = await new DashboardService(db, () => token).ownerSummary();
  expect(summary).toMatchObject({ date: '2026-11-13', revenue: { today: 104001, yesterday: 104001, comparison: { status: 'DEFINED', percent: 0 } },
    orders: { today: 1, yesterday: 1, delta: 0 }, pendingApprovals: 0, stock: { knownAvailableCount: 0, unverifiedCount: 0 } });
  expect(await rows()).toEqual(before);
});
it('T05 uses a verified month-end baseline and never invents a percentage when it is zero', async () => {
  const before = await rows(), summary = await new DashboardService(db, () => token).ownerSummary();
  expect(summary.revenue.comparison).toEqual({ status: 'NO_BASELINE', percent: null });
  expect(summary.stock).toMatchObject({ knownAvailableCount: 2, unverifiedCount: 0,
    comparison: { status: 'NO_BASELINE', previousCount: 0, currentCount: 2, percent: null, baselineBefore: '2026-10-31T17:00:00.000Z' } });
  expect(await rows()).toEqual(before);
});
it('G9-D05 reconstructs prior-month stock from complete purchase evidence without writing a snapshot', async () => {
  const before = await rows();
  const result = await new DashboardService(db, () => token, () => new Date('2026-12-14T09:00:00+07:00')).ownerSummary();
  expect(result.stock.comparison).toMatchObject({ status: 'DEFINED', currentCount: 2, previousCount: 2, percent: 0, baselineBefore: '2026-11-30T17:00:00.000Z' });
  expect(await rows()).toEqual(before);
  db.close(); await db.open();
  expect((await new DashboardService(db, () => token, () => new Date('2026-12-14T09:00:00+07:00')).ownerSummary()).stock).toEqual(result.stock);
});
it('G9-D05 excludes an item sold before cutoff from both counts instead of assuming every imported item was still available', async () => {
  await pay([products[0]]);
  const before = await rows();
  const result = await new DashboardService(db, () => token, () => new Date('2026-12-14T09:00:00+07:00')).ownerSummary();
  expect(result.stock.comparison).toMatchObject({ status: 'DEFINED', previousCount: 1, currentCount: 1, percent: 0 });
  expect(await rows()).toEqual(before);
});
it('G9-D05 counts an item sold exactly at Vietnam month start in previous stock and not in current stock', async () => {
  vi.setSystemTime(new Date('2026-12-01T00:00:00+07:00'));
  token = (await auth.login('owner', 'report-test!')).token;
  await pay([products[0]], '2026-12-01T00:00:00+07:00');
  const before = await rows(), result = await new DashboardService(db, () => token).ownerSummary();
  expect(result.stock.comparison).toMatchObject({ status: 'DEFINED', previousCount: 2, currentCount: 1, percent: -50 });
  expect(await rows()).toEqual(before);
});
it.each(['missing-paid-at', 'missing-sale-proof', 'missing-purchase-receipt', 'legacy-status-only',
  'malformed-status-mapping', 'missing-purchase-time', 'availability-with-sale-link'])('G9-D05 %s stays insufficient instead of inferring a historical state', async kind => {
  if (kind.startsWith('missing-sale') || kind === 'missing-paid-at' || kind === 'availability-with-sale-link') {
    const { result } = await pay([products[0]]), key = saleInvoiceKey(result.invoiceId);
    if (kind === 'missing-sale-proof') await db.appMetadata.delete(key);
    else if (kind === 'availability-with-sale-link') await db.sanPham.update(products[0], { TrangThai: 1 });
    else {
      const raw = JSON.parse((await db.appMetadata.get(key))!.value); delete raw.paidAt;
      await db.appMetadata.put({ key, value: JSON.stringify(raw) });
    }
  } else if (kind === 'missing-purchase-receipt') {
    const receipt = (await db.operations.toArray()).find(row => row.id.startsWith('purchase-finalize:'))!;
    await db.operations.delete(receipt.id);
  } else if (kind === 'missing-purchase-time') {
    const [paid] = await db.table('purchaseFinalizations').toArray(); delete paid.paidAt;
    await db.table('purchaseFinalizations').put(paid);
  } else if (kind === 'malformed-status-mapping') {
    const [invoice] = await db.hoaDonThuMua.toArray();
    await db.appMetadata.put({ key: `purchase-status-mapping:${invoice.MaHDTM}`, value: '{' });
  } else await db.sanPham.update(products[0], { TrangThai: 2 });
  const before = await rows();
  expect((await new DashboardService(db, () => token, () => new Date('2026-12-14T09:00:00+07:00')).ownerSummary()).stock.comparison)
    .toMatchObject({ status: 'INSUFFICIENT_EVIDENCE', percent: null });
  expect(await rows()).toEqual(before);
});
it('G9-D05 a real storage failure propagates without returning a false stock percentage', async () => {
  vi.spyOn(db.operations, 'get').mockRejectedValueOnce(new DOMException('stock proof read fault', 'UnknownError'));
  await expect(new DashboardService(db, () => token).ownerSummary()).rejects.toThrow('stock proof read fault');
});
it('T05 pending KPI follows the active approval revision and excludes cancelled drafts', async () => {
  const purchases = new PurchaseDraftService(db, () => token), [bracket] = await purchases.catalog();
  let draft = await purchases.prepareDraft();
  await purchases.commit(await purchases.prepareAdd(draft, bracket, 1, '120000'));
  const dashboard = new DashboardService(db, () => token);
  expect((await dashboard.ownerSummary()).pendingApprovals).toBe(1);
  draft = await purchases.load(draft.draft.id);
  await purchases.removeOrCancel(draft, crypto.randomUUID());
  expect((await dashboard.ownerSummary()).pendingApprovals).toBe(0);
});
it('T05 unverified legacy sales and unknown stock states do not become confirmed KPI values', async () => {
  const [invoice] = await db.hoaDonThuMua.toArray();
  await db.appMetadata.delete(`purchase-status-mapping:${invoice.MaHDTM}`);
  const before = await rows(), summary = await new DashboardService(db, () => token).ownerSummary();
  expect(summary.stock).toMatchObject({ knownAvailableCount: 0, unverifiedCount: 2 });
  expect(summary.revenue.today).toBe(0); expect(await rows()).toEqual(before);
});
it('T05 staff home.read permission cannot expose owner financial KPIs', async () => {
  await new StaffAccountsService(db, () => token).create({ name: 'Nhân viên', phone: '0900000003', username: 'staffdash', password: 'dashboard-staff!' });
  const staff = await auth.login('staffdash', 'dashboard-staff!'), before = await rows();
  await expect(new DashboardService(db, () => staff.token).ownerSummary()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect(await rows()).toEqual(before);
  await auth.logout(token);
  await expect(new DashboardService(db, () => token).ownerSummary()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

it('T04 reconciles actual revenue, cost of sold items and cash outflow without counting unsold stock in profit', async () => {
  await pay([products[0]]);
  const before = await rows();
  expect((await reports.financial(year, 'profit')).summary).toEqual({ count: 1, incoming: 104001, outgoing: 80001, net: 24000 });
  expect((await reports.financial(year, 'cash-flow')).summary).toEqual({ count: 2, incoming: 104001, outgoing: 160002, net: -56001 });
  expect((await reports.financial({ kind: 'day', value: '2026-11-13' }, 'cash-flow')).summary).toEqual({ count: 1, incoming: 104001, outgoing: 0, net: 104001 });
  expect(await rows()).toEqual(before);
  db.close(); await db.open(); expect((await reports.financial(year, 'profit')).summary.net).toBe(24000);
});
it('T04 reports outflow-only days and zero totals for empty profit/periods', async () => {
  const before = await rows();
  expect((await reports.financial(year, 'profit')).summary).toEqual({ count: 0, incoming: 0, outgoing: 0, net: 0 });
  expect((await reports.financial(year, 'cash-flow')).rows[0]).toMatchObject({ date: '2026-11-12', incoming: 0, outgoing: 160002, net: -160002 });
  expect((await reports.financial({ kind: 'year', value: '2000' }, 'cash-flow')).summary.net).toBe(0);
  expect(await rows()).toEqual(before);
});
it('T04 permits a real loss and never clips negative profit to zero', async () => {
  await db.sanPham.update(products[0], { GiaBanHienHanh: 10000 });
  await pay([products[0]]);
  expect((await reports.financial(year, 'profit')).summary.net).toBe(-70001);
});
it('T04 refuses unknown costs on an otherwise verified sale instead of manufacturing zero cost', async () => {
  await pay([products[0]]); await db.productCosts.update(products[0], { unitCost: 99999 });
  const before = await rows();
  await expect(reports.financial(year, 'profit')).rejects.toMatchObject({ code: 'REFERENCE' });
  expect(await rows()).toEqual(before);
});
it('T04 ignores unverified legacy sales/purchases and preserves their original numeric codes', async () => {
  const [purchase] = await db.hoaDonThuMua.toArray();
  await db.hoaDonThuMua.add({ ...purchase, MaHDTM: 'TMOLD' });
  const { result } = await pay([products[0]]), sale = (await db.hoaDonBanHang.get(result.invoiceId))!;
  await db.hoaDonBanHang.add({ ...sale, MaHDBH: 'BHOLD' });
  const before = await rows(), report = await reports.financial(year, 'cash-flow');
  expect(report.summary.net).toBe(-56001); expect(report.coverage.sales.unverifiedRecords).toBe(1); expect(report.coverage.purchases.unverifiedRecords).toBe(1);
  expect(await rows()).toEqual(before);
});
it('T04 retains costs of sold items across subsequent price bracket edits', async () => {
  await pay(products);
  const bracket = (await reference.brackets(1)).rows[0];
  await reference.updateBracket(bracket.record.MaKhungGia, bracket.version, { productType: 'Áo', brand: 'CoCo', condition: '2', min: '1', max: '500000' });
  expect((await reports.financial(year, 'profit')).summary).toMatchObject({ incoming: 208002, outgoing: 160002, net: 48000 });
});
it('T04 stock age uses import day, includes exact threshold and filters available items only', async () => {
  await pay([products[0]], '2026-11-14T00:00:00+07:00');
  const before = await rows(), filters = { minDays: 2, type: 'Áo', brand: 'CoCo' };
  const result = await reports.agedStock(filters);
  expect(result.total).toBe(1); expect(result.rows[0]).toMatchObject({ id: products[1], days: 2, cost: 80001, price: 104001, status: 'Đang bán' });
  expect((await reports.agedStock({ ...filters, minDays: 3 })).total).toBe(0);
  expect((await reports.agedStock({ ...filters, brand: 'Không có' })).total).toBe(0);
  expect(await rows()).toEqual(before);
});
it.each([0, -1, 0.5, Number.NaN])('T04 rejects invalid minimum stock days %s at the service boundary', async minDays => {
  await expect(reports.agedStock({ minDays, type: '', brand: '' })).rejects.toThrow();
});
it('T04 does not infer stock availability from an untagged legacy numeric state', async () => {
  vi.setSystemTime(new Date('2026-11-14T00:00:00+07:00'));
  const [invoice] = await db.hoaDonThuMua.toArray();
  await db.appMetadata.delete(`purchase-status-mapping:${invoice.MaHDTM}`);
  const before = await rows(), result = await reports.agedStock({ minDays: 1, type: '', brand: '' });
  expect(result.total).toBe(0); expect(result.excluded).toHaveLength(2); expect(await rows()).toEqual(before);
});

it('T03 counts physical items and actual purchase cost, keeps snapshots after price edits and never writes', async () => {
  const bracket = (await reference.brackets(1)).rows[0];
  await reference.updateBracket(bracket.record.MaKhungGia, bracket.version, { productType: 'Áo', brand: 'CoCo', condition: '2', min: '1', max: '200000' });
  const before = await rows();
  const result = await reports.purchaseCost(year);
  expect(result.summary).toEqual({ invoiceCount: 1, productCount: 2, totalCost: 160002, averageCost: 160002 });
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0]).toMatchObject({ date: '2026-11-12', productCount: 2, totalCost: 160002 });
  expect(await reports.purchaseCost({ kind: 'day', value: '2026-11-13' })).toMatchObject({ summary: { invoiceCount: 0, totalCost: 0, averageCost: 0 } });
  expect(await rows()).toEqual(before);
});
it('T03 excludes legacy presence/date without reinterpreting its numeric state or changing raw rows', async () => {
  const [invoice] = await db.hoaDonThuMua.toArray();
  await db.hoaDonThuMua.add({ ...invoice, MaHDTM: 'TMLEGACY' });
  const before = await rows(), result = await reports.purchaseCost(year);
  expect(result.summary.invoiceCount).toBe(1); expect(result.coverage.unverifiedRecords).toBe(1);
  expect(await rows()).toEqual(before);
});
it.each([undefined, '2026-02-30T00:00:00Z'])('T03 excludes missing/invalid paidAt %s without substituting invoice/audit/finalization time', async paidAt => {
  const [saved] = await db.table('purchaseFinalizations').toArray();
  await db.table('purchaseFinalizations').put({ ...saved, paidAt });
  const before = await rows(), result = await reports.purchaseCost(year);
  expect(result.summary).toMatchObject({ invoiceCount: 0, productCount: 0, totalCost: 0, averageCost: 0 });
  expect(result.classifications[0].verification).toBe('VERIFIED'); expect(result.classifications[0].eligibility).not.toBe('ELIGIBLE');
  expect(await rows()).toEqual(before);
});
it('T03 refuses inconsistent physical cost evidence rather than recomputing it from the current bracket', async () => {
  await db.productCosts.update(products[0], { unitCost: 99999 });
  const before = await rows(), result = await reports.purchaseCost(year);
  expect(result.coverage.unverifiedRecords).toBe(1); expect(result.summary.totalCost).toBe(0); expect(await rows()).toEqual(before);
});
it('T03 does not hide native read errors as an empty report and refuses an unauthenticated service caller', async () => {
  const spy = vi.spyOn(db.hoaDonThuMua, 'toArray').mockRejectedValueOnce(new Error('native read failed'));
  await expect(reports.purchaseCost(year)).rejects.toThrow('native read failed'); spy.mockRestore();
  await expect(new ReportQueriesService(db, () => null).purchaseCost(year)).rejects.toThrow();
});
it('T03 reconciles mixed prices in the same bracket and counts finalization replay once', async () => {
  const purchases = new PurchaseDraftService(db, () => token), [bracket] = await purchases.catalog();
  let draft = await purchases.prepareDraft();
  for (const cost of ['70001', '90001']) {
    await purchases.commit(await purchases.prepareAdd(draft, bracket, 2, cost));
    draft = await purchases.load(draft.draft.id);
  }
  await purchases.commit({ operationId: crypto.randomUUID(), expectedRevision: draft.draft.revision,
    draft: { ...draft.draft, customerId, revision: draft.draft.revision + 1 }, lines: draft.lines, approvals: draft.approvals });
  draft = await purchases.load(draft.draft.id);
  const finalizer = new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING);
  const command = { operationId: crypto.randomUUID(), draftId: draft.draft.id, expectedRevision: draft.draft.revision };
  await finalizer.finalize(command); await finalizer.finalize(command);
  const before = await rows();
  expect((await reports.purchaseCost(year)).summary).toEqual({ invoiceCount: 2, productCount: 6, totalCost: 480006, averageCost: 240003 });
  expect(await rows()).toEqual(before);
});
it('T03 requires the finalization receipt even when the snapshot and date exist', async () => {
  const receipt = (await db.operations.toArray()).find(row => row.id.startsWith('purchase-finalize:'))!;
  await db.operations.delete(receipt.id);
  expect((await reports.purchaseCost(year)).summary.invoiceCount).toBe(0);
});

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-12T16:00:00Z'));
  db = new CoCoDatabase('G9RevenueCandidateTests'); auth = new AuthService(db);
  await auth.bootstrap({ username: 'owner', password: 'report-test!', fullName: 'Chủ kiểm thử', phone: '0900000001' });
  token = (await auth.login('owner', 'report-test!')).token;
  reference = new LocalReferenceData(db, () => token);
  await reference.createBracket({ productType: 'Áo', brand: 'CoCo', condition: '2', min: '50000', max: '100000' });
  customerId = await reference.createCustomer({ name: 'Khách báo cáo', phone: '0900000002' });
  const purchases = new PurchaseDraftService(db, () => token), [bracket] = await purchases.catalog();
  let purchase = await purchases.prepareDraft();
  await purchases.commit(await purchases.prepareAdd(purchase, bracket, 2, '80001'));
  purchase = await purchases.load(purchase.draft.id);
  await purchases.commit({ operationId: crypto.randomUUID(), expectedRevision: purchase.draft.revision,
    draft: { ...purchase.draft, customerId, revision: purchase.draft.revision + 1 }, lines: purchase.lines, approvals: purchase.approvals });
  purchase = await purchases.load(purchase.draft.id);
  await new PurchaseFinalizationService(db, () => token, PURCHASE_STATUS_MAPPING).finalize({ operationId: crypto.randomUUID(),
    draftId: purchase.draft.id, expectedRevision: purchase.draft.revision });
  products = (await db.sanPham.toArray()).map(row => row.MaSP);
  carts = new SalesDraftService(db, () => token); payments = new SalesPaymentService(db, () => token);
  reports = new ReportQueriesService(db, () => token);
});
afterEach(async () => { vi.useRealTimers(); vi.restoreAllMocks(); await db.delete(); });
async function rows() { return Promise.all(db.tables.map(async table => ({ name: table.name, rows: await table.toArray() }))); }
async function pay(ids: string[], at = '2026-11-13T00:00:00+07:00') {
  vi.setSystemTime(new Date(at));
  let cart = await carts.prepareDraft();
  for (const id of ids) {
    const product = await carts.lookupProduct(id);
    cart = await carts.addProduct({ operationId: crypto.randomUUID(), draftId: cart.draft.id,
      expectedRevision: cart.draft.revision, productId: id, expectedProductVersion: product.version });
  }
  const checkout: CheckoutInput = { draftId: cart.draft.id, expectedRevision: cart.draft.revision, customerId,
    method: 'cash', useMembershipDiscount: false };
  const quote = await payments.quote(checkout);
  const command = { operationId: crypto.randomUUID(), checkout, invoiceId: quote.snapshot.invoiceId,
    fingerprint: quote.fingerprint, snapshot: quote.snapshot };
  return { command, result: await payments.finalize(command) };
}

it('does not count a purchase, empty cart or cancelled draft as sales revenue, and never writes while reading', async () => {
  const cart = await carts.prepareDraft();
  await carts.cancelDraft({ operationId: crypto.randomUUID(), draftId: cart.draft.id, expectedRevision: cart.draft.revision });
  const before = await rows();
  expect(await reports.revenue(year)).toMatchObject({ scope: 'VERIFIED_ONLY', summary: { invoiceCount: 0, totalRevenue: 0, averageRevenue: 0 } });
  expect(await rows()).toEqual(before);
});
it('reconciles a real two-line discounted sale with its paid total and retains history after profile/catalog edits', async () => {
  await carts.registerMembership({ operationId: crypto.randomUUID(), customerId, consent: true });
  await db.khachHang.update(customerId, { DiemTichLuy: 50 });
  const { result } = await pay(products);
  const customer = await reference.customer(customerId);
  await reference.updateCustomer(customerId, customer.version, { name: 'Khách đổi tên', phone: '0900000099' });
  const bracket = (await reference.brackets(1)).rows[0];
  await reference.updateBracket(bracket.record.MaKhungGia, bracket.version, {
    productType: 'Áo', brand: 'CoCo', condition: '2', min: '60000', max: '200000',
  });
  const before = await rows();
  expect(await reports.revenue(year)).toMatchObject({ scope: 'VERIFIED_ONLY', summary: {
    invoiceCount: 1, totalRevenue: 166402, averageRevenue: 166402, invoiceIds: [result.invoiceId],
  } });
  expect(await rows()).toEqual(before);
  expect((await db.hoaDonBanHang.get(result.invoiceId))?.TongTien).toBe(166402);
  expect(await db.chiTietHoaDonBH.count()).toBe(2);
});
it('uses payment instants across Vietnam midnight, not a UTC day or imported stock date', async () => {
  await pay([products[0]], '2026-11-12T16:59:59.999Z');
  await pay([products[1]], '2026-11-12T17:00:00Z');
  const before = await rows();
  for (const value of ['2026-11-12', '2026-11-13']) {
    expect(await reports.revenue({ kind: 'day', value })).toMatchObject({ scope: 'VERIFIED_ONLY', summary: { invoiceCount: 1, totalRevenue: 104001 } });
  }
  expect((await reports.revenue(year)).rows.map(row => [row.date, row.invoiceCount, row.totalRevenue]))
    .toEqual([['2026-11-12', 1, 104001], ['2026-11-13', 1, 104001]]);
  expect(await reports.revenue(year)).toMatchObject({ scope: 'VERIFIED_ONLY', summary: { invoiceCount: 2, totalRevenue: 208002 } });
  expect(await rows()).toEqual(before);
});
it('excludes UNVERIFIED legacy even with a date and codes matching new invoices, with explicit coverage', async () => {
  const { result } = await pay([products[0]]), invoice = (await db.hoaDonBanHang.get(result.invoiceId))!;
  const legacy = { ...invoice, MaHDBH: 'BHlegacy01' }; await db.hoaDonBanHang.add(legacy);
  const before = await rows(), candidate = await reports.revenue(year);
  expect(candidate).toMatchObject({ scope: 'VERIFIED_ONLY', summary: { invoiceCount: 1, totalRevenue: 104001 },
    coverage: { totalRecords: 2, eligibleRecords: 1, unverifiedRecords: 1 } });
  expect(candidate.classifications).toContainEqual(expect.objectContaining({ invoiceId: legacy.MaHDBH, verification: 'UNVERIFIED', eligibility: 'UNVERIFIED' }));
  expect(await rows()).toEqual(before); expect(await db.hoaDonBanHang.get(legacy.MaHDBH)).toEqual(legacy);
});
it('classifies corrupt proof as UNVERIFIED and excludes it without repair or a legacy fallback', async () => {
  const { result } = await pay([products[0]]);
  await db.appMetadata.put({ key: saleInvoiceKey(result.invoiceId), value: '{}' });
  const before = await rows();
  expect(await reports.revenue(year)).toMatchObject({ summary: { invoiceCount: 0, totalRevenue: 0 }, coverage: { unverifiedRecords: 1 } });
  expect(await rows()).toEqual(before);
});
it('refuses an orphan paid snapshot without manufacturing a missing invoice', async () => {
  const { result } = await pay([products[0]]);
  const paid = paidSaleSchema.parse(JSON.parse((await db.appMetadata.get(saleInvoiceKey(result.invoiceId)))!.value));
  await db.appMetadata.add({ key: saleInvoiceKey('BHmissing'), value: JSON.stringify({ ...paid, snapshot: { ...paid.snapshot, invoiceId: 'BHmissing' } }) });
  const before = await rows(), report = await reports.revenue(year);
  expect(report.summary).toMatchObject({ invoiceCount: 1, totalRevenue: 104001 });
  expect(report.evidenceIssues).toEqual([{ key: saleInvoiceKey('BHmissing'), reason: 'ORPHAN_EVIDENCE' }]);
  expect(await rows()).toEqual(before);
});
it('requires the finalization receipt before marking an input verified', async () => {
  const { command, result } = await pay([products[0]]);
  await db.operations.delete(`sale-finalize:${command.operationId}`);
  const before = await rows();
  expect(await reports.revenue(year)).toMatchObject({ summary: { invoiceCount: 0, totalRevenue: 0 }, coverage: { unverifiedRecords: 1 } });
  expect(await rows()).toEqual(before);
  expect((await db.hoaDonBanHang.get(result.invoiceId))?.TongTien).toBe(104001);
});
it('rejects an invoice total inconsistent with the paid snapshot instead of recalculating it', async () => {
  const { result } = await pay([products[0]]);
  await db.hoaDonBanHang.update(result.invoiceId, { TongTien: 104002 });
  const before = await rows();
  expect(await reports.revenue(year)).toMatchObject({ summary: { invoiceCount: 0, totalRevenue: 0 }, coverage: { unverifiedRecords: 1 } });
  expect(await rows()).toEqual(before);
});
it('retains VERIFIED payment with missing time, excludes it from all periods, and never substitutes header/audit dates', async () => {
  const { result } = await pay([products[0]]);
  const raw = JSON.parse((await db.appMetadata.get(saleInvoiceKey(result.invoiceId)))!.value);
  delete raw.paidAt;
  await db.appMetadata.put({ key: saleInvoiceKey(result.invoiceId), value: JSON.stringify(raw) });
  const before = await rows(), report = await reports.revenue(year);
  expect(report.summary).toMatchObject({ invoiceCount: 0, totalRevenue: 0 });
  expect(report.coverage).toMatchObject({ unverifiedRecords: 0, missingTimeRecords: 1 });
  expect(report.classifications[0]).toMatchObject({ verification: 'VERIFIED', eligibility: 'MISSING_TIME', reason: 'PAYMENT_TIME_MISSING' });
  expect(report.classifications[0].trustedTime).toBeUndefined();
  expect(await rows()).toEqual(before);
  db.close(); await db.open();
  expect(await reports.revenue(year)).toEqual(report); expect(await rows()).toEqual(before);
});
it.each(['2026-02-30T00:00:00Z', '2026-11-13T00:00:00', 123])('excludes invalid/untrusted payment time %s without changing it', async value => {
  const { result } = await pay([products[0]]);
  const raw = JSON.parse((await db.appMetadata.get(saleInvoiceKey(result.invoiceId)))!.value); raw.paidAt = value;
  await db.appMetadata.put({ key: saleInvoiceKey(result.invoiceId), value: JSON.stringify(raw) });
  const before = await rows();
  expect(await reports.revenue(year)).toMatchObject({ summary: { invoiceCount: 0 }, coverage: { invalidTimeRecords: 1 },
    classifications: [expect.objectContaining({ verification: 'VERIFIED', eligibility: 'INVALID_TIME' })] });
  expect(await rows()).toEqual(before);
});
it('does not turn a storage read error into an empty report or an UNVERIFIED classification', async () => {
  await pay([products[0]]); const before = await rows();
  vi.spyOn(db.operations, 'get').mockRejectedValueOnce(new DOMException('Storage read fault', 'UnknownError'));
  await expect(reports.revenue(year)).rejects.toThrow('Storage read fault'); expect(await rows()).toEqual(before);
});
it('keeps current customers without creation evidence out of the KPI, even with membership and completed transactions', async () => {
  // Isolated legacy fixture: intentionally lacks the newly approved M01 source.
  await db.appMetadata.delete(`customer-creation:${customerId}`);
  await carts.registerMembership({ operationId: crypto.randomUUID(), customerId, consent: true });
  await pay([products[0]]); const before = await rows();
  const report = await reports.newCustomers(year);
  expect(report).toMatchObject({ sourceStatus: 'APPROVED_CUSTOMER_CREATION_V1', newCustomerCount: 0,
    coverage: { totalRecords: 1, unverifiedRecords: 1, eligibleRecords: 0 } });
  expect(report.classifications[0]).toMatchObject({ customerId, verification: 'UNVERIFIED' });
  expect((await db.khachHang.get(customerId))).not.toHaveProperty('createdAt');
  expect(await rows()).toEqual(before);
  db.close(); await db.open(); expect(await reports.newCustomers(year)).toEqual(report);
});
it('counts an idempotent payment replay only once', async () => {
  const { command, result } = await pay([products[0]]);
  expect(await payments.finalize(command)).toEqual({ invoiceId: result.invoiceId, duplicate: true });
  const before = await rows();
  expect(await reports.revenue(year)).toMatchObject({ scope: 'VERIFIED_ONLY', summary: { invoiceCount: 1, totalRevenue: 104001 } });
  expect(await rows()).toEqual(before);
});
it('guards direct service calls against staff and revoked sessions before exposing report data', async () => {
  await new StaffAccountsService(db, () => token).create({ name: 'Nhân viên', phone: '0900000003', username: 'staffrep', password: 'report-staff!' });
  const staff = await auth.login('staffrep', 'report-staff!'), before = await rows();
  await expect(new ReportQueriesService(db, () => staff.token).revenue(year)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(new ReportQueriesService(db, () => staff.token).purchaseCost(year)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  for (const kind of ['profit', 'cash-flow'] as const) await expect(new ReportQueriesService(db, () => staff.token).financial(year, kind)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(new ReportQueriesService(db, () => staff.token).agedStock({ minDays: 1, type: '', brand: '' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  expect(await rows()).toEqual(before);
  await auth.logout(token); const revoked = await rows();
  await expect(reports.revenue({ kind: 'day', value: 'bad-date' })).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  await expect(reports.purchaseCost(year)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(await rows()).toEqual(revoked);
});
