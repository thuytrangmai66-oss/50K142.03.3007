import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Evidence writer only. Run from CoCo/ after the checks finish.
const dir = 'planning/phase7/evidence/t01';
const read = file => { const b = fs.readFileSync(file); return JSON.parse(b.toString(b[0] === 255 && b[1] === 254 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, '')); };
const write = (name, value) => fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + '\n');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = ['src/services/inventory.ts', 'src/features/inventory/InventoryPages.tsx', 'src/features/auth/context.ts',
  'src/features/auth/AuthProvider.tsx', 'src/services/reference-data/local.ts', 'src/app/router.tsx',
  'src/components/layout/CoCoLayout.tsx', 'src/index.css', 'tests/unit/inventory.test.ts', 'tests/e2e/inventory.spec.ts'];
write('source-manifest.json', files.map(file => ({ path: file, sha256: hash(file) })));
write('screenshots.json', fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort().map(file => ({ file, sha256: hash(path.join(dir, file)) })));
const unit = read(`${dir}/vitest.json`);
write('unit-catalog.json', unit.testResults.flatMap(file => file.assertionResults.map(t => ({ file: path.relative(process.cwd(), file.name).replaceAll('\\', '/'), name: t.fullName, status: t.status, durationMs: t.duration }))));
if (fs.existsSync(`${dir}/playwright.json`)) {
  const browser = read(`${dir}/playwright.json`), catalog = [];
  const visit = suites => suites.forEach(suite => {
    (suite.specs ?? []).forEach(spec => spec.tests.forEach(t => catalog.push({ file: spec.file, line: spec.line, name: spec.title, outcome: t.status,
      attempts: t.results.map(r => ({ status: r.status, retry: r.retry, durationMs: r.duration })) })));
    visit(suite.suites ?? []);
  });
  visit(browser.suites); write('chromium-catalog.json', catalog);
  write('execution.json', {
    generatedAt: new Date().toISOString(), branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    checks: read(`${dir}/checks.json`), finalCodeChecks: read(`${dir}/final-code-checks.json`),
    build: read(`${dir}/build-exit.json`), chromiumExit: read(`${dir}/e2e-exit.json`),
    unit: { pass: unit.numPassedTests, fail: unit.numFailedTests, skip: unit.numPendingTests, files: unit.testResults.length },
    chromium: browser.stats,
    dependenciesUnchangedAgainstHead: execFileSync('git', ['diff', 'HEAD', '--', 'package.json', 'package-lock.json'], { encoding: 'utf8' }).length === 0,
    audit: { rerun: false, knownStatus: 'FAIL from G6-T07; 13 package findings', evidence: '../../../phase6/evidence/t07/npm-audit.json' },
    status: { G6: 'PENDING REVIEW', G7: 'IN PROGRESS', T01: 'PARTIAL/PENDING REVIEW' },
    blocked: ['barcode payload mapping', 'Q10 staff price cycle reset', 'Q12 discount rounding', 'P10 below-20000 policy'],
    notImplemented: ['T02 edit producer', 'T03 cycle updates', 'T04 scheduler', 'T05 run locking/logs', 'T06 monitor'],
    constraints: 'No schema migration, dependency change, commit, push, deploy, seed or user-data reset',
  });
  console.log(JSON.stringify({ unit: unit.numPassedTests, chromium: browser.stats }));
}
