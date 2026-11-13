# Kế hoạch Giai đoạn 5 Quản lý tài khoản nhân viên

> Bổ sung rà soát trước chuyển G6 ngày 11/11/2026: giữ nguyên T01–T05; hoàn thiện password toggle SC158, icon validation, lỗi đọc chi tiết SC147 và trạng thái popup thành công SC150/157/162 trong chính phạm vi G5. [Biên bản rà soát và kiểm thử mới nhất](REVIEW_COMPLETION.md) thay các số test lịch sử bên dưới; chưa tự ghi DONE khi gate review/visual còn mở.

Ngày 11/11/2026. **READY FOR REVIEW** theo chỉ đạo tiếp tục G5; đã code/test quản lý nhân viên và sửa mở chi tiết trên desktop. P08 chọn transaction rename/alias giữ MaNV; không đổi schema. Hồi quy mới nhất 101 Vitest + 52 Chromium, lint/typecheck/build/audit PASS. [Báo cáo](REPORT_PHASE_5.md), [contract](IDENTITY_CONTRACT.md). Không commit/push/deploy, không triển khai trước G6 hoặc mở rộng mobile.

## 1 Mục tiêu

Owner tạo/xem/sửa/xóa tài khoản nhân viên; cho phép kiểm thử hai vai trò bằng tài khoản do owner chủ động tạo.

## 2 Nguồn và yêu cầu

UC_8.1, UC_8.2, UC_8.3, UC_8.4. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

SC145, SC146, SC147, SC148, SC149, SC150, SC151, SC152, SC153, SC154, SC155, SC156, SC157, SC158, SC159, SC160, SC161, SC162

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

Owner tạo/xem/sửa/xóa tài khoản nhân viên; cho phép kiểm thử hai vai trò bằng tài khoản do owner chủ động tạo. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

| Nhóm | Component dự kiến |
|---|---|
| UI31 / Danh sách tài khoản nhân viên | StaffSearchTable |
| UI32 / Thông tin tài khoản nhân viên | StaffDetail |
| UI33 / Tạo tài khoản nhân viên | StaffCreateForm |
| UI34 / Sửa tài khoản nhân viên | StaffEditForm |

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

nhanVien, taiKhoan, accountSecurity, session metadata; notifications/memberships và audit liên quan identity. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

src/features/staff/, src/services/staff-accounts.ts, src/services/auth/, src/db/ (migration identity nếu cần), tests/unit/staff*, tests/e2e/staff*. Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [x] G5-T01 | Owner tạo account và nhân viên/security nguyên tử; role luôn staff từ service, không nhận role tùy ý của form | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI31/33 và PBKDF2 helper tái sử dụng | src/features/staff/, src/services/staff-accounts.ts, src/services/auth/, src/db/ (migration identity nếu cần), tests/unit/staff*, tests/e2e/staff* | TC-UC8-1-MAIN; TC-BR-UC8-02 |
| [x] G5-T02 | Đọc danh sách/chi tiết không lộ hash/salt; mọi read và write đều owner-only | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI31/32 và DTO an toàn | src/features/staff/, src/services/staff-accounts.ts, src/services/auth/, src/db/ (migration identity nếu cần), tests/unit/staff*, tests/e2e/staff* | TC-UC8-4-MAIN; TC-P5-SECRET-DTO |
| [x] G5-T03 | Sửa tên/phone/username theo SRS; triển khai stable identity/rename mapping P08, bảo toàn FK và lịch sử | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI34, không né nghiệp vụ bằng khóa field username | src/features/staff/, src/services/staff-accounts.ts, src/services/auth/, src/db/ (migration identity nếu cần), tests/unit/staff*, tests/e2e/staff* | TC-UC8-2-MAIN; TC-P5-RENAME |
| [x] G5-T04 | Xóa theo xác nhận/hủy, ưu tiên vô hiệu hóa logic để giữ lịch sử; tài khoản mất quyền đăng nhập và phiên cũ bị thu hồi | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI32 confirm/results, active/session revocation | src/features/staff/, src/services/staff-accounts.ts, src/services/auth/, src/db/ (migration identity nếu cần), tests/unit/staff*, tests/e2e/staff* | TC-UC8-3-MAIN; TC-P3-SESSION-REVOKE |
| [x] G5-T05 | Kiểm duplicate/stale/DB failure và direct service call từ staff; thao tác hủy không ghi dữ liệu | Nguồn UC/BR/SC + code G2 và task trước trong phase | tests nhiều tab và rollback employee/account/security/audit | src/features/staff/, src/services/staff-accounts.ts, src/services/auth/, src/db/ (migration identity nếu cần), tests/unit/staff*, tests/e2e/staff* | TC-P5-ACCOUNT-RACE |

Checkbox T01–T05 ghi phần code/test đã thực thi; full visual pixel gate còn mở, không coi toàn phase DONE. File thực tế và bằng chứng tại REPORT_PHASE_5.md.

Rà soát bổ sung trong T01/T02/T04/T05, không tạo task nghiệp vụ mới:

- [x] Control hiện/ẩn mật khẩu SC158 và icon validation/empty state theo CODEX.
- [x] Lỗi đọc chi tiết SC147; lỗi tạo/sửa/xóa, rollback toàn DB và retry qua UI.
- [x] Nền popup thành công SC150/157/162 đúng trạng thái, khóa thao tác lưu lặp sau thành công.
- [x] Capture/đối chiếu thủ công 18/18 SC145–162; ảnh desktop và viewport hẹp, screenshot hai vai trò.
- [x] Hồi quy cuối: 101/101 unit/integration, 52/52 Chromium, lint/typecheck/build và 5/5 static audit PASS.
- [ ] Nghiệm thu review/visual baseline theo gate đã thống nhất trước khi ghi toàn phase DONE; không tính pixel NOT RUN là PASS.

## 9 Thứ tự và dependency

G3 auth/session/permission, primitives và quyết định identity P08. Làm T01 → T02 → ... theo thứ tự bảng, mỗi task có test trước khi tích hợp. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_8.1, UC_8.2, UC_8.3, UC_8.4; BR liên quan và mọi control test thuộc SC145, SC146, SC147, SC148, SC149, SC150, SC151, SC152, SC153, SC154, SC155, SC156, SC157, SC158, SC159, SC160, SC161, SC162. Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

Phone/login trùng; rename đụng login; xóa account có giao dịch; tab đang đăng nhập khi bị xóa; form hủy; không vô tình tạo owner thứ hai. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

4 UC qua cả hai vai trò; không lộ credential material qua UI/DTO; vô hiệu hóa ngăn login và mọi session cũ; rename không mất liên kết; rollback khi lỗi và snapshot UI đều có bằng chứng. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

Username là PK/FK nên rename bằng một transaction duy nhất, giữ MaNV + alias định danh lịch sử và cập nhật FK, revoke session. P08 đã hiện thực theo scope G5 được yêu cầu, xem IDENTITY_CONTRACT.md; không thay schema G2/G3. Kiểm FK/CAS và rollback cả alias/session, không chỉnh screenshot baseline để che sai lệch. Các vấn đề khác giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_5.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Tạo nhánh làm việc riêng sau khi được phép code (ví dụ coco/phase-5); ghi commit theo task sau test; không force/reset/ghi đè thay đổi khác. Chỉ push/merge/deploy khi có cho phép. Workflow main hiện có vẫn install/lint/typecheck/unit/audit/build/Chromium trước deploy. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
