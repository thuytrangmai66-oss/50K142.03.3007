import { expect, type Page } from '@playwright/test';
import { bootstrapOwner, login } from './auth-helpers';
import { createBracket, addProduct, closeNotice } from './purchase-helpers';

export async function createInventoryThroughUI(page: Page, quantity = '2') {
  await bootstrapOwner(page); await login(page); await createBracket(page);
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await addProduct(page, '80005', quantity);
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  await page.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách G7');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Khách G7', exact: true }).click();
  await page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Thu mua sản phẩm thành công');
}
export async function inventoryData(page: Page) {
  return page.evaluate(() => new Promise<Record<string, Array<Record<string, unknown>>>>((resolve, reject) => {
    const req = indexedDB.open('CoCoDB'); req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction(Array.from(db.objectStoreNames), 'readonly'), rows: Record<string, Array<Record<string, unknown>>> = {};
      for (const name of Array.from(db.objectStoreNames)) { const read = tx.objectStore(name).getAll(); read.onsuccess = () => { rows[name] = read.result; }; }
      tx.oncomplete = () => { db.close(); resolve(rows); }; tx.onabort = () => reject(tx.error);
    };
  }));
}
export async function openInventoryEditor(page: Page, id: string) {
  await page.goto(`./#/inventory/${id}`);
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Sửa thông tin hàng hóa', exact: true });
  await expect(form).toBeVisible(); return form;
}
