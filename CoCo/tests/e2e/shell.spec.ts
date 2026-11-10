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

test('upgrades phase 1 browser data without deleting existing metadata or seeding accounts', async ({ page }) => {
  // Serve the origin once with the app bundle paused so the old database can
  // be constructed in this test's isolated browser context before app startup.
  await page.route('**/assets/*.js', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.goto('./');
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    // Dexie maps logical version 1 to native IndexedDB version 10.
    const request = indexedDB.open('CoCoDB', 10);
    request.onupgradeneeded = () => request.result.createObjectStore('appMetadata', { keyPath: 'key' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const connection = request.result;
      const tx = connection.transaction('appMetadata', 'readwrite');
      tx.objectStore('appMetadata').put({ key: 'phase-1-sentinel', value: 'preserve' });
      tx.oncomplete = () => { connection.close(); resolve(); };
      tx.onerror = () => { connection.close(); reject(tx.error); };
    };
  }));
  await page.unroute('**/assets/*.js');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Trang chủ', exact: true })).toBeVisible();
  const preserved = await page.evaluate(() => new Promise<{ value: string; nativeVersion: number; accounts: number }>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const connection = request.result;
      const tx = connection.transaction(['appMetadata', 'taiKhoan']);
      const metadata = tx.objectStore('appMetadata').get('phase-1-sentinel');
      const accounts = tx.objectStore('taiKhoan').count();
      tx.oncomplete = () => {
        resolve({ value: metadata.result.value, nativeVersion: connection.version, accounts: accounts.result });
        connection.close();
      };
      tx.onerror = () => { connection.close(); reject(tx.error); };
    };
  }));
  expect(preserved).toEqual({ value: 'preserve', nativeVersion: 20, accounts: 0 });
});
