import { expect, type Page } from '@playwright/test';

export const emptyLists = ['staff', 'sales', 'purchases', 'inventory', 'customers', 'approvals', 'price-brackets'];
export const emptyReports = ['revenue', 'purchase-cost', 'profit', 'cash-flow', 'aged-stock'];

export async function createCustomerForEmptyHistory(page: Page) {
  await page.goto('./#/customers');
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo thông tin khách hàng', exact: true });
  await dialog.getByLabel('Họ tên', { exact: true }).fill('Khách kiểm tra lịch sử');
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0900000088');
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await page.getByRole('link', { name: 'Khách kiểm tra lịch sử', exact: true }).click();
  return page.url();
}

export async function emptyGeometry(page: Page) {
  await expect(page.locator('.empty-state')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page.locator('.empty-state').evaluate(element => {
    const box = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
    const icon = element.querySelector('svg')!, table = element.closest('table')!, css = getComputedStyle(element), svg = getComputedStyle(icon);
    const range = document.createRange();
    const textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())!;
    range.selectNode(textNode); const text = range.getBoundingClientRect();
    return { message: element.textContent, table: box(table), container: box(table.parentElement!), header: box(table.tHead!), body: box(table.tBodies[0]), empty: box(element), icon: box(icon),
      text: { x: text.x, y: text.y, width: text.width, height: text.height, bottom: text.bottom },
      style: { fontFamily: css.fontFamily, fontSize: css.fontSize, fontWeight: css.fontWeight, lineHeight: css.lineHeight, letterSpacing: css.letterSpacing,
        color: css.color, direction: css.flexDirection, gap: css.gap, textAlign: css.textAlign, alignItems: css.alignItems, justifyContent: css.justifyContent,
        iconColor: svg.color, stroke: svg.stroke, strokeWidth: svg.strokeWidth, iconWidth: svg.width, iconHeight: svg.height },
      pageX: document.documentElement.scrollWidth - innerWidth,
    };
  });
}

export async function openEmptyReport(page: Page, kind: string) {
  await page.goto(`./#/reports/${kind}`);
  if (kind !== 'aged-stock') {
    await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
    await page.getByLabel('Năm', { exact: true }).fill('2000');
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  } else {
    await page.getByLabel('Số ngày tồn tối thiểu', { exact: true }).fill('60');
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  }
  await expect(page.locator('.empty-state')).toBeVisible();
}
