# Trùng số điện thoại Nhân viên phải hiện dưới input

16/11/2026. Người dùng xác nhận lỗi trên **localhost**, muốn giữ phần tên đăng nhập đang đúng. Không commit/push/deploy; không đổi schema/RLS/constraint, dữ liệu hoặc phong cách form.

## Vấn đề và thay đổi

Form đã xử lý `StaffServiceError.fields.phone` bằng StaffField viền đỏ/icon/text. Tuy nhiên cloud adapter trước đây không kiểm tra phone tồn tại trước khi gọi Edge/Auth. Khi server/transport chỉ trả lỗi lưu chung, form không có căn cứ gán cho phone và mở popup. Test cũ giả lập đầy đủ `23505`/constraint nên chỉ chứng minh mapping đúng với payload đó; chưa bao phủ đường đi SĐT đã tồn tại nhưng Edge trả lỗi chung. Chưa có response có xác thực của chính phiên người dùng để khẳng định payload/phiên bản Edge thực tế.

`src/cloud/services.ts` nay kiểm phone bằng truy vấn **mới** tới `nhanVien`, chỉ lấy `id`, không dùng danh sách cache hoặc chỉ danh sách active. Trùng phone của hồ sơ khác -> `fields.phone = "Số điện thoại đã tồn tại"` ngay trước gọi `staff-admin`; không tạo Auth. Sửa hồ sơ giữ nguyên phone của chính nó vẫn được phép. Kiểm tra này chỉ áp cho create/update nhân viên, không đổi mapping username hoặc các module khác.

`supabase/functions/staff-admin/index.ts` bổ sung cùng precheck sau kiểm owner và lookup receipt, trước provisioning Auth. Database UNIQUE `coco_employee_phone` và xử lý `23505` sau RPC vẫn là nơi phân xử cuối cùng khi hai máy cùng lưu. Preflight không thay transaction hoặc cho phép dữ liệu trùng.

**Retry:** cloud adapter không kiểm trùng trước một retry có kết quả chưa rõ; nó dùng lại key/payload để Edge lookup receipt trước. Nếu lần đầu đã commit nhưng mất phản hồi, không được báo nhầm phone của tài khoản vừa tạo là dữ liệu trùng. Lỗi mạng/quyền/hệ thống không bị đổi thành lỗi phone. Không thay đổi username chỉ vì server báo lỗi chung.

## Bằng chứng

- Unit/integration trực tiếp liên quan: **71 PASS / 0 FAIL**, 6,71s — staff-phone-preflight, staff-admin-edge, staff-validation, cloud-services, duplicate-error-mapping. Có ca existing/inactive phone, chỉnh về phone hợp lệ, race `23505`, self-exclusion, mất response/retry, Edge receipt-before-preflight, lookup lỗi, staff không có quyền.
- Chromium cloud-runtime: **14 PASS / 0 FAIL**, 17,0s. HTTP/Auth giả lập, UI/SDK thật. Ca mới đặt Edge giả lập trả lỗi lưu chung, nhưng phone đã tồn tại được phát hiện trước: **0 request tạo Auth**, không alertdialog, giữ name/username/password, đổi phone lưu được. Các ca username đã đúng vẫn PASS.
- Lint, typecheck app/Edge, production build cloud: **PASS**. Cảnh báo build Zod/chunk có trước. Không chạy lại full suite hoặc SQL không đổi.
- [Ảnh phone trùng inline](evidence/staff-phone-duplicate-preflight.png), 1440×900/DPR1/zoom100%; đã xem. [Hash source](evidence/phone-fix-hashes.json).

## File trong phần bổ sung

Source: cloud/services.ts, supabase/functions/staff-admin/index.ts. Tests: staff-phone-preflight.test.ts, staff-admin-edge.test.ts, cloud-runtime.spec.ts; cập nhật fake query client trong staff-validation.test.ts và cloud-services.test.ts để giữ assertion cũ. Không sửa CSS hoặc nhánh mapping username.

## Áp dụng và giới hạn

Frontend local mới có thể chặn SĐT đã tồn tại bằng truy vấn database trước khi gọi Edge, kể cả Edge cũ chưa có precheck. Cần tải lại tab localhost để chắc chắn dùng module mới. Edge source mới **chưa deploy**; không tuyên bố đã sửa backend đang chạy hoặc đã kiểm race hai máy thật. Các gate production/Auth/RLS OPEN trong audit trước giữ nguyên. Không tự ghi dữ liệu thật để thử.
