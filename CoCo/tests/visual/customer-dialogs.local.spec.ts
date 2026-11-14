import { expect, test, type Page, type BrowserContext, type TestInfo } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { bootstrapOwner, login, addStaffFixture } from '../e2e/auth-helpers';
import { createInventoryThroughUI, inventoryData } from '../e2e/inventory-helpers';
import { closeNotice } from '../e2e/purchase-helpers';

type State = 'confirm' | 'linked' | 'success' | 'failure';
const messages: Record<State, string> = {
  confirm: 'Có chắc chắn xóa thông tin khách hàng không?',
  linked: 'Không thể xóa khách hàng đã phát sinh giao dịch thu mua hoặc bán hàng',
  success: 'Đã xóa thông tin khách hàng', failure: 'Xóa không thành công',
};
const cases = [
  { id: 'SC101', role: 'owner', state: 'confirm' }, { id: 'SC102', role: 'owner', state: 'linked' },
  { id: 'SC103', role: 'owner', state: 'success' }, { id: 'SC104', role: 'owner', state: 'failure' },
  { id: 'SC294', role: 'staff', state: 'confirm' }, { id: 'SC295', role: 'staff', state: 'linked' },
  { id: 'SC296', role: 'staff', state: 'success' }, { id: 'SC297', role: 'staff', state: 'failure' },
] as const;
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  launchOptions: { args: ['--disable-lcd-text', '--font-render-hinting=none'] } });

async function reference(context: BrowserContext, id: string) {
  const index: { id: string; source: string; sourceSha256: string; rasterSha256: string; width: number; height: number }[] =
    JSON.parse(await readFile('planning/phase10/evidence/audit/reference-raster-inventory.json', 'utf8'));
  const entry = index.find(row => row.id === id);
  if (!entry) throw new Error(`Missing private source metadata for ${id}; render CODEX references first`);
  const sourceFile = path.resolve('..', entry.source.replaceAll('\\', '/'));
  const sourceBytes = await readFile(sourceFile);
  expect(createHash('sha256').update(sourceBytes).digest('hex')).toBe(entry.sourceSha256);
  const png = await readFile(`planning/phase10/evidence/reference-cache/${id}.png`);
  expect(createHash('sha256').update(png).digest('hex')).toBe(entry.rasterSha256);
  const source = await context.newPage();
  await source.setViewportSize({ width: entry.width, height: entry.height });
  await source.setContent(`<style>body{margin:0}img{display:block}</style><img src="data:image/png;base64,${png.toString('base64')}">`);
  await source.locator('img').evaluate(image => (image as HTMLImageElement).decode());
  // In these eight inspected clean exports, only the modal stays opaque white
  // above the dimmed page. Include its one-pixel border, with no masking/scaling.
  const clip = await source.locator('img').evaluate(image => {
    const img = image as HTMLImageElement, canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, right = 0, top = canvas.height, bottom = 0, white = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (pixels[i] >= 250 && pixels[i + 1] >= 250 && pixels[i + 2] >= 250 && pixels[i + 3] === 255) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); white++;
      }
    }
    if (white < 20000 || left < 1 || top < 1 || right >= canvas.width - 1 || bottom >= canvas.height - 1) throw new Error('Source modal bounds require manual review');
    return { x: left - 1, y: top - 1, width: right - left + 3, height: bottom - top + 3 };
  });
  const expected = await source.screenshot({ clip }); await source.close();
  return { entry, expected, clip };
}

async function createCustomer(page: Page) {
  await page.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await form.getByLabel('Họ tên', { exact: true }).fill('Khách visual G10');
  await form.getByLabel('Số điện thoại', { exact: true }).fill('0900010030');
  await form.getByRole('button', { name: 'Lưu', exact: true }).click();
  await closeNotice(page, 'Đã thêm thông tin khách hàng');
}

