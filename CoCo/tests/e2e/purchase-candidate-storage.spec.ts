import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

test('T01 native Chromium storage integration: candidate migration, CAS, replay, audit rollback and revoked session; no G6 UI claim', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const bundle = await build({ entryPoints: [path.resolve('tests/fixtures/purchase-candidate-browser.ts')], bundle: true, write: false, platform: 'browser', format: 'iife', globalName: 'G6NativeHarness', target: 'es2022' });
  await page.goto('./'); await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const actual = await page.evaluate(async () => {
    const harness = (window as unknown as { G6NativeHarness: { runCandidateStorageScenario(): Promise<unknown> } }).G6NativeHarness;
    return harness.runCandidateStorageScenario();
  });
  expect(actual).toEqual({ nativeVersion: 40, stores: 27, preservation: true, replay: true, raceWinners: 1, revision: 2, rolledBack: true, revoked: true, invoices: 0, products: 0 });
  expect(errors).toEqual([]);
  const evidence = info.outputPath('native-candidate-storage.json');
  await writeFile(evidence, JSON.stringify(actual, null, 2));
  await info.attach('native-candidate-storage.json', { path: evidence, contentType: 'application/json' });
});

test('T01 native FK integration: mixed-price lines, strict provenance and rollback; no finalize UI claim', async ({ page }, info) => {
  const bundle = await build({ entryPoints: [path.resolve('tests/fixtures/purchase-candidate-browser.ts')], bundle: true, write: false, platform: 'browser', format: 'iife', globalName: 'G6NativeHarness', target: 'es2022' });
  await page.goto('./'); await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const actual = await page.evaluate(() => (window as unknown as { G6NativeHarness: { runCandidateForeignKeys(): Promise<unknown> } }).G6NativeHarness.runCandidateForeignKeys());
  expect(actual).toEqual({ valid: true, rejected: true, rollbackPreservedCost: true, amount: 200001 });
  const evidence = info.outputPath('native-candidate-fk.json'); await writeFile(evidence, JSON.stringify(actual, null, 2));
  await info.attach('native-candidate-fk.json', { path: evidence, contentType: 'application/json' });
});
