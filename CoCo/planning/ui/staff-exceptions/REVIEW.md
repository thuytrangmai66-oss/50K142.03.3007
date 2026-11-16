# Exception flow Nhân viên — 16/11/2026

Phạm vi UC_8.1/8.2, BR-UC8-01–07. Không commit/push/deploy. Không sửa SQL, UNIQUE constraints, role, lịch sử hoặc dữ liệu thật.

## Nguyên nhân và cách sửa

Service local đã có validator theo trường, nhưng form/cloud/Edge không dùng lại. Edge chuyển hồ sơ chưa hợp lệ xuống `coco_require_text` trong RPC; lỗi chung `VALIDATION: Nội dung bắt buộc hoặc quá dài` không có `fields` nên form mở `ResultDialog`. Nhánh Auth còn gán lỗi tên đăng nhập/mật khẩu vào trường password và chuyển nguyên tiếng Anh của provider.

- `src/domain/staff-validation.ts`: validator thuần dùng chung; giữ giới hạn tên 50, username 10/không khoảng trắng và điện thoại đúng 10 số đã có. Trim hồ sơ như service local, **không trim mật khẩu**.
- `src/services/staff-accounts.ts`: dùng validator chung thay phần mã trùng lặp, không đổi transaction/unique/rename/self-exclusion.
- `src/features/staff/StaffForm.tsx`: preflight trước gọi service, inline đúng trường; sửa trường nào chỉ xóa lỗi trường đó; giữ giá trị khi lỗi. Ref lock chặn submit lặp trước khi React render busy. Không thêm password vào form sửa; không đổi bố cục/modal/CSS.
- `src/cloud/services.ts`: preflight và chuẩn hóa hồ sơ trước Edge; dịch lỗi Auth đã nhận diện sang tiếng Việt tại password; giữ phân loại duplicate/permission/network/conflict/system. Generic backend validation không đủ căn cứ không bị gán bừa vào input; không hiển thị tiền tố SQL.
- `supabase/functions/staff-admin/index.ts`: preflight cùng validator sau kiểm quyền server, trước tạo Auth/RPC; giữ compensation/receipt và kiểm quyền cũ. Lỗi Auth weak_password được dịch; lỗi provider không nhận diện dùng lỗi hệ thống an toàn.

## Quyết định mật khẩu

Người dùng trả lời **“ko cần quy định cho mật khẩu”**: không thêm độ dài tối thiểu, độ phức tạp hoặc giới hạn mới ở frontend/local. Giữ bắt buộc không rỗng khi tạo theo BR-UC8-03; sửa không yêu cầu password. Không đổi/hạ chính sách Supabase Auth. Nếu Auth thực sự trả `weak_password` và mức tối thiểu, hiển thị tiếng Việt với đúng con số trong phản hồi, không cố định 6. Test dùng các phản hồi giả lập 6/8/12 để bảo đảm mapper không hardcode; **không phải xác nhận cấu hình project thật**. Lỗi policy khác dùng “Mật khẩu chưa đáp ứng chính sách bảo mật của hệ thống”, không biến thành “không được để trống”.

## Đối chiếu SRS và UI

Nguồn trace: `planning/REQUIREMENT_TRACEABILITY.md`, BR-UC8-03 bắt buộc; 04 unique username; 05 phone đúng 10 số/unique; 06 kiểm hợp lệ trước tạo/sửa; 07 chỉ cập nhật khi Lưu và hợp lệ. Nguồn CODEX/Figma đã đối chiếu trong đợt trước: SC159 required, SC160 trùng phone/username; SC161 modal lỗi lưu hệ thống. Form sửa SC152–157 dùng cùng StaffField đã có, không tạo kiểu thông báo mới. Giữ mẫu compact được người dùng phê duyệt, không mở lại kích thước form theo ảnh nguồn khác tỷ lệ.

