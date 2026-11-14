import { expect, test, type Page } from '@playwright/test';
import { prepare, add } from './sales-helpers';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';
import { addStaffFixture, login } from './auth-helpers';

const viewports = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }];
async function selectYear(page: Page, year = '2026') {
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
  await page.getByLabel('Năm', { exact: true }).fill(year);
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
}
for (const kind of ['profit', 'cash-flow'] as const) test(`T04 ${kind}: real paid totals, period filters, empty/error, reload and desktop geometry`, async ({ page, context }, info) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date('2026-11-14T10:00:00+07:00'));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const { products } = await prepare(page, context);
  await add(page, String(products[0].MaSP)); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Thanh toán thành công!');
  const before = await inventoryData(page);
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await page.getByRole('button', { name: kind === 'profit' ? 'Xem báo cáo lợi nhuận' : 'Xem báo cáo dòng tiền', exact: true }).click();
  await selectYear(page);
  const expected = kind === 'profit' ? ['104.007', '80.005', '24.002'] : ['104.007', '160.010', '-56.003'];
  for (let i = 0; i < 3; i++) await expect(page.locator('.report-summary strong').nth(i)).toContainText(expected[i]);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.pagination')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('thead th')).toHaveCount(4);
    await expect(page.locator('tfoot')).toContainText(expected[2]);
    await page.screenshot({ path: info.outputPath(`${kind}-${viewport.width}.png`) });
  }
  for (const [mode, label, value] of [['Theo ngày', 'Ngày', '14/11/2026'], ['Theo tháng', 'Tháng', '11/2026']]) {
    await page.getByRole('button', { name: mode, exact: true }).click(); await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.locator('.report-summary strong').nth(2)).toContainText(expected[2]);
  }
  await page.getByRole('button', { name: 'Theo khoảng thời gian', exact: true }).click();
  for (const label of ['Từ ngày', 'Đến ngày']) await page.getByLabel(label, { exact: true }).fill('14/11/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.reload(); await selectYear(page);
  await expect(page.locator('.report-summary strong').nth(2)).toContainText(expected[2]);
  await selectYear(page, 'bad'); await expect(page.getByRole('alert')).toContainText('Khoảng thời gian không hợp lệ');
  await selectYear(page, '2000'); await expect(page.locator('.empty-state')).toBeVisible();
  await page.screenshot({ path: info.outputPath(`${kind}-empty.png`) });
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) { if (this.name === 'hoaDonBanHang') throw new DOMException('report fault', 'UnknownError'); return original.apply(this, args); };
    Object.assign(window, { restoreT04: () => { IDBObjectStore.prototype.getAll = original; } });
  });
  await selectYear(page); await expect(page.getByRole('alertdialog')).toContainText('Lỗi hệ thống, vui lòng thử lại sau');
  await page.screenshot({ path: info.outputPath(`${kind}-error.png`) });
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.evaluate(() => (window as unknown as { restoreT04(): void }).restoreT04());
  await selectYear(page); await expect(page.locator('.report-summary strong').nth(2)).toContainText(expected[2]);
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
});

test('T04 aged stock: exact threshold, filters, 25 real products, pagination, empty/error and readonly reload', async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(new Date('2026-11-01T10:00:00+07:00'));
  await createInventoryThroughUI(page, '25');
  await page.clock.setFixedTime(new Date('2026-11-14T10:00:00+07:00'));
  // Let the approved G7 catch-up finish after moving the browser date. Its
  // operational metadata is legitimate setup, not a write by the report.
  await page.reload();
  await expect.poll(async () => {
    const setup = await inventoryData(page);
    const day = setup.appMetadata.find(row => row.key === 'discount-day:2026-11-14');
    const run = setup.appMetadata.find(row => row.key === `discount-run:${day?.value}`);
    return Boolean(run && JSON.parse(String(run.value)).status === 'success');
  }).toBe(true);
  const before = await inventoryData(page), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await page.getByRole('button', { name: 'Xem báo cáo hàng tồn lâu', exact: true }).click();
  const days = page.getByLabel('Số ngày tồn tối thiểu', { exact: true });
  await days.fill('0'); await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Số ngày tồn kho tối thiểu không hợp lệ');
  await days.fill('13');
  await page.getByRole('combobox', { name: 'Loại hàng', exact: true }).selectOption('Áo');
  await page.getByRole('combobox', { name: 'Thương hiệu (nếu có)', exact: true }).selectOption('CoCo');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.report-summary strong').first()).toHaveText('25');
  for (const viewport of viewports) {
    await page.setViewportSize(viewport); await page.getByRole('button', { name: 'Trang 1', exact: true }).click();
    await expect(page.locator('.pagination')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('thead th')).toHaveCount(8);
    const firstId = await page.locator('tbody tr td').first().textContent();
    await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
    await expect(page.locator('tbody tr td').first()).not.toHaveText(firstId!);
    expect(await page.locator('.data-table-scroll').evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath(`aged-stock-${viewport.width}.png`) });
  }
  await days.fill('14'); await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.empty-state')).toContainText('Không có sản phẩm tồn kho phù hợp');
  await page.screenshot({ path: info.outputPath('aged-stock-empty.png') });
  await page.reload(); await days.fill('13'); await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.report-summary strong').first()).toHaveText('25');
  await page.evaluate(() => {
    const getAll = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) { if (this.name === 'sanPham') throw new DOMException('stock read fault', 'UnknownError'); return getAll.apply(this, args); };
    Object.assign(window, { restoreStock: () => { IDBObjectStore.prototype.getAll = getAll; } });
  });
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Lỗi hệ thống, vui lòng thử lại sau');
  await page.screenshot({ path: info.outputPath('aged-stock-error.png') });
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.evaluate(() => (window as unknown as { restoreStock(): void }).restoreStock());
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('.report-summary strong').first()).toHaveText('25');
  await expect(page.locator(':modal')).toHaveCount(0);
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
});

test('T04 staff cannot access any new report while owner session remains independent', async ({ page, context }, info) => {
  await createInventoryThroughUI(page); await addStaffFixture(page);
  const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff', 'staff-test!');
  for (const kind of ['profit', 'cash-flow', 'aged-stock']) {
    await staff.goto(`./#/reports/${kind}`);
    await expect(staff.getByRole('heading', { name: 'Không có quyền truy cập', exact: true })).toBeVisible();
  }
  await staff.screenshot({ path: info.outputPath('staff-t04-denied.png') });
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xem báo cáo lợi nhuận', exact: true })).toBeEnabled();
});
