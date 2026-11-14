# G10-T02/T05 — Đối chiếu 7 NFR

Ngày 14/11/2026. Nguồn nội dung: REQUIREMENT_TRACEABILITY.md, SRS locators P1682–P1708. Quyết định đo/ngưỡng theo G10-D02/D03; bảng này không miễn trừ NFR và không sửa UI.

| NFR | Bằng chứng đã thực thi trước nâng | Trạng thái/đầu vào còn thiếu |
|---|---|---|
| USABILITY-01: bố cục/đầy đủ thông tin | Geometry SC105 đạt ≤2px, pixel component đã PASS focused sau sửa; danh sách/popup/viewport trong Chromium hồi quy | **PARTIAL**: 297 trạng thái chưa đủ; hai trường SRS/Figma G6/G8 còn BLOCKED |
| USABILITY-02: nút rõ/dễ thao tác tại quầy | Hành trình hai vai trò dùng control thật; test bàn phím focus và tạo/tìm/xóa bằng touch | **PARTIAL**: mới chứng minh các luồng đã chạy, chưa nghiệm thu toàn bộ control |
| USABILITY-03: thao tác cảm ứng | `phase10-usability-benchmark.spec.ts`: Chủ/Nhân viên 2/2 PASS, Chromium hasTouch, viewport 1440×900 | **PARTIAL**: mô phỏng browser, chưa kiểm thiết bị cảm ứng vật lý; không thêm thiết kế mobile |
| PERFORMANCE-01: phím tắt/chọn giá nhanh | Không tự thêm tính năng khi thiếu bộ phím/mức giá được duyệt | **OPEN**, chủ dự án cần chốt Q21/P11 theo G10-D03 |
| PERFORMANCE-02: tra cứu/nhập/giao dịch nhanh | Đã đo tra cứu với 25/1.000 khách; thêm 4 ca Chủ/Nhân viên hoàn tất thu mua và bán tiền mặt với 25/1.000 sản phẩm ban đầu, 1 warmup +5 mẫu, cùng máy/browser và số record thực từng mẫu | **MEASURED PARTIAL**, chưa có SLA; không suy rộng số đo hoặc tuyên bố NFR đạt |
| SECURITY-01: quyền theo vai trò | Regression auth/service denial, revoked/forged session; hành trình session độc lập; 3 ca HTML tên/lý do không thực thi mã; rollback/retry native trên graph 1.000 món; static audit 5/5; audit production 0 cảnh báo | **PARTIAL**: 7 moderate lint còn OPEN trong audit toàn bộ; không chứng nhận bảo mật tương đương backend hoặc đủ mọi ca T04 từ một nhóm test |
| TRACEABILITY-01: lưu/truy vết hoạt động | Native transaction/audit/receipt/snapshot, reload, lịch sử và test rollback/replay trong suite | **PARTIAL**: chưa đối chiếu đủ mọi control/branch; tồn tại ngoại lệ chi tiết UI đã được giữ BLOCKED |

Người dùng đã duyệt đo trước, giữ shortcut/quick-price/SLA chờ chốt; không hỏi lại ngưỡng visual hoặc tự áp đặt SLA. Kiểm định chất lượng hàng không phải checklist QA phần mềm.

Tất cả 98 BR đã được kiểm kê ID/UC trong [source-inventory.json](evidence/audit/source-inventory.json). [TRACE_AUDIT.md](TRACE_AUDIT.md) nêu file unit/Chromium và ID ca thực thi từ JSON thật, chưa chứng nhận từng BR. Cần review assertion/nhánh đúng từng ID trước khi đổi thành PASS; không sao chép trạng thái lịch sử NOT IMPLEMENTED thành kết luận code hiện tại hoặc dùng tổng test để chứng nhận toàn bộ yêu cầu. [Execution bổ sung](T04_T05_EXECUTION.md), [cổng nghiệm thu còn mở](ACCEPTANCE_GAPS.md).
