import { expect, test } from '@playwright/test';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { addProduct, closeNotice } from './purchase-helpers';
import { add, selectCustomer } from './sales-helpers';

test.use({ timezoneId: 'America/Los_Angeles' });

for (const action of ['sell', 'purchase'] as const) test(`G9-D05 ${action}: verified month-end comparison through real UI, foreign timezone and readonly reload`, async ({ page }, info) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.clock.setFixedTime(new Date('2026-10-31T23:59:59.999+07:00'));
  await createInventoryThroughUI(page, '2');
  const products = (await inventoryData(page)).sanPham;
  await page.clock.setFixedTime(new Date('2026-11-01T00:00:00+07:00'));
  // G7's day catch-up is legitimate setup, never hidden from readonly assertions.
  await page.reload();
  await expect.poll(async () => {
    const data = await inventoryData(page), day = data.appMetadata.find(row => row.key === 'discount-day:2026-11-01');
    const run = data.appMetadata.find(row => row.key === `discount-run:${day?.value}`);
    return Boolean(run && JSON.parse(String(run.value)).status === 'success');
  }).toBe(true);
  if (action === 'sell') {
    await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await selectCustomer(page); await add(page, String(products[0].MaSP));
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Thanh toán thành công!');
  } else {
    await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await addProduct(page, '80005');
    await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
    await page.getByRole('button', { name: 'Khách G7', exact: true }).click();
    await page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Thu mua sản phẩm thành công');
  }
  const before = await inventoryData(page);
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  const stock = page.getByRole('article', { name: 'Sản phẩm tồn kho', exact: true });
  await expect(stock).toContainText(action === 'sell' ? '1 sản phẩm' : '3 sản phẩm');
  await expect(stock).toContainText(`${action === 'sell' ? '-50' : '+50'}% so với tháng trước`);
  await page.screenshot({ path: info.outputPath(`${action}-month-end.png`) });
  expect(await inventoryData(page)).toEqual(before);
  await page.reload();
  await expect(stock).toContainText(`${action === 'sell' ? '-50' : '+50'}% so với tháng trước`);
  expect(await inventoryData(page)).toEqual(before);
  if (action === 'sell') {
    // Simulated legacy/missing-time evidence in this isolated test profile only.
    const invoiceId = String(before.hoaDonBanHang[0].MaHDBH);
    await page.evaluate(id => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('appMetadata', 'readwrite'), store = tx.objectStore('appMetadata');
        const read = store.get(`sales-invoice:${id}`);
        read.onsuccess = () => {
          const marker = read.result, value = JSON.parse(marker.value); delete value.paidAt;
          store.put({ ...marker, value: JSON.stringify(value) });
        };
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
      };
    }), invoiceId);
    const missingTime = await inventoryData(page);
    // Native fixture writes bypass Dexie's mutation notifications. Open the
    // simulated legacy dataset as on migration/reopen, not a fake app action.
    await page.reload();
    await expect(stock).toContainText('Chưa đủ cơ sở so với tháng trước');
    await expect(stock).not.toContainText('-50%');
    await page.reload(); await expect(stock).toContainText('Chưa đủ cơ sở so với tháng trước');
    expect(await inventoryData(page)).toEqual(missingTime);
  }
  expect(errors).toEqual([]);
});
