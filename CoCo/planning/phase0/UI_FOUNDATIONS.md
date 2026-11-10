# Ghi nhận nền giao diện từ nguồn

Ngày đối chiếu 10/11/2026. Các thông số dưới đây chỉ áp dụng cho node đã đọc, không suy rộng thành mọi màn hình đều cùng kích thước/bố cục. Chi tiết context nằm tại evidence/context-*.txt; URL asset trong đó là URL tạm, không được dùng trực tiếp trong code sản phẩm.

| Node | Nguồn và chi tiết đã ghi |
|---|---|
| 1:2 Đăng nhập chủ | Frame 1440×900; nền #f5f0e8; font Be Vietnam Pro; khung trắng x=673,y=55,w=720,h=790,radius=30; input cao 70,radius=10; chữ input 25px; placeholder #aeaeb2. Logo đen và logo nhỏ ở form; nút đen. Design image5 có chú thích đánh số, không mang chú thích vào UI |
| 865:6434 Trang chủ nhân viên | 1440×900; sidebar chỉ Trang chủ/Thu mua/Bán hàng/Hàng hóa/Khách hàng/Đăng xuất; KPI đơn thu mua/đơn hàng/sản phẩm mới/khách mới. Số liệu và tên người dùng là dữ liệu động |
| 284:3619 QR chủ | 1440×900; modal Thanh toán chuyển khoản có mã hóa đơn/tên khách/số tiền, QR, Đã nhận và Quay lại. Nút xác nhận đã có sẵn, không cần thêm bước xác nhận ngân hàng tự động |
| 1027:4283 QR nhân viên | 1440×900; modal khớp Design image234. Sidebar nền phía sau chứa menu quản trị trong khi staff home không có: Q11. QR Figma là mẫu hình ảnh, phải thay bằng QR động cục bộ trong đúng slot |
| 170:4139 Xử lý tồn lâu | 1440×900; cụm body x=485,y=171,w=892,h=699, gap 13; cụm KPI gap 16; thẻ trắng border #ece6d8,radius 12,padding 20/18; khối chính sách/lịch gap 20; có lịch 00:00, bảng lịch sử lượt chạy và nhật ký thay đổi |
| 392:628 Khung giá | 1440×900; bảng có Mã khung giá/Loại hàng/Thương hiệu/Độ mới, nút Tạo khung giá và phân trang. Header đen, vùng trắng/be, sidebar theo chủ |

Đã ghép thêm bốn alias bằng ảnh:
- DS-151, Design image155 (Xóa tài khoản nhân viên 3) ↔ 404:465 (Figma tên số 4), cùng popup thất bại.
- DS-229, image227 ↔ 1027:1287, cùng màn hình tìm kiếm nhưng khác số dòng kết quả mẫu; Q18.
- DS-230, image228 ↔ 1027:4419, cùng chi tiết hóa đơn, Figma tên có thêm số 1.
- DS-284, image282 ↔ 1041:3156, cùng popup lỗi truy xuất lịch sử bán, tên Design thiếu chữ Xem.

SCREEN_MAP.csv có 295 dòng với locator ảnh Word và node ứng viên. Trường approved_node_id ở 10 dòng đã xem chỉ nghĩa là đã xác nhận cặp nguồn trong lượt kiểm kê, không có nghĩa người dùng đã nghiệm thu giao diện hoặc sản phẩm. 285 dòng còn lại cần duyệt trực quan trước khóa chi tiết màn hình. SCREEN_REQUIREMENTS.csv trích 928 mục điều khiển/mô tả có số thứ tự từ Word; không phải 928 chức năng độc lập.

Các kích thước/modal/spacing khác phải đọc context node tương ứng ở lượt triển khai. Không ép mọi frame về 900px nếu inventory ghi chiều cao khác; không tự tạo responsive layout mới khi chưa có thiết kế.
