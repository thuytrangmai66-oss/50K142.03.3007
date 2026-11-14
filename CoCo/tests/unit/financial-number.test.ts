import { expect, it } from 'vitest';
import { safeReportNumber } from '../../src/services/financial-reports';
it('preserves negative values and both safe integer limits', () => {
  expect(safeReportNumber(-70001n)).toBe(-70001);
  expect(safeReportNumber(BigInt(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
  expect(safeReportNumber(BigInt(Number.MIN_SAFE_INTEGER))).toBe(Number.MIN_SAFE_INTEGER);
});
it('rejects unsafe aggregate values in either direction', () => {
  expect(() => safeReportNumber(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toThrow();
  expect(() => safeReportNumber(BigInt(Number.MIN_SAFE_INTEGER) - 1n)).toThrow();
});
