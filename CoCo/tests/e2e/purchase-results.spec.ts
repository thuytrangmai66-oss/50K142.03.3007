import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { login } from './auth-helpers';
import { setup, snapshot, closeNotice, expectApprovalList } from './purchase-helpers';

const browserErrors = new WeakMap<BrowserContext, string[]>();
test.beforeEach(async ({ context }) => {
  const errors: string[] = []; browserErrors.set(context, errors);
  const observe = (page: Page) => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  context.pages().forEach(observe); context.on('page', observe);
});
test.afterEach(async ({ context }) => { expect(browserErrors.get(context)).toEqual([]); });

test('T04 approval reaches the creator live, is acknowledged once and survives replay/reload', async ({ page, context }, info) => {
  const errors: string[] = []; context.on('weberror', error => errors.push(error.error().message));
  const staff = await setup(page, context);
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Phê duyệt giá thu mua thành công');
  await expectApprovalList(page);
  await expect(staff.getByRole('alertdialog')).toContainText('Yêu cầu phê duyệt được chấp thuận');
  await expect(staff.locator('.purchase-lines')).toContainText('Đã phê duyệt');
  await staff.screenshot({ path: info.outputPath('staff-approval-result.png') });
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await staff.setViewportSize(viewport);
    await expect(staff.getByRole('button', { name: 'Đóng thông báo', exact: true })).toBeInViewport();
    await staff.screenshot({ path: info.outputPath(`staff-approved-${viewport.width}.png`) });
  }
  await closeNotice(staff, 'Yêu cầu phê duyệt được chấp thuận');
  await expect(staff.locator(':modal')).toHaveCount(0);
  const saved = await snapshot(staff);
  expect(saved.purchaseNotices[0]).toMatchObject({ delivery: 'delivered', readAt: expect.any(String) });
  await page.locator('.approval-id-link').click();
  await expect(page.locator('.approval-decision')).toContainText('Đã phê duyệt');
  await staff.reload();
  await expect(staff.locator('.purchase-lines')).toContainText('Đã phê duyệt');
  await expect(staff.getByRole('alertdialog')).toHaveCount(0);
  expect(await snapshot(staff)).toEqual(saved);
  await expect(staff.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true })).toBeEnabled();
  expect(errors).toEqual([]);
});

for (const price of ['80000', '130000']) test(`T04 rejection reason and real price revision ${price}, immutable history and new snapshot`, async ({ page, context }, info) => {
  const staff = await setup(page, context);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  const reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await reason.getByLabel('Lý do từ chối', { exact: true }).fill('Cửa hàng còn nhiều hàng tồn');
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(page, 'Đã từ chối yêu cầu phê duyệt');
  const old = (await snapshot(staff)).purchaseApprovals[0];
  await expect(staff.getByRole('alertdialog')).toContainText('Yêu cầu phê duyệt bị từ chối');
  await staff.screenshot({ path: info.outputPath('staff-rejection-result.png') });
  await staff.getByRole('button', { name: 'Xem lý do', exact: true }).click();
  const readReason = staff.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await expect(readReason.getByLabel('Lý do từ chối', { exact: true })).toHaveValue('Cửa hàng còn nhiều hàng tồn');
  await expect(readReason.getByLabel('Lý do từ chối', { exact: true })).toHaveAttribute('readonly', '');
  await staff.screenshot({ path: info.outputPath('staff-read-reason.png') });
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await staff.setViewportSize(viewport);
    await expect(readReason.getByRole('button', { name: 'Đóng biểu mẫu', exact: true })).toBeInViewport();
    await staff.screenshot({ path: info.outputPath(`staff-reason-${viewport.width}.png`) });
  }
  await readReason.getByRole('button', { name: 'Đóng biểu mẫu', exact: true }).click();
  const pricing = staff.getByRole('dialog', { name: 'Thông tin sản phẩm', exact: true });
  await expect(pricing).toBeVisible();
  await pricing.getByLabel('Giá thu mua đề xuất', { exact: true }).fill('0');
  await pricing.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(pricing.getByText('Hãy nhập lại giá thu mua', { exact: true })).toBeVisible();
  await pricing.getByLabel('Giá thu mua đề xuất', { exact: true }).fill(price);
  await pricing.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  if (price === '130000') await closeNotice(staff, 'Giá thu mua vượt mức, cần được phê duyệt');
  await expect(staff.locator('.purchase-lines tbody tr')).toHaveCount(1);
  const saved = await snapshot(staff);
  expect(saved.purchaseApprovals.find(item => item.id === old.id)).toEqual(old);
  expect(saved.purchaseLines[0]).toMatchObject({ revision: 2, unitCost: Number(price), quantity: 1, status: price === '80000' ? 'priced' : 'pending' });
  expect(saved.hoaDonThuMua).toHaveLength(0); expect(saved.sanPham).toHaveLength(0);
  if (price === '130000') {
    await expect(page.locator('.approval-id-link')).toHaveCount(2);
    await page.locator('.approval-list tbody tr').filter({ hasText: 'Chờ phê duyệt' }).getByRole('button').click();
    await expect(page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toContainText('130.000');
    await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
    await closeNotice(page, 'Phê duyệt giá thu mua thành công');
    await closeNotice(staff, 'Yêu cầu phê duyệt được chấp thuận');
    await expect(staff.locator('.purchase-lines')).toContainText('Đã phê duyệt');
  }
});

