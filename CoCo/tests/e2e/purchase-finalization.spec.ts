import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { bootstrapOwner, login } from './auth-helpers';
import { addProduct, closeNotice, createBracket, setup } from './purchase-helpers';

const errors = new WeakMap<BrowserContext, string[]>();
test.beforeEach(async ({ context }) => {
  const messages: string[] = []; errors.set(context, messages);
  const observe = (page: Page) => {
    page.on('pageerror', error => messages.push(error.message));
    page.on('console', message => { if (message.type() === 'error') messages.push(message.text()); });
  };
  context.pages().forEach(observe); context.on('page', observe);
});
test.afterEach(async ({ context }) => { expect(errors.get(context)).toEqual([]); });

async function startOwner(page: Page) {
  await bootstrapOwner(page); await login(page); await createBracket(page);
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
}
async function customerForm(page: Page, phone = '0900000055') {
  await page.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  await page.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách T05');
  await form.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  return form;
}
async function selectNewCustomer(page: Page) {
  const form = await customerForm(page);
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Khách T05', exact: true }).click();
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách T05');
}
function saveButton(page: Page) { return page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }); }

async function stored(page: Page) {
  return page.evaluate(() => new Promise<Record<string, Array<Record<string, unknown>>>>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const names = ['purchaseDrafts', 'purchaseLines', 'purchaseApprovals', 'purchaseNotices', 'purchaseFinalizations',
        'purchaseProvenance', 'hoaDonThuMua', 'chiTietHoaDonTM', 'sanPham', 'productCosts', 'khachHang',
        'operations', 'auditEntries', 'issuedIdentifiers', 'recordVersions', 'appMetadata'];
      const tx = db.transaction(names, 'readonly'), result: Record<string, Array<Record<string, unknown>>> = {};
      for (const name of names) { const read = tx.objectStore(name).getAll(); read.onsuccess = () => { result[name] = read.result; }; }
      tx.oncomplete = () => { db.close(); resolve(result); }; tx.onerror = () => reject(tx.error);
    };
  }));
}

test('T05 owner validates empty and missing customer, finalizes mixed prices and quantity once, then reloads safely', async ({ page }, info) => {
  await startOwner(page);
  await saveButton(page).click();
  await expect(page.getByText('Hãy thêm ít nhất một sản phẩm', { exact: true })).toBeVisible();
  await expect(page.getByText('Hãy nhập đầy đủ thông tin', { exact: true })).toHaveCount(2);
  await page.screenshot({ path: info.outputPath('owner-required.png') });
  expect((await stored(page)).hoaDonThuMua).toHaveLength(0);
  await addProduct(page, '80005', '2');
  await saveButton(page).click();
  await expect(page.getByText('Hãy nhập đầy đủ thông tin', { exact: true })).toHaveCount(2);
  expect((await stored(page)).sanPham).toHaveLength(0);
  await selectNewCustomer(page); await addProduct(page, '90000');
  const draftUrl = page.url();
  await expect(saveButton(page)).toBeEnabled();
  await saveButton(page).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect(page.getByRole('alertdialog')).toContainText('Thu mua sản phẩm thành công');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: 'Đóng thông báo', exact: true })).toBeInViewport();
    await page.screenshot({ path: info.outputPath(`owner-success-${viewport.width}.png`) });
  }
  const result = await stored(page), invoice = result.hoaDonThuMua[0];
  expect(result.hoaDonThuMua).toHaveLength(1); expect(invoice).toMatchObject({ TongTienTM: 250010, TrangThai: 1 });
  expect(result.purchaseFinalizations[0]).toMatchObject({ subtotal: 250010, paidTotal: 250010, lines: expect.arrayContaining([
    expect.objectContaining({ unitCost: 80005, quantity: 2 }), expect.objectContaining({ unitCost: 90000, quantity: 1 }),
  ]) });
  expect(result.sanPham).toHaveLength(3); expect(result.productCosts).toHaveLength(3); expect(result.purchaseProvenance).toHaveLength(3);
  expect(result.sanPham.map(row => row.GiaBanHienHanh).sort()).toEqual([104007, 104007, 117000]);
  expect(result.issuedIdentifiers).toHaveLength(4);
  for (const product of result.sanPham) expect(product).toMatchObject({ TrangThai: 1, NgayNhapKho: product.NgayBatDauChuKyGiam });
  expect(JSON.parse(String(result.appMetadata.find(row => row.key === `purchase-status-mapping:${invoice.MaHDTM}`)?.value))).toEqual({ invoiceCompleted: 1, productAvailable: 1, productSold: 2 });
  await closeNotice(page, 'Thu mua sản phẩm thành công');
  await expect(page).toHaveURL(/#\/purchases$/); await expect(page.locator(':modal')).toHaveCount(0);
  await expect(page.getByRole('link', { name: String(invoice.MaHDTM), exact: true })).toBeVisible();
  expect(await stored(page)).toEqual(result);
  await page.getByRole('link', { name: String(invoice.MaHDTM), exact: true }).click();
  await expect(page.getByRole('heading', { name: `Chi tiết giao dịch ${invoice.MaHDTM}`, exact: true })).toBeVisible();
  await expect(page.locator('.record-card tbody tr')).toHaveCount(2);
  await expect(page.locator('.invoice-total')).toContainText('250.010');
  await page.screenshot({ path: info.outputPath('owner-invoice-snapshot-lines.png') });
  await page.goto(draftUrl); await expect(page.getByText('Giao dịch đã hoàn tất', { exact: true })).toBeVisible();
  await expect(saveButton(page)).toHaveCount(0); expect(await stored(page)).toEqual(result);
});

