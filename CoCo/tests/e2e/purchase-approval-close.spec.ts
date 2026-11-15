import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
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

test('T03 close request details with X preserves list state and data for every decision status', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const staff = await setup(page, context);
  const dialog = page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true });
  const close = dialog.getByRole('button', { name: 'Đóng yêu cầu thu mua', exact: true });
  const initial = await snapshot(page);
  const firstId = await page.locator('.approval-id-link').first().innerText();
  const initialOpener = page.getByRole('button', { name: firstId, exact: true });
  await expect(close).toBeVisible();
  await expect(dialog).toContainText('120.000');
  await expect(dialog.locator('.approval-decision')).toHaveCount(0);
  await expect(close).toBeFocused();
  const desktopGeometry = await dialog.evaluate(element => {
    const header = element.querySelector('header')!.getBoundingClientRect();
    const title = element.querySelector('header h2')!.getBoundingClientRect();
    const button = element.querySelector('.dialog-close')!.getBoundingClientRect();
    const icon = element.querySelector('.dialog-close svg')!.getBoundingClientRect();
    return {
      button: { x: button.x, y: button.y, width: button.width, height: button.height, rightGap: header.right - button.right },
      icon: { width: icon.width, height: icon.height, color: getComputedStyle(element.querySelector('.dialog-close')!).color },
      titleCenterDelta: Math.abs(title.x + title.width / 2 - header.x - header.width / 2),
      verticalCenterDelta: Math.abs(button.y + button.height / 2 - header.y - header.height / 2),
      headerHeight: header.height,
    };
  });
  expect(desktopGeometry.button.width).toBeGreaterThanOrEqual(40);
  expect(desktopGeometry.button.height).toBeGreaterThanOrEqual(40);
  expect(desktopGeometry.button.rightGap).toBe(16);
  expect(desktopGeometry.icon).toEqual({ width: 24, height: 24, color: 'rgb(0, 0, 0)' });
  expect(desktopGeometry.titleCenterDelta).toBeLessThanOrEqual(1);
  expect(desktopGeometry.verticalCenterDelta).toBeLessThanOrEqual(1);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  expect(await close.evaluate(button => button.matches(':focus-visible'))).toBe(true);
  await page.screenshot({ path: info.outputPath('request-close-1440x900.png') });
  await page.keyboard.press('Enter');
  await expectApprovalList(page);
  await expect(initialOpener).toBeFocused();
  expect(await snapshot(page)).toEqual(initial);

  const pageSize = Number(await page.locator('.approval-list').getAttribute('data-page-size'));
  const totalRequests = pageSize + 3;
  for (let index = 1; index < totalRequests; index++) await addProduct(staff);
  await expect.poll(async () => (await snapshot(page)).purchaseApprovals.length).toBe(totalRequests);
  await staff.close();
  const employeeFilter = page.getByLabel('Tìm theo tên nhân viên', { exact: true });
  const dateFilter = page.getByLabel('Ngày gửi', { exact: true });
  const sentOn = await page.evaluate(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  await employeeFilter.fill('Nhân viên T03');
  await dateFilter.fill(sentOn);
  await expect(page.locator('.approval-id-link')).toHaveCount(pageSize);
  await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  await expect(page.locator('.approval-id-link')).toHaveCount(3);
  const [pendingId, approvedId, rejectedId] = await page.locator('.approval-id-link').allInnerTexts();

  async function openRequest(approvalId: string) {
    const opener = page.getByRole('button', { name: approvalId, exact: true });
    await opener.click();
    const requestDialog = page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true });
    await expect(requestDialog).toBeVisible();
    await expect(requestDialog).toContainText('120.000');
    return { opener, requestDialog };
  }
  async function expectListState() {
    await expectApprovalList(page);
    await expect(employeeFilter).toHaveValue('Nhân viên T03');
    await expect(dateFilter).toHaveValue(sentOn);
    await expect(page.getByRole('button', { name: 'Trang 2', exact: true })).toHaveAttribute('aria-current', 'page');
  }
  async function closeWithoutWriting(opener: Locator, requestDialog: Locator, keyboard = false) {
    const beforeClose = await snapshot(page);
    const closeButton = requestDialog.getByRole('button', { name: 'Đóng yêu cầu thu mua', exact: true });
    if (keyboard) {
      await closeButton.focus();
      await page.keyboard.press('Enter');
    } else {
      await closeButton.click();
    }
    await expectListState();
    await expect(opener).toBeFocused();
    expect(await snapshot(page)).toEqual(beforeClose);
  }

  const pending = await openRequest(pendingId);
  await expect(pending.requestDialog.getByRole('button', { name: 'Phê duyệt', exact: true })).toBeVisible();
  await expect(pending.requestDialog.getByRole('button', { name: 'Từ chối', exact: true })).toBeVisible();
  await closeWithoutWriting(pending.opener, pending.requestDialog);

  const approved = await openRequest(approvedId);
  await approved.requestDialog.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  await closeNotice(page, 'Phê duyệt giá thu mua thành công');
  await expectListState();
  const approvedState = await snapshot(page);
  expect(approvedState.purchaseApprovals.find(row => row.id === approvedId)?.decision).toMatchObject({ status: 'approved' });
  const approvedDetail = await openRequest(approvedId);
  await expect(approvedDetail.requestDialog.locator('.approval-decision')).toContainText('Đã phê duyệt');
  await expect(approvedDetail.requestDialog.getByRole('button', { name: 'Phê duyệt', exact: true })).toHaveCount(0);
  await closeWithoutWriting(approvedDetail.opener, approvedDetail.requestDialog, true);

  const rejected = await openRequest(rejectedId);
  await rejected.requestDialog.getByRole('button', { name: 'Từ chối', exact: true }).click();
  const reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  await reason.getByLabel('Lý do từ chối', { exact: true }).fill('Giá cao');
  await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await closeNotice(page, 'Đã từ chối yêu cầu phê duyệt');
  await expectListState();
  const rejectedState = await snapshot(page);
  expect(rejectedState.purchaseApprovals.find(row => row.id === rejectedId)?.decision).toMatchObject({ status: 'rejected', reason: 'Giá cao' });
  const rejectedDetail = await openRequest(rejectedId);
  await expect(rejectedDetail.requestDialog.locator('.approval-decision')).toContainText('Đã từ chối');
  await closeWithoutWriting(rejectedDetail.opener, rejectedDetail.requestDialog);

  const mobile = await openRequest(pendingId);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileGeometry = await mobile.requestDialog.evaluate(element => {
    const header = element.querySelector('header')!.getBoundingClientRect();
    const title = element.querySelector('header h2')!.getBoundingClientRect();
    const button = element.querySelector('.dialog-close')!.getBoundingClientRect();
    return {
      button: { x: button.x, y: button.y, width: button.width, height: button.height },
      titleCenterDelta: Math.abs(title.x + title.width / 2 - header.x - header.width / 2),
      verticalCenterDelta: Math.abs(button.y + button.height / 2 - header.y - header.height / 2),
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  expect(mobileGeometry.button.width).toBeGreaterThanOrEqual(40);
  expect(mobileGeometry.button.height).toBeGreaterThanOrEqual(40);
  expect(mobileGeometry.titleCenterDelta).toBeLessThanOrEqual(1);
  expect(mobileGeometry.verticalCenterDelta).toBeLessThanOrEqual(1);
  expect(mobileGeometry.horizontalOverflow).toBe(0);
  await page.screenshot({ path: info.outputPath('request-close-390x844.png') });
  const beforeMobileClose = await snapshot(page);
  await mobile.requestDialog.getByRole('button', { name: 'Đóng yêu cầu thu mua', exact: true }).click();
  await expectApprovalList(page);
  await expect(employeeFilter).toHaveValue('Nhân viên T03');
  await expect(dateFilter).toHaveValue(sentOn);
  expect(await snapshot(page)).toEqual(beforeMobileClose);
});
