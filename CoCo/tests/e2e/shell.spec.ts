import { expect, test } from '@playwright/test';

test('shell, fallback route, persisted metadata and local requests', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (['http:', 'https:'].includes(url.protocol) && url.hostname !== '127.0.0.1') external.push(url.href);
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const connection = indexedDB.open('CoCoDB');
    connection.onerror = () => reject(connection.error);
    connection.onsuccess = () => {
      const db = connection.result;
      const tx = db.transaction('appMetadata', 'readwrite');
      tx.objectStore('appMetadata').put({ key: 'reload-proof', value: 'keep' });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  }));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
  const application = await page.evaluate(() => new Promise<string>((resolve, reject) => {
    const connection = indexedDB.open('CoCoDB');
    connection.onerror = () => reject(connection.error);
    connection.onsuccess = () => {
      const db = connection.result;
      const request = db.transaction('appMetadata').objectStore('appMetadata').get('reload-proof');
      request.onsuccess = () => { db.close(); resolve(request.result?.value); };
      request.onerror = () => { db.close(); reject(request.error); };
    };
  }));
  expect(application).toBe('keep');
  await page.goto('./#/unknown');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
  await page.getByRole('link', { name: 'Về trang chủ' }).click();
  await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
  expect(external).toEqual([]);
  await page.screenshot({ path: 'test-results/coco-shell.png', fullPage: true });
});

test('unavailable IndexedDB displays a recoverable startup error', async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.open = () => { throw new DOMException('Storage denied', 'SecurityError'); };
  });
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('Không thể mở dữ liệu CoCo');
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
});
