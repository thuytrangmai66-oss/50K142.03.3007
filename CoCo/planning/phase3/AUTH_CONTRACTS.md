# Hợp đồng xác thực và quyền Giai đoạn 3

Ngày 11/11/2026. Phạm vi đã triển khai local; không bổ sung quy tắc tiền, điểm, trạng thái hóa đơn hoặc scheduler.

## Tài khoản và khởi tạo

- `owner` / `staff` là mã kỹ thuật từ `accountSecurity` G2, tương ứng Chủ cửa hàng / Nhân viên theo SRS. Không gán các số TINYINT chưa được mapping trong Design.
- P01: lần đầu nhập họ tên, số điện thoại 10 chữ số, username tối đa 10 ký tự không khoảng trắng và mật khẩu không rỗng. Dùng validation G2; không có tài khoản/mật khẩu mặc định. Username trim, mật khẩu giữ nguyên byte, chỉ kiểm rỗng bằng trim.
- `bootstrap()` tạo employee + account + security + marker `auth:bootstrap-completed` + version/receipt/audit trong cùng transaction. Guard kiểm tra marker hoặc bất kỳ owner hiện có ngay trong transaction; owner inactive vẫn ngăn mở lại setup. Hai tab chỉ một lần thắng. Audit lỗi thì tất cả rollback.
- Đây là màn kỹ thuật P01 được cho phép khi người dùng yêu cầu tiếp tục sau bản kế hoạch. Staff CRUD thuộc G5; fixture staff chỉ nằm trong test, không có lối tạo staff ở runtime G3.

## Credential và phiên

`PBKDF2-SHA-256`, salt ngẫu nhiên 16 byte, 600.000 vòng, hash 32 byte. Hash/salt nằm trong `accountSecurity`, không nằm trong `taiKhoan` hoặc DTO gửi UI. Không dùng dữ liệu mẫu trong thiết kế làm credential mặc định. Web Crypto và hashing chạy ngoài transaction IDB; trước phát hành phiên phải đọc lại active, role, employee và security version trong transaction ghi.

Phiên là capability ngẫu nhiên 32 byte. Browser tab lưu duy nhất chuỗi hex token tại `sessionStorage['coco:session']`, không lưu username/role/password/hash/salt. DB lưu SHA-256 của token trong `authSessions`; biết tokenHash không đủ để dùng như token. DTO `AuthUser` chỉ có username, employeeId, displayName và role.

`CoCoDB` tăng logical version 2 → 3 (native IDB 20 → 30), thêm duy nhất store `authSessions (&tokenHash, username)`. Giữ nguyên khai báo v1/v2, entity, metadata, index, FK và constraints G2. Không reset DB, seed account hoặc biến dữ liệu người dùng thành fixture.

Mỗi lần đọc/ghi được bảo vệ phải đối chiếu phiên với account/employee hiện có, `active`, role và `recordVersions` hiện tại. Logout xóa phiên cùng audit trong một transaction; lỗi audit giữ phiên và UI báo thử lại. Thay role/version hoặc inactive làm phiên cũ không hợp lệ. UI quan sát DB bằng liveQuery và kiểm lại khi focus/pageshow/visibility. Không thêm timeout/khóa tài khoản theo suy đoán; orphan session hash sau khi tab mất token chưa có cơ chế dọn tự động trong G3.

## API nội bộ và ranh giới tin cậy

| Hàm | Hợp đồng |
|---|---|
| `state(tokenHash)` | Query chỉ DB, dành cho provider/liveQuery; trả trạng thái setup + DTO, không raw credential |
| `bootstrap(input)` | Màn setup duy nhất, role luôn owner; caller không truyền role |
| `login(username,password)` | Rỗng báo REQUIRED; unknown/wrong/inactive cùng INVALID_CREDENTIALS; cùng chi phí KDF cho unknown/inactive; phát hành phiên và audit nguyên tử |
| `session(token)` | Băm capability trước transaction, đọc trạng thái hiện tại; session hash không phải token |
| `readAuthorized(token,permission,query)` | Service nội bộ cung cấp permission cố định và query DB-only, guard và query trong cùng transaction đọc |
| `commitAuthorized(token,permission,command)` | Clone command trước await; bỏ actor do caller truyền; guard bên trong transaction repository, trước cả tra receipt retry; audit lấy actor từ phiên |
| `logout(token)` | Xóa phiên + audit nguyên tử; retry phiên đã xóa không tạo audit trùng |

Các helper generic không phải endpoint để UI tự chọn permission, query hoặc command. Module G4 trở đi phải có service method với permission cố định và validation nghiệp vụ; không gọi repository trực tiếp từ component. Defense hiện có: read permission không được ghi; staff không ghi account/employee/security/bracket hoặc quyết định approval; user không ghi `discountApplications`. Chưa claim các chuyển trạng thái/tổng tiền/ưu đãi của module tương lai đã được bảo vệ bằng rule hoàn chỉnh.

## Ma trận quyền nền

| Phạm vi | Chủ | Nhân viên |
|---|---|---|
| Trang chủ, đọc/tạo thu mua, đọc/tạo bán hàng | Có | Có |
| Đọc/sửa hàng hóa; xem giám sát tồn lâu | Có | Có |
| Đọc/tạo/sửa/xóa hồ sơ khách | Có | Có |
| Đọc/tạo/sửa khung giá | Có | Không |
| Đọc/quyết định phê duyệt | Có | Không |
| Báo cáo; đọc/tạo/sửa/xóa account nhân viên | Có | Không |
| Chạy scheduler bằng nút người dùng | Không | Không |

Đây là quyền theo SRS, không phải danh sách module đã code. Router dùng registry cùng permission. Hiện menu chỉ Home/Logout; các trang tương lai chưa có thì owner gặp 404, staff vào đường dẫn owner-only gặp thông báo không có quyền. KPI và nghiệp vụ vẫn theo phase đã định.

## Thông báo và nguồn

- SC004/SC195 dùng “Tên đăng nhập hoặc mật khẩu không được để trống”; SRS ERR-01 dùng “và”. Giữ hành vi chặn cả hai trường, lấy chữ “hoặc” theo thiết kế UI local và ghi rõ khác biệt, không sửa SRS.
- SC003/SC194: “Tên đăng nhập hoặc mật khẩu không đúng”, viền đỏ và icon.
- SC005/SC196 và SC006/SC197: dialog lỗi/thành công có nút đóng; thành công có viền input xanh, đóng dialog mới vào shell.
- Loading/submit lặp bị khóa; lỗi DB lúc khởi động có Thử lại. SessionStorage không ghi được thì thu hồi session vừa phát hành và báo phục hồi.

Kiến trúc local vẫn là kiểm soát demo AD03; không bảo vệ khỏi người chủ động sửa JS/IndexedDB bằng DevTools. Không thêm backend, xác minh ngân hàng hoặc quyền theo artwork sai của menu staff.

Tham khảo kỹ thuật đã đối chiếu: [Dexie liveQuery](https://dexie.org/docs/liveQuery()), [Web Crypto deriveBits](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits). Kết quả thực thi nằm trong [báo cáo G3](REPORT_PHASE_3.md).
