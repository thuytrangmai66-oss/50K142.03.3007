# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: purchase-queries.spec.ts >> T06 read error history: Figma notice closes without fabricated data or writes
- Location: tests\e2e\purchase-queries.spec.ts:99:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'TM585bbbe6', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('link', { name: 'TM585bbbe6', exact: true }) with timeout 5000ms
  - waiting for getByRole('link', { name: 'TM585bbbe6', exact: true })

```

# Test source

```ts
  28  |   await page.getByRole('button', { name: 'Khách T06', exact: true }).click();
  29  |   await page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  30  |   await closeNotice(page, 'Thu mua sản phẩm thành công');
  31  |   const data = await stored(page);
  32  |   return { invoiceId: String(data.hoaDonThuMua[0].MaHDTM), customerId: String(data.khachHang[0].MaKH) };
  33  | }
  34  | 
  35  | for (const role of ['owner', 'staff'] as const) {
  36  |   test(`T06 ${role}: real mixed-price purchase, combined search, reload, stable customer history and read-only views`, async ({ page, context }, info) => {
  37  |     const errors: string[] = [];
  38  |     context.on('page', p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); });
  39  |     page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  40  |     await bootstrapOwner(page); await login(page); await createBracket(page);
  41  |     let reader = page;
  42  |     if (role === 'staff') { await addStaffFixture(page); reader = await context.newPage(); await reader.goto('./'); await login(reader, 'staff', 'staff-test!'); }
  43  |     const { invoiceId, customerId } = await completePurchase(reader);
  44  |     await reader.getByLabel('Mã giao dịch', { exact: true }).fill('NO-MATCH');
  45  |     await reader.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  46  |     await expect(reader.getByText('Không tìm thấy giao dịch thu mua', { exact: true })).toBeVisible();
  47  |     await reader.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  48  |     await reader.getByRole('link', { name: invoiceId, exact: true }).click();
  49  |     await expect(reader.locator('.purchase-invoice tbody tr')).toHaveCount(2);
  50  |     await expect(reader.locator('.purchase-invoice tbody td:nth-child(3)')).toHaveText([/80\.005/, /90\.000/]);
  51  |     await expect(reader.locator('.invoice-total')).toContainText('250.010');
  52  |     for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  53  |       await reader.setViewportSize(viewport); await reader.evaluate(() => document.fonts.ready);
  54  |       await expect(reader.locator('.purchase-invoice-info')).toBeInViewport();
  55  |       expect(await reader.locator('.purchase-invoice-info').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
  56  |       expect(await reader.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  57  |       await reader.screenshot({ path: info.outputPath(`${role}-detail-${viewport.width}.png`), fullPage: true });
  58  |     }
  59  |     await reader.reload(); await expect(reader.locator('.invoice-total')).toContainText('250.010');
  60  |     await reader.getByRole('link', { name: 'Quay lại', exact: true }).click();
  61  |     await reader.getByLabel('Mã giao dịch', { exact: true }).fill(invoiceId.toLowerCase());
  62  |     await reader.getByLabel('Số điện thoại', { exact: true }).fill('000055');
  63  |     await reader.getByLabel('Tên khách hàng', { exact: true }).fill(' KHÁCH T06 ');
  64  |     const date = await reader.evaluate(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  65  |     await reader.getByLabel('Thời gian', { exact: true }).fill(date);
  66  |     await reader.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  67  |     await expect(reader.locator('.purchase-list tbody tr')).toHaveCount(1);
  68  |     await reader.screenshot({ path: info.outputPath(`${role}-search.png`), fullPage: true });
  69  |     // Rename through real customer UI; history joins on MaKH, not mutable phone/name.
  70  |     await reader.goto(`./#/customers/${customerId}`);
  71  |     await reader.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  72  |     const edit = reader.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true });
  73  |     await edit.getByLabel('Họ tên', { exact: true }).fill('Khách T06 mới');
  74  |     await edit.getByLabel('Số điện thoại', { exact: true }).fill('0900000066');
  75  |     await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
  76  |     await closeNotice(reader, 'Cập nhật thông tin khách hàng thành công');
  77  |     const before = await stored(reader);
  78  |     await reader.getByRole('link', { name: 'Lịch sử bán', exact: true }).click();
  79  |     await expect(reader.locator('.customer-summary')).toContainText('Khách T06 mới');
  80  |     await expect(reader.locator('.customer-summary')).toContainText('0900000066');
  81  |     await expect(reader.locator('.history-card tbody tr')).toContainText('Hoàn tất');
  82  |     await reader.screenshot({ path: info.outputPath(`${role}-customer-sales-history.png`), fullPage: true });
  83  |     await reader.getByRole('link', { name: invoiceId, exact: true }).click();
  84  |     await expect(reader.locator('.invoice-total')).toContainText('250.010');
  85  |     await expect(reader.locator('.purchase-invoice-info')).toContainText('Khách T06 mới');
  86  |     await reader.screenshot({ path: info.outputPath(`${role}-customer-sales-detail.png`), fullPage: true });
  87  |     await reader.reload(); await expect(reader.locator('.purchase-invoice')).toBeVisible();
  88  |     await reader.getByRole('link', { name: 'Quay lại', exact: true }).click();
  89  |     await expect(reader).toHaveURL(new RegExp(`/customers/${customerId}/sales$`));
  90  |     await reader.getByRole('link', { name: 'Quay lại', exact: true }).click();
  91  |     await reader.getByRole('link', { name: 'Lịch sử mua', exact: true }).click();
  92  |     await expect(reader.getByText('Không tìm thấy lịch sử mua', { exact: true })).toBeVisible();
  93  |     await reader.goto('./#/purchases'); await expect(reader.getByRole('link', { name: invoiceId, exact: true })).toBeVisible();
  94  |     expect(await stored(reader)).toEqual(before); expect(errors).toEqual([]);
  95  |   });
  96  | }
  97  | 
  98  | for (const target of ['list', 'detail', 'history'] as const) {
  99  |   test(`T06 read error ${target}: Figma notice closes without fabricated data or writes`, async ({ page }, info) => {
  100 |     await bootstrapOwner(page); await login(page); await createBracket(page);
  101 |     const { invoiceId, customerId } = await completePurchase(page);
  102 |     const before = await stored(page);
  103 |     // Inject storage read failure, not a replacement business service/result.
  104 |     await page.evaluate(() => {
  105 |       const get = IDBObjectStore.prototype.get, all = IDBObjectStore.prototype.getAll, indexAll = IDBIndex.prototype.getAll;
  106 |       IDBObjectStore.prototype.get = function (...args) { if (this.name === 'hoaDonThuMua') throw new DOMException('T06 read failure', 'UnknownError'); return get.apply(this, args); };
  107 |       IDBObjectStore.prototype.getAll = function (...args) { if (this.name === 'hoaDonThuMua') throw new DOMException('T06 read failure', 'UnknownError'); return all.apply(this, args); };
  108 |       IDBIndex.prototype.getAll = function (...args) { if (this.objectStore.name === 'hoaDonThuMua') throw new DOMException('T06 read failure', 'UnknownError'); return indexAll.apply(this, args); };
  109 |     });
  110 |     // Hash navigation retains the injected native read fault.
  111 |     await page.evaluate(hash => { location.hash = hash; }, target === 'list' ? '/customers' : '/purchases');
  112 |     await expect(page.locator('main')).toBeVisible();
  113 |     await page.evaluate(hash => { location.hash = hash; }, target === 'list' ? '/purchases' : target === 'detail' ? `/purchases/transactions/${invoiceId}` : `/customers/${customerId}/sales`);
  114 |     const message = target === 'list' ? 'Không thể truy xuất giao dịch thu mua' : target === 'detail' ? 'Không thể tải thông tin giao dịch' : 'Lỗi không thể truy xuất';
  115 |     await expect(page.getByRole('alertdialog')).toContainText(message);
  116 |     await page.screenshot({ path: info.outputPath(`error-${target}.png`), fullPage: true });
  117 |     await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  118 |     if (target === 'detail') {
  119 |       // The persistent fault also breaks the list reached by closing detail.
  120 |       // Assert that distinct error instead of racing its async appearance.
  121 |       await expect(page).toHaveURL(/#\/purchases$/);
  122 |       await expect(page.getByRole('alertdialog')).toContainText('Không thể truy xuất giao dịch thu mua');
  123 |       await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  124 |     }
  125 |     await expect(page.locator(':modal')).toHaveCount(0);
  126 |     // Reload removes fault; read-only recovery must leave every store unchanged.
  127 |     await page.reload(); await page.goto('./#/purchases');
> 128 |     await expect(page.getByRole('link', { name: invoiceId, exact: true })).toBeVisible();
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  129 |     expect(await stored(page)).toEqual(before);
  130 |   });
  131 | }
  132 | 
```