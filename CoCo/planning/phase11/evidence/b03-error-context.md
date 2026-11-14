# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase10-finalize-benchmark.spec.ts >> G10-T05 owner 1000: measure real purchase and cash-sale commits without an invented SLA
- Location: tests\e2e\phase10-finalize-benchmark.spec.ts:17:83

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByRole('textbox', { name: 'Mã sản phẩm', exact: true })
Expected: ""
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" getByRole('textbox', { name: 'Mã sản phẩm', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Mã sản phẩm', exact: true })
    3 × locator resolved to <input disabled autocomplete="off" spellcheck="false" value="SP0059085b" aria-invalid="false" aria-label="Mã sản phẩm" placeholder="Quét mã vạch hoặc nhập mã sản phẩm"/>
      - unexpected value "SP0059085b"

```

```yaml
- link "Đến nội dung chính":
  - /url: "#main-content"
- complementary:
  - link "CoCo — Trang chủ":
    - /url: "#/"
    - img "CoCo — Kho ký gửi"
  - navigation "Điều hướng chính":
    - link "Trang chủ":
      - /url: "#/"
    - link "Thu mua":
      - /url: "#/purchases"
    - link "Bán hàng":
      - /url: "#/sales"
    - link "Hàng hóa":
      - /url: "#/inventory"
    - link "Khách hàng":
      - /url: "#/customers"
    - link "Báo cáo":
      - /url: "#/reports"
    - link "Phê duyệt":
      - /url: "#/approvals"
    - link "Nhân viên":
      - /url: "#/staff"
    - link "Khung giá thu mua":
      - /url: "#/price-brackets"
  - paragraph: Chủ cửa hàng
  - button "Đăng xuất"
- banner: Bán hàng / Tạo giao dịch Chủ kiểm thử
- main:
  - status: Đang tải giao dịch…
```

# Test source

```ts
  1  | import { expect, type Page, type BrowserContext } from '@playwright/test';
  2  | import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
  3  | import { closeNotice } from './purchase-helpers';
  4  | import { login } from './auth-helpers';
  5  |
  6  | export async function prepare(page: Page, context: BrowserContext, role: 'owner' | 'staff' = 'owner') {
  7  |   await createInventoryThroughUI(page, '2');
  8  |   const products = (await inventoryData(page)).sanPham;
  9  |   let target = page;
  10 |   if (role === 'staff') {
  11 |     await page.getByRole('link', { name: 'Nhân viên', exact: true }).click();
  12 |     await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  13 |     const form = page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
  14 |     for (const [name, value] of [['Họ tên', 'Nhân viên bán hàng'], ['Số điện thoại', '0900000082'], ['Tên đăng nhập', 'staffsale'], ['Mật khẩu', 'sale-staff!']]) await form.getByLabel(name, { exact: true }).fill(value);
  15 |     await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  16 |     await closeNotice(page, 'Tạo tài khoản mới thành công');
  17 |     target = await context.newPage(); await target.goto('./'); await login(target, 'staffsale', 'sale-staff!');
  18 |   }
  19 |   await target.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  20 |   await target.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  21 |   await selectCustomer(target);
  22 |   return { target, products };
  23 | }
  24 | export async function selectCustomer(page: Page) {
  25 |   await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  26 |   await page.getByRole('button', { name: 'Khách G7', exact: true }).click();
  27 | }
  28 | export async function add(page: Page, id: string) {
  29 |   await page.getByRole('textbox', { name: 'Mã sản phẩm', exact: true }).fill(id);
  30 |   await page.getByRole('button', { name: 'Thêm', exact: true }).click();
> 31 |   await expect(page.getByRole('textbox', { name: 'Mã sản phẩm', exact: true })).toHaveValue('');
     |                                                                                 ^ Error: expect(locator).toHaveValue(expected) failed
  32 | }
  33 | export async function fiftyPoints(page: Page, points = 50) {
  34 |   await page.getByRole('checkbox', { name: 'Khách hàng đồng ý đăng ký thành viên' }).check();
  35 |   await expect(page.locator('.sales-membership-status')).toContainText('Điểm: 0');
  36 |   await page.evaluate(balance => new Promise<void>((resolve, reject) => {
  37 |     const request = indexedDB.open('CoCoDB');
  38 |     request.onerror = () => reject(request.error);
  39 |     request.onsuccess = () => {
  40 |       const db = request.result, tx = db.transaction('khachHang', 'readwrite'), store = tx.objectStore('khachHang');
  41 |       const read = store.getAll();
  42 |       read.onsuccess = () => { const customer = read.result.find(row => row.SoDienThoaiKH === '0900000081'); store.put({ ...customer, DiemTichLuy: balance }); };
  43 |       tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
  44 |     };
  45 |   }), points);
  46 |   await page.reload(); await selectCustomer(page);
  47 |   await expect(page.locator('.sales-membership-status')).toContainText(`Điểm: ${points}`);
  48 | }
  49 |
  50 |
```
