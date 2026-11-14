import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Explicit G10 local source gate. These cases require private CODEX/raster
// references; they never silently skip and do not replace the default CI suite.
export default defineConfig(base, {
  testDir: './tests/visual',
  testMatch: '**/*.local.spec.ts',
  outputDir: './test-results/visual-local',
  reporter: 'line',
  retries: 0,
});
