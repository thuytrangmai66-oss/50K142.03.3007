import { expect, test, type Page } from '@playwright/test';
import { prepare, add, selectCustomer } from './sales-helpers';
import { inventoryData } from './inventory-helpers';
import { closeNotice, setup, addProduct, expectApprovalList } from './purchase-helpers';

async function report(page: Page, kind: string) {
  await page.goto(`./#/reports/${kind}`);
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
  await page.getByLabel('Năm', { exact: true }).fill('2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
}

test('G9-T06 approved purchase journey reconciles mixed-price stock, a real sale and both role dashboards', async ({ page, context }, info) => {
  const errors: string[] = [];
  const observe = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  observe(page); context.on('page', observe);
  await page.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const staff = await setup(page, context);
  await staff.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const ownerToken = await page.evaluate(() => sessionStorage.getItem('coco:session'));
  const staffToken = await staff.evaluate(() => sessionStorage.getItem('coco:session'));
  expect(ownerToken).not.toBe(staffToken);
  // Pending proposals must not create an invoice or physical stock.
  const pending = await inventoryData(staff);
  expect(pending.hoaDonThuMua).toHaveLength(0); expect(pending.sanPham).toHaveLength(0);
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Phê duyệt giá thu mua thành công'); await expectApprovalList(page);
  await closeNotice(staff, 'Yêu cầu phê duyệt được chấp thuận');
  await addProduct(staff, '80005');
  await staff.getByLabel('Số điện thoại', { exact: true }).fill('0900000095');
  await staff.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = staff.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách đối soát duyệt');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000095');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await staff.getByRole('button', { name: 'Khách đối soát duyệt', exact: true }).click();
  await staff.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(staff, 'Thu mua sản phẩm thành công');
  const purchased = await inventoryData(staff);
  expect(purchased.hoaDonThuMua).toHaveLength(1);
  expect(purchased.hoaDonThuMua[0]).toMatchObject({ TongTienTM: 200005, TrangThai: 1 });
  expect(purchased.productCosts.map(row => Number(row.unitCost)).sort((a, b) => a - b)).toEqual([80005, 120000]);
  expect(purchased.sanPham).toHaveLength(2);
  await staff.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await staff.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await staff.getByLabel('Số điện thoại', { exact: true }).fill('0900000095');
  await staff.getByRole('button', { name: 'Khách đối soát duyệt', exact: true }).click();
  for (const product of purchased.sanPham) await add(staff, String(product.MaSP));
  await staff.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(staff, 'Thanh toán thành công!');
  const paid = await inventoryData(staff);
  expect(paid.hoaDonBanHang).toHaveLength(1);
  expect(paid.hoaDonBanHang[0]).toMatchObject({ TongTien: 260007, TrangThai: 1 });
  expect(paid.chiTietHoaDonBH).toHaveLength(2);
  expect(paid.sanPham.every(row => row.TrangThai === 2)).toBe(true);
  for (const [kind, expected] of [['revenue', ['1', '260.007', '260.007']], ['purchase-cost', ['1', '2', '200.005', '200.005']],
    ['profit', ['260.007', '200.005', '60.002']], ['cash-flow', ['260.007', '200.005', '60.002']]] as const) {
    await report(page, kind);
    for (let i = 0; i < expected.length; i++) await expect(page.locator('.report-summary strong').nth(i)).toContainText(expected[i]);
    expect(await inventoryData(page)).toEqual(paid);
  }
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await staff.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Doanh thu hôm nay', exact: true })).toContainText('260.007');
  await expect(page.getByRole('article', { name: 'Yêu cầu chờ phê duyệt', exact: true })).toContainText('0 phiếu');
  await expect(page.getByRole('article', { name: 'Sản phẩm tồn kho', exact: true })).toContainText('0 sản phẩm');
  for (const [name, value] of [['Đơn thu mua hôm nay', '1 đơn'], ['Đơn hàng hôm nay', '1 đơn'], ['Sản phẩm mới nhập', '2 sản phẩm'], ['Khách hàng mới', '1 người đã xác minh']]) {
    await expect(staff.getByRole('article', { name, exact: true })).toContainText(value);
  }
  await page.screenshot({ path: info.outputPath('owner-approved-journey.png') });
  await staff.screenshot({ path: info.outputPath('staff-approved-journey.png') });
  await page.reload();
  await expect(page.getByRole('article', { name: 'Doanh thu hôm nay', exact: true })).toContainText('260.007');
  expect(await inventoryData(page)).toEqual(paid);
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(ownerToken);
  expect(await staff.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(staffToken);
  expect(errors).toEqual([]);
});

test('G9-T06 partial: independent staff sales update owner reports live and reconcile invoices, stock and costs', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  await page.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const errors: string[] = [];
  const observe = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  context.pages().forEach(observe); context.on('page', observe);
  const { target: staff, products } = await prepare(page, context, 'staff');
  await staff.clock.setFixedTime(new Date('2026-11-14T09:00:00+07:00'));
  const ownerToken = await page.evaluate(() => sessionStorage.getItem('coco:session'));
  const staffToken = await staff.evaluate(() => sessionStorage.getItem('coco:session'));
  expect(ownerToken).not.toBe(staffToken);

  await report(page, 'profit');
  await expect(page.locator('.empty-state')).toBeVisible();
  await add(staff, String(products[0].MaSP));
  await staff.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(staff, 'Thanh toán thành công!');
  // No reload/navigation on the owner tab: this must be the live DB subscription.
  await expect(page.locator('.report-summary strong').nth(0)).toContainText('104.007');
  await expect(page.locator('.report-summary strong').nth(1)).toContainText('80.005');
  await expect(page.locator('.report-summary strong').nth(2)).toContainText('24.002');
  await page.screenshot({ path: info.outputPath('owner-profit-live.png') });

  await report(page, 'cash-flow');
  await expect(page.locator('.report-summary strong').nth(2)).toContainText('-56.003');
  await staff.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await selectCustomer(staff); await add(staff, String(products[1].MaSP));
  await staff.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(staff, 'Thanh toán thành công!');
  await expect(page.locator('.report-summary strong').nth(0)).toContainText('208.014');
  await expect(page.locator('.report-summary strong').nth(1)).toContainText('160.010');
  await expect(page.locator('.report-summary strong').nth(2)).toContainText('48.004');
  const finalized = await inventoryData(page);
  expect(finalized.hoaDonBanHang).toHaveLength(2); expect(finalized.hoaDonThuMua).toHaveLength(1);
  expect(finalized.chiTietHoaDonBH).toHaveLength(2); expect(finalized.sanPham).toHaveLength(2);
  expect(finalized.hoaDonBanHang.reduce((sum, row) => sum + Number(row.TongTien), 0)).toBe(208014);
  expect(finalized.productCosts.reduce((sum, row) => sum + Number(row.unitCost), 0)).toBe(160010);
  expect(finalized.sanPham.every(row => row.TrangThai === 2)).toBe(true);
  const sourceInvoice = String(finalized.hoaDonThuMua[0].MaHDTM);
  const mapping = finalized.appMetadata.find(row => row.key === `purchase-status-mapping:${sourceInvoice}`);
  expect(JSON.parse(String(mapping?.value))).toEqual({ invoiceCompleted: 1, productAvailable: 1, productSold: 2 });
  const records = [
    ['revenue', ['2', '208.014', '104.007']],
    ['purchase-cost', ['1', '2', '160.010', '160.010']],
    ['profit', ['208.014', '160.010', '48.004']],
    ['cash-flow', ['208.014', '160.010', '48.004']],
  ] as const;
  for (const [kind, expected] of records) {
    await report(page, kind);
    for (let i = 0; i < expected.length; i++) await expect(page.locator('.report-summary strong').nth(i)).toContainText(expected[i]);
    expect(await inventoryData(page)).toEqual(finalized);
  }
  await page.reload(); await report(page, 'profit');
  await expect(page.locator('.report-summary strong').nth(2)).toContainText('48.004');
  expect(await inventoryData(page)).toEqual(finalized);
  await page.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody').getByText('Đã bán', { exact: true })).toHaveCount(2);
  expect(await inventoryData(page)).toEqual(finalized);
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(ownerToken);
  expect(await staff.evaluate(() => sessionStorage.getItem('coco:session'))).toBe(staffToken);
  await expect(staff.getByRole('link', { name: 'Báo cáo', exact: true })).toHaveCount(0);
  await staff.screenshot({ path: info.outputPath('staff-paid-list.png') });
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await staff.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Doanh thu hôm nay', exact: true })).toContainText('208.014');
  await expect(page.getByRole('article', { name: 'Sản phẩm tồn kho', exact: true })).toContainText('0 sản phẩm');
  await expect(staff.getByRole('article', { name: 'Đơn thu mua hôm nay', exact: true })).toContainText('1 đơn');
  await expect(staff.getByRole('article', { name: 'Đơn hàng hôm nay', exact: true })).toContainText('2 đơn');
  await expect(staff.getByRole('article', { name: 'Sản phẩm mới nhập', exact: true })).toContainText('2 sản phẩm');
  await expect(staff.getByRole('article', { name: 'Khách hàng mới', exact: true })).toContainText('1 người đã xác minh');
  await page.screenshot({ path: info.outputPath('owner-home-reconciled.png') });
  await staff.screenshot({ path: info.outputPath('staff-home-reconciled.png') });
  expect(await inventoryData(page)).toEqual(finalized);
  expect(errors).toEqual([]);
});
