import { expect, it } from 'vitest';
import { revenueFromVerifiedSales, revenueRowsFromVerifiedSales } from '../../src/domain/revenue-report';
import { reportPeriod } from '../../src/lib/vietnam-time';

const period = reportPeriod({ kind: 'day', value: '2026-11-13' });
const sale = (invoiceId: string, paidTotal: number, paidAt = '2026-11-13T12:00:00+07:00') => ({ invoiceId, paidTotal, paidAt });

it('BR-UC7-02 returns zero rather than NaN or Infinity for an empty verified period', () => {
  expect(revenueFromVerifiedSales(period, [])).toMatchObject({ invoiceCount: 0, totalRevenue: 0, averageRevenue: 0, invoiceIds: [] });
});
it('counts paid headers once and adds actual receipts rather than prices before discounts', () => {
  const input = [sale('BH2', 83201), sale('BH1', 104001), sale('BH3', 999999, '2026-11-14T00:00:00+07:00')];
  const original = structuredClone(input);
  expect(revenueFromVerifiedSales(period, input)).toMatchObject({ invoiceCount: 2, totalRevenue: 187202, averageRevenue: 93601, invoiceIds: ['BH1', 'BH2'] });
  expect(input).toEqual(original);
});
it('does not invent a persisted rounding rule for a statistical average', () => {
  expect(revenueFromVerifiedSales(period, [sale('BH1', 2), sale('BH2', 3)]).averageRevenue).toBe(2.5);
});
it('uses the complete Vietnam day and not the UTC date of payment', () => {
  const input = [sale('BH0', 10, '2026-11-12T16:59:59.999Z'), sale('BH1', 20, '2026-11-12T17:00:00Z'),
    sale('BH2', 30, '2026-11-13T16:59:59.999Z'), sale('BH3', 40, '2026-11-13T17:00:00Z')];
  expect(revenueFromVerifiedSales(period, input)).toMatchObject({ totalRevenue: 50, invoiceCount: 2 });
});
it('rejects duplicate IDs instead of double-counting or silently hiding an inconsistent input', () => {
  expect(() => revenueFromVerifiedSales(period, [sale('BH1', 2), sale('BH1', 3)])).toThrow();
});
it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])('rejects invalid paid amount %s', value => {
  expect(() => revenueFromVerifiedSales(period, [sale('BH1', value)])).toThrow();
});
it('sums in integers and rejects aggregate overflow', () => {
  expect(() => revenueFromVerifiedSales(period, [sale('BH1', Number.MAX_SAFE_INTEGER), sale('BH2', 1)])).toThrow('giới hạn số an toàn');
});

it('groups by payment day in Vietnam and reconciles rows with the whole-period total', () => {
  const range = reportPeriod({ kind: 'range', start: '2026-11-12', end: '2026-11-14' });
  const input = [sale('BH3', 7, '2026-11-13T17:00:00Z'), sale('BH1', 2, '2026-11-12T16:59:59Z'),
    sale('BH2', 3, '2026-11-12T17:00:00Z'), sale('BH4', 4, '2026-11-13T12:00:00+07:00')];
  const rows = revenueRowsFromVerifiedSales(range, input);
  expect(rows.map(row => [row.date, row.invoiceCount, row.totalRevenue, row.averageRevenue]))
    .toEqual([['2026-11-12', 1, 2, 2], ['2026-11-13', 2, 7, 3.5], ['2026-11-14', 1, 7, 7]]);
  expect(rows.reduce((sum, row) => sum + row.totalRevenue, 0)).toBe(revenueFromVerifiedSales(range, input).totalRevenue);
  expect(rows.reduce((sum, row) => sum + row.invoiceCount, 0)).toBe(4);
});
it('does not fabricate empty daily rows and validates duplicates before grouping', () => {
  expect(revenueRowsFromVerifiedSales(period, [])).toEqual([]);
  expect(() => revenueRowsFromVerifiedSales(period, [sale('BH1', 1), sale('BH1', 2)])).toThrow('bị lặp');
});
it('keeps 25 daily rows ordered with the exact grand total for real pagination', () => {
  const month = reportPeriod({ kind: 'month', value: '2026-11' });
  const input = Array.from({ length: 25 }, (_, i) => sale(`BH${i}`, i + 1, `2026-11-${String(i + 1).padStart(2, '0')}T12:00:00+07:00`));
  const rows = revenueRowsFromVerifiedSales(month, [...input].reverse());
  expect(rows).toHaveLength(25); expect(rows[0].date).toBe('2026-11-01'); expect(rows[24].date).toBe('2026-11-25');
  expect(rows.reduce((sum, row) => sum + row.totalRevenue, 0)).toBe(325);
});
