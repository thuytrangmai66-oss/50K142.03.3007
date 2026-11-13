# G8-T02 — Membership promotion and points

> Quyết định mới G8-D05 (13/11/2026) đã thay lựa chọn ưu đãi bằng áp dụng tự động cho thành viên đủ 50 điểm, bỏ checkbox dùng ưu đãi. Giữ opt-in đăng ký thành viên, công thức và P05; nội dung giao việc cũ phía dưới là lịch sử, không được dùng để thêm lại checkbox. Xem [báo cáo sửa module](SALES_FIGMA_SRS_FIX.md).

> Cập nhật sau chỉ đạo tiếp tục 13/11/2026: P05 physical gate đã được chủ dự án xác nhận (G8-D04); điểm đã được nối vào finalizer T04. Tài liệu giao task ban đầu bên dưới là lịch sử phạm vi T02. Xem [T03/T04 execution](T03_T04_EXECUTION.md); T02–T04 vẫn PENDING REVIEW, không tự DONE.

## Status

**IN PROGRESS — calculation, checkout opt-in, membership persistence, and discount preview implemented; payment/final points integration remains.**

Read [PLAN_PHASE_8.md](PLAN_PHASE_8.md) and [DECISION_LOG.md](DECISION_LOG.md) first. The approved membership and discount rules are recorded there.

## Authorized scope now

- Implement and test pure sale-promotion calculations: integer subtotal, 20% discount rounding, exactly 50 points used when eligible and selected, points earned from the post-discount amount, and no member benefits for non-members.
- Do not write invoices, inventory status, revenue, or customer point balances from this calculation.
- Reuse the existing `memberships` record shape `{ MaKH, registeredAt, registeredBy }`; do not change schema or migrations.
- Add explicit checkout opt-in and member-discount selection controls to the existing UI10 flow, as approved by the user on 13/11/2026.
- Persist a membership immediately after explicit opt-in, even if the subsequent sale is cancelled or payment fails. Keep point changes deferred until successful payment.

## Blocked scope

- `memberships` storage exists. Do not create a membership event without explicit checkout consent; deduplicate existing members and keep the action authorized/audited.
- Do not implement payment/finalization or persist P05 snapshots until the physical mapping/additive migration has passed its separate review gate.

## Verification and handoff

- The pure calculation and membership service/UI portions are in `src/domain/sales.ts`, `src/services/sales.ts`, `src/features/sales/SalesEditor.tsx`, and `tests/unit/sales.test.ts`.
- Owner/staff UI coverage, including persistence after draft cancellation, is in `tests/e2e/sales-draft.spec.ts`.
- Keep G8-T02 partial until checkout opt-in, membership persistence, discount selection/eligibility, and points/payment integration are implemented and tested.
- Do not mark G8 or UC_3.1 complete; do not commit, push, or deploy.

