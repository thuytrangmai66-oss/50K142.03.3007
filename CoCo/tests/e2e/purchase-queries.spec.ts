import { test, expect, type Page } from '@playwright/test';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';
import { addProduct, createBracket, closeNotice } from './purchase-helpers';

async function stored(page: Page) {
  return page.evaluate(() => new Promise<Record<string, Array<Record<string, unknown>>>>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, names = Array.from(db.objectStoreNames), result: Record<string, Array<Record<string, unknown>>> = {};
      const tx = db.transaction(names, 'readonly');
      for (const name of names) { const read = tx.objectStore(name).getAll(); read.onsuccess = () => { result[name] = read.result; }; }
      tx.oncomplete = () => { db.close(); resolve(result); }; tx.onabort = () => reject(tx.error);
    };
  }));
}

async function completePurchase(page: Page) {
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await expect(page.getByText('Chưa có giao dịch thu mua', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await addProduct(page, '80005', '2'); await addProduct(page, '90000');
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000055');
  await page.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách T06');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000055');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Khách T06', exact: true }).click();
  await page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Thu mua sản phẩm thành công');
  const data = await stored(page);
  return { invoiceId: String(data.hoaDonThuMua[0].MaHDTM), customerId: String(data.khachHang[0].MaKH) };
}

for (const role of ['owner', 'staff'] as const) {
  test(`T06 ${role}: real mixed-price purchase, combined search, reload, stable customer history and read-only views`, async ({ page, context }, info) => {
    const errors: string[] = [];
    context.on('page', p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); });
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await bootstrapOwner(page); await login(page); await createBracket(page);
    let reader = page;
    if (role === 'staff') { await addStaffFixture(page); reader = await context.newPage(); await reader.goto('./'); await login(reader, 'staff', 'staff-test!'); }
    const { invoiceId, customerId } = await completePurchase(reader);
    await reader.getByLabel('Mã giao dịch', { exact: true }).fill('NO-MATCH');
    await reader.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
    await expect(reader.getByText('Không tìm thấy giao dịch thu mua', { exact: true })).toBeVisible();
    await reader.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
    await reader.getByRole('link', { name: invoiceId, exact: true }).click();
    await expect(reader.locator('.purchase-invoice tbody tr')).toHaveCount(2);
    await expect(reader.locator('.purchase-invoice tbody td:nth-child(3)')).toHaveText([/80\.005/, /90\.000/]);
    await expect(reader.locator('.invoice-total')).toContainText('250.010');
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      await reader.setViewportSize(viewport); await reader.evaluate(() => document.fonts.ready);
      await expect(reader.locator('.purchase-invoice-info')).toBeInViewport();
      expect(await reader.locator('.purchase-invoice-info').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
      expect(await reader.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await reader.screenshot({ path: info.outputPath(`${role}-detail-${viewport.width}.png`), fullPage: true });
    }
    await reader.reload(); await expect(reader.locator('.invoice-total')).toContainText('250.010');
    await reader.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await reader.getByLabel('Mã giao dịch', { exact: true }).fill(invoiceId.toLowerCase());
    await reader.getByLabel('Số điện thoại', { exact: true }).fill('000055');
    await reader.getByLabel('Tên khách hàng', { exact: true }).fill(' KHÁCH T06 ');
    const date = await reader.evaluate(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
    await reader.getByLabel('Thời gian', { exact: true }).fill(date);
    await reader.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
    await expect(reader.locator('.purchase-list tbody tr')).toHaveCount(1);
    await reader.screenshot({ path: info.outputPath(`${role}-search.png`), fullPage: true });
    // Rename through real customer UI; history joins on MaKH, not mutable phone/name.
    await reader.goto(`./#/customers/${customerId}`);
    await reader.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
    const edit = reader.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true });
    await edit.getByLabel('Họ tên', { exact: true }).fill('Khách T06 mới');
    await edit.getByLabel('Số điện thoại', { exact: true }).fill('0900000066');
    await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(reader, 'Cập nhật thông tin khách hàng thành công');
    const before = await stored(reader);
    await reader.getByRole('link', { name: 'Lịch sử bán', exact: true }).click();
    await expect(reader.locator('.customer-summary')).toContainText('Khách T06 mới');
    await expect(reader.locator('.customer-summary')).toContainText('0900000066');
    await expect(reader.locator('.history-card tbody tr')).toContainText('Hoàn tất');
    await reader.screenshot({ path: info.outputPath(`${role}-customer-sales-history.png`), fullPage: true });
    await reader.getByRole('link', { name: invoiceId, exact: true }).click();
    await expect(reader.locator('.invoice-total')).toContainText('250.010');
    await expect(reader.locator('.purchase-invoice-info')).toContainText('Khách T06 mới');
    await reader.screenshot({ path: info.outputPath(`${role}-customer-sales-detail.png`), fullPage: true });
    await reader.reload(); await expect(reader.locator('.purchase-invoice')).toBeVisible();
    await reader.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await expect(reader).toHaveURL(new RegExp(`/customers/${customerId}/sales$`));
    await reader.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await reader.getByRole('link', { name: 'Lịch sử mua', exact: true }).click();
    await expect(reader.getByText('Không tìm thấy lịch sử mua', { exact: true })).toBeVisible();
    await reader.goto('./#/purchases'); await expect(reader.getByRole('link', { name: invoiceId, exact: true })).toBeVisible();
    expect(await stored(reader)).toEqual(before); expect(errors).toEqual([]);
  });
}

