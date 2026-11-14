# Tiến độ G9 — Báo cáo và dashboard

> **Hiện hành G9-D05, 14/11:** người dùng duyệt phương án A; so sánh tồn kho cuối tháng trước theo VN đã có kernel/reader readonly và phần trăm trong slot hiện hữu. Không backfill, không schema/snapshot mới. **491/491 unit/integration PASS**, focused **9/9 Chromium PASS**, full Chromium **151/151 PASS**, 0 FAIL/0 SKIP (8,2 phút); lint/typecheck/build/static audit PASS. [Execution](STOCK_COMPARISON_EXECUTION.md). Không còn gate quyết định nguồn lịch sử; các mốc BLOCKED/chưa chốt phía dưới là lịch sử. G9 PENDING REVIEW, không tự DONE.

> **Bổ sung T06 ngày 14/11:** hành trình giá vượt khung → Chủ duyệt → nhập 2 món khác giá cùng khung → bán → báo cáo/dashboard đã được kiểm qua UI thật, focused toàn file **2/2 Chromium PASS**, typecheck/lint PASS. Không đổi source sản phẩm; baseline full 464 unit/148 Chromium và build PASS được tái sử dụng. Có thêm 1 case, chưa chạy full 149 trong một lượt. [Execution](T06_EXECUTION.md), [review tồn kho đang chờ chốt](HISTORICAL_STOCK_REVIEW.md). Không tự sang G10 hoặc DONE.

> **Hiện hành 14/11/2026 sau G9-D04:** đã duyệt và triển khai dashboard bốn thẻ hai vai trò, KPI staff toàn cửa hàng/ngày VN, marker khách mới M01-B cùng transaction và xóa cùng hồ sơ hợp lệ; không backfill. T06 đối soát mua/bán/báo cáo/dashboard, live hai tab và read-only. Full unit **464/464 PASS**, Chromium full 148/148 PASS (0 FAIL/0 SKIP, 6,7 phút); focused **60/60 unit, 6/6 Chromium PASS** (1 proposal riêng); lint/typecheck/build PASS. [T05](T05_EXECUTION.md), [T06](T06_EXECUTION.md). G9 **PENDING REVIEW**, so sánh tồn kho tháng trước **BLOCKED**, không tự DONE/chuyển G10/commit/push. Những mốc chưa bật dashboard bên dưới giữ làm lịch sử trước xác nhận này.

G9 hiện **IMPLEMENTED / PENDING REVIEW**; [phương án tồn kho A](HISTORICAL_STOCK_REVIEW.md) đã được G9-D05 duyệt/triển khai. Các gate M01/U01/phạm vi staff/nguồn lịch sử đã được xử lý; số liệu legacy thiếu căn cứ vẫn không được suy đoán. Không tự nghiệm thu G8/G9 hoặc coi push là DONE.

| Task | Trạng thái thực tế |
|---|---|
| T01 | INTEGRATED FOR T02–T04 / PENDING REVIEW — route/sidebar owner-only, picker đủ năm báo cáo và bốn loại kỳ đã nối; không còn lựa chọn báo cáo chưa triển khai bị khóa |
| T02 | IMPLEMENTED / VERIFIED / PENDING REVIEW — service + UI doanh thu, nhóm ngày VN, tổng/average, rỗng/error theo SC114–116, phân trang thích ứng; full Chromium cuối 135/135 PASS |
| T03 | IMPLEMENTED / VERIFIED / PENDING REVIEW — báo cáo chi phí thu mua đã nối UI/service; full 421/421 unit/integration, 138/138 Chromium PASS, 0 FAIL/SKIP; lint/typecheck/build PASS. Đã tối ưu đọc FK để sửa timeout khi tạo nhiều giao dịch, giữ nguyên validation. [Execution](T03_EXECUTION.md) |
| T04 | IMPLEMENTED / VERIFIED / PENDING REVIEW — lợi nhuận, dòng tiền, tồn lâu đã nối UI/service. Full unit 435/435, full Chromium 142/142 PASS, 0 FAIL/SKIP; lint/typecheck/build PASS. [Execution](T04_EXECUTION.md) |
| T05 | IMPLEMENTED / PENDING REVIEW — dashboard hai vai trò, M01-B/U01 theo G9-D04, so sánh tồn theo G9-D05. [Dashboard](T05_EXECUTION.md), [tồn kho lịch sử](STOCK_COMPARISON_EXECUTION.md) |
| T06 | VERIFICATION EXECUTED / PENDING REVIEW — đối soát native/live hai tab/dashboard, gồm nguồn tồn G9-D05; full 491 unit/integration và 151 Chromium PASS, 0 FAIL/SKIP. [Execution](T06_EXECUTION.md), [gói review cuối](G9_REVIEW_GATE.md) |

[T01 execution, file và kết quả](T01_EXECUTION.md) · [Các câu hỏi dữ liệu đang chờ](DATA_REVIEW.md).

Mốc lịch sử data layer trước khi nối UI: 410/410 unit/integration và 35/35 Chromium, ghi tại [eligibility execution](ELIGIBILITY_EXECUTION.md). Không dùng các dòng NOT RUN/BLOCKED của mốc cũ để mô tả dashboard/báo cáo hiện đã triển khai, cũng không coi capture ảnh là pixel-diff PASS.

G9-D01/D02/D04 **APPROVED_USER** tại [Decision Log](DECISION_LOG.md): không đoán lịch sử; nguồn ngày tạo M01-B và wording KPI đã được duyệt, kích hoạt cùng transaction cho hồ sơ mới. Không còn gate chờ duyệt M01/U01 hoặc phạm vi staff. Chỉ tiêu lịch sử tồn kho có review riêng bên trên, không đồng nghĩa thiếu phê duyệt chính sách loại trừ legacy.

Không đổi schema/version DB; có metadata ngày tạo mới đã duyệt, không backfill hồ sơ cũ, không suy diễn trạng thái/ngày thanh toán legacy, không Supabase/backend hoặc số KPI mock.

Bản local http://127.0.0.1:5173/50K142.03.3007/: Trang chủ có dashboard đúng vai trò, Chủ có đủ năm báo cáo tại `#/reports`. Dùng tài khoản hiện có, cùng origin để thấy dữ liệu đã lưu. Git làm trên `main` theo AGENTS.md; các gate code/local của gói G9 đã đạt, commit/push theo phase và xác minh SHA/Actions sau push, báo trong bàn giao chat. Không dispatch deploy thủ công; push không là nghiệm thu.

Đoạn kết quả 410/410 và 35/35 ở trên là mốc data layer ngày 13/11 trước tích hợp UI. Mốc T02 trước T03: **413/413 unit/integration PASS** (94,65 giây), **135/135 Chromium PASS** (6,7 phút), lint/typecheck/build PASS. Có lượt Chromium bị hủy để sửa SC115 và một lượt 132 PASS/3 FAIL; đã sửa đúng nguyên nhân, targeted 4/4 PASS rồi chạy lại full, không bỏ test. Xem execution T02 cho lỗi, bằng chứng và giới hạn. Đã sửa thêm lỗi cuộn toàn trang làm khuất header khi mở chi tiết ở 1366×650, không đổi thiết kế/nghiệp vụ.