| Luồng | Bằng chứng |
|---|---|
| Họ tên rỗng/whitespace, >50 | Unit; Chromium whitespace và nhiều lỗi đồng thời; maxlength UI giữ nguyên |
| Phone rỗng, 9/11 ký tự, chứa chữ | Unit + Chromium, không gửi Edge khi chắc chắn sai |
| Username rỗng/whitespace, >10/chứa khoảng trắng | Unit; Chromium required; maxlength UI giữ nguyên |
| Phone/username trùng tạo và sửa | Unit mapper + Chromium đúng trường; constraint được kiểm tra chính xác, không đổi schema |
| Password rỗng/whitespace, phản hồi Auth yếu, lỗi provider không nhận diện | Unit + Chromium; không thêm policy |
| Sửa giữ nguyên hồ sơ/unique loại trừ chính nó, rename/history/role | Regression `staff-accounts.test.ts`; UI không password; adapter giữ employeeId/revision |
| Sửa rồi lưu thành công, giữ dữ liệu khi lỗi | Chromium tạo/sửa và regression duplicate |
| Mạng/quyền/system/stale revision | Chromium; dùng thông báo chung được duyệt, không gán trường giả |
| Submit hai lần trước render | Chromium `requestSubmit()` hai lần, chỉ một yêu cầu Edge |
| Viewport thấp | 768×500, nút Lưu trong viewport, không tràn ngang, không đổi CSS |

## Kiểm thử cuối

- Lint, typecheck app, production build: **PASS**. Build giữ cảnh báo annotation Zod/chunk lớn có trước.
- Edge TypeScript với SDK đang cài: **PASS**, cấu hình QA riêng trong `test-results/tsconfig-staff-edge.json`; không sửa config/dependency sản phẩm. Lần đầu alias types trong config QA trỏ đường dẫn SDK cũ; đã sửa alias sang file SDK thực, không sửa assertion/source để che lỗi.
- `npm.cmd test -- tests/unit/staff-validation.test.ts tests/unit/staff-accounts.test.ts tests/unit/cloud-services.test.ts tests/unit/duplicate-error-mapping.test.ts --maxWorkers=1`: **68 PASS / 0 FAIL**, 15,48s.
- `npm.cmd run test:e2e -- tests/e2e/cloud-runtime.spec.ts --workers=1 --reporter=list --output=test-results/staff-exceptions-final`: **12 PASS / 0 FAIL**, 14,3s. Một hành trình chạy thêm để xuất ảnh từng validation: 1 PASS, không cộng vào số test riêng biệt.
- App/SDK/browser thật, transport HTTP/Auth/WebSocket **giả lập**, DB unit profile riêng. Không phát sinh tài khoản hay dữ liệu production. Không chạy full suite vì phạm vi hẹp.

## Ảnh

1440×900, zoom 100%, DPR 1; ảnh viewport thấp ghi riêng. Không cập nhật visual baseline/ngưỡng G10. Đã xem ảnh desktop và màn hình thấp; không tuyên bố toàn bộ frame pixel-perfect.

- [Họ tên whitespace](evidence/staff-input-1.png).
- [Phone bắt buộc](evidence/staff-input-2.png), [9 số](evidence/staff-input-3.png), [11 số](evidence/staff-input-4.png), [chứa chữ](evidence/staff-input-5.png).
- [Username bắt buộc](evidence/staff-input-6.png), [password bắt buộc](evidence/staff-input-7.png), [Auth từ chối password](evidence/staff-auth-password-inline.png).
- [Trùng phone](evidence/coco_employee_phone-inline.png), [trùng username](evidence/taiKhoan_pkey-inline.png), [sửa tài khoản](evidence/staff-edit-inline.png).
- [Nhiều trường lỗi](evidence/staff-required-inline.png), [768×500](evidence/staff-required-small.png), [hash source](evidence/hashes.json).

## Chưa kiểm chứng

**NOT RUN:** deploy Edge mới, Supabase Auth thật, cấu hình mật khẩu production, race hai máy/two-connection. Cần deploy `staff-admin` đã sửa để áp dụng backend preflight/mapping lên môi trường thật; chưa tự deploy theo chỉ đạo. Không lấy transport giả lập làm bằng chứng RLS/transaction cloud production PASS. Generic validation không có field vẫn dùng mẫu lỗi hệ thống tương đương, không đoán trường từ một câu chung. Không tự đánh dấu phase DONE.
