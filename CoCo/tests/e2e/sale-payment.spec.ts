import { expect, test } from '@playwright/test';
import { inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';
import { login } from './auth-helpers';
import { prepare, selectCustomer, add, fiftyPoints } from './sales-helpers';

for (const role of ['owner', 'staff'] as const) for (const method of ['cash', 'transfer'] as const) {
  test(`G8-T03/T04 ${role} ${method}: real payment, immutable totals, exact points and close all dialogs`, async ({ page, context }, info) => {
    test.setTimeout(60_000);
    const { target, products } = await prepare(page, context, role), errors: string[] = [], external: string[] = [];
    target.on('pageerror', error => errors.push(error.message));
    target.on('request', request => { const url = new URL(request.url()); if (['http:', 'https:'].includes(url.protocol) && url.hostname !== '127.0.0.1') external.push(url.href); });
    await fiftyPoints(target); await add(target, String(products[0].MaSP));
    await expect(target.getByRole('checkbox', { name: 'Dùng 50 điểm giảm 20%' })).toHaveCount(0);
    const before = await inventoryData(target);
    if (method === 'transfer') await target.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
    await target.getByRole('button', { name: 'Lưu', exact: true }).click({ clickCount: 2 });
    if (method === 'transfer') {
      const qr = target.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
      await expect(qr).toContainText('83.206');
      await expect(qr.getByRole('img')).toHaveAttribute('src', /^data:image\/png;base64,/);
      await expect(qr.getByRole('img')).toHaveAttribute('alt', /SHB, 0947800469, MAI THUY TRANG, 83206 đồng/);
      expect(await inventoryData(target)).toEqual(before);
      for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
        await target.setViewportSize(viewport);
        await expect(qr).toBeInViewport({ ratio: 1 });
        await expect(qr.getByRole('button', { name: 'Đã nhận', exact: true })).toBeInViewport({ ratio: 1 });
        const box = (await qr.boundingBox())!;
        expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(3);
        expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(3);
        await target.screenshot({ path: info.outputPath(`${role}-qr-${viewport.width}x${viewport.height}.png`) });
      }
      await qr.getByRole('button', { name: 'Quay lại', exact: true }).click();
      expect(await inventoryData(target)).toEqual(before);
      await target.getByRole('button', { name: 'Lưu', exact: true }).click();
      await expect(qr.getByRole('img')).toBeVisible();
      await target.keyboard.press('Escape');
      expect(await inventoryData(target)).toEqual(before);
      await target.getByRole('button', { name: 'Lưu', exact: true }).click();
      await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click({ clickCount: 2 });
    }
    await expect(target.getByRole('alertdialog', { name: 'Thanh toán thành công!', exact: true })).toBeVisible();
    const paid = await inventoryData(target);
    expect(paid.hoaDonBanHang).toHaveLength(1); expect(paid.chiTietHoaDonBH).toHaveLength(1);
    expect(paid.hoaDonBanHang[0]).toMatchObject({ TongTien: 83206, TienKhuyenMai: 20801, TichDiem: 8, TrangThai: 1, PTTT: method === 'cash' ? 1 : 2 });
    expect(paid.khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(8);
    expect(paid.sanPham.find(row => row.MaSP === products[0].MaSP)?.TrangThai).toBe(2);
    await target.screenshot({ path: info.outputPath(`${role}-${method}-success.png`) });
    await closeNotice(target, 'Thanh toán thành công!');
    await expect(target.getByRole('dialog')).toHaveCount(0);
    await expect(target).toHaveURL(/#\/sales$/);
    await expect(target.getByRole('link', { name: String(paid.hoaDonBanHang[0].MaHDBH), exact: true })).toBeVisible();
    expect(await inventoryData(target)).toEqual(paid);
    await target.reload(); expect(await inventoryData(target)).toEqual(paid);
    await target.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
    expect(errors).toEqual([]); expect(external).toEqual([]);
  });
}

for (const store of ['appMetadata', 'auditEntries']) test(`G8-T04 native ${store} failure rolls back and allows one retry`, async ({ page, context }) => {
  const { products } = await prepare(page, context);
  await add(page, String(products[0].MaSP));
  await page.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const qr = page.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
  await expect(qr.getByRole('img')).toBeVisible(); const before = await inventoryData(page);
  await page.evaluate(target => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === target) { IDBObjectStore.prototype.add = original; throw new DOMException('Lỗi kết nối', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  }, store);
  await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Lỗi kết nối');
  expect(await inventoryData(page)).toEqual(before);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(qr).toBeVisible();
  await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
  await closeNotice(page, 'Thanh toán thành công!');
  const after = await inventoryData(page);
  expect(after.hoaDonBanHang).toHaveLength(1); expect(after.chiTietHoaDonBH).toHaveLength(1);
  expect(after.khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(0);
});

test('G8-T04 two real tabs cannot sell the same product twice and stale QR remains recoverable', async ({ page, context }) => {
  const { products } = await prepare(page, context); await add(page, String(products[0].MaSP));
  await page.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const qr = page.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
  await expect(qr.getByRole('img')).toBeVisible();
  const other = await context.newPage(); await other.goto('./'); await login(other);
  await other.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await other.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await selectCustomer(other); await add(other, String(products[0].MaSP));
  await other.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(other, 'Thanh toán thành công!');
  const paid = await inventoryData(other);
  await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).not.toContainText('Thanh toán thành công!');
  await expect(page.getByRole('alertdialog')).toContainText('đã thay đổi trạng thái hoặc giá');
  expect(await inventoryData(page)).toEqual(paid);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await qr.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('G8-T04 point overflow leaves the real cart recoverable and cannot create a sale', async ({ page, context }) => {
  const { products } = await prepare(page, context), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await fiftyPoints(page, 2_147_483_647);
  await page.evaluate(productId => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB');
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('sanPham', 'readwrite'), store = tx.objectStore('sanPham');
      const get = store.get(productId); get.onsuccess = () => store.put({ ...get.result, GiaBanHienHanh: 1000000 });
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    }; request.onerror = () => reject(request.error);
  }), String(products[0].MaSP));
  await add(page, String(products[0].MaSP));
  await expect(page.getByRole('alert')).toContainText('Điểm tích lũy vượt quá giới hạn');
  await expect(page.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled();
  expect((await inventoryData(page)).hoaDonBanHang).toHaveLength(0);
  await page.getByRole('button', { name: `Xóa sản phẩm ${products[0].MaSP}`, exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Phiếu bán hàng', exact: true })).toBeVisible();
  expect((await inventoryData(page)).khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(2_147_483_647);
  expect(errors).toEqual([]);
});
