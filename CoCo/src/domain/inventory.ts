import { z } from 'zod';
import { calendarDate, identifier, timestamp } from './records';

export const inventoryAttributesKey = (id: string) => `inventory-attributes:${id}`;
export const inventoryAttributesSchema = z.object({
  format: z.literal('inventory-attributes-v1'), productId: identifier,
  type: z.string().trim().min(1).max(50), brand: z.string().trim().min(1).max(50),
  condition: z.union([z.literal(1), z.literal(2), z.literal(3)]), updatedAt: timestamp,
}).strict();
export const cycleKey = (id: string) => `inventory-cycle:${id}`;
export const cycleSchema = z.object({ productId: identifier, startedOn: calendarDate, resetAt: timestamp }).strict();

/** G7-D02: round the final 70% price, never 30% off an already reduced price. */
export function priceAtThirtyDays(original: number) {
  if (!Number.isSafeInteger(original) || original < 0) throw new Error('Invalid cycle price');
  return Number((BigInt(original) * 7n + 5n) / 10n);
}
/** Calendar arithmetic uses UTC only to represent whole Vietnam calendar days. */
export function addCalendarDays(date: string, days: number) {
  calendarDate.parse(date);
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export function vietnamDay(now: Date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
}
export function daysBetween(start: string, end: string) {
  calendarDate.parse(start); calendarDate.parse(end);
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
}
export function nextVietnamMidnight(now: Date) { return new Date(`${vietnamDay(now)}T17:00:00Z`); }
export function pendingMilestone(startedOn: string, today: string, applied: readonly number[]): 30 | 45 | undefined {
  const age = daysBetween(startedOn, today);
  if (age >= 45) return applied.includes(45) ? undefined : 45;
  if (age >= 30 && !applied.includes(30) && !applied.includes(45)) return 30;
  return undefined;
}
