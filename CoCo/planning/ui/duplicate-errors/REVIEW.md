# Thông báo trùng dữ liệu theo SRS/Figma — 16/11/2026

Giữ các thay đổi nhiệm vụ Khung giá trước đó. Không commit/push/deploy, không sửa schema/constraint/dữ liệu thật. Chỉ sửa chuyển đổi lỗi và tái sử dụng UI hiện có.

## Nguồn và cách hiển thị

Đối chiếu CODEX local theo chỉ đạo trước, không lấy số liệu mẫu trong ảnh làm dữ liệu. Đã xem ảnh SC083, SC160, SC161, SC170 và đọc nội dung PDF tạo/sửa khách hàng số 4; đối chiếu catalog `planning/FIGMA_SCREEN_MAPPING.md` với các nguồn này. Mẫu form compact đã được phê duyệt giữ nguyên; không mở lại kích thước form hoặc tạo kiểu thông báo mới.

| Trường hợp | Nhận diện backend | Nội dung SRS/chỉ đạo | UI và nguồn |
|---|---|---|---|
| Tạo/sửa khách trùng điện thoại | 23505, `coco_customer_phone`; `SoDienThoaiKH` | Số điện thoại bị trùng với khách hàng khác | Inline dưới phone, đỏ/icon; SC083/098, PDF Tạo/Sửa thông tin khách hàng 4; staff tương ứng SC276/291 |
| Tạo/sửa nhân viên trùng điện thoại | 23505, `coco_employee_phone`; `SoDienThoai` | Số điện thoại đã tồn tại | `StaffField` inline, SC160 |
| Tạo/sửa nhân viên trùng username | 23505, `taiKhoan_pkey`/`coco_profiles_username_key`; hoặc exception DUPLICATE với nội dung username chính xác | Tên đăng nhập đã tồn tại | `StaffField` inline, SC160; không suy diễn mọi lỗi Profile trùng là username |
| Tạo/sửa khung giá trùng | 23505, `coco_bracket_identity`; Loại hàng + Thương hiệu + Độ mới | Khung giá đã tồn tại | Giữ `ResultDialog` modal theo SC170; edit tương ứng SC182 |
| Lỗi lưu hệ thống | Không có căn cứ gắn trường | Giữ fallback hiện có | Modal tương đương SC161; không thêm toast/browser alert |

SC170 thực sự có modal cảnh báo nằm trên form. Vì thế không chuyển lỗi Khung giá thành inline chỉ để bỏ mọi modal lồng. Ngược lại SC083/098/160 quy định inline: không còn popup lỗi cho các trường trùng đã nhận diện này. Không sao chép annotation đỏ/số đánh dấu từ ảnh nguồn vào UI.

## File và thay đổi

- `src/cloud/services.ts`: mapper kiểm tra cả service/method, SQLSTATE và tên constraint chính xác. Customer/staff duplicate nhận `fields.phone/username`; constraint khác dùng thông báo an toàn, không gắn nhầm trường hoặc lộ SQL. Staff Edge call truyền method cho mapper. Giữ validation fields hiện có và các nhánh permission/network/system.
- `src/features/customers/CustomerForm.tsx`: thêm icon `CircleAlert` đã có trong bộ UI vào dòng lỗi điện thoại; `Field` có sẵn border đỏ, chữ đỏ, ARIA và vị trí dưới input. Không đổi form layout/CSS, không reset dữ liệu.
- `supabase/functions/staff-admin/index.ts`: giữ code/details PostgreSQL khi lỗi RPC sau phần compensation hiện có. Trước đây nhánh này chuyển 23505 thành SYSTEM, làm frontend mất căn cứ nhận diện trường. Không đổi Auth/RLS/transaction hoặc điều kiện compensation.
- Test: `tests/unit/duplicate-error-mapping.test.ts`; mở rộng `tests/e2e/cloud-runtime.spec.ts`. Các file Khung giá của nhiệm vụ trước vẫn được giữ.

