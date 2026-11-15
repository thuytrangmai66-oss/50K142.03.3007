import { expect, test, type Page } from '@playwright/test';
import { bootstrapOwner, login } from './auth-helpers';
import { inventoryData } from './inventory-helpers';
import { prepare, add } from './sales-helpers';
import { closeNotice } from './purchase-helpers';
import { writeFile } from 'node:fs/promises';

test.use({ timezoneId: 'America/New_York' });

async function advanceDay(page: Page, label: string, seed: string, expected: string, textArea = false) {
  const text = page.getByLabel(label, { exact: true }), native = page.getByLabel(`Chọn ngày cho ${label}`, { exact: true });
  await text.fill(seed);
  await (textArea ? text : native).click();
  await expect.poll(() => native.evaluate(input => input.matches(':open'))).toBe(true);
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  await expect(text).toHaveValue(expected);
  await expect(native).toHaveValue(expected.split('/').reverse().join('-'));
  await expect.poll(() => native.evaluate(input => input.matches(':open'))).toBe(false);
}

test('four reports open real native calendars, preserve dd/mm dates, validate and switch period kinds', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await bootstrapOwner(page); await login(page);
  const before = await inventoryData(page);
  for (const kind of ['revenue', 'purchase-cost', 'profit', 'cash-flow']) {
    await page.goto(`./#/reports/${kind}`);
    const start = page.getByLabel('Từ ngày', { exact: true }), end = page.getByLabel('Đến ngày', { exact: true });
    await start.fill('28/02/2024');
    const native = page.getByLabel('Chọn ngày cho Từ ngày', { exact: true });
    await native.click(); await expect.poll(() => native.evaluate(input => input.matches(':open'))).toBe(true);
    await page.screenshot({ path: info.outputPath(`${kind}-calendar-open.png`) });
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    await expect(start).toHaveValue('29/02/2024');
    await advanceDay(page, 'Đến ngày', '29/02/2024', '01/03/2024', true);
    await start.focus(); await end.focus(); await expect(start).toHaveValue('29/02/2024');
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.locator('.report-summary')).toBeVisible(); await expect(page.locator('.empty-state')).toBeVisible();
    await page.locator('.page-header').click();
    await page.screenshot({ path: info.outputPath(`${kind}-selected-range.png`) });
  }
  await advanceDay(page, 'Từ ngày', '30/12/2025', '31/12/2025');
  await advanceDay(page, 'Đến ngày', '31/12/2025', '01/01/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Từ ngày', { exact: true }).fill('02/01/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Khoảng thời gian không hợp lệ');
  await page.getByRole('button', { name: 'Theo ngày', exact: true }).click();
  await expect(page.getByLabel('Ngày', { exact: true })).toHaveValue(''); await expect(page.locator('input[type=date]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Theo tháng', exact: true }).click();
  await expect(page.locator('input[type=date]')).toHaveCount(0); await page.getByLabel('Tháng', { exact: true }).fill('02/2024');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click(); await page.getByLabel('Năm', { exact: true }).fill('2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page.getByRole('button', { name: 'Theo khoảng thời gian', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Khoảng thời gian không hợp lệ');
  await page.reload(); await expect(page.getByLabel('Từ ngày', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Đến ngày', { exact: true })).toHaveValue(''); await expect(page.locator('input[type=date]')).toHaveCount(2);
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
});

