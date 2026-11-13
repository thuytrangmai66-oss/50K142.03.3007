import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import { prepare, selectCustomer, add, fiftyPoints } from './sales-helpers';
import { inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';

function watchErrors(context: BrowserContext) {
  const errors: string[] = [];
  const observe = (page: Page) => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  context.pages().forEach(observe); context.on('page', observe);
  return errors;
}

async function openTransfer(page: Page) {
  await page.getByRole('radio', { name: 'Chuyển khoản', exact: true }).click();
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const qr = page.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true });
  await expect(qr.getByRole('img')).toBeVisible();
  return qr;
}

for (const role of ['owner', 'staff'] as const) {
  test(`T06 ${role}: reload after native payment failure preserves cart and retries exactly once`, async ({ page, context }, info) => {
    test.setTimeout(90_000);
    const errors = watchErrors(context);
    const { target, products } = await prepare(page, context, role);
    await fiftyPoints(target); await add(target, String(products[0].MaSP));
    const editorUrl = target.url(), qr = await openTransfer(target);
    const abandonedId = (await qr.locator('.transfer-qr > p').innerText()).split(' - ')[0];
    const before = await inventoryData(target);
    await target.evaluate(() => {
      const original = IDBObjectStore.prototype.add;
      IDBObjectStore.prototype.add = function (...args) {
        if (this.name === 'auditEntries') throw new DOMException('T06 reload recovery fault', 'QuotaExceededError');
        return original.apply(this, args);
      };
    });
    await qr.getByRole('button', { name: 'Đã nhận', exact: true }).click();
    await expect(target.getByRole('alertdialog')).toContainText('T06 reload recovery fault');
    expect(await inventoryData(target)).toEqual(before);
    await target.reload();
    await expect(target).toHaveURL(editorUrl);
    await expect(target.locator('.purchase-lines tbody tr')).toHaveCount(1);
    await selectCustomer(target);
    await expect(target.locator('.sales-membership-status')).toContainText('Điểm: 50');
    const retry = await openTransfer(target);
    const retryId = (await retry.locator('.transfer-qr > p').innerText()).split(' - ')[0];
    expect(retryId).not.toBe(abandonedId);
    expect(await inventoryData(target)).toEqual(before);
    await retry.getByRole('button', { name: 'Đã nhận', exact: true }).dblclick();
    await expect(target.getByRole('alertdialog')).toContainText('Thanh toán thành công!');
    await target.screenshot({ path: info.outputPath(`${role}-retry-after-reload.png`) });
    await closeNotice(target, 'Thanh toán thành công!');
    const paid = await inventoryData(target);
    expect(paid.hoaDonBanHang).toHaveLength(1);
    expect(paid.hoaDonBanHang[0]).toMatchObject({ MaHDBH: retryId, TongTien: 83206, TichDiem: 8 });
    expect(paid.chiTietHoaDonBH).toHaveLength(1);
    expect(paid.khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(8);
    expect(paid.sanPham.find(row => row.MaSP === products[0].MaSP)?.TrangThai).toBe(2);
    expect(paid.operations.filter(row => String(row.id).startsWith('sale-finalize:'))).toHaveLength(1);
    expect(paid.auditEntries.filter(row => String(row.id).startsWith('sale-finalize:'))).toHaveLength(1);
    expect(paid.appMetadata.filter(row => String(row.key).startsWith('sales-invoice:'))).toHaveLength(1);
    await target.reload();
    await expect(target.getByRole('link', { name: retryId, exact: true })).toBeVisible();
    expect(await inventoryData(target)).toEqual(paid);
    expect(errors).toEqual([]);
  });
}

test('T06 owner and staff confirming the same product concurrently commit one invoice and one point update', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const errors = watchErrors(context);
  const { target: staff, products } = await prepare(page, context, 'staff');
  await fiftyPoints(staff); await add(staff, String(products[0].MaSP));
  const staffQr = await openTransfer(staff);
  await page.getByRole('link', { name: 'Bán hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await selectCustomer(page); await add(page, String(products[0].MaSP));
  const ownerQr = await openTransfer(page);
  await Promise.all([
    ownerQr.getByRole('button', { name: 'Đã nhận', exact: true }).click(),
    staffQr.getByRole('button', { name: 'Đã nhận', exact: true }).click(),
  ]);
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(staff.getByRole('alertdialog')).toBeVisible();
  const ownerWon = (await page.getByRole('alertdialog').innerText()).includes('Thanh toán thành công!');
  const winner = ownerWon ? page : staff, loser = ownerWon ? staff : page;
  await expect(winner.getByRole('alertdialog')).toContainText('Thanh toán thành công!');
  await expect(loser.getByRole('alertdialog')).toContainText('đã thay đổi');
  await loser.screenshot({ path: info.outputPath('cross-role-stock-conflict.png') });
  const paid = await inventoryData(page);
  expect(paid.hoaDonBanHang).toHaveLength(1); expect(paid.chiTietHoaDonBH).toHaveLength(1);
  expect(paid.hoaDonBanHang[0]).toMatchObject({ TongTien: 83206, TienKhuyenMai: 20801, TichDiem: 8 });
  expect(paid.khachHang.find(row => row.SoDienThoaiKH === '0900000081')?.DiemTichLuy).toBe(8);
  expect(paid.operations.filter(row => String(row.id).startsWith('sale-finalize:'))).toHaveLength(1);
  const staffId = paid.taiKhoan.find(row => row.TenDangNhap === 'staffsale')!.MaNV;
  expect(paid.hoaDonBanHang[0].MaNV === staffId).toBe(!ownerWon);
  await closeNotice(winner, 'Thanh toán thành công!');
  await loser.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await loser.getByRole('dialog', { name: 'Thanh toán chuyển khoản', exact: true }).getByRole('button', { name: 'Quay lại', exact: true }).click();
  await expect(page.locator(':modal')).toHaveCount(0); await expect(staff.locator(':modal')).toHaveCount(0);
  expect(await inventoryData(staff)).toEqual(paid);
  await page.reload(); await staff.reload();
  await expect(page.locator('.sidebar-footer p')).toHaveText('Chủ cửa hàng');
  await expect(staff.locator('.sidebar-footer p')).toHaveText('Nhân viên');
  expect(await inventoryData(page)).toEqual(paid);
  expect(errors).toEqual([]);
});
