# Xem và kiểm tra CoCo sau G4

> G5 hiện đã có UI chủ tạo tài khoản nhân viên thật; xem [hướng dẫn G5](../phase5/DEMO_GUIDE.md). Các đoạn “chưa có UI staff” bên dưới giữ làm lịch sử G4.

Ngày 11/11/2026. Mã local chưa push/deploy. Dữ liệu riêng theo origin, không đồng bộ đa máy.

## Mở bản local

Trong Terminal:

```powershell
cd D:\50K142-NEW\CoCo
npm run dev
```

Mở **http://127.0.0.1:5173/50K142.03.3007/**. Dùng cùng địa chỉ cho cả hai tab; `localhost` và `127.0.0.1`, port khác hoặc Pages không chia sẻ IndexedDB. Giữ terminal chạy; Ctrl+C dừng server.

Lần đầu chỉ thiết lập một chủ bằng thông tin tự nhập. Nếu đã có chủ thì đăng nhập bình thường; không tạo lại, không xóa storage để sửa lỗi. Không có tài khoản/mật khẩu mặc định. Khi màn đang mở trước thay đổi mã nguồn, tải lại một lần để nhận bản UI mới; tính năng đồng bộ dữ liệu sau đó không cần F5.

## Demo G4 hiện đã có

1. Chủ đăng nhập → Khách hàng → Tạo tài khoản. Nhập họ tên và phone 10 chữ số có số 0 đầu, lưu rồi đóng thông báo.
2. Tìm theo số điện thoại; xóa tìm kiếm; mở hồ sơ, sửa tên/phone rồi tải lại để kiểm lưu. Lịch sử mua/bán trống hiện thông báo đúng; giao dịch thực sẽ hình thành ở G6/G8.
3. Tạo khách chưa có hóa đơn → Xóa tài khoản → Hủy: dữ liệu còn. Xác nhận xóa: hồ sơ biến mất. Khách đã có invoice sẽ bị chặn xóa.
4. Chủ → Khung giá thu mua → Tạo khung giá. Nhập loại/brand, chọn Mới/Tốt/Khá, nhập Min/Max nguyên đồng dương và Min≤Max. Xem, sửa, lọc độ mới; thử trùng tổ hợp hoặc Min>Max để thấy validation.
5. Với dữ liệu G2 chưa được đối chiếu độ mới, giữ nguyên record và dừng ghi khung giá theo thông báo; không tự chọn mã mới để đổi ý nghĩa dữ liệu cũ.

## Hai tab / hai vai trò

Mở tab mới bằng nút `+` của Chrome và nhập chính xác URL trên. Tab đầu đăng nhập staff, tab thứ hai đăng nhập chủ bằng hai tài khoản đã có; không dùng Duplicate tab làm bước chuẩn vì Chrome có thể sao chép sessionStorage lúc tạo bản sao. Tài khoản staff được tạo qua module G5 khi module đó hoàn tất; hiện G4 không cung cấp lối seed/provisioning tắt. Không dùng credential fixture test cho bản demo người dùng.

Với hai account hợp lệ đã có, mở Khách hàng ở hai tab. Tạo/sửa ở một tab, tab còn lại tự cập nhật. Mở cùng form sửa ở cả hai; tab đầu lưu thành công, tab còn lại lưu snapshot cũ phải báo xung đột. Staff không thấy/vào được quản lý khung giá. Logout tab này không được thay role/token của phiên khác độc lập.

Test tự động đã thực thi phần này với dữ liệu trong browser context riêng. Ảnh/test không chứng minh đã chạy trong profile Chrome cá nhân của người dùng.

## Kịch bản thu mua/phê duyệt cho giảng viên — chờ G6

Xem [DEMO_ACCEPTANCE.md](../phase6/DEMO_ACCEPTANCE.md). Hiện **NOT RUN** vì UI account G5 và thu mua/phê duyệt G6 chưa được triển khai. Không hiển thị nút giả và không tạo request bằng DevTools để gọi đó là demo UI thật.

Sau G5/G6: chuẩn bị dữ liệu thật qua UI, staff gửi yêu cầu vượt khung giá hợp lệ; chủ thấy và phê duyệt hoặc từ chối; staff nhận đúng trạng thái không F5; thử click lặp/two-owner race và staff direct route/service denial. Chỉ báo PASS sau khi chạy đủ A–F bằng Chromium/Playwright.