test('native calendar range filters real cash flow on the Vietnam day even in a different browser timezone', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-13T17:30:00Z'));
  const { products } = await prepare(page, context);
  await add(page, String(products[0].MaSP)); await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Thanh toán thành công!'); const before = await inventoryData(page);
  await page.goto('./#/reports/cash-flow');
  await advanceDay(page, 'Từ ngày', '13/11/2026', '14/11/2026');
  await advanceDay(page, 'Đến ngày', '14/11/2026', '15/11/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('14/11/2026');
  await expect(page.locator('.report-summary')).toContainText('104.007');
  await expect(page.locator('.report-summary')).toContainText('160.010');
  await page.getByLabel('Đến ngày', { exact: true }).fill('14/11/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.locator('tbody')).toContainText('14/11/2026');
  await advanceDay(page, 'Từ ngày', '14/11/2026', '15/11/2026');
  await page.getByLabel('Đến ngày', { exact: true }).fill('15/11/2026');
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(page.locator('.empty-state')).toBeVisible();
  expect(await inventoryData(page)).toEqual(before);
});

test('report date fields match list date borders, fit the selected date and preserve responsive filter layout', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page);
  const cdp = await page.context().newCDPSession(page);
  await page.goto('./#/purchases');
  const reference = await page.locator('.purchase-filter-fields input[type=date]').evaluate(input => {
    const css = getComputedStyle(input); return { height: input.getBoundingClientRect().height, border: css.border, radius: css.borderRadius, fontSize: css.fontSize };
  });
  await page.screenshot({ path: info.outputPath('reference-purchase-date.png') });
  await page.goto('./#/inventory'); await expect(page.locator('.inventory-filter-fields input[type=date]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('reference-inventory-date.png') });
  const measurements = [];
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport); await page.goto('./#/reports/cash-flow');
    await page.getByLabel('Từ ngày', { exact: true }).fill('29/02/2024');
    await page.getByLabel('Đến ngày', { exact: true }).fill('01/03/2024');
    await page.evaluate(() => document.fonts.ready);
    const fields = await page.locator('.report-date-field').evaluateAll(wrappers => wrappers.map(wrapper => {
      const text = wrapper.querySelector<HTMLInputElement>('.report-date-text')!, native = wrapper.querySelector<HTMLInputElement>('.report-date-picker')!;
      const css = getComputedStyle(text);
      const rect = text.getBoundingClientRect(), icon = native.getBoundingClientRect();
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d')!; context.font = css.font;
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, border: css.border, radius: css.borderRadius, fontSize: css.fontSize,
        textFits: context.measureText(text.value).width <= text.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
        iconWidth: icon.width, iconHeight: icon.height, iconCenter: icon.y + icon.height / 2 };
    }));
    // getComputedStyle for this UA pseudo-element returns the host input's box.
    // Measure the actual native indicator inside Chromium's UA shadow tree instead.
    const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    type NativeNode = { nodeId: number; attributes?: string[]; children?: NativeNode[]; shadowRoots?: NativeNode[] };
    const indicatorIds: number[] = [];
    function collect(node: NativeNode) {
      if (node.attributes?.includes('-webkit-calendar-picker-indicator')) indicatorIds.push(node.nodeId);
      for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) collect(child);
    }
    collect(root); expect(indicatorIds).toHaveLength(2);
    const indicators = await Promise.all(indicatorIds.map(async nodeId => {
      const { model } = await cdp.send('DOM.getBoxModel', { nodeId });
      return { width: model.width, height: model.height, center: (model.border[1] + model.border[5]) / 2 };
    }));
    expect(fields[0].height).toBe(fields[1].height); expect(fields[0].width).toBe(fields[1].width);
    for (const [index, field] of fields.entries()) {
      expect(Math.abs(field.height - reference.height)).toBeLessThanOrEqual(2);
      expect(field.border).toBe(reference.border); expect(field.radius).toBe(reference.radius); expect(field.fontSize).toBe(reference.fontSize);
      expect(field.textFits).toBe(true); expect(indicators[index].width).toBe(20); expect(indicators[index].height).toBe(20);
      expect(field.iconWidth).toBeGreaterThanOrEqual(32);
      expect(Math.abs(indicators[index].center - field.y - field.height / 2)).toBeLessThanOrEqual(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    measurements.push({ viewport, fields, indicators }); await page.locator('.page-header').click();
    await page.screenshot({ path: info.outputPath(`report-date-${viewport.width}x${viewport.height}.png`) });
  }
  await writeFile(info.outputPath('geometry.json'), JSON.stringify({ reference, measurements }, null, 2));
});
