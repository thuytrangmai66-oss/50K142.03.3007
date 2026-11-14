import { expect, test, type Page } from '@playwright/test';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { closeNotice } from './purchase-helpers';
import { login } from './auth-helpers';
import { PURCHASE_STATUS_MAPPING } from '../../src/domain/purchase-status';

type ProductRow = { MaSP: string; GiaBanHienHanh: number; TrangThai: number };

async function openSalesFromSidebar(page: Page) {
  const salesLink = page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Bán hàng', exact: true });
  for (const name of ['Trang chủ', 'Khách hàng', 'Hàng hóa', 'Thu mua']) {
    await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name, exact: true }).click();
    await expect(salesLink).toHaveCount(1);
    await expect(salesLink).toBeVisible();
    await expect(salesLink).not.toHaveClass(/active/);
  }
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await salesLink.click();
  await expect(salesLink).toHaveClass(/active/);
  await expect(page).toHaveURL(/#\/sales$/);
  await page.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
}

async function addProduct(page: Page, productId: string) {
  await page.getByRole('textbox', { name: 'Mã sản phẩm', exact: true }).fill(productId);
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
}

for (const role of ['owner', 'staff'] as const) test(`G8-T01 ${role}: mapped products remain draft-only`, async ({ page, context }, info) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await createInventoryThroughUI(page, '2');
  const owner = page;
  const products = (await inventoryData(owner)).sanPham as ProductRow[];
  expect(products).toHaveLength(2);
  expect(products.map(product => product.TrangThai)).toEqual([1, 1]);

  let salesPage = owner;
  if (role === 'staff') {
    await owner.getByRole('link', { name: 'Nhân viên', exact: true }).click();
    await owner.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const form = owner.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
    for (const [label, value] of [['Họ tên', 'Nhân viên G8'], ['Số điện thoại', '0900000082'], ['Tên đăng nhập', 'staffg8'], ['Mật khẩu', 'g8-staff!']]) {
      await form.getByLabel(label, { exact: true }).fill(value);
    }
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(owner, 'Tạo tài khoản mới thành công');
    salesPage = await context.newPage();
    salesPage.on('pageerror', error => errors.push(error.message));
    await salesPage.goto('./');
    await login(salesPage, 'staffg8', 'g8-staff!');
  }

  await openSalesFromSidebar(salesPage);
  await expect(salesPage.getByRole('heading', { name: 'Phiếu bán hàng', exact: true })).toBeVisible();
  await salesPage.locator('.purchase-payment h2').click();
  await salesPage.screenshot({ path: info.outputPath(`${role}-cart-empty-1440x900.png`) });
  await salesPage.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(salesPage, 'Hãy thêm ít nhất một sản phẩm');

  await addProduct(salesPage, products[0].MaSP);
  await expect(salesPage.locator('.purchase-lines tbody tr')).toHaveCount(1);
  await addProduct(salesPage, products[0].MaSP);
  await closeNotice(salesPage, 'Sản phẩm đã có trong giỏ hàng');
  await expect(salesPage.locator('.purchase-lines tbody tr')).toHaveCount(1);
  await addProduct(salesPage, products[1].MaSP);
  await expect(salesPage.locator('.purchase-lines tbody tr')).toHaveCount(2);
  await expect(salesPage.locator('.purchase-payment .sales-grand-total')).toContainText('208.014');
  expect(await salesPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await salesPage.locator('.purchase-payment h2').click();
  await salesPage.screenshot({ path: info.outputPath(`${role}-cart-1440x900.png`), fullPage: false });

  for (const viewport of [{ width: 1452, height: 770 }, { width: 760, height: 700 }, { width: 390, height: 844 }]) {
    await salesPage.setViewportSize(viewport);
    const layout = await salesPage.evaluate(() => {
      const card = document.querySelector<HTMLElement>('.purchase-payment')!.getBoundingClientRect();
      const customer = document.querySelector<HTMLElement>('.purchase-customer')!.getBoundingClientRect();
      const actions = document.querySelector<HTMLElement>('.purchase-payment .form-actions')!.getBoundingClientRect();
      const methodButtons = Array.from(document.querySelectorAll<HTMLElement>('.sales-payment-method button')).map(button => button.getBoundingClientRect());
      const headings = Array.from(document.querySelectorAll<HTMLElement>('.purchase-customer h2, .purchase-payment h2')).map(heading => {
        const style = getComputedStyle(heading);
        return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight];
      });
      const amountEnds = Array.from(document.querySelectorAll<HTMLElement>('.purchase-payment .purchase-total > strong + strong'))
        .map(amount => amount.getBoundingClientRect().right);
      return {
        card: { left: card.left, right: card.right, top: card.top, bottom: card.bottom },
        customer: { left: customer.left, right: customer.right },
        actions: { left: actions.left, right: actions.right, top: actions.top, bottom: actions.bottom },
        methodButtons: methodButtons.map(button => ({ top: button.top, bottom: button.bottom })),
        headings,
        amountEnds,
        mainOverflowY: getComputedStyle(document.querySelector<HTMLElement>('#main-content')!).overflowY,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(Math.abs(layout.customer.left - layout.card.left)).toBeLessThan(1);
    expect(Math.abs(layout.customer.right - layout.card.right)).toBeLessThan(1);
    expect(layout.actions.left).toBeGreaterThanOrEqual(layout.card.left);
    expect(layout.actions.right).toBeLessThanOrEqual(layout.card.right);
    expect(layout.actions.top).toBeGreaterThanOrEqual(layout.methodButtons[0].bottom);
    expect(Math.abs(layout.methodButtons[0].top - layout.methodButtons[1].top)).toBeLessThan(1);
    expect(Math.abs(layout.methodButtons[0].bottom - layout.methodButtons[1].bottom)).toBeLessThan(1);
    expect(layout.headings[0]).toEqual(layout.headings[1]);
    expect(Math.max(...layout.amountEnds) - Math.min(...layout.amountEnds)).toBeLessThan(1);
    expect(layout.mainOverflowY).toBe('visible');
    if (viewport.height === 770) {
      await salesPage.screenshot({ path: info.outputPath(`${role}-cart-1452x770-full.png`), fullPage: true });
    }
    await salesPage.locator('.purchase-payment .button-secondary').scrollIntoViewIfNeeded();
    await expect(salesPage.locator('.purchase-payment .button-secondary')).toBeInViewport({ ratio: 1 });
    if (viewport.height === 770) {
      await salesPage.screenshot({ path: info.outputPath(`${role}-cart-1452x770.png`) });
    }
  }
  await salesPage.setViewportSize({ width: 1440, height: 900 });

  const draftId = salesPage.url().match(/sales\/(D[a-f0-9]+)/)?.[1];
  expect(draftId).toBeTruthy();
  await salesPage.reload();
  await expect(salesPage.locator('.purchase-lines tbody tr')).toHaveCount(2);
  await expect(salesPage.getByRole('link', { name: 'Bán hàng', exact: true })).toHaveClass(/active/);
  await expect(salesPage.locator('.purchase-payment .sales-grand-total')).toContainText('208.014');
  await salesPage.getByRole('button', { name: `Xóa sản phẩm ${products[1].MaSP}`, exact: true }).click();
  await expect(salesPage.locator('.purchase-lines tbody tr')).toHaveCount(1);
  await expect(salesPage.locator('.purchase-payment .sales-grand-total')).toContainText('104.007');
  await salesPage.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(salesPage, 'Hãy nhập đầy đủ thông tin');
  expect(errors).toEqual([]);

  const rows = await inventoryData(salesPage);
  expect(rows.hoaDonBanHang).toHaveLength(0);
  expect(rows.chiTietHoaDonBH).toHaveLength(0);
  expect(rows.memberships).toHaveLength(0);
  expect((rows.sanPham as ProductRow[]).map(product => product.TrangThai)).toEqual([
    PURCHASE_STATUS_MAPPING.productAvailable, PURCHASE_STATUS_MAPPING.productAvailable,
  ]);
  expect(JSON.parse((rows.appMetadata as Array<{ key: string; value: string }>).find(row => row.key === `sales-draft:${draftId}`)!.value).status).toBe('editing');

  await salesPage.getByRole('button', { name: 'Hủy', exact: true }).click();
  const afterCancel = await inventoryData(salesPage);
  expect(JSON.parse((afterCancel.appMetadata as Array<{ key: string; value: string }>).find(row => row.key === `sales-draft:${draftId}`)!.value).status).toBe('cancelled');
  expect(afterCancel.hoaDonBanHang).toHaveLength(0);
});

for (const role of ['owner', 'staff'] as const) test(`G8-T02 ${role}: explicit membership opt-in persists before payment`, async ({ page, context }, info) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await createInventoryThroughUI(page, '2');
  const products = (await inventoryData(page)).sanPham as ProductRow[];

  let salesPage = page;
  if (role === 'staff') {
    await page.getByRole('link', { name: 'Nhân viên', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
    for (const [label, value] of [['Họ tên', 'Nhân viên G8'], ['Số điện thoại', '0900000082'], ['Tên đăng nhập', 'staffg8'], ['Mật khẩu', 'g8-staff!']]) {
      await form.getByLabel(label, { exact: true }).fill(value);
    }
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Tạo tài khoản mới thành công');
    salesPage = await context.newPage();
    salesPage.on('pageerror', error => errors.push(error.message));
    await salesPage.goto('./');
    await login(salesPage, 'staffg8', 'g8-staff!');
  }

  await openSalesFromSidebar(salesPage);
  await salesPage.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  await salesPage.getByRole('button', { name: 'Khách G7', exact: true }).click();
  await salesPage.getByRole('checkbox', { name: 'Khách hàng đồng ý đăng ký thành viên' }).check();
  await expect(salesPage.locator('.sales-membership-status')).toContainText('Thành viên · Điểm: 0');

  const customerId = (await inventoryData(salesPage)).khachHang.find(customer => customer.SoDienThoaiKH === '0900000081')?.MaKH as string;
  expect(customerId).toBeTruthy();
  let saved = await inventoryData(salesPage);
  expect(saved.memberships).toHaveLength(1);
  expect(saved.memberships[0]).toMatchObject({ MaKH: customerId, registeredBy: role === 'owner' ? 'owner' : 'staffg8' });
  expect(saved.hoaDonBanHang).toHaveLength(0);
  expect(saved.khachHang.find(customer => customer.MaKH === customerId)?.DiemTichLuy).toBe(0);

  await salesPage.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('khachHang', 'readwrite'), store = tx.objectStore('khachHang');
      const read = store.getAll();
      read.onsuccess = () => {
        const customer = (read.result as Array<Record<string, unknown>>).find(row => row.SoDienThoaiKH === '0900000081');
        if (!customer) { tx.abort(); reject(new Error('Fixture customer missing')); return; }
        store.put({ ...customer, DiemTichLuy: 50 });
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
  await salesPage.reload();
  await salesPage.getByLabel('Số điện thoại', { exact: true }).fill('0900000081');
  await salesPage.getByRole('button', { name: 'Khách G7', exact: true }).click();
  await expect(salesPage.locator('.sales-membership-status')).toContainText('Thành viên · Điểm: 50');
  await addProduct(salesPage, products[0].MaSP);
  await expect(salesPage.getByRole('checkbox', { name: 'Dùng 50 điểm giảm 20%' })).toHaveCount(0);
  await expect(salesPage.locator('.purchase-payment .purchase-total').filter({ hasText: 'Khuyến mãi' })).toContainText('-20.801');
  await expect(salesPage.locator('.purchase-payment .sales-grand-total')).toContainText('83.206');

  for (const viewport of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 1440, height: 900 }]) {
    await salesPage.setViewportSize(viewport);
    for (const label of ['Lưu', 'Hủy']) {
      const button = salesPage.getByRole('button', { name: label, exact: true });
      await expect(button).toBeInViewport({ ratio: 1 });
    }
    expect(await salesPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await salesPage.screenshot({ path: info.outputPath(`${role}-membership-preview-${viewport.width}x${viewport.height}.png`), fullPage: false });
  }
  await salesPage.getByRole('button', { name: `Xóa sản phẩm ${products[0].MaSP}`, exact: true }).click();
  await expect(salesPage.getByRole('heading', { name: 'Phiếu bán hàng', exact: true })).toBeVisible();
  await expect(salesPage.getByRole('checkbox', { name: 'Dùng 50 điểm giảm 20%' })).toHaveCount(0);
  await expect(salesPage.locator('.purchase-payment .sales-grand-total')).toContainText('0');
  await addProduct(salesPage, products[0].MaSP);
  await expect(salesPage.getByRole('checkbox', { name: 'Dùng 50 điểm giảm 20%' })).toHaveCount(0);
  await expect(salesPage.locator('.purchase-payment .sales-grand-total')).toContainText('83.206');

  await salesPage.getByRole('button', { name: 'Hủy', exact: true }).click();
  saved = await inventoryData(salesPage);
  expect(saved.memberships).toHaveLength(1);
  expect(saved.khachHang.find(customer => customer.MaKH === customerId)?.DiemTichLuy).toBe(50);
  expect(saved.hoaDonBanHang).toHaveLength(0);
  expect(saved.chiTietHoaDonBH).toHaveLength(0);
  expect((saved.sanPham as ProductRow[]).map(product => product.TrangThai)).toEqual([
    PURCHASE_STATUS_MAPPING.productAvailable, PURCHASE_STATUS_MAPPING.productAvailable,
  ]);
  expect(errors).toEqual([]);
});
