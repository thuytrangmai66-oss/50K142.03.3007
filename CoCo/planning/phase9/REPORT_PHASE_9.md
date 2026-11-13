# Tiến độ G9 — Báo cáo và dashboard

Ngày 13/11/2026. **IN PROGRESS / PARTIAL**. Người dùng cho phép bắt đầu G9; G8 vẫn PENDING REVIEW cùng các ngoại lệ cũ. Không tự nghiệm thu G8/G9.

| Task | Trạng thái thực tế |
|---|---|
| T01 | PARTIAL / PENDING REVIEW — logic kỳ và component có code/test, chưa tích hợp route/sidebar/Chromium |
| T02 | DATA LAYER IMPLEMENTED / PENDING REVIEW — loại trừ không đủ điều kiện theo G9-D01, có scope/coverage; chưa nối UI |
| T03 | NOT STARTED; tiếp tục theo dependency T02, quy tắc legacy đã chốt |
| T04 | NOT STARTED; phụ thuộc T02/T03, cost/paidAt được xác minh |
| T05 | NOT INTEGRATED; kernel eligibility có test; nguồn ngày tạo và phân biệt hai nhóm trên KPI BLOCKED G9-M01/U01 |
| T06 | NOT STARTED; chỉ kiểm chứng sau các chức năng tương ứng |

[T01 execution, file và kết quả](T01_EXECUTION.md) · [Các câu hỏi dữ liệu đang chờ](DATA_REVIEW.md).

Kết quả mới nhất sau quyết định G9-D01/D02: **410/410 unit/integration (22 file), lint/typecheck/build PASS; 35/35 Chromium regression PASS**, 0 SKIP. Có test thiếu paidAt nhưng vẫn VERIFIED, UNVERIFIED dù có NgayBan, nguồn ngày tạo đáng tin cậy/không có nguồn, và legacy schema v2 qua migration/reopen không đổi dữ liệu. E2E UI báo cáo, screenshot/pixel của G9 và luồng ghi provenance mới **NOT RUN/BLOCKED theo phần tương ứng**. Không lấy số test hồi quy làm bằng chứng hoàn tất năm báo cáo/dashboard. [Execution eligibility](ELIGIBILITY_EXECUTION.md).

Quyết định mới đã **APPROVED_USER** tại [Decision Log](DECISION_LOG.md): không đoán lịch sử, chỉ dùng bản ghi đủ điều kiện và có thời gian tin cậy; không dùng giao dịch đầu tiên/membership/migration thay ngày tạo khách. Phương án cũ đã bị thay thế, không còn chờ hỏi lại R01/R02. Việc bổ sung nguồn ngày tạo và cách phân biệt dữ liệu trên KPI có [review riêng](IMPLEMENTATION_REVIEW.md), chưa kích hoạt. Các báo cáo tiền có thể tiếp tục tích hợp theo Figma; không dùng review KPI để tự chặn chúng.

Không đổi schema, không thêm metadata ngày tạo khách, không suy diễn trạng thái legacy hoặc ngày thanh toán, không Supabase/backend. Không mock số mẫu Figma thành báo cáo.

Bản local vẫn chạy ứng dụng hiện có tại http://127.0.0.1:5173/50K142.03.3007/; **chưa có menu Báo cáo của G9 được kích hoạt trong lượt này**. Các component mới hiện ở mức tái sử dụng và kiểm thử React DOM, không phải báo cáo hoàn chỉnh để demo. Không commit/push/deploy.
