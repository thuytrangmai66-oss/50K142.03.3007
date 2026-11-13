import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { login, addStaffFixture } from './auth-helpers';
import { closeNotice } from './purchase-helpers';
import { createInventoryThroughUI, inventoryData, openInventoryEditor } from './inventory-helpers';

const initial = '2026-01-01T10:00:00+07:00';
async function openAt(context: BrowserContext, time: string, failure = false) {
  const page = await context.newPage(); await page.clock.setFixedTime(new Date(time));
  if (failure) await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) { if (this.name === 'discountApplications') throw new DOMException('G7 scheduled write failure', 'QuotaExceededError'); return add.apply(this, args); };
  });
  await page.goto('./'); return page;
}
async function waitApplications(page: Page, count: number) { await expect.poll(async () => (await inventoryData(page)).discountApplications.length).toBe(count); }

test('G7 automatic delayed reopening and two native tabs apply 45 first, including below-20000, and both roles read real monitor logs', async ({ page, context }, info) => {
  test.setTimeout(60000);
  await page.clock.setFixedTime(new Date(initial)); await createInventoryThroughUI(page); await addStaffFixture(page);
  const id = String((await inventoryData(page)).sanPham[0].MaSP), form = await openInventoryEditor(page, id);
  await form.getByLabel('Giá bán hiện tại (đồng)', { exact: true }).fill('10000'); await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await closeNotice(page, 'Cập nhật thành công!');
  await page.close(); // No page executes while the web app is closed.
  const date = '2026-03-02T12:34:56+07:00';
  const [owner, staff] = await Promise.all([openAt(context, date), openAt(context, date)]);
  await waitApplications(owner, 2);
  const after = await inventoryData(owner);
  expect(after.discountApplications.map(r => r.milestone)).toEqual([45, 45]);
  expect(after.sanPham.map(r => r.GiaBanHienHanh)).toEqual([20000, 20000]);
  expect(after.discountApplications.find(r => r.MaSP === id)).toMatchObject({ priceBefore: 10000, priceAfter: 20000, scheduledFor: '2026-02-15', executedAt: '2026-03-02T05:34:56.000Z' });
  const runs = after.appMetadata.filter(r => String(r.key).startsWith('discount-run:')).map(r => JSON.parse(String(r.value)));
  expect(runs.filter(r => r.executedAt === '2026-03-02T05:34:56.000Z')).toHaveLength(1);
  await login(owner); await login(staff, 'staff', 'staff-test!');
  for (const [role, reader] of [['owner', owner], ['staff', staff]] as const) {
    await reader.goto('./#/inventory/discounts');
    await expect(reader.getByRole('heading', { name: 'Nhật ký thay đổi giá tự động', exact: true })).toBeVisible();
    await expect(reader.locator('.discount-history').last().locator('tbody tr')).toHaveCount(2);
    await expect(reader.getByRole('button', { name: /Chạy|Kích hoạt/ })).toHaveCount(0);
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      await reader.setViewportSize(viewport); await reader.screenshot({ path: info.outputPath(`${role}-monitor-${viewport.width}.png`), fullPage: true });
    }
  }
  const stable = await inventoryData(owner); await owner.reload(); await expect(owner.locator('.discount-history').last().locator('tbody tr')).toHaveCount(2);
  expect(await inventoryData(owner)).toEqual(stable);
});

test('G7 native scheduled write failure rolls back price/event/version, logs failure and recovers on another opening without duplicates', async ({ page, context }, info) => {
  await page.clock.setFixedTime(new Date(initial)); await createInventoryThroughUI(page); const before = await inventoryData(page); await page.close();
  const date = '2026-02-01T12:00:00+07:00', failed = await openAt(context, date, true);
  await expect.poll(async () => (await inventoryData(failed)).appMetadata.filter(r => String(r.key).startsWith('discount-run:')).map(r => JSON.parse(String(r.value))).some(r => r.status === 'error')).toBe(true);
  const broken = await inventoryData(failed); expect(broken.sanPham).toEqual(before.sanPham); expect(broken.discountApplications).toHaveLength(0);
  await login(failed); await failed.goto('./#/inventory/discounts');
  await expect(failed.locator('.discount-history').first()).toContainText('Thất bại');
  await failed.screenshot({ path: info.outputPath('monitor-native-failure.png'), fullPage: true }); await failed.close();
  const recovered = await openAt(context, date); await waitApplications(recovered, 2);
  expect((await inventoryData(recovered)).sanPham.map(r => r.GiaBanHienHanh)).toEqual([72805, 72805]);
  expect((await inventoryData(recovered)).discountApplications.every(r => r.milestone === 30 && r.scheduledFor === '2026-01-31' && r.executedAt === '2026-02-01T05:00:00.000Z')).toBe(true);
  await recovered.reload(); await waitApplications(recovered, 2);
});

test('G7 open app runs at Vietnam midnight with no manual trigger', async ({ page }) => {
  test.setTimeout(60000);
  await page.clock.install({ time: new Date(initial) }); await createInventoryThroughUI(page);
  await page.clock.pauseAt(new Date('2026-01-30T23:59:59+07:00'));
  await expect.poll(async () => (await inventoryData(page)).appMetadata.some(r => r.key === 'discount-day:2026-01-30')).toBe(true);
  expect((await inventoryData(page)).discountApplications).toHaveLength(0);
  await page.clock.runFor(1100); await waitApplications(page, 2);
  expect((await inventoryData(page)).discountApplications.every(r => r.milestone === 30 && String(r.executedAt).startsWith('2026-01-30T17:00:00'))).toBe(true);
});
