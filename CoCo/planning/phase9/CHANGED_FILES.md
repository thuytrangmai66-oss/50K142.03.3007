# G9 — File thuộc gói bàn giao

Ngày 14/11/2026. Danh sách từ working tree trên main so với HEAD nền f580a229. Không bao gồm CODEX, launcher và rule ngoài phạm vi đã có trước. Không có thay đổi schema/version DB, dependencies/lockfile hoặc workflow.

## Source và test

- `src/app/router.tsx`
- `src/components/layout/CoCoLayout.tsx`
- `src/components/ui/DataTable.tsx`
- `src/domain/revenue-report.ts`
- `src/domain/stock-comparison.ts`
- `src/features/auth/AuthProvider.tsx`
- `src/features/auth/context.ts`
- `src/features/home/HomePage.tsx`
- `src/features/home/HomeQuickActions.tsx`
- `src/features/reference-data/use-list-page-size.ts`
- `src/features/reports/AgedStockReportPage.tsx`
- `src/features/reports/FinancialReportPage.tsx`
- `src/features/reports/PurchaseCostReportPage.tsx`
- `src/features/reports/ReportPicker.tsx`
- `src/features/reports/RevenueReportPage.tsx`
- `src/index.css`
- `src/repositories/index.ts`
- `src/repositories/purchase-links.ts`
- `src/services/aged-stock-report.ts`
- `src/services/auth/service.ts`
- `src/services/customer-creation.ts`
- `src/services/dashboard.ts`
- `src/services/financial-reports.ts`
- `src/services/purchase-report.ts`
- `src/services/reference-data/local.ts`
- `src/services/report-queries.ts`
- `src/services/sales-report-ledger.ts`
- `src/services/stock-comparison.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/dashboard-review-template.html`
- `tests/e2e/home-stock-comparison.spec.ts`
- `tests/e2e/home-t05.spec.ts`
- `tests/e2e/inventory.spec.ts`
- `tests/e2e/purchase-approvals.spec.ts`
- `tests/e2e/reports-purchase-cost.spec.ts`
- `tests/e2e/reports-reconciliation.spec.ts`
- `tests/e2e/reports-revenue.spec.ts`
- `tests/e2e/reports-t04.spec.ts`
- `tests/unit/customer-creation.test.ts`
- `tests/unit/dashboard-comparison.test.ts`
- `tests/unit/financial-number.test.ts`
- `tests/unit/report-queries.test.ts`
- `tests/unit/revenue-report.test.ts`
- `tests/unit/stock-comparison.test.ts`

## Tài liệu

- `planning/MASTER_PLAN_COCO.md`
- `planning/phase10/PLAN_PHASE_10.md`
- `planning/phase9/DATA_REVIEW.md`
- `planning/phase9/DECISION_LOG.md`
- `planning/phase9/HISTORICAL_STOCK_REVIEW.md`
- `planning/phase9/IMPLEMENTATION_REVIEW.md`
- `planning/phase9/PLAN_PHASE_9.md`
- `planning/phase9/REPORT_PHASE_9.md`
- `planning/phase9/STOCK_COMPARISON_EXECUTION.md`
- `planning/phase9/T01_EXECUTION.md`
- `planning/phase9/T02_UI_EXECUTION.md`
- `planning/phase9/T03_EXECUTION.md`
- `planning/phase9/T04_EXECUTION.md`
- `planning/phase9/T05_EXECUTION.md`
- `planning/phase9/T05_REVIEW_GATE.md`
- `planning/phase9/T06_EXECUTION.md`
- `planning/REQUIREMENT_TRACEABILITY.md`
- `planning/TEST_CASE_CATALOG.md`
- `planning/phase9/CHANGED_FILES.md`

Bổ sung cuối: `planning/phase9/G9_REVIEW_GATE.md`, `planning/phase9/STOCK_COMPARISON_EXECUTION.md` và source/test G9-D05 đã nằm trong danh sách tương ứng. SHA bàn giao được báo sau push.

## Bằng chứng

`planning/phase9/evidence/` chứa screenshot runtime và log/last-run kiểm thử có dữ liệu giả lập trong profile kiểm thử riêng; không dump database người dùng. `planning/phase9/review/` chứa HTML đề xuất wording lịch sử, không được import vào runtime.

Commit bàn giao và trạng thái Actions/Pages được xác minh sau push, báo trong bàn giao chat; không coi push là nghiệm thu hoặc phase DONE.
