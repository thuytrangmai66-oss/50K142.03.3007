import { z } from 'zod';
import { identifier, money, timestamp } from './records';

// Versioned G6 contract. Never assign these labels to untagged legacy TINYINTs.
export const PURCHASE_FORMAT = 'purchase-lines-v1' as const;
const key = z.string().min(1).max(200);
const positiveMoney = money.refine(value => value > 0);
const revision = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const quantity = z.number().int().positive().max(2_147_483_647);
export const bracketSnapshotSchema = z.object({
  id: identifier, revision, type: z.string().trim().min(1).max(50), brand: z.string().trim().min(1).max(50),
  condition: z.union([z.literal(1), z.literal(2), z.literal(3)]), min: positiveMoney, max: positiveMoney,
}).strict().refine(value => value.min <= value.max, 'Invalid bracket bounds');
export const purchaseDraftSchema = z.object({
  id: identifier, format: z.literal(PURCHASE_FORMAT), employeeId: identifier, createdBy: identifier,
  customerId: identifier.optional(), status: z.enum(['editing', 'cancelled', 'finalized']),
  revision, createdAt: timestamp, updatedAt: timestamp, invoiceId: identifier.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.status === 'finalized' && (!value.customerId || !value.invoiceId)) ctx.addIssue({ code: 'custom', message: 'Finalized draft requires customer and invoice' });
  if (value.status !== 'finalized' && value.invoiceId) ctx.addIssue({ code: 'custom', message: 'Unfinished draft cannot claim an invoice' });
});
export const purchaseLineSchema = z.object({
  id: key, draftId: identifier, revision, bracket: bracketSnapshotSchema, quantity, unitCost: positiveMoney,
  status: z.enum(['priced', 'pending', 'approved', 'rejected']), approvalId: identifier.optional(),
  removedAt: timestamp.optional(),
  position: revision.optional(),
}).strict().superRefine((value, ctx) => {
  if (!Number.isSafeInteger(value.quantity * value.unitCost)) ctx.addIssue({ code: 'custom', message: 'Line total overflow' });
  if ((value.status === 'priced') !== !value.approvalId) ctx.addIssue({ code: 'custom', message: 'Approval identity does not match line status' });
  if (value.status === 'priced' && value.unitCost > value.bracket.max) ctx.addIssue({ code: 'custom', message: 'Price requires approval' });
});
const decisionSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }).strict(),
  z.object({ status: z.literal('approved'), actor: identifier, decidedAt: timestamp }).strict(),
  z.object({ status: z.literal('rejected'), actor: identifier, decidedAt: timestamp, reason: z.string().trim().min(1).max(100) }).strict(),
]);
export const purchaseApprovalSchema = z.object({
  id: identifier, draftId: identifier, lineId: key, lineRevision: revision, revision,
  requestedBy: identifier, requestedAt: timestamp, bracket: bracketSnapshotSchema,
  quantity, unitCost: positiveMoney, decision: decisionSchema,
}).strict().refine(value => value.unitCost > value.bracket.max && Number.isSafeInteger(value.quantity * value.unitCost), 'Request must represent a valid above-Max price');
export const purchaseNoticeSchema = z.object({
  id: key, approvalId: identifier, recipient: identifier, createdAt: timestamp,
  delivery: z.enum(['pending', 'delivered']), deliveredAt: timestamp.optional(), readAt: timestamp.optional(),
}).strict().refine(value => (value.delivery === 'delivered') === Boolean(value.deliveredAt), 'Delivery timestamp must match state');
export type PurchaseDraft = z.infer<typeof purchaseDraftSchema>;
export type PurchaseLine = z.infer<typeof purchaseLineSchema>;
export type PurchaseApproval = z.infer<typeof purchaseApprovalSchema>;
export type PurchaseNotice = z.infer<typeof purchaseNoticeSchema>;

// Explicit structural projection replaces Zod 3's innerType(). Report readers
// validate relations separately and may classify an absent payment timestamp.
// Writers continue using the fully refined purchaseFinalizationSchema below.
export const purchaseFinalizationFieldsSchema = z.object({
  format: z.literal(PURCHASE_FORMAT), invoiceId: identifier, draftId: identifier,
  lines: z.array(purchaseLineSchema).min(1), subtotal: money, paidTotal: money,
  finalizedAt: timestamp, paidAt: timestamp,
  }).strict();
export const purchaseFinalizationSchema = purchaseFinalizationFieldsSchema.refine(value => value.lines.every(line => line.draftId === value.draftId && !line.removedAt && ['priced', 'approved'].includes(line.status)) &&
  purchaseSubtotal(value.lines) === value.subtotal && value.paidTotal === value.subtotal, 'Invalid finalized purchase snapshot');
export const purchaseProvenanceSchema = z.object({
  format: z.literal(PURCHASE_FORMAT), productId: identifier, invoiceId: identifier, lineId: key,
  unitCost: positiveMoney, recordedAt: timestamp,
}).strict();

/** User approved: actual per-item purchase cost × 1.30, half up to integer VND.
 * Integer arithmetic avoids floating-point rounding errors near money limits.
 */
export function initialSalePrice(unitCost: number): number {
  positiveMoney.parse(unitCost);
  const rounded = (BigInt(unitCost) * 13n + 5n) / 10n;
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Initial sale price overflow');
  return Number(rounded);
}

export function purchaseSubtotal(lines: readonly PurchaseLine[]): number {
  const ids = new Set<string>(); let total = 0;
  for (const input of lines) {
    const line = purchaseLineSchema.parse(input);
    if (ids.has(line.id)) throw new Error('Duplicate line identity');
    ids.add(line.id);
    if (line.removedAt) continue;
    total += line.quantity * line.unitCost;
    if (!Number.isSafeInteger(total)) throw new Error('Purchase total overflow');
  }
  return total;
}

/** Exact snapshot binding; an old decision never authorizes an edited line. */
export function approvalMatchesLine(approval: PurchaseApproval, line: PurchaseLine): boolean {
  purchaseApprovalSchema.parse(approval); purchaseLineSchema.parse(line);
  const a = approval.bracket, b = line.bracket;
  return approval.id === line.approvalId && approval.draftId === line.draftId && approval.lineId === line.id &&
    approval.lineRevision === line.revision && approval.quantity === line.quantity && approval.unitCost === line.unitCost &&
    a.id === b.id && a.revision === b.revision && a.type === b.type && a.brand === b.brand && a.condition === b.condition && a.min === b.min && a.max === b.max;
}

export function assertPendingDecision(approval: PurchaseApproval, role: 'owner' | 'staff', expectedRevision: number): void {
  purchaseApprovalSchema.parse(approval);
  if (role !== 'owner') throw new Error('Only owner can decide');
  if (approval.revision !== expectedRevision || approval.decision.status !== 'pending') throw new Error('Request is no longer pending at the expected revision');
}

export function assertFinalizable(draft: PurchaseDraft, lines: readonly PurchaseLine[], approvals: readonly PurchaseApproval[]): void {
  purchaseDraftSchema.parse(draft);
  if (draft.status !== 'editing' || !draft.customerId || !lines.length) throw new Error('Draft requires customer and items');
  purchaseSubtotal(lines);
  for (const line of lines) {
    if (line.draftId !== draft.id || line.removedAt) throw new Error('Line is not active in this draft');
    if (line.status === 'priced') continue;
    const approval = approvals.find(item => item.id === line.approvalId);
    if (line.status !== 'approved' || !approval || approval.decision.status !== 'approved' || !approvalMatchesLine(approval, line)) throw new Error('Product price is not approved');
  }
}
