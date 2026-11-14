# G10 — File đã tạo/sửa trong lượt này

Ngày 14/11/2026; chưa staging/commit/push. Danh sách này không bao gồm file nguồn CODEX hoặc dữ liệu trình duyệt người dùng.

## Bổ sung lượt T04/T05

| File | Thay đổi |
|---|---|
| `src/repositories/constraints.ts`, `src/repositories/purchase-links.ts` | Đọc/tra FK theo lô trong transaction, phép kiểm snapshot đồng bộ, giữ nhánh legacy/provenance/reverse-FK và không cache qua lần ghi |
| `src/services/purchase-finalization.ts` | Cấp mã/ghi độc lập theo lô trong cùng transaction; bảo toàn 16 retry, chống tái sử dụng ID/version tombstone, receipt/audit và rollback |
| `tests/e2e/phase10-security.spec.ts`, `phase10-finalize-benchmark.spec.ts`, `phase10-integrity.spec.ts` | 8 ca mới: HTML hai vai trò/lý do, 4 benchmark real UI, rollback native graph 1.000 món |
| `tests/unit/purchase-candidate.test.ts`, `purchase-finalization.test.ts`, `phase10-audit.test.ts` | 6 ca unit/integration mới: freshness trong TX, ID/tombstone/exhaustion và parser unit evidence |
| `scripts/phase10-audit.ts` | Đọc JSON unit thực thi, giữ trạng thái report, không xuất raw failure messages/đường dẫn máy; nối unit với UC cùng E2E |
| `tests/e2e/phase10-visual.spec.ts`, `tests/visual/references/SC105-picker.png`, `SC105-picker.json` | Dùng đúng baseline cắt đã duyệt G10-D05 và hash metadata; không cần CODEX trong checkout test |
| `planning/phase10/*`, evidence T04/T05 | Quyết định asset, execution, đo đạc và cổng nghiệm thu còn mở; cập nhật tiến độ theo kết quả thật |

`PurchaseEditor.tsx` từng có log chẩn đoán tạm, đã gỡ hết và không có diff cuối. Không sửa UI để làm xanh test. Baseline SC105 là ngoại lệ nguồn được người dùng cho phép rõ; không stage/export các ảnh/PDF khác từ CODEX.

| Nhóm | File | Nội dung |
|---|---|---|
| Dependency đã duyệt G10-D04 | `package.json`, `package-lock.json` | Pin Vitest 5.1.0, Zod 4.6.7, Router 7.18.5 và dependency bắc cầu tương ứng |
| Tương thích runtime | `src/app/providers.tsx` | Giữ điều hướng HashRouter trước nâng qua `useTransitions={false}` |
| Hợp đồng validation | `src/domain/purchases.ts`, `src/services/purchase-report.ts`, `src/services/aged-stock-report.ts` | Thay API `.innerType()` bằng structural schema riêng; giữ writer refinement, reader relation checks và dữ liệu legacy |
| Visual report picker | `src/features/reports/ReportPicker.tsx`, `src/features/reports/report-catalog.ts`, các hunk `.report-*` trong `src/index.css` | Căn hình học/chữ/icon theo SC105; giữ nhãn truy cập và hành vi |
| Profile QA/cache | `.gitignore` | Ignore cache ảnh nguồn và expected source-derived snapshots; không xóa source |
| Test mới | `tests/e2e/phase10-journey.spec.ts`, `tests/e2e/phase10-usability-benchmark.spec.ts`, `tests/e2e/phase10-visual.spec.ts`, `tests/unit/phase10-audit.test.ts` | Hành trình thật, đo p50/p95, bàn phím/touch, đối chiếu pixel và kiểm parser evidence |
| Công cụ QA | `scripts/phase10-audit.ts`, `scripts/render-pdf-reference.ps1`, `scripts/render-pdf-reference.mjs` | Kiểm kê nguồn/ca chạy và raster PDF cục bộ; bản PDF.js xử lý nguồn mà Windows renderer cho ảnh trống |
| Tiến độ/tiêu chí | `planning/MASTER_PLAN_COCO.md`, `planning/PHASE_ROADMAP.md`, `planning/TEST_MASTER_PLAN.md`, `planning/phase10/PLAN_PHASE_10.md` | Ghi tiến độ và quyết định đã duyệt, không đổi roadmap/task/dependency |
| Execution/review | Các `.md` trong `planning/phase10/` | Decision Log, dependency, visual, journey, NFR, trace và báo cáo cuối lượt |
| Evidence | `planning/phase10/evidence/audit/`, `regression/`, `runtime/`, `runtime-after/`, `t01/`, `visual/` | Metadata/hash, kết quả thực thi thật, log lỗi ban đầu, ảnh runtime trước/sau và benchmark |

