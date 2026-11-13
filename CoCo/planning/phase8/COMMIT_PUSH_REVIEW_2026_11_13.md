# Kiểm tra phạm vi commit CoCo — 13/11/2026

Nguồn ủy quyền: người dùng yêu cầu trực tiếp commit và push phiên bản hiện tại, giữ branch, không merge main, không force/reset/rebase và không tự deploy. Chỉ đạo này thay thế giới hạn không commit/push ở các execution lịch sử; không thay đổi trạng thái nghiệm thu.

## Git và phạm vi

- Repository root: `D:\50K142-NEW`; ứng dụng nằm trong `CoCo/`.
- Branch giữ nguyên: `coco/phase-7`; HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`.
- `origin`: `https://github.com/thuytrangmai66-oss/50K142.03.3007.git`.
- Truy vấn remote trước commit: `main` vẫn ở HEAD nền; chưa có remote branch `coco/phase-7`. Push sẽ tạo đúng nhánh đó và đặt upstream, không thay `main`.
- Index ban đầu rỗng; đã đọc status, diff tracked/cached, master plan và các execution/review mới nhất. Mã G3–G8 trước đây chưa commit nên phải đưa cả các dependency source/test cần thiết vào cùng bản hiện tại, không chỉ riêng file Sales.
- Message dự kiến: `feat(coco): update sales module and project progress`.

## Kiểm chứng

Lint, typecheck, build: PASS. Full unit/integration chạy riêng: 345/345 PASS, 16 file, 0 SKIP. **Full Chromium cuối FAIL: 125 PASS / 1 FAIL / 0 SKIP**. Bài phục hồi lỗi đọc lịch sử thu mua không tìm thấy link hóa đơn sau reload (`purchase-queries.spec.ts:128`). Theo yêu cầu mới, **dừng trước staging/commit/push**; index vẫn rỗng, chưa tạo commit hoặc remote branch. Không sửa hoặc rerun test sau lỗi cuối để phục vụ push. Xem [T06](T06_EXECUTION.md) để phân biệt các lượt lỗi trung gian và lần xác minh cuối. Danh sách dưới chỉ là phương án chọn file, chưa được commit.

## Kiểm tra file và thông tin nhạy cảm

- Chọn chính xác các đường dẫn source, test, logo cần thiết, tài liệu kế hoạch/review/execution và launcher local. Không dùng `git add .`.
- Danh sách chọn không có `.env`, `node_modules`, `dist`, database, backup, video/trace hoặc báo cáo Playwright sinh tự động.
- Quét các mẫu token GitHub/OpenAI/AWS/Google/Supabase/Slack, JWT và private key trên toàn bộ file văn bản đã chọn: không có kết quả trùng. Đây là kiểm tra theo mẫu, không phải chứng nhận tuyệt đối không có secret.
- Dữ liệu fixture/tài khoản trong test là dữ liệu kiểm thử, không phải export database hay tài khoản thật. Không đọc, export hoặc reset IndexedDB của người dùng.
- `CODEX/` (tài liệu/thiết kế nguồn ngoài application), ảnh/JSON metrics/log sinh tự động, `ui-evidence/` và `scripts/measure.mjs` được giữ local, không staging. Log `*.log` vốn đã ignore. Các link evidence trong execution là đường dẫn artifact local; bản source trên GitHub không kèm toàn bộ ảnh/log đó.
- Không thay workflow, Git config, schema, UI, nghiệp vụ hoặc trạng thái nghiệm thu để thực hiện push. G7 giữ phạm vi đã nghiệm thu cùng ngoại lệ; G8 vẫn PENDING REVIEW.

## Actions / Pages

Workflow root hiện tại chỉ nhận push `main`, PR nhắm `main` và workflow_dispatch. Push branch `coco/phase-7` đơn thuần không kích hoạt deploy Pages theo cấu hình đó. Không tự tạo PR, dispatch workflow hoặc sửa cài đặt Pages/Actions. Trạng thái remote sau push và URL commit được báo trong bàn giao, không đoán commit từ mốc nền.

Kết quả lần này: không push nên không có Actions run/Pages deployment mới từ phiên làm việc này; chưa truy vấn trạng thái vận hành hiện tại của Pages/Actions. Không có URL commit mới. Toàn bộ thay đổi và artifact vẫn được giữ local.

