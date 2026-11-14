# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: purchase-approvals.spec.ts >> G10 opposing approve/reject UI decisions commit once and both owner tabs recover without reload
- Location: tests\e2e\purchase-approvals.spec.ts:160:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /#\/approvals$/
Received string:  "http://127.0.0.1:4173/50K142.03.3007/#/approvals/Yc2f5a1ba"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="vi">…</html>
       - unexpected value "http://127.0.0.1:4173/50K142.03.3007/#/approvals/Yc2f5a1ba"

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
- banner: Phê duyệt Chủ kiểm thử
- main:
  - textbox "Tìm theo tên nhân viên"
  - textbox "Ngày gửi"
  - text: Ngày gửi
  - table:
    - rowgroup:
      - row "Mã yêu cầu Nhân viên thực hiện Trạng thái Thời gian":
        - columnheader "Mã yêu cầu"
        - columnheader "Nhân viên thực hiện"
        - columnheader "Trạng thái"
        - columnheader "Thời gian"
    - rowgroup:
      - row "Yc2f5a1ba Nhân viên T03 Đã phê duyệt 14/11/2026":
        - cell "Yc2f5a1ba":
          - button "Yc2f5a1ba"
        - cell "Nhân viên T03"
        - cell "Đã phê duyệt"
        - cell "14/11/2026"
  - navigation "Phân trang":
    - button "Trang 1": "1"
  - dialog "Yêu cầu thu mua":
    - heading "Yêu cầu thu mua" [level=2]
    - heading "Thông tin sản phẩm" [level=2]
    - table:
      - rowgroup:
        - row "Loại sản phẩm Thương hiệu Tình trạng Số lượng":
          - columnheader "Loại sản phẩm"
          - columnheader "Thương hiệu"
          - columnheader "Tình trạng"
          - columnheader "Số lượng"
      - rowgroup:
        - row "Áo CoCo Tốt 1":
          - cell "Áo"
          - cell "CoCo"
          - cell "Tốt"
          - cell "1"
    - heading "Khung giá thu mua áp dụng" [level=2]
    - table:
      - rowgroup:
        - row "Loại sản phẩm Thương hiệu Tình trạng Giá tối thiểu (Min) Giá tối đa (Max)":
          - columnheader "Loại sản phẩm"
          - columnheader "Thương hiệu"
          - columnheader "Tình trạng"
          - columnheader "Giá tối thiểu (Min)"
          - columnheader "Giá tối đa (Max)"
      - rowgroup:
        - row "Áo CoCo Tốt 50.000 100.000":
          - cell "Áo"
          - cell "CoCo"
          - cell "Tốt"
          - cell "50.000"
          - cell "100.000"
    - text: Giá thu mua đề xuất
    - status: "120.000"
    - status: Đã phê duyệt
