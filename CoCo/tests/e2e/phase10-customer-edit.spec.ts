import { expect, test, type Page } from '@playwright/test';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';
import { closeNotice } from './purchase-helpers';
import { inventoryData } from './inventory-helpers';

async function createCustomer(page: Page, name: string, phone: string) {
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill(name);
  await form.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Đã thêm thông tin khách hàng');
}

for (const role of ['owner', 'staff'] as const) test(`G10 BR-UC4-03/04/05 ${role}: invalid and duplicate edits preserve all data, cancel and rename retain identity`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await createCustomer(page, 'Khách sửa G10', '0900000002');
  await createCustomer(page, 'Khách giữ nguyên', '0900000003');
  await page.getByRole('link', { name: 'Khách sửa G10', exact: true }).click();
  const before = await inventoryData(page), id = String(before.khachHang.find(row => row.SoDienThoaiKH === '0900000002')!.MaKH);
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Sửa thông tin khách hàng', exact: true });
  for (const item of [
    { name: '', phone: '0900000002', error: 'Tên khách hàng không được để trống' },
    { name: 'Không được ghi', phone: '', error: 'Số điện thoại không được để trống' },
    { name: 'Không được ghi', phone: '090000002', error: 'Số điện thoại phải gồm đúng 10 chữ số' },
    { name: 'Không được ghi', phone: '０９０００００００２', error: 'Số điện thoại phải gồm đúng 10 chữ số' },
    { name: 'Không được ghi', phone: '0900000003', error: 'Số điện thoại bị trùng với khách hàng khác' },
  ]) {
    await form.getByLabel('Họ tên', { exact: true }).fill(item.name);
    await form.getByLabel('Số điện thoại', { exact: true }).fill(item.phone);
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(form.getByText(item.error, { exact: true })).toBeVisible();
    expect(await inventoryData(page)).toEqual(before);
  }
  await page.screenshot({ path: info.outputPath(`${role}-edit-validation.png`) });
  await form.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(await inventoryData(page)).toEqual(before);
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  await form.getByLabel('Họ tên', { exact: true }).fill('Tên đã sửa G10');
  await expect(form.getByLabel('Số điện thoại', { exact: true })).toHaveValue('0900000002');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  const notice = page.getByRole('alertdialog', { name: 'Cập nhật thông tin khách hàng thành công', exact: true });
  await expect(notice).toBeVisible();
  // Deletion-specific Figma styling must not leak into edit success notices.
  await expect(notice).not.toHaveClass(/customer-delete-result/);
  await closeNotice(page, 'Cập nhật thông tin khách hàng thành công');
  await page.reload();
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Tên đã sửa G10');
  const after = await inventoryData(page);
  expect(after.khachHang).toHaveLength(2);
  expect(after.khachHang.find(row => row.MaKH === id)).toEqual({ ...before.khachHang.find(row => row.MaKH === id), TenKH: 'Tên đã sửa G10' });
  expect(after.appMetadata).toEqual(before.appMetadata);
  expect(after.khachHang.find(row => row.SoDienThoaiKH === '0900000003')).toEqual(before.khachHang.find(row => row.SoDienThoaiKH === '0900000003'));
  expect(errors).toEqual([]);
});
