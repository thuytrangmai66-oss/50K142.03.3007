# G8-T01 acceptance checklist

## T05–T06, 13/11/2026 — kiểm chứng hiện tại

Các mục bên dưới thay thế trạng thái còn thiếu lịch sử/in ở ghi chú cũ; các con số kiểm thử trước đó giữ làm lịch sử. Chưa nghiệm thu G8.

- [x] Lịch sử khách mua từ COCO dùng mã khách và bộ đọc snapshot P05; hồ sơ đổi không làm mất hóa đơn hoặc thay tên/điện thoại/điểm lịch sử.
- [x] Shared `SaleInvoiceCard` cho Bán hàng và lịch sử; legacy không bị diễn giải lại, snapshot hỏng không được fallback.
- [x] Ctrl+P có print stylesheet, không thêm control khác Figma; kiểm tra nền trắng, ẩn điều hướng và chỉ đọc trên cả hai vai trò.
- [x] Thêm test tranh chấp 50 điểm/hai món/hai vai trò, quote cũ và phục hồi không F5, scheduler đổi giá khi QR mở; mở rộng fault injection transaction.
- [x] Full unit/integration chạy riêng 345/345 PASS, 16 file, 0 SKIP; lint và build/typecheck PASS.
- [ ] Full Chromium cuối: **FAIL**, 125 PASS / 1 FAIL / 0 SKIP; lỗi phục hồi lịch sử thu mua tại `purchase-queries.spec.ts:128`. Dừng trước staging/commit/push theo chỉ đạo mới; không tự sửa/rerun test sau lỗi cuối.
- [ ] Máy in/hộp thoại in native, ngân hàng thật và scanner vật lý: NOT RUN.
- [ ] Chủ dự án nghiệm thu T02–T06/G8; không tự DONE hoặc chuyển G9.

[T05 execution](T05_EXECUTION.md) · [T06 execution và log lỗi/chạy lại](T06_EXECUTION.md).

## Sales module fix requested 13/11/2026

**IMPLEMENTED / PENDING REVIEW**; see [module report](SALES_FIGMA_SRS_FIX.md).

- [x] Sales sidebar opens the real invoice list; creation uses the existing draft routes.
- [x] Combined ID/date/name/phone filters, reset, adaptive pagination, empty/no-match/read-failure states and read-only detail.
- [x] UI10 title/identifier placement, inline product input/keyboard-wedge Enter, four columns, customer/payment typography and footer actions.
- [x] D05 automatic discount in preview and authorized service, with registration opt-in preserved; no schema/P05 or old-invoice rewrite.
- [x] Native two-role point changes update the other cart's automatic discount without F5.
- [x] Original PDF viewport verified as 1440×900; screenshots also cover 1366×768 and 1920×1080 at browser zoom 100%.
- [x] Regression: 339/339 unit/integration, 123/123 full Chromium before last visual refinement; final scoped Sales + purchase-geometry Chromium 19/19, lint/typecheck/build PASS. No skips.
- [ ] Owner acceptance; printing/history integration/full T06 and physical scanner/banking verification remain separate.

## G8-T03/T04 implementation, 13/11/2026

See [execution and evidence](T03_T04_EXECUTION.md). **PENDING REVIEW**, not phase acceptance.

- [x] P05 physical snapshots and new-invoice codes explicitly confirmed by user (G8-D04).
- [x] Local QR encoder, independent TLV parser and published CRC oracle; correct fixed account and post-discount amount.
- [x] UI11 matches local source SC046/SC238; owner/staff screenshots at three desktop viewports.
- [x] Cash/Lưu and transfer/Đã nhận commit invoice, details, sold state, member points, snapshots, versions, receipt and audit atomically.
- [x] Opening/back/Escape QR does not write business data. Failed native writes roll back; retry succeeds once.
- [x] Two native tabs cannot sell the same product twice; stale quote and revoked session are rejected.
- [x] T02 point updates now integrated into successful T04 payments; membership opt-in persistence is preserved on cancellation.
- [x] Empty-table layout regression diagnosed and fixed without loosening pagination tests; focused 4/4 PASS.
- [x] Final full regression: 330/330 unit/integration, 119/119 Chromium, lint/typecheck/build PASS; zero skips.
- [ ] Physical banking-app QR scan / manual acceptance.
- [ ] Owner acceptance of T02/T03/T04 and G8; T05/T06 remain later tasks.

## G8-T02 local review, 13/11/2026

Status remains **PARTIAL / PENDING REVIEW**, not acceptance of the full task or G8. See [review](T02_REVIEW_2026_11_13.md) and [local launcher instructions](LOCAL_RUN.md).

- [x] Source reviewed against G8-D01..D03; explicit opt-in, audited membership persistence, integer promotion preview and deferred point writes retained.
- [x] Reproduced and fixed empty-cart promotion render failure; owner/staff regression removes the last item and adds it again.
- [x] Fixed sales-only spacing that clipped action buttons; focused Chromium verifies fully visible buttons at 1366×768, 1440×900 and 1920×1080.
- [x] Windows launcher checked with the real server and reuse of port 5173.
- [ ] Successful payment, persisted points and P05 physical snapshots: later dependent work, not accepted by this review.
- [ ] Owner acceptance of G8-T02 / G8.

G8-T01 draft-cart subset was source-reviewed and accepted on 13/11/2026. This is not acceptance of UC_3.1 or G8.

## T01 draft-cart subset

- [x] Owner can create and persist an owner-scoped draft.
- [x] Staff can create and persist a staff-scoped draft.
- [x] Only mapped products currently in the available state can be added.
- [x] Product lines snapshot the source identity, name, sale price, quantity 1, version, and selection time.
- [x] Duplicate product lines are refused.
- [x] Draft subtotal uses safe integer arithmetic and rejects overflow.
- [x] Add/save paths revalidate availability, current price, and product version.
- [x] Draft operations do not create an invoice or sale detail, mark stock sold, or update revenue/membership/points.
- [x] Owner/staff browser flows and role-scoped state are covered by Chromium E2E.
- [x] Full unit/integration, Chromium, lint, typecheck, and production build checks pass.
- [x] Owner and staff screenshots captured at 1440×900.
- [x] Independent source/evidence review and formal acceptance of the draft-cart subset.

## Not included in T01 / later-task gates

- [ ] Finalized money/time snapshots and invoice completion — P05 semantics confirmed; physical snapshot/migration review remains required before finalizer.
- [ ] Explicit membership registration event/control — P06 UI/service persistence is implemented and tested under G8-T02; formal task acceptance remains pending.
- [ ] G8 20% discount and points — P07 calculator, eligibility control, and draft preview are implemented; successful-payment point updates are not implemented or accepted.
- [ ] Cash/QR payment, invoice history, reporting, or stock/revenue updates — later phase tasks.

## Evidence

- [T01 execution report](T01_EXECUTION.md)
- [Owner screenshot, 1440×900](evidence/T01-owner-cart-1440x900.png)
- [Staff screenshot, 1440×900](evidence/T01-staff-cart-1440x900.png)
- Focused E2E: `tests/e2e/sales-draft.spec.ts`, `tests/e2e/purchase-editor-figma.spec.ts`
- Unit/integration: `tests/unit/sales.test.ts`; full suite results in `T01_EXECUTION.md`
