# Hợp đồng tài khoản nhân viên G5

Ngày 11/11/2026. Theo chỉ đạo thực hiện G5; đối chiếu SRS UC8.1–8.4 và CODEX SC145–SC162. Không backend/Supabase, không thay schema G2/G3.

## Định danh và rename P08

Chọn phương án **rename trong một transaction, giữ MaNV ổn định** từ kế hoạch P08. Không khóa trường username, không delete/create bằng các transaction rời rạc. Đây là cách hiện thực kỹ thuật của nghiệp vụ sửa username đã có trong SRS, không bổ sung nghiệp vụ mới.

- `MaNV` không đổi; invoice, bracket và approval vẫn tham chiếu cùng nhân viên. Route `/staff/:employeeId` ổn định khi đổi username.
- Khi rename, tạo PK account/security mới và xóa PK cũ trong cùng command; chuyển `memberships.registeredBy` và `notifications.recipient`, giữ các trường còn lại/time/readAt. Version CAS áp cho mọi bản ghi liên quan.
- Trước commit, đọc lại active/role và cả ba version account/security/employee; tập reference phải còn khớp snapshot. Reference mới xuất hiện lúc đang chuẩn bị thì fail CONFLICT để retry, không bỏ sót link.
- `appMetadata['account-identity:<username>'] = MaNV` giữ alias định danh lịch sử. Giữ audit.actor nguyên username lúc phát sinh, không viết lại lịch sử; alias giúp lần ngược MaNV. Username cũ không được cấp cho nhân viên khác; nhân viên cũ có thể đổi lại tên của chính mình nếu không có account hiện tại trùng tên.
- Alias không dùng làm thông tin đăng nhập: sau rename chỉ username mới đăng nhập được. Thu hồi mọi session của MaNV đó trong cùng transaction. Người chủ thực hiện thao tác không bị đổi phiên.
- Giữ nguyên hash/salt/iterations khi sửa profile/username; không lấy hash làm password để hiển thị. SRS/SC152 chỉ sửa tên/phone/username, nên không tự thêm reset mật khẩu vào form sửa.

Không cần migration schema: dùng appMetadata, recordVersions, accountSecurity, authSessions đã có trong DB v3. Không quét/viết lại account cũ hàng loạt. Account G2 chưa có alias chỉ được ghi alias khi owner tạo/rename/xóa qua service.

## Tạo, đọc và xử lý xóa

Tạo cần họ tên, phone đúng 10 số, username đúng ràng buộc CHAR(10)/không khoảng trắng và password không rỗng. Username trim, password giữ nguyên byte; KDF ngoài transaction. Vai trò luôn staff do service gán, không lấy role từ form. Employee/account/security/alias/version/audit/receipt commit nguyên tử. Kiểm unique phone và username ngay trong transaction; không tạo owner thứ hai.

Read/list là owner-only và trả DTO `{employeeId,name,phone,username,revision}`. DTO không có password, hash, salt hoặc iterations. Revision chỉ là bộ version để chống stale form. Detail không hiển thị/khôi phục password. Chủ không được dùng module staff để sửa/xóa account owner.

Xóa có Xác nhận/Hủy. Xác nhận → `accountSecurity.active=false` và xóa session cùng audit/alias, giữ employee/account/FK/lịch sử. Đây là soft delete để đáp ứng hậu điều kiện SRS BR-UC8-09: không còn được phép đăng nhập. List chỉ hiện account staff active; phone/username đã lưu vẫn giữ ràng buộc unique. Chưa có nghiệp vụ phục hồi/tái sử dụng tài khoản đã xóa; không âm thầm xóa lịch sử để tái dùng tên/phone.

Sửa chỉ tên/phone không đổi credential/version security, nên phiên staff đang dùng vẫn hợp lệ và tên hiển thị tự cập nhật. Rename hoặc xóa thì phiên bị thu hồi. Cancel không ghi. Audit lỗi rollback cả business data, alias và session deletion; replay/stale không được ghi đè.

## Giới hạn

Client-only phục vụ demo cùng browser/origin, không ngang bảo mật backend. Không có dữ liệu mẫu/credential mặc định. Bộ test có fixture riêng; nhân viên để demo thực có thể tạo qua UI G5. Hai tab mở từ nút `+` và cùng URL, không dùng Duplicate tab để chủ động sao chép sessionStorage.
