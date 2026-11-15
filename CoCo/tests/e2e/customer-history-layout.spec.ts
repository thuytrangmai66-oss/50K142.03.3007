import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { addStaffFixture, bootstrapOwner, login } from './auth-helpers';
import { inventoryData } from './inventory-helpers';
import { createCustomerForEmptyHistory } from './empty-state-helpers';

for (const role of ['owner', 'staff'] as const) test(`${role}: customer toolbar belongs only to the list, histories align and direct reload preserves the customer`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  const detail = await createCustomerForEmptyHistory(page), before = await inventoryData(page), measurements = [];
  const noToolbar = async () => {
    await expect(page.locator('.reference-toolbar')).toHaveCount(0);
    await expect(page.getByRole('search')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tạo tài khoản', exact: true })).toHaveCount(0);
  };
  await noToolbar();
  expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const frames = [];
    for (const [label, kind] of [['Lịch sử mua', 'purchases'], ['Lịch sử bán', 'sales']] as const) {
      await page.goto(detail); await expect(page.locator('.customer-detail-card')).toBeVisible();
      const reference = await page.locator('.customer-detail > .back-link').evaluate(back => ({
        font: getComputedStyle(back).font, gap: getComputedStyle(back).gap,
        icon: back.querySelector('svg')!.getBoundingClientRect().width,
      }));
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(`${detail}/${kind}`);
      await expect(page.locator('.history-card')).toBeVisible(); await page.evaluate(() => document.fonts.ready);
      await noToolbar();
      await expect(page.locator('.page-header')).toContainText(`Khách hàng / ${label}`);
      await expect(page.locator('.customer-summary')).toContainText('Khách kiểm tra lịch sử');
      await expect(page.locator('.customer-summary')).toContainText('0900000088');
      await expect(page.locator('thead th')).toHaveText(['Mã giao dịch', 'Thời gian', 'Trạng thái']);
      const layout = await page.evaluate(() => {
        const box = (selector: string) => { const r = document.querySelector(selector)!.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, bottom: r.bottom + scrollY }; };
        const back = document.querySelector('.customer-history > .back-link')!, css = getComputedStyle(back);
        return { header: box('.page-header'), back: box('.customer-history > .back-link'), card: box('.history-card'), summary: box('.customer-summary'), table: box('.data-table-scroll'),
          font: css.font, gap: css.gap, icon: back.querySelector('svg')!.getBoundingClientRect().width,
          pageX: document.documentElement.scrollWidth - innerWidth, scrollTop: document.querySelector('#main-content')!.scrollTop };
      });
      expect(layout.font).toBe(reference.font); expect(layout.gap).toBe(reference.gap); expect(layout.icon).toBe(reference.icon);
      expect(Math.abs(layout.back.y - layout.header.bottom - (viewport.width > 1400 ? 24 : 16))).toBeLessThanOrEqual(2);
      expect(Math.abs(layout.card.y - layout.back.bottom - (viewport.width > 1400 ? 24 : 16))).toBeLessThanOrEqual(2);
      expect(layout.back.x).toBe(layout.card.x); expect(layout.summary.x).toBe(layout.card.x); expect(layout.table.x).toBe(layout.card.x);
      expect(layout.table.width).toBe(layout.card.width); expect(layout.pageX).toBe(0); expect(layout.scrollTop).toBe(0);
      frames.push({ header: layout.header, back: layout.back, card: layout.card, summary: layout.summary, table: layout.table });
      measurements.push({ viewport, kind, ...layout });
      await page.screenshot({ path: info.outputPath(`${role}-${kind}-${viewport.width}x${viewport.height}.png`), fullPage: viewport.width < 761 });
      if (viewport.width === 1440) {
        await page.reload(); await expect(page.locator('.history-card')).toBeVisible();
        await noToolbar(); await expect(page.locator('.customer-summary')).toContainText('0900000088');
        await expect(page).toHaveURL(`${detail}/${kind}`);
      }
      await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
      await expect(page).toHaveURL(detail); await expect(page.locator('.customer-detail-card')).toBeVisible();
      await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách kiểm tra lịch sử');
      await noToolbar();
    }
    expect(frames[1]).toEqual(frames[0]);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload(); await expect(page.locator('.customer-detail-card')).toBeVisible(); await noToolbar();
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByRole('search')).toBeVisible();
  await page.getByLabel('Tìm khách hàng theo số điện thoại').fill('0900000088');
  await page.getByRole('button', { name: 'Tìm khách hàng', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Khách kiểm tra lịch sử', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true }).getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
  await writeFile(info.outputPath(`${role}-history-geometry.json`), JSON.stringify(measurements, null, 2));
});
