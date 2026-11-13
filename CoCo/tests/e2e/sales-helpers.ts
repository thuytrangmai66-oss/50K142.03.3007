import { expect, type Page, type BrowserContext } from '@playwright/test';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';
import { login } from './auth-helpers';

export async function prepare(page: Page, context: BrowserContext, role: 'owner' | 'staff' = 'owner') {
  await createInventoryThroughUI(page, '2');
  const products = (await inventoryData(page)).sanPham;
  let target = page;
  if (role === 'staff') {
    await page.getByRole('link', { name: 'Nhân viên', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
    for (const [name, value] of [['Họ tên', 'Nhân viên bán hàng'], ['Số điện thoại', '0900000082'], ['Tên đăng nhập', 'staffsale'], ['Mật khẩu', 'sale-staff!']]) await form.getByLabel(name, { exact: true }).fill(value);
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Tạo tài khoản mới thành công');
    target = await context.newPage(); await target.goto('./'); await login(target, 'staffsale', 'sale-staff!');
  }
  await target.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await target.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await selectCustomer(target);
  return { target, products };
}
export async function selectCustomer(page: Page) {
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  await page.getByRole('button', { name: 'Khách G7', exact: true }).click();
}
export async function add(page: Page, id: string) {
  await page.getByRole('textbox', { name: 'Mã sản phẩm', exact: true }).fill(id);
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Mã sản phẩm', exact: true })).toHaveValue('');
}
export async function fiftyPoints(page: Page, points = 50) {
  await page.getByRole('checkbox', { name: 'Khách hàng đồng ý đăng ký thành viên' }).check();
  await expect(page.locator('.sales-membership-status')).toContainText('Điểm: 0');
  await page.evaluate(balance => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('khachHang', 'readwrite'), store = tx.objectStore('khachHang');
      const read = store.getAll();
      read.onsuccess = () => { const customer = read.result.find(row => row.SoDienThoaiKH === '0900000081'); store.put({ ...customer, DiemTichLuy: balance }); };
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), points);
  await page.reload(); await selectCustomer(page);
  await expect(page.locator('.sales-membership-status')).toContainText(`Điểm: ${points}`);
}

