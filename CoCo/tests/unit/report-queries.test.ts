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

let db: CoCoDatabase, auth: AuthService, token: string, customerId: string, products: string[];
let reference: LocalReferenceData, carts: SalesDraftService, payments: SalesPaymentService, reports: ReportQueriesService;
const year = { kind: 'year', value: '2026' } as const;

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
  await carts.registerMembership({ operationId: crypto.randomUUID(), customerId, consent: true });
  await pay([products[0]]); const before = await rows();
  const report = await reports.newCustomers(year);
  expect(report).toMatchObject({ sourceStatus: 'BLOCKED_NO_APPROVED_CREATION_SOURCE', newCustomerCount: 0,
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
  expect(await rows()).toEqual(before);
  await auth.logout(token); const revoked = await rows();
  await expect(reports.revenue({ kind: 'day', value: 'bad-date' })).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(await rows()).toEqual(revoked);
});
