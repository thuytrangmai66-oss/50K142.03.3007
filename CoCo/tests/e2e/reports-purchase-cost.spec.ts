import { expect, test } from '@playwright/test';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { addStaffFixture, login } from './auth-helpers';
import { addProduct, closeNotice } from './purchase-helpers';

test('T03 actual purchase, four filters, read-only reload, source empty/error and three desktop viewports', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await createInventoryThroughUI(page, '3');
  const before = await inventoryData(page);
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await page.getByRole('button', { name: 'Xem báo cáo chi phí thu mua', exact: true }).click();
  for (const [mode, label, value] of [['Theo ngày', 'Ngày', '14/11/2026'], ['Theo tháng', 'Tháng', '11/2026'], ['Theo năm', 'Năm', '2026']]) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.locator('.report-summary strong').nth(0)).toHaveText('1');
    await expect(page.locator('.report-summary strong').nth(1)).toHaveText('3');
    await expect(page.locator('.report-summary strong').nth(2)).toContainText('240.015');
  }
  await page.getByRole('button', { name: 'Theo khoảng thời gian', exact: true }).click();
  for (const label of ['Từ ngày', 'Đến ngày']) await page.getByLabel(label, { exact: true }).fill('14/11/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.pagination')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('thead th')).toHaveCount(5);
    await expect(page.locator('tfoot')).toContainText('240.015');
    await page.screenshot({ path: info.outputPath(`purchase-cost-${viewport.width}.png`) });
  }
  await page.reload();
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
  await page.getByLabel('Năm', { exact: true }).fill('2000');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.empty-state')).toContainText('Không có dữ liệu chi phí thu mua trong khoảng thời gian này');
  await expect(page.locator('.report-summary strong').nth(1)).toHaveText('0');
  await page.screenshot({ path: info.outputPath('purchase-cost-empty.png') });
  await page.getByLabel('Năm', { exact: true }).fill('bad');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Khoảng thời gian không hợp lệ');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'hoaDonThuMua') throw new DOMException('report read failed', 'UnknownError');
      return original.apply(this, args);
    };
    Object.assign(window, { restoreCostRead: () => { IDBObjectStore.prototype.getAll = original; } });
  });
  await page.getByLabel('Năm', { exact: true }).fill('2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Lỗi hệ thống, vui lòng thử lại sau');
  await page.screenshot({ path: info.outputPath('purchase-cost-error.png') });
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.evaluate(() => (window as unknown as { restoreCostRead(): void }).restoreCostRead());
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.report-summary strong').nth(2)).toContainText('240.015');
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
});

test('T03 staff direct route is denied with an independent owner tab', async ({ page, context }, info) => {
  await createInventoryThroughUI(page); await addStaffFixture(page);
  const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff', 'staff-test!');
  await staff.goto('./#/reports/purchase-cost');
  await expect(staff.getByRole('heading', { name: 'Không có quyền truy cập', exact: true })).toBeVisible();
  await staff.screenshot({ path: info.outputPath('staff-cost-denied.png') });
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xem báo cáo chi phí thu mua', exact: true })).toBeEnabled();
});

test('T03 25 daily rows from real transactions paginate without changing period totals', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  await createInventoryThroughUI(page, '3');
  for (let day = 1; day <= 25; day++) {
    await page.clock.setFixedTime(new Date(`2026-11-${String(day).padStart(2, '0')}T10:00:00+07:00`));
    await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await addProduct(page, '80005', '1');
    await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
    await page.getByRole('button', { name: 'Khách G7', exact: true }).click();
    await page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Thu mua sản phẩm thành công');
  }
  const before = await inventoryData(page);
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await page.getByRole('button', { name: 'Xem báo cáo chi phí thu mua', exact: true }).click();
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
  await page.getByLabel('Năm', { exact: true }).fill('2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.report-summary strong').nth(0)).toHaveText('26');
  await expect(page.locator('.report-summary strong').nth(1)).toHaveText('28');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Trang 1', exact: true }).click();
    await expect(page.locator('.pagination')).toBeInViewport({ ratio: 1 });
    const capacity = Number(await page.locator('.reports-page').getAttribute('data-page-size'));
    await expect(page.locator('tbody tr')).toHaveCount(capacity);
    await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
    await expect(page.locator('tbody tr').first()).toContainText(`${String(capacity + 1).padStart(2, '0')}/11/2026`);
    await expect(page.locator('tfoot')).toContainText('2.240.140');
    expect(await page.locator('.data-table-scroll').evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath(`cost-pagination-${viewport.width}.png`) });
  }
  expect(await inventoryData(page)).toEqual(before);
});
