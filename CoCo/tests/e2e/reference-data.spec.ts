import { expect, test, type Page } from '@playwright/test';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';

async function createCustomer(page: Page, name: string, phone: string) {
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill(name);
  await form.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Đã thêm thông tin khách hàng');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
}

for (const role of ['owner','staff'] as const) test(`${role} customer UI validates, cancels, creates, searches, edits, histories, deletes and persists`, async ({ page }, info) => {
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page,role,role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await expect(page.getByText('Chưa có thông tin khách hàng', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form.getByText('Tên khách hàng không được để trống', { exact: true })).toBeVisible();
  await expect(form.getByText('Số điện thoại không được để trống', { exact: true })).toBeVisible();
  await form.getByLabel('Họ tên', { exact: true }).fill('Không lưu');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('123');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form.getByText('Số điện thoại phải gồm đúng 10 chữ số', { exact: true })).toBeVisible();
  await form.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByText('Chưa có thông tin khách hàng', { exact: true })).toBeVisible();
  await createCustomer(page, 'Khách có dấu', '0123456789');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await form.getByLabel('Họ tên', { exact: true }).fill('Trùng số'); await form.getByLabel('Số điện thoại', { exact: true }).fill('0123456789');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form.getByText('Số điện thoại bị trùng với khách hàng khác', { exact: true })).toBeVisible();
  await form.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tìm khách hàng theo số điện thoại' }).fill('0999999999');
  await expect(page.getByText('Không tìm thấy khách hàng', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click();
  await page.getByRole('link', { name: 'Khách có dấu', exact: true }).click();
  await expect(page.getByLabel('Số điện thoại', { exact: true })).toHaveValue('0123456789');
  await page.getByRole('textbox', { name: 'Tìm khách hàng theo số điện thoại' }).fill('0123456789');
  await page.getByRole('button', { name: 'Tìm khách hàng', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Khách có dấu', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Khách có dấu', exact: true }).click();
  await page.getByRole('link', { name: 'Lịch sử mua', exact: true }).click();
  await expect(page.getByText('Không tìm thấy lịch sử mua', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('link', { name: 'Lịch sử bán', exact: true }).click();
  await expect(page.getByText('Không tìm thấy lịch sử bán', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await page.screenshot({ path: info.outputPath(`${role}-customer-detail.png`), fullPage: true });
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const edit=page.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true });
  await edit.getByLabel('Họ tên', { exact: true }).fill('<img src=x onerror=alert(1)>');
  await edit.getByLabel('Số điện thoại', { exact: true }).fill('0111111111');
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Cập nhật thông tin khách hàng thành công');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click(); await page.reload();
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('<img src=x onerror=alert(1)>');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath(`${role}-escaped-input.png`), fullPage: true });
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click();
  const confirm=page.getByRole('dialog', { name: 'Có chắc chắn xóa thông tin khách hàng không?', exact: true });
  await confirm.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByLabel('Số điện thoại', { exact: true })).toHaveValue('0111111111');
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click(); await confirm.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Đã xóa thông tin khách hàng');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByText('Chưa có thông tin khách hàng', { exact: true })).toBeVisible();
});

test('two tabs keep independent identities, live customer data without F5, and reject stale UI writes', async ({ page, context }, info) => {
  await bootstrapOwner(page); await addStaffFixture(page); await login(page);
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  const staff = await context.newPage(); await staff.goto('./'); await login(staff,'staff','staff-test!');
  await staff.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  const originalToken = await page.evaluate(()=>sessionStorage.getItem('coco:session'));
  expect(await staff.evaluate(()=>sessionStorage.getItem('coco:session'))).not.toBe(originalToken);
  await createCustomer(staff,'Khách dùng chung','0123456789');
  await expect(page.getByRole('link', { name: 'Khách dùng chung', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Khách dùng chung', exact: true }).click(); await staff.getByRole('link', { name: 'Khách dùng chung', exact: true }).click();
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click(); await staff.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const ownerForm=page.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true }), staffForm=staff.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true });
  await ownerForm.getByLabel('Họ tên', { exact: true }).fill('Tên thắng'); await ownerForm.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Cập nhật thông tin khách hàng thành công');
  await staffForm.getByLabel('Họ tên', { exact: true }).fill('Tên cũ ghi đè'); await staffForm.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(staff.getByRole('alertdialog')).toContainText('Dữ liệu đã thay đổi ở tab khác');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Tên thắng');
  await expect(staff.getByText('Nhân viên', { exact: true })).toBeVisible();
  await expect(page.getByText('Chủ cửa hàng', { exact: true })).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('coco:session'))).toBe(originalToken);
  await page.screenshot({ path: info.outputPath('owner-live.png'), fullPage: true });
  await staff.screenshot({ path: info.outputPath('staff-conflict.png'), fullPage: true });
});

