import { identifier, timestamp } from './records';
import { vietnamDay } from './inventory';
import { reportPeriod } from '../lib/vietnam-time';
import { RepositoryError } from '../repositories/errors';

export interface ProductLifecycleFact { productId: string; importedAt: string; soldAt?: string }

/** G9-D05. Both counts use the same verified cohort; cutoff is exclusive. */
export function stockComparison(now: Date, facts: readonly ProductLifecycleFact[], sourceIssueCount = 0) {
  const asOf = now.getTime();
  const cutoff = reportPeriod({ kind: 'month', value: vietnamDay(now).slice(0, 7) }).startMs;
  if (!Number.isSafeInteger(sourceIssueCount) || sourceIssueCount < 0) throw new Error('Invalid source issue count');
  const ids = new Set<string>(), excludedProductIds: string[] = [];
  let currentCount = 0, previousCount = 0;
  for (const fact of facts) {
    identifier.parse(fact.productId);
    if (ids.has(fact.productId)) throw new RepositoryError('REFERENCE', 'Sản phẩm bị lặp trong nguồn tồn kho');
    ids.add(fact.productId);
    const imported = timestamp.safeParse(fact.importedAt), sold = fact.soldAt === undefined ? undefined : timestamp.safeParse(fact.soldAt);
    if (!imported.success || sold && !sold.success) { excludedProductIds.push(fact.productId); continue; }
    const enteredAt = Date.parse(imported.data), leftAt = sold?.success ? Date.parse(sold.data) : undefined;
    if (enteredAt > asOf || leftAt !== undefined && (leftAt < enteredAt || leftAt > asOf)) {
      excludedProductIds.push(fact.productId); continue;
    }
    if (leftAt === undefined) currentCount++;
    if (enteredAt < cutoff && (leftAt === undefined || leftAt >= cutoff)) previousCount++;
  }
  const status = sourceIssueCount || excludedProductIds.length ? 'INSUFFICIENT_EVIDENCE' as const
    : previousCount === 0 ? 'NO_BASELINE' as const : 'DEFINED' as const;
  return { scope: 'VERIFIED_PRODUCT_LIFECYCLE_ONLY' as const, baselineBefore: new Date(cutoff).toISOString(),
    currentCount, previousCount, sourceIssueCount, excludedProductIds, status,
    percent: status === 'DEFINED' ? (currentCount - previousCount) / previousCount * 100 : null };
}
