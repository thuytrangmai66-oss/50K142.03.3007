import { expect, it } from 'vitest';
import path from 'node:path';
import { executionEvidence, referencePath, unitExecutionEvidence } from '../../scripts/phase10-audit';

const report = (results: { status: string; duration?: number }[], expectedStatus = 'passed') => ({ suites: [{ specs: [{
  title: 'A real scenario', file: 'phase10.spec.ts', tests: [{ projectName: 'chromium', expectedStatus, results }],
}] }] });
it('never labels list-only or unexecuted cases as passed', () => {
  expect(executionEvidence(report([]))[0]).toMatchObject({ status: 'NOT_RUN', durationMs: 0 });
});
it('preserves actual failure, interruption, skip and flaky attempts', () => {
  for (const status of ['failed','timedOut','interrupted']) expect(executionEvidence(report([{status}]))[0].status).toBe('FAIL');
  expect(executionEvidence(report([{status:'skipped'}]))[0].status).toBe('SKIP');
  expect(executionEvidence(report([{status:'failed',duration:3},{status:'passed',duration:7}]))[0]).toMatchObject({status:'FLAKY',durationMs:10});
});
it('counts executed success and refuses to turn expected-failure cases into PASS', () => {
  expect(executionEvidence(report([{status:'passed',duration:8}]))[0]).toMatchObject({status:'PASS',durationMs:8});
  expect(executionEvidence(report([{status:'failed'}],'failed'))[0].status).toBe('NON_STANDARD_EXPECTATION');
  expect(() => executionEvidence({})).toThrow('must contain suites');
});
it('resolves encoded local design paths while rejecting escape outside CODEX', () => {
  const root=path.resolve('planning'), codex=path.resolve('../CODEX');
  expect(referencePath(root,codex,'../../CODEX/Figma.Ch%E1%BB%A7/frame.png')).toBe(path.join(codex,'Figma.Chủ','frame.png'));
  expect(()=>referencePath(root,codex,'../../private.txt')).toThrow('escapes CODEX');
});

it('keeps unit failures/skips and does not call enumeration or missing-duration assertions PASS', () => {
  const report = { startTime: 1, success: false, testResults: [{ name: 'C:/private/work/CoCo/tests/unit/auth.test.ts', assertionResults: [
    { title: 'actual pass', status: 'passed', duration: 0 }, { title: 'actual fail', status: 'failed', duration: 1 },
    { title: 'not measured', status: 'passed' }, { title: 'todo', status: 'todo' }, { title: 'not run' },
  ] }] };
  expect(unitExecutionEvidence(report).map(row => row.status)).toEqual(['PASS', 'FAIL', 'NOT_RUN', 'SKIP', 'NOT_RUN']);
  expect(unitExecutionEvidence(report)[0].file).toBe('tests/unit/auth.test.ts');
});
it('sanitizes unit file paths and ignores raw failure messages', () => {
  const rows = unitExecutionEvidence({ startTime: 1, testResults: [{ name: 'C:\\private\\tests\\unit\\example.test.ts',
    assertionResults: [{ title: 'safe title', fullName: 'suite safe title', status: 'failed', duration: 7 }] }] });
  expect(rows[0]).toMatchObject({ file: 'tests/unit/example.test.ts', title: 'suite safe title', project: 'vitest', status: 'FAIL', durationMs: 7 });
  expect(JSON.stringify(rows)).not.toContain('private');
});
it('rejects missing unit reports and refuses PASS without an execution start time', () => {
  expect(() => unitExecutionEvidence({})).toThrow('must contain testResults');
  expect(unitExecutionEvidence({ testResults: [{ name: 'unit.test.ts', assertionResults: [{ title: 'listed', status: 'passed', duration: 0 }] }] })[0].status).toBe('NOT_RUN');
});