```

# Test source

```ts
  1  | ﻿import { expect, type Page, type BrowserContext } from '@playwright/test';
  2  | import { bootstrapOwner, login } from './auth-helpers';
  3  | 
  4  | export async function closeNotice(page: Page, message: string) {
  5  |   await expect(page.getByRole('alertdialog')).toContainText(message);
  6  |   await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  7  | }
  8  | 
  9  | export async function expectApprovalList(page: Page) {
> 10 |   await expect(page).toHaveURL(/#\/approvals$/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  11 |   await expect(page.locator('dialog[open]')).toHaveCount(0);
  12 |   await expect(page.locator(':modal')).toHaveCount(0);
  13 |   await expect(page.locator('.approval-list')).toBeVisible();
  14 | }
  15 | 
  16 | export async function addProduct(page: Page, price = '120000', quantity = '1') {
  17 |   await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  18 |   const item = page.getByRole('dialog', { name: 'Tạo giao dịch', exact: true });
  19 |   for (const [label, value] of [['Loại sản phẩm', 'Áo'], ['Thương hiệu', 'CoCo'], ['Số lượng', quantity]]) {
  20 |     await item.getByLabel(label, { exact: true }).fill(value);
  21 |   }
  22 |   await item.getByLabel('Chất lượng', { exact: true }).selectOption('2');
  23 |   await item.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  24 |   const pricing = page.getByRole('dialog', { name: 'Thông tin sản phẩm', exact: true });
  25 |   await pricing.getByLabel('Giá thu mua đề xuất', { exact: true }).fill(price);
  26 |   await pricing.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  27 |   await expect(pricing).toHaveCount(0);
  28 |   if (Number(price) > 100000) await closeNotice(page, 'Giá thu mua vượt mức, cần được phê duyệt');
  29 | }
  30 | 
  31 | export async function setup(owner: Page, context: BrowserContext) {
  32 |   await bootstrapOwner(owner); await login(owner);
  33 |   await createBracket(owner);
  34 |   await owner.getByRole('link', { name: 'Nhân viên', exact: true }).click();
  35 |   await owner.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  36 |   const staffForm = owner.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
  37 |   for (const [label, value] of [['Họ tên', 'Nhân viên T03'], ['Số điện thoại', '0900000033'], ['Tên đăng nhập', 'staff03'], ['Mật khẩu', 't03-staff!']]) {
  38 |     await staffForm.getByLabel(label, { exact: true }).fill(value);
  39 |   }
  40 |   await staffForm.getByRole('button', { name: 'Lưu', exact: true }).click();
  41 |   await closeNotice(owner, 'Tạo tài khoản mới thành công');
  42 |   await owner.getByRole('link', { name: 'Phê duyệt', exact: true }).click();
  43 |   await expect(owner.getByText('Không có yêu cầu cần phê duyệt', { exact: true })).toBeVisible();
  44 |   const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff03', 't03-staff!');
  45 |   await staff.getByRole('link', { name: 'Thu mua', exact: true }).click();
  46 |   await staff.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  47 |   await addProduct(staff);
  48 |   await expect(owner.locator('.approval-list tbody')).toContainText('Nhân viên T03');
  49 |   await owner.locator('.approval-id-link').first().click();
  50 |   await expect(owner.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toContainText('120.000');
  51 |   return staff;
  52 | }
  53 | 
  54 | export async function snapshot(page: Page) {
  55 |   return page.evaluate(() => new Promise<Record<string, Array<Record<string, unknown>>>>((resolve, reject) => {
  56 |     const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
  57 |     request.onsuccess = () => {
  58 |       const db = request.result;
  59 |       const stores = ['purchaseApprovals', 'purchaseLines', 'purchaseNotices', 'hoaDonThuMua', 'sanPham', 'operations'];
  60 |       const tx = db.transaction(stores, 'readonly');
  61 |       const result: Record<string, Array<Record<string, unknown>>> = {};
  62 |       for (const store of stores) { const read = tx.objectStore(store).getAll(); read.onsuccess = () => { result[store] = read.result; }; }
  63 |       tx.oncomplete = () => { db.close(); resolve(result); }; tx.onerror = () => reject(tx.error);
  64 |     };
  65 |   }));
  66 | }
  67 | 
  68 | 
  69 | 
  70 | export async function createBracket(owner: Page) {
  71 |   await owner.getByRole('link', { name: 'Khung giá thu mua', exact: true }).click();
  72 |   await owner.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
  73 |   const bracket = owner.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
  74 |   for (const [label, value] of [['Loại hàng', 'Áo'], ['Thương hiệu', 'CoCo'], ['Giá tối thiểu (Min)', '50000'], ['Giá tối đa (Max)', '100000']]) {
  75 |     await bracket.getByLabel(label, { exact: true }).fill(value);
  76 |   }
  77 |   await bracket.getByLabel('Độ mới', { exact: true }).selectOption('2');
  78 |   await bracket.getByRole('button', { name: 'Lưu', exact: true }).click();
  79 |   await closeNotice(owner, 'Tạo khung giá thu mua thành công');
  80 | }
  81 | 
  82 | 
```