## Danh sách file chọn commit

Danh sách dưới đây được sinh từ tập đường dẫn cụ thể trước staging; file ngoài danh sách được giữ nguyên local.

Tổng: 210 file.

```text
CHAY_COCO_LOCAL.cmd
CoCo/.gitignore
CoCo/planning/BASELINE_AUDIT.md
CoCo/planning/CODEX_SOURCE_REVIEW.md
CoCo/planning/FIGMA_SCREEN_MAPPING.md
CoCo/planning/LIST_ROW_DIVIDERS_REVIEW.md
CoCo/planning/MASTER_PLAN_COCO.md
CoCo/planning/OPEN_ISSUES.md
CoCo/planning/PHASE_ROADMAP.md
CoCo/planning/phase0/ARCHITECTURE_DECISION.md
CoCo/planning/phase0/OPEN_ISSUES.md
CoCo/planning/phase10/PLAN_PHASE_10.md
CoCo/planning/phase11/PLAN_PHASE_11.md
CoCo/planning/phase2/REPORT_PHASE_2.md
CoCo/planning/phase3/ASSET_MANIFEST.md
CoCo/planning/phase3/AUTH_CONTRACTS.md
CoCo/planning/phase3/PLAN_PHASE_3.md
CoCo/planning/phase3/REPORT_PHASE_3.md
CoCo/planning/phase3/TEST_EXECUTION.md
CoCo/planning/phase4/DEMO_GUIDE.md
CoCo/planning/phase4/PLAN_PHASE_4.md
CoCo/planning/phase4/REPORT_PHASE_4.md
CoCo/planning/phase5/CONFIRM_DIALOG_REVIEW.md
CoCo/planning/phase5/DEMO_GUIDE.md
CoCo/planning/phase5/IDENTITY_CONTRACT.md
CoCo/planning/phase5/LIST_LAYOUT_POLISH_REVIEW.md
CoCo/planning/phase5/PAGINATION_LAYOUT_REVIEW.md
CoCo/planning/phase5/PAGINATION_STANDARDIZATION_REVIEW.md
CoCo/planning/phase5/PLAN_PHASE_5.md
CoCo/planning/phase5/REPORT_PHASE_5.md
CoCo/planning/phase5/REVIEW_COMPLETION.md
CoCo/planning/phase5/TEST_EXECUTION.md
CoCo/planning/phase6/ACCEPTANCE_CHECKLIST.md
CoCo/planning/phase6/APPROVAL_POPUP_CLOSE_FIX.md
CoCo/planning/phase6/DATA_CONTRACT_REVIEW.md
CoCo/planning/phase6/DEMO_ACCEPTANCE.md
CoCo/planning/phase6/G6_ACCEPTANCE_MATRIX.md
CoCo/planning/phase6/PLAN_PHASE_6.md
CoCo/planning/phase6/PURCHASE_CUSTOMER_FIGMA_REVIEW.md
CoCo/planning/phase6/PURCHASE_EDITOR_LAYOUT_REVIEW.md
CoCo/planning/phase6/PURCHASE_LIST_ENTRY_REVIEW.md
CoCo/planning/phase6/REPORT_PHASE_6.md
CoCo/planning/phase6/T01_FK_REVIEW_EXECUTION.md
CoCo/planning/phase6/T01_REVIEW_GATE.md
CoCo/planning/phase6/T02_EXECUTION.md
CoCo/planning/phase6/T03_SERVICE_PROGRESS.md
CoCo/planning/phase6/T04_EXECUTION.md
CoCo/planning/phase6/T05_CANDIDATE_PROGRESS.md
CoCo/planning/phase6/T05_EXECUTION.md
CoCo/planning/phase6/T06_EXECUTION.md
CoCo/planning/phase6/T06_REQUIREMENT_REVIEW.md
CoCo/planning/phase6/T07_EXECUTION.md
CoCo/planning/phase7/ACCEPTANCE_2026_11_13.md
CoCo/planning/phase7/COPILOT_NEXT_TASKS.md
CoCo/planning/phase7/DECISION_LOG.md
CoCo/planning/phase7/PLAN_PHASE_7.md
CoCo/planning/phase7/REPORT_PHASE_7.md
CoCo/planning/phase7/T01_REQUIREMENT_REVIEW.md
CoCo/planning/phase7/T02_DATA_REVIEW.md
CoCo/planning/phase7/T02_T06_EXECUTION.md
CoCo/planning/phase8/ACCEPTANCE_CHECKLIST.md
CoCo/planning/phase8/COMMIT_PUSH_REVIEW_2026_11_13.md
CoCo/planning/phase8/COPILOT_T01_TASK.md
CoCo/planning/phase8/COPILOT_T02_TASK.md
CoCo/planning/phase8/DECISION_LOG.md
CoCo/planning/phase8/LOCAL_RUN.md
CoCo/planning/phase8/P05_PHYSICAL_REVIEW.md
CoCo/planning/phase8/PLAN_PHASE_8.md
CoCo/planning/phase8/REPORT_PHASE_8.md
CoCo/planning/phase8/SALES_FIGMA_SRS_FIX.md
CoCo/planning/phase8/T01_EXECUTION.md
CoCo/planning/phase8/T02_EXECUTION.md
CoCo/planning/phase8/T02_REVIEW_2026_11_13.md
CoCo/planning/phase8/T03_T04_EXECUTION.md
CoCo/planning/phase8/T05_EXECUTION.md
CoCo/planning/phase8/T06_EXECUTION.md
CoCo/planning/phase9/PLAN_PHASE_9.md
CoCo/planning/PLAN_VALIDATION.md
CoCo/planning/REQUIREMENT_TRACEABILITY.md
CoCo/planning/SOURCE_INVENTORY.csv
CoCo/planning/TEST_CASE_CATALOG.md
CoCo/planning/TEST_MASTER_PLAN.md
CoCo/README.md
CoCo/scripts/audit-phase1.mjs
CoCo/scripts/start-local.ps1
CoCo/src/app/providers.tsx
CoCo/src/app/router.tsx
CoCo/src/assets/coco-mark.png
CoCo/src/components/layout/CoCoLayout.tsx
CoCo/src/components/ui/Button.tsx
CoCo/src/components/ui/ConfirmDialog.tsx
CoCo/src/components/ui/DataTable.tsx
CoCo/src/components/ui/Field.tsx
CoCo/src/components/ui/FormDialog.tsx
CoCo/src/components/ui/Notice.tsx
CoCo/src/components/ui/ResultDialog.tsx
CoCo/src/db/purchase-metadata.ts
CoCo/src/db/schema.ts
CoCo/src/domain/auth.ts
CoCo/src/domain/conditions.ts
CoCo/src/domain/formatters.ts
CoCo/src/domain/inventory.ts
CoCo/src/domain/pagination.ts
CoCo/src/domain/purchases.ts
CoCo/src/domain/purchase-status.ts
CoCo/src/domain/sale-payment.ts
CoCo/src/domain/sales.ts
CoCo/src/features/approvals/ApprovalsPage.tsx
CoCo/src/features/auth/AuthPage.tsx
CoCo/src/features/auth/AuthProvider.tsx
CoCo/src/features/auth/context.ts
CoCo/src/features/auth/use-auth.ts
CoCo/src/features/customers/CustomerDetailPage.tsx
CoCo/src/features/customers/CustomerForm.tsx
CoCo/src/features/customers/CustomerHistoryPage.tsx
CoCo/src/features/customers/CustomersPage.tsx
CoCo/src/features/customers/CustomerToolbar.tsx
CoCo/src/features/home/HomePage.tsx
CoCo/src/features/inventory/DiscountMonitor.tsx
CoCo/src/features/inventory/InventoryEditForm.tsx
CoCo/src/features/inventory/InventoryPages.tsx
CoCo/src/features/price-brackets/BracketForm.tsx
CoCo/src/features/price-brackets/PriceBracketsPage.tsx
CoCo/src/features/purchases/PurchaseEditor.tsx
CoCo/src/features/purchases/PurchaseInvoicePage.tsx
CoCo/src/features/purchases/PurchaseResults.tsx
CoCo/src/features/purchases/PurchasesPage.tsx
CoCo/src/features/reference-data/use-list-page-size.ts
CoCo/src/features/reference-data/use-resource.ts
CoCo/src/features/sales/SaleInvoiceCard.tsx
CoCo/src/features/sales/SalesEditor.tsx
CoCo/src/features/sales/SalesPages.tsx
CoCo/src/features/sales/TransferQrDialog.tsx
CoCo/src/features/staff/StaffForm.tsx
CoCo/src/features/staff/StaffPages.tsx
CoCo/src/index.css
CoCo/src/lib/payment/vietqr.ts
CoCo/src/main.tsx
CoCo/src/repositories/constraints.ts
CoCo/src/repositories/errors.ts
CoCo/src/repositories/index.ts
CoCo/src/repositories/purchase-links.ts
CoCo/src/services/auth/crypto.ts
CoCo/src/services/auth/errors.ts
CoCo/src/services/auth/service.ts
CoCo/src/services/auth/storage.ts
CoCo/src/services/discount-scheduler.ts
CoCo/src/services/inventory.ts
CoCo/src/services/permissions.ts
CoCo/src/services/purchase-approvals.ts
CoCo/src/services/purchase-candidate.ts
CoCo/src/services/purchase-drafts.ts
CoCo/src/services/purchase-finalization.ts
CoCo/src/services/purchase-queries.ts
CoCo/src/services/reference-data/contracts.ts
CoCo/src/services/reference-data/local.ts
CoCo/src/services/sales.ts
CoCo/src/services/sales-payment.ts
CoCo/src/services/sales-queries.ts
CoCo/src/services/staff-accounts.ts
CoCo/tests/e2e/auth.spec.ts
CoCo/tests/e2e/auth-helpers.ts
CoCo/tests/e2e/confirmation.spec.ts
CoCo/tests/e2e/discount-scheduler.spec.ts
CoCo/tests/e2e/g6-verification.spec.ts
CoCo/tests/e2e/inventory.spec.ts
CoCo/tests/e2e/inventory-edit.spec.ts
CoCo/tests/e2e/inventory-helpers.ts
CoCo/tests/e2e/pagination.spec.ts
CoCo/tests/e2e/pagination-helpers.ts
CoCo/tests/e2e/purchase-approvals.spec.ts
CoCo/tests/e2e/purchase-candidate-storage.spec.ts
CoCo/tests/e2e/purchase-customer-layout.spec.ts
CoCo/tests/e2e/purchase-drafts.spec.ts
CoCo/tests/e2e/purchase-editor-figma.spec.ts
CoCo/tests/e2e/purchase-finalization.spec.ts
CoCo/tests/e2e/purchase-finalization-storage.spec.ts
CoCo/tests/e2e/purchase-helpers.ts
CoCo/tests/e2e/purchase-list.spec.ts
CoCo/tests/e2e/purchase-queries.spec.ts
CoCo/tests/e2e/purchase-results.spec.ts
CoCo/tests/e2e/reference-data.spec.ts
CoCo/tests/e2e/sale-payment.spec.ts
CoCo/tests/e2e/sales-draft.spec.ts
CoCo/tests/e2e/sales-helpers.ts
CoCo/tests/e2e/sales-pages.spec.ts
CoCo/tests/e2e/sales-t05-t06.spec.ts
CoCo/tests/e2e/shell.spec.ts
CoCo/tests/e2e/staff.spec.ts
CoCo/tests/e2e/staff-review.spec.ts
CoCo/tests/fixtures/g6-migration-verification.ts
CoCo/tests/fixtures/phase2-schema.ts
CoCo/tests/fixtures/purchase-candidate-browser.ts
CoCo/tests/fixtures/purchase-finalization-browser.ts
CoCo/tests/fixtures/purchase-finalized-graph.ts
CoCo/tests/unit/auth.test.ts
CoCo/tests/unit/discount-scheduler.test.ts
CoCo/tests/unit/inventory.test.ts
CoCo/tests/unit/pagination.test.ts
CoCo/tests/unit/purchase-approvals.test.ts
CoCo/tests/unit/purchase-candidate.test.ts
CoCo/tests/unit/purchase-contract.test.ts
CoCo/tests/unit/purchase-drafts.test.ts
CoCo/tests/unit/purchase-finalization.test.ts
CoCo/tests/unit/purchase-queries.test.ts
CoCo/tests/unit/reference-data.test.ts
CoCo/tests/unit/repositories.test.ts
CoCo/tests/unit/sale-payment.test.ts
CoCo/tests/unit/sales.test.ts
CoCo/tests/unit/staff-accounts.test.ts
```
