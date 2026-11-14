# G9 — Quyết định dữ liệu và cổng triển khai

Ngày 13/11/2026. Người dùng cho phép bắt đầu G9 qua chỉ đạo “tiếp tục giai đoạn tiếp”. Không diễn giải thành nghiệm thu G8 hoặc miễn trừ ngoại lệ đã ghi.

## Trạng thái hiện hành sau quyết định mới của người dùng

**G9-D05 đã được người dùng phê duyệt 14/11:** phương án A trong [review tồn kho](HISTORICAL_STOCK_REVIEW.md), mốc cuối tháng trước VN và cùng phạm vi nhập/bán đã xác minh. Đã triển khai kernel/reader readonly và nối slot phần trăm hiện có; baseline 0/thiếu căn cứ giữ placeholder, không backfill. Full unit mới 491/491 PASS, Chromium full đang chạy; [execution](STOCK_COMPARISON_EXECUTION.md). Gate quyết định lịch sử đã mở; không còn chờ phê duyệt M01/U01/phạm vi staff/nguồn so sánh tồn kho. Các trạng thái BLOCKED trong mốc cũ dưới đây là lịch sử, không tự DONE G9.

**14/11/2026, sau phản hồi gói T05:** G9-D04 đã duyệt KPI staff toàn cửa hàng/ngày VN, M01-B và wording. Nguồn `customer-creation-v1` đã được triển khai cho hồ sơ mới, transaction chung và xóa marker cùng hồ sơ hợp lệ; U01 đã nối vào thẻ hiện có, không thêm card. Không backfill hồ sơ cũ. So sánh tồn kho tháng trước vẫn **BLOCKED_HISTORICAL_STOCK_BASELINE**. [Execution cập nhật](T05_EXECUTION.md). Những mô tả gate chưa duyệt ở mốc trước bên dưới là lịch sử.

T05 ngày 14/11: [gói cần chốt](T05_REVIEW_GATE.md) đã có ảnh/HTML cụ thể. Chưa nhận quyết định về M01-A/B, U01, phạm vi staff và cách hiển thị thiếu baseline. Service KPI Chủ đã kiểm chứng độc lập, quick actions được phép đã nối runtime; không ghi customer-creation hay bật dashboard bốn thẻ trước quyết định tương ứng.

Cập nhật 14/11/2026: T02 doanh thu đã nối runtime theo chính sách đủ điều kiện đã duyệt; [T02 UI execution](T02_UI_EXECUTION.md) ghi kiểm thử và ảnh. Nội dung candidate/chưa nối UI ở phần lịch sử bên dưới thuộc mốc trước quyết định, không mô tả bản hiện tại. G9-M01/U01 vẫn giữ nguyên, không tự ghi nguồn ngày tạo khách.

[Decision Log](DECISION_LOG.md) ghi G9-D01/D02 **APPROVED_USER**: chỉ tính giao dịch có bằng chứng hoàn tất và thời gian đáng tin cậy; legacy thiếu căn cứ là UNVERIFIED, không lấy NgayBan/import/migration thay paidAt. Khách thiếu nguồn ngày tạo không vào KPI; không dùng giao dịch đầu tiên hoặc membership để thay thế.

| Mục | Trạng thái hiện hành |
|---|---|
| G9-R01 — quy tắc legacy | APPROVED_USER; tầng doanh thu trả scope VERIFIED_ONLY, chỉ tổng hợp bản ghi đủ điều kiện; có phân loại/coverage, không tự sửa dữ liệu |
| G9-R02 — quy tắc khách mới | APPROVED_USER; kernel kiểm ngày tạo đáng tin cậy và loại dữ liệu thiếu căn cứ |
| G9-M01 — nguồn ngày tạo cần ghi bổ sung | APPROVED_USER M01-B / IMPLEMENTED: namespace appMetadata versioned, transaction chung; xóa cùng hồ sơ hợp lệ; không migration/backfill |
| G9-U01 — KPI Khách hàng mới phân biệt phần đủ điều kiện/chưa xác minh | APPROVED_USER / IMPLEMENTED theo wording trong ô hiện có; số chưa xác minh của toàn tập nguồn, không gán vào ngày báo cáo |

