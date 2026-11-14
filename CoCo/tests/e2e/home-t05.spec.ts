import { expect, test } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DollarSign, ShoppingCart, ShoppingBag, Clock, Package, UserRoundPlus } from 'lucide-react';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';
import { inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';

test('T05 approved M01-B: independent staff dashboard updates live on real profile create/delete and preserves legacy after reload', async ({ page, context }, info) => {
  await page.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await bootstrapOwner(page); await addStaffFixture(page); await login(page);
  // Explicit old-profile fixture in the isolated browser only; no creation date is invented.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('CoCoDB'); req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction('khachHang', 'readwrite');
      tx.objectStore('khachHang').add({ MaKH: 'KHLEGACY', TenKH: 'Khách legacy', SoDienThoaiKH: '0900000097', DiemTichLuy: 0 });
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
  const staff = await context.newPage();
  await staff.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  staff.on('pageerror', error => errors.push(error.message));
  await staff.goto('./'); await login(staff, 'staff', 'staff-test!');
  const customerCard = staff.getByRole('article', { name: 'Khách hàng mới', exact: true });
  await expect(customerCard).toContainText('0 người đã xác minh');
  await expect(customerCard).toContainText('1 hồ sơ chưa có ngày tạo tin cậy');
  const ownerToken = await page.evaluate(() => sessionStorage.getItem('coco:session'));
  const staffToken = await staff.evaluate(() => sessionStorage.getItem('coco:session'));
  expect(ownerToken).not.toBe(staffToken);
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách KPI');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000098');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Đã thêm thông tin khách hàng');
  await expect(customerCard).toContainText('1 người đã xác minh');
  const created = await inventoryData(page), key = String(created.khachHang.find(row => row.TenKH === 'Khách KPI')!.MaKH);
  expect(created.appMetadata.filter(row => String(row.key).startsWith('customer-creation:'))).toHaveLength(1);
  await staff.screenshot({ path: info.outputPath('staff-kpi-verified-legacy.png') });
  await page.getByRole('link', { name: 'Khách KPI', exact: true }).click();
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click();
  await page.getByRole('dialog', { name: 'Có chắc chắn xóa thông tin khách hàng không?', exact: true }).getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(page, 'Đã xóa thông tin khách hàng');
  await expect(customerCard).toContainText('0 người đã xác minh');
  const deleted = await inventoryData(page);
  expect(deleted.appMetadata.find(row => row.key === `customer-creation:${key}`)).toBeUndefined();
  expect(deleted.khachHang).toEqual(created.khachHang.filter(row => row.MaKH === 'KHLEGACY'));
  await staff.reload(); await expect(customerCard).toContainText('1 hồ sơ chưa có ngày tạo tin cậy');
  expect(await inventoryData(staff)).toEqual(deleted);
  expect(await staff.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(staffToken);
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(ownerToken);
  await expect(staff.getByRole('link', { name: 'Báo cáo', exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('T05 dashboard storage failure reports an error, offers retry and never displays a false zero', async ({ page }) => {
  await bootstrapOwner(page); await login(page);
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.getAll;
    Object.assign(window, { restoreDashboardRead: () => { IDBObjectStore.prototype.getAll = original; } });
    IDBObjectStore.prototype.getAll = function (...args: Parameters<typeof original>) {
      if (this.name === 'purchaseApprovals') throw new DOMException('Dashboard read fault', 'UnknownError');
      return original.apply(this, args);
    };
  });
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Lỗi hệ thống, vui lòng thử lại sau');
  await expect(page.getByRole('article', { name: 'Doanh thu hôm nay', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.evaluate(() => (window as unknown as { restoreDashboardRead: () => void }).restoreDashboardRead());
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Doanh thu hôm nay', exact: true })).toContainText('Chưa có cơ sở so với hôm qua');
});

for (const role of ['owner', 'staff'] as const) test(`T05 ${role}: real quick actions open lists without creating any business records`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page);
  if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await expect(page.locator('.home-kpi')).toHaveCount(4);
  const actions = page.getByRole('region', { name: 'Truy cập nhanh', exact: true });
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await expect(actions.getByRole('link', { name: 'Truy cập nhanh Thu mua', exact: true })).toBeInViewport({ ratio: 1 });
    await expect(actions.getByRole('link', { name: 'Truy cập nhanh Bán hàng', exact: true })).toBeInViewport({ ratio: 1 });
    for (const card of await page.locator('.home-kpi').all()) await expect(card).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${role}-home-${viewport.width}.png`) });
  }
  const before = await inventoryData(page);
  await actions.getByRole('link', { name: 'Truy cập nhanh Thu mua', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchases$/);
  await expect(page.getByRole('button', { name: 'Tạo giao dịch', exact: true })).toBeVisible();
  expect(await inventoryData(page)).toEqual(before);
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await actions.getByRole('link', { name: 'Truy cập nhanh Bán hàng', exact: true }).click();
  await expect(page).toHaveURL(/#\/sales$/);
  expect(await inventoryData(page)).toEqual(before);
  await page.reload(); expect(await inventoryData(page)).toEqual(before);
  expect(errors).toEqual([]);
});

test('T05 review-only: render proposed card wording outside runtime for approval', async ({ page }, info) => {
  const root = process.cwd();
  let html = await readFile(path.join(root, 'tests/e2e/dashboard-review-template.html'), 'utf8');
  for (const weight of [400, 700]) {
    const font = await readFile(path.join(root, `node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-${weight}-normal.woff2`));
    html = html.replace(`__FONT_${weight}__`, font.toString('base64'));
  }
  for (const [name, Icon] of [['dollar', DollarSign], ['cart', ShoppingCart], ['bag', ShoppingBag], ['clock', Clock], ['package', Package], ['users', UserRoundPlus]] as const) {
    html = html.replaceAll(`{{${name}}}`, renderToStaticMarkup(createElement(Icon, { 'aria-hidden': true })));
  }
  const reviewDir = path.join(root, 'planning/phase9/review');
  await mkdir(reviewDir, { recursive: true });
  await writeFile(path.join(reviewDir, 't05-dashboard.html'), html);
  await page.setViewportSize({ width: 1180, height: 1000 });
  await page.setContent(html); await page.evaluate(() => document.fonts.ready);
  for (const role of ['owner', 'staff']) {
    await expect(page.locator(`#${role} .card`)).toHaveCount(4);
    await page.locator(`#${role}`).screenshot({ path: info.outputPath(`${role}-proposal.png`) });
  }
});
