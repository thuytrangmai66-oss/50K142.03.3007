import { z } from 'zod';
import { identifier, money, timestamp } from './records';

export const SALES_DRAFT_FORMAT = 'sales-cart-v1' as const;
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positiveMoney = money.refine(value => value > 0);

export const salesLineSchema = z.object({
  productId: identifier,
  sourcePurchaseId: identifier,
  name: z.string().trim().min(1).max(50),
  quantity: z.literal(1),
  unitPrice: positiveMoney,
  lineTotal: positiveMoney,
  productVersion: revision,
  selectedAt: timestamp,
}).strict().refine(line => line.lineTotal === line.quantity * line.unitPrice, 'Invalid sales line total');

export const salesDraftSchema = z.object({
  id: identifier,
  format: z.literal(SALES_DRAFT_FORMAT),
  employeeId: identifier,
  createdBy: identifier,
  status: z.enum(['editing', 'cancelled', 'finalized']),
  invoiceId: identifier.optional(),
  revision,
  createdAt: timestamp,
  updatedAt: timestamp,
  lines: z.array(salesLineSchema),
}).strict().superRefine((draft, ctx) => {
  if ((draft.status === 'finalized') !== Boolean(draft.invoiceId)) ctx.addIssue({ code: 'custom', message: 'Invalid finalized draft link' });
  const products = new Set<string>();
  let total = 0n;
  for (const line of draft.lines) {
    if (products.has(line.productId)) {
      ctx.addIssue({ code: 'custom', message: 'A product can appear only once in a sales cart' });
    }
    products.add(line.productId);
    total += BigInt(line.lineTotal);
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) ctx.addIssue({ code: 'custom', message: 'Sales subtotal exceeds the safe integer range' });
});

export type SalesDraft = z.infer<typeof salesDraftSchema>;
export type SalesLine = z.infer<typeof salesLineSchema>;

const pointsBalanceSchema = z.number().int().nonnegative().max(2_147_483_647);
const salesPromotionInputSchema = z.object({
  subtotal: money,
  isMember: z.boolean(),
  pointsBalance: pointsBalanceSchema,
  useMembershipDiscount: z.boolean(),
}).strict();

export type SalesPromotionInput = z.infer<typeof salesPromotionInputSchema>;

export interface SalesPromotionResult {
  subtotal: number;
  discount: number;
  total: number;
  isMember: boolean;
  pointsBefore: number;
  pointsUsed: number;
  pointsEarned: number;
  pointsAfter: number;
}

export function salesSubtotal(lines: readonly SalesLine[]): number {
  const products = new Set<string>();
  let total = 0n;
  for (const input of lines) {
    const line = salesLineSchema.parse(input);
    if (products.has(line.productId)) throw new Error('Sản phẩm đã có trong giỏ hàng');
    products.add(line.productId);
    total += BigInt(line.lineTotal);
    if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Tổng tiền hàng vượt quá giới hạn cho phép');
  }
  return Number(total);
}

export function calculateSalesPromotion(input: SalesPromotionInput): SalesPromotionResult {
  const parsed = salesPromotionInputSchema.parse(input);
  if (parsed.useMembershipDiscount && !parsed.isMember) {
    throw new Error('Chỉ thành viên mới được sử dụng ưu đãi');
  }
  if (parsed.useMembershipDiscount && parsed.pointsBalance < 50) {
    throw new Error('Cần tối thiểu 50 điểm để sử dụng ưu đãi');
  }
  if (parsed.useMembershipDiscount && parsed.subtotal === 0) {
    throw new Error('Không thể sử dụng ưu đãi cho giỏ hàng trống');
  }

  const discount = parsed.useMembershipDiscount
    ? Number((BigInt(parsed.subtotal) * 20n + 50n) / 100n)
    : 0;
  const total = parsed.subtotal - discount;
  const pointsUsed = parsed.useMembershipDiscount ? 50 : 0;
  const pointsEarned = parsed.isMember ? Number(BigInt(total) / 10_000n) : 0;
  const pointsAfter = parsed.isMember
    ? parsed.pointsBalance - pointsUsed + pointsEarned
    : parsed.pointsBalance;

  if (pointsEarned > 2_147_483_647 || pointsAfter > 2_147_483_647) {
    throw new RangeError('Điểm tích lũy vượt quá giới hạn cho phép');
  }

  return {
    subtotal: parsed.subtotal,
    discount,
    total,
    isMember: parsed.isMember,
    pointsBefore: parsed.pointsBalance,
    pointsUsed,
    pointsEarned,
    pointsAfter,
  };
}
