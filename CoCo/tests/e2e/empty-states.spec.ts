import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { bootstrapOwner, login } from './auth-helpers';
import { inventoryData } from './inventory-helpers';
import { createCustomerForEmptyHistory, emptyGeometry, emptyLists, emptyReports, openEmptyReport } from './empty-state-helpers';

// Computed from the existing Staff empty state, before this UI change.
const staffStyle = {
  fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '28.8px', letterSpacing: 'normal',
  color: 'rgb(174, 174, 178)', direction: 'column', gap: '12px', textAlign: 'center', alignItems: 'center', justifyContent: 'center',
  iconColor: 'rgb(174, 174, 178)', stroke: 'rgb(174, 174, 178)', strokeWidth: '1.5px', iconWidth: '48px', iconHeight: '48px',
};
const viewports = [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }];

async function checkEmpty(page: Page) {
  const layout = await emptyGeometry(page);
  expect(layout.style).toEqual(staffStyle);
  expect(layout.pageX).toBe(0);
  expect(layout.icon.y).toBeGreaterThanOrEqual(layout.header.bottom);
  const lineHeight = parseFloat(layout.style.lineHeight);
  const textLines = Math.ceil(layout.text.height / lineHeight);
  const groupHeight = layout.icon.height + parseFloat(layout.style.gap) + textLines * lineHeight;
  expect(Math.abs(layout.body.bottom - layout.container.bottom)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.icon.y + groupHeight / 2 - (layout.header.bottom + layout.container.bottom) / 2)).toBeLessThanOrEqual(2);
  expect(Math.abs(layout.icon.x + layout.icon.width / 2 - layout.body.x - layout.body.width / 2)).toBeLessThanOrEqual(2);
  expect(Math.abs(layout.text.x + layout.text.width / 2 - layout.body.x - layout.body.width / 2)).toBeLessThanOrEqual(2);
  expect(layout.empty.bottom).toBeLessThanOrEqual(layout.container.bottom + 1);
  return layout;
}

test('owner: empty lists, five reports and both customer histories share Staff appearance and stay centered', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); await login(page);
  const before = await inventoryData(page), measurements = [];
  expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of emptyLists) {
      await page.goto(`./#/${route}`);
      measurements.push({ viewport, route, ...await checkEmpty(page) });
      if (viewport.width === 1440) await page.screenshot({ path: info.outputPath(`after-${route}.png`) });
    }
    if (viewport.width === 390) continue;
    for (const kind of emptyReports) {
      await openEmptyReport(page, kind);
      measurements.push({ viewport, route: `reports/${kind}`, ...await checkEmpty(page) });
      if (viewport.width === 1440) await page.screenshot({ path: info.outputPath(`after-report-${kind}.png`) });
    }
  }
  expect(await inventoryData(page)).toEqual(before);
  const detail = await createCustomerForEmptyHistory(page), beforeHistory = await inventoryData(page);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const kind of ['purchases', 'sales']) {
      await page.goto(`${detail}/${kind}`);
      measurements.push({ viewport, route: `history/${kind}`, ...await checkEmpty(page) });
      if (viewport.width === 1440) await page.screenshot({ path: info.outputPath(`after-history-${kind}.png`) });
    }
  }
  expect(await inventoryData(page)).toEqual(beforeHistory); expect(errors).toEqual([]);
  await writeFile(info.outputPath('after-owner.json'), JSON.stringify(measurements, null, 2));
});

test('staff: permitted empty lists use the same appearance and restricted menus remain hidden', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page);
  await page.goto('./#/staff');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
  for (const [label, value] of [['Họ tên', 'Nhân viên kiểm tra'], ['Số điện thoại', '0900000089'], ['Tên đăng nhập', 'emptytest'], ['Mật khẩu', 'only-tests!']]) await form.getByLabel(label, { exact: true }).fill(value);
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await login(page, 'emptytest', 'only-tests!');
  const before = await inventoryData(page), measurements = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of ['sales', 'purchases', 'inventory', 'customers']) {
      await page.goto(`./#/${route}`);
      measurements.push({ viewport, route, ...await checkEmpty(page) });
      if (viewport.width === 1440) await page.screenshot({ path: info.outputPath(`staff-after-${route}.png`) });
    }
  }
  for (const name of ['Nhân viên', 'Phê duyệt', 'Báo cáo']) await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
  expect(await inventoryData(page)).toEqual(before);
  await writeFile(info.outputPath('after-staff.json'), JSON.stringify(measurements, null, 2));
});

test('customer empty state stays distinct from native loading, populated and no-match results', async ({ page }) => {
  await bootstrapOwner(page); await login(page);
  // Hold a native transaction with read requests only: no records or fake results.
  await page.evaluate(async () => {
    document.documentElement.dataset.holdEmptyRead = 'true';
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('khachHang', 'readwrite'), store = tx.objectStore('khachHang');
        const hold = () => { const read = store.get('__empty_ui_read_lock__'); read.onsuccess = () => { if (document.documentElement.dataset.holdEmptyRead) hold(); }; };
        hold(); tx.oncomplete = () => db.close(); resolve();
      };
    });
  });
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đang tải khách hàng…');
  await expect(page.locator('.empty-state')).toHaveCount(0);
  await page.evaluate(() => { delete document.documentElement.dataset.holdEmptyRead; });
  await expect(page.locator('.empty-state')).toHaveText('Chưa có thông tin khách hàng');
  await checkEmpty(page);
  await createCustomerForEmptyHistory(page);
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await expect(page.locator('.empty-state')).toHaveCount(0);
  const before = await inventoryData(page);
  await page.getByLabel('Tìm khách hàng theo số điện thoại').fill('0999999999');
  await expect(page.locator('.empty-state')).toHaveText('Không tìm thấy khách hàng');
  await checkEmpty(page);
  await page.getByRole('button', { name: 'Xóa tìm kiếm', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Khách kiểm tra lịch sử', exact: true })).toBeVisible();
  await page.reload(); await expect(page.locator('.empty-state')).toHaveCount(0);
  expect(await inventoryData(page)).toEqual(before);
});

test('purchase and sales validation keep their red warning and do not write on invalid save', async ({ page }) => {
  await bootstrapOwner(page); await login(page);
  for (const route of ['purchases', 'sales']) {
    await page.goto(`./#/${route}`);
    await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toBeEnabled();
    const before = await inventoryData(page);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    const warning = page.locator('.purchase-lines .empty-state');
    await expect(warning).toHaveText('Hãy thêm ít nhất một sản phẩm');
    await expect(warning).not.toHaveClass(/list-empty-state/);
    await expect(warning).toHaveCSS('color', 'rgb(255, 56, 60)');
    await expect(warning.locator('svg')).toHaveCSS('width', '24px');
    expect(await inventoryData(page)).toEqual(before);
  }
});
