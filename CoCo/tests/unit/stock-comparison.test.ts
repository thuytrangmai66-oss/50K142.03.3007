import { expect, it } from 'vitest';
import { stockComparison, type ProductLifecycleFact } from '../../src/domain/stock-comparison';

const november = new Date('2026-11-14T09:00:00+07:00');
const item = (productId: string, importedAt = '2026-10-31T23:59:59.999+07:00', soldAt?: string): ProductLifecycleFact =>
  ({ productId, importedAt, ...(soldAt === undefined ? {} : { soldAt }) });

it('G9-D05 uses the same cohort for current/previous counts and signed percentages', () => {
  expect(stockComparison(november, [item('SP1'), item('SP2', undefined, '2026-11-01T00:00:00+07:00')]))
    .toMatchObject({ previousCount: 2, currentCount: 1, percent: -50, status: 'DEFINED', baselineBefore: '2026-10-31T17:00:00.000Z' });
  expect(stockComparison(november, [item('SP1'), item('SP2', '2026-11-02T09:00:00+07:00')]))
    .toMatchObject({ previousCount: 1, currentCount: 2, percent: 100, status: 'DEFINED' });
});
it.each([
  ['2026-10-31T23:59:59.999+07:00', 0],
  ['2026-11-01T00:00:00+07:00', 1],
  ['2026-11-01T00:00:00.001+07:00', 1],
])('G9-D05 sale cutoff %s preserves the exclusive end-of-month boundary', (soldAt, previousCount) => {
  expect(stockComparison(november, [item('SP1', '2026-10-30T00:00:00+07:00', soldAt)]))
    .toMatchObject({ previousCount, currentCount: 0, percent: previousCount ? -100 : null });
});
it.each(['2026-11-01T00:00:00+07:00', '2026-11-01T00:00:00.001+07:00'])('G9-D05 an import at/after cutoff %s is not previous stock', importedAt => {
  expect(stockComparison(november, [item('SP1', importedAt)])).toMatchObject({ previousCount: 0, currentCount: 1, status: 'NO_BASELINE', percent: null });
});
it.each([
  ['2027-01-01T00:00:00+07:00', '2026-12-31T17:00:00.000Z'],
  ['2028-03-01T00:00:00+07:00', '2028-02-29T17:00:00.000Z'],
  ['2026-11-30T17:00:00Z', '2026-11-30T17:00:00.000Z'],
])('G9-D05 cutoff respects Vietnam calendar/month/year/leap boundary %s', (now, baselineBefore) => {
  expect(stockComparison(new Date(now), [])).toMatchObject({ baselineBefore, status: 'NO_BASELINE', percent: null });
});
it('G9-D05 zero and incomplete evidence never fabricate a percentage', () => {
  expect(stockComparison(november, [])).toMatchObject({ currentCount: 0, previousCount: 0, status: 'NO_BASELINE', percent: null });
  expect(stockComparison(november, [item('SP1')], 1)).toMatchObject({ currentCount: 1, previousCount: 1, status: 'INSUFFICIENT_EVIDENCE', percent: null });
});
it.each([
  item('SP1', '2026-11-14T10:00:00+07:00'),
  item('SP1', undefined, '2026-10-01T00:00:00+07:00'),
  item('SP1', undefined, '2026-11-14T10:00:00+07:00'),
  item('SP1', '2026-10-01T00:00:00'),
  item('SP1', undefined, 'not-a-time'),
])('G9-D05 invalid/future/contradictory chronology is insufficient %#', fact => {
  expect(stockComparison(november, [fact])).toMatchObject({ status: 'INSUFFICIENT_EVIDENCE', percent: null, excludedProductIds: ['SP1'] });
});
it('G9-D05 rejects duplicate product facts rather than counting twice', () => {
  expect(() => stockComparison(november, [item('SP1'), item('SP1')])).toThrow('Sản phẩm bị lặp');
});