test('owner bracket UI uses fixed dropdown, validates, cancels, edits and blocks staff route', async ({ page, context }, info) => {
  await bootstrapOwner(page); await addStaffFixture(page); await login(page);
  await page.getByRole('link', { name: 'Khung giá thu mua', exact: true }).click();
  await expect(page.getByText('Chưa có khung giá thu mua', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
  const form=page.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form.getByText('Độ mới không được để trống', { exact: true })).toBeVisible();
  await form.getByLabel('Loại hàng', { exact: true }).fill('Áo'); await form.getByLabel('Thương hiệu', { exact: true }).fill('Nhãn thử');
  await expect(form.getByLabel('Độ mới', { exact: true }).locator('option')).toHaveText(['Chọn độ mới','Mới','Tốt','Khá']);
  await form.getByLabel('Độ mới', { exact: true }).selectOption('2');
  await form.getByLabel('Giá tối thiểu (Min)', { exact: true }).fill('200000'); await form.getByLabel('Giá tối đa (Max)', { exact: true }).fill('100000');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Giá tối thiểu không được lớn hơn giá tối đa');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await form.getByLabel('Giá tối thiểu (Min)', { exact: true }).fill('50000'); await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Tạo khung giá thu mua thành công');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.getByRole('link', { name: 'Áo', exact: true }).click();
  await expect(page.getByLabel('Độ mới', { exact: true })).toHaveValue('Tốt');
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const edit=page.getByRole('dialog', { name: 'Sửa khung giá thu mua', exact: true });
  await edit.getByLabel('Độ mới', { exact: true }).selectOption('3'); await edit.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(page.getByLabel('Độ mới', { exact: true })).toHaveValue('Tốt');
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click(); await edit.getByLabel('Độ mới', { exact: true }).selectOption('3');
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Cập nhật khung giá thu mua thành công');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click(); await page.reload();
  await expect(page.getByLabel('Độ mới', { exact: true })).toHaveValue('Mới');
  await page.screenshot({ path: info.outputPath('owner-bracket-detail.png'), fullPage: true });
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('combobox', { name: 'Lọc độ mới', exact: true }).selectOption('2');
  await expect(page.getByRole('link', { name: 'Áo', exact: true })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Lọc độ mới', exact: true }).selectOption('3');
  await expect(page.getByRole('link', { name: 'Áo', exact: true })).toBeVisible();
  const staff=await context.newPage(); await staff.goto('./'); await login(staff,'staff','staff-test!');
  await expect(staff.getByRole('link', { name: 'Khung giá thu mua', exact: true })).toHaveCount(0);
  await staff.goto('./#/price-brackets'); await expect(staff.getByRole('heading', { name: 'Không có quyền truy cập', exact: true })).toBeVisible();
});

test('customer UI reads existing purchase/sale history and snapshots, and refuses linked deletion', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page); await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await createCustomer(page,'Khách lịch sử','0123456789'); await page.getByRole('link', { name: 'Khách lịch sử', exact: true }).click();
  const id=page.url().split('/').at(-1)!;
  // Historical G2 fixture only: G6/G8 editors are intentionally not implemented out of order.
  await page.evaluate(customerId=>new Promise<void>((resolve,reject)=>{
    const req=indexedDB.open('CoCoDB'); req.onerror=()=>reject(req.error); req.onsuccess=()=>{
      const connection=req.result, tx=connection.transaction(['taiKhoan','khungGiaThuMua','hoaDonThuMua','chiTietHoaDonTM','sanPham','hoaDonBanHang','chiTietHoaDonBH'],'readwrite');
      const account=tx.objectStore('taiKhoan').get('owner'); account.onsuccess=()=>{
        const MaNV=account.result.MaNV;
        tx.objectStore('khungGiaThuMua').add({ MaKhungGia:'KGOLD',LoaiSanPham:'Áo',ThuongHieu:'Nhãn cũ',TinhTrang:90,GiaMin:50000,GiaMax:150000,MaNV });
        tx.objectStore('hoaDonThuMua').add({ MaHDTM:'TM01',NgayThuMua:'2026-11-10T12:00:00+07:00',TongTienTM:100000,TrangThai:0,MaKH:customerId,MaNV });
        tx.objectStore('chiTietHoaDonTM').add({ MaHDTM:'TM01',MaKhungGia:'KGOLD',SoLuong:1,DonGia:100000,ThanhTien:100000 });
        tx.objectStore('sanPham').add({ MaSP:'SP01',TenSP:'Áo lịch sử',NgayNhapKho:'2026-11-10',GiaGocChuKyGiam:150000,GiaBanHienHanh:150000,TrangThai:0,NgayBatDauChuKyGiam:'2026-11-10',MaHDTM:'TM01',MaKhungGia:'KGOLD' });
        tx.objectStore('hoaDonBanHang').add({ MaHDBH:'BH01',NgayBan:'2026-11-11T12:00:00+07:00',TongTien:150000,TienKhuyenMai:0,TichDiem:15,PTTT:0,TrangThai:0,MaKH:customerId,MaNV });
        tx.objectStore('chiTietHoaDonBH').add({ MaHDBH:'BH01',MaSP:'SP01',SoLuong:1,DonGia:150000,ThanhTien:150000 });
      };
      tx.oncomplete=()=>{connection.close();resolve();};tx.onerror=()=>{connection.close();reject(tx.error);};
    };
  }),id);
  await page.getByRole('link', { name: 'Lịch sử mua', exact: true }).click(); await page.getByRole('link', { name: 'BH01', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chi tiết hóa đơn BH01', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Áo lịch sử', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('sale-history-viewer.png'), fullPage: true });
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click(); await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('link', { name: 'Lịch sử bán', exact: true }).click(); await page.getByRole('link', { name: 'TM01', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chi tiết giao dịch TM01', exact: true })).toBeVisible();
  await expect(page.locator('.invoice-total')).toContainText('100.000');
  await page.getByRole('link', { name: 'Quay lại', exact: true }).click(); await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không thể xóa khách hàng đã phát sinh giao dịch thu mua hoặc bán hàng');
});

test('customer UI handles a real IDB write failure without partial data and allows retry', async ({ page }) => {
  await bootstrapOwner(page); await login(page); await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form=page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách retry'); await form.getByLabel('Số điện thoại', { exact: true }).fill('0123456789');
  await page.evaluate(()=>{
    const original=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(...args) {
      if(this.name==='khachHang'){IDBObjectStore.prototype.put=original;throw new DOMException('test-only write denied','QuotaExceededError');}
      return original.apply(this,args);
    };
  });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không thể tạo thông tin khách hàng');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(form.getByLabel('Họ tên', { exact: true })).toHaveValue('Khách retry');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Đã thêm thông tin khách hàng');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Khách retry', exact: true })).toHaveCount(1);
});

