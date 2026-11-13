# G7–T01 — đối chiếu trước triển khai

> Quyết định G7-D04 ngày13/11/2026: chủ dự án đã chốt danh sách Hàng hóa5 cột, bỏ cột Số ngày tồn ở danh sách; không cần kiểm lại hoặc khôi phục theo Figma cũ. Chi tiết và logic tính ngày tồn vẫn giữ nguyên. Mô tả cột ngày tồn trong danh sách bên dưới là nguồn lịch sử, đã được quyết định này thay thế.

> Cập nhật sau T01: đã triển khai T02–T06 theo Q10/Q12/P10 được ghi trong [DECISION_LOG.md](DECISION_LOG.md); các task chờ review và hồi quy cuối. Quy tắc G7 không còn chờ ở ba mục này. Barcode vẫn OPEN; không nghiệm thu G6/G7 tự động. Phần mô tả T01 chưa kích hoạt sửa/scheduler bên dưới là lịch sử tại lượt T01.

Ngày 12/11/2026. Chỉ đạo “tiếp tục giai đoạn tiếp theo” cho phép bắt đầu G7; **không phải nghiệm thu hoặc miễn trừ G6**. G6 tiếp tục PENDING REVIEW với audit FAIL và hai trường UI BR-UC1-16 BLOCKED. Không thay roadmap hoặc nhảy sang G8.

## Phạm vi đã rõ

UC_2.1 / BR-UC2-01…04; CODEX local SC060–067 và SC252–259: danh sách, bộ lọc mã/từ khóa–loại–brand–ngày nhập, pagination thật, chi tiết, giá hiện hành, trạng thái và số ngày tồn. Dùng lại layout/logo/sidebar, Pagination/ResultDialog/Button và nền dữ liệu G2/G6. Không dùng ảnh mẫu làm dữ liệu sản phẩm.

T01 chỉ đọc: không ghi sản phẩm/giá/trạng thái, không reset chu kỳ, không migration hoặc tự chạy scheduler. Giá hiện hành lấy `sanPham.GiaBanHienHanh`; không tự giảm theo tuổi tồn ngay khi mở trang. Số ngày tồn là chênh lệch hai **ngày lịch Việt Nam**, không chia thời gian thực qua timezone máy. Hàng đã bán hiển thị dấu “–” ở cột ngày tồn theo ảnh; reader vẫn giữ ngày nhập thật.

## Nguồn dữ liệu và legacy

- Mỗi món thực tế là một MaSP. Sản phẩm G6 đọc thuộc tính nhập hàng từ line snapshot được liên kết bởi provenance; sửa khung giá dùng chung không viết lại thuộc tính/hóa đơn lịch sử.
- Giá bán hiện hành và ngày nhập từ bản ghi sản phẩm. Mapping trạng thái lấy snapshot `purchase-status-mapping:<invoiceId>` đã được G6 duyệt; không tự gán ý nghĩa1/2 cho legacy không marker.
- Legacy đọc khung giá theo FK cũ; trạng thái/độ mới chưa có mapping được ghi “Chưa xác định”/“Chưa đối chiếu”, không sửa mã cũ. Missing FK/snapshot/provenance hoặc status mới ngoài mapping gây lỗi tải, không dựng dữ liệu thay thế.
- Chỉ hiển thị nhãn -30%/Đồng giá khi có `discountApplications` đúng sản phẩm, chu kỳ hiện hành và giá sau khớp giá đang lưu. Unit fixture đọc nhãn **không phải bằng chứng scheduler đã chạy**; việc tạo các bản ghi này thuộc T04–T06.
- Một read transaction có session/quyền bao quanh truy vấn; kiểm FK bằng validator hiện có. Cache adapter theo invoice trong **một query**, không giữ cache giá qua giao dịch. Hai vai trò đọc cùng CoCoDB, dùng cơ chế live subscription hiện có.

## Gate và quyết định còn thiếu

| ID/phạm vi | Cần xác nhận | Cách xử lý hiện tại |
|---|---|---|
| T01 mã vạch | Payload máy quét có phải nguyên MaSP hay có định dạng tem riêng? Không có field barcode/format trong schema hiện tại | Đã hỏi người dùng. Nút Quét mã vạch chưa kích hoạt; không tự bật camera/tạo barcode. Nhập/tìm mã thủ công vẫn hoạt động |
| Q10 / T03 | Nhân viên sửa giá có reset chu kỳ giống Chủ không? | ĐÃ XÁC NHẬN theo [Decision Log](DECISION_LOG.md): owner/staff đều reset khi giá đổi thật; giữ ngày nhập |
| Q12 / T03–T05 | Xác nhận làm tròn giá **sau giảm**: giá gốc chu kỳ×0,70 nearest/half-up, hay cách khác | ĐÃ XÁC NHẬN theo [Decision Log](DECISION_LOG.md): đồng nguyên nearest/half-up, không tính lặp trên giá đã giảm |
| P10 / T04 | Đến45 ngày, giá đang dưới20.000 có tăng lên đúng20.000 hay giữ giá thấp hơn? | ĐÃ XÁC NHẬN theo [Decision Log](DECISION_LOG.md): áp dụng đúng20.000đ kể cả khi giá trước đó thấp hơn |
| T02 dữ liệu thuộc tính | SRS cho sửa loại/brand/độ mới từng món, G2 chỉ lưu FK đến khung giá dùng chung | [Review T02](T02_DATA_REVIEW.md); không sửa khung giá/chứng từ/provenance cũ để giả sửa thuộc tính từng món |
| Review G6 | Hai trường UI và dependency audit, cùng nghiệm thu người dùng | Giữ PENDING REVIEW; không tự sửa SRS/Figma hoặc upgrade dependency ở G7 |

Quyết định chưa có trong Decision Log không được tự suy diễn. Hiện Q10/Q12/P10 đã xác nhận; T01 vẫn **PARTIAL/PENDING REVIEW** vì barcode BLOCKED. T02–T06 đã có runtime/test nhưng vẫn PENDING REVIEW; không dùng popup thành công giả hoặc automated PASS thay cho nghiệm thu.