test('T04 unread result recovers after signal failure and two creator tabs display it once', async ({ page, context }) => {
  const staff = await setup(page, context), draftUrl = staff.url();
  await staff.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  const second = await context.newPage(); await second.goto('./'); await login(second, 'staff03', 't03-staff!');
  await page.evaluate(() => {
    const original = BroadcastChannel.prototype.postMessage;
    BroadcastChannel.prototype.postMessage = function (message) {
      if (this.name === 'coco:purchase-approvals') { BroadcastChannel.prototype.postMessage = original; throw new Error('T04 test signal failure'); }
      return original.call(this, message);
    };
  });
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Kết quả phê duyệt chưa được gửi đi');
  await Promise.all([staff.goto(draftUrl), second.goto(draftUrl)]);
  await expect.poll(async () => (await staff.getByRole('alertdialog').count()) + (await second.getByRole('alertdialog').count())).toBe(1);
  const recipient = await staff.getByRole('alertdialog').count() ? staff : second;
  await closeNotice(recipient, 'Yêu cầu phê duyệt được chấp thuận');
  await expect(staff.getByRole('alertdialog')).toHaveCount(0);
  await expect(second.getByRole('alertdialog')).toHaveCount(0);
  const saved = await snapshot(staff);
  expect(saved.purchaseNotices).toHaveLength(1);
  expect(saved.purchaseNotices[0].delivery).toBe('delivered');
  await Promise.all([staff.reload(), second.reload()]);
  await expect(staff.locator('.purchase-lines')).toContainText('Đã phê duyệt');
  await expect(second.locator('.purchase-lines')).toContainText('Đã phê duyệt');
  await expect(staff.getByRole('alertdialog')).toHaveCount(0);
  await expect(second.getByRole('alertdialog')).toHaveCount(0);
  expect(await snapshot(staff)).toEqual(saved);
});

test('T04 acknowledgement and price write failures retain the dialog, rollback and retry once', async ({ page, context }) => {
  const staff = await setup(page, context);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  const reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await reason.getByLabel('Lý do từ chối', { exact: true }).fill('Giá cao');
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(page, 'Đã từ chối yêu cầu phê duyệt');
  await expect(staff.getByRole('alertdialog')).toContainText('Yêu cầu phê duyệt bị từ chối');
  await staff.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === 'auditEntries') { IDBObjectStore.prototype.add = original; throw new DOMException('T04 acknowledgement failure', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  const before = await snapshot(staff);
  await staff.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(staff.getByRole('alert')).toHaveText('Không thể ghi nhận đã xem kết quả');
  expect(await snapshot(staff)).toEqual(before);
  await closeNotice(staff, 'Yêu cầu phê duyệt bị từ chối');
  const pricing = staff.getByRole('dialog', { name: 'Thông tin sản phẩm', exact: true });
  await expect(pricing).toBeVisible();
  const acknowledged = await snapshot(staff);
  await pricing.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect(await snapshot(staff)).toEqual(acknowledged);
  await staff.getByRole('button', { name: 'Nhập lại giá Áo CoCo', exact: true }).click();
  await pricing.getByLabel('Giá thu mua đề xuất', { exact: true }).fill('130000');
  await staff.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'purchaseLines') { IDBObjectStore.prototype.put = original; throw new DOMException('T04 price failure', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  await pricing.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(staff.getByRole('alertdialog')).toBeVisible();
  await staff.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(pricing.getByLabel('Giá thu mua đề xuất', { exact: true })).toHaveValue('130000');
  expect(await snapshot(staff)).toEqual(acknowledged);
  await pricing.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(staff, 'Giá thu mua vượt mức, cần được phê duyệt');
  expect((await snapshot(staff)).purchaseApprovals).toHaveLength(2);
  await expect(staff.locator('.purchase-lines tbody tr')).toHaveCount(1);
});

