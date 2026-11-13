import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { login } from './auth-helpers';
import { addProduct, closeNotice, expectApprovalList, setup, snapshot } from './purchase-helpers';

const browserErrors = new WeakMap<BrowserContext, string[]>();
test.beforeEach(async ({ context }) => {
  const errors: string[] = [];
  browserErrors.set(context, errors);
  const observe = (page: Page) => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  context.pages().forEach(observe);
  context.on('page', observe);
});
test.afterEach(async ({ context }) => { expect(browserErrors.get(context)).toEqual([]); });

test('T03 approve through UI, independent sessions, live data, search/date and screenshots', async ({ page, context }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const staff = await setup(page, context); staff.on('pageerror', error => errors.push(error.message));
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const dialog = page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true });
    await expect(dialog.getByRole('button', { name: 'Phê duyệt', exact: true })).toBeInViewport();
    await page.screenshot({ path: info.outputPath(`owner-detail-${viewport.width}.png`) });
  }
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await expect(page.getByRole('alertdialog')).toContainText('Phê duyệt giá thu mua thành công');
  const decided = await snapshot(page);
  await closeNotice(page, 'Phê duyệt giá thu mua thành công');
  await expectApprovalList(page);
  await expect(page.locator('.approval-list tbody')).toContainText('Đã phê duyệt');
  expect(await snapshot(page)).toEqual(decided);
  await expect(staff.getByText('Chờ phê duyệt giá', { exact: true })).toHaveCount(0);
  expect((await snapshot(staff)).purchaseLines[0].status).toBe('approved');
  await staff.screenshot({ path: info.outputPath('staff-live-approved.png') });
  await closeNotice(staff, 'Yêu cầu phê duyệt được chấp thuận');
  await addProduct(staff, '80000');
  await expect(staff.locator('.purchase-lines tbody tr')).toHaveCount(2);
  const state = await snapshot(page);
  expect(state.purchaseNotices).toHaveLength(1); expect(state.hoaDonThuMua).toHaveLength(0); expect(state.sanPham).toHaveLength(0);
  await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('missing');
  await expect(page.getByText('Không có yêu cầu cần phê duyệt', { exact: true })).toBeVisible();
  await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('nhân viên t03');
  await expect(page.locator('.approval-id-link')).toHaveCount(1);
  await page.getByLabel('Ngày gửi', { exact: true }).fill('2000-01-01');
  await expect(page.locator('.approval-id-link')).toHaveCount(0);
  await page.getByLabel('Ngày gửi', { exact: true }).fill('');
  await expect(page.locator('.approval-id-link')).toHaveCount(1);
  await page.locator('.page-header').click();
  await page.screenshot({ path: info.outputPath('owner-list.png') });
  await expect(staff.getByRole('link', { name: 'Phê duyệt', exact: true })).toHaveCount(0);
  await staff.goto(page.url());
  await expect(staff.getByRole('heading', { name: 'Không có quyền truy cập', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nhân viên', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('T03 reject requires reason, cancel preserves data and shared decision updates live', async ({ page, context }, info) => {
  const staff = await setup(page, context);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  let reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(reason.getByText('Hãy nhập lý do từ chối', { exact: true })).toBeVisible();
  await reason.getByLabel('Lý do từ chối', { exact: true }).fill('x'.repeat(101));
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(reason.getByText('Lý do từ chối tối đa 100 ký tự', { exact: true })).toBeVisible();
  await reason.getByRole('button', { name: 'Hủy', exact: true }).click();
  expect((await snapshot(page)).purchaseNotices).toHaveLength(0);
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await reason.getByLabel('Lý do từ chối', { exact: true }).fill('Giá đề xuất vượt ngân sách');
  await reason.getByRole('heading', { name: 'Lý do từ chối', exact: true }).click();
  await page.screenshot({ path: info.outputPath('owner-rejection-reason.png') });
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'purchaseApprovals') { IDBObjectStore.prototype.put = original; throw new DOMException('T03 rejection failure', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(page, 'Không thể lưu kết quả từ chối');
  await expect(reason.getByLabel('Lý do từ chối', { exact: true })).toHaveValue('Giá đề xuất vượt ngân sách');
  expect((await snapshot(page)).purchaseNotices).toHaveLength(0);
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Đã từ chối yêu cầu phê duyệt');
  await page.screenshot({ path: info.outputPath('owner-rejected.png') });
  const decided = await snapshot(page);
  await closeNotice(page, 'Đã từ chối yêu cầu phê duyệt');
  await expectApprovalList(page);
  await expect(page.locator('.approval-list tbody')).toContainText('Đã từ chối');
  expect(await snapshot(page)).toEqual(decided);
  expect(decided.purchaseApprovals[0].decision).toMatchObject({ status: 'rejected', reason: 'Giá đề xuất vượt ngân sách' });
  await expect(staff.getByText('Chờ phê duyệt giá', { exact: true })).toHaveCount(0);
  expect((await snapshot(staff)).purchaseLines[0].status).toBe('rejected');
  expect((await snapshot(page)).purchaseNotices).toHaveLength(1);
  await expect(page.getByRole('button', { name: 'Phê duyệt', exact: true })).toHaveCount(0);
});

for (const action of ['approve', 'reject'] as const) test(`T03 ${action} write failure rolls back, retry commits once and delivery failure preserves the decision`, async ({ page, context }) => {
  await setup(page, context);
  const before = await snapshot(page);
  if (action === 'reject') {
    await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
    await page.getByRole('dialog', { name: 'Lý do từ chối', exact: true }).getByLabel('Lý do từ chối', { exact: true }).fill('Giá cao');
  }
  const submit = action === 'approve' ? page.getByRole('button', { name: 'Phê duyệt', exact: true })
    : page.getByRole('dialog', { name: 'Lý do từ chối', exact: true }).getByRole('button', { name: 'Xác nhận', exact: true });
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      if (this.name === 'auditEntries') { IDBObjectStore.prototype.add = original; throw new DOMException('T03 test failure', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  await submit.click();
  await closeNotice(page, action === 'approve' ? 'Không thể lưu kết quả phê duyệt' : 'Không thể lưu kết quả từ chối');
  await expect(page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await page.evaluate(() => {
    const original = BroadcastChannel.prototype.postMessage;
    BroadcastChannel.prototype.postMessage = function (message) {
      if (this.name === 'coco:purchase-approvals') { BroadcastChannel.prototype.postMessage = original; throw new Error('T03 delivery failure'); }
      return original.call(this, message);
    };
  });
  await submit.click();
  await closeNotice(page, 'Kết quả phê duyệt chưa được gửi đi');
  await expect(page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toBeVisible();
  const saved = await snapshot(page);
  expect(saved.purchaseApprovals[0].decision).toMatchObject({ status: action === 'approve' ? 'approved' : 'rejected' });
  expect(saved.purchaseNotices).toHaveLength(1);
  await page.keyboard.press('Escape'); await page.locator('.approval-id-link').click();
  await expect(page.locator('.approval-decision')).toContainText(action === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối');
  expect(await snapshot(page)).toEqual(saved);
});

for (const action of ['remove', 'cancel'] as const) test(`T03 refuses a request after employee ${action}`, async ({ page, context }) => {
  const staff = await setup(page, context);
  if (action === 'remove') await staff.getByRole('button', { name: 'Xóa Áo CoCo', exact: true }).click();
  else await staff.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Yêu cầu không còn đủ điều kiện phê duyệt');
  expect((await snapshot(page)).purchaseNotices).toHaveLength(0);
});

test('T03 two owner tabs racing preserve a single decision and notice', async ({ page, context }) => {
  await setup(page, context);
  const second = await context.newPage(); await second.goto('./'); await login(second); await second.goto(page.url());
  await expect(second.getByRole('button', { name: 'Phê duyệt', exact: true })).toBeVisible();
  await Promise.all([page, second].map(tab => tab.getByRole('button', { name: 'Phê duyệt', exact: true }).evaluate(button => (button as HTMLButtonElement).click())));
  const messages = await Promise.all([page, second].map(async tab => { await expect(tab.getByRole('alertdialog')).toBeVisible(); return tab.getByRole('alertdialog').innerText(); }));
  expect(messages.filter(message => message.includes('Phê duyệt giá thu mua thành công'))).toHaveLength(1);
  expect(messages.filter(message => message.includes('Yêu cầu không còn đủ điều kiện phê duyệt'))).toHaveLength(1);
  expect((await snapshot(page)).purchaseNotices).toHaveLength(1);
});

for (const action of ['approve', 'reject'] as const) test(`T03 ${action}: dismiss success with Escape, preserve filters and open another request without overlay`, async ({ page, context }, info) => {
  const staff = await setup(page, context);
  await page.keyboard.press('Escape');
  await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('Nhân viên T03');
  const sentOn = await page.evaluate(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  await page.getByLabel('Ngày gửi', { exact: true }).fill(sentOn);
  await addProduct(staff);
  await expect(page.locator('.approval-id-link')).toHaveCount(2);
  const requestId = await page.locator('.approval-id-link').first().innerText();
  await page.locator('.approval-id-link').first().click();
  if (action === 'approve') await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  else {
    await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
    const reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
    await reason.getByLabel('Lý do từ chối', { exact: true }).fill('Giá cao');
    await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  }
  await expect(page.getByRole('alertdialog')).toContainText(action === 'approve' ? 'Phê duyệt giá thu mua thành công' : 'Đã từ chối yêu cầu phê duyệt');
  const decided = await snapshot(page);
  await page.keyboard.press('Escape');
  await expectApprovalList(page);
  await expect(page.getByLabel('Tìm theo tên nhân viên', { exact: true })).toHaveValue('Nhân viên T03');
  await expect(page.getByLabel('Ngày gửi', { exact: true })).toHaveValue(sentOn);
  await expect(page.locator('.approval-list tbody tr').filter({ hasText: requestId })).toContainText(action === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối');
  expect(await snapshot(page)).toEqual(decided);
  await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('missing');
  await expect(page.locator('.approval-id-link')).toHaveCount(0);
  await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('Nhân viên T03');
  await page.locator('.approval-list tbody tr').filter({ hasText: 'Chờ phê duyệt' }).getByRole('button').click();
  await expect(page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phê duyệt', exact: true })).toBeEnabled();
  await page.keyboard.press('Escape');
  await expectApprovalList(page);
  await page.locator('.page-header').click();
  await page.screenshot({ path: info.outputPath(`${action}-closed-to-list.png`) });
  expect(await snapshot(page)).toEqual(decided);
});

test('T03 real requests paginate and list read error recovers through navigation', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  const staff = await setup(page, context);
  await page.keyboard.press('Escape');
  for (let index = 1; index < 12; index++) await addProduct(staff);
  const total = (await snapshot(page)).purchaseApprovals.length;
  expect(total).toBe(12);
  const pageSize = Number(await page.locator('.approval-list').getAttribute('data-page-size'));
  await expect(page.locator('.approval-id-link')).toHaveCount(Math.min(pageSize, total));
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('.approval-id-link')).toHaveCount(total - pageSize);
  await page.screenshot({ path: info.outputPath('owner-list-page-2.png') });
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'purchaseApprovals') throw new DOMException('T03 list failure', 'UnknownError');
      return original.apply(this, args);
    };
    window.addEventListener('t03:restore-read', () => { IDBObjectStore.prototype.getAll = original; }, { once: true });
  });
  await page.getByRole('link', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Lỗi! Không thể truy cập');
  await page.evaluate(() => window.dispatchEvent(new Event('t03:restore-read')));
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await page.getByRole('link', { name: 'Phê duyệt', exact: true }).click();
  await expect(page.locator('.approval-id-link')).toHaveCount(Math.min(pageSize, total));
});

