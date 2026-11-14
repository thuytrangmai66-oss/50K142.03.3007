import { z } from 'zod';
import type { CoCoDatabase } from '../db/schema';
import { identifier, timestamp } from '../domain/records';
import { newCustomerSummary } from '../domain/report-eligibility';
import type { ReportPeriod } from '../lib/vietnam-time';
import { recordVersionKey, type CommitEffect } from '../repositories';

export const customerCreationKey = (id: string) => `customer-creation:${id}`;
export const customerCreationSchema = z.object({
  format: z.literal('customer-creation-v1'), customerId: identifier, createdAt: timestamp,
  createdBy: identifier, operationId: z.string().min(1).max(200), source: z.literal('customer-create'),
}).strict();

/** M01-B: new profiles only. Invoked after the receipt/audit, in the SAME transaction. */
export function customerCreationEffect(db: CoCoDatabase, customerId: string): CommitEffect {
  return async ({ id, actor, executedAt }) => {
    const marker = customerCreationSchema.parse({ format: 'customer-creation-v1', customerId,
      createdAt: executedAt, createdBy: actor, operationId: id, source: 'customer-create' });
    await db.appMetadata.add({ key: customerCreationKey(customerId), value: JSON.stringify(marker) });
  };
}

/** Read existing profiles only. Never infer dates, repair evidence or backfill. */
export async function customerCreationReport(db: CoCoDatabase, period: ReportPeriod) {
  const facts = [];
  for (const customer of await db.khachHang.toArray()) {
    const stored = await db.appMetadata.get(customerCreationKey(customer.MaKH));
    let marker: z.infer<typeof customerCreationSchema> | undefined;
    if (stored) {
      try { marker = customerCreationSchema.parse(JSON.parse(stored.value)); }
      catch (error) { if (!(error instanceof z.ZodError || error instanceof SyntaxError)) throw error; }
    }
    let sourceVerified = false;
    if (marker && marker.customerId === customer.MaKH && marker.operationId.startsWith('reference:')) {
      const receipt = await db.operations.get(marker.operationId), audit = await db.auditEntries.get(marker.operationId);
      sourceVerified = Boolean(receipt && audit && receipt.executedAt === marker.createdAt
        && audit.executedAt === marker.createdAt && audit.actor === marker.createdBy && Array.isArray(audit.changed)
        && audit.changed.includes(recordVersionKey('khachHang', customer.MaKH)));
    }
    facts.push({ customerId: customer.MaKH, sourceVerified, createdAt: sourceVerified ? marker?.createdAt : undefined });
  }
  return { ...newCustomerSummary(period, facts), sourceStatus: 'APPROVED_CUSTOMER_CREATION_V1' as const };
}
