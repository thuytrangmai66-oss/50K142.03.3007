# G7 — Decision Log

Ngày ghi nhận:12/11/2026 (giờ Việt Nam). Nguồn: trả lời trực tiếp của chủ dự án trong chat. Không thay quyết định local/no Supabase hoặc tự nghiệm thu G6/G7.

| ID | Quyết định / trạng thái | Phạm vi thực thi |
|---|---|---|
| G7-D01 / Q10 | **CONFIRMED_USER**. Người dùng trả lời “1. có”: Nhân viên sửa giá bán có reset chu kỳ như Chủ | Khi giá thực sự đổi: GiaGocChuKyGiam=giá mới, NgayBatDauChuKyGiam=ngày sửa theo giờ Việt Nam; giữ nguyên NgayNhapKho. Đổi thuộc tính nhưng giữ nguyên giá không tạo lần reset giá |
| G7-D02 / Q12 | **CONFIRMED_USER_AFTER_LOG**. Người dùng xác nhận công thức `GiaBanSauGiam = GiaGocChuKyGiam × 0,70`, đề xuất chấp thuận nearest/half-up và yêu cầu ghi Decision Log trước khi coi đã duyệt. Điều kiện ghi log được thực hiện tại tài liệu này trước coding | Giá sau giảm là số nguyên đồng gần nhất, phần lẻ≥0,5 lên; dùng số nguyên chính xác. Không lấy giá đã giảm làm cơ sở, không áp lặp cùng mốc. Đây là quy tắc triển khai bổ sung được ghi nhận, không giả là câu chữ nguyên bản SRS |
| G7-D03 / P10 | **CONFIRMED_USER** qua câu trả lời riêng: “Xác nhận, luôn đặt đúng 20.000đ” | Đủ45 ngày đặt giá chính xác20.000đ, kể cả giá trước thấp hơn; không dùng min(). Giữ lại lịch sử trước xác nhận trong chat, không coi cách hiểu trước đó là đã đủ phê duyệt |
| G7-D04 / bảng Hàng hóa | **CONFIRMED_USER13/11/2026**: chủ dự án xác nhận bảng5 cột là thay đổi đã chủ động thực hiện, “không cần check lại” | Giữ5 cột hiện tại, không khôi phục cột Số ngày tồn ở danh sách theo ảnh Figma cũ. Chi tiết vẫn hiển thị số ngày tồn; không bỏ logic tính ngày. Đây không còn là gap/blocker review; không cần kiểm thử lại chỉ để xác nhận số cột đã chốt |
| G7-D05 / nghiệm thu và giao tiếp | **ACCEPTED_USER13/11/2026**: “nghiệm thu công việc và giao công việc tiếp” | Nghiệm thu phần T01 đã triển khai và T02–T06; xem ACCEPTANCE_2026_11_13.md. Giao G8-T01 phần độc lập; giữ barcode, audit và hai trường UI G6 ở trạng thái còn mở, không tự miễn trừ |

Barcode payload còn chờ câu trả lời riêng ở lượt trước. Hai trường UI G6 và dependency audit vẫn OPEN/PENDING REVIEW; các xác nhận Q10/Q12 không đóng các gate đó.

G7-T02/T03 dùng reset theo D01 và bộ tính thuần theo D02. Scheduler T04–T06 không được coi đã chạy hoặc hoàn tất chỉ vì có hàm tính giá và reset chu kỳ.