for (const target of ['list', 'detail', 'history'] as const) {
  test(`T06 read error ${target}: Figma notice closes without fabricated data or writes`, async ({ page }, info) => {
    await bootstrapOwner(page); await login(page); await createBracket(page);
    const { invoiceId, customerId } = await completePurchase(page);
    const before = await stored(page);
    // Inject storage read failure, not a replacement business service/result.
    await page.evaluate(() => {
      const get = IDBObjectStore.prototype.get, all = IDBObjectStore.prototype.getAll, indexAll = IDBIndex.prototype.getAll;
      IDBObjectStore.prototype.get = function (...args) { if (this.name === 'hoaDonThuMua') throw new DOMException('T06 read failure', 'UnknownError'); return get.apply(this, args); };
      IDBObjectStore.prototype.getAll = function (...args) { if (this.name === 'hoaDonThuMua') throw new DOMException('T06 read failure', 'UnknownError'); return all.apply(this, args); };
      IDBIndex.prototype.getAll = function (...args) { if (this.objectStore.name === 'hoaDonThuMua') throw new DOMException('T06 read failure', 'UnknownError'); return indexAll.apply(this, args); };
    });
    // Hash navigation retains the injected native read fault.
    await page.evaluate(hash => { location.hash = hash; }, target === 'list' ? '/customers' : '/purchases');
    await expect(page.locator('main')).toBeVisible();
    await page.evaluate(hash => { location.hash = hash; }, target === 'list' ? '/purchases' : target === 'detail' ? `/purchases/transactions/${invoiceId}` : `/customers/${customerId}/sales`);
    const message = target === 'list' ? 'Không thể truy xuất giao dịch thu mua' : target === 'detail' ? 'Không thể tải thông tin giao dịch' : 'Lỗi không thể truy xuất';
    await expect(page.getByRole('alertdialog')).toContainText(message);
    await page.screenshot({ path: info.outputPath(`error-${target}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    if (target === 'detail') {
      // The persistent fault also breaks the list reached by closing detail.
      // Assert that distinct error instead of racing its async appearance.
      await expect(page).toHaveURL(/#\/purchases$/);
      await expect(page.getByRole('alertdialog')).toContainText('Không thể truy xuất giao dịch thu mua');
      await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    }
    await expect(page.locator(':modal')).toHaveCount(0);
    // Reload removes fault; read-only recovery must leave every store unchanged.
    await page.reload(); await page.goto('./#/purchases');
    await expect(page.getByRole('link', { name: invoiceId, exact: true })).toBeVisible();
    expect(await stored(page)).toEqual(before);
  });
}
