import type Dexie from 'dexie';

/** T01 accepted for runtime activation. Additive: legacy stores/keys/rows and
 * numeric statuses are never rewritten. The helper retains frozen-v3 test support.
 */
export const PURCHASE_METADATA_STORES = {
  purchaseDrafts: '&id, employeeId, createdBy, customerId, status',
  purchaseLines: '&id, draftId, bracket.id, approvalId',
  purchaseApprovals: '&id, draftId, lineId, requestedBy, decision.status',
  purchaseNotices: '&id, approvalId, recipient, delivery',
  purchaseFinalizations: '&invoiceId, &draftId',
  purchaseProvenance: '&productId, invoiceId, lineId',
} as const;

export function registerPurchaseMetadataCandidate(database: Dexie): void {
  if (!database.isOpen() && database.verno === 4) return;
  if (database.isOpen() || database.verno !== 3) throw new Error('Migration candidate requires a closed v3 database definition');
  database.version(4).stores(PURCHASE_METADATA_STORES);
}
