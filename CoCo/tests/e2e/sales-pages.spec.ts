import { expect, test, type Page } from '@playwright/test';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';
import { addStaffFixture, login } from './auth-helpers';

async function chooseCustomer(page: Page) {
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  await page.getByRole('button', { name: 'Khách G7', exact: true }).click();
}
async function enterProduct(page: Page, id: string) {
  const input = page.getByRole('textbox', { name: 'Mã sản phẩm', exact: true });
  await input.fill(id); await input.press('Enter');
  await expect(input).toHaveValue('');
}

test('G8 sales list: real UI invoices, combined search/reset, pagination, immutable detail and both roles', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await createInventoryThroughUI(page, '12');
  const products = (await inventoryData(page)).sanPham;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await expect(page).toHaveURL(/#\/sales$/);
  await expect(page.getByText('Chưa có giao dịch bán hàng', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('sales-empty-1440x900.png') });
  for (let i = 0; i < 10; i++) {
    await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await chooseCustomer(page); await enterProduct(page, String(products[i].MaSP));
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Thanh toán thành công!');
    await expect(page).toHaveURL(/#\/sales$/);
  }
  const before = await inventoryData(page), invoice = before.hoaDonBanHang[0];
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(String(invoice.NgayBan)));
  await expect(page.locator('.sales-list tbody tr')).toHaveCount(9);
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('.sales-list tbody tr')).toHaveCount(1);
  const form = page.getByRole('form', { name: 'Tìm kiếm giao dịch bán hàng' });
  await form.getByLabel('Mã giao dịch', { exact: true }).fill(String(invoice.MaHDBH));
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  await form.getByLabel('Tên khách hàng', { exact: true }).fill('KHÁCH G7');
  await form.getByLabel('Thời gian', { exact: true }).fill(day);
  await form.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page.locator('.sales-list tbody tr')).toHaveCount(1);
  await page.getByRole('link', { name: String(invoice.MaHDBH), exact: true }).click();
  await expect(page.getByRole('heading', { name: `Chi tiết hóa đơn ${invoice.MaHDBH}` })).toBeVisible();
  await expect(page.locator('.sale-invoice')).toContainText('Tiền mặt');
  await expect(page.locator('.sale-invoice-totals')).toContainText('104.007');
  await page.screenshot({ path: info.outputPath('sales-detail-1440x900.png') });
  await page.reload();
  await expect(page.locator('.sale-invoice')).toContainText(String(invoice.MaHDBH));
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await form.getByLabel('Tên khách hàng', { exact: true }).fill('Không có khách này');
  await form.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page.getByText('Không tìm thấy giao dịch bán hàng', { exact: true })).toBeVisible();
  await form.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page.locator('.sales-list tbody tr')).toHaveCount(9);
  expect(await inventoryData(page)).toEqual(before);

  await addStaffFixture(page);
  const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff', 'staff-test!');
  staff.on('pageerror', error => errors.push(error.message));
  staff.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const afterAccount = await inventoryData(page);
  for (const [role, target] of [['owner', page], ['staff', staff]] as const) {
    await target.getByRole('link', { name: 'Bán hàng', exact: true }).click();
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      await target.setViewportSize(viewport);
      await expect(async () => {
        const capacity = Number(await target.locator('.sales-list').getAttribute('data-page-size'));
        expect(capacity).toBeGreaterThanOrEqual(1); expect(capacity).toBeLessThanOrEqual(9);
        await expect(target.locator('.sales-list tbody tr')).toHaveCount(Math.min(10, capacity));
      }).toPass();
      await expect(target.locator('.pagination')).toBeInViewport({ ratio: 1 });
      const reset = target.getByRole('button', { name: 'Xóa bộ lọc', exact: true });
      await expect(reset).toHaveCSS('color', 'rgb(0, 0, 0)');
      await expect(reset).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      if (viewport.width === 1440) {
        const header = (await target.locator('.page-header').boundingBox())!, search = (await target.locator('.purchase-search').boundingBox())!;
        expect(Math.abs(search.y - header.y - header.height - 12)).toBeLessThan(1);
      }
      const nav = (await target.locator('.pagination').boundingBox())!;
      const contentCenter = await target.locator('#main-content').evaluate(el => {
        const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
        const left = parseFloat(style.paddingLeft), right = parseFloat(style.paddingRight);
        return rect.left + el.clientLeft + left + (el.clientWidth - left - right) / 2;
      });
      expect(Math.abs(nav.x + nav.width / 2 - contentCenter)).toBeLessThan(2);
      expect(await target.locator('.data-table-scroll').evaluate(el => el.scrollHeight > el.clientHeight + 1)).toBe(false);
      await target.screenshot({ path: info.outputPath(`${role}-sales-list-${viewport.width}x${viewport.height}.png`) });
    }
    await target.getByRole('button', { name: 'Trang 2', exact: true }).click();
    const id = await target.locator('.sales-list tbody tr td:first-child a').innerText();
    await target.getByRole('link', { name: id, exact: true }).click();
    await expect(target.getByRole('heading', { name: `Chi tiết hóa đơn ${id}` })).toBeVisible();
    await target.getByRole('link', { name: 'Quay lại', exact: true }).click();
  }
  expect(await inventoryData(page)).toEqual(afterAccount); expect(errors).toEqual([]);
});

