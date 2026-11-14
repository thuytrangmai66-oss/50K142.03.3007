import { test, expect, type Page } from '@playwright/test';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';
import { addProduct, createBracket, closeNotice } from './purchase-helpers';

async function stored(page: Page) {
  return page.evaluate(() => new Promise<Record<string, Array<Record<string, unknown>>>>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction(Array.from(db.objectStoreNames), 'readonly');
      const data: Record<string, Array<Record<string, unknown>>> = {};
      for (const name of Array.from(db.objectStoreNames)) { const read = tx.objectStore(name).getAll(); read.onsuccess = () => { data[name] = read.result; }; }
      tx.oncomplete = () => { db.close(); resolve(data); }; tx.onabort = () => reject(tx.error);
    };
  }));
}
async function stock(page: Page) {
  await bootstrapOwner(page); await login(page); await createBracket(page);
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await addProduct(page, '80005', '25');
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0900000078');
  await page.getByRole('button', { name: '+ Thêm khách hàng', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách hàng G7');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900000078');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Khách hàng G7', exact: true }).click();
  await page.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Thu mua sản phẩm thành công');
}

for (const role of ['owner', 'staff'] as const) test(`G7 T01 ${role}: real inventory, combined filters, pagination, three desktop viewports, detail and read-only reload`, async ({ page, context }, info) => {
  // Includes real acquisition of 25 items, all pages at three viewports,
  // plus login, filters, detail and reload. Keep each assertion's 5s limit.
  test.setTimeout(60000);
  const errors: string[] = [];
  const observe = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
  context.pages().forEach(observe); context.on('page', observe);
  await stock(page); let reader = page;
  if (role === 'staff') { await addStaffFixture(page); reader = await context.newPage(); await reader.goto('./'); await login(reader, 'staff', 'staff-test!'); }
  const before = await stored(reader), product = before.sanPham[0], id = String(product.MaSP);
  await reader.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
  await expect(reader.getByRole('heading', { name: 'Danh sách hàng hóa', exact: true })).toHaveCount(0);
  await expect(reader.locator('.inventory-list thead th')).toHaveText(['Mã sản phẩm', 'Tên sản phẩm', 'Giá bán hiện hành', 'Trạng thái', 'Ngày nhập']);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await reader.setViewportSize(viewport); await reader.evaluate(() => document.fonts.ready);
    await reader.getByRole('button', { name: 'Trang 1', exact: true }).click();
    await expect(reader.locator('.inventory-list tbody tr').first()).toBeVisible();
    expect(await reader.locator('.inventory-list tbody tr').evaluateAll(rows => rows.every(row => row.children.length === 5))).toBe(true);
    const layout = await reader.locator('.inventory-list .data-table').evaluate(table => {
      const rect = (element: Element) => {
        const { x, width } = element.getBoundingClientRect(); return [x, width];
      };
      const headers = Array.from(table.querySelectorAll('thead th'));
      const cells = Array.from(table.querySelector('tbody tr')!.querySelectorAll('td'));
      return {
        widths: Array.from(table.querySelectorAll<HTMLTableColElement>('colgroup col')).map(column => column.style.width),
        tableWidth: table.getBoundingClientRect().width,
        availableWidth: table.parentElement!.clientWidth,
        headers: headers.map(rect),
        cells: cells.map(rect),
        clipped: headers.map(header => header.scrollWidth > header.clientWidth + 1),
      };
    });
    expect(layout.widths).toEqual(['17%', '29%', '26%', '14%', '14%']);
    expect(Math.abs(layout.tableWidth - layout.availableWidth)).toBeLessThanOrEqual(1);
    expect(layout.headers).toHaveLength(5);
    expect(layout.cells).toHaveLength(5);
    expect(layout.clipped).toEqual([false, false, false, false, false]);
    for (let column = 0; column < 5; column++) {
      expect(Math.abs(layout.headers[column][0] - layout.cells[column][0])).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.headers[column][1] - layout.cells[column][1])).toBeLessThanOrEqual(1);
    }
    const capacity = Number(await reader.locator('.inventory-list').getAttribute('data-page-size'));
    const seen: string[] = [];
    for (let current = 1; current <= Math.ceil(25 / capacity); current++) {
      await reader.getByRole('button', { name: `Trang ${current}`, exact: true }).click();
      await expect(reader.locator('.inventory-list tbody tr')).toHaveCount(Math.min(capacity, 25 - (current - 1) * capacity));
      seen.push(...await reader.locator('.inventory-list tbody td:first-child').allTextContents());
      await expect(reader.locator('.inventory-list .pagination')).toBeInViewport({ ratio: 1 });
      await expect(reader.locator('.inventory-list tbody tr').last()).toBeInViewport({ ratio: 1 });
      expect(await reader.locator('.inventory-list .data-table-scroll').evaluate(e => e.scrollHeight > e.clientHeight + 1)).toBe(false);
      if (current === 1) await reader.screenshot({ path: info.outputPath(`${role}-inventory-${viewport.width}.png`) });
    }
    expect(new Set(seen).size).toBe(25);
  }
  await reader.setViewportSize({ width: 1440, height: 900 });
  await reader.getByLabel('Mã sản phẩm', { exact: true }).fill(id.toLowerCase());
  await reader.getByRole('combobox', { name: 'Loại hàng', exact: true }).selectOption('Áo');
  await reader.getByRole('combobox', { name: 'Thương hiệu', exact: true }).selectOption('CoCo');
  await reader.getByLabel('Ngày nhập', { exact: true }).fill(String(product.NgayNhapKho));
  await reader.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(reader.locator('.inventory-list tbody tr')).toHaveCount(1);
  await expect(reader.locator('.inventory-list tbody')).toContainText('104.007');
  await reader.getByRole('link', { name: id, exact: true }).click();
  await expect(reader.getByRole('heading', { name: 'Chi tiết sản phẩm', exact: true })).toBeVisible();
  await expect(reader.locator('.inventory-card')).toContainText('Tốt');
  await expect(reader.locator('.inventory-card')).toContainText('Còn hàng');
  await expect(reader.locator('.inventory-card')).toContainText('Số ngày tồn');
  await expect(reader.getByRole('link', { name: 'Quay lại', exact: true })).toBeInViewport();
  await reader.screenshot({ path: info.outputPath(`${role}-inventory-detail.png`) });
  await reader.reload(); await expect(reader.locator('.inventory-card')).toContainText(id);
  await reader.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await reader.getByLabel('Mã sản phẩm', { exact: true }).fill('NOT-FOUND');
  await reader.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(reader.getByText('Không tìm thấy sản phẩm', { exact: true })).toBeVisible();
  await reader.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await expect(reader.locator('.inventory-list tbody tr').first()).toBeVisible();
  expect(await stored(reader)).toEqual(before); expect(errors).toEqual([]);
});

