import { expect, test } from '@playwright/test';
import { addStaffFixture, bootstrapOwner, login, OWNER } from './auth-helpers';
import { PHASE_2_STORES } from '../fixtures/phase2-schema';

for (const role of ['owner','staff'] as const) {
  test(`${role}: login states, source geometry, real session, logout and Back protection`, async ({ page }, info) => {
    await bootstrapOwner(page);
    if (role === 'staff') await addStaffFixture(page);
    const username = page.getByLabel('Tên đăng nhập:', { exact: true });
    const password = page.getByLabel('Mật khẩu:', { exact: true });
    const submit = page.getByRole('button', { name: 'Đăng nhập', exact: true });
    await username.clear(); await password.clear();
    await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).click();
    await page.evaluate(async () => { await document.fonts.ready; });
    const screen = (state: number) => `SC${String((role === 'owner' ? 0 : 191) + state).padStart(3, '0')}`;
    await page.screenshot({ path: info.outputPath(`${screen(1)}-empty.png`), fullPage: true });
    // Geometry from local UI_FOUNDATIONS/SC001, independent of CSS selectors' values.
    expect(await page.locator('.auth-card').boundingBox()).toEqual({ x: 673, y: 55, width: 720, height: 790 });
    expect(await page.locator('.field-input').first().boundingBox()).toEqual({ x: 721, y: 452, width: 619, height: 70 });
    expect(await submit.boundingBox()).toEqual({ x: 768, y: 726, width: 530, height: 63 });
    expect(await page.locator('.auth-card-mark').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await submit.click();
    await expect(page.getByRole('alert')).toHaveText('Tên đăng nhập hoặc mật khẩu không được để trống');
    await expect(username).toHaveAttribute('aria-invalid','true');
    await page.screenshot({ path: info.outputPath(`${screen(4)}-required.png`), fullPage: true });
    await username.fill(role); await password.fill('wrong-password');
    await page.screenshot({ path: info.outputPath(`${screen(2)}-filled.png`), fullPage: true });
    await submit.click();
    await expect(page.getByRole('alert')).toHaveText('Tên đăng nhập hoặc mật khẩu không đúng');
    await expect(password).toHaveAttribute('type','password');
    await page.screenshot({ path: info.outputPath(`${screen(3)}-invalid.png`), fullPage: true });
    await password.fill(role === 'owner' ? OWNER.password : 'staff-test!');
    await page.evaluate(() => {
      const original = crypto.subtle.deriveBits.bind(crypto.subtle);
      crypto.subtle.deriveBits = async () => {
        crypto.subtle.deriveBits = original;
        throw new DOMException('test-only crypto error', 'OperationError');
      };
    });
    await submit.click();
    await expect(page.getByRole('alertdialog', { name: 'Đăng nhập thất bại!' })).toBeVisible();
    await page.screenshot({ path: info.outputPath(`${screen(5)}-system-error.png`), fullPage: true });
    await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    await submit.click();
    await expect(page.getByRole('alertdialog', { name: 'Đăng nhập thành công!' })).toBeVisible();
    await expect(page.locator('.auth-card')).toHaveClass(/auth-succeeded/);
    await page.screenshot({ path: info.outputPath(`${screen(6)}-success.png`), fullPage: true });
    await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
    await expect(page.getByText(role === 'owner' ? 'Chủ cửa hàng' : 'Nhân viên', { exact: true })).toBeVisible();
    const stored = await page.evaluate(() => ({ keys: Object.keys(sessionStorage), token: sessionStorage.getItem('coco:session') }));
    expect(stored.keys).toEqual(['coco:session']); expect(stored.token).toMatch(/^[a-f0-9]{64}$/);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
    await page.goto('http://127.0.0.1:4173/50K142.03.3007/#/unknown');
    await page.getByRole('link', { name: 'Về trang chủ' }).click();
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBeNull();
  });
}

test('owner and staff share DB with separate sessions, staff route denied and revoked account loses access', async ({ page, context }) => {
  await bootstrapOwner(page); await addStaffFixture(page); await login(page);
  const staff = await context.newPage();
  await staff.goto('http://127.0.0.1:4173/50K142.03.3007/#/reports');
  await expect(staff.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await login(staff, 'staff', 'staff-test!');
  await staff.goto('http://127.0.0.1:4173/50K142.03.3007/#/reports');
  await expect(staff.getByRole('heading', { name: 'Không có quyền truy cập', exact: true })).toBeVisible();
  await page.goto('http://127.0.0.1:4173/50K142.03.3007/#/reports');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Về trang chủ' }).click();
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const req = indexedDB.open('CoCoDB'); req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const connection = req.result;
      const tx = connection.transaction(['accountSecurity','recordVersions'],'readwrite');
      const get = tx.objectStore('accountSecurity').get('staff');
      get.onsuccess = () => tx.objectStore('accountSecurity').put({ ...get.result, active: false });
      tx.objectStore('recordVersions').put({ key: JSON.stringify(['accountSecurity','staff']), version: 2, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => { connection.close(); resolve(); };
      tx.onerror = () => { connection.close(); reject(tx.error); };
    };
  }));
  await staff.bringToFront(); await staff.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(staff.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
});

