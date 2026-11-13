import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const cocoRoot = 'D:/50K142-NEW/CoCo';

async function main() {
  let readyResolve;
  const readyPromise = new Promise((res, rej) => {
    readyResolve = res;
    setTimeout(() => rej(new Error('Vite timeout')), 15000);
  });
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: cocoRoot,
  });
  server.stdout?.on('data', d => {
    if (d.toString().includes('4173')) readyResolve();
  });

  try {
    const baseUrl = 'http://127.0.0.1:4173/50K142.03.3007/';
    await readyPromise;

    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // Bootstrap owner if needed
    const heading = await page.locator('h1, h2').first().innerText().catch(() => '');
    if (heading.includes('Thiết lập')) {
      await page.getByLabel('Họ tên:', { exact: true }).fill('Chủ kiểm thử');
      await page.getByLabel('Số điện thoại:', { exact: true }).fill('0900000001');
      await page.getByLabel('Tên đăng nhập:', { exact: true }).fill('owner');
      await page.getByLabel('Mật khẩu:', { exact: true }).fill('only-for-tests!');
      await page.getByRole('button', { name: 'Tạo tài khoản chủ', exact: true }).click();
      await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    }
    const loginHeading = await page.getByRole('heading', { name: 'Đăng nhập' }).count();
    if (loginHeading > 0) {
      await page.getByLabel('Tên đăng nhập:', { exact: true }).fill('owner');
      await page.getByLabel('Mật khẩu:', { exact: true }).fill('only-for-tests!');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
    }

    // Measure Thu mua
    await page.getByRole('link', { name: 'Thu mua', exact: true }).click();
    await page.waitForTimeout(500);

    const tmMeasurements = await page.evaluate(() => {
      const header = document.querySelector('.page-header');
      const form = document.querySelector('.purchase-search');
      const table = document.querySelector('.paginated-table');
      const tableScroll = document.querySelector('.data-table-scroll');
      const th = document.querySelector('.data-table th');
      const td = document.querySelector('.data-table td');
      const headerRect = header?.getBoundingClientRect();
      const formRect = form?.getBoundingClientRect();
      const tableRect = table?.getBoundingClientRect();
      const tableScrollRect = tableScroll?.getBoundingClientRect();

      const getStyle = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          color: s.color,
          margin: s.margin,
          marginTop: s.marginTop,
          marginBottom: s.marginBottom,
          padding: s.padding,
          borderRadius: s.borderRadius,
          background: s.backgroundColor,
        };
      };

      const labels = Array.from(form?.querySelectorAll('label') || []).map(l => ({
        text: l.childNodes[0]?.textContent?.trim(),
        ...getStyle(l),
      }));
      const inputs = Array.from(form?.querySelectorAll('input') || []).map(i => ({
        placeholder: i.placeholder,
        ...getStyle(i),
      }));

      return {
        headerRect,
        formRect,
        tableRect,
        tableScrollRect,
        headerToFormDistance: formRect && headerRect ? formRect.top - headerRect.bottom : null,
        formToTableDistance: formRect && tableRect ? tableRect.top - formRect.bottom : null,
        formToTableScrollDistance: formRect && tableScrollRect ? tableScrollRect.top - formRect.bottom : null,
        headerStyle: getStyle(header),
        formStyle: getStyle(form),
        labels,
        inputs,
        thStyle: getStyle(th),
        tdStyle: getStyle(td),
        paginationStyle: getStyle(document.querySelector('.pagination')),
        paginationBtnStyle: getStyle(document.querySelector('.pagination button')),
      };
    });

    // Measure Hàng hóa
    await page.getByRole('link', { name: 'Hàng hóa', exact: true }).click();
    await page.waitForTimeout(500);

    const hhMeasurements = await page.evaluate(() => {
      const header = document.querySelector('.page-header');
      const form = document.querySelector('.inventory-search');
      const heading = document.querySelector('.inventory-list-heading');
      const table = document.querySelector('.paginated-table');
      const tableScroll = document.querySelector('.data-table-scroll');
      const th = document.querySelector('.data-table th');
      const td = document.querySelector('.data-table td');
      const headerRect = header?.getBoundingClientRect();
      const formRect = form?.getBoundingClientRect();
      const headingRect = heading?.getBoundingClientRect();
      const tableRect = table?.getBoundingClientRect();
      const tableScrollRect = tableScroll?.getBoundingClientRect();

      const getStyle = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          color: s.color,
          margin: s.margin,
          marginTop: s.marginTop,
          marginBottom: s.marginBottom,
          padding: s.padding,
          borderRadius: s.borderRadius,
          background: s.backgroundColor,
        };
      };

      const labels = Array.from(form?.querySelectorAll('label') || []).map(l => ({
        text: l.childNodes[0]?.textContent?.trim(),
        ...getStyle(l),
      }));
      const inputs = Array.from(form?.querySelectorAll('input, select') || []).map(i => ({
        tag: i.tagName,
        placeholder: i.placeholder,
        ...getStyle(i),
      }));
      const scanBtn = getStyle(form?.querySelector('.inventory-scan'));

      return {
        headerRect,
        formRect,
        headingRect,
        tableRect,
        tableScrollRect,
        headerToFormDistance: formRect && headerRect ? formRect.top - headerRect.bottom : null,
        formToHeadingDistance: formRect && headingRect ? headingRect.top - formRect.bottom : null,
        formToTableDistance: formRect && tableRect ? tableRect.top - formRect.bottom : null,
        formToTableScrollDistance: formRect && tableScrollRect ? tableScrollRect.top - formRect.bottom : null,
        headerStyle: getStyle(header),
        formStyle: getStyle(form),
        headingStyle: getStyle(heading),
        labels,
        inputs,
        scanBtn,
        thStyle: getStyle(th),
        tdStyle: getStyle(td),
        paginationStyle: getStyle(document.querySelector('.pagination')),
        paginationBtnStyle: getStyle(document.querySelector('.pagination button')),
      };
    });

    console.log('=== THU MUA ===');
    console.log(JSON.stringify(tmMeasurements, null, 2));
    console.log('=== HANG HOA ===');
    console.log(JSON.stringify(hhMeasurements, null, 2));

    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch(console.error);