## Kết quả thực thi

| Lệnh/phạm vi | Kết quả |
|---|---|
| `npm.cmd run lint` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS, giữ cảnh báo annotation Zod/chunk lớn có trước |
| Unit: duplicate-error-mapping + bracket-cloud-errors + cloud-services | **30 PASS / 0 FAIL** |
| Chromium cloud-runtime | **10 test riêng biệt PASS cuối**: 7 PASS lượt đầu; 3 test inline sửa selector tương đối rồi PASS |

Ba lỗi đầu của test inline là `has:` locator mang ancestor form vào scope của field; error-context đã cho thấy UI inline đúng. Đã sửa locator, giữ nguyên assertion/nội dung/timeout. Ba test inline được mở rộng và chạy lại để kiểm chứng sửa rồi lưu thành công. Không tính lượt chạy lại thành test mới.

UI dùng app/SDK thật nhưng HTTP/Auth/WebSocket giả lập, profile test riêng. Đã kiểm tra tạo/sửa khách trùng; nhân viên trùng phone/username; tạo/sửa khung giá trùng; giá trị form giữ nguyên; sửa rồi lưu lại; một form duy nhất cho inline; border/ARIA/icon; constraint khác; validation và lỗi quyền/mạng/hệ thống của luồng khung giá; hai browser context cạnh tranh. Ảnh 1440×900, zoom 100%, DPR 1, đã xem ảnh sau sửa.

## Ảnh và giới hạn

- [Tạo khách hàng](evidence/customer-create-inline.png), [Sửa khách hàng](evidence/customer-edit-inline.png).
- [Nhân viên — phone](evidence/coco_employee_phone-inline.png), [Nhân viên — username](evidence/taiKhoan_pkey-inline.png).
- [Khung giá — tạo](evidence/bracket-create-modal.png), [Khung giá — sửa](evidence/bracket-edit-duplicate.png).
- Trước sửa: mapper giữ raw SQL, thiếu `fields` nên form mở modal; trước đó Edge cũng mất SQLSTATE. Chưa chụp ảnh trước sửa riêng cho khách hàng/nhân viên; không dựng ảnh giả làm bằng chứng trước. Nguồn CODEX giữ ngoài Git. Không cập nhật baseline visual hoặc ngưỡng G10; không tuyên bố pixel-perfect mọi frame.
- **NOT RUN:** deploy/run `staff-admin` mới, lỗi trùng trên Supabase thật và race hai máy thật. Cần triển khai Edge Function đã sửa trước khi nhận đủ metadata 23505 từ RPC trên môi trường thật. Không tự deploy theo yêu cầu.
- Validation khác và các module ngoài ba nhóm này giữ nguyên; đây không phải chứng nhận toàn bộ exception/visual trong SRS/Figma đã được kiểm chứng. Không phát hiện mâu thuẫn về kiểu hiển thị của bốn lỗi trùng được xử lý.
- `git diff --exit-code -- supabase/migration_all.sql package.json package-lock.json` PASS: SQL, constraint và dependencies ứng dụng không đổi. Không tác động dữ liệu legacy hay trạng thái nghiệm thu G2–G10.

## Kiểm tra trước commit/push theo yêu cầu tiếp theo

Người dùng đã cho phép commit/push các sửa đổi này. Gắn tiền tố `mocked cloud Auth:` cho sáu test mới để CI hiện có chọn đúng nhóm cloud và loại khỏi bundle local; không đổi workflow, không bỏ test/assertion. Chạy lại toàn file: **10/10 Chromium PASS, 11,0 giây**. Các bằng chứng lint/typecheck/build và 30 unit/integration phía trên vẫn áp dụng vì source/dependencies không đổi sau khi kiểm chứng. Push main có thể kích hoạt workflow Pages hiện có; không triển khai thủ công Edge `staff-admin`.