test('G7 T01 empty inventory and native read failure use source error notices without writes', async ({ page }) => {
  await bootstrapOwner(page); await login(page);
  await page.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
  await expect(page.getByText('Không tìm thấy sản phẩm', { exact: true })).toBeVisible();
  const before = await stored(page);
  await page.evaluate(() => {
    const getAll = IDBObjectStore.prototype.getAll;
    // Target the inventory screen; Home now legitimately reads the same store.
    IDBObjectStore.prototype.getAll = function (...args) { if (this.name === 'sanPham' && location.hash.startsWith('#/inventory')) throw new DOMException('G7 read failure', 'UnknownError'); return getAll.apply(this, args); };
  });
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await page.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không thể tải thông tin hàng hóa. Hãy thử lại');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.getByLabel('Mã sản phẩm', { exact: true }).fill('SP');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không thể tìm kiếm hàng hóa. Hãy thử lại');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.locator(':modal')).toHaveCount(0);
  await page.reload(); await expect(page.getByText('Không tìm thấy sản phẩm', { exact: true })).toBeVisible();
  expect(await stored(page)).toEqual(before);
});

test('G7 T01 inventory list spacing and typography match Thu mua at 1440x900', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await expect(page.getByText('Chưa có giao dịch thu mua', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('purchases-1440x900.png') });

  const purchase = await page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const css = getComputedStyle(element);
      return { fontFamily: css.fontFamily, fontSize: css.fontSize, fontWeight: css.fontWeight, lineHeight: css.lineHeight, color: css.color };
    };
    const form = document.querySelector<HTMLElement>('.purchase-search');
    const header = document.querySelector<HTMLElement>('.page-header');
    const table = document.querySelector<HTMLElement>('.purchase-list .data-table-scroll');
    if (!form || !header || !table) throw new Error('Purchase list layout is incomplete');
    return {
      title: style('.page-header'), label: style('.purchase-filter-fields label'),
      input: style('.purchase-filter-fields input'),
      placeholder: (() => { const css = getComputedStyle(document.querySelector('.purchase-filter-fields input')!, '::placeholder'); return { fontFamily: css.fontFamily, fontSize: css.fontSize, fontWeight: css.fontWeight, lineHeight: css.lineHeight, color: css.color }; })(),
      search: style('.purchase-search-actions .button-beige'), clear: style('.purchase-search-actions .button-secondary'),
      tableHeader: style('.purchase-list .data-table th'), tableCell: style('.purchase-list .data-table tbody td'),
      pagination: style('.purchase-list .pagination button'),
      spacing: { headerToFilter: form.getBoundingClientRect().top - header.getBoundingClientRect().bottom, filterToTable: table.getBoundingClientRect().top - form.getBoundingClientRect().bottom },
    };
  });

  await page.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
  await expect(page.getByText('Không tìm thấy sản phẩm', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Danh sách hàng hóa', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('inventory-1440x900.png') });
  const inventory = await page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const css = getComputedStyle(element);
      return { fontFamily: css.fontFamily, fontSize: css.fontSize, fontWeight: css.fontWeight, lineHeight: css.lineHeight, color: css.color };
    };
    const form = document.querySelector<HTMLElement>('.inventory-search');
    const header = document.querySelector<HTMLElement>('.page-header');
    const table = document.querySelector<HTMLElement>('.inventory-list .data-table-scroll');
    if (!form || !header || !table) throw new Error('Inventory list layout is incomplete');
    return {
      title: style('.page-header'), label: style('.inventory-filter-fields label'),
      input: style('.inventory-filter-fields input'),
      placeholder: (() => { const css = getComputedStyle(document.querySelector('.inventory-filter-fields input')!, '::placeholder'); return { fontFamily: css.fontFamily, fontSize: css.fontSize, fontWeight: css.fontWeight, lineHeight: css.lineHeight, color: css.color }; })(),
      search: style('.inventory-actions .button-beige'), clear: style('.inventory-actions .button-secondary'),
      scan: style('.inventory-scan'), tableHeader: style('.inventory-list .data-table th'),
      tableCell: style('.inventory-list .data-table tbody td'), pagination: style('.inventory-list .pagination button'),
      spacing: { headerToFilter: form.getBoundingClientRect().top - header.getBoundingClientRect().bottom, filterToTable: table.getBoundingClientRect().top - form.getBoundingClientRect().bottom },
    };
  });

  expect(inventory.title).toEqual(purchase.title);
  expect(inventory.label).toEqual(purchase.label);
  expect(inventory.input).toEqual(purchase.input);
  expect(inventory.placeholder).toEqual(purchase.placeholder);
  expect(inventory.search).toEqual(purchase.search);
  expect(inventory.clear).toEqual(purchase.clear);
  expect(inventory.scan).toEqual(purchase.search);
  expect(inventory.tableHeader).toEqual(purchase.tableHeader);
  expect(inventory.tableCell).toEqual(purchase.tableCell);
  expect(inventory.pagination).toEqual(purchase.pagination);
  expect(inventory.spacing).toEqual(purchase.spacing);
});
