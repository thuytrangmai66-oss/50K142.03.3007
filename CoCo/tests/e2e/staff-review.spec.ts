import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { bootstrapOwner, login } from './auth-helpers';

const TARGET = { name: 'Nhân viên kiểm thử', phone: '0900000011', username: 'review', password: 'staff-review!' };
const KEEPER = { name: 'Nhân viên giữ lại', phone: '0900000012', username: 'keeper', password: 'staff-keeper!' };
const createDialog = (page: Page) => page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
const editDialog = (page: Page) => page.getByRole('dialog', { name: 'Sửa tài khoản nhân viên', exact: true });
const result = (page: Page) => page.getByRole('alertdialog');
const closeResult = (page: Page) => page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
async function capture(page: Page, info: TestInfo, screen: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath(`${screen}.png`), fullPage: false });
}
async function prepare(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); await login(page);
  await page.getByRole('link', { name: 'Nhân viên', exact: true }).click();
  return errors;
}
async function fillCreate(page: Page, profile = TARGET) {
  const form = createDialog(page);
  for (const [label, value] of [['Họ tên', profile.name], ['Số điện thoại', profile.phone], ['Tên đăng nhập', profile.username], ['Mật khẩu', profile.password]]) {
    await form.getByLabel(label, { exact: true }).fill(value);
  }
}
async function create(page: Page, profile = TARGET) {
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await fillCreate(page, profile); await createDialog(page).getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(result(page)).toContainText('Tạo tài khoản mới thành công'); await closeResult(page);
  await expect(page.getByRole('link', { name: profile.name, exact: true })).toBeVisible();
}
async function snapshot(page: Page) {
  return page.evaluate(() => new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, names = Array.from(db.objectStoreNames), tx = db.transaction(names, 'readonly'), data: Record<string, unknown[]> = {};
      for (const name of names) { const query = tx.objectStore(name).getAll(); query.onsuccess = () => { data[name] = query.result; }; }
      tx.oncomplete = () => { db.close(); resolve(JSON.stringify(data)); }; tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
}
async function failWrite(page: Page, store: string) {
  await page.evaluate(name => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === name) { IDBObjectStore.prototype.put = original; throw new DOMException('G5 test-only storage failure', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  }, store);
}
async function failRead(page: Page, employeeId: string, url: string) {
  // Fresh document avoids Dexie's cache serving a previously read staff record.
  // Arm the account's MaNV index lookup, leaving auth/session PK reads unaffected.
  await page.addInitScript(() => {
    const state = window as unknown as { staffReadFaultInstalled?: boolean };
    if (state.staffReadFaultInstalled) return;
    state.staffReadFaultInstalled = true;
    const original = IDBIndex.prototype.getAll;
    IDBIndex.prototype.getAll = function (...args) {
      // Snapshot starts by finding this employee's account through the MaNV index.
      // It does not interfere with auth, which reads accounts by primary key.
      if (this.objectStore.name === 'taiKhoan' && this.name === 'MaNV' && sessionStorage.getItem('test:staff-read-fault')) {
        throw new DOMException('G5 test-only read failure', 'UnknownError');
      }
      return original.apply(this, args);
    };
  });
  await page.evaluate(id => sessionStorage.setItem('test:staff-read-fault', id), employeeId);
  await page.goto(url);
  await page.reload(); // HashRouter navigation alone does not create a new document.
  await expect(result(page)).toBeVisible();
}

test('G5 source controls and successful states SC145/146/148/149/150/152-155/157-160/162 through real UI', async ({ page }, info) => {
  const errors = await prepare(page);
  await expect(page.getByText('Chưa có tài khoản nhân viên', { exact: true })).toBeVisible(); await capture(page, info, 'SC146');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = createDialog(page);
  await expect(form.getByRole('button', { name: 'Hiện mật khẩu', exact: true })).toHaveCount(0);
  await capture(page, info, 'SC158-empty');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  for (const text of ['Họ tên không được để trống', 'Số điện thoại không được để trống', 'Tên đăng nhập không được để trống', 'Mật khẩu không được để trống']) await expect(form.getByText(text, { exact: true })).toBeVisible();
  await capture(page, info, 'SC159'); await fillCreate(page);
  const password = form.getByLabel('Mật khẩu', { exact: true });
  await expect(password).toHaveAttribute('type', 'password');
  await form.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text'); await expect(password).toHaveValue(TARGET.password);
  await expect(form.getByRole('button', { name: 'Ẩn mật khẩu', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await form.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click(); await expect(password).toHaveAttribute('type', 'password');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(result(page)).toContainText('Tạo tài khoản mới thành công');
  await expect(form).toBeVisible(); await expect(form.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled();
  await capture(page, info, 'SC162'); await closeResult(page);
  await expect(page.getByRole('link', { name: TARGET.name, exact: true })).toBeVisible(); await capture(page, info, 'SC145');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click(); await fillCreate(page); await capture(page, info, 'SC158');
  await expect(password).toHaveAttribute('type', 'password'); // A new form never retains visibility preference.
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form.getByText('Số điện thoại đã tồn tại', { exact: true })).toBeVisible();
  await expect(form.getByText('Tên đăng nhập đã tồn tại', { exact: true })).toBeVisible(); await capture(page, info, 'SC160');
  await form.getByRole('button', { name: 'Hủy', exact: true }).click(); await create(page, KEEPER);
  await page.getByRole('link', { name: TARGET.name, exact: true }).click(); await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveValue(TARGET.username);
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveCount(0); await capture(page, info, 'SC148');
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click(); const edit = editDialog(page); await capture(page, info, 'SC152');
  for (const label of ['Họ tên', 'Số điện thoại', 'Tên đăng nhập']) await edit.getByLabel(label, { exact: true }).fill('');
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
  for (const text of ['Họ tên không được để trống', 'Số điện thoại không được để trống', 'Tên đăng nhập không được để trống']) await expect(edit.getByText(text, { exact: true })).toBeVisible();
  await capture(page, info, 'SC153');
  await edit.getByLabel('Họ tên', { exact: true }).fill(TARGET.name); await edit.getByLabel('Tên đăng nhập', { exact: true }).fill(TARGET.username); await edit.getByLabel('Số điện thoại', { exact: true }).fill('123');
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(edit.getByText('Số điện thoại không hợp lệ', { exact: true })).toBeVisible(); await capture(page, info, 'SC154');
  await edit.getByLabel('Số điện thoại', { exact: true }).fill(KEEPER.phone); await edit.getByLabel('Tên đăng nhập', { exact: true }).fill(KEEPER.username);
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
  for (const text of ['Số điện thoại đã tồn tại', 'Tên đăng nhập đã tồn tại']) await expect(edit.getByText(text, { exact: true })).toBeVisible(); await capture(page, info, 'SC155');
  await edit.getByLabel('Số điện thoại', { exact: true }).fill(TARGET.phone); await edit.getByLabel('Tên đăng nhập', { exact: true }).fill(TARGET.username); await edit.getByLabel('Họ tên', { exact: true }).fill('Đã sửa thông tin');
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(result(page)).toContainText('Cập nhật thông tin thành công');
  await expect(edit).toBeVisible(); await expect(edit.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled(); await capture(page, info, 'SC157'); await closeResult(page);
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Đã sửa thông tin'); const before = await snapshot(page);
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click(); const confirm = page.locator('.confirm-dialog'); await capture(page, info, 'SC149');
  await confirm.getByRole('button', { name: 'Hủy', exact: true }).click(); expect(await snapshot(page)).toBe(before);
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click(); await confirm.getByRole('button', { name: 'Đóng xác nhận', exact: true }).click(); expect(await snapshot(page)).toBe(before);
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click(); await confirm.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(result(page)).toContainText('Xóa tài khoản thành công');
  await expect(page.getByText('Tài khoản không tồn tại', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Đã sửa thông tin');
  await expect(page.getByRole('button', { name: 'Xóa tài khoản', exact: true })).toBeDisabled();
  await capture(page, info, 'SC150'); await closeResult(page);
  await expect(page.getByRole('link', { name: KEEPER.name, exact: true })).toBeVisible(); await expect(page.getByRole('link', { name: 'Đã sửa thông tin', exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('G5 failures SC147/151/156/161 preserve complete DB and recover through UI retry', async ({ page }, info) => {
  const errors = await prepare(page);
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click(); await fillCreate(page); const beforeCreate = await snapshot(page);
  await failWrite(page, 'accountSecurity'); await createDialog(page).getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(result(page)).toContainText('Lỗi trong quá trình lưu. Vui lòng thử lại'); await capture(page, info, 'SC161'); expect(await snapshot(page)).toBe(beforeCreate);
  await closeResult(page); await expect(createDialog(page).getByLabel('Họ tên', { exact: true })).toHaveValue(TARGET.name);
  await createDialog(page).getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(result(page)).toContainText('Tạo tài khoản mới thành công'); await closeResult(page);
  await page.getByRole('link', { name: TARGET.name, exact: true }).click(); const id = await page.getByLabel('Mã nhân viên', { exact: true }).inputValue(), detailURL = page.url();
  await failRead(page, id, './#/staff');
  await expect(result(page)).toContainText('Không thể hiển thị dữ liệu nhân viên'); await capture(page, info, 'SC147');
  await closeResult(page); await page.evaluate(() => sessionStorage.removeItem('test:staff-read-fault')); await page.getByRole('button', { name: 'Thử lại', exact: true }).click(); await expect(page.getByRole('link', { name: TARGET.name, exact: true })).toBeVisible();
  await failRead(page, id, detailURL);
  await expect(result(page)).toContainText('Không thể hiển thị dữ liệu nhân viên'); await capture(page, info, 'detail-read-error'); await closeResult(page);
  await page.evaluate(() => sessionStorage.removeItem('test:staff-read-fault')); await page.getByRole('button', { name: 'Thử lại', exact: true }).click(); await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveValue(TARGET.username); expect(page.url()).toBe(detailURL);
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click(); const edit = editDialog(page);
  await edit.getByLabel('Họ tên', { exact: true }).fill('Sửa sau lỗi'); const beforeEdit = await snapshot(page); await failWrite(page, 'nhanVien');
  await edit.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(result(page)).toContainText('Cập nhật thông tin thất bại'); await capture(page, info, 'SC156'); expect(await snapshot(page)).toBe(beforeEdit);
  await closeResult(page); await expect(edit.getByLabel('Họ tên', { exact: true })).toHaveValue('Sửa sau lỗi'); await edit.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(result(page)).toContainText('Cập nhật thông tin thành công'); await closeResult(page); await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Sửa sau lỗi');
  const beforeDelete = await snapshot(page); await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click(); await failWrite(page, 'accountSecurity');
  await page.locator('.confirm-dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click(); await expect(result(page)).toContainText('Xóa tài khoản thất bại'); await capture(page, info, 'SC151'); expect(await snapshot(page)).toBe(beforeDelete);
  await closeResult(page); await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveValue(TARGET.username);
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click(); await page.locator('.confirm-dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(result(page)).toContainText('Xóa tài khoản thành công'); await closeResult(page); await expect(page.getByText('Chưa có tài khoản nhân viên', { exact: true })).toBeVisible(); expect(errors).toEqual([]);
});

test('G5 create form and password control fit desktop and narrow viewports without console errors', async ({ page }, info) => {
  const errors = await prepare(page); await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click(); await fillCreate(page);
  const before = await snapshot(page), form = createDialog(page);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await expect(form).toBeInViewport({ ratio: 1 });
    for (const label of ['Họ tên', 'Số điện thoại', 'Tên đăng nhập', 'Mật khẩu']) await expect(form.getByLabel(label, { exact: true })).toBeInViewport({ ratio: 1 });
    await expect(form.getByRole('button', { name: 'Hiện mật khẩu', exact: true })).toBeInViewport({ ratio: 1 });
    await expect(form.getByRole('button', { name: 'Lưu', exact: true })).toBeInViewport({ ratio: 1 });
    const box = (await form.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    await capture(page, info, `create-${viewport.width}x${viewport.height}`);
  }
  await form.getByRole('button', { name: 'Hủy', exact: true }).click(); expect(await snapshot(page)).toBe(before); expect(errors).toEqual([]);
});
