import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

interface Attempt { status?: string; duration?: number }
interface Spec { id?: string; title: string; file: string; tests?: { projectName?: string; expectedStatus?: string; results?: Attempt[] }[] }
interface Suite { suites?: Suite[]; specs?: Spec[] }
interface UnitReport {
  startTime?: number;
  success?: boolean;
  testResults?: { name: string; assertionResults?: { title: string; fullName?: string; status?: string; duration?: number }[] }[];
}
export function unitExecutionEvidence(report: UnitReport) {
  if (!Array.isArray(report.testResults)) throw new Error('Unit execution report must contain testResults');
  return report.testResults.flatMap(suite => (suite.assertionResults ?? []).map(assertion => {
    const normalized = suite.name.replaceAll('\\', '/'), relativeStart = normalized.lastIndexOf('/tests/');
    const file = relativeStart >= 0 ? normalized.slice(relativeStart + 1) : path.posix.basename(normalized);
    const title = assertion.fullName ?? assertion.title;
    const executed = Number.isFinite(report.startTime) && Number.isFinite(assertion.duration) && assertion.duration! >= 0;
    const status = ['pending', 'skipped', 'todo', 'disabled'].includes(assertion.status ?? '') ? 'SKIP'
      : assertion.status === 'failed' ? 'FAIL' : assertion.status === 'passed' && executed ? 'PASS' : 'NOT_RUN';
    return { id: createHash('sha256').update(`vitest:${file}:${title}`).digest('hex').slice(0, 24),
      file, title, project: 'vitest', status, durationMs: assertion.duration ?? 0 };
  }));
}
export function executionEvidence(report: { suites?: Suite[] }) {
  if (!Array.isArray(report.suites)) throw new Error('Execution report must contain suites');
  const rows: { id: string; file: string; title: string; project: string; status: string; durationMs: number }[] = [];
  function visit(suite: Suite) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      const attempts = test.results ?? [], last = attempts.at(-1);
      const status = !last ? 'NOT_RUN' : last.status === 'skipped' ? 'SKIP'
        : test.expectedStatus !== 'passed' ? 'NON_STANDARD_EXPECTATION'
          : last.status !== 'passed' ? 'FAIL' : attempts.some(row => row.status !== 'passed') ? 'FLAKY' : 'PASS';
      rows.push({ id: spec.id ?? `${spec.file}:${spec.title}`, file: spec.file.replaceAll('\\', '/'), title: spec.title,
        project: test.projectName ?? '', status, durationMs: attempts.reduce((sum, row) => sum + (row.duration ?? 0), 0) });
    }
    for (const child of suite.suites ?? []) visit(child);
  }
  for (const suite of report.suites) visit(suite);
  return rows;
}

export function referencePath(planningRoot: string, codexRoot: string, link: string) {
  const resolved = path.resolve(planningRoot, decodeURIComponent(link));
  const relative = path.relative(codexRoot, resolved);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Reference escapes CODEX');
  return resolved;
}
function metadata(file: string, repoRoot: string) {
  const bytes = fs.readFileSync(file), png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const pdf = bytes.subarray(0, 5).toString() === '%PDF-', jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!png && !pdf && !jpeg) throw new Error(`Unsupported reference: ${path.basename(file)}`);
  return { path: path.relative(repoRoot, file).replaceAll('\\', '/'), sha256: createHash('sha256').update(bytes).digest('hex'),
    format: png ? 'PNG' : pdf ? 'PDF' : 'JPEG',
    ...(png ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
      : { needsRasterization: pdf, geometryStatus: 'REQUIRES_DECODER', extensionMismatch: jpeg && path.extname(file).toLowerCase() !== '.jpg' }) };
}

