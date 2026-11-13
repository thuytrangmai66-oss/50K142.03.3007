# Mở bản CoCo local hiện tại

Ngày 13/11/2026. Bản local chạy trực tiếp source hiện tại, không phải bản deploy.

T05: tại Khách hàng → Lịch sử mua, chọn giao dịch để xem hóa đơn bán cùng snapshot với màn hình Bán hàng. Lịch sử bán là chiều khách bán cho COCO, không phải danh sách này. Trên chi tiết hóa đơn bán, nhấn Ctrl+P để xem bản in chỉ chứa hóa đơn; không có nút in mới ngoài thiết kế. Kiểm thử tự động mới xác minh print-media, chưa kiểm máy in vật lý.

1. Nhấp đúp `D:\50K142-NEW\CHAY_COCO_LOCAL.cmd`.
2. Mở Chrome tại `http://127.0.0.1:5173/50K142.03.3007/` nếu trình duyệt không tự mở.
3. Giữ cửa sổ server trong khi sử dụng; nhấn Ctrl+C để dừng.

Yêu cầu Node.js 24.x và npm 11.x. Nếu thiếu dependencies, launcher chạy `npm ci` theo lockfile; lần này cần mạng. Không tự cài lại khi dependencies đã có. Đặt launcher cạnh thư mục `CoCo`, không di chuyển riêng file ra nơi khác.

Nếu đúng server CoCo đã chạy tại cổng 5173, launcher dùng lại. Nếu cổng bị ứng dụng khác chiếm, launcher báo lỗi; không tự tắt tiến trình hoặc đổi cổng.

Đăng nhập bằng tài khoản đã tạo trong Chrome tại đúng địa chỉ trên. Không có tài khoản/mật khẩu demo cố định. Với origin hoàn toàn mới chưa có dữ liệu, dùng màn hình tạo Chủ cửa hàng đầu tiên. Không xóa storage để thử đăng nhập. `localhost`, cổng khác, trình duyệt khác hoặc cửa sổ ẩn danh sử dụng storage khác.

Để thử hai vai trò, mở hai tab cùng địa chỉ trong cùng Chrome, đăng nhập riêng Chủ/Nhân viên ở mỗi tab. Phiên theo tab; IndexedDB dùng chung. Dùng dữ liệu và tài khoản kiểm thử riêng nếu muốn thử thu mua/phê duyệt.

G8 hiện có giỏ nháp, chọn khách hàng, opt-in thành viên, ưu đãi, QR cục bộ và thanh toán tiền mặt/chuyển khoản. Đăng ký thành viên là thao tác ghi thật và vẫn được giữ khi hủy giỏ, theo G8-D01.

Từ T04, nút **Lưu** xác nhận thanh toán: Tiền mặt/Lưu hoàn tất ngay khi transaction thành công; Chuyển khoản/Lưu mở QR, chỉ **Đã nhận** mới hoàn tất sau khi người thao tác kiểm tra tiền vào. Quay lại/Escape không ghi hóa đơn/điểm/sold. Không có kết nối ngân hàng hoặc đối soát tự động. Dùng sản phẩm/khách demo riêng vì thanh toán thành công sẽ ghi hóa đơn, đổi tồn kho và điểm thật trong IndexedDB.

Cập nhật sửa module: **Bán hàng** trên sidebar mở danh sách `/sales`, có tìm kiếm kết hợp và chi tiết. Chọn **Tạo giao dịch**, nhập mã sản phẩm trong thanh quét/nhập rồi **Thêm** hoặc Enter; không cần mở popup nhập mã. Thành viên đủ 50 điểm được tự động giảm 20% theo D05, không cần checkbox dùng ưu đãi. Checkbox đồng ý đăng ký thành viên vẫn được giữ cho khách chưa đăng ký. Sau Lưu thành công hoặc Hủy, trở lại danh sách. Phần in hóa đơn/tích hợp lịch sử và nghiệm thu cuối vẫn theo task tiếp theo.

Kiểm tra launcher không mở server/browser: `CHAY_COCO_LOCAL.cmd -CheckOnly -NoOpen`. Chạy server không tự mở browser: `CHAY_COCO_LOCAL.cmd -NoOpen`.

Launcher không reset IndexedDB, seed dữ liệu, thay đổi Git, push hoặc deploy. PowerShell chạy với execution policy chỉ áp dụng cho tiến trình launcher, không sửa chính sách máy.
