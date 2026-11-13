# Demo CoCo sau G5 trên máy tính

Ngày 11/11/2026. Bản local; chưa push/deploy. Không có credential mặc định và không tự seed dữ liệu.

## Mở website

```powershell
cd D:\50K142-NEW\CoCo
npm run dev
```

Mở **http://127.0.0.1:5173/50K142.03.3007/**. Nếu tab vẫn giữ code cũ, tải lại một lần. Dùng cùng scheme/host/port cho hai tab, không đổi giữa localhost và 127.0.0.1. Giữ terminal chạy; Ctrl+C để dừng.

## Chuẩn bị hai vai trò qua UI thật

1. Đăng nhập chủ bằng account đã thiết lập. Nếu DB hoàn toàn mới thì thiết lập chủ một lần bằng thông tin tự nhập.
2. Nhân viên → Tạo tài khoản → nhập họ tên, phone 10 chữ số chưa trùng, username tối đa 10 ký tự không khoảng trắng và mật khẩu → Lưu. Account luôn là Nhân viên, không có lựa chọn tạo owner thứ hai.
3. Mở tab Chrome mới bằng nút `+`, nhập cùng URL và login bằng staff vừa tạo. Không dùng Duplicate tab để sao chép sessionStorage. Hai tab dùng chung IDB nhưng token riêng.
4. Staff có Home/Khách hàng; không thấy/vào được quản lý nhân viên hoặc khung giá của chủ. Module chưa triển khai không có nút giả.

## Kiểm tra G5 và vị trí chi tiết

- Mở một khách hàng hoặc nhân viên trên desktop: card nội dung tự xuất hiện trong vùng đọc, không phải kéo qua toolbar; sidebar/header không cuộn mất. Nội dung dài vẫn có cuộn trong workspace.
- Chủ xem staff detail: mã nhân viên, họ tên, phone, username; không có password/hash/salt. Sửa chỉ ba trường theo SRS; Hủy giữ nguyên.
- Chủ sửa tên/phone rồi lưu: staff thấy tên mới tự cập nhật và vẫn giữ phiên. Mở cùng form ở hai tab chủ để thử stale update: tab sau phải bị chặn, không ghi đè.
- Chủ đổi username: MaNV không đổi; staff mất phiên, cần login bằng tên mới và mật khẩu cũ. Tên cũ không được cấp cho người khác vì còn gắn lịch sử.
- Xóa → Hủy giữ account. Xác nhận → account mất quyền login, phiên staff đang mở bị thu hồi. Employee/invoice/history vẫn giữ; không có chức năng phục hồi account đã xóa trong G5.

Test tự động đã thực thi quy trình trên trong profile test riêng; ảnh không phải dữ liệu Chrome cá nhân. Không xóa storage để demo vì sẽ mất dữ liệu trình duyệt.

## Thu mua/phê duyệt

G5 mới cung cấp tài khoản thật để chuẩn bị demo G6. Luồng staff gửi thu mua, owner phê duyệt/từ chối và staff nhận trạng thái vẫn **NOT RUN**, theo [gate A–F G6](../phase6/DEMO_ACCEPTANCE.md). Không gọi quản lý account thành demo phê duyệt, không tự nhảy dependency. Phân quyền frontend chỉ phục vụ đồ án, không ngang backend.
