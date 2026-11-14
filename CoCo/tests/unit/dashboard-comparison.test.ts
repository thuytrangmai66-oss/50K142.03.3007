import { expect, it } from 'vitest';
import { percentageChange } from '../../src/services/dashboard';
it('keeps signed mathematical percentages without inventing a zero baseline', () => {
  expect(percentageChange(112, 100)).toEqual({ status: 'DEFINED', percent: 12 });
  expect(percentageChange(0, 100)).toEqual({ status: 'DEFINED', percent: -100 });
  expect(percentageChange(0, 0)).toEqual({ status: 'NO_BASELINE', percent: null });
  expect(percentageChange(100, 0)).toEqual({ status: 'NO_BASELINE', percent: null });
});
it.each([-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])('rejects invalid comparison input %s', value => {
  expect(() => percentageChange(value, 1)).toThrow();
});
