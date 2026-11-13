# G9-T01 — Nền kỳ báo cáo và component dùng chung

Ngày 13/11/2026. **PARTIAL / PENDING REVIEW**. Phần tính kỳ và component đã triển khai; route/sidebar, truy vấn báo cáo và kiểm chứng Chromium chưa tích hợp. Không nghiệm thu G9.

## Nguồn và baseline

- MASTER_PLAN/PLAN_PHASE_9: T01 → T02 → T03 → T04 → T05 → T06, không đổi thứ tự.
- Figma local CODEX: đã xem SC105–110, SC114/117/120/123/126/128 và dashboard SC007/198. Không truy cập link Figma; dùng primitive Button, font và màu hiện có.
- Branch `coco/phase-7`, HEAD nền `733829496c2506e637db37445c90672c425d843b`, giữ toàn bộ working tree G8. Không staging/commit/push/deploy, không tạo branch mới hoặc reset dữ liệu.
- Baseline cuối G8: 345 unit/integration + 131 Chromium PASS, lint/typecheck/build PASS; kết quả lịch sử, không báo đã chạy lại Chromium ở lượt T01.

## Đã triển khai

1. `src/lib/vietnam-time.ts`: ngày/tháng/năm/khoảng, tất cả dùng ngày nghiệp vụ UTC+7. Ngày cuối tính trọn vẹn bằng `start <= instant < midnightAfterEnd`. Không phụ thuộc timezone máy, xử lý tháng 2/năm nhuận, đổi năm và năm 0..99 của JavaScript đúng cách.
2. Chặn ngày không tồn tại, thiếu thời gian, tháng/năm sai và khoảng đảo; không âm thầm chuẩn hóa ngày 30/02. Timestamp giao dịch cần timezone tường minh. Form đổi dd/mm/yyyy, mm/yyyy sang ISO; chấp nhận chữ số ngày/tháng không đệm như ví dụ `1/10/2026` của nguồn rồi chuẩn hóa.
3. `ReportPeriodForm`: bốn lựa chọn theo thiết kế, trường tương ứng và thông báo “Khoảng thời gian không hợp lệ. Vui lòng kiểm tra lại”; sửa được lỗi và không tái dùng input cũ khi đổi loại. Callback nhận kỳ đã xác thực, không tạo báo cáo giả.
4. `ReportPicker` + catalog chung cho 5 loại báo cáo UI22, tái sử dụng icon Lucide hiện có. Component chưa gắn menu/route; không đưa các liên kết báo cáo chưa có truy vấn vào sidebar.
5. CSS chỉ nằm dưới `.report-*`, không thay màu/logo/sidebar hoặc bố cục bảng đã tinh chỉnh của G8.

## File mới/sửa trong lượt T01

- Mới: `src/lib/vietnam-time.ts`, `src/features/reports/ReportPeriodForm.tsx`, `ReportPicker.tsx`, `report-catalog.ts`.
- Sửa: `src/index.css` (chỉ thêm CSS scoped cho component báo cáo).
- Mới: `tests/unit/report-period.test.ts`, `tests/unit/report-components.test.tsx`.
- Tài liệu: `DATA_REVIEW.md`, execution này, `REPORT_PHASE_9.md`, ghi chú entry trong plan/master.

## Kiểm thử

- Focused ban đầu: **34/34 PASS**, gồm 30 ca kỳ thời gian và 4 ca React DOM cho chọn loại, xác nhận, lỗi/sửa lỗi, đổi ngày/tháng/năm. Không dùng kết quả component để tuyên bố E2E báo cáo PASS.
- Lượt typecheck đầu phát hiện dùng option `exact` của Playwright trong Testing Library. Đã sửa đúng API matcher; tách catalog khỏi file component để xử lý cảnh báo Fast Refresh. Không nới validation hoặc bỏ test.
- Kiểm chứng cuối: **lint PASS (0 warnings), typecheck PASS, full unit/integration 379/379 PASS (18 file, 0 FAIL/SKIP, 183,60 giây), production build PASS (9,38 giây)**. Logs `lint.log`, `typecheck.log`, `unit-full.log`, `build.log` tại `evidence/t01/`. Build còn cảnh báo bundle >500 kB đã có từ trước; không thay dependencies hoặc nới giới hạn để giấu cảnh báo.
- Chromium hồi quy có chọn lọc trên build mới: **5/5 PASS**, exit 0, 18,4 giây (`shell.spec.ts` và `sales-t05-errors.spec.ts`); log `chromium-regression.log`. Kiểm bootstrap/persistence/migration/error và lịch sử Owner/Staff sau khi thêm CSS scoped. Đây là hồi quy app hiện hữu, không phải E2E báo cáo G9.
- Chromium, screenshot/so sánh pixel của component mới: **NOT RUN**, vì chưa nối vào ứng dụng. In báo cáo/export hoặc số liệu năm báo cáo: **NOT IMPLEMENTED**, không tạo mock tổng tiền.

## Chưa hoàn tất và dependency

[G9-R01/G9-R02](DATA_REVIEW.md) đang chờ câu trả lời đã gửi. Không tự quyết định cách xử lý dữ liệu thanh toán legacy hoặc ngày tạo khách; chưa mở T02–T05 trên runtime. Sau khi chốt: nối T01 vào route báo cáo thật, thực hiện T02 doanh thu rồi T03/T04/T05 theo đúng dependency, sau cùng T06 đối soát và regression. Dashboard hiện tại được giữ nguyên.
