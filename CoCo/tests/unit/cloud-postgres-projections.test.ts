import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import rawSnapshot from '../fixtures/cloud-postgres-snapshot.json';
import { createCloudServices } from '../../src/cloud/services';
import { createSnapshotDatabase } from '../../src/cloud/repository';
import type { AuthUser } from '../../src/domain/auth';
import type { CloudSnapshot } from '../../src/cloud/contracts';
import { validateReferences } from '../../src/repositories/constraints';
import { entitySchemas, metadataSchemas } from '../../src/domain/records';
import { purchaseDraftSchema, purchaseLineSchema, purchaseApprovalSchema, purchaseFinalizationSchema, purchaseProvenanceSchema } from '../../src/domain/purchases';
import { paidSaleSchema } from '../../src/domain/sale-payment';

// Synthetic fixture exported by the actual PostgreSQL RPC validation harness,
// not fabricated UI data. Contains no credentials or local Auth sessions.
const snapshot = rawSnapshot as CloudSnapshot;
const employee = rawSnapshot.nhanVien[0], account = rawSnapshot.taiKhoan[0];
const user: AuthUser = { username: account.TenDangNhap, employeeId: employee.MaNV, displayName: employee.HoTen, role: 'owner' };
function services() {
  return createCloudServices({ rpc: vi.fn(async () => ({ data: structuredClone(snapshot), error: null })) } as unknown as SupabaseClient,
    { currentUser: () => user, subscribe: () => () => undefined, invalidate: () => undefined });
}
const purchase = rawSnapshot.hoaDonThuMua[0], sale = rawSnapshot.hoaDonBanHang[0];
const period = { kind: 'day' as const, value: purchase.NgayThuMua.slice(0, 10) };

it('actual SQL-produced purchase/sale graphs satisfy current domain schemas and FK validators', async () => {
  for (const [name, schema] of Object.entries(entitySchemas)) for (const row of snapshot[name]) schema.parse(row);
  for (const [name, schema] of Object.entries(metadataSchemas)) {
    if (name === 'accountSecurity') continue; // Server intentionally exports no password material.
    for (const row of snapshot[name]) schema.parse(row);
  }
  rawSnapshot.purchaseDrafts.forEach(row => purchaseDraftSchema.parse(row));
  rawSnapshot.purchaseLines.forEach(row => purchaseLineSchema.parse(row));
  rawSnapshot.purchaseApprovals.forEach(row => purchaseApprovalSchema.parse(row));
  rawSnapshot.purchaseFinalizations.forEach(row => purchaseFinalizationSchema.parse(row));
  rawSnapshot.purchaseProvenance.forEach(row => purchaseProvenanceSchema.parse(row));
  for (const row of rawSnapshot.appMetadata.filter(row => row.key.startsWith('sales-invoice:'))) paidSaleSchema.parse(JSON.parse(row.value));
  await validateReferences(createSnapshotDatabase(snapshot, user));
});

it('actual SQL invoices open through purchase/sales lists, details and customer histories', async () => {
  const cloud = services();
  const purchases = await cloud.purchaseDrafts.listTransactions({ id: '', phone: '', name: '', date: '' }, 1);
  expect(purchases.total).toBe(1); expect(purchases.rows[0].id).toBe(purchase.MaHDTM);
  const detail = await cloud.purchaseDrafts.transaction(purchase.MaHDTM);
  expect(detail.total).toBe(purchase.TongTienTM);
  expect(detail.lines.reduce((sum, row) => sum + row.total, 0)).toBe(purchase.TongTienTM);
  const sales = await cloud.salesQueries.list({ id: '', phone: '', name: '', date: '' }, 1);
  expect(sales.total).toBe(1); expect((await cloud.salesQueries.invoice(sale.MaHDBH)).total).toBe(sale.TongTien);
  expect((await cloud.referenceData.history(purchase.MaKH, 'sales')).rows.map(row => row.id)).toContain(purchase.MaHDTM);
  expect((await cloud.referenceData.history(sale.MaKH, 'purchases')).rows.map(row => row.id)).toContain(sale.MaHDBH);
  expect((await cloud.inventory.list({ query: '', type: '', brand: '', date: '' }, 1)).total).toBe(2);
});

it('actual SQL operation/audit/snapshot evidence is recognized by existing G9 reports', async () => {
  const cloud = services();
  const revenue = await cloud.reports.revenue(period), cost = await cloud.reports.purchaseCost(period);
  expect(revenue.summary.invoiceCount).toBe(1); expect(revenue.summary.totalRevenue).toBe(sale.TongTien);
  expect(cost.summary.invoiceCount).toBe(1); expect(cost.summary.totalCost).toBe(purchase.TongTienTM);
  expect(revenue.classifications[0].verification).toBe('VERIFIED'); expect(cost.classifications[0].verification).toBe('VERIFIED');
  const cash = await cloud.reports.financial(period, 'cash-flow');
  expect(cash.summary).toMatchObject({ incoming: sale.TongTien, outgoing: purchase.TongTienTM, net: sale.TongTien - purchase.TongTienTM });
  await expect(cloud.dashboard.ownerSummary()).resolves.toHaveProperty('stock');
  await expect(cloud.discounts.read()).resolves.toHaveProperty('runs');
});
