import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { bootstrapOwner, login } from './auth-helpers';
import { inventoryData } from './inventory-helpers';

test('create bracket dialog fits desktop and small windows, closes and reopens without saving', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page); await page.goto('./#/price-brackets');
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const before = await inventoryData(page), measurements = [];
  expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 768, height: 1024 }, { width: 1024, height: 570 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
    await page.setViewportSize(viewport);
    await page.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
    await expect(form).toBeVisible(); await page.evaluate(() => document.fonts.ready);
    const geometry = await form.evaluate(dialog => {
      const box = (element: Element) => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
      const body = dialog.querySelector('.form-dialog-body')!;
      return { dialog: box(dialog), header: box(dialog.querySelector('header')!), body: box(body),
        fields: Array.from(dialog.querySelectorAll('.field-input, select')).map(box),
        buttons: Array.from(dialog.querySelectorAll('.form-actions button')).map(box),
        scroll: { dialogY: dialog.scrollHeight - dialog.clientHeight, bodyY: body.scrollHeight - body.clientHeight, bodyX: body.scrollWidth - body.clientWidth },
        pageX: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(Math.abs(geometry.dialog.x + geometry.dialog.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.dialog.y + geometry.dialog.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(2);
    expect(geometry.dialog.y).toBeGreaterThanOrEqual(12);
    expect(geometry.dialog.bottom).toBeLessThanOrEqual(viewport.height - 12);
    expect(geometry.scroll.dialogY).toBeLessThanOrEqual(1);
    expect(geometry.scroll.bodyX).toBeLessThanOrEqual(1); expect(geometry.pageX).toBe(0);
    expect(geometry.fields).toHaveLength(5);
    if (viewport.width >= 1024 && viewport.height >= 768) {
      expect(geometry.scroll.bodyY).toBeLessThanOrEqual(1);
      await expect(form.getByRole('button', { name: 'Lưu', exact: true })).toBeInViewport({ ratio: 1 });
    }
    await page.screenshot({ path: info.outputPath(`bracket-create-${viewport.width}x${viewport.height}.png`) });
    measurements.push({ viewport, ...geometry });
    await form.getByLabel('Loại hàng', { exact: true }).fill('Không lưu');
    await form.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(form).toHaveCount(0);
  }
  for (const close of ['x', 'escape']) {
    await page.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
    await expect(form.getByLabel('Loại hàng', { exact: true })).toHaveValue('');
    if (close === 'x') await form.getByRole('button', { name: 'Đóng biểu mẫu', exact: true }).click();
    else await page.keyboard.press('Escape');
    await expect(form).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tạo khung giá', exact: true })).toBeFocused();
  }
  expect(await inventoryData(page)).toEqual(before); expect(errors).toEqual([]);
  await writeFile(info.outputPath('geometry.json'), JSON.stringify(measurements, null, 2));
});

test('create bracket keeps validation and values after native write failure, then double click saves one record', async ({ page }) => {
  await bootstrapOwner(page); await login(page); await page.goto('./#/price-brackets');
  await page.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form.getByText('Độ mới không được để trống', { exact: true })).toBeVisible();
  await form.getByLabel('Loại hàng', { exact: true }).fill('Áo');
  await form.getByLabel('Thương hiệu', { exact: true }).fill('Khung giá UI');
  await form.getByLabel('Độ mới', { exact: true }).selectOption('2');
  await form.getByLabel('Giá tối thiểu (Min)', { exact: true }).fill('50000');
  await form.getByLabel('Giá tối đa (Max)', { exact: true }).fill('100000');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put, add = IDBObjectStore.prototype.add;
    const fail = () => { IDBObjectStore.prototype.put = put; IDBObjectStore.prototype.add = add; throw new DOMException('test-only bracket write failure', 'QuotaExceededError'); };
    IDBObjectStore.prototype.put = function (...args) { if (this.name === 'khungGiaThuMua') fail(); return put.apply(this, args); };
    IDBObjectStore.prototype.add = function (...args) { if (this.name === 'khungGiaThuMua') fail(); return add.apply(this, args); };
  });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Tạo khung giá không thành công');
  expect((await inventoryData(page)).khungGiaThuMua).toHaveLength(0);
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(form.getByLabel('Thương hiệu', { exact: true })).toHaveValue('Khung giá UI');
  await expect(form.getByLabel('Độ mới', { exact: true })).toHaveValue('2');
  await form.getByRole('button', { name: 'Lưu', exact: true }).dblclick();
  await expect(page.getByRole('alertdialog')).toContainText('Tạo khung giá thu mua thành công');
  await expect(form).toHaveCount(0);
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  const records = (await inventoryData(page)).khungGiaThuMua;
  expect(records).toHaveLength(1); expect(records[0]).toMatchObject({ TinhTrang: 2, GiaMin: 50000, GiaMax: 100000 });
});
