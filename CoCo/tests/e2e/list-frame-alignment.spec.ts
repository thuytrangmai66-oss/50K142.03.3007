import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { addStaffFixture, login } from './auth-helpers';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';

async function frame(page: Page) {
  await expect(page.locator('.reference-list .pagination')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const element = (selector: string) => document.querySelector<HTMLElement>(selector)!;
    const box = (selector: string) => {
      const { x, y, width, height, right, bottom } = element(selector).getBoundingClientRect();
      return { x, y, width, height, right, bottom };
    };
    const style = (selector: string) => {
      const css = getComputedStyle(element(selector));
      return { padding: css.padding, radius: css.borderRadius, font: css.font,
        background: css.backgroundColor, color: css.color, border: css.border };
    };
    const header = box('.page-header'), filter = box('.reference-list form');
    const table = box('.data-table-scroll'), pagination = box('.pagination');
    const search = '.reference-list form button[type=submit]', reset = `${search} + button`;
    const main = element('#main-content'), mainCss = getComputedStyle(main);
    const contentLeft = main.getBoundingClientRect().left + parseFloat(mainCss.paddingLeft);
    const contentRight = main.getBoundingClientRect().right - parseFloat(mainCss.paddingRight);
    return { header, filter, table, pagination, filterStyle: style('.reference-list form'),
      search: box(search), reset: box(reset), searchStyle: style(search), resetStyle: style(reset),
      pageButton: box('.pagination button'), pageButtonStyle: style('.pagination button'),
      headerGap: filter.y - header.bottom, tableGap: table.y - filter.bottom,
      paginationGap: pagination.y - table.bottom, contentCenter: (contentLeft + contentRight) / 2,
      tableScrollY: element('.data-table-scroll').scrollHeight - element('.data-table-scroll').clientHeight,
      pageScrollX: document.documentElement.scrollWidth - innerWidth,
    };
  });
}

function aligned(actual: Awaited<ReturnType<typeof frame>>, sales: Awaited<ReturnType<typeof frame>>) {
  for (const part of ['header', 'filter', 'table', 'pagination'] as const) {
    for (const axis of ['x', 'y', 'width', 'height', 'right', 'bottom'] as const) {
      expect(Math.abs(actual[part][axis] - sales[part][axis]), `${part}.${axis}`).toBeLessThanOrEqual(2);
    }
  }
  expect(actual.filterStyle).toEqual(sales.filterStyle);
  expect(actual.searchStyle).toEqual(sales.searchStyle);
  expect(actual.resetStyle).toEqual(sales.resetStyle);
  expect(actual.pageButtonStyle).toEqual(sales.pageButtonStyle);
  for (const part of ['search', 'reset', 'pageButton'] as const) {
    expect(Math.abs(actual[part].width - sales[part].width), `${part}.width`).toBeLessThanOrEqual(2);
    expect(Math.abs(actual[part].height - sales[part].height), `${part}.height`).toBeLessThanOrEqual(2);
  }
  expect(actual.headerGap).toBe(12);
  expect(actual.tableGap).toBe(12);
  expect(actual.paginationGap).toBe(20);
  expect(Math.abs(actual.pagination.x + actual.pagination.width / 2 - actual.contentCenter)).toBeLessThanOrEqual(2);
  expect(actual.tableScrollY).toBeLessThanOrEqual(1);
  expect(actual.pageScrollX).toBeLessThanOrEqual(1);
}

for (const role of ['owner', 'staff'] as const) test(`${role}: inventory and purchase list frames align with sales for empty and real data`, async ({ page, context }, info) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  await createInventoryThroughUI(page, '12');
  let reader = page;
  if (role === 'staff') {
    await addStaffFixture(page); reader = await context.newPage(); await reader.goto('./');
    await login(reader, 'staff', 'staff-test!');
  }
  reader.on('pageerror', error => errors.push(error.message));
  reader.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  expect(await reader.evaluate(() => devicePixelRatio)).toBe(1);
  const before = await inventoryData(reader), measurements = [];
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 650 }]) {
    await reader.setViewportSize(viewport);
    await reader.getByRole('link', { name: 'Bán hàng', exact: true }).click();
    await expect(reader.getByText('Chưa có giao dịch bán hàng', { exact: true })).toBeVisible();
    const sales = await frame(reader);
    measurements.push({ viewport, route: 'sales', state: 'empty', ...sales });
    await reader.screenshot({ path: info.outputPath(`${role}-sales-${viewport.width}.png`) });
    for (const [name, route] of [['Hàng hóa', 'inventory'], ['Thu mua', 'purchases']] as const) {
      await reader.getByRole('link', { name, exact: true }).click();
      const form = reader.locator('.reference-list form');
      for (const state of ['empty', 'populated'] as const) {
        if (state === 'empty') {
          await form.locator('input').first().fill('NO-MATCH');
          await form.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
          await expect(reader.locator('.data-table-empty')).toBeVisible();
        } else {
          await form.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
          await expect(reader.locator('.data-table tbody tr').first()).toBeVisible();
          await expect(reader.locator('.data-table-empty')).toHaveCount(0);
        }
        await expect(async () => aligned(await frame(reader), sales)).toPass();
        measurements.push({ viewport, route, state, ...await frame(reader) });
        await expect(reader.locator('.pagination')).toBeInViewport({ ratio: 1 });
        await expect(reader.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeInViewport({ ratio: 1 });
        if (route === 'inventory') await expect(reader.locator('thead th')).toHaveText(['Mã sản phẩm', 'Tên sản phẩm', 'Giá bán hiện hành', 'Trạng thái', 'Ngày nhập']);
        await reader.screenshot({ path: info.outputPath(`${role}-${route}-${state}-${viewport.width}.png`) });
      }
    }
  }
  expect(await inventoryData(reader)).toEqual(before);
  expect(errors).toEqual([]);
  await writeFile(info.outputPath(`${role}-frames.json`), JSON.stringify(measurements, null, 2));
});
