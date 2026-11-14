import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { bootstrapOwner, addStaffFixture, login } from './auth-helpers';

for (const role of ['owner', 'staff'] as const) test(`${role}: dashboard fits desktop, keeps allowed navigation and reachable logout`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page);
  if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await expect(page.locator('.home-kpi')).toHaveCount(4);
  await expect(page.locator('.account-name')).toHaveText(role === 'owner' ? 'Chủ kiểm thử' : 'Nhân viên kiểm thử');
  await expect(page.locator('.sidebar-footer p')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Phê duyệt', exact: true })).toHaveCount(role === 'owner' ? 1 : 0);
  await expect(page.getByRole('link', { name: 'Nhân viên', exact: true })).toHaveCount(role === 'owner' ? 1 : 0);
  const measurements = [];
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 650 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeInViewport({ ratio: 1 });
    const geometry = await page.evaluate(() => {
      const box = (s: string) => { const r = document.querySelector(s)!.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      const overflow = (s: string) => { const e = document.querySelector(s)!; return { x: e.scrollWidth - e.clientWidth, y: e.scrollHeight - e.clientHeight }; };
      return { sidebar: box('.sidebar'), header: box('.page-header'), kpis: box('.home-kpis'),
        cards: Array.from(document.querySelectorAll('.home-kpi')).map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, overflow: e.scrollHeight - e.clientHeight }; }),
        sidebarOverflow: overflow('.sidebar'), mainOverflow: overflow('#main-content'), pageX: document.documentElement.scrollWidth - innerWidth,
        footerPosition: getComputedStyle(document.querySelector('.sidebar-footer')!).position,
      };
    });
    expect(geometry.footerPosition).toBe('static');
    expect(geometry.sidebarOverflow.y).toBeLessThanOrEqual(1);
    expect(geometry.mainOverflow.y).toBeLessThanOrEqual(1);
    expect(geometry.pageX).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.header.x - geometry.kpis.x)).toBeLessThanOrEqual(2);
    expect(geometry.cards[0].y).toBe(geometry.cards[1].y);
    expect(geometry.cards[2].y).toBe(geometry.cards[3].y);
    for (const card of geometry.cards) expect(card.overflow).toBeLessThanOrEqual(1);
    for (const card of await page.locator('.home-kpi').all()) await expect(card).toBeInViewport({ ratio: 1 });
    for (const action of await page.locator('.home-quick-actions a').all()) await expect(action).toBeInViewport({ ratio: 1 });
    measurements.push({ viewport, geometry });
    await page.screenshot({ path: info.outputPath(`${role}-home-after-${viewport.width}x${viewport.height}.png`) });
  }
  // At narrow desktop widths, keep readable cards and allow the main region to scroll.
  await page.setViewportSize({ width: 800, height: 900 });
  for (const card of await page.locator('.home-kpi').all()) {
    expect(await card.evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  for (const action of await page.locator('.home-quick-actions a').all()) {
    await action.scrollIntoViewIfNeeded(); await expect(action).toBeInViewport({ ratio: 1 });
  }
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeInViewport({ ratio: 1 });
  await page.setViewportSize({ width: 1280, height: 650 });
  // Inventory adds a submenu; the shared footer must remain reachable there too.
  await page.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Xử lý hàng tồn lâu', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBeNull();
  expect(errors).toEqual([]);
  await writeFile(info.outputPath('dashboard-layout.json'), JSON.stringify(measurements, null, 2));
});