test('real browser v2 migration preserves existing owner credentials and customer data', async ({ page }) => {
  await page.route('**/assets/*.js', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.goto('./');
  await page.evaluate(async ({ stores, profile }) => {
    const salt = new Uint8Array(16).fill(7);
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(profile.password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600_000 }, material, 256);
    const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('CoCoDB', 20);
      req.onupgradeneeded = () => {
        const keyPath = (key: string) => key.startsWith('[') ? key.slice(1, -1).split('+') : key;
        for (const [name, definition] of Object.entries(stores)) {
          const [primary, ...indexes] = definition.split(/,\s*/);
          const store = req.result.createObjectStore(name, { keyPath: keyPath(primary.replace(/^&/, '')) });
          for (const index of indexes) {
            const key = index.replace(/^&/, '');
            store.createIndex(key, keyPath(key), { unique: index.startsWith('&') });
          }
        }
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const connection = req.result;
        const tx = connection.transaction(['appMetadata','nhanVien','taiKhoan','accountSecurity','recordVersions','khachHang'], 'readwrite');
        tx.objectStore('appMetadata').put({ key: 'v2-proof', value: 'preserve-customer-and-owner' });
        tx.objectStore('nhanVien').add({ MaNV: 'NVOLD', HoTen: profile.fullName, SoDienThoai: profile.phone });
        tx.objectStore('taiKhoan').add({ TenDangNhap: profile.username, MaNV: 'NVOLD' });
        tx.objectStore('accountSecurity').add({ TenDangNhap: profile.username, role: 'owner', active: true,
          passwordHash: hex(new Uint8Array(bits)), passwordSalt: hex(salt), algorithm: 'PBKDF2-SHA-256', iterations: 600_000 });
        tx.objectStore('recordVersions').put({ key: JSON.stringify(['accountSecurity',profile.username]), version: 4, updatedAt: '2026-11-10T12:00:00.000Z' });
        tx.objectStore('khachHang').add({ MaKH: 'KHOLD', TenKH: 'Khách từ G2', SoDienThoaiKH: '0123456789', DiemTichLuy: 50 });
        tx.oncomplete = () => { connection.close(); resolve(); };
        tx.onerror = () => { connection.close(); reject(tx.error); };
      };
    });
  }, { stores: PHASE_2_STORES, profile: OWNER });
  await page.unroute('**/assets/*.js'); await page.reload();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  const preserved = await page.evaluate(() => new Promise<Record<string, unknown>>((resolve, reject) => {
    const req = indexedDB.open('CoCoDB'); req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const connection = req.result;
      const tx = connection.transaction(['appMetadata','khachHang','taiKhoan','authSessions']);
      const metadata = tx.objectStore('appMetadata').get('v2-proof');
      const customer = tx.objectStore('khachHang').get('KHOLD');
      const accounts = tx.objectStore('taiKhoan').count();
      const sessions = tx.objectStore('authSessions').count();
      tx.oncomplete = () => { resolve({ nativeVersion: connection.version, stores: connection.objectStoreNames.length,
        sentinel: metadata.result.value, customer: customer.result, accounts: accounts.result, sessions: sessions.result }); connection.close(); };
      tx.onerror = () => { connection.close(); reject(tx.error); };
    };
  }));
  expect(preserved).toEqual({ nativeVersion: 40, stores: 27, sentinel: 'preserve-customer-and-owner',
    customer: { MaKH: 'KHOLD', TenKH: 'Khách từ G2', SoDienThoaiKH: '0123456789', DiemTichLuy: 50 }, accounts: 1, sessions: 0 });
  await login(page);
});

test('forged session data cannot select an owner identity', async ({ page }) => {
  await bootstrapOwner(page); await addStaffFixture(page); await login(page, 'staff', 'staff-test!');
  await page.evaluate(() => sessionStorage.setItem('coco:session', JSON.stringify({ username: 'owner', role: 'owner' })));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('coco:session'))).toBeNull();
});

test('failed browser session persistence rolls back the new login session and offers recovery', async ({ page }) => {
  await bootstrapOwner(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'coco:session') throw new DOMException('test storage denied','SecurityError');
      return original.call(this,key,value);
    };
  });
  await page.getByLabel('Tên đăng nhập:', { exact: true }).fill(OWNER.username);
  await page.getByLabel('Mật khẩu:', { exact: true }).fill(OWNER.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Không thể lưu phiên đăng nhập');
  const count = await page.evaluate(() => new Promise<number>((resolve,reject) => {
    const req = indexedDB.open('CoCoDB'); req.onerror = () => reject(req.error);
    req.onsuccess = () => { const connection=req.result; const tx=connection.transaction('authSessions');
      const get=tx.objectStore('authSessions').count(); get.onsuccess=()=>{connection.close();resolve(get.result);}; get.onerror=()=>reject(get.error); };
  }));
  expect(count).toBe(0);
});

test('bootstrap is race-safe across two browser tabs', async ({ page, context }, info) => {
  await page.goto('./'); const other = await context.newPage(); await other.goto('http://127.0.0.1:4173/50K142.03.3007/');
  for (const [i,tab] of [page,other].entries()) {
    await tab.getByLabel('Họ tên:', { exact: true }).fill(`Chủ kiểm thử ${i}`);
    await tab.getByLabel('Số điện thoại:', { exact: true }).fill(i ? '0900000002' : '0900000001');
    await tab.getByLabel('Tên đăng nhập:', { exact: true }).fill(i ? 'owner2' : 'owner1');
    await tab.getByLabel('Mật khẩu:', { exact: true }).fill(OWNER.password);
  }
  await page.screenshot({ path: info.outputPath('P01-bootstrap.png'), fullPage: true });
  await Promise.all([page,other].map(tab => tab.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit())));
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await expect(other.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  const count=await page.evaluate(()=>new Promise<number>((resolve,reject)=>{const req=indexedDB.open('CoCoDB');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const connection=req.result;const get=connection.transaction('accountSecurity').objectStore('accountSecurity').count();get.onsuccess=()=>{connection.close();resolve(get.result);};get.onerror=()=>reject(get.error);};}));
  expect(count).toBe(1);
});
