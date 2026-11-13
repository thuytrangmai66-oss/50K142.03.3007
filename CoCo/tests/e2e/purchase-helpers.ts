import { expect, type Page, type BrowserContext } from '@playwright/test';
import { bootstrapOwner, login } from './auth-helpers';

export async function closeNotice(page: Page, message: string) {
  await expect(page.getByRole('alertdialog')).toContainText(message);
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
}

export async function expectApprovalList(page: Page) {
  await expect(page).toHaveURL(/#\/approvals$/);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator(':modal')).toHaveCount(0);
  await expect(page.locator('.approval-list')).toBeVisible();
}

export async function addProduct(page: Page, price = '120000', quantity = '1') {
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  const item = page.getByRole('dialog', { name: 'Tạo giao dịch', exact: true });
  for (const [label, value] of [['Loại sản phẩm', 'Áo'], ['Thương hiệu', 'CoCo'], ['Số lượng', quantity]]) {
    await item.getByLabel(label, { exact: true }).fill(value);
  }
  await item.getByLabel('Chất lượng', { exact: true }).selectOption('2');
  await item.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  const pricing = page.getByRole('dialog', { name: 'Thông tin sản phẩm', exact: true });
  await pricing.getByLabel('Giá thu mua đề xuất', { exact: true }).fill(price);
  await pricing.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(pricing).toHaveCount(0);
  if (Number(price) > 100000) await closeNotice(page, 'Giá thu mua vượt mức, cần được phê duyệt');
}

export async function setup(owner: Page, context: BrowserContext) {
  await bootstrapOwner(owner); await login(owner);
  await createBracket(owner);
  await owner.getByRole('link', { name: 'Nhân viên', exact: true }).click();
  await owner.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const staffForm = owner.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
  for (const [label, value] of [['Họ tên', 'Nhân viên T03'], ['Số điện thoại', '0900000033'], ['Tên đăng nhập', 'staff03'], ['Mật khẩu', 't03-staff!']]) {
    await staffForm.getByLabel(label, { exact: true }).fill(value);
  }
  await staffForm.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(owner, 'Tạo tài khoản mới thành công');
  await owner.getByRole('link', { name: 'Phê duyệt', exact: true }).click();
  await expect(owner.getByText('Không có yêu cầu cần phê duyệt', { exact: true })).toBeVisible();
  const staff = await context.newPage(); await staff.goto('./'); await login(staff, 'staff03', 't03-staff!');
  await staff.getByRole('link', { name: 'Thu mua', exact: true }).click();
  await staff.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  await addProduct(staff);
  await expect(owner.locator('.approval-list tbody')).toContainText('Nhân viên T03');
  await owner.locator('.approval-id-link').first().click();
  await expect(owner.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toContainText('120.000');
  return staff;
}

export async function snapshot(page: Page) {
  return page.evaluate(() => new Promise<Record<string, Array<Record<string, unknown>>>>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB'); request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const stores = ['purchaseApprovals', 'purchaseLines', 'purchaseNotices', 'hoaDonThuMua', 'sanPham', 'operations'];
      const tx = db.transaction(stores, 'readonly');
      const result: Record<string, Array<Record<string, unknown>>> = {};
      for (const store of stores) { const read = tx.objectStore(store).getAll(); read.onsuccess = () => { result[store] = read.result; }; }
      tx.oncomplete = () => { db.close(); resolve(result); }; tx.onerror = () => reject(tx.error);
    };
  }));
}



export async function createBracket(owner: Page) {
  await owner.getByRole('link', { name: 'Khung giá thu mua', exact: true }).click();
  await owner.getByRole('button', { name: 'Tạo khung giá', exact: true }).click();
  const bracket = owner.getByRole('dialog', { name: 'Tạo khung giá thu mua', exact: true });
  for (const [label, value] of [['Loại hàng', 'Áo'], ['Thương hiệu', 'CoCo'], ['Giá tối thiểu (Min)', '50000'], ['Giá tối đa (Max)', '100000']]) {
    await bracket.getByLabel(label, { exact: true }).fill(value);
  }
  await bracket.getByLabel('Độ mới', { exact: true }).selectOption('2');
  await bracket.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(owner, 'Tạo khung giá thu mua thành công');
}

