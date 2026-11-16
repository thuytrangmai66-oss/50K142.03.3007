# Rà soát module Nhân viên

> Phản hồi tiếp theo 16/11: người dùng xác nhận popup trùng SĐT vẫn xảy ra trên localhost. Đã bổ sung fresh phone preflight ở cloud adapter và Edge, giữ database UNIQUE/race guard và retry receipt; xem [bản sửa cụ thể và ảnh](PHONE_DUPLICATE_FIX.md). Kết quả/hash bên dưới là mốc audit trước bổ sung này, không đại diện source mới.

16/11/2026. Nền `23121ed8fe819ab47c4a1587a7f71dd1d9d2bbb1`, main khớp origin, working tree sạch trước sửa. **LOCAL VERIFIED / PRODUCTION PENDING / RLS REVIEW OPEN**. Không commit, push, deploy hoặc sửa dữ liệu/tài khoản thật.

## Nguồn đối chiếu trực tiếp

- SRS trong repository `02. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG/50K142.03.3007.SRS.docx`, SHA-256 `2D90ADCA26709BCD4630BBA446BD799061575BACD3E6438F5A195ABAF19F3535`. Đã đọc XML đoạn UC_8.1–8.4, BR-UC8-01–10. Không tìm thấy đúng tên hậu tố `SRS(1).docx`; không tự coi phiên bản đó giống bản đang có.
- Design gốc `D:/N3.HK1.PTTKHTTT/BTNHOM/50K142.03.3007.Design.docx`, hash `917FF96B696FD1DE9228560D65D4EA037EDE32297B1699648894DDCA15A1E207`; đoạn SC152–162 xác định lỗi viền đỏ/icon và thông báo dưới trường, lỗi lưu hệ thống dùng dialog. Đọc văn bản, không tuyên bố kiểm toàn bộ bố cục DOCX.
- Đã xem sơ đồ quản lý tài khoản nhân viên (image12 trong `50K142.03.3007.UCD_BPMN.docx`, hash tài liệu `1351BBB644407F1CFF7F8C64230DD00A62C63266548286A66507EB7435D0BE7F`): actor Chủ, tạo/sửa/xóa; UC_8.4 trong SRS bổ sung xem chỉ đọc. Không thêm đổi/reset mật khẩu vì nguồn này không quy định chức năng quản lý đó.
- CODEX SC159/160/161 và hồ sơ `planning/ui/staff-exceptions/REVIEW.md`/G5: dùng thiết kế local theo chỉ đạo đã chốt; giữ modal compact được duyệt. Không sửa baseline, CSS hoặc phong cách Figma.
- Hợp đồng Supabase hiện tại: `coco_staff_admin`, `coco_snapshot`, `coco_profiles`, index `coco_employee_phone`, Edge `staff-admin`/`auth-login`, repository/projection/service và test hiện có.

## Nguyên nhân và sửa đổi

**Trùng số điện thoại:** source tại HEAD đã map đúng SQLSTATE `23505` + constraint/index `coco_employee_phone` sang `fields.phone`. Index thực dùng `public."nhanVien" ((data->>'SoDienThoai'))`; không đổi hoặc xóa. PostgreSQL isolated đã trả đúng tên và rollback toàn bộ hồ sơ/receipt/audit; Edge handler giữ nguyên code/message/details sau bù Auth. Chromium kiểm form không mở alertdialog, viền đỏ/icon và câu nguyên văn **“Số điện thoại đã tồn tại”**, giữ input rồi sửa được. Không viết lại logic đã đúng. Chưa có session Chủ test trên production, chưa đọc được definition/version Edge đang deploy, nên **chưa xác định dứt điểm nguyên nhân popup trên website thực**. Khả năng frontend/Edge khác phiên bản là giả thuyết cần xác minh, không kết luận đã sửa production.