async function compare(target: Page, info: TestInfo, ref: Awaited<ReturnType<typeof reference>>, id: string, role: string, state: State) {
  const dialog = state === 'confirm' ? target.locator('.confirm-dialog') : target.getByRole('alertdialog');
  await expect(dialog).toBeVisible(); await target.evaluate(() => document.fonts.ready);
  expect.soft((await dialog.getByRole('heading').textContent())?.trim()).toBe(messages[state]);
  const actualBox = await dialog.boundingBox();
  const typography = await dialog.getByRole('heading').evaluate(el => {
    const style = getComputedStyle(el), range = document.createRange();
    range.selectNodeContents(el);
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d')!;
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return { font: context.font, lineHeight: style.lineHeight,
      lines: Array.from(range.getClientRects(), box => box.toJSON()),
      confirmFirstLineWidth: context.measureText('Có chắc chắn xóa thông tin').width };
  });
  const baseline = info.snapshotPath(`${id}.png`);
  await mkdir(path.dirname(baseline), { recursive: true }); await writeFile(baseline, ref.expected);
  const actual = await target.screenshot({ clip: ref.clip });
  await writeFile(info.outputPath(`${id}-actual.png`), actual);
  await dialog.screenshot({ path: info.outputPath(`${id}-dialog.png`) });
  await writeFile(info.outputPath(`${id}-measurement.json`), JSON.stringify({ id, role, state,
    scope: 'Customer deletion modal only; not a full-screen SC verdict',
    sourceSha256: ref.entry.sourceSha256, rasterSha256: ref.entry.rasterSha256,
    viewport: { width: ref.entry.width, height: ref.entry.height }, dpr: 1,
    sourceBounds: ref.clip, actualBox, typography, masks: [], threshold: .2, maxDiffPixelRatio: .01, geometryTolerancePx: 2 }, null, 2));
  for (const key of ['x', 'y', 'width', 'height'] as const) expect.soft(Math.abs(actualBox![key] - ref.clip[key]), `${id} ${key}`).toBeLessThanOrEqual(2);
  expect.soft(actual).toMatchSnapshot(`${id}.png`, { threshold: .2, maxDiffPixelRatio: .01 });
}

for (const item of cases) test(`${item.id} ${item.role} ${item.state}: exact private source comparison and actual deletion rules`, async ({ page, context }, info) => {
  const ref = await reference(context, item.id), errors: string[] = [];
  const observe = (target: Page) => {
    target.on('pageerror', error => errors.push(error.message));
    target.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  observe(page); context.on('page', observe);
  let target = page;
  if (item.state === 'linked') {
    await createInventoryThroughUI(page);
    if (item.role === 'staff') { await addStaffFixture(page); target = await context.newPage(); await target.goto('./'); await login(target, 'staff', 'staff-test!'); }
  } else {
    await bootstrapOwner(page); if (item.role === 'staff') await addStaffFixture(page);
    await login(page, item.role, item.role === 'owner' ? 'only-for-tests!' : 'staff-test!');
    await createCustomer(page);
  }
  await target.setViewportSize({ width: ref.entry.width, height: ref.entry.height });
  await target.getByRole('link', { name: 'Khách hàng', exact: true }).click();
  await target.getByRole('link', { name: item.state === 'linked' ? 'Khách G7' : 'Khách visual G10', exact: true }).click();
  const before = await inventoryData(target);
  await target.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click();
  if (item.state !== 'confirm') {
    if (item.state === 'failure') await target.evaluate(() => {
      const original = IDBObjectStore.prototype.delete;
      IDBObjectStore.prototype.delete = function (...args) {
        if (this.name === 'khachHang') { IDBObjectStore.prototype.delete = original; throw new DOMException('Local visual delete failure', 'QuotaExceededError'); }
        return original.apply(this, args);
      };
    });
    await target.locator('.confirm-dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
  }
  await compare(target, info, ref, item.id, item.role, item.state);
  if (item.state === 'confirm') await target.locator('.confirm-dialog').getByRole('button', { name: 'Hủy', exact: true }).click();
  if (item.state === 'success') expect((await inventoryData(target)).khachHang).toHaveLength(0);
  else expect(await inventoryData(target)).toEqual(before);
  expect(errors).toEqual([]);
  await writeFile(info.outputPath(`${item.id}-behavior.json`), JSON.stringify({ id: item.id, role: item.role, state: item.state,
    businessAssertionsExecuted: true, data: item.state === 'success' ? 'Selected customer deleted' : 'All stores unchanged',
    browserErrors: 0, visualVerdict: 'Recorded separately by Playwright; business success does not override visual failures' }, null, 2));
});
