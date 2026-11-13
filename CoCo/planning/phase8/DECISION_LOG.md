# G8 Decision Log

## G8-D05 — Automatic membership discount (current decision)

- **CONFIRMED_USER — 13/11/2026**, attached request “FIX MODULE BÁN HÀNG THEO FIGMA VÀ SRS”, section 5: automatically apply 20% for registered members with at least 50 points; remove the discount-selection checkbox.
- Supersedes the optional discount selection in G8-D02 for new checkouts only. Existing paid invoices/snapshots remain unchanged.
- Formula, exactly 50 points used, post-discount accrual, successful-payment-only point writes and P05 mapping/atomic transaction remain unchanged.
- Explicit opt-in to register membership remains required; registration consent is independent from automatic discount eligibility.

## G8-D01 — Membership registration at checkout

- **Status:** CONFIRMED_USER — 13/11/2026.
- Registration happens during checkout only after an explicit customer opt-in recorded by staff.
- Creating or editing a customer profile does not register that customer.
- Existing members remain members in later transactions. A non-member may still buy, but earns no points and cannot use the member discount.
- Membership status is independent from the point balance; zero points does not mean non-member.
- The existing `memberships` record `{ MaKH, registeredAt, registeredBy }` can persist this event; no new store or column is currently needed.
- **UI change approved by user 13/11/2026:** add explicit registration opt-in and member-discount selection controls to the existing UI10 checkout flow, without schema changes.
- Persist the membership event immediately after explicit opt-in, even if the sale is later cancelled or payment fails. Point balances still change only after successful payment.
- Do not infer consent; an existing member is recognized from the membership record and is not re-registered.

## G8-D02 — 20% membership discount and points

- **Status:** CONFIRMED_USER — 13/11/2026.
- `Subtotal` is the sum of sale-line totals.
- For a member with at least 50 points who opts to use the discount:
  - `TienKhuyenMai = roundHalfUp(Subtotal × 20%)`.
  - `TongTienThanhToan = Subtotal - TienKhuyenMai`.
  - Exactly 50 points are used.
- Newly earned points are `floor(TongTienThanhToan / 10000)` for members, whether or not they use the discount.
- `DiemSauGiaoDich = DiemTruocGiaoDich - DiemSuDung + DiemTichMoi`.
- Non-members do not use or earn member points. Points change only once after successful payment; cancellation, failure, and rollback do not change them.
- Do not infer this rule from G7's 30% scheduler discount rounding.

## G8-D03 — Sale invoice legacy fields and snapshots (P05)

- **Status:** CONFIRMED_USER — 13/11/2026; semantic mapping is closed, physical metadata/migration remains a review gate before finalization.
- `TongTien` is the payable amount after discount: `Subtotal - TienKhuyenMai`.
- `TienKhuyenMai` is the actual discount calculated from pre-discount subtotal; it is zero when unused.
- `TichDiem` is the points newly earned on this invoice, not the customer's balance or the net change after points used. Non-members earn zero.
- Required business snapshots: pre-discount subtotal; points used; points before/after; membership status at sale time; actual unit price and line total for every product.
- Preserve existing legacy invoices; do not backfill unsupported historical values or overwrite their meaning.
- Review the physical mapping, additive metadata/migration, and compatibility tests before implementing a finalizer.

## G8-D04 — P05 physical snapshot and new invoice codes

- **CONFIRMED_USER — 13/11/2026:** user approved [P05_PHYSICAL_REVIEW.md](P05_PHYSICAL_REVIEW.md) and its codes for new invoices.
- Add `sales-invoice:<MaHDBH>` / `sales-invoice-v1` snapshots in existing appMetadata, without schema migration or legacy backfill.
- New invoices only: TrangThai=1 completed; PTTT=1 cash, 2 bank transfer. Save the mapping per invoice; never infer legacy meanings from it.
- Invoice, lines, sold status, points, snapshots, versions, receipt and audit commit atomically after actual confirmation; opening/cancelling QR is read-only.

