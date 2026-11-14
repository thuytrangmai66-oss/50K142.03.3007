import { expect, test } from '@playwright/test';
import { bootstrapOwner, addStaffFixture, login } from './auth-helpers';
import { writeFile } from 'node:fs/promises';

// Independent measurements from CODEX staff purchase-create-1 PDF (1440×900).
const reference = {
  '.sidebar': [26, 16, 397, 868], '.page-header': [461, 31, 943, 75],
  '.purchase-heading > button': [461, 153, 108, 49], '.purchase-title-card': [579, 138, 825, 73],
  '.purchase-title-card > strong': [905.4, 155, 145, 39],
  '.purchase-lines .data-table-scroll': [461, 227, 619, 657], '.purchase-customer': [1093, 227, 311, 255],
  '.purchase-payment': [1093, 497, 311, 387], '.customer-phone-lookup .field-input': [1114, 299, 278, 43],
  '.purchase-customer > .coco-field .field-input': [1114, 397, 278, 43],
  '.purchase-payment .button-beige': [1126, 823, 108, 49], '.purchase-payment .button-secondary': [1267, 823, 108, 49],
};
for (const role of ['owner', 'staff'] as const) test(`${role}: empty purchase editor preserves the local Figma canvas layout`, async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click(); await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { name: 'Thông tin giao dịch', exact: true })).toBeVisible();
  const measurements: Record<string, unknown> = {};
  for (const [selector, expected] of Object.entries(reference)) {
    const actual = await page.locator(selector).boundingBox(); expect(actual, selector).not.toBeNull();
    for (const [index, key] of ['x', 'y', 'width', 'height'].entries()) {
      // G11-B02 / G10-D02: PO approved 2 CSS px only for this badge's X coordinate.
      const tolerance = selector === '.purchase-title-card > strong' && key === 'x' ? 2 : 1;
      expect(Math.abs(actual![key as keyof typeof actual] - expected[index]), `${selector} ${key}`).toBeLessThanOrEqual(tolerance);
    }
    measurements[selector] = actual;
  }
  await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(0);
  await expect(page.locator('.purchase-lines .empty-state')).toHaveCount(0);
  await expect(page.locator('.purchase-lines .pagination')).toBeHidden();
  await expect(page.locator('.purchase-total')).toHaveText('Tổng tiền');
  await expect(page.locator('.purchase-lines thead th')).toHaveText(['Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']);
  expect(await page.locator('.purchase-heading').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('.purchase-payment .button-beige')).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Bán hàng', exact: true })).toHaveAttribute('href', '#/sales');
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport); await expect(page.locator('.purchase-payment .button-secondary')).toBeInViewport({ ratio: 1 });
    const overflow = await page.evaluate(() => { const main = document.getElementById('main-content')!; return { pageX: document.documentElement.scrollWidth - innerWidth, mainY: main.scrollHeight - main.clientHeight }; });
    expect(overflow.pageX).toBeLessThanOrEqual(1); expect(overflow.mainY).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath(`${role}-empty-${viewport.width}x${viewport.height}.png`), fullPage: false });
  }
  await writeFile(info.outputPath(`${role}-figma-geometry.json`), JSON.stringify(measurements, null, 2));
  expect(errors).toEqual([]);
});

