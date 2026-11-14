import { expect, test, type BrowserContext } from '@playwright/test';
import { prepare, selectCustomer, add, fiftyPoints } from './sales-helpers';
import { inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';

const browserErrors = new WeakMap<BrowserContext, string[]>();
test.beforeEach(({ context }) => {
  const errors: string[] = []; browserErrors.set(context, errors);
  const observe = (page: import('@playwright/test').Page) => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  context.pages().forEach(observe); context.on('page', observe);
});
test.afterEach(({ context }) => { expect(browserErrors.get(context)).toEqual([]); });

test('T05 both roles: customer purchase history preserves paid snapshots after profile edits and prints read-only', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const { target: staff, products } = await prepare(page, context, 'staff');
  await fiftyPoints(staff); await add(staff, String(products[0].MaSP)); await add(staff, String(products[1].MaSP));
  await staff.getByRole('button', { name: 'Lưu', exact: true }).click(); await closeNotice(staff, 'Thanh toán thành công!');
  const saved = await inventoryData(staff), invoiceId = String(saved.hoaDonBanHang[0].MaHDBH);
  const customerId = String(saved.khachHang.find(row => row.SoDienThoaiKH === '0900000081')!.MaKH);
  await page.goto(`./#/customers/${customerId}`);
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const edit = page.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true });
  await edit.getByLabel('Họ tên', { exact: true }).fill('Khách đã đổi tên');
  await edit.getByLabel('Số điện thoại', { exact: true }).fill('0900000099');
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Cập nhật thông tin khách hàng thành công');
  const afterEdit = await inventoryData(page);
  for (const [role, target] of [['owner', page], ['staff', staff]] as const) {
    await target.goto(`./#/customers/${customerId}`);
    await target.getByRole('link', { name: 'Lịch sử mua', exact: true }).click();
    await expect(target.getByRole('row', { name: new RegExp(invoiceId) })).toContainText('Hoàn tất');
    await target.getByRole('link', { name: invoiceId, exact: true }).click();
    await expect(target.getByRole('heading', { name: `Chi tiết hóa đơn ${invoiceId}`, exact: true })).toBeVisible();
    const card = target.locator('.sale-invoice');
    await expect(card).toContainText('Khách G7'); await expect(card).toContainText('0900000081');
    await expect(card).not.toContainText('Khách đã đổi tên');
    await expect(card).toContainText('Tiền mặt'); await expect(card.locator('tbody tr')).toHaveCount(2);
    await expect(card.locator('.sale-invoice-totals')).toContainText('166.411');
    await target.reload(); await expect(card).toContainText(invoiceId);
    await target.screenshot({ path: info.outputPath(`${role}-customer-paid-history-1440x900.png`) });
    await target.emulateMedia({ media: 'print' });
    await expect(target.locator('html')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(target.locator('.sidebar')).toBeHidden(); await expect(target.locator('.page-header')).toBeHidden();
    await expect(target.locator('.reference-toolbar')).toBeHidden(); await expect(target.getByRole('link', { name: 'Quay lại', exact: true })).toBeHidden();
    await expect(card).toBeVisible();
    expect(await target.locator('#main-content').evaluate(el => getComputedStyle(el).overflowY)).toBe('visible');
    await target.screenshot({ path: info.outputPath(`${role}-invoice-print.png`), fullPage: true });
    expect(await inventoryData(target)).toEqual(afterEdit);
    await target.emulateMedia({ media: 'screen' });
    await expect(target.locator('.sidebar')).toBeVisible();
    await target.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await target.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await target.getByRole('link', { name: 'Lịch sử bán', exact: true }).click();
    await expect(target.locator('.history-card')).not.toContainText(invoiceId);
  }
  expect(await inventoryData(page)).toEqual(afterEdit);
});