## Thay đổi ngoài phần G10 được bảo toàn

- Các hunk CSS bán hàng trong `src/index.css` và phần bổ sung trong `tests/e2e/sales-draft.spec.ts` xuất hiện từ bên ngoài phần đang sửa. Full regression đã kiểm chúng cùng trạng thái workspace; không tự nhận là thay đổi G10 hoặc gom vào commit phase.
- `.github/copilot-instructions.md`, `AGENTS.md`, `CHAY_COCO_LOCAL.cmd`, `CODEX/` ở root đã có trước. Không staging, sửa hoặc xóa trong lượt này.
- `node_modules`, `dist`, test-results, expected/cache nguồn PDF/PNG không đưa vào Git. Chưa tạo commit vì G10 chưa hoàn tất toàn bộ phạm vi/gate, dù suite hiện chạy PASS.

Evidence từ các lượt thử chưa hoàn tất hoặc bị ngắt được giữ để giải thích lỗi, không tính PASS: focused sandbox chưa kết thúc runner; startup port occupied; full sau nâng bị ngắt để sửa hai timeout; PDF renderer chưa đúng API ở lượt đầu. Báo cáo cuối chỉ tính số test duy nhất của lượt thực thi hoàn chỉnh.

## Bổ sung lượt popup khách hàng

Lượt BR sau đó chỉ sửa5 test file: `purchase-approvals.test.ts` (+12 ca), `staff-accounts.test.ts` (+7), `purchase-finalization.test.ts` (+2), `sale-payment.test.ts` (+3), `purchase-approvals.spec.ts` (+1 E2E). Hai review mới `APPROVAL_STAFF_BR_REVIEW.md`/`PURCHASE_SALES_REPORT_BR_REVIEW.md`, ledger98 BR và [execution](BR_REVIEW_EXECUTION.md) cập nhật bằng chứng. Full538/167/8 PASS; không sửa source sản phẩm, schema, dependency hoặc workflow trong lượt BR này.

Thêm `tests/unit/customer-edit.test.ts`: 13 ca kiểm các BR sửa/xóa khách hàng (validation/no-write, duplicate, giữ identity, race hai kết nối/reopen, purchase-only/sale-only). Thêm `tests/e2e/phase10-customer-edit.spec.ts`: 2 ca UI hai role, kiểm lỗi sửa, Hủy, sửa hợp lệ/reload và class popup không lan từ luồng xóa. Không đổi production service để làm test PASS. `CUSTOMER_BR_REVIEW.md`, `AUTH_BR_REVIEW.md`, `INVENTORY_BR_REVIEW.md` và ledger assertion ghi rõ phạm vi review; README bỏ thông tin tiến độ G6-T02 đã lỗi thời, nêu đúng luồng demo hiện có. `RELEASE_READINESS.md`, `SCHEMA_COMPATIBILITY.md`, `G10_REVIEW_GATE.md` là checkpoint/gói review đầu vào, không tự mở G11.

`ConfirmDialog.tsx`, `ResultDialog.tsx`, `CustomerDetailPage.tsx`, CSS riêng trong `src/index.css`, kỳ vọng đúng nguồn trong `confirmation.spec.ts`; thêm `tests/visual/customer-dialogs.local.spec.ts`, `playwright.visual.config.ts` và script/include/ignore tương ứng. [Chi tiết và bằng chứng](CUSTOMER_VISUAL_EXECUTION.md). Không sửa schema/service hoặc workflow. Nguồn/expected/diff khác SC105 không được version hóa. Full regression sau sửa được ghi riêng, không tái sử dụng số PASS lịch sử làm kết quả mới.