test('purchase editor keeps the shared shell and reference typography across desktop viewports', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page);
  const viewports = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
    await expect(page.getByText('Chưa có giao dịch thu mua', { exact: true })).toBeVisible();
    const list = await page.evaluate(() => {
      const box = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const rect = element.getBoundingClientRect();
        return [rect.x, rect.y, rect.width, rect.height];
      };
      const font = (selector: string, pseudo?: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const style = getComputedStyle(element, pseudo);
        return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight];
      };
      return {
        shell: [getComputedStyle(document.querySelector('.app-shell')!).gridTemplateColumns, getComputedStyle(document.querySelector('.app-shell')!).gap, getComputedStyle(document.querySelector('.app-shell')!).padding],
        layout: ['.sidebar', '.brand img', '.sidebar nav a:first-child', '.page-header', '.account-name', '#main-content'].map(box),
        title: font('.page-header'), account: font('.account-name'), menu: font('.sidebar nav a:first-child'),
        action: font('.purchase-search-actions .button-beige'), clear: font('.purchase-search-actions .button-secondary'),
        label: font('.purchase-filter-fields label'), input: font('.purchase-filter-fields input'),
        placeholder: font('.purchase-filter-fields input', '::placeholder'),
        tableHeader: font('.purchase-list .data-table th'), tableCell: font('.purchase-list .data-table tbody td'),
      };
    });
    if (viewport.width === 1920) await page.screenshot({ path: info.outputPath('purchase-list-1920x1080.png') });

    await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thông tin giao dịch', exact: true })).toBeVisible();
    const editor = await page.evaluate(() => {
      const box = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const rect = element.getBoundingClientRect();
        return [rect.x, rect.y, rect.width, rect.height];
      };
      const font = (selector: string, pseudo?: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const style = getComputedStyle(element, pseudo);
        return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight];
      };
      return {
        shell: [getComputedStyle(document.querySelector('.app-shell')!).gridTemplateColumns, getComputedStyle(document.querySelector('.app-shell')!).gap, getComputedStyle(document.querySelector('.app-shell')!).padding],
        layout: ['.sidebar', '.brand img', '.sidebar nav a:first-child', '.page-header', '.account-name', '#main-content'].map(box),
        title: font('.page-header'), account: font('.account-name'), menu: font('.sidebar nav a:first-child'),
        breadcrumb: font('.purchase-breadcrumb'), editorTitle: font('.purchase-heading h1'), code: font('.purchase-heading strong'),
        add: font('.purchase-heading > button'), action: font('.purchase-payment .button-beige'),
        clear: font('.purchase-payment .button-secondary'), label: font('.purchase-customer label'),
        input: font('.purchase-customer input'), placeholder: font('.purchase-customer input', '::placeholder'),
        tableHeader: font('.purchase-lines .data-table th'), customerTitle: font('.purchase-customer h2'),
        paymentTitle: font('.purchase-payment h2'), totalLabel: font('.purchase-total > strong:first-child'),
      };
    });
    expect(editor.shell).toEqual(list.shell);
    expect(editor.layout).toEqual(list.layout);
    expect(editor.title).toEqual(list.title);
    expect(editor.account).toEqual(list.account);
    expect(editor.menu).toEqual(list.menu);
    expect(editor.editorTitle).toEqual(list.title);
    expect(editor.code).toEqual(list.tableCell);
    expect(editor.add).toEqual(list.action);
    expect(editor.action).toEqual(list.action);
    expect(editor.clear).toEqual(list.clear);
    expect(editor.label).toEqual(list.label);
    expect(editor.input).toEqual(list.input);
    expect(editor.tableHeader).toEqual(list.tableHeader);
    expect(editor.customerTitle).toEqual(editor.paymentTitle);
    expect(editor.totalLabel).toEqual(editor.label);
    expect(editor.breadcrumb[0]).toBe(editor.title[0]);
    expect(editor.breadcrumb[1]).toBe(editor.title[1]);
    expect(editor.breadcrumb[3]).toBe(editor.title[3]);
    expect(editor.placeholder).toEqual(list.placeholder);
    if (viewport.width === 1920) await page.screenshot({ path: info.outputPath('purchase-editor-after-1920x1080.png') });

    await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
    await expect(page.getByText('Chưa có giao dịch thu mua', { exact: true })).toBeVisible();
    const back = await page.evaluate(() => ['.sidebar', '.brand img', '.sidebar nav a:first-child', '.page-header', '.account-name', '#main-content'].map(selector => {
      const rect = document.querySelector(selector)!.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height];
    }));
    expect(back).toEqual(list.layout);
  }

  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thông tin giao dịch', exact: true })).toBeVisible();
  for (const viewport of [{ width: 1024, height: 768 }, { width: 800, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => {
      const main = document.getElementById('main-content')!;
      return { document: document.documentElement.scrollWidth - innerWidth, main: main.scrollWidth - main.clientWidth };
    });
    expect(overflow.document).toBeLessThanOrEqual(1);
    expect(overflow.main).toBeLessThanOrEqual(1);
    await page.locator('.purchase-payment .button-secondary').scrollIntoViewIfNeeded();
    await expect(page.locator('.purchase-payment .button-secondary')).toBeInViewport({ ratio: 1 });
  }
});