test('T06 two roles holding QR for different items cannot consume the same 50 points twice; stale tab recovers without reload', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const { target: staff, products } = await prepare(page, context, 'staff');
  await fiftyPoints(staff); await add(staff, String(products[0].MaSP));
  await staff.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
  await staff.getByRole('button', { name: 'Lưu', exact: true }).click();
  const staffQr = staff.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
  await expect(staffQr).toContainText('83.206');
  await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await selectCustomer(page); await add(page, String(products[1].MaSP));
  await page.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const ownerQr = page.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
  await expect(ownerQr).toContainText('83.206');
  await staffQr.getByRole('button', { name: 'Đã nhận', exact: true }).click({ clickCount: 2 });
  await closeNotice(staff, 'Thanh toán thành công!');
  const first = await inventoryData(staff);
  expect(first.khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(8);
  await ownerQr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
  const error = page.getByRole('alertdialog'); await expect(error).toContainText('Thông tin thanh toán đã thay đổi');
  await page.screenshot({ path: info.outputPath('owner-stale-points-qr.png') });
  expect(await inventoryData(page)).toEqual(first);
  await error.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await ownerQr.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.locator('.sales-membership-status')).toContainText('Điểm: 8');
  await expect(page.locator('.sales-grand-total')).toContainText('104.007');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(ownerQr).toContainText('104.007');
  await ownerQr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
  await closeNotice(page, 'Thanh toán thành công!');
  const paid = await inventoryData(page);
  expect(paid.hoaDonBanHang).toHaveLength(2); expect(paid.chiTietHoaDonBH).toHaveLength(2);
  expect(paid.khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(18);
  expect(paid.sanPham.every(row => row.TrangThai === 2)).toBe(true);
  await page.reload(); await staff.reload();
  await expect(page.locator('.sales-list tbody tr')).toHaveCount(2);
  await expect(staff.locator('.sales-list tbody tr')).toHaveCount(2);
  expect(await inventoryData(page)).toEqual(paid);
  await expect(page.locator('.account-name')).toHaveText('Chủ kiểm thử');
  await expect(staff.locator('.account-name')).toHaveText('Nhân viên bán hàng');
});

test('T06 scheduler catch-up invalidates an open QR and retry uses the real new price', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  await page.clock.install({ time: new Date('2026-07-01T03:00:00Z') });
  const { products } = await prepare(page, context);
  await add(page, String(products[0].MaSP));
  await page.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const qr = page.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
  await expect(qr).toContainText('104.007');
  await page.clock.setFixedTime(new Date('2026-08-05T03:00:00Z'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(async () => {
    const data = await inventoryData(page);
    const row = data.sanPham.find(row => row.MaSP === products[0].MaSP);
    expect(row?.GiaBanHienHanh).toBe(72805);
    // Wait for the scheduler's separate run bookkeeping to finish before
    // snapshotting every store to prove the rejected payment writes nothing.
    const runs = data.appMetadata.filter(row => String(row.key).startsWith('discount-run:'))
      .map(row => JSON.parse(String(row.value)) as { scheduledFor: string; status: string });
    expect(runs).toContainEqual(expect.objectContaining({ scheduledFor: '2026-08-05T00:00:00+07:00', status: 'success' }));
    expect(data.appMetadata.some(row => row.key === 'discount-lock')).toBe(false);
  }).toPass();
  const discounted = await inventoryData(page);
  await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('đã thay đổi trạng thái hoặc giá');
  expect(await inventoryData(page)).toEqual(discounted);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await qr.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('button', { name: `Xóa sản phẩm ${products[0].MaSP}`, exact: true }).click();
  await add(page, String(products[0].MaSP));
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(qr).toContainText('72.805');
  await page.screenshot({ path: info.outputPath('scheduler-repriced-qr.png') });
  await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click(); await closeNotice(page, 'Thanh toán thành công!');
  const paid = await inventoryData(page);
  expect(paid.hoaDonBanHang).toHaveLength(1); expect(paid.hoaDonBanHang[0].TongTien).toBe(72805);
  expect(paid.sanPham.find(row => row.MaSP === products[0].MaSP)?.TrangThai).toBe(2);
});
