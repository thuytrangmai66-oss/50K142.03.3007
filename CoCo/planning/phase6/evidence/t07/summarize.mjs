import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Run from CoCo/. Evidence only: reads project/test files, writes this folder.
const dir = 'planning/phase6/evidence/t07';
const read = file => {
  const bytes = fs.readFileSync(file);
  return JSON.parse(bytes.toString(bytes[0] === 255 && bytes[1] === 254 ? 'utf16le' : 'utf8').replace(/^\uFEFF/, ''));
};
const write = (name, value) => fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + '\n');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const audit = read(`${dir}/npm-audit.json`), lock = read('package-lock.json');
const vulnerabilities = Object.values(audit.vulnerabilities).map(v => ({
  name: v.name, severity: v.severity, direct: v.isDirect,
  nodes: v.nodes.map(node => ({ path: node, version: lock.packages[node]?.version, dev: Boolean(lock.packages[node]?.dev) })),
  advisories: v.via.filter(item => typeof item !== 'string'), fixAvailable: v.fixAvailable,
}));
write('audit-summary.json', { counts: audit.metadata.vulnerabilities, vulnerabilities });
const baseline = read('planning/phase6/evidence/t06/source-manifest.json');
write('t06-preservation.json', baseline.map(item => ({ ...item, actualSha256: hash(item.path), unchanged: hash(item.path) === item.sha256 })));
const newFiles = ['tests/e2e/g6-verification.spec.ts', 'tests/fixtures/g6-migration-verification.ts', `${dir}/summarize.mjs`];
write('source-manifest.json', [...baseline.map(item => item.path), ...newFiles].map(file => ({ path: file, sha256: hash(file) })));
write('screenshots.json', fs.readdirSync(dir).filter(name => name.endsWith('.png')).sort().map(name => ({ file: name, sha256: hash(path.join(dir, name)) })));
const unit = read(`${dir}/vitest.json`);
write('unit-test-catalog.json', unit.testResults.flatMap(file => file.assertionResults.map(test => ({
  file: path.relative(process.cwd(), file.name).replaceAll('\\', '/'), name: test.fullName, status: test.status, durationMs: test.duration,
}))));
const before = read(`${dir}/vitest-first-run.json`);
write('initial-failures.json', before.testResults.flatMap(file => file.assertionResults.filter(test => test.status === 'failed').map(test => ({
  file: path.relative(process.cwd(), file.name).replaceAll('\\', '/'), name: test.fullName, durationMs: test.duration, failures: test.failureMessages,
}))));
if (fs.existsSync(`${dir}/playwright.json`)) {
  const browser = read(`${dir}/playwright.json`), catalog = [];
  const visit = suites => suites.forEach(suite => {
    (suite.specs ?? []).forEach(spec => spec.tests.forEach(test => catalog.push({
      file: spec.file, line: spec.line, name: spec.title, outcome: test.status,
      attempts: test.results.map(result => ({ status: result.status, retry: result.retry, durationMs: result.duration })),
    })));
    visit(suite.suites ?? []);
  });
  visit(browser.suites); write('chromium-test-catalog.json', catalog);
  write('execution.json', {
    generatedAt: new Date().toISOString(), scope: 'T07 verification only; application source unchanged; T06 read-error test oracle corrected',
    checks: read(`${dir}/checks.json`), unitFinal: read(`${dir}/unit-exit-final.json`), build: read(`${dir}/build-exit.json`),
    firstUnitRun: { pass: before.numPassedTests, fail: before.numFailedTests, skip: before.numPendingTests },
    finalUnitRun: { pass: unit.numPassedTests, fail: unit.numFailedTests, skip: unit.numPendingTests, files: unit.testResults.length },
    chromium: browser.stats, chromiumExit: read(`${dir}/e2e-exit.json`),
    staticAudit: read(`${dir}/static-audit.json`), npmAudit: { exit: read(`${dir}/npm-audit-exit.json`), counts: audit.metadata.vulnerabilities },
    t06ManifestUnchanged: baseline.every(item => hash(item.path) === item.sha256),
    productionSourceUnchanged: baseline.filter(item => item.path.startsWith('src/')).every(item => hash(item.path) === item.sha256),
    changedT06Files: baseline.filter(item => hash(item.path) !== item.sha256).map(item => item.path),
    status: { T05: 'PENDING REVIEW', T06: 'PENDING REVIEW', T07: 'PENDING REVIEW', G6: 'PENDING REVIEW' },
    blocked: ['BR-UC1-16 employee in detail UI', 'BR-UC1-16 / UC_4.6 status in detail UI'],
    acceptance: 'Not granted; visual final acceptance pending; dependency audit failed',
  });
}
console.log(JSON.stringify({ unitPass: unit.numPassedTests, unitFail: unit.numFailedTests, audit: audit.metadata.vulnerabilities,
  t06Changed: baseline.filter(item => hash(item.path) !== item.sha256).length }));
