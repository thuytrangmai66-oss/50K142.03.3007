import { expect, test, type Page } from '@playwright/test';
import { prepare, add, fiftyPoints, selectCustomer } from './sales-helpers';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';

async function openReport(page: Page) {
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xem báo cáo chi phí thu mua', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Xem báo cáo doanh thu bán hàng', exact: true }).click();
  await expect(page.getByRole('form', { name: 'Kỳ báo cáo' })).toBeVisible();
}
async function year(page: Page) {
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
  await page.getByLabel('Năm', { exact: true }).fill('2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
}

test('G9-T02 owner: real discounted revenue, four period filters, reload, read-only and empty/error recovery', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const { products } = await prepare(page, context);
  await fiftyPoints(page); await add(page, String(products[0].MaSP));
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Thanh toán thành công!');
  const before = await inventoryData(page), invoice = before.hoaDonBanHang[0];
  const date = new Date(Date.parse(String(invoice.NgayBan)) + 7 * 3_600_000).toISOString().slice(0, 10);
  await openReport(page);
  await page.getByLabel('Từ ngày', { exact: true }).fill('33/01/2026');
  await page.getByLabel('Đến ngày', { exact: true }).fill('01/01/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Khoảng thời gian không hợp lệ. Vui lòng kiểm tra lại');
  await expect(page.locator('.report-summary')).toHaveCount(0);
  for (const [mode, label, value] of [
    ['Theo ngày', 'Ngày', date.split('-').reverse().join('/')],
    ['Theo tháng', 'Tháng', `${date.slice(5, 7)}/${date.slice(0, 4)}`],
    ['Theo năm', 'Năm', date.slice(0, 4)],
  ]) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.locator('.report-summary strong').nth(0)).toHaveText('1');
    await expect(page.locator('.report-summary strong').nth(1)).toContainText('83.206');
    await expect(page.locator('tfoot')).toContainText('83.206');
    expect(await inventoryData(page)).toEqual(before);
  }
  await page.getByRole('button', { name: 'Theo khoảng thời gian', exact: true }).click();
  for (const label of ['Từ ngày', 'Đến ngày']) await page.getByLabel(label, { exact: true }).fill(date.split('-').reverse().join('/'));
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('owner-revenue-range.png') });
  await page.reload(); await year(page);
  await expect(page.locator('.report-summary strong').nth(1)).toContainText('83.206');
  await page.getByLabel('Năm', { exact: true }).fill('2000');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.empty-state')).toHaveText('Không có dữ liệu doanh thu trong khoảng thời gian này');
  await expect(page.locator('.report-summary strong').nth(0)).toHaveText('0');
  await expect(page.locator('.report-summary strong').nth(1)).toContainText('0');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('owner-revenue-empty.png') });
  // Isolated native read failure, not a fake empty result.
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'hoaDonBanHang') throw new DOMException('G9 read failure', 'UnknownError');
      return original.apply(this, args);
    };
    Object.assign(window, { restoreReportRead: () => { IDBObjectStore.prototype.getAll = original; } });
  });
  await year(page);
  await expect(page.getByRole('alertdialog')).toContainText('Lỗi hệ thống, vui lòng thử lại sau');
  await page.screenshot({ path: info.outputPath('owner-revenue-error.png') });
  await closeNotice(page, 'Lỗi hệ thống, vui lòng thử lại sau');
  await expect(page.locator('.report-summary')).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { restoreReportRead(): void }).restoreReportRead());
  await year(page);
  await expect(page.locator('.report-summary strong').nth(1)).toContainText('83.206');
  expect(await inventoryData(page)).toEqual(before);
  expect(errors).toEqual([]);
});

