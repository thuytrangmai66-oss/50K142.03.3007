import { test, expect, type Page } from '@playwright/test';
import { bootstrapOwner, login } from './auth-helpers';
async function createBracket(page: Page) {
  await page.getByRole('link', { name: 'Khung giá thu mua', exact: true }).click(); await page.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
  for (const [label, value] of [['Loại hàng', 'Áo'], ['Thương hiệu', 'CoCo'], ['Giá tối thiểu (Min)', '50000'], ['Giá tối đa (Max)', '100000']]) await form.getByLabel(label, { exact: true }).fill(value);
  await form.getByLabel('Độ mới', { exact: true }).selectOption('2'); await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Tạo khung giá thu mua thành công'); await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
}
async function fields(page: Page) {
  const form = page.getByRole('dialog', { name: 'Tạo giao dịch', exact: true });
  await form.getByLabel('Loại sản phẩm', { exact: true }).fill('Áo'); await form.getByLabel('Thương hiệu', { exact: true }).fill('CoCo');
  await form.getByLabel('Chất lượng', { exact: true }).selectOption('2'); await form.getByLabel('Số lượng', { exact: true }).fill('1');
  await form.getByRole('button', { name: 'Xác nhận', exact: true }).click(); return page.getByRole('dialog', { name: 'Thông tin sản phẩm', exact: true });
}
for (const role of ['owner', 'staff'] as const) test(`T02 ${role}: real UI input, validation, pending request, reload, remove and cancel`, async ({ page, context }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await bootstrapOwner(page); await login(page); await createBracket(page);
  if (role === 'staff') {
    await page.getByRole('link', { name: 'Nhân viên', exact: true }).click(); await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
    for (const [label, value] of [['Họ tên', 'Nhân viên T02'], ['Số điện thoại', '0900000022'], ['Tên đăng nhập', 'staff'], ['Mật khẩu', 't02-staff!']]) await form.getByLabel(label, { exact: true }).fill(value);
    await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(page.getByRole('alertdialog')).toContainText('Tạo tài khoản mới thành công'); await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff', 't02-staff!'); page = staff;
    page.on('pageerror', error => errors.push(error.message)); await expect(page.getByRole('link', { name: 'Khung giá thu mua', exact: true })).toHaveCount(0);
  }
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click(); await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Thông tin giao dịch', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm', exact: true }).click(); const form = page.getByRole('dialog', { name: 'Tạo giao dịch', exact: true });
  await form.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(form.getByText('Hãy điền đầy đủ thông tin', { exact: true })).toHaveCount(4);
  await page.screenshot({ path: info.outputPath(`${role}-item-required.png`), fullPage: false });
  let price = await fields(page); await price.getByLabel('Giá thu mua đề xuất', { exact: true }).fill('0'); await price.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(price.getByText('Hãy nhập lại giá thu mua', { exact: true })).toBeVisible(); await price.getByLabel('Giá thu mua đề xuất', { exact: true }).fill('80001');
  await page.screenshot({ path: info.outputPath(`${role}-price-dialog.png`), fullPage: false });
  await price.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(1); await expect(page.locator('.purchase-lines')).toContainText('80.001');
  const url = page.url(); await page.reload(); await expect(page.locator('.purchase-lines')).toContainText('80.001');
  await page.getByRole('button', { name: 'Thêm', exact: true }).click(); price = await fields(page); await price.getByLabel('Giá thu mua đề xuất', { exact: true }).fill('120000'); await price.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Giá thu mua vượt mức, cần được phê duyệt'); await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByText('Chờ phê duyệt giá', { exact: true })).toBeVisible(); await expect(page.locator('.purchase-total')).toContainText('200.001');
  expect(await page.locator('.purchase-total > strong + strong').evaluate(element => {
    const style = getComputedStyle(element); return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight];
  })).toEqual(['"Be Vietnam Pro", sans-serif', '16px', '700', '24px']);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) { await page.setViewportSize(viewport); await expect(page.locator('.purchase-total')).toBeInViewport(); await page.screenshot({ path: info.outputPath(`${role}-${viewport.width}x${viewport.height}.png`), fullPage: false }); }
  const stored = await page.evaluate(() => new Promise<Record<string, unknown[]>>((resolve, reject) => { const r = indexedDB.open('CoCoDB'); r.onerror = () => reject(r.error); r.onsuccess = () => { const db = r.result, tx = db.transaction(['purchaseApprovals', 'hoaDonThuMua', 'sanPham'], 'readonly'), result: Record<string, unknown[]> = {}; for (const store of ['purchaseApprovals', 'hoaDonThuMua', 'sanPham']) { const q = tx.objectStore(store).getAll(); q.onsuccess = () => { result[store] = q.result; }; } tx.oncomplete = () => { db.close(); resolve(result); }; }; }));
  expect(stored.purchaseApprovals).toHaveLength(1); expect(stored.hoaDonThuMua).toHaveLength(0); expect(stored.sanPham).toHaveLength(0);
  await page.locator('.purchase-lines tbody tr').filter({ hasText: 'Chờ phê duyệt giá' }).getByRole('button', { name: 'Xóa Áo CoCo', exact: true }).click(); await expect(page.getByText('Chờ phê duyệt giá', { exact: true })).toHaveCount(0); await expect(page.locator('.purchase-total')).toContainText('80.001');
  await page.getByRole('button', { name: 'Hủy', exact: true }).click(); await expect(page.getByRole('button', { name: 'Tạo giao dịch', exact: true })).toBeVisible(); await page.goto(url); await expect(page.getByText('Giao dịch không còn ở trạng thái đang tạo', { exact: true })).toBeVisible(); expect(errors).toEqual([]);
});