test('G8 sales list shows a native loading error and can retry without writes', async ({ page }) => {
  await createInventoryThroughUI(page);
  await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await expect(page.getByText('Chưa có giao dịch bán hàng', { exact: true })).toBeVisible();
  const before = await inventoryData(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'hoaDonBanHang') throw new DOMException('E2E read failure', 'UnknownError');
      return original.apply(this, args);
    };
    Object.assign(window, { restoreSalesRead: () => { IDBObjectStore.prototype.getAll = original; } });
  });
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không thể tải thông tin giao dịch. Vui lòng thử lại');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Không thể tải dữ liệu');
  await page.evaluate(() => (window as unknown as { restoreSalesRead(): void }).restoreSalesRead());
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(page.getByText('Chưa có giao dịch bán hàng', { exact: true })).toBeVisible();
  expect(await inventoryData(page)).toEqual(before);
});

test('G8 inline entry: manual/wedge Enter, duplicates and invalid codes preserve the real cart', async ({ page }) => {
  await createInventoryThroughUI(page, '2');
  const products = (await inventoryData(page)).sanPham, errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Phiếu bán hàng', exact: true })).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Mã sản phẩm', exact: true });
  await input.fill('SPmissing'); await input.press('Enter');
  await closeNotice(page, 'Không tìm thấy sản phẩm');
  expect((await inventoryData(page)).hoaDonBanHang).toHaveLength(0);
  await input.fill(String(products[0].MaSP)); await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(1);
  await input.fill(String(products[0].MaSP)); await input.press('Enter');
  await closeNotice(page, 'Sản phẩm đã có trong giỏ hàng');
  await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(1);
  await input.fill(''); await input.pressSequentially(String(products[1].MaSP)); await input.press('Enter');
  await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(2);
  await expect(page.locator('.sales-grand-total')).toContainText('208.014');
  await expect(page.locator('.purchase-lines th')).toHaveText(['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền']);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload(); await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page).toHaveURL(/#\/sales$/);
  await page.goto('./#/sales/transactions/identifier-too-long');
  await closeNotice(page, 'Không thể tải thông tin giao dịch. Vui lòng thử lại');
  await expect(page).toHaveURL(/#\/sales$/);
  expect((await inventoryData(page)).hoaDonBanHang).toHaveLength(0); expect(errors).toEqual([]);
});

test('G8 automatic discount updates live after another role earns points through a real sale', async ({ page, context }) => {
  await createInventoryThroughUI(page, '3'); await addStaffFixture(page);
  const products = (await inventoryData(page)).sanPham;
  await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click(); await chooseCustomer(page);
  await page.getByRole('checkbox', { name: 'Khách hàng đồng ý đăng ký thành viên' }).check();
  await expect(page.locator('.sales-membership-status')).toContainText('Điểm: 0');
  // Initial boundary fixture only. Changes observed below come from real UI payments.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB');
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('khachHang', 'readwrite'), store = tx.objectStore('khachHang'), read = store.getAll();
      read.onsuccess = () => { const customer = read.result.find(row => row.SoDienThoaiKH === '0900000081'); store.put({ ...customer, DiemTichLuy: 49 }); };
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    }; request.onerror = () => reject(request.error);
  }));
  await page.reload(); await chooseCustomer(page); await enterProduct(page, String(products[0].MaSP));
  await expect(page.locator('.sales-grand-total')).toContainText('104.007');
  const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff', 'staff-test!');
  await staff.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await staff.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await chooseCustomer(staff); await enterProduct(staff, String(products[1].MaSP));
  await staff.getByRole('button', { name: 'Lưu', exact: true }).click(); await closeNotice(staff, 'Thanh toán thành công!');
  await expect(page.locator('.sales-membership-status')).toContainText('Điểm: 59');
  await expect(page.locator('.sales-grand-total')).toContainText('83.206');
  await expect(page.getByRole('checkbox', { name: 'Dùng 50 điểm giảm 20%' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click(); await closeNotice(page, 'Thanh toán thành công!');
  await expect(staff.locator('.sales-list tbody tr')).toHaveCount(2);
  const rows = await inventoryData(page);
  expect(rows.khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(17);
  expect(rows.hoaDonBanHang).toHaveLength(2);
});
