import { expect, test, type Page } from '@playwright/test';
import { prepare, add } from './sales-helpers';
import { inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';

for (const role of ['owner', 'staff'] as const) {
  test(`T05 ${role}: invoice and customer purchase-history read errors use Figma notices and recover without writes`, async ({ page, context }, info) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    const observe = (target: Page) => {
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    };
    context.pages().forEach(observe); context.on('page', observe);
    const { target, products } = await prepare(page, context, role);
    await add(target, String(products[0].MaSP));
    await target.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(target, 'Thanh toán thành công!');
    const before = await inventoryData(target), invoice = before.hoaDonBanHang[0];
    const id = String(invoice.MaHDBH), customerId = String(invoice.MaKH);

    // Fail only the native invoice lookup; list reads still work.
    await target.evaluate(() => {
      const get = IDBObjectStore.prototype.get;
      IDBObjectStore.prototype.get = function (...args) {
        if (this.name === 'hoaDonBanHang') throw new DOMException('T05 invoice read failure', 'UnknownError');
        return get.apply(this, args);
      };
      Object.assign(window, { restoreT05Read: () => { IDBObjectStore.prototype.get = get; } });
    });
    await target.getByRole('link', { name: id, exact: true }).click();
    await expect(target.getByRole('alertdialog')).toContainText('Không thể tải thông tin giao dịch. Vui lòng thử lại');
    await expect(target.locator('.sale-invoice')).toHaveCount(0);
    await closeNotice(target, 'Không thể tải thông tin giao dịch. Vui lòng thử lại');
    await expect(target).toHaveURL(/#\/sales$/);
    await expect(target.locator(':modal')).toHaveCount(0);
    await target.evaluate(() => (window as unknown as { restoreT05Read(): void }).restoreT05Read());
    await target.getByRole('link', { name: id, exact: true }).click();
    await expect(target.getByRole('heading', { name: `Chi tiết hóa đơn ${id}`, exact: true })).toBeVisible();

    await target.goto(`./#/customers/${customerId}`);
    await expect(target.getByRole('link', { name: 'Lịch sử mua', exact: true })).toBeVisible();
    await target.evaluate(() => {
      const getAll = IDBIndex.prototype.getAll;
      IDBIndex.prototype.getAll = function (...args) {
        if (this.objectStore.name === 'hoaDonBanHang') throw new DOMException('T05 history read failure', 'UnknownError');
        return getAll.apply(this, args);
      };
      Object.assign(window, { restoreT05Read: () => { IDBIndex.prototype.getAll = getAll; } });
    });
    await target.getByRole('link', { name: 'Lịch sử mua', exact: true }).click();
    await expect(target.getByRole('alertdialog')).toContainText('Lỗi không thể truy xuất');
    await expect(target.locator('.history-card')).toContainText('Khách G7');
    await expect(target.locator('.history-card')).not.toContainText('Không tìm thấy lịch sử mua');
    await expect(target.locator('.history-card tbody tr')).toHaveCount(0);
    const toolbar = (await target.locator('.reference-toolbar').boundingBox())!;
    const header = (await target.locator('.page-header').boundingBox())!;
    expect(toolbar.y).toBeGreaterThanOrEqual(header.y + header.height);
    const card = (await target.locator('.history-card').boundingBox())!;
    expect(card.y + card.height).toBeGreaterThan(target.viewportSize()!.height * .85);
    await target.screenshot({ path: info.outputPath(`${role}-history-read-error.png`) });
    await closeNotice(target, 'Lỗi không thể truy xuất');
    await expect(target.locator(':modal')).toHaveCount(0);
    await target.evaluate(() => (window as unknown as { restoreT05Read(): void }).restoreT05Read());
    await target.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await target.getByRole('link', { name: 'Lịch sử mua', exact: true }).click();
    await target.getByRole('link', { name: id, exact: true }).click();
    await expect(target.getByRole('heading', { name: `Chi tiết hóa đơn ${id}`, exact: true })).toBeVisible();

    // The same invoice lookup failure through customer history must return there.
    await target.getByRole('link', { name: 'Quay lại', exact: true }).click();
    await target.evaluate(() => {
      const get = IDBObjectStore.prototype.get;
      IDBObjectStore.prototype.get = function (...args) {
        if (this.name === 'hoaDonBanHang') throw new DOMException('T05 history invoice read failure', 'UnknownError');
        return get.apply(this, args);
      };
      Object.assign(window, { restoreT05Read: () => { IDBObjectStore.prototype.get = get; } });
    });
    await target.getByRole('link', { name: id, exact: true }).click();
    await closeNotice(target, 'Không thể tải thông tin giao dịch. Vui lòng thử lại');
    await expect(target).toHaveURL(new RegExp(`#/customers/${customerId}/purchases$`));
    await target.evaluate(() => (window as unknown as { restoreT05Read(): void }).restoreT05Read());
    await expect(target.getByRole('link', { name: id, exact: true })).toBeVisible();
    expect(await inventoryData(target)).toEqual(before);
    expect(errors).toEqual([]);
  });
}
