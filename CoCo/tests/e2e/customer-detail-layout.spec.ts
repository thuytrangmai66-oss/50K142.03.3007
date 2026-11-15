import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { bootstrapOwner, addStaffFixture, login } from './auth-helpers';
import { inventoryData } from './inventory-helpers';

for (const role of ['owner', 'staff'] as const) test(`${role}: customer detail has no list toolbar, matches Back spacing and keeps list controls and histories`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await expect(page.getByRole('search')).toBeVisible();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await create.getByLabel('Họ tên', { exact: true }).fill('Khách kiểm thử bố cục');
  await create.getByLabel('Số điện thoại', { exact: true }).fill('0900000077');
  await create.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tìm khách hàng theo số điện thoại' }).fill('0900000077');
  await page.getByRole('button', { name: 'Tìm khách hàng', exact: true }).click();
  await page.getByRole('link', { name: 'Khách kiểm thử bố cục', exact: true }).click();
  await expect(page.locator('.customer-detail-card')).toBeVisible();
  const detailUrl = page.url(), before = await inventoryData(page), measurements = [];
  expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 650 }]) {
    await page.setViewportSize(viewport); await page.goto('./#/inventory/discounts');
    await expect(page.locator('.discount-summary')).toBeVisible(); await page.evaluate(() => document.fonts.ready);
    const reference = await page.locator('.discount-monitor > .back-link').evaluate(back => {
      const css = getComputedStyle(back), icon = back.querySelector('svg')!.getBoundingClientRect();
      return { gap: back.getBoundingClientRect().top - document.querySelector('.page-header')!.getBoundingClientRect().bottom,
        contentGap: document.querySelector('.discount-summary')!.getBoundingClientRect().top - back.getBoundingClientRect().bottom,
        font: css.font, iconWidth: icon.width, iconHeight: icon.height, iconTextGap: css.gap };
    });
    expect(Math.abs(reference.gap - reference.contentGap)).toBeLessThanOrEqual(2);
    await page.goto(detailUrl); await expect(page.locator('.customer-detail-card')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.customer-detail .reference-toolbar')).toHaveCount(0);
    await expect(page.getByRole('search')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tạo tài khoản', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Quay lại', exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Xóa tài khoản', exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole('button', { name: 'Sửa thông tin', exact: true })).toBeInViewport({ ratio: 1 });
    const layout = await page.evaluate(() => {
      const box = (s: string) => { const r = document.querySelector(s)!.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
      const back = document.querySelector('.customer-detail > .back-link')!, css = getComputedStyle(back), icon = back.querySelector('svg')!.getBoundingClientRect();
      const header = box('.page-header'), link = box('.customer-detail > .back-link'), card = box('.customer-detail-card');
      const histories = Array.from(document.querySelectorAll('.customer-detail-card .history-links a')).map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      const main = document.querySelector('#main-content')!;
      return { header, back: link, card, body: box('.customer-detail-card > .record-body'), sidebar: box('.sidebar'), title: box('.customer-detail-card > h1'), input: box('.customer-detail-card .field-input'), history: box('.customer-detail-card .history-links'), histories,
        form: box('.customer-detail-card .record-form'),
        inputs: Array.from(document.querySelectorAll('.customer-detail-card .field-input')).map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }),
        labels: Array.from(document.querySelectorAll('.customer-detail-card .coco-field label')).map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }),
        actions: box('.customer-detail-card .form-actions'),
        historyGap: histories[1].x - histories[0].x - histories[0].width,
        historyX: histories[0].y - (Array.from(document.querySelectorAll('.customer-detail-card .field-input')).at(-1)!.getBoundingClientRect().bottom),
        historyY: box('.customer-detail-card .form-actions').y - (histories[1].y + histories[1].height),
        buttons: Array.from(document.querySelectorAll('.customer-detail-card .form-actions button')).map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }),
        a: link.y - header.bottom, b: card.y - link.bottom,
        font: css.font, iconWidth: icon.width, iconHeight: icon.height, iconTextGap: css.gap,
        scrollTop: main.scrollTop, scrollY: main.scrollHeight - main.clientHeight, pageX: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(Math.abs(layout.a - layout.b)).toBeLessThanOrEqual(2);
    expect(layout.a).toBe(reference.gap);
    for (const key of ['font', 'iconWidth', 'iconHeight', 'iconTextGap'] as const) expect(layout[key]).toBe(reference[key]);
    expect(layout.back.x).toBe(layout.card.x);
    expect(Math.abs(layout.card.bottom - layout.sidebar.bottom)).toBeLessThanOrEqual(8);
    expect(layout.histories[0].y).toBe(layout.histories[1].y);
    expect(layout.histories[0].width).toBe(layout.histories[1].width);
    expect(layout.histories[0].height).toBe(layout.histories[1].height);
    expect(layout.histories[0].width / 375).toBeGreaterThanOrEqual(1.05);
    expect(layout.histories[0].width / 375).toBeLessThanOrEqual(1.08);
    expect(layout.historyGap).toBeGreaterThanOrEqual(24);
    expect(layout.historyGap).toBeLessThanOrEqual(32);
    expect(Math.abs(layout.historyX - layout.historyY)).toBeLessThanOrEqual(8);
    expect(layout.histories[0].x).toBeGreaterThanOrEqual(layout.card.x);
    expect(layout.histories[1].x + layout.histories[1].width).toBeLessThanOrEqual(layout.card.x + layout.card.width);
    expect(layout.inputs[0].x).toBe(layout.inputs[1].x);
    expect(layout.inputs[0].width).toBe(layout.inputs[1].width);
    expect(layout.inputs.every(input => input.height === (viewport.height <= 850 ? 48 : 70))).toBe(true);
    expect(layout.histories.every(link => link.height === (viewport.height <= 850 ? 112 : 165))).toBe(true);
    expect(layout.buttons.every(button => button.height === (viewport.height <= 850 ? 40 : 49))).toBe(true);
    expect(layout.buttons[0].y).toBe(layout.buttons[1].y);
    // The new PO requirement replaces proportional rows with a bottom action group.
    expect(layout.body.bottom).toBe(layout.card.bottom);
    const bottomGap = layout.body.bottom - layout.actions.bottom;
    expect(bottomGap).toBeGreaterThanOrEqual(20); expect(bottomGap).toBeLessThanOrEqual(32);
    expect(bottomGap).toBe(24);
    expect(layout.actions.y).toBeGreaterThanOrEqual(layout.body.y + layout.body.height * .75);
    expect(layout.actions.y - layout.history.bottom).toBeGreaterThanOrEqual(viewport.height <= 850 ? 20 : 40);
    expect(layout.inputs[0].y - layout.body.y).toBe(viewport.height <= 850 ? 20 : 23);
    expect(layout.inputs[1].y - layout.inputs[0].y - layout.inputs[0].height).toBe(viewport.height <= 850 ? 20 : 49);
    expect(layout.history.y).toBe(layout.histories[0].y);
    expect(layout.inputs[1].y).toBeGreaterThan(layout.inputs[0].y + layout.inputs[0].height);
    expect(layout.histories[0].y).toBeGreaterThan(layout.inputs[1].y + layout.inputs[1].height);
    expect(layout.buttons[0].y).toBeGreaterThan(layout.histories[0].y + layout.histories[0].height);
    expect(layout.labels[0].x).toBe(layout.labels[1].x);
    for (let index = 0; index < layout.labels.length; index++) {
      expect(Math.abs(layout.labels[index].y + layout.labels[index].height / 2 - layout.inputs[index].y - layout.inputs[index].height / 2)).toBeLessThanOrEqual(2);
    }
    expect(layout.input.width).toBeLessThanOrEqual(619);
    expect(layout.histories[0].width).toBeLessThanOrEqual(405);
    const historyCenter = (layout.histories[0].x + layout.histories[1].x + layout.histories[1].width) / 2;
    expect(Math.abs(historyCenter - layout.card.x - layout.card.width / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(layout.actions.x + layout.actions.width - layout.form.x - layout.form.width)).toBeLessThanOrEqual(2);
    if (viewport.height <= 850) {
      expect(layout.input.width / layout.form.width).toBeGreaterThanOrEqual(.65);
      expect(layout.input.width / layout.form.width).toBeLessThanOrEqual(.70);
    }
    expect(layout.scrollTop).toBe(0); expect(layout.scrollY).toBeLessThanOrEqual(1); expect(layout.pageX).toBe(0);
    if (viewport.width === 1440) {
      expect(Math.abs(layout.card.x - 461)).toBeLessThanOrEqual(2);
      expect(Math.abs(layout.card.y - 178)).toBeLessThanOrEqual(2);
      expect(Math.abs(layout.card.width - 943)).toBeLessThanOrEqual(2);
      // PO's new height requirement aligns the card with the unchanged sidebar.
      expect(Math.abs(layout.card.height - (layout.sidebar.bottom - layout.card.y))).toBeLessThanOrEqual(8);
      expect(layout.title.height).toBe(75); expect(layout.input.height).toBe(70);
      expect(layout.histories[0].width).toBe(400); expect(layout.histories[0].height).toBe(165);
      // Fixed Y positions were replaced by the PO's proportional distribution.
    }
    await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách kiểm thử bố cục');
    await expect(page.getByLabel('Họ tên', { exact: true })).toHaveAttribute('readonly', '');
    await expect(page.getByLabel('Số điện thoại', { exact: true })).toHaveValue('0900000077');
    measurements.push({ viewport, ...layout });
    await page.screenshot({ path: info.outputPath(`${role}-detail-${viewport.width}x${viewport.height}.png`) });
  }
  await page.setViewportSize({ width: 1366, height: 500 });
  await page.goto(detailUrl); await expect(page.locator('.customer-detail-card')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  expect(await page.locator('#main-content').evaluate(main => main.scrollHeight - main.clientHeight)).toBeGreaterThan(0);
  const remove = page.getByRole('button', { name: 'Xóa tài khoản', exact: true });
  await remove.scrollIntoViewIfNeeded();
  // Reach the card's bottom padding, rather than stopping at a fractional edge.
  await page.locator('#main-content').evaluate(main => { main.scrollTop = main.scrollHeight; });
  await expect(remove).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: 'Sửa thông tin', exact: true })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath(`${role}-detail-low-1366x500.png`) });
  const back = page.getByRole('link', { name: 'Quay lại', exact: true });
  await back.scrollIntoViewIfNeeded(); await back.click();
  await expect(page.getByRole('search')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(detailUrl); await expect(page.locator('.customer-detail-card')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Sửa thông tin', exact: true })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: 'Xóa tài khoản', exact: true })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath(`${role}-detail-narrow-390x844.png`), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 650 });
  await page.goto(detailUrl); await expect(page.locator('.customer-detail-card')).toBeVisible();
  for (const [name, suffix] of [['Lịch sử mua', 'purchases'], ['Lịch sử bán', 'sales']] as const) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/customers/[^/]+/${suffix}$`));
    await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await expect(page.locator('.customer-detail-card')).toBeVisible();
  }
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByRole('search')).toBeVisible();
  await page.getByRole('textbox', { name: 'Tìm khách hàng theo số điện thoại' }).fill('0900000077');
  await page.getByRole('button', { name: 'Tìm khách hàng', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Khách kiểm thử bố cục', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(create).toBeVisible(); await create.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
  await writeFile(info.outputPath(`${role}-geometry.json`), JSON.stringify(measurements, null, 2));
});
