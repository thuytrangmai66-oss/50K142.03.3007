import { expect, test, type Page } from '@playwright/test';
import { addStaffFixture, bootstrapOwner, login } from './auth-helpers';

async function createCustomer(page: Page, name: string, phone: string) {
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill(name); await form.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Đã thêm thông tin khách hàng');
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
}
for (const role of ['owner', 'staff'] as const) test(`${role}: existing purchase customer follows local Figma phone suggestion and selected states`, async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await bootstrapOwner(page); if (role === 'staff') await addStaffFixture(page);
  await login(page, role, role === 'owner' ? 'only-for-tests!' : 'staff-test!');
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await createCustomer(page, 'Nguyễn Văn An', '0987654321'); await createCustomer(page, 'Trần Thị Bình', '0912345678');
  await page.getByRole('link', { name: 'Thu mua', exact: true }).click(); await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
  const phone = page.getByLabel('Số điện thoại', { exact: true }), name = page.getByLabel('Họ tên', { exact: true });
  const choices = page.getByRole('group', { name: 'Khách hàng tìm thấy', exact: true });
  await phone.fill('098765432'); await expect(choices).toHaveCount(0); await expect(name).toHaveValue('');
  await phone.fill('0987654321'); await expect(choices.getByRole('button', { name: 'Nguyễn Văn An', exact: true })).toBeVisible();
  await expect(choices).not.toContainText('0987654321');
  expect(await choices.getByRole('button').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(174, 174, 178)');
  const geometry = await page.locator('.purchase-customer').evaluate(el => {
    const input = el.querySelector('.customer-phone-lookup .field-input')!.getBoundingClientRect();
    const suggestions = el.querySelector('.customer-suggestions')!.getBoundingClientRect();
    const label = el.querySelector(':scope > .coco-field label')!.getBoundingClientRect();
    return { gap: suggestions.top - input.bottom, overlap: suggestions.bottom - label.top };
  });
  expect(Math.abs(geometry.gap)).toBeLessThanOrEqual(1); expect(geometry.overlap).toBeLessThanOrEqual(0);
  await expect(page.locator('.purchase-lines tbody tr')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath(`${role}-existing-suggestion.png`), fullPage: false });
  if (role === 'owner') {
    await page.evaluate(() => { const original = IDBObjectStore.prototype.put; IDBObjectStore.prototype.put = function (...args) { if (this.name === 'purchaseDrafts') { IDBObjectStore.prototype.put = original; throw new DOMException('Không thể lưu khách hàng', 'QuotaExceededError'); } return original.apply(this, args); }; });
    await choices.getByRole('button', { name: 'Nguyễn Văn An', exact: true }).click();
    await expect(page.locator('.result-dialog.result-error')).toBeVisible(); await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    await expect(name).toHaveValue(''); await expect(choices).toBeVisible(); await expect(page).toHaveURL(/\/purchases\/new$/);
  }
  await choices.getByRole('button', { name: 'Nguyễn Văn An', exact: true }).click(); await expect(name).toHaveValue('Nguyễn Văn An');
  await expect(choices).toHaveCount(0); await expect(page).toHaveURL(/\/purchases\/D[0-9a-f]+$/);
  await page.reload(); await expect(phone).toHaveValue('0987654321'); await expect(name).toHaveValue('Nguyễn Văn An'); await expect(choices).toHaveCount(0);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport); await expect(name).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath(`${role}-selected-${viewport.width}x${viewport.height}.png`), fullPage: false });
  }
  await phone.fill('0900000099'); await expect(page.getByText('Khách hàng không tồn tại', { exact: true })).toBeVisible(); await expect(name).toHaveValue('');
  await expect(page.locator('.purchase-customer-heading').getByRole('button', { name: '+ Thêm khách hàng', exact: true })).toBeVisible();
  const positions = await page.locator('.purchase-customer').evaluate(el => ({ error: el.querySelector('.customer-not-found')!.getBoundingClientRect().bottom, name: el.querySelector(':scope > .coco-field label')!.getBoundingClientRect().top }));
  expect(positions.error).toBeLessThanOrEqual(positions.name);
  await page.screenshot({ path: info.outputPath(`${role}-not-found.png`), fullPage: false });
  await phone.fill('0987654321'); await phone.fill('0912345678');
  await expect(choices.getByRole('button', { name: 'Trần Thị Bình', exact: true })).toBeVisible(); await expect(choices).not.toContainText('Nguyễn Văn An');
  await choices.getByRole('button', { name: 'Trần Thị Bình', exact: true }).click();
  await expect(name).toHaveValue('Trần Thị Bình'); await expect(choices).toHaveCount(0); await page.reload();
  await expect(phone).toHaveValue('0912345678'); await expect(name).toHaveValue('Trần Thị Bình'); await expect(choices).toHaveCount(0);
  expect(errors).toEqual([]);
});
