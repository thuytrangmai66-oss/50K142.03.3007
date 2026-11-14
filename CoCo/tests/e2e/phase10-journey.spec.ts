import { expect, test, type Page } from '@playwright/test';
import { setup, addProduct, closeNotice, expectApprovalList } from './purchase-helpers';
import { inventoryData } from './inventory-helpers';
import { add } from './sales-helpers';

const phone = '0900000101', customerName = 'Khách hành trình G10';
async function cart(page: Page) {
  await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await page.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  await page.getByRole('button', { name: customerName, exact: true }).click();
}
async function pay(page: Page, transfer: boolean) {
  if (transfer) await page.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  if (transfer) {
    const qr = page.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
    await expect(qr.locator('img')).toHaveAttribute('src', /^data:image\//);
    await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
  }
  await closeNotice(page, 'Thanh toán thành công!');
  await expect(page.locator(':modal')).toHaveCount(0);
}

for (const firstSeller of ['staff', 'owner'] as const) test(`G10-T01 ${firstSeller} sells first: approval, real earned points, redemption, history and all financial reports`, async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [], externalRequests: string[] = [];
  const origin = new URL(String(test.info().project.use.baseURL)).origin;
  const observe = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    target.on('request', request => {
      const url = new URL(request.url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) externalRequests.push(url.origin);
    });
  };
  observe(page); context.on('page', observe);
  await page.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const staff = await setup(page, context);
  await staff.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const ownerToken = await page.evaluate(() => sessionStorage.getItem('coco:session'));
  const staffToken = await staff.evaluate(() => sessionStorage.getItem('coco:session'));
  expect(Boolean(ownerToken && staffToken && ownerToken !== staffToken)).toBe(true);
  await addProduct(staff, '100000', '5');
  await staff.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  await staff.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = staff.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill(customerName);
  await form.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await staff.getByRole('button', { name: customerName, exact: true }).click();
  await staff.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(staff.getByText('Sản phẩm chưa được duyệt giá', { exact: true })).toBeVisible();
  const pending = await inventoryData(staff);
  expect(pending.hoaDonThuMua).toHaveLength(0); expect(pending.sanPham).toHaveLength(0);
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Phê duyệt giá thu mua thành công'); await expectApprovalList(page);
  await closeNotice(staff, 'Yêu cầu phê duyệt được chấp thuận');
  await staff.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(staff, 'Thu mua sản phẩm thành công');
  const purchased = await inventoryData(staff);
  expect(purchased.hoaDonThuMua).toHaveLength(1);
  expect(purchased.hoaDonThuMua[0]).toMatchObject({ TongTienTM: 620000, TrangThai: 1 });
  expect(purchased.sanPham).toHaveLength(6);
  const premium = purchased.sanPham.find(row => row.GiaBanHienHanh === 156000)!;
  const normal = purchased.sanPham.filter(row => row.GiaBanHienHanh === 130000);
  expect(normal).toHaveLength(5);
  const first = firstSeller === 'staff' ? staff : page, second = firstSeller === 'staff' ? page : staff;
  await cart(first);
  await first.getByRole('checkbox', { name: 'Khách hàng đồng ý đăng ký thành viên' }).check();
  await expect(first.locator('.sales-membership-status')).toContainText('Điểm: 0');
  for (const item of [premium, ...normal.slice(0, 3)]) await add(first, String(item.MaSP));
  await pay(first, firstSeller === 'owner');
  const earned = await inventoryData(first);
  const customer = earned.khachHang.find(row => row.SoDienThoaiKH === phone)!;
  expect(customer.DiemTichLuy).toBe(54);
  expect(earned.hoaDonBanHang).toHaveLength(1);
  expect(earned.hoaDonBanHang[0]).toMatchObject({ TongTien: 546000, TienKhuyenMai: 0, TichDiem: 54 });
  await cart(second);
  await expect(second.locator('.sales-membership-status')).toContainText('Điểm: 54');
  await add(second, String(normal[3].MaSP));
  await expect(second.locator('.purchase-total').filter({ hasText: 'Khuyến mãi' })).toContainText('26.000');
  await pay(second, firstSeller === 'staff');
  const paid = await inventoryData(second);
  expect(paid.hoaDonBanHang).toHaveLength(2); expect(paid.chiTietHoaDonBH).toHaveLength(5);
  expect(paid.khachHang.find(row => row.MaKH === customer.MaKH)?.DiemTichLuy).toBe(14);
  expect(paid.hoaDonBanHang.find(row => row.TongTien === 104000)).toMatchObject({ TienKhuyenMai: 26000, TichDiem: 10 });
  expect(paid.hoaDonBanHang.map(row => row.PTTT).sort()).toEqual([1, 2]);
  expect(paid.sanPham.filter(row => row.TrangThai === 1)).toHaveLength(1);
  expect(paid.sanPham.filter(row => row.TrangThai === 2)).toHaveLength(5);
  const snapshots = paid.appMetadata.filter(row => String(row.key).startsWith('sales-invoice:')).map(row => JSON.parse(String(row.value)).snapshot);
  expect(snapshots.find(row => row.total === 546000).customer).toMatchObject({ pointsBefore: 0, pointsEarned: 54, pointsAfter: 54 });
  expect(snapshots.find(row => row.total === 104000).customer).toMatchObject({ pointsBefore: 54, pointsUsed: 50, pointsEarned: 10, pointsAfter: 14 });
  for (const [label, expected] of [
    ['Xem báo cáo doanh thu bán hàng', ['2', '650.000', '325.000']],
    ['Xem báo cáo chi phí thu mua', ['1', '6', '620.000', '620.000']],
    ['Xem báo cáo lợi nhuận', ['650.000', '520.000', '130.000']],
    ['Xem báo cáo dòng tiền', ['650.000', '620.000', '30.000']],
  ] as const) {
    await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('button', { name: 'Theo ngày', exact: true }).click();
    await page.getByLabel('Ngày', { exact: true }).fill('14/11/2026');
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    for (let i = 0; i < expected.length; i++) await expect(page.locator('.report-summary strong').nth(i)).toContainText(expected[i]);
    expect(await inventoryData(page)).toEqual(paid);
  }
  for (const target of [page, staff]) {
    await target.getByRole('link', { name: 'Khách hàng', exact: true }).click();
    await target.getByRole('link', { name: customerName, exact: true }).click();
    await target.getByRole('link', { name: 'Lịch sử bán', exact: true }).click();
    await expect(target.getByRole('link', { name: String(paid.hoaDonThuMua[0].MaHDTM), exact: true })).toBeVisible();
    await target.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await target.getByRole('link', { name: 'Lịch sử mua', exact: true }).click();
    for (const invoice of paid.hoaDonBanHang) await expect(target.getByRole('link', { name: String(invoice.MaHDBH), exact: true })).toBeVisible();
    await target.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  }
  await expect(page.getByRole('article', { name: 'Doanh thu hôm nay', exact: true })).toContainText('650.000');
  await expect(page.getByRole('article', { name: 'Sản phẩm tồn kho', exact: true })).toContainText('1 sản phẩm');
  await expect(staff.getByRole('article', { name: 'Sản phẩm mới nhập', exact: true })).toContainText('6 sản phẩm');
  await expect(staff.getByRole('article', { name: 'Đơn hàng hôm nay', exact: true })).toContainText('2 đơn');
  await page.screenshot({ path: info.outputPath(`${firstSeller}-first-owner-dashboard.png`) });
  await staff.screenshot({ path: info.outputPath(`${firstSeller}-first-staff-dashboard.png`) });
  for (const target of [page, staff]) {
    const html = await target.content();
    // Assert booleans so a failure cannot print hashes/salts into artifacts.
    for (const credential of paid.accountSecurity) for (const field of ['passwordHash', 'passwordSalt']) {
      expect(html.includes(String(credential[field]))).toBe(false);
    }
    await target.reload();
    await expect(target.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
    expect(await inventoryData(target)).toEqual(paid);
  }
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(ownerToken);
  expect(await staff.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(staffToken);
  expect(externalRequests).toEqual([]); expect(errors).toEqual([]);
});