const ucFiles: Record<string, string[]> = {
  'UC_0': ['auth.spec.ts','shell.spec.ts'],
  'UC_1.1': ['purchase-drafts.spec.ts','purchase-finalization.spec.ts','purchase-results.spec.ts','phase10-journey.spec.ts'],
  'UC_1.2': ['purchase-queries.spec.ts','purchase-list.spec.ts'],
  'UC_2.1': ['inventory.spec.ts'], 'UC_2.2': ['inventory-edit.spec.ts'], 'UC_2.3': ['discount-scheduler.spec.ts'],
  'UC_3.1': ['sales-draft.spec.ts','sale-payment.spec.ts','sales-t06-recovery.spec.ts','phase10-journey.spec.ts'],
  'UC_3.2': ['sales-pages.spec.ts','sales-t05-errors.spec.ts'],
  'UC_4.1': ['reference-data.spec.ts'], 'UC_4.2': ['reference-data.spec.ts'],
  'UC_4.3': ['reference-data.spec.ts','confirmation.spec.ts'], 'UC_4.4': ['reference-data.spec.ts'],
  'UC_4.5': ['sales-t05-t06.spec.ts','sales-t05-errors.spec.ts','phase10-journey.spec.ts'],
  'UC_4.6': ['purchase-queries.spec.ts','phase10-journey.spec.ts'],
  'UC_5.1': ['reference-data.spec.ts','pagination.spec.ts'], 'UC_5.2': ['reference-data.spec.ts'], 'UC_5.3': ['reference-data.spec.ts'],
  'UC_6': ['purchase-approvals.spec.ts','purchase-results.spec.ts','phase10-journey.spec.ts'],
  'UC_7.1': ['reports-revenue.spec.ts'], 'UC_7.2': ['reports-purchase-cost.spec.ts'],
  'UC_7.3': ['reports-t04.spec.ts'], 'UC_7.4': ['reports-t04.spec.ts'], 'UC_7.5': ['reports-t04.spec.ts'],
  'UC_8.1': ['staff.spec.ts','staff-review.spec.ts'], 'UC_8.2': ['staff.spec.ts','staff-review.spec.ts'],
  'UC_8.3': ['staff.spec.ts','staff-review.spec.ts'], 'UC_8.4': ['staff.spec.ts','staff-review.spec.ts'],
};
const ucUnitFiles: Record<string, string[]> = {
  'UC_0': ['auth.test.ts'],
  'UC_1.1': ['purchase-drafts.test.ts', 'purchase-finalization.test.ts', 'purchase-contract.test.ts', 'purchase-candidate.test.ts'],
  'UC_1.2': ['purchase-queries.test.ts'],
  'UC_2.1': ['inventory.test.ts'], 'UC_2.2': ['inventory.test.ts'], 'UC_2.3': ['discount-scheduler.test.ts'],
  'UC_3.1': ['sales.test.ts', 'sale-payment.test.ts'], 'UC_3.2': ['sale-payment.test.ts'],
  'UC_4.1': ['reference-data.test.ts', 'customer-creation.test.ts'], 'UC_4.2': ['reference-data.test.ts'],
  'UC_4.3': ['reference-data.test.ts', 'customer-creation.test.ts'], 'UC_4.4': ['reference-data.test.ts'],
  'UC_4.5': ['sale-payment.test.ts'], 'UC_4.6': ['purchase-queries.test.ts'],
  'UC_5.1': ['reference-data.test.ts'], 'UC_5.2': ['reference-data.test.ts'], 'UC_5.3': ['reference-data.test.ts'],
  'UC_6': ['purchase-approvals.test.ts', 'purchase-contract.test.ts'],
  'UC_7.1': ['revenue-report.test.ts', 'report-eligibility.test.ts', 'report-legacy-migration.test.ts', 'report-period.test.ts'],
  'UC_7.2': ['report-queries.test.ts'], 'UC_7.3': ['report-queries.test.ts'],
  'UC_7.4': ['report-queries.test.ts'], 'UC_7.5': ['report-queries.test.ts'],
  'UC_8.1': ['staff-accounts.test.ts'], 'UC_8.2': ['staff-accounts.test.ts'],
  'UC_8.3': ['staff-accounts.test.ts'], 'UC_8.4': ['staff-accounts.test.ts'],
};

