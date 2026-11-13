import { test, expect } from '@playwright/test';
import { login, addStaffFixture } from './auth-helpers';
import { closeNotice } from './purchase-helpers';
import { createInventoryThroughUI, inventoryData, openInventoryEditor } from './inventory-helpers';

for (const role of ['owner', 'staff'] as const) test(`G7 ${role} edits one physical item, validates, cancels, resets cycle and preserves historical records`, async ({ page, context }, info) => {
  const errors: string[] = []; context.on('weberror', e => errors.push(e.error().message));
  await createInventoryThroughUI(page); let reader = page;
  if (role === 'staff') { await addStaffFixture(page); reader = await context.newPage(); await reader.goto('./'); await login(reader, 'staff', 'staff-test!'); }
  const initial = await inventoryData(reader), id = String(initial.sanPham[0].MaSP);
  let form = await openInventoryEditor(reader, id);
  await expect(form.getByLabel('Mã sản phẩm', { exact: true })).toHaveAttribute('readonly', '');
  await form.getByLabel('Tên sản phẩm', { exact: true }).fill('Chưa lưu'); await form.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(await inventoryData(reader)).toEqual(initial);
  form = await openInventoryEditor(reader, id);
  await form.getByLabel('Tên sản phẩm', { exact: true }).fill(''); await form.getByLabel('Giá bán hiện tại (đồng)', { exact: true }).fill('0');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(form.getByText('Không được bỏ trống trường dữ liệu', { exact: true })).toBeVisible();
  await expect(form.getByText('Giá bán không được bé hơn hoặc bằng 0', { exact: true })).toBeVisible();
  await reader.screenshot({ path: info.outputPath(`${role}-edit-validation.png`) });
  await form.getByLabel('Tên sản phẩm', { exact: true }).fill('Áo đã cập nhật');
  await form.getByLabel('Loại sản phẩm', { exact: true }).fill('Áo khoác');
  await form.getByLabel('Thương hiệu', { exact: true }).fill('Nhãn mới');
  await form.getByLabel('Độ mới / Tình trạng', { exact: true }).fill('Mới');
  await form.getByLabel('Giá bán hiện tại (đồng)', { exact: true }).fill('120001');
  for (const size of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await reader.setViewportSize(size); await expect(form.getByRole('button', { name: 'Lưu', exact: true })).toBeInViewport();
    await reader.screenshot({ path: info.outputPath(`${role}-edit-${size.width}.png`) });
  }
  await form.getByRole('button', { name: 'Lưu', exact: true }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await closeNotice(reader, 'Cập nhật thành công!');
  await expect(reader.locator('.inventory-card')).toContainText('Áo đã cập nhật');
  await expect(reader.locator('.inventory-card')).toContainText('Nhãn mới'); await expect(reader.locator(':modal')).toHaveCount(0);
  const after = await inventoryData(reader), product = after.sanPham.find(p => p.MaSP === id)!;
  expect(after.operations.filter(row => String(row.id).startsWith('inventory-edit:'))).toHaveLength(1);
  expect(product).toMatchObject({ GiaBanHienHanh: 120001, GiaGocChuKyGiam: 120001, NgayNhapKho: initial.sanPham[0].NgayNhapKho });
  for (const table of ['hoaDonThuMua', 'purchaseFinalizations', 'purchaseProvenance', 'productCosts', 'khungGiaThuMua']) expect(after[table]).toEqual(initial[table]);
  expect(after.sanPham.find(p => p.MaSP !== id)).toEqual(initial.sanPham.find(p => p.MaSP !== id));
  await reader.reload(); await expect(reader.locator('.inventory-card')).toContainText('120.001'); expect(errors).toEqual([]);
});

test('G7 stale editor reloads the real current form after conflict and never overwrites another tab', async ({ page, context }, info) => {
  await createInventoryThroughUI(page); const id = String((await inventoryData(page)).sanPham[0].MaSP);
  const form = await openInventoryEditor(page, id), other = await context.newPage(); await other.goto('./'); await login(other);
  const otherForm = await openInventoryEditor(other, id);
  await form.getByLabel('Giá bán hiện tại (đồng)', { exact: true }).fill('140000');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await closeNotice(page, 'Cập nhật thành công!');
  await otherForm.getByLabel('Giá bán hiện tại (đồng)', { exact: true }).fill('150000'); await otherForm.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(other.getByRole('alertdialog')).toContainText('Dữ liệu đã thay đổi');
  await other.screenshot({ path: info.outputPath('stale-editor.png') });
  await other.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(other.getByRole('dialog', { name: 'Sửa thông tin hàng hóa', exact: true }).getByLabel('Giá bán hiện tại (đồng)', { exact: true })).toHaveValue('140000');
  expect((await inventoryData(page)).sanPham.find(p => p.MaSP === id)!.GiaBanHienHanh).toBe(140000);
});

test('G7 native metadata write failure rolls back the whole edit, keeps form and permits one retry', async ({ page }) => {
  await createInventoryThroughUI(page); const before = await inventoryData(page), id = String(before.sanPham[0].MaSP);
  const form = await openInventoryEditor(page, id); await form.getByLabel('Giá bán hiện tại (đồng)', { exact: true }).fill('130000');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'appMetadata' && String(args[0]?.key).startsWith('inventory-attributes:')) { IDBObjectStore.prototype.put = put; throw new DOMException('G7 write failure', 'QuotaExceededError'); }
      return put.apply(this, args);
    };
  });
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await expect(page.getByRole('alertdialog')).toContainText('Không thể cập nhật hàng hóa. Hãy thử lại');
  expect(await inventoryData(page)).toEqual(before);
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await form.getByRole('button', { name: 'Lưu', exact: true }).click(); await closeNotice(page, 'Cập nhật thành công!');
  expect((await inventoryData(page)).sanPham.find(p => p.MaSP === id)!.GiaBanHienHanh).toBe(130000);
});
