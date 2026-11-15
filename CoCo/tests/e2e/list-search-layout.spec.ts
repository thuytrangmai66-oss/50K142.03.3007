import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { bootstrapOwner, addStaffFixture, login } from './auth-helpers';
import { inventoryData } from './inventory-helpers';

for (const role of ['owner', 'staff'] as const) test(`${role}: list search controls share appearance, fit native geometry and narrow screens`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  const cdp = await page.context().newCDPSession(page);
  const before = await inventoryData(page), measurements = [];
  expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
    await page.setViewportSize(viewport);
    const samples = [];
    for (const route of role === 'owner' ? ['approvals', 'customers'] : ['customers']) {
      await page.goto(`./#/${route}`); await expect(page.locator('.pagination')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
        const search = document.querySelector('.search-field')!, input = search.querySelector('input')!, icon = search.querySelector('svg')!;
        const css = getComputedStyle(search), text = getComputedStyle(input), placeholder = getComputedStyle(input, '::placeholder');
        const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')!;
        ctx.font = `${text.fontWeight} ${text.fontSize} ${text.fontFamily}`;
        const date = document.querySelector('.approval-date-field'), dateInput = date?.querySelector('input');
        const datePlaceholder = date?.querySelector('span');
        return { header: box(document.querySelector('.page-header')!), toolbar: box(document.querySelector('.reference-toolbar')!), search: box(search), table: box(document.querySelector('.data-table-scroll')!),
          icon: box(icon), input: box(input), placeholderFits: ctx.measureText(input.placeholder).width <= input.clientWidth,
          style: { height: css.height, padding: css.padding, gap: css.gap, radius: css.borderRadius, background: css.backgroundColor,
            font: text.font, inputPadding: text.padding, placeholderFont: placeholder.font, placeholderColor: placeholder.color, placeholderOpacity: placeholder.opacity },
          date: date ? box(date) : null, dateInput: dateInput ? box(dateInput) : null, datePlaceholder: datePlaceholder ? box(datePlaceholder) : null,
          dateFont: dateInput ? getComputedStyle(dateInput).font : null,
          datePlaceholderColor: datePlaceholder ? getComputedStyle(datePlaceholder).color : null,
          pageX: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(geometry.search.height).toBe(45); expect(geometry.icon.width).toBe(20); expect(geometry.icon.height).toBe(20);
      expect(Math.abs(geometry.icon.y + geometry.icon.height / 2 - geometry.search.y - geometry.search.height / 2)).toBeLessThanOrEqual(2);
      expect(geometry.style.padding).toBe('0px 20px'); expect(geometry.style.gap).toBe('16px');
      expect(geometry.style.placeholderColor).toBe('rgb(174, 174, 178)'); expect(geometry.style.placeholderOpacity).toBe('1');
      expect(geometry.placeholderFits).toBe(true); expect(geometry.pageX).toBe(0);
      let dateIcon = null;
      if (route === 'approvals') {
        // Native calendar icons live in Chromium's UA shadow tree, not an SVG.
        const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
        type NativeNode = { nodeId: number; attributes?: string[]; children?: NativeNode[]; shadowRoots?: NativeNode[] };
        function findIndicator(node: NativeNode): number | undefined {
          if (node.attributes?.includes('-webkit-calendar-picker-indicator')) return node.nodeId;
          for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) {
            const found = findIndicator(child); if (found) return found;
          }
        }
        const nodeId = findIndicator(root); expect(nodeId).toBeDefined();
        const { model } = await cdp.send('DOM.getBoxModel', { nodeId });
        dateIcon = { x: model.border[0], y: model.border[1], width: model.width, height: model.height };
        expect(geometry.date!.height).toBe(45); expect(dateIcon.width).toBe(20); expect(dateIcon.height).toBe(20);
        expect(Math.abs(geometry.date!.x + geometry.date!.width - dateIcon.x - dateIcon.width - 20)).toBeLessThanOrEqual(2);
        expect(Math.abs(dateIcon.y + dateIcon.height / 2 - geometry.date!.y - geometry.date!.height / 2)).toBeLessThanOrEqual(2);
        expect(geometry.datePlaceholder!.x - geometry.date!.x).toBe(20);
        expect(geometry.dateFont).toBe(geometry.style.font); expect(geometry.datePlaceholderColor).toBe(geometry.style.placeholderColor);
        expect(geometry.toolbar.y - geometry.header.bottom).toBe(36); expect(geometry.table.y - geometry.toolbar.bottom).toBe(30);
        if (viewport.width >= 1280) {
          expect(geometry.date!.width).toBe(221); expect(geometry.search.width).toBeGreaterThan(geometry.date!.width);
          expect(geometry.search.y).toBe(geometry.date!.y);
        } else expect(geometry.date!.y).toBeGreaterThanOrEqual(geometry.search.bottom + 16);
        if (viewport.width === 1440) {
          for (const [actual, reference] of [[geometry.search.x, 461], [geometry.search.y, 142], [geometry.search.width, 706], [geometry.date!.x, 1182], [geometry.table.y, 218]]) expect(Math.abs(actual - reference)).toBeLessThanOrEqual(2);
          const date = page.getByLabel('Ngày gửi', { exact: true });
          await page.mouse.click(dateIcon.x + dateIcon.width / 2, dateIcon.y + dateIcon.height / 2);
          await expect.poll(() => date.evaluate(input => input.matches(':open'))).toBe(true);
          await page.screenshot({ path: info.outputPath('approvals-calendar-open-1440.png') });
          await page.keyboard.press('Escape');
          await date.click({ position: { x: 12, y: geometry.dateInput!.height / 2 } });
          await expect.poll(() => date.evaluate(input => input.matches(':open'))).toBe(true);
          await page.keyboard.press('Escape');
          await date.fill('2026-11-15'); await expect(date).toHaveValue('2026-11-15');
          await expect(date).toHaveAttribute('data-empty', 'false');
          await expect(page.locator('.pagination')).toBeVisible();
          await page.locator('.page-header').click();
          await page.screenshot({ path: info.outputPath('approvals-filled-date-1440.png') });
          await date.fill(''); await expect(date).toHaveAttribute('data-empty', 'true');
          await expect(page.locator('.pagination')).toBeVisible();
          await page.locator('.page-header').click();
        }
        await expect(page.locator('thead th')).toHaveText(['Mã yêu cầu', 'Nhân viên thực hiện', 'Trạng thái', 'Thời gian']);
      }
      samples.push(geometry.style); measurements.push({ viewport, route, ...geometry, dateIcon });
      await page.screenshot({ path: info.outputPath(`${role}-${route}-${viewport.width}x${viewport.height}.png`) });
    }
    if (samples.length === 2) expect(samples[1]).toEqual(samples[0]);
  }
  if (role === 'owner') {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const route of ['purchases', 'inventory']) {
      await page.goto(`./#/${route}`);
      const date = page.locator('input[type=date]'); await expect(date).toBeVisible();
      const original = await date.inputValue();
      await date.fill('2026-11-15'); await expect(date).toHaveValue('2026-11-15');
      await date.fill(original); await expect(page.locator('.pagination')).toBeVisible();
      await page.locator('.page-header').click();
      await page.screenshot({ path: info.outputPath(`unchanged-${route}-date.png`) });
    }
  }
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
  await writeFile(info.outputPath(`${role}-geometry.json`), JSON.stringify(measurements, null, 2));
});
