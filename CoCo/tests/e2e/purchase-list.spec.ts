import { expect, test } from '@playwright/test';
import { addStaffFixture, bootstrapOwner, login } from './auth-helpers';

for (const role of ['owner', 'staff'] as const) test(`${role}: Thu mua opens list, filters and pages real legacy data, then explicitly opens creation`, async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchases$/);
  await expect(page.locator('.page-header')).toContainText('Thu mua');
  await expect(page.locator('.page-header')).not.toContainText('Tạo giao dịch');
  await expect(page.getByText('Chưa có giao dịch thu mua', { exact: true })).toBeVisible();
  expect(await page.locator('.purchase-list tbody td').first().evaluate(el => getComputedStyle(el).borderBottomWidth)).toBe('0px');
  await expect(page.getByRole('heading', { name: 'Thông tin giao dịch', exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath(`${role}-empty.png`), fullPage: false });
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await expect(page).toHaveURL(/#\/purchases\/new$/);
  await expect(page.getByRole('heading', { name: 'Thông tin giao dịch', exact: true })).toBeVisible();
  await page.locator('.purchase-payment').getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByText('Chưa có giao dịch thu mua', { exact: true })).toBeVisible();
  // Historical G2 fixtures only, in this isolated browser profile. No runtime seed.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction(['taiKhoan', 'khachHang', 'hoaDonThuMua', 'chiTietHoaDonTM', 'khungGiaThuMua', 'recordVersions'], 'readwrite');
      const account = tx.objectStore('taiKhoan').get('owner');
      account.onsuccess = () => {
        tx.objectStore('khachHang').add({ MaKH: 'KHOLD', TenKH: 'Khách lịch sử', SoDienThoaiKH: '0900000042', DiemTichLuy: 0 });
        tx.objectStore('recordVersions').add({ key: JSON.stringify(['khachHang', 'KHOLD']), version: 1, updatedAt: '2026-11-10T18:00:00Z' });
        tx.objectStore('khungGiaThuMua').add({ MaKhungGia: 'KGOLD', LoaiSanPham: 'Áo', ThuongHieu: 'Nhãn cũ', TinhTrang: 90, GiaMin: 50000, GiaMax: 100000, MaNV: account.result.MaNV });
        for (let i = 1; i <= 25; i++) {
          const MaHDTM = `TM${String(i).padStart(2, '0')}`;
          tx.objectStore('hoaDonThuMua').add({ MaHDTM, MaKH: 'KHOLD', MaNV: account.result.MaNV, NgayThuMua: '2026-11-10T18:00:00Z', TongTienTM: 80000, TrangThai: 90 });
          tx.objectStore('chiTietHoaDonTM').add({ MaHDTM, MaKhungGia: 'KGOLD', SoLuong: 1, DonGia: 80000, ThanhTien: 80000 });
        }
      };
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
  // Native fixture writes bypass Dexie's mutation notifications. Reload only
  // after fixture installation; live updates are checked through real UI below.
  await page.reload();
  await expect(page.getByRole('link', { name: 'TM01', exact: true })).toBeVisible();
  expect(await page.locator('.purchase-list tbody td').first().evaluate(el => getComputedStyle(el).borderBottomWidth)).toBe('1px');
  const cells = page.locator('.purchase-list tbody td:first-child');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport); await page.evaluate(() => document.fonts.ready);
    await page.getByRole('button', { name: 'Trang 1', exact: true }).click();
    await expect(cells.first()).toHaveText('TM01');
    await expect(page.locator('.purchase-list .pagination')).toBeInViewport({ ratio: 1 });
    const capacity = Number(await page.locator('.purchase-list').getAttribute('data-page-size'));
    const seen: string[] = [];
    for (let current = 1; current <= Math.ceil(25 / capacity); current++) {
      await page.getByRole('button', { name: `Trang ${current}`, exact: true }).click();
      const expected = Array.from({ length: Math.min(capacity, 25 - (current - 1) * capacity) }, (_, i) => `TM${String((current - 1) * capacity + i + 1).padStart(2, '0')}`);
      await expect(cells).toHaveText(expected); seen.push(...await cells.allTextContents());
      await expect(page.locator('.purchase-list tbody tr').last()).toBeInViewport({ ratio: 1 });
      expect(await page.locator('.purchase-list .data-table-scroll').evaluate(el => el.scrollHeight > el.clientHeight + 1)).toBe(false);
    }
    expect(new Set(seen).size).toBe(25);
    await page.getByRole('button', { name: 'Trang 1', exact: true }).click();
    await expect(cells.first()).toHaveText('TM01');
    await expect(page.locator('.purchase-list .pagination')).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath(`${role}-${viewport.width}x${viewport.height}.png`), fullPage: false });
  }
  await page.getByLabel('Mã giao dịch', { exact: true }).fill('TM01');
  await page.getByLabel('Số điện thoại', { exact: true }).fill('0042');
  await page.getByLabel('Tên khách hàng', { exact: true }).fill('LỊCH SỬ');
  await page.getByLabel('Thời gian', { exact: true }).fill('2026-11-11');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click(); await expect(cells).toHaveText(['TM01']);
  await page.getByLabel('Thời gian', { exact: true }).fill('2026-11-10'); await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page.getByText('Không tìm thấy giao dịch thu mua', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click(); await expect(cells.first()).toHaveText('TM01');
  await expect(page.getByLabel('Mã giao dịch', { exact: true })).toHaveValue('');
  const other = await page.context().newPage(); await other.goto('./');
  await login(other, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await other.goto('./#/customers/KHOLD');
  await other.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const customer = other.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true });
  await customer.getByLabel('Họ tên', { exact: true }).fill('Khách lịch sử mới');
  await customer.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(other.getByRole('alertdialog')).toContainText('Cập nhật thông tin khách hàng thành công');
  await expect(page.locator('.purchase-list tbody td:nth-child(3)').first()).toHaveText('Khách lịch sử mới'); // no F5
  await other.close();
  await page.getByRole('link', { name: 'TM01', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chi tiết giao dịch TM01', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
