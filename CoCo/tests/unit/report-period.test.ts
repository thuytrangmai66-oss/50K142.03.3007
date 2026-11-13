import { afterEach, describe, expect, it } from 'vitest';
import { displayPeriodInput, inReportPeriod, reportPeriod, ReportPeriodError, type ReportPeriodInput } from '../../src/lib/vietnam-time';

const originalTimezone = process.env.TZ;
afterEach(() => { if (originalTimezone === undefined) delete process.env.TZ; else process.env.TZ = originalTimezone; });

describe('G9-T01 Vietnam report periods', () => {
  it('includes the complete last Vietnam day and excludes the following midnight', () => {
    const period = reportPeriod({ kind: 'range', start: '2026-01-01', end: '2026-01-08' });
    expect(new Date(period.startMs).toISOString()).toBe('2025-12-31T17:00:00.000Z');
    expect(new Date(period.endExclusiveMs).toISOString()).toBe('2026-01-08T17:00:00.000Z');
    expect(inReportPeriod(period, '2025-12-31T16:59:59.999Z')).toBe(false);
    expect(inReportPeriod(period, '2026-01-01T00:00:00+07:00')).toBe(true);
    expect(inReportPeriod(period, '2026-01-08T23:59:59.999+07:00')).toBe(true);
    expect(inReportPeriod(period, '2026-01-09T00:00:00+07:00')).toBe(false);
  });
  it.each(['UTC', 'America/Los_Angeles', 'Asia/Tokyo'])('does not use host timezone %s', timezone => {
    process.env.TZ = timezone;
    expect(reportPeriod({ kind: 'day', value: '2026-11-13' })).toMatchObject({
      startDate: '2026-11-13', endDate: '2026-11-13',
      startMs: Date.parse('2026-11-12T17:00:00Z'), endExclusiveMs: Date.parse('2026-11-13T17:00:00Z'),
    });
  });
  it.each([
    ['2024-02', '2024-02-29'], ['2026-02', '2026-02-28'], ['2000-02', '2000-02-29'],
    ['1900-02', '1900-02-28'], ['2026-04', '2026-04-30'], ['2026-12', '2026-12-31'],
  ])('handles month %s through %s', (value, endDate) => {
    const period = reportPeriod({ kind: 'month', value });
    expect(period.endDate).toBe(endDate);
    expect(inReportPeriod(period, `${endDate}T23:59:59+07:00`)).toBe(true);
    expect(period.endExclusiveMs - period.startMs).toBe((Number(endDate.slice(-2))) * 86_400_000);
  });
  it.each([['2024', 366], ['2026', 365], ['0099', 365]])('handles full year %s without the year-1900 coercion', (value, days) => {
    const period = reportPeriod({ kind: 'year', value });
    expect(period.endExclusiveMs - period.startMs).toBe(Number(days) * 86_400_000);
    expect(period.startDate).toBe(`${value}-01-01`);
  });
  it.each([
    { kind: 'range', start: '2026-11-02', end: '2026-11-01' },
    { kind: 'range', start: '', end: '' }, { kind: 'day', value: '2026-02-29' },
    { kind: 'day', value: '2026-01-33' }, { kind: 'day', value: '2026-13-01' },
    { kind: 'day', value: '2026-1-1' }, { kind: 'month', value: '2026-00' },
    { kind: 'month', value: '2026-13' }, { kind: 'year', value: '0000' },
    { kind: 'year', value: '26' }, { kind: 'year', value: '' }, { kind: 'invalid', value: '2026' },
  ])('rejects invalid period %j', input => {
    expect(() => reportPeriod(input as ReportPeriodInput)).toThrow(ReportPeriodError);
  });
  it.each(['2026-11-13', '2026-11-13T12:00:00', '2026-02-30T00:00:00Z', 'not-a-date'])('rejects a missing/invalid payment timestamp %s', value => {
    expect(() => inReportPeriod(reportPeriod({ kind: 'year', value: '2026' }), value)).toThrow(ReportPeriodError);
  });
  it('normalizes only the display formats supplied by the local design', () => {
    expect(reportPeriod(displayPeriodInput('range', '01/01/2026', '08/01/2026')).endDate).toBe('2026-01-08');
    expect(reportPeriod(displayPeriodInput('month', '02/2024')).endDate).toBe('2024-02-29');
    expect(reportPeriod(displayPeriodInput('month', '2/2024')).endDate).toBe('2024-02-29');
    expect(reportPeriod(displayPeriodInput('day', '1/10/2026')).startDate).toBe('2026-10-01');
    expect(reportPeriod(displayPeriodInput('year', '2026')).startDate).toBe('2026-01-01');
    expect(reportPeriod(displayPeriodInput('day', '13/11/2026')).startDate).toBe('2026-11-13');
    expect(() => displayPeriodInput('day', '11/13/26')).toThrow(ReportPeriodError);
  });
});
