import { expect, it } from 'vitest';
import { newCustomerSummary, reportingEligibility } from '../../src/domain/report-eligibility';
import { reportPeriod } from '../../src/lib/vietnam-time';

it('separates payment verification from temporal eligibility without fallback values', () => {
  expect(reportingEligibility(false, '2026-11-13T12:00:00+07:00')).toEqual({ verification: 'UNVERIFIED', eligibility: 'UNVERIFIED' });
  expect(reportingEligibility(true, undefined)).toEqual({ verification: 'VERIFIED', eligibility: 'MISSING_TIME' });
  expect(reportingEligibility(true, null)).toEqual({ verification: 'VERIFIED', eligibility: 'MISSING_TIME' });
  expect(reportingEligibility(true, '2026-02-30T00:00:00Z')).toEqual({ verification: 'VERIFIED', eligibility: 'INVALID_TIME' });
  expect(reportingEligibility(true, '2026-11-13T00:00:00+07:00')).toMatchObject({ eligibility: 'ELIGIBLE', trustedTime: '2026-11-13T00:00:00+07:00' });
});
it('counts only trusted creation dates in the selected Vietnam period, preserving unknown customers as coverage', () => {
  const period = reportPeriod({ kind: 'day', value: '2026-11-13' });
  const facts = [
    { customerId: 'KH1', sourceVerified: true, createdAt: '2026-11-12T17:00:00Z' },
    { customerId: 'KH2', sourceVerified: false },
    { customerId: 'KH3', sourceVerified: false, createdAt: '2026-11-13T12:00:00+07:00', firstTransactionAt: '2026-11-13T12:00:00+07:00' },
    { customerId: 'KH4', sourceVerified: true, createdAt: '2026-11-13T17:00:00Z' },
    { customerId: 'KH5', sourceVerified: true },
  ];
  const before = structuredClone(facts), report = newCustomerSummary(period, facts);
  expect(report).toMatchObject({ newCustomerCount: 1, coverage: { totalRecords: 5, eligibleRecords: 2, unverifiedRecords: 2, missingTimeRecords: 1 } });
  expect(facts).toEqual(before);
});
it('excludes invalid creation dates and refuses duplicate profile IDs', () => {
  const period = reportPeriod({ kind: 'year', value: '2026' });
  expect(newCustomerSummary(period, [{ customerId: 'KH1', sourceVerified: true, createdAt: '2026-02-30T00:00:00Z' }]))
    .toMatchObject({ newCustomerCount: 0, coverage: { invalidTimeRecords: 1 } });
  expect(() => newCustomerSummary(period, [{ customerId: 'KH1', sourceVerified: false }, { customerId: 'KH1', sourceVerified: false }])).toThrow();
});
