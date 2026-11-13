import { expect, type Page } from '@playwright/test';
export const OWNER = { fullName: 'Chủ kiểm thử', phone: '0900000001', username: 'owner', password: 'only-for-tests!' };

export async function bootstrapOwner(page: Page) {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Thiết lập chủ cửa hàng', exact: true })).toBeVisible();
  await page.getByLabel('Họ tên:', { exact: true }).fill(OWNER.fullName);
  await page.getByLabel('Số điện thoại:', { exact: true }).fill(OWNER.phone);
  await page.getByLabel('Tên đăng nhập:', { exact: true }).fill(OWNER.username);
  await page.getByLabel('Mật khẩu:', { exact: true }).fill(OWNER.password);
  await page.getByRole('button', { name: 'Tạo tài khoản chủ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
}
export async function login(page: Page, username = OWNER.username, password = OWNER.password) {
  await page.getByLabel('Tên đăng nhập:', { exact: true }).fill(username);
  await page.getByLabel('Mật khẩu:', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alertdialog', { name: 'Đăng nhập thành công!' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
}
/** Fixture in the test profile only; production has no staff provisioning shortcut. */
export async function addStaffFixture(page: Page) {
  await page.evaluate(async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('staff-test!'), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600_000 }, key, 256);
    const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('CoCoDB'); req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const connection = req.result;
        const tx = connection.transaction(['nhanVien','taiKhoan','accountSecurity','recordVersions'], 'readwrite');
        tx.objectStore('nhanVien').add({ MaNV: 'NVSTAFF', HoTen: 'Nhân viên kiểm thử', SoDienThoai: '0900000002' });
        tx.objectStore('taiKhoan').add({ TenDangNhap: 'staff', MaNV: 'NVSTAFF' });
        tx.objectStore('accountSecurity').add({ TenDangNhap: 'staff', role: 'staff', active: true,
          passwordHash: hex(new Uint8Array(bits)), passwordSalt: hex(salt), algorithm: 'PBKDF2-SHA-256', iterations: 600_000 });
        tx.objectStore('recordVersions').put({ key: JSON.stringify(['accountSecurity','staff']), version: 1, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => { connection.close(); resolve(); };
        tx.onerror = () => { connection.close(); reject(tx.error); };
      };
    });
  });
}