test('G9-T02: 25 actual UI-completed invoices, daily pagination, stable totals and desktop screenshots', async ({ page }, info) => {
  test.setTimeout(180_000);
  // Browser clock controls business time; all invoices still go through real UI transactions.
  await page.clock.setFixedTime(new Date('2026-11-01T08:00:00+07:00'));
  await createInventoryThroughUI(page, '25');
  const products = (await inventoryData(page)).sanPham;
  for (let i = 0; i < products.length; i++) {
    await page.clock.setFixedTime(new Date(`2026-11-${String(i + 1).padStart(2, '0')}T08:00:00+07:00`));
    await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await selectCustomer(page); await add(page, String(products[i].MaSP));
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Thanh toán thành công!');
  }
  const before = await inventoryData(page);
  expect(before.hoaDonBanHang).toHaveLength(25);
  await openReport(page); await year(page);
  await expect(page.locator('.report-summary strong').nth(0)).toHaveText('25');
  await expect(page.locator('.report-summary strong').nth(1)).toContainText('2.600.175');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Trang 1', exact: true }).click();
    await expect(page.locator('.pagination')).toBeInViewport({ ratio: 1 });
    const count = Number(await page.locator('.reports-page').getAttribute('data-page-size'));
    expect(count).toBeGreaterThan(0); expect(count).toBeLessThanOrEqual(9);
    await expect(page.locator('.data-table tbody tr')).toHaveCount(count);
    await expect(page.locator('.data-table tbody tr').first()).toContainText('01/11/2026');
    await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
    await expect(page.locator('.data-table tbody tr').first()).toContainText(`${String(count + 1).padStart(2, '0')}/11/2026`);
    await expect(page.locator('tfoot')).toContainText('2.600.175');
    const geometry = await page.evaluate(() => {
      const main = document.getElementById('main-content')!, table = document.querySelector('.data-table-scroll')!, nav = document.querySelector('.pagination')!;
      const m = main.getBoundingClientRect(), n = nav.getBoundingClientRect(), style = getComputedStyle(main);
      return { overflow: table.scrollHeight - table.clientHeight, center: Math.abs((n.left + n.right) / 2 - (m.left + parseFloat(style.paddingLeft) + (main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) / 2)), pageOverflow: document.documentElement.scrollWidth - innerWidth };
    });
    expect(geometry.overflow).toBeLessThanOrEqual(1); expect(geometry.center).toBeLessThan(3); expect(geometry.pageOverflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath(`owner-revenue-${viewport.width}x${viewport.height}.png`) });
  }
  expect(await inventoryData(page)).toEqual(before);
});

test('G9-T02 staff: sidebar hidden and direct report route denied, owner session remains independent', async ({ page, context }, info) => {
  test.setTimeout(60_000);
  const { target } = await prepare(page, context, 'staff');
  const before = await inventoryData(target);
  await expect(target.getByRole('link', { name: 'Báo cáo', exact: true })).toHaveCount(0);
  await target.goto('./#/reports/revenue');
  await expect(target.getByRole('heading', { name: 'Không có quyền truy cập', exact: true })).toBeVisible();
  await expect(target.getByRole('form', { name: 'Kỳ báo cáo' })).toHaveCount(0);
  await target.screenshot({ path: info.outputPath('staff-report-denied.png') });
  await openReport(page); await year(page);
  await expect(page.locator('.empty-state')).toHaveText('Không có dữ liệu doanh thu trong khoảng thời gian này');
  expect(await inventoryData(target)).toEqual(before);
});

test('G9-D01 native reload: missing payment time and legacy sale date never manufacture report revenue', async ({ page, context }) => {
  test.setTimeout(60_000);
  const { products } = await prepare(page, context);
  await add(page, String(products[0].MaSP));
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Thanh toán thành công!');
  // Keep this test on the tolerant reporting route before importing incomplete
  // history. Strict sales-detail validation intentionally rejects that fixture.
  await openReport(page);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction(['hoaDonBanHang', 'appMetadata'], 'readwrite');
      const invoices = tx.objectStore('hoaDonBanHang'), metadata = tx.objectStore('appMetadata');
      const read = invoices.getAll();
      read.onsuccess = () => {
        const invoice = read.result[0];
        // Isolated imported fixture: presence/status/date alone are not proof of payment.
        invoices.add({ ...invoice, MaHDBH: 'BHLEGACY', NgayBan: '2026-01-01T00:00:00+07:00' });
        const proof = metadata.get(`sales-invoice:${invoice.MaHDBH}`);
        proof.onsuccess = () => {
          const value = JSON.parse(proof.result.value); delete value.paidAt;
          metadata.put({ ...proof.result, value: JSON.stringify(value) });
        };
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
  await page.reload(); const before = await inventoryData(page);
  await year(page);
  await expect(page.locator('.empty-state')).toHaveText('Không có dữ liệu doanh thu trong khoảng thời gian này');
  await expect(page.locator('.report-summary strong').nth(0)).toHaveText('0');
  expect(await inventoryData(page)).toEqual(before);
  await page.reload(); await year(page);
  await expect(page.locator('.empty-state')).toHaveText('Không có dữ liệu doanh thu trong khoảng thời gian này');
  expect(await inventoryData(page)).toEqual(before);
});
