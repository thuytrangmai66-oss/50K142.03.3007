import { expect, test, type Page } from '@playwright/test';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';
import { setup, closeNotice, expectApprovalList } from './purchase-helpers';
import { inventoryData } from './inventory-helpers';

// Benign alert probe: a handler records/dismisses it, so unsafe rendering fails
// the assertion instead of leaving the browser blocked on a JavaScript dialog.
const htmlName = '<svg onload=alert(1)>', htmlReason = '<img src=x onerror=alert(2)>';
function observe(page: Page, errors: string[], dialogs: string[]) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('dialog', dialog => { dialogs.push(dialog.type()); void dialog.dismiss(); });
}
async function noInjectedMarkup(page: Page) {
  await expect(page.locator('main svg[onload], main img[onerror], dialog svg[onload], dialog img[onerror]')).toHaveCount(0);
}

for (const role of ['owner', 'staff'] as const) test(`G10-T04 ${role}: persisted HTML customer name stays literal through detail, history and reload`, async ({ page }, info) => {
  const errors: string[] = [], dialogs: string[] = [];
  observe(page, errors, dialogs);
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill(htmlName);
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900010010');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Đã thêm thông tin khách hàng');
  const link = page.getByRole('link', { name: htmlName, exact: true });
  await expect(link).toBeVisible(); await expect(link.locator('svg')).toHaveCount(0);
  const saved = await inventoryData(page);
  expect(saved.khachHang).toHaveLength(1);
  expect(saved.khachHang[0]).toMatchObject({ TenKH: htmlName, SoDienThoaiKH: '0900010010', DiemTichLuy: 0 });
  await link.click();
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue(htmlName);
  await noInjectedMarkup(page);
  for (const history of ['Lịch sử mua', 'Lịch sử bán']) {
    await page.getByRole('link', { name: history, exact: true }).click();
    await noInjectedMarkup(page);
    expect(await inventoryData(page)).toEqual(saved);
    await page.getByRole('link', { name: 'Quay lại', exact: true }).click();
  }
  await page.reload();
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue(htmlName);
  expect(await inventoryData(page)).toEqual(saved);
  await noInjectedMarkup(page);
  await page.screenshot({ path: info.outputPath(`${role}-literal-customer.png`) });
  expect(dialogs).toEqual([]); expect(errors).toEqual([]);
});

test('G10-T04 rejection HTML is stored literally, delivered across tabs and harmless after owner reload', async ({ page, context }, info) => {
  const errors: string[] = [], dialogs: string[] = [];
  observe(page, errors, dialogs);
  context.on('page', target => observe(target, errors, dialogs));
  const staff = await setup(page, context);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  const reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await reason.getByLabel('Lý do từ chối', { exact: true }).fill(htmlReason);
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(page, 'Đã từ chối yêu cầu phê duyệt');
  await expectApprovalList(page);
  await expect(staff.getByRole('alertdialog')).toContainText('Yêu cầu phê duyệt bị từ chối');
  await staff.getByRole('button', { name: 'Xem lý do', exact: true }).click();
  await expect(staff.getByRole('dialog', { name: 'Lý do từ chối', exact: true }).getByLabel('Lý do từ chối', { exact: true })).toHaveValue(htmlReason);
  await noInjectedMarkup(staff);
  await staff.screenshot({ path: info.outputPath('staff-literal-rejection.png') });
  const stored = await inventoryData(page);
  expect(stored.purchaseApprovals).toHaveLength(1);
  expect(stored.purchaseApprovals[0].decision).toMatchObject({ status: 'rejected', reason: htmlReason });
  expect(stored.hoaDonThuMua).toHaveLength(0); expect(stored.sanPham).toHaveLength(0);
  await page.locator('.approval-id-link').click();
  await expect(page.getByRole('status').filter({ hasText: htmlReason })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: htmlReason })).toBeVisible();
  await noInjectedMarkup(page);
  expect(await inventoryData(page)).toEqual(stored);
  await page.screenshot({ path: info.outputPath('owner-literal-rejection.png') });
  expect(dialogs).toEqual([]); expect(errors).toEqual([]);
});