test('customer pagination changes real rows and search reset returns to the first page', async ({ page }) => {
  await bootstrapOwner(page); await login(page); await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  for (let i=0;i<10;i++) {
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const form=page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
    await form.getByLabel('Họ tên', { exact: true }).fill(`Khách phân trang ${i}`);
    await form.getByLabel('Số điện thoại', { exact: true }).fill(`09${String(i).padStart(8,'0')}`);
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Đã thêm thông tin khách hàng');
    await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  }
  await expect(page.locator('.data-table tbody tr')).toHaveCount(9);
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current','page');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Tìm khách hàng theo số điện thoại' }).fill('0900000000');
  await expect(page.getByRole('button', { name: 'Trang 1', exact: true })).toHaveAttribute('aria-current','page');
  await expect(page.getByRole('link', { name: 'Khách phân trang 0', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click();
  await expect(page.locator('.data-table tbody tr')).toHaveCount(9);
});

for (const viewport of [{ width: 1366, height: 650 },{ width: 1280, height: 720 },{ width: 1024, height: 768 },{ width: 768, height: 1024 },{ width: 390, height: 844 },{ width: 320, height: 640 }]) test(`layout fits ${viewport.width}x${viewport.height} without browser zoom`, async ({ page }, info) => {
  await page.setViewportSize(viewport); await page.goto('./');
  const dimensions=async()=>page.evaluate(()=>({ width:document.documentElement.scrollWidth, viewport:innerWidth }));
  expect((await dimensions()).width).toBeLessThanOrEqual(viewport.width);
  await expect(page.getByRole('button', { name: 'Tạo tài khoản chủ', exact: true })).toBeInViewport();
  await bootstrapOwner(page);
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeInViewport();
  await page.screenshot({ path: info.outputPath('login-fit.png'), fullPage: true });
  await login(page); expect((await dimensions()).width).toBeLessThanOrEqual(viewport.width);
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click(); await createCustomer(page,'Khách kiểm tra màn hình','0123456789');
  await page.getByRole('link', { name: 'Khách kiểm tra màn hình', exact: true }).click();
  expect((await dimensions()).width).toBeLessThanOrEqual(viewport.width);
  await page.screenshot({ path: info.outputPath('customer-fit.png'), fullPage: true });
});
