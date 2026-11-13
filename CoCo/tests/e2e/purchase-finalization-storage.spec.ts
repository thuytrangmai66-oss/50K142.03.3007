import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

test('T05 native storage transaction rolls back, retries, reserves IDs and serializes connections', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const bundle = await build({ entryPoints: [path.resolve('tests/fixtures/purchase-finalization-browser.ts')],
    bundle: true, write: false, platform: 'browser', format: 'iife', globalName: 'T05NativeHarness', target: 'es2022' });
  await page.goto('./'); await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const result = await page.evaluate(() => (window as unknown as {
    T05NativeHarness: { runFinalizationStorageScenario(): Promise<unknown> }
  }).T05NativeHarness.runFinalizationStorageScenario());
  expect(result).toEqual({ nativeVersion: 40, rolledBack: true, replay: true, initialProducts: 2,
    initialPrices: [104007, 104007], raceWinners: 1, invoices: 2, products: 3, issued: 5 });
  expect(errors).toEqual([]);
  await writeFile(info.outputPath('native-finalization-storage.json'), JSON.stringify(result, null, 2));
});
