import { calendarDate, timestamp } from '../domain/records';

export type ReportPeriodKind = 'day' | 'month' | 'year' | 'range';
export type ReportPeriodInput =
  | { kind: 'day' | 'month' | 'year'; value: string }
  | { kind: 'range'; start: string; end: string };
export interface ReportPeriod {
  kind: ReportPeriodKind;
  startDate: string;
  endDate: string;
  startMs: number;
  endExclusiveMs: number;
}
export const REPORT_PERIOD_ERROR = 'Khoảng thời gian không hợp lệ. Vui lòng kiểm tra lại';
export class ReportPeriodError extends Error {
  constructor() { super(REPORT_PERIOD_ERROR); this.name = 'ReportPeriodError'; }
}
const dayMs = 86_400_000, vietnamOffsetMs = 7 * 3_600_000;

function utcCalendar(year: number, monthIndex: number, day: number) {
  // Date.UTC treats years 0..99 as 1900..1999; setUTCFullYear does not.
  const result = new Date(0);
  result.setUTCFullYear(year, monthIndex, day);
  result.setUTCHours(0, 0, 0, 0);
  return result.getTime();
}
function dateParts(value: string) {
  if (!calendarDate.safeParse(value).success || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ReportPeriodError();
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || year > 9999) throw new ReportPeriodError();
  return { year, month, day };
}
function isoDay(ms: number) { return new Date(ms).toISOString().slice(0, 10); }

/** All business days use UTC+07:00. The upper bound excludes the next midnight. */
export function reportPeriod(input: ReportPeriodInput): ReportPeriod {
  if (!input || typeof input !== 'object') throw new ReportPeriodError();
  let startDate: string, endDate: string;
  switch (input.kind) {
    case 'day': startDate = input.value; endDate = input.value; break;
    case 'month': {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.value)) throw new ReportPeriodError();
      startDate = `${input.value}-01`;
      const { year, month } = dateParts(startDate);
      endDate = isoDay(utcCalendar(year, month, 1) - dayMs);
      break;
    }
    case 'year': {
      if (!/^\d{4}$/.test(input.value)) throw new ReportPeriodError();
      startDate = `${input.value}-01-01`; endDate = `${input.value}-12-31`; break;
    }
    case 'range': startDate = input.start; endDate = input.end; break;
    default: throw new ReportPeriodError();
  }
  const start = dateParts(startDate), end = dateParts(endDate);
  const startMs = utcCalendar(start.year, start.month - 1, start.day) - vietnamOffsetMs;
  const endExclusiveMs = utcCalendar(end.year, end.month - 1, end.day) + dayMs - vietnamOffsetMs;
  if (startMs >= endExclusiveMs) throw new ReportPeriodError();
  return { kind: input.kind, startDate, endDate, startMs, endExclusiveMs };
}

export function inReportPeriod(period: ReportPeriod, instant: string) {
  // A missing timezone must never fall through to the host machine's timezone.
  if (!timestamp.safeParse(instant).success) throw new ReportPeriodError();
  const ms = Date.parse(instant);
  if (!Number.isFinite(ms)) throw new ReportPeriodError();
  return ms >= period.startMs && ms < period.endExclusiveMs;
}

/** Figma text fields use dd/mm/yyyy and mm/yyyy; the domain accepts ISO only. */
export function displayPeriodInput(kind: ReportPeriodKind, value: string, end = ''): ReportPeriodInput {
  const day = (raw: string) => {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
    if (!match) throw new ReportPeriodError();
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  };
  if (kind === 'range') return { kind, start: day(value), end: day(end) };
  if (kind === 'day') return { kind, value: day(value) };
  if (kind === 'year') return { kind, value: value.trim() };
  const match = /^(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) throw new ReportPeriodError();
  return { kind, value: `${match[2]}-${match[1].padStart(2, '0')}` };
}
