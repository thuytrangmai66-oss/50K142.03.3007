import { identifier, timestamp } from './records';
import { inReportPeriod, type ReportPeriod } from '../lib/vietnam-time';
import { RepositoryError } from '../repositories/errors';

export type ReportEligibility = 'ELIGIBLE' | 'UNVERIFIED' | 'MISSING_TIME' | 'INVALID_TIME';
export interface Eligibility {
  verification: 'VERIFIED' | 'UNVERIFIED';
  eligibility: ReportEligibility;
  trustedTime?: string;
}
/** Verification and time are independent. No fallback date is accepted here. */
export function reportingEligibility(verified: boolean, time: unknown): Eligibility {
  if (!verified) return { verification: 'UNVERIFIED', eligibility: 'UNVERIFIED' };
  if (time === undefined || time === null || time === '') return { verification: 'VERIFIED', eligibility: 'MISSING_TIME' };
  if (!timestamp.safeParse(time).success) return { verification: 'VERIFIED', eligibility: 'INVALID_TIME' };
  return { verification: 'VERIFIED', eligibility: 'ELIGIBLE', trustedTime: time as string };
}
export function eligibilityCoverage(records: readonly Eligibility[]) {
  return { totalRecords: records.length,
    eligibleRecords: records.filter(row => row.eligibility === 'ELIGIBLE').length,
    unverifiedRecords: records.filter(row => row.eligibility === 'UNVERIFIED').length,
    missingTimeRecords: records.filter(row => row.eligibility === 'MISSING_TIME').length,
    invalidTimeRecords: records.filter(row => row.eligibility === 'INVALID_TIME').length };
}

/** Input facts must come from an approved creation source, not first purchase,
 * membership, migration or arbitrary date-looking fields on a legacy record. */
export interface CustomerCreationFact { customerId: string; sourceVerified: boolean; createdAt?: unknown }
export function newCustomerSummary(period: ReportPeriod, facts: readonly CustomerCreationFact[]) {
  const ids = new Set<string>();
  const classifications = facts.map(fact => {
    identifier.parse(fact.customerId);
    if (ids.has(fact.customerId)) throw new RepositoryError('REFERENCE', 'Hồ sơ khách hàng bị lặp trong đầu vào KPI');
    ids.add(fact.customerId);
    return { customerId: fact.customerId, ...reportingEligibility(fact.sourceVerified, fact.createdAt) };
  });
  return { scope: 'TRUSTED_CREATION_ONLY' as const, period,
    newCustomerCount: classifications.filter(row => row.eligibility === 'ELIGIBLE' && inReportPeriod(period, row.trustedTime!)).length,
    coverage: eligibilityCoverage(classifications), classifications };
}