Hai cổng triển khai có phương án review riêng tại [IMPLEMENTATION_REVIEW.md](IMPLEMENTATION_REVIEW.md). Không hỏi lại quyết định nghiệp vụ đã chốt. T03 đã triển khai cùng chính sách đủ điều kiện ([execution](T03_EXECUTION.md)); T04 đã nối ba báo cáo ([execution](T04_EXECUTION.md)). Chi phí/lợi nhuận/dòng tiền không tự đổi nghĩa status legacy. Giá vốn thiếu căn cứ trên hóa đơn bán đã xác minh làm báo cáo lỗi dữ liệu, không tự gán giá vốn 0; không backfill.

## Lịch sử phương án trước — đã được chỉ đạo mới thay thế

> Cập nhật chỉ đạo: người dùng đã trả lời **“Muốn chọn phương án khác”** cho đề xuất ghép “legacy thiếu căn cứ thì báo lỗi; Khách hàng mới hiển thị Chưa xác định, chưa thêm metadata”. Vì vậy đề xuất đó **KHÔNG ĐƯỢC PHÊ CHUẨN**. Đã hỏi quy tắc thay thế cho từng mục, chưa nhận nội dung cụ thể. Hai mục dưới tiếp tục OPEN; không tự áp dụng báo lỗi runtime, loại trừ legacy, placeholder KPI hoặc ghi metadata.

| ID | Căn cứ thực tế | Lựa chọn đang chờ người dùng | Trạng thái |
|---|---|---|---|
| G9-R01 | `purchaseHeader/readCandidatePurchase`: dữ liệu legacy có `finalizedAt: undefined`, trạng thái chỉ là số chưa đối chiếu. `readSaleInvoice`: chỉ snapshot P05 có bằng chứng thanh toán/mapping; legacy không được tự gán ý nghĩa mới. BR-UC7-01/03/05/07/08/12/18/19 yêu cầu chỉ tính giao dịch đã hoàn tất và đúng thời điểm ghi nhận. | Đã hỏi: báo lỗi khi thiếu căn cứ, hoặc chỉ tính phần đã xác minh với thông báo loại trừ cần duyệt. Không tự lấy NgayBan/NgayThuMua làm paidAt, không tự coi mã 1 của legacy là hoàn tất, không âm thầm bỏ qua rồi hiển thị tổng tiền như đầy đủ. | **OPEN — chưa nối T02–T04 vào runtime** |
| G9-R02 | SC198 có “Khách hàng mới”. Schema `khachHang` chỉ có mã, tên, điện thoại, điểm, không ngày tạo. Audit generic không phải bằng chứng ngày tạo đầy đủ cho dữ liệu cũ. | Đã hỏi: giữ KPI BLOCKED, hiển thị “Chưa xác định” trong ô hiện có; hoặc lập phương án metadata ngày tạo để duyệt trước. Không lấy ngày hóa đơn đầu tiên làm ngày tạo khách, không tạo số giả từ Figma. | **OPEN — phần KPI này của T05 chưa triển khai** |

Các phép so sánh lịch sử trên dashboard cũng phải có nguồn đủ tin cậy, đặc biệt khi G9-R01 còn mở. Không thêm bảng, backfill, ghi metadata hoặc đổi ý nghĩa mã legacy trong lượt T01.

## Công việc độc lập đã tiếp tục

T01: bộ tính kỳ UTC+7, cận trên loại trừ ngày kế tiếp, validation, component bộ lọc và chọn loại báo cáo. Component đã được kiểm tra bằng React DOM; chưa nối route/sidebar hay truy vấn số tiền để tránh phát hành màn hình báo cáo có kết quả không đầy đủ. Chưa chụp ảnh Chromium hoặc coi đó là chức năng báo cáo hoàn chỉnh.

Tiếp tục theo lệnh mới: T02 có kernel doanh thu và adapter **candidate, chưa kích hoạt**. Adapter chỉ kiểm chứng snapshot/graph/receipt đã có; nếu còn hóa đơn chưa rõ, trả `requires-decision` cùng ID cần đối chiếu, không công bố tổng tiền, không tự chọn chính sách error/exclusion cho giao diện. Các test tích hợp dùng finalizer thật trong IndexedDB kiểm thử, không thay dữ liệu người dùng. Xem [T02 candidate](T02_CANDIDATE_EXECUTION.md).

Ngoại lệ G6/G8 về trường UI, các kiểm tra ngân hàng/scanner/máy in và audit dependency vẫn theo hồ sơ cũ; không được đóng bằng việc bắt đầu G9.
