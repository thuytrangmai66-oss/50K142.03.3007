import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { bootstrapOwner, addStaffFixture, login } from './auth-helpers';

for (const role of ['owner', 'staff'] as const) test(`${role}: Figma sidebar separates expanded and active submenu without changing navigation`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page);
  if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
  const sidebar = page.locator('.sidebar');
  const parent = page.getByRole('link', { name: 'Hàng hóa', exact: true });
  const submenu = page.getByRole('link', { name: 'Xử lý hàng tồn lâu', exact: true });
  await parent.click();
  await expect(page.getByRole('form', { name: 'Tìm kiếm hàng hóa', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(parent).toHaveCSS('font-weight', '700');
  await expect(parent).toHaveCSS('background-color', 'rgb(232, 221, 206)');
  await expect(submenu).toHaveCSS('font-family', '"Be Vietnam Pro", sans-serif');
  await expect(submenu).toHaveCSS('font-size', '20px');
  await expect(submenu).toHaveCSS('font-weight', '400');
  await expect(submenu).toHaveCSS('color', 'rgb(255, 255, 255)');
  const expanded = await submenu.locator('span').last().boundingBox();
  await sidebar.screenshot({ path: info.outputPath(`${role}-expanded.png`) });
  await submenu.hover();
  await expect(submenu).toHaveCSS('font-weight', '400');
  const hovered = await submenu.locator('span').last().boundingBox();
  expect(hovered!.x).toBe(expanded!.x);
  await sidebar.screenshot({ path: info.outputPath(`${role}-hover.png`) });
  await submenu.click();
  await expect(page).toHaveURL(/#\/inventory\/discounts$/);
  await expect(page.locator('.discount-monitor')).toBeVisible();
  await expect(parent).toHaveCSS('font-weight', '700');
  await expect(submenu).toHaveCSS('font-weight', '700');
  await expect(submenu).toHaveCSS('color', 'rgb(232, 221, 206)');
  await expect(submenu).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const active = await submenu.locator('span').last().boundingBox();
  expect(active!.x).toBe(expanded!.x);
  await sidebar.screenshot({ path: info.outputPath(`${role}-active.png`) });
  const geometry = await page.evaluate(() => {
    const aside = document.querySelector('.sidebar')!.getBoundingClientRect();
    const links = Array.from(document.querySelectorAll('.sidebar nav > a:not(.inventory-submenu)')).map(a => {
      const icon = a.querySelector('.sidebar-icon')!.getBoundingClientRect(), text = a.lastElementChild!.getBoundingClientRect();
      return { textX: text.x - aside.x, iconWidth: icon.width, iconHeight: icon.height };
    });
    return { width: aside.width, height: aside.height, links, submenuX: document.querySelector('.inventory-submenu')!.lastElementChild!.getBoundingClientRect().x - aside.x };
  });
  expect(geometry.width).toBe(397);
  expect(geometry.height).toBe(868);
  for (const link of geometry.links) { expect(Math.abs(link.textX - 134)).toBeLessThanOrEqual(2); expect(link.iconWidth).toBe(34); expect(link.iconHeight).toBe(34); }
  expect(Math.abs(geometry.submenuX - 132)).toBeLessThanOrEqual(2);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 1280, height: 650 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeInViewport({ ratio: 1 });
    expect(await submenu.locator('span').last().evaluate(e => { const range = document.createRange(); range.selectNodeContents(e); return range.getClientRects().length; })).toBe(1);
    expect(await sidebar.evaluate(e => e.scrollHeight - e.clientHeight)).toBeLessThanOrEqual(1);
    for (const img of await sidebar.locator('img').all()) expect(await img.evaluate(e => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await sidebar.screenshot({ path: info.outputPath(`${role}-active-${viewport.width}x${viewport.height}.png`) });
  }
  const allowed = [['Trang chủ', ''], ['Thu mua', 'purchases'], ['Bán hàng', 'sales'], ['Hàng hóa', 'inventory'], ['Khách hàng', 'customers']];
  if (role === 'owner') allowed.push(['Báo cáo', 'reports'], ['Phê duyệt', 'approvals'], ['Nhân viên', 'staff'], ['Khung giá thu mua', 'price-brackets']);
  else for (const name of ['Báo cáo', 'Phê duyệt', 'Nhân viên', 'Khung giá thu mua']) await expect(page.getByRole('link', { name, exact: true })).toHaveCount(0);
  for (const [name, route] of allowed) { await page.getByRole('link', { name, exact: true }).click(); await expect(page).toHaveURL(new RegExp('#/' + route + '$')); }
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await expect(submenu).toHaveCount(0); // Existing route-driven collapse is preserved.
  await expect(sidebar.locator('.sidebar-footer p')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBeNull();
  expect(errors).toEqual([]);
  await writeFile(info.outputPath('sidebar-geometry.json'), JSON.stringify(geometry, null, 2));
});
