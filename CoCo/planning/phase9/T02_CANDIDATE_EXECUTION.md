# G9-T02 — Candidate tính doanh thu và kiểm chứng nguồn

> Lịch sử candidate trước quyết định mới. G9-D01/D02 đã được người dùng chốt; service hiện là `ReportQueriesService`, loại trừ bản ghi không đủ điều kiện và trả qualified summary/coverage thay vì dừng ở `requires-decision`. Kết quả hiện tại 410/410 unit/integration và 35/35 Chromium regression PASS, lint/typecheck/build PASS. Xem [execution hiện hành](ELIGIBILITY_EXECUTION.md) và [Decision Log](DECISION_LOG.md); các trạng thái chờ R01/R02 bên dưới không còn là cổng nghiệp vụ hiện tại.

Ngày 13/11/2026. **CANDIDATE / NOT ACTIVATED / PENDING REVIEW**. Không hoàn tất T02, không nghiệm thu G9.

## Phạm vi được tiếp tục

Người dùng yêu cầu tiếp tục, đồng thời chọn “Muốn chọn phương án khác” với đề xuất R01/R02 trước. Do chưa có quy tắc thay thế, chỉ triển khai công việc độc lập trên giao dịch đã xác minh; không nối route/sidebar/AuthContext và không áp dụng chính sách legacy hoặc KPI mới. Giữ nguyên branch `coco/phase-7`, HEAD nền `7338294`, working tree T01/G8 và mọi dữ liệu hiện có. Không staging/commit/push/deploy.

## Code mới

- `src/domain/revenue-report.ts`: BR-UC7-01..03, tổng thực thu của hóa đơn đã xác minh trong kỳ UTC+7, đếm header một lần, trung bình = tổng/số hóa đơn hoặc 0 nếu rỗng. Cộng BigInt, chặn overflow, từ chối đầu vào trùng ID; không tự đặt quy tắc làm tròn lưu trữ cho giá trị thống kê trung bình.
- `src/services/report-queries.ts`: `ReportQueriesCandidate.inspectRevenue`, guard `reports.read` trong transaction chỉ đọc; kiểm snapshot P05 với hóa đơn/chi tiết/sản phẩm/customer/mapping hiện có, draft finalized, receipt/audit/thời gian/actor. Metadata mồ côi hoặc snapshot hỏng bị từ chối, không fallback legacy, không sửa dữ liệu.
- Kết quả candidate: `verified` có summary chỉ khi toàn bộ đầu vào hóa đơn được xác minh; nếu còn thiếu căn cứ, `requires-decision` có ID unresolved và số đầu vào xác minh được, **không có summary tiền**. Đây là diagnostic nội bộ chưa tích hợp, không phải hành vi error/exclusion trên UI đã được duyệt. Không coi mã trạng thái số 1 của legacy là completed mới.
- Test mới: `tests/unit/revenue-report.test.ts` và `tests/unit/report-queries.test.ts`.

Không sửa schema, receipt/finalizer, validation nghiệp vụ cũ, dependency hoặc các màn hình đã có. Không thêm metadata ngày tạo khách hay hiển thị KPI Chưa xác định.

## Mapping kiểm chứng

| Yêu cầu | Bằng chứng |
|---|---|
| BR-UC7-01: thực thu sau ưu đãi | Finalize thật hai món, cùng khung giá, subtotal 208.002, giảm 41.600, thực thu 166.402; candidate lấy đúng thực thu, không cộng subtotal hoặc tính lại giá hiện tại |
| BR-UC7-02: số hóa đơn/trung bình, rỗng | Hai dòng chỉ một hóa đơn; empty/cancelled draft/purchase không thành doanh thu; trường hợp trung bình lẻ không bị tự làm tròn trong kernel |
| BR-UC7-03 và chống replay | Snapshot/receipt/draft finalized thống nhất; replay finalizer không tăng số hóa đơn; thiếu receipt, số tiền lệch, metadata mồ côi hoặc snapshot hỏng đều không thành dữ liệu verified |
| Kỳ Việt Nam | Hai thanh toán thật ngay trước/sau 17:00 UTC, ngày Việt Nam tương ứng chỉ đếm đúng hóa đơn; dùng paidAt đã xác minh, không lấy ngày nhập hàng |
| Lịch sử | Sửa hồ sơ khách và khung giá qua service thật không thay thực thu lịch sử |
| Legacy | Thêm fixture raw có cùng mã số trạng thái với hóa đơn mới: vẫn unresolved, không thay mã, không có tổng tiền phần thiếu và không ghi DB |
| Phân quyền/chỉ đọc | Staff gọi trực tiếp FORBIDDEN; session revoke AUTH_REQUIRED; so sánh mọi store trước/sau mỗi truy vấn |

## Kết quả thực thi

- Focused cuối: **21/21 unit/integration PASS** (`unit-focused-final.log`). Lượt đầu có 19 PASS/1 FAIL do fixture gọi sai tên `cancel` thay vì API thật `cancelDraft`; đã sửa lời gọi đúng, không bỏ assertion hoặc sửa service để có PASS. Sau đó thêm test đối chiếu số tiền header với snapshot.
- Kiểm chứng cuối: **lint PASS, typecheck PASS, full unit/integration 400/400 PASS (20 file, 0 FAIL/SKIP, 180,36 giây), production build PASS (8,56 giây)**. Logs tại `evidence/t02-candidate/`: `lint.log`, `typecheck.log`, `unit-full.log`, `build.log`. Integration dùng `fake-indexeddb` trong Vitest và services thật, không nhận là native Chromium.
- Candidate không được import từ app/router/AuthContext. Bundle JS/CSS build cuối vẫn là `index-CWJtwgs4.js` / `index-dHThpOWZ.css`, trùng build T01; không phát hành hành vi xử lý legacy/KPI mới. Chromium 5/5 của T01 là baseline trước đó, **không chạy lại trong lượt candidate** và không được tính là E2E báo cáo G9.
- React/UI report, Chromium candidate, screenshot G9 và số liệu dashboard: **NOT RUN / NOT INTEGRATED**. Các kết quả Chromium G8/T01 trước đây không được tính là E2E doanh thu G9.

## Cổng tiếp theo

G9-R01/R02 vẫn OPEN sau khi người dùng từ chối đề xuất trước. Cần quy tắc thay thế trước khi nối candidate vào giao diện, hoàn tất T01/T02 và chuyển T03 theo dependency. Không tự lấy ngày hóa đơn đầu tiên làm ngày tạo khách hoặc biến trạng thái legacy chưa rõ thành giao dịch hoàn tất.