**Mật khẩu ngắn:** SRS chỉ quy định bắt buộc, không nêu con số tối thiểu. Chỉ đạo trước không tự thêm policy vẫn giữ cho local; yêu cầu audit mới cho phép giữ giới hạn bắt buộc của provider và chặn request biết chắc không hợp lệ. [Supabase Auth configuration](https://github.com/supabase/auth/blob/master/internal/conf/configuration.go) đặt floor 6; [password validator](https://github.com/supabase/auth/blob/master/internal/api/password.go) đếm Unicode code points. Đây là giới hạn provider, **không phải xác nhận policy đầy đủ của project = 6**.

Đã thêm `SUPABASE_PASSWORD_FLOOR=6` vào validator chung: form cloud, cloud adapter và Edge tạo mới đều kiểm trước RPC/Auth provisioning. Không trim mật khẩu, không thêm độ phức tạp; local không bị áp floor cloud, sửa không yêu cầu password. Phản hồi Auth cao hơn (8/12 trong fixture) vẫn được dịch theo đúng server. Lỗi Auth vượt giới hạn độ dài được nhận diện và gắn password, không biến thành lỗi rỗng hoặc lỗi trùng. Không đổi Auth policy. Endpoint public `/auth/v1/settings` không công bố minimum/requirements nên cấu hình project cụ thể vẫn **NOT VERIFIED**.

Test fixture trước dùng password `x` để kích hoạt lỗi Auth giả lập; đã đổi mẫu hợp lệ preflight thành `secret` (6) và giữ assertion server yêu cầu 8. Thêm ca 5 ký tự: không gọi Edge, lỗi inline, dữ liệu giữ nguyên. Không bỏ/nới assertion để tạo PASS.

## Bảng nghiệm thu theo chức năng

| Chức năng | Exception SRS | UI Figma | Test thực thi | Trạng thái |
|---|---|---|---|---|
| Danh sách/chi tiết | UC8.4, chỉ đọc, lỗi tải | SC145–148 | Unit local + Chromium native, lỗi đọc/reload | PASS local; production có Auth NOT RUN |
| Tạo hợp lệ/Hủy | UC8.1, vai trò staff bắt buộc | SC158/162 | Chromium native + Edge handler + PostgreSQL riêng | PASS local |
| Họ tên/phone/username/password bắt buộc; whitespace | UC8.1/8.2 | SC159 inline | Unit + cloud Chromium, nhiều lỗi cùng lúc | PASS local |
| Phone đúng 10 số; giới hạn tên/username | BR8-05/06, schema 50/10 | Inline, maxlength giữ nguyên | Unit và Chromium các trường hợp liên quan | PASS local |
| Trùng phone | UC8.1-5b/8.2-8f, đúng câu SRS | SC160/154: đỏ/icon/dưới trường | PG23505, Edge giữ lỗi/bù Auth, Chromium create/edit | PASS local; production PENDING |
| Trùng username | UC8.1-5c/8.2-8e | SC160/154 inline | Unit mapper, Edge Auth duplicate, PG create/edit, Chromium | PASS local |
| Password dưới floor cloud | Provider; SRS không có minimum số | Tái dùng StaffField inline | Unit cả emoji/code points, Edge, Chromium chặn trước request | PASS local; policy project chưa xác minh |
| Sửa/không đổi dữ liệu/self-exclusion | UC8.2, BR8-07 | Form sửa có sẵn, không password | PG + unit + Chromium | PASS local |
| Rename/giữ quyền/lịch sử | Hợp đồng hiện có | Giữ UI sửa | SQL alias/MaNV/lịch sử, Edge login username server | PASS local |
| Hủy/xác nhận xóa/vô hiệu hóa | UC8.3, BR8-08/09 | Confirm/result hiện có | Chromium + PG active=false, user:null, chặn snapshot/write | PASS local |
| Đăng nhập/độc lập phiên/thu hồi | UC0 + BR8-09 | UI hiện có | Chromium native; handler Auth giả lập, fresh profile/version | PASS local; Auth production NOT RUN |
| Phân quyền thao tác/URL | BR8-01 | Menu/route đúng vai trò | PG chặn RPC/direct update; cloud Chromium `/staff`, `/staff/NVSTAFF`; Edge owner guard | PASS local cho quản lý; quyền đọc raw có OPEN bên dưới |
| Đồng thời/stale/replay/rollback | Hợp đồng RPC | Form giữ dữ liệu, không success giả | PG single-connection + native hai tab + Edge retry/compensation | PASS phạm vi đã chạy; hai kết nối cloud NOT RUN |
| Phân trang | Layout chung đã duyệt | Không sửa layout | Chromium 0/1/5/9/10/25 bản ghi, desktop + cửa sổ thấp | PASS local |
| Đổi/reset mật khẩu trong module | Không có chức năng trong nguồn/decision hiện có | Không thêm UI | Không tự triển khai | NOT APPLICABLE trong phạm vi hiện có |

## Kiểm thử và giới hạn bằng chứng

- Lint, typecheck app, typecheck Edge với SDK hiện có, production build cloud/local: **PASS**. Cảnh báo Zod/chunk lớn giữ nguyên.
- `staff-validation`, `staff-accounts`, `cloud-services`, `duplicate-error-mapping`: **72 PASS / 0 FAIL**.
- `staff-admin-edge` + `staff-login-edge`: **20 PASS / 0 FAIL**. Thực thi handler source sau transpile; SDK/Auth/HTTP giả lập, không phải Deno deploy. Kiểm quyền trước provision, password không xuống RPC/profile, Auth policy fail không tạo hồ sơ, SQL lỗi bù Auth unlinked, không xóa khi outcome chưa rõ/có profile, phục hồi đúng metadata operation, phiên thay đổi khi login bị từ chối.
- PostgreSQL `node supabase/tests/staff-accounts.mjs`: **12 PASS / 0 FAIL / 1 OPEN**; không kết luận race nhiều connection PASS. [Kết quả](evidence/staff-sql-audit.json).
- Chromium `cloud-runtime.spec.ts`: **13 PASS / 0 FAIL**, 21,3s; SDK/UI thật, HTTP/Auth/Realtime giả lập. Bao gồm regression mapping Khách hàng/Khung giá/Thu mua vì dùng cloud adapter chung.
- Chromium `staff.spec.ts`, `staff-review.spec.ts`: **9 PASS / 0 FAIL**, 27,5s; IndexedDB native test profile riêng, console assertions có trong suite.
- Chromium `pagination.spec.ts --grep 'owner staff:|^staff:'`: **2 PASS / 0 FAIL**, 15,7s.
- Lượt đầu lint báo 4 biến tham số chưa dùng trong harness test mới; đã sửa harness, lint PASS. Lượt đầu SQL test mong identity inactive phải throw; hợp đồng thực trả `user:null`, đã sửa assertion xác nhận không có identity, vẫn giữ yêu cầu snapshot/write bị từ chối. Không sửa acceptance nghiệp vụ hay nới test production.

## Website thực và bản deploy

Đã mở Chromium thật tại [Pages staff](https://thuytrangmai66-oss.github.io/50K142.03.3007/#/staff), profile mới không có credentials. Route trở về login, login hiện đúng, **0 pageerror**, **0 service worker**. Chưa tạo/sửa tài khoản thật. Đây là smoke ẩn danh, không phải nghiệm thu CRUD production.

CI [run 43814113609](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/runs/43814113609) của SHA `23121ed...` có checks/deploy **success**. HTML Pages tham chiếu `index-CbE6EUVx.js`; bundle chứa exact phone constraint và thông báo tiếng Việt. Không có marker SHA trong app để tự khẳng định byte-level provenance; CI deploy và asset/hash lưu riêng là bằng chứng hiện có. Chưa xác minh source SHA của Edge; Pages deploy không deploy Edge Functions.

[Bằng chứng smoke](evidence/staff-production-readonly.json), [job CI](evidence/staff-production-ci.json), [ảnh login](evidence/staff-production-login.png).

## OPEN/BLOCKED cần xử lý trước nghiệm thu production

1. **RLS đọc hồ sơ nhân sự — OPEN REVIEW:** `coco_can_read` có nhánh fallback `return true` cho operational employee/username links. PostgreSQL xác nhận staff đọc được document `nhanVien` khác mình, gồm phone. UI/RPC quản lý và `coco_profiles` đã chặn đúng; không đồng nhất các gate đó với bảo vệ toàn bộ dữ liệu raw. Cần PO/backend review phạm vi dữ liệu được phép đọc: nếu chỉ cần tên/MaNV để hiển thị chứng từ, cần thiết kế projection tối thiểu + policy tương ứng, kiểm lại reader/FK/lịch sử trước sửa. **Chưa sửa RLS/RPC/schema** theo giới hạn yêu cầu, không coi mục này PASS.
2. **Production CRUD/Auth/đồng thời — NOT RUN:** chưa có phiên Chủ test/môi trường cloud test riêng; không tạo tài khoản thật. Cần kiểm trùng phone, create/edit/login/disable và race hai thiết bị trên backend thật, đồng thời xác minh `staff-admin` đang deploy tương ứng source nào.
3. **Auth project policy — NOT VERIFIED:** chỉ xác nhận provider floor 6; public settings không trả minimum/requirements, chưa có quyền management/dashboard để đọc cấu hình. Không tự thay đổi policy hoặc đoán project chỉ cần 6.
4. Source mới và Edge mới **chưa deploy**; lỗi production chưa được xác nhận khép. Không đánh dấu module/phase DONE.

## File thay đổi

`src/domain/staff-validation.ts`, `src/features/staff/StaffForm.tsx`, `src/cloud/services.ts`, `supabase/functions/staff-admin/index.ts`; tests `staff-validation.test.ts`, `staff-admin-edge.test.ts`, `staff-login-edge.test.ts`, `cloud-runtime.spec.ts`; `supabase/tests/staff-accounts.mjs`; báo cáo/evidence này. Không đổi SQL migration/RLS/constraint/dependency/workflow, database hay dữ liệu legacy.

Ảnh 1440×900, DPR1, zoom100%, fixture riêng: [phone trùng inline](evidence/coco_employee_phone-inline.png), [username trùng](evidence/taiKhoan_pkey-inline.png), [password ngắn](evidence/staff-short-password-inline.png), [policy Auth fixture](evidence/staff-auth-password-inline.png), [sửa](evidence/staff-edit-inline.png), [required](evidence/staff-required-inline.png). Đã xem ảnh phone/password; không đổi layout hoặc ngưỡng/baseline visual.