test('T02 native IDB failure keeps the price form, rolls back and retries without duplicate request', async ({ page }) => {
  await bootstrapOwner(page); await login(page); await createBracket(page); await page.getByRole('link', { name: 'Thu mua', exact: true }).click(); await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm', exact: true }).click(); const price = await fields(page); await price.getByLabel('Giá thu mua đề xuất', { exact: true }).fill('120000');
  await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args) { if (this.name === 'purchaseDrafts') { IDBObjectStore.prototype.put = original; throw new DOMException('T02 test-only failure', 'QuotaExceededError'); } return original.apply(this, args); }; });
  await price.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.getByRole('alertdialog')).toBeVisible(); await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(price.getByLabel('Giá thu mua đề xuất', { exact: true })).toHaveValue('120000'); await price.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Giá thu mua vượt mức, cần được phê duyệt'); await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click(); await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(1);
});

test('T02 real customer creation and selection persist without creating an invoice or stock', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page);
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click(); await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000042');
  await expect(page.getByText('Khách hàng không tồn tại', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách thu mua T02');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000042');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Khách thu mua T02', exact: true }).click();
  await expect(page).toHaveURL(/\/purchases\/D[0-9a-f]+$/);
  await page.reload();
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách thu mua T02');
  await expect(page.getByLabel('Số điện thoại', { exact: true })).toHaveValue('0900000042');
  await expect(page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true })).toBeEnabled();
  await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('customer-selected-empty-draft.png'), fullPage: false });
  const counts = await page.evaluate(() => new Promise<number[]>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, stores = ['khachHang', 'hoaDonThuMua', 'sanPham'], tx = db.transaction(stores, 'readonly'), result: number[] = [];
      stores.forEach((store, index) => { const count = tx.objectStore(store).count(); count.onsuccess = () => { result[index] = count.result; }; });
      tx.oncomplete = () => { db.close(); resolve(result); };
    };
  }));
  expect(counts).toEqual([1, 0, 0]);
});

test('T02 missing bracket is recoverable and ten real lines paginate without hidden rows', async ({ page }, info) => {
  test.setTimeout(60_000);
  await bootstrapOwner(page); await login(page); await createBracket(page);
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click(); await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  const item = page.getByRole('dialog', { name: 'Tạo giao dịch', exact: true });
  await item.getByLabel('Loại sản phẩm', { exact: true }).fill('Không có khung');
  await item.getByLabel('Thương hiệu', { exact: true }).fill('CoCo');
  await item.getByLabel('Chất lượng', { exact: true }).selectOption('2');
  await item.getByLabel('Số lượng', { exact: true }).fill('1');
  await item.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không tìm thấy khung giá thu mua phù hợp');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await item.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(0);
  for (let index = 0; index < 10; index++) {
    await page.getByRole('button', { name: 'Thêm', exact: true }).click();
    const price = await fields(page);
    await price.getByLabel('Giá thu mua đề xuất', { exact: true }).fill(String(80001 + index));
    await price.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(price).toHaveCount(0);
    await expect(page.locator('.purchase-total')).toContainText(new Intl.NumberFormat('vi-VN').format((index + 1) * 80001 + index * (index + 1) / 2));
  }
  const prices = page.locator('.purchase-lines tbody tr td:nth-child(3)');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const first = page.getByRole('button', { name: 'Trang 1', exact: true }); await first.click();
    await expect(first).toHaveAttribute('aria-current', 'page');
    await expect(prices.first()).toContainText('80.001');
    const capacity = Number(await page.locator('.purchase-lines').getAttribute('data-page-size'));
    const seen: string[] = [];
    for (let current = 1; current <= Math.ceil(10 / capacity); current++) {
      await page.getByRole('button', { name: `Trang ${current}`, exact: true }).click();
      const expected = Array.from({ length: Math.min(capacity, 10 - (current - 1) * capacity) }, (_, index) => new Intl.NumberFormat('vi-VN').format(80001 + (current - 1) * capacity + index));
      await expect(prices).toHaveCount(expected.length);
      for (const [index, value] of expected.entries()) await expect(prices.nth(index)).toContainText(value);
      seen.push(...expected);
      await expect(page.locator('.purchase-lines .pagination')).toBeInViewport({ ratio: 1 });
      await expect(page.locator('.purchase-lines tbody tr').last()).toBeInViewport({ ratio: 1 });
      expect(await page.locator('.purchase-lines .data-table-scroll').evaluate(el => el.scrollHeight > el.clientHeight + 1)).toBe(false);
    }
    expect(new Set(seen).size).toBe(10);
    await page.getByRole('button', { name: 'Trang 1', exact: true }).click();
    await page.screenshot({ path: info.outputPath(`ten-lines-${viewport.width}x${viewport.height}.png`), fullPage: false });
  }
});

