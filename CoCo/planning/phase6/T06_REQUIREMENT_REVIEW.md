# G6–T06 — đối chiếu yêu cầu và thiết kế

Ngày 12/11/2026. Trạng thái **PENDING REVIEW**. T05 giữ **PENDING REVIEW**; G6 **IN PROGRESS**. Không thay mapping legacy hoặc phạm vi roadmap.

## Nguồn và quyết định

- SRS gốc đã trích tại `CODEX/.uc-ui-matrix-qa/srs-text.txt`: UC_1.2, UC_4.6, BR-UC1-12…17, BR-UC4-11/12; SDD/contract G2 và review T01 P03/P04 đã được nghiệm thu.
- Thiết kế local tại `CODEX/Figma.Chủ/` và `CODEX/Figma.Nhân viên/`: bộ Tìm kiếm giao dịch thu mua, Xem chi tiết giao dịch thu mua, Xem lịch sử bán và Xem chi tiết lịch sử bán. Đối chiếu ảnh trích `frame-10…17`, `frame-91…94`, bộ Nhân viên tương ứng trong `design-blocks.json`. Không truy cập link Figma.
- BR-UC1-16 yêu cầu **nhân viên thực hiện và trạng thái** trong chi tiết. Ảnh SC016/094 và bản Nhân viên tương ứng chỉ có thông tin hóa đơn, khách hàng, sản phẩm và tổng tiền.
- Người dùng đã chọn: **“Giữ ảnh Figma, ghi BLOCKED hai trường trên UI”**. Hai trường này có trong read model, được kiểm tra quan hệ và kiểm thử; **không hiển thị thêm vào chi tiết**. Không coi BR-UC1-16 đã đạt toàn bộ. Việc bổ sung thiết kế để hiển thị chúng tiếp tục OPEN, không tự thêm control.
- Cột Trạng thái ở **danh sách lịch sử bán** đã có trong Figma: hóa đơn mới có snapshot hoàn tất hiển thị “Hoàn tất”. Legacy giữ nguyên mã số và “Chưa xác định”; không suy diễn mã cũ `0/90` thành `1`.

## Quy tắc đọc dữ liệu

- Dùng chung query/adapter cho Thu mua và Lịch sử bán. Join khách/nhân viên bằng mã; giao dịch đã ghi nhận đọc từ `hoaDonThuMua`, không đưa draft vào danh sách.
- Hóa đơn mới đọc từng dòng canonical từ `purchaseFinalizations`, kiểm snapshot/provenance/cost và mapping đã lưu. Hai dòng cùng khung giá nhưng khác đơn giá được giữ độc lập; không lấy giá hiện tại tính lại giá lịch sử.
- Legacy đọc nguyên chi tiết `chiTietHoaDonTM`. Không sửa khóa, trạng thái, giá hoặc bổ sung snapshot để che thiếu dữ liệu. Header legacy còn truy xuất được ở danh sách/lịch sử; mở chi tiết thiếu dòng, thiếu quan hệ hoặc sai tổng sẽ báo lỗi, không dựng hóa đơn rỗng giả.
- Dấu vết hóa đơn mới còn tồn tại nhưng snapshot mất phải báo lỗi; không chuyển sang adapter legacy để che hỏng dữ liệu.
- Chỉ đọc trong transaction `r` có kiểm tra session/quyền. Lịch sử bán dùng `MaKH` và `hoaDonThuMua`; lịch sử mua dùng `hoaDonBanHang`, không nhập chung hai hướng giao dịch.
- Bộ lọc kết hợp AND: mã/tên không phân biệt hoa thường và bỏ khoảng trắng ngoài; điện thoại khớp chuỗi con; ngày giao dịch là ngày lịch Việt Nam. Dùng pagination/capacity hiện có, không thêm cuộn dọc nội bộ bảng.

## Kết luận review

| Hạng mục | Trạng thái |
|---|---|
| Quyết định giữ thiết kế chi tiết | Đã được người dùng xác nhận |
| UI Nhân viên thực hiện trong chi tiết | **BLOCKED** bởi thiết kế được giữ nguyên |
| UI Trạng thái trong chi tiết | **BLOCKED** bởi thiết kế được giữ nguyên |
| Các phần tra cứu, lịch sử và dữ liệu còn lại | Kết quả thực thi tại [T06_EXECUTION.md](T06_EXECUTION.md) |
| Đối chiếu trực quan/pixel cuối cùng, nghiệm thu task | PENDING REVIEW; screenshot và test không thay nghiệm thu người dùng |
| Chuyển G6 DONE / G7 | Chưa được phép; T07 và gate nghiệm thu G6 còn phía trước |
