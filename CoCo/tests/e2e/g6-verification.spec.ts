import { test, expect, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import path from 'node:path';
import { setup, addProduct, closeNotice, expectApprovalList } from './purchase-helpers';

test('T07 native migration abort restores v3 and successful runtime upgrade preserves all legacy stores and numeric codes', async ({ page }, info) => {
  const bundle = await build({ entryPoints: [path.resolve('tests/fixtures/g6-migration-verification.ts')],
    bundle: true, write: false, platform: 'browser', format: 'iife', globalName: 'T07Migration', target: 'es2022' });
  await page.goto('./'); await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const result = await page.evaluate(() => (window as unknown as {
    T07Migration: { verifyNativeMigrationRollback(): Promise<unknown> }
  }).T07Migration.verifyNativeMigrationRollback());
  expect(result).toEqual({ upgradeRejected: true, rollbackNativeVersion: 30, rollbackStoreCount: 21,
    rollbackPreservedEveryLegacyStore: true, runtimeNativeVersion: 40, runtimeStoreCount: 27,
    successPreservedEveryLegacyStore: true, newStoresEmpty: true,
    addedStores: ['purchaseApprovals', 'purchaseDrafts', 'purchaseFinalizations', 'purchaseLines', 'purchaseNotices', 'purchaseProvenance'],
    legacyInvoiceStatus: 90, legacyProductStatus: 90, legacyCondition: 90 });
  await writeFile(info.outputPath('t07-native-migration.json'), JSON.stringify(result, null, 2));
});

/** Observe the real app's native DB; never install business fixtures here. */
async function nativeGraph(page: Page) {
  return page.evaluate(() => new Promise<{
    version: number; keys: Record<string, string | string[] | null>;
    stores: Record<string, Array<Record<string, unknown>>>;
  }>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, names = Array.from(db.objectStoreNames), tx = db.transaction(names, 'readonly');
      const stores: Record<string, Array<Record<string, unknown>>> = {}, keys: Record<string, string | string[] | null> = {};
      for (const name of names) {
        const store = tx.objectStore(name); keys[name] = store.keyPath;
        const read = store.getAll(); read.onsuccess = () => { stores[name] = read.result; };
      }
      tx.oncomplete = () => { const version = db.version; db.close(); resolve({ version, stores, keys }); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
}

test('T07 actual runtime: two UI roles approve, finalize, live-read shared invoice/history and preserve canonical graph on reload', async ({ page, context }, info) => {
  const errors: string[] = [];
  const observe = (p: Page) => {
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  };
  context.pages().forEach(observe); context.on('page', observe);
  const staff = await setup(page, context);
  const pending = await nativeGraph(staff);
  expect(pending.version).toBe(40); // Dexie v4 -> native version 40.
  expect(Object.keys(pending.stores)).toHaveLength(27);
  expect(pending.keys.chiTietHoaDonTM).toEqual(['MaHDTM', 'MaKhungGia']);
  expect(pending.keys.sanPham).toBe('MaSP');
  for (const name of ['purchaseDrafts', 'purchaseLines', 'purchaseApprovals', 'purchaseNotices', 'purchaseFinalizations', 'purchaseProvenance']) expect(pending.stores).toHaveProperty(name);
  expect(pending.stores.hoaDonThuMua).toHaveLength(0);
  expect(pending.stores.khachHang).toHaveLength(0);
  expect(pending.stores.sanPham).toHaveLength(0);
  const request = pending.stores.purchaseApprovals[0], line = pending.stores.purchaseLines[0];
  expect(request).toMatchObject({ lineId: line.id, lineRevision: line.revision, unitCost: 120000, quantity: 1, bracket: line.bracket, decision: { status: 'pending' } });
  const ownerSession = await page.evaluate(() => sessionStorage.getItem('coco:session'));
  const staffSession = await staff.evaluate(() => sessionStorage.getItem('coco:session'));
  expect(ownerSession).toBeTruthy(); expect(staffSession).toBeTruthy(); expect(staffSession).not.toBe(ownerSession);
  await page.screenshot({ path: info.outputPath('t07-owner-request.png') });
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Phê duyệt giá thu mua thành công'); await expectApprovalList(page);
  await expect(staff.getByRole('alertdialog')).toContainText('Yêu cầu phê duyệt được chấp thuận');
  await staff.screenshot({ path: info.outputPath('t07-staff-approved.png') });
  await closeNotice(staff, 'Yêu cầu phê duyệt được chấp thuận');
  await addProduct(staff, '80005', '2'); // Same bracket, different cost.
  await staff.getByLabel('Số điện thoại', { exact: true }).fill('0900000077');
  await staff.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = staff.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách nghiệm thu T07');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000077');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await staff.getByRole('button', { name: 'Khách nghiệm thu T07', exact: true }).click();
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await expect(page.getByText('Chưa có giao dịch thu mua', { exact: true })).toBeVisible();
  await staff.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(staff, 'Thu mua sản phẩm thành công');
  const finalized = await nativeGraph(staff), data = finalized.stores;
  expect(data.hoaDonThuMua).toHaveLength(1); expect(data.purchaseFinalizations).toHaveLength(1);
  const invoice = data.hoaDonThuMua[0], snapshot = data.purchaseFinalizations[0];
  const invoiceId = String(invoice.MaHDTM), customerId = String(invoice.MaKH);
  expect(invoice).toMatchObject({ TongTienTM: 280010, TrangThai: 1 });
  expect(snapshot).toMatchObject({ invoiceId, subtotal: 280010, paidTotal: 280010 });
  expect(data.purchaseDrafts[0]).toMatchObject({ status: 'finalized', invoiceId, id: snapshot.draftId });
  expect(data.khachHang).toHaveLength(1); expect(data.khachHang[0].MaKH).toBe(customerId);
  expect(data.purchaseApprovals).toHaveLength(1); expect(data.purchaseNotices).toHaveLength(1);
  expect(data.sanPham).toHaveLength(3); expect(data.productCosts).toHaveLength(3); expect(data.purchaseProvenance).toHaveLength(3);
  expect(data.chiTietHoaDonTM).toHaveLength(0); // Canonical P04 lines, no fabricated legacy aggregate.
  const lines = snapshot.lines as Array<Record<string, unknown>>;
  expect(lines.map(l => [l.quantity, l.unitCost])).toEqual([[1, 120000], [2, 80005]]);
  for (const product of data.sanPham) {
    const origin = data.purchaseProvenance.find(p => p.productId === product.MaSP)!;
    const cost = data.productCosts.find(c => c.MaSP === product.MaSP)!;
    expect(origin).toMatchObject({ invoiceId, unitCost: cost.unitCost });
    expect(lines.find(l => l.id === origin.lineId)?.unitCost).toBe(cost.unitCost);
    expect(product).toMatchObject({ MaHDTM: invoiceId, TrangThai: 1 });
  }
  expect(JSON.parse(String(data.appMetadata.find(m => m.key === `purchase-status-mapping:${invoiceId}`)?.value))).toEqual({ invoiceCompleted: 1, productAvailable: 1, productSold: 2 });
  // Owner list was already open: arrival must occur without F5.
  await expect(page.getByRole('link', { name: invoiceId, exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('t07-owner-live-invoice.png') });
  for (const [role, reader] of [['owner', page], ['staff', staff]] as const) {
    await reader.getByRole('link', { name: invoiceId, exact: true }).click();
    await expect(reader.locator('.invoice-total')).toContainText('280.010');
    await expect(reader.locator('.purchase-invoice tbody tr')).toHaveCount(2);
    await reader.screenshot({ path: info.outputPath(`t07-${role}-invoice.png`) });
    await reader.getByRole('link', { name: 'Khách hàng', exact: true }).click();
    await reader.getByRole('link', { name: customerId, exact: true }).click();
    await reader.getByRole('link', { name: 'Lịch sử bán', exact: true }).click();
    await expect(reader.locator('.history-card tbody tr')).toHaveCount(1);
    await expect(reader.locator('.history-card tbody')).toContainText('Hoàn tất');
    await reader.screenshot({ path: info.outputPath(`t07-${role}-history.png`) });
    await reader.getByRole('link', { name: invoiceId, exact: true }).click();
    await expect(reader.locator('.invoice-total')).toContainText('280.010');
    await reader.reload(); await expect(reader.locator('.invoice-total')).toContainText('280.010');
  }
  expect(await nativeGraph(staff)).toEqual(finalized);
  expect(await nativeGraph(page)).toEqual(finalized);
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(ownerSession);
  expect(await staff.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(staffSession);
  expect(errors).toEqual([]);
  await writeFile(info.outputPath('t07-runtime-graph.json'), JSON.stringify({
    nativeVersion: finalized.version, storeCount: Object.keys(data).length, legacyKeys: finalized.keys.chiTietHoaDonTM,
    draftId: snapshot.draftId, invoiceId, customerId, requestId: request.id,
    statusMapping: { invoiceCompleted: 1, productAvailable: 1, productSold: 2 },
    pendingNoFabrication: true, lineBinding: true, sharedInvoiceWithoutReload: true,
    lines: lines.map(l => ({ id: l.id, quantity: l.quantity, unitCost: l.unitCost })),
    invoiceCount: 1, productCount: 3, provenanceCount: 3, costsCount: 3,
    reloadPreservedAllStores: true, independentSessions: true, consoleErrors: errors,
  }, null, 2));
});
