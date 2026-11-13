/** New purchases carry their own mapping snapshot. Untagged numeric legacy
 * states retain their existing meaning. Activated by the instruction to finish T05. */
export const PURCHASE_STATUS_MAPPING = Object.freeze({
  invoiceCompleted: 1,
  productAvailable: 1,
  productSold: 2,
});