async function audit() {
  const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), repoRoot = path.resolve(appRoot, '..');
  const planningRoot = path.join(appRoot, 'planning'), codexRoot = path.join(repoRoot, 'CODEX');
  const read = (name: string) => fs.readFileSync(path.join(planningRoot, name), 'utf8');
  const source = read('REQUIREMENT_TRACEABILITY.md').split(/\r?\n/);
  const useCases = source.filter(line => /^\| UC_/.test(line)).map(line => line.split('|')[1].trim().split(' / ')[0]);
  const businessRules = source.filter(line => /^\| BR-UC/.test(line)).map(line => ({ id: line.split('|')[1].trim().split(' / ')[0],
    useCases: [...new Set(line.match(/UC_\d+(?:\.\d+)?/g) ?? [])] }));
  const nfr = read('TEST_CASE_CATALOG.md').split(/\r?\n/).filter(line => /^\| TC-NFR-/.test(line)).map(line => line.split('|')[1].trim());
  const screens = read('FIGMA_SCREEN_MAPPING.md').split(/\r?\n/).filter(line => /^\| SC\d{3} \|/.test(line)).map(line => {
    const cells = line.split('|').map(cell => cell.trim()), links = [...cells[7].matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]);
    return { id: cells[1], role: cells[2], title: cells[3], source: metadata(referencePath(planningRoot, codexRoot, links[0]), repoRoot),
      cleanExport: links[1] ? metadata(referencePath(planningRoot, codexRoot, links[1]), repoRoot) : null,
      visualStatus: 'NOT_RUN', reason: 'Source inventory is not a runtime pixel comparison or approved baseline' };
  });
  for (const [name, rows, expected] of [['UC',useCases,27],['BR',businessRules,98],['NFR',nfr,7],['SC',screens,297]] as const) {
    if (rows.length !== expected) throw new Error(`${name} source count ${rows.length}, expected ${expected}`);
  }
  if (new Set(screens.map(row => row.id)).size !== 297) throw new Error('Duplicate SC identifier');
  for (const uc of useCases) {
    if (!ucFiles[uc]?.length) throw new Error(`Missing test candidates for ${uc}`);
    for (const file of ucFiles[uc]) if (!fs.existsSync(path.join(appRoot,'tests/e2e',file))) throw new Error(`Missing test file ${file}`);
  }
  const reportIndex = process.argv.indexOf('--report');
  const evidence = reportIndex >= 0 ? executionEvidence(JSON.parse(fs.readFileSync(process.argv[reportIndex+1], 'utf8').replace(/^\uFEFF/,''))) : [];
  const unitReportIndex = process.argv.indexOf('--unit-report');
  const unitReport: UnitReport | undefined = unitReportIndex >= 0 ? JSON.parse(fs.readFileSync(process.argv[unitReportIndex+1], 'utf8').replace(/^\uFEFF/,'')) : undefined;
  const unitEvidence = unitReport ? unitExecutionEvidence(unitReport) : [];
  const refs = useCases.map(id => ({ id, acceptance: 'PENDING_REVIEW', branchCoverage: 'NOT_CERTIFIED', testCandidates: ucFiles[id],
    unitTestCandidates: ucUnitFiles[id],
    executedTests: evidence.filter(row => ucFiles[id].some(file => row.file.endsWith(file))).map(row => row.id),
    unitExecutedTests: unitEvidence.filter(row => ucUnitFiles[id].some(file => row.file.endsWith(file))).map(row => row.id) }));
  const out = path.join(planningRoot,'phase10/evidence/audit'); fs.mkdirSync(out,{recursive:true});
  const inventory = { counts: { useCases: useCases.length, businessRules: businessRules.length, nfr: nfr.length, screens: screens.length },
    policy: 'Test-file references and source existence never certify a UC, branch, BR, NFR or visual PASS',
    useCases: refs, businessRules, nfr: nfr.map(id => ({id,acceptance:'PENDING_REVIEW'})), screens };
  fs.writeFileSync(path.join(out,'source-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
  fs.writeFileSync(path.join(out,'executed-tests.json'),JSON.stringify({ reportProvided: reportIndex >= 0,
    counts: Object.fromEntries(['PASS','FAIL','SKIP','FLAKY','NOT_RUN','NON_STANDARD_EXPECTATION'].map(status=>[status,evidence.filter(row=>row.status===status).length])), tests:evidence },null,2)+'\n');
  fs.writeFileSync(path.join(out,'unit-executed-tests.json'),JSON.stringify({ reportProvided: unitReportIndex >= 0,
    reportSuccess: unitReport?.success ?? null,
    policy: 'Individual passing assertions do not override a failed report or certify complete UC/BR coverage',
    counts: Object.fromEntries(['PASS','FAIL','SKIP','NOT_RUN'].map(status => [status,unitEvidence.filter(row => row.status === status).length])), tests:unitEvidence },null,2)+'\n');
  const lines=['# G10 — Ma trận nguồn và tham chiếu kiểm thử','',
    '27 UC / 98 BR / 7 NFR / 297 SC đã kiểm nguồn. Tham chiếu file không chứng minh đủ mọi nhánh hoặc nghiệm thu; pixel comparison vẫn NOT RUN trong inventory này.','',
    '| UC | File Chromium / unit liên quan | Ca Chromium / unit trong report đã cung cấp | Nghiệm thu |','|---|---|---|---|',
    ...refs.map(row=>`| ${row.id} | ${row.testCandidates.join(', ')} / ${row.unitTestCandidates.join(', ')} | ${row.executedTests.length} / ${row.unitExecutedTests.length} | PENDING REVIEW / nhánh chưa chứng nhận |`),
    '',`Có ${screens.filter(row=>row.cleanExport).length}/297 SC có export sạch được ánh xạ; mọi frame có hash, ${screens.filter(row=>'width' in row.source).length}/297 đọc được geometry từ header PNG, ảnh định dạng khác cần decoder. Không copy source CODEX vào artifact.`,
    '', 'Các blocker UI SRS/Figma G6/G8, barcode vật lý và phím tắt/mức giá/SLA chưa chốt vẫn cần review riêng; không tự đóng từ tổng số test.'];
  fs.writeFileSync(path.join(planningRoot,'phase10/TRACE_AUDIT.md'),lines.join('\n')+'\n');
  console.log(JSON.stringify({sourceCounts:inventory.counts,executedTests:evidence.length,visualComparisonsPassed:0}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await audit();
