# G9 — Review nguồn so sánh tồn kho tháng trước

> **14/11/2026 — APPROVED_USER, G9-D05:** người dùng duyệt phương án A: mốc cuối tháng trước và phạm vi dữ liệu đã xác minh. Được triển khai reader/thuật toán và kiểm thử; không thêm schema/backfill/UI. Các chữ PROPOSED/OPEN bên dưới giữ lịch sử gói đã trình; phương án B không được chọn. Nghiệm thu triển khai vẫn cần bằng chứng, không tự DONE phase.

Ngày 14/11/2026. **PROPOSED / OPEN**, chưa kích hoạt. G9-D04 chỉ duyệt placeholder, không duyệt nguồn lịch sử hay miễn trừ chỉ tiêu. Đây là review cho task T05/T06 hiện có, không thêm phase/task nghiệp vụ.

## Điểm thiếu thực tế

SC007 có phần trăm so với tháng trước nhưng chưa xác định thời điểm đối chiếu. DB v4 không có snapshot lượng tồn cuối tháng. Trạng thái hiện tại và ngày nhập riêng lẻ không chứng minh món đã bán lúc nào; mã legacy không có mapping/bằng chứng vẫn chưa xác minh. Không thể tạo lịch sử đầy đủ bằng cách lấy số hàng nhập tháng trước hoặc dùng ngày mở app/migration.

## Phương án A — đề nghị chốt để tiếp tục T05

- Mốc đối chiếu: **cuối tháng dương lịch liền trước theo giờ Việt Nam**, biểu diễn bằng cận loại trừ 00:00 ngày đầu tháng hiện tại.
- Phạm vi: **chỉ sản phẩm có chuỗi bằng chứng nhập/bán đã xác minh**, không khẳng định là toàn bộ lịch sử cửa hàng khi có dữ liệu thiếu căn cứ. Không backfill hoặc sửa legacy.
- Nguồn nhập: purchaseFinalizations, provenance/productCosts và receipt/audit khớp theo hợp đồng P03/P04. Thời điểm nhập phải được chứng minh từ giao dịch hoàn tất, không chỉ từ trường ngày nhìn giống hợp lệ.
- Nguồn bán: snapshot P05, đúng món/chi tiết hóa đơn, receipt/audit và paidAt tin cậy. Không dùng NgayBan hoặc mã sold hiện tại thay thời điểm bán.
- Tồn ở mốc trước: món đã nhập trước cận và chưa có bằng chứng bán trước cận. **Thiếu bằng chứng xác định trạng thái tại mốc không có nghĩa là chưa bán**: trường hợp đó chưa đủ điều kiện tính.
- Số hiện tại và số trước phải dùng cùng phạm vi xác minh, không so hai tập dữ liệu có chính sách loại trừ khác nhau. Không suy rằng lịch sử toàn cửa hàng đầy đủ chỉ vì các bản ghi hiện có đều parse được.
- Phần trăm có cơ sở: `(tồn hiện tại − tồn cuối tháng trước) / tồn cuối tháng trước × 100`, hiển thị tối đa một chữ số thập phân, không lưu chỉ tiêu mới. Baseline 0 hoặc bằng chứng không đủ: giữ wording “Chưa đủ cơ sở so với tháng trước”, không +100%/NaN/Infinity.
- Chỉ dùng reader/transaction readonly; không thêm bảng/cột/version DB, không ghi snapshot mới hoặc thay UI ngoài ô đã có. Nếu cần nhãn phạm vi ngoài wording đã duyệt, phải trình review trước.

Phương án A cần chủ dự án xác nhận **định nghĩa mốc và phạm vi nguồn** trước khi triển khai thuật toán. Chưa có test thực thi thuật toán này; các test hiện hành chỉ xác minh nó còn BLOCKED/placeholder, không phải PASS cho so sánh lịch sử.

## Phương án B — chưa chốt nguồn

Giữ chỉ tiêu BLOCKED/placeholder và G9 PENDING REVIEW. Tiếp tục kiểm chứng độc lập trong T06; không tự nghiệm thu G9, miễn trừ tiêu chí hoặc chuyển G10 chỉ vì suite xanh.

## Tiêu chí nếu chọn A

Unit boundary VN cuối tháng/năm, baseline 0, món nhập/bán trước/đúng/sau cận; integration provenance/paidAt thiếu hoặc mâu thuẫn, legacy bảo toàn, toàn DB readonly; Chromium ô dashboard từ dữ liệu giao dịch thật và reload. Không dùng số mẫu Figma làm kết quả.
