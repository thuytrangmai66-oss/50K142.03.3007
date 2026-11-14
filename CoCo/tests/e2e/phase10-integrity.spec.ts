import { expect, test } from '@playwright/test';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { addProduct, closeNotice } from './purchase-helpers';
import { selectCustomer } from './sales-helpers';

test('G10-T04 native 1000-item graph: a final audit failure rolls back every write and retry commits exactly once', async ({ page }, info) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await createInventoryThroughUI(page, '1000');
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await addProduct(page, '80005'); await selectCustomer(page);
  const save = page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true });
  await expect(save).toBeEnabled();
  const before = await inventoryData(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === 'auditEntries' && String(args[0]?.id).startsWith('purchase-finalize:')) {
        IDBObjectStore.prototype.add = original;
        throw new DOMException('G10 last-write failure on a 1000-item graph', 'QuotaExceededError');
      }
      return original.apply(this, args);
    };
  });
  await save.click({ clickCount: 2 });
  await expect(page.getByRole('alertdialog')).toContainText('Không thể lưu giao dịch thu mua');
  expect(await inventoryData(page)).toEqual(before);
  await page.screenshot({ path: info.outputPath('1000-item-atomic-rollback.png') });
  await closeNotice(page, 'Không thể lưu giao dịch thu mua');
  await expect(save).toBeEnabled(); await save.click();
  await expect(page.getByRole('alertdialog')).toContainText('Thu mua sản phẩm thành công');
  const after = await inventoryData(page);
  expect(after.hoaDonThuMua).toHaveLength(2); expect(after.purchaseFinalizations).toHaveLength(2);
  expect(after.sanPham).toHaveLength(1001); expect(after.productCosts).toHaveLength(1001);
  expect(after.purchaseProvenance).toHaveLength(1001);
  const receipts = after.operations.filter(row => String(row.id).startsWith('purchase-finalize:'));
  expect(receipts).toHaveLength(2);
  expect(after.auditEntries.filter(row => String(row.id).startsWith('purchase-finalize:')).map(row => row.id).sort()).toEqual(receipts.map(row => row.id).sort());
  await closeNotice(page, 'Thu mua sản phẩm thành công');
  await expect(page).toHaveURL(/#\/purchases$/);
  await page.reload();
  await expect(page.locator('.purchase-list')).toBeVisible();
  expect(await inventoryData(page)).toEqual(after);
  expect(errors).toEqual([]);
});
