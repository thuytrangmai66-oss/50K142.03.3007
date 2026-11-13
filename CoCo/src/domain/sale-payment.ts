import { z } from 'zod';
import { identifier, money, timestamp } from './records';
import { salesLineSchema, calculateSalesPromotion, salesSubtotal } from './sales';

export const SALE_CODES = Object.freeze({ completed: 1, cash: 1, transfer: 2 });
export const paymentMethodSchema = z.enum(['cash', 'transfer']);
export const checkoutInputSchema = z.object({
  draftId: identifier, expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  customerId: identifier, method: paymentMethodSchema, useMembershipDiscount: z.boolean(),
}).strict();
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
const balance = z.number().int().nonnegative().max(2_147_483_647);
export const saleSnapshotSchema = z.object({
  format: z.literal('sales-invoice-v1'), invoiceId: identifier, draftId: identifier,
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  method: paymentMethodSchema,
  mapping: z.object({ completed: z.literal(1), cash: z.literal(1), transfer: z.literal(2) }).strict(),
  employee: z.object({ id: identifier, username: identifier, name: z.string().min(1).max(50) }).strict(),
  customer: z.object({ id: identifier, name: z.string().min(1).max(50), phone: z.string().regex(/^\d{10}$/),
    version: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    registeredAt: timestamp.nullable(), isMember: z.boolean(), pointsBefore: balance, pointsUsed: balance, pointsEarned: balance, pointsAfter: balance,
  }).strict(),
  lines: z.array(salesLineSchema).min(1), subtotal: money, discount: money, total: money,
}).strict().superRefine((value, ctx) => {
  try {
    const promotion = calculateSalesPromotion({ subtotal: salesSubtotal(value.lines), isMember: value.customer.isMember,
      pointsBalance: value.customer.pointsBefore, useMembershipDiscount: value.customer.pointsUsed > 0 });
    if (value.customer.isMember !== Boolean(value.customer.registeredAt)
      || promotion.subtotal !== value.subtotal || promotion.discount !== value.discount || promotion.total !== value.total
      || promotion.pointsUsed !== value.customer.pointsUsed || promotion.pointsEarned !== value.customer.pointsEarned
      || promotion.pointsAfter !== value.customer.pointsAfter) throw new Error('Invalid sale totals');
  } catch { ctx.addIssue({ code: 'custom', message: 'Snapshot bán hàng không nhất quán' }); }
});
export type SaleSnapshot = z.infer<typeof saleSnapshotSchema>;
export const paidSaleSchema = z.object({ snapshot: saleSnapshotSchema, paidAt: timestamp,
  operationId: z.string().min(1).max(150),
}).strict();
export type PaidSale = z.infer<typeof paidSaleSchema>;
export interface SaleQuote { snapshot: SaleSnapshot; fingerprint: string; qrPayload?: string }
export const finalizeSaleSchema = z.object({
  operationId: z.string().min(1).max(150), checkout: checkoutInputSchema,
  invoiceId: identifier.regex(/^BH[a-f0-9]{8}$/), fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  snapshot: saleSnapshotSchema,
}).strict();
export type FinalizeSale = z.infer<typeof finalizeSaleSchema>;
