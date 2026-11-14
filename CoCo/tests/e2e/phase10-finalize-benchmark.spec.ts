import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import { createInventoryThroughUI, inventoryData } from './inventory-helpers';
import { addProduct, closeNotice } from './purchase-helpers';
import { login } from './auth-helpers';
import { selectCustomer, add } from './sales-helpers';

type Measurement = { iteration: number; warmup: boolean; productsBefore: number; elapsedMs: number };
function summarize(samples: Measurement[]) {
  const sorted = samples.filter(sample => !sample.warmup).map(sample => sample.elapsedMs).sort((a, b) => a - b);
  expect(sorted).toHaveLength(5);
  expect(sorted.every(value => Number.isFinite(value) && value >= 0)).toBe(true);
  return { samples, p50Ms: sorted[Math.ceil(sorted.length * .5) - 1], p95Ms: sorted[Math.ceil(sorted.length * .95) - 1] };
}

for (const role of ['owner', 'staff'] as const) for (const records of [25, 1000]) test(`G10-T05 ${role} ${records}: measure real purchase and cash-sale commits without an invented SLA`, async ({ page, context }, info) => {
  test.setTimeout(120_000); // 12 UI transactions plus a real 25/1000-item setup.
  const errors: string[] = [], external: string[] = [];
  const origin = new URL(String(info.project.use.baseURL)).origin;
  context.on('page', target => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  context.on('request', request => { const url = new URL(request.url()); if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) external.push(url.origin); });
  // All fixture invoices, products and provenance are created by the real UI.
  await createInventoryThroughUI(page, String(records));
  let target = page;
  if (role === 'staff') {
    await page.getByRole('link', { name: 'Nhân viên', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Tạo tài khoản nhân viên', exact: true });
    for (const [label, value] of [['Họ tên', 'Nhân viên đo G10'], ['Số điện thoại', '0900010020'], ['Tên đăng nhập', 'g10measure'], ['Mật khẩu', 'g10-measure!']]) await form.getByLabel(label, { exact: true }).fill(value);
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    await closeNotice(page, 'Tạo tài khoản mới thành công');
    target = await context.newPage(); await target.goto('./'); await login(target, 'g10measure', 'g10-measure!');
  }
  const base = await inventoryData(target);
  expect(base.sanPham).toHaveLength(records);
  const purchase: Measurement[] = [], sale: Measurement[] = [];
  for (let iteration = 0; iteration < 6; iteration++) {
    await target.getByRole('link', { name: 'Thu mua', exact: true }).click();
    await target.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await addProduct(target, '80005', '1');
    await selectCustomer(target);
    let started = await target.evaluate(() => performance.now());
    await target.locator('.purchase-payment').getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(target.getByRole('alertdialog')).toContainText('Thu mua sản phẩm thành công');
    purchase.push({ iteration, warmup: iteration === 0, productsBefore: records + iteration, elapsedMs: await target.evaluate(() => performance.now()) - started });
    const bought = await inventoryData(target);
    expect(bought.hoaDonThuMua).toHaveLength(iteration + 2);
    expect(bought.sanPham).toHaveLength(records + iteration + 1);
    await closeNotice(target, 'Thu mua sản phẩm thành công');

    await target.getByRole('link', { name: 'Bán hàng', exact: true }).click();
    await target.getByRole('button', { name: 'Tạo giao dịch', exact: true }).click();
    await selectCustomer(target); await add(target, String(base.sanPham[iteration].MaSP));
    started = await target.evaluate(() => performance.now());
    await target.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(target.getByRole('alertdialog')).toContainText('Thanh toán thành công!');
    sale.push({ iteration, warmup: iteration === 0, productsBefore: records + iteration + 1, elapsedMs: await target.evaluate(() => performance.now()) - started });
    const sold = await inventoryData(target);
    expect(sold.hoaDonBanHang).toHaveLength(iteration + 1);
    expect(sold.hoaDonBanHang.every(invoice => invoice.TongTien === 104007 && invoice.PTTT === 1 && invoice.TrangThai === 1)).toBe(true);
    expect(sold.sanPham.filter(product => product.TrangThai === 2)).toHaveLength(iteration + 1);
    await closeNotice(target, 'Thanh toán thành công!');
  }
  const saved = await inventoryData(target);
  expect(saved.hoaDonThuMua).toHaveLength(7); expect(saved.hoaDonBanHang).toHaveLength(6);
  expect(saved.purchaseFinalizations).toHaveLength(7);
  expect(saved.purchaseProvenance).toHaveLength(records + 6);
  expect(saved.productCosts).toHaveLength(records + 6);
  const purchaseReceipts = saved.operations.filter(row => String(row.id).startsWith('purchase-finalize:'));
  expect(purchaseReceipts).toHaveLength(7);
  expect(saved.auditEntries.filter(row => String(row.id).startsWith('purchase-finalize:')).map(row => row.id).sort()).toEqual(purchaseReceipts.map(row => row.id).sort());
  expect(saved.sanPham.filter(product => product.TrangThai === 1)).toHaveLength(records);
  expect(saved.khachHang[0].DiemTichLuy).toBe(0);
  await target.reload();
  await expect(target).toHaveURL(/#\/sales$/);
  await expect(target.locator('.sales-list')).toBeVisible();
  expect(await inventoryData(target)).toEqual(saved);
  await target.screenshot({ path: info.outputPath(`${role}-${records}-committed-list.png`) });
  await writeFile(info.outputPath('finalize-benchmark.json'), JSON.stringify({ role, initialProducts: records, warmup: 1, measuredSamples: 5,
    measurement: 'Click Save through visible real success dialog; includes Playwright interaction/auto-wait. Setup, input and verification excluded. No SLA verdict.',
    datasetGrowth: 'Each iteration buys one physical item and sells one; total records grow by one. Per-sample productsBefore records that growth.',
    machine: { os: os.platform(), release: os.release(), cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryGiB: Math.round(os.totalmem() / 2 ** 30), node: process.version },
    browser: context.browser()?.version(), viewport: target.viewportSize(), purchase: summarize(purchase), sale: summarize(sale) }, null, 2));
  expect(errors).toEqual([]); expect(external).toEqual([]);
});