test('T05 staff cannot finalize pending/rejected prices, then completes an approved mixed-price purchase', async ({ page, context }, info) => {
  const staff = await setup(page, context);
  await selectNewCustomer(staff); await saveButton(staff).click();
  await expect(staff.getByText('Sản phẩm chưa được duyệt giá', { exact: true })).toBeVisible();
  expect((await stored(staff)).hoaDonThuMua).toHaveLength(0);
  await staff.screenshot({ path: info.outputPath('staff-pending-blocked.png') });
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  const reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await reason.getByLabel('Lý do từ chối', { exact: true }).fill('Giá cao');
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(page, 'Đã từ chối yêu cầu phê duyệt');
  await closeNotice(staff, 'Yêu cầu phê duyệt bị từ chối');
  const pricing = staff.getByRole('dialog', { name: 'Thông tin sản phẩm', exact: true });
  await pricing.getByRole('button', { name: 'Hủy', exact: true }).click();
  await saveButton(staff).click();
  await expect(staff.getByText('Sản phẩm chưa được duyệt giá', { exact: true })).toBeVisible();
  expect((await stored(staff)).sanPham).toHaveLength(0);
  await staff.getByRole('button', { name: 'Nhập lại giá Áo CoCo', exact: true }).click();
  await pricing.getByLabel('Giá thu mua đề xuất', { exact: true }).fill('130000');
  await pricing.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(staff, 'Giá thu mua vượt mức, cần được phê duyệt');
  await page.locator('.approval-list tbody tr').filter({ hasText: 'Chờ phê duyệt' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Phê duyệt giá thu mua thành công');
  await closeNotice(staff, 'Yêu cầu phê duyệt được chấp thuận');
  await addProduct(staff, '80001'); await saveButton(staff).click();
  await expect(staff.getByRole('alertdialog')).toContainText('Thu mua sản phẩm thành công');
  await staff.screenshot({ path: info.outputPath('staff-finalized-success.png') });
  const result = await stored(staff);
  expect(result.hoaDonThuMua[0]).toMatchObject({ TongTienTM: 210001, TrangThai: 1 });
  expect(result.sanPham).toHaveLength(2); expect(result.purchaseApprovals).toHaveLength(2);
  expect(result.productCosts.map(row => row.unitCost).sort()).toEqual([130000, 80001]);
  await closeNotice(staff, 'Thu mua sản phẩm thành công');
  await expect(staff).toHaveURL(/#\/purchases$/);
  expect(await stored(staff)).toEqual(result);
});

for (const store of ['productCosts', 'auditEntries']) test(`T05 ${store} failure rolls back and keeps the editor for a single successful retry`, async ({ page }, info) => {
  await startOwner(page); await addProduct(page, '80001'); await selectNewCustomer(page);
  const before = await stored(page);
  await page.evaluate(target => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === target) { IDBObjectStore.prototype.add = original; throw new DOMException('T05 E2E injected write failure', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  }, store);
  await saveButton(page).click(); await expect(page.getByRole('alertdialog')).toContainText('Không thể lưu giao dịch thu mua');
  expect(await stored(page)).toEqual(before);
  await page.screenshot({ path: info.outputPath(`owner-${store}-rollback.png`) });
  await closeNotice(page, 'Không thể lưu giao dịch thu mua');
  await expect(page.locator('.purchase-lines')).toContainText('80.001');
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách T05');
  await saveButton(page).click(); await closeNotice(page, 'Thu mua sản phẩm thành công');
  const after = await stored(page);
  expect(after.hoaDonThuMua).toHaveLength(1); expect(after.sanPham).toHaveLength(1);
  expect(after.operations.filter(row => String(row.id).startsWith('purchase-finalize:'))).toHaveLength(1);
});

test('T05 two owner tabs finalize one draft once and the losing tab recovers to the list', async ({ page, context }) => {
  await startOwner(page); await addProduct(page, '80001'); await selectNewCustomer(page);
  const second = await context.newPage(); await second.goto('./'); await login(second); await second.goto(page.url());
  await expect(second.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách T05');
  await expect(saveButton(page)).toBeEnabled(); await expect(saveButton(second)).toBeEnabled();
  await Promise.all([page, second].map(tab => saveButton(tab).evaluate(button => (button as HTMLButtonElement).click())));
  await expect.poll(async () => (await page.getByRole('alertdialog').count()) + (await second.getByRole('alertdialog').count())).toBe(1);
  const winner = await page.getByRole('alertdialog').count() ? page : second, loser = winner === page ? second : page;
  await expect(loser.getByText('Giao dịch đã hoàn tất', { exact: true })).toBeVisible();
  const result = await stored(page);
  expect(result.hoaDonThuMua).toHaveLength(1); expect(result.sanPham).toHaveLength(1); expect(result.purchaseFinalizations).toHaveLength(1);
  await closeNotice(winner, 'Thu mua sản phẩm thành công');
  await loser.getByRole('button', { name: 'Về danh sách', exact: true }).click();
  expect(await stored(page)).toEqual(result);
});

test('T05 reload immediately after native commit restores the completed draft without a second invoice', async ({ page }, info) => {
  await startOwner(page); await addProduct(page, '80001'); await selectNewCustomer(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === 'purchaseFinalizations') {
        IDBObjectStore.prototype.add = original;
        this.transaction.addEventListener('complete', () => location.reload(), { once: true });
      }
      return original.apply(this, args);
    };
  });
  await saveButton(page).click();
  await expect(page.getByText('Giao dịch đã hoàn tất', { exact: true })).toBeVisible();
  await expect(saveButton(page)).toHaveCount(0);
  const result = await stored(page);
  expect(result.hoaDonThuMua).toHaveLength(1); expect(result.sanPham).toHaveLength(1);
  await page.screenshot({ path: info.outputPath('owner-recovered-after-commit.png') });
  await page.getByRole('button', { name: 'Về danh sách', exact: true }).click();
  await page.reload(); await expect(page.getByRole('button', { name: 'Tạo giao dịch', exact: true })).toBeVisible();
  expect(await stored(page)).toEqual(result);
});

test('T05 cancel customer creation leaves no customer and concurrent phone creation stays unique', async ({ page, context }) => {
  await startOwner(page);
  let form = await customerForm(page);
  await form.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect((await stored(page)).khachHang).toHaveLength(0);
  const second = await context.newPage(); await second.goto('./'); await login(second);
  await second.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await second.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  form = await customerForm(page); const otherForm = await customerForm(second);
  await Promise.all([form, otherForm].map(dialog => dialog.getByRole('button', { name: 'Lưu', exact: true }).click()));
  await expect.poll(async () => (await stored(page)).khachHang.length).toBe(1);
  await expect.poll(async () => (await form.count()) + (await otherForm.count())).toBe(1);
  const failed = await form.count() ? page : second;
  await expect(failed.getByText('Số điện thoại bị trùng với khách hàng khác', { exact: true })).toBeVisible();
  const result = await stored(page);
  expect(result.hoaDonThuMua).toHaveLength(0); expect(result.sanPham).toHaveLength(0);
});
