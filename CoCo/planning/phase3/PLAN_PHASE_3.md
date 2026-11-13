# Kế hoạch Giai đoạn 3 Nền xác thực, hợp đồng trạng thái và UI dùng chung

Ngày 11/11/2026. **READY FOR REVIEW**. Người dùng yêu cầu “tiếp tục” sau kế hoạch/P01/P02; đã triển khai các task G3 trong working tree. 49 Vitest + 10 Chromium, lint/typecheck/build/audit PASS; visual pixel và nghiệm thu còn review. Xem [REPORT_PHASE_3.md](REPORT_PHASE_3.md), [AUTH_CONTRACTS.md](AUTH_CONTRACTS.md) và [ASSET_MANIFEST.md](ASSET_MANIFEST.md). Không commit/push/merge/deploy trong lượt này.

## 1 Mục tiêu

Đăng nhập local thật, phiên và quyền tại service; UI đăng nhập/shell dùng đúng hai bộ local. Không tạo KPI hoặc module giả.

## 2 Nguồn và yêu cầu

UC_0. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

SC001, SC002, SC003, SC004, SC005, SC006, SC192, SC193, SC194, SC195, SC196, SC197; SC007/SC198 (shell, KPI để G9)

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

Đăng nhập local thật, phiên và quyền tại service; UI đăng nhập/shell dùng đúng hai bộ local. Không tạo KPI hoặc module giả. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

| Nhóm | Component dự kiến |
|---|---|
| UI01 / Đăng nhập | LoginForm |
| UI02 / Trang chủ | RoleShell/Dashboard |

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

taiKhoan, nhanVien, accountSecurity, recordVersions; thêm authSessions qua migration v3 additive, giữ nguyên v1/v2. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

src/features/auth/, src/services/auth/, src/services/permissions.ts, src/components/ui/, src/components/layout/, src/app/, src/db/schema.ts (chỉ nếu thêm store), tests/unit/auth*, tests/e2e/auth*. Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [ ] G3-T01 | Kiểm tra asset/token local và lập inventory có checksum; tách logo/icon thành asset cục bộ, giữ bản gốc và bỏ chú thích đỏ khỏi UI | Nguồn UC/BR/SC + code G2 và task trước trong phase | LoginForm, RoleShell, Button/Input/Dialog/Alert/TableState; không dựng ảnh nguyên trang | src/features/auth/, src/services/auth/, src/services/permissions.ts, src/components/ui/, src/components/layout/, src/app/, src/db/schema.ts (chỉ nếu thêm store), tests/unit/auth*, tests/e2e/auth* | TC-SC001-VISUAL; mọi SC thuộc UI01 |
| [x] G3-T02 | Thiết kế contract mã trạng thái, mã nội bộ và service boundary theo đúng nguồn; trạng thái chưa rõ giữ issue, không gán TINYINT tùy ý | Nguồn UC/BR/SC + code G2 và task trước trong phase | contracts và bảng ánh xạ; bổ sung migration có test nếu cần | src/features/auth/, src/services/auth/, src/services/permissions.ts, src/components/ui/, src/components/layout/, src/app/, src/db/schema.ts (chỉ nếu thêm store), tests/unit/auth*, tests/e2e/auth* | TC-P3-CONTRACT |
| [x] G3-T03 | Hiện thực bootstrap một lần theo phương án P01 được duyệt; hai tab tranh chấp chỉ tạo một chủ; không hardcode credential/seed | Nguồn UC/BR/SC + code G2 và task trước trong phase | khởi tạo NhanVien/TaiKhoan/security nguyên tử; giao diện setup chỉ khi được cho phép | src/features/auth/, src/services/auth/, src/services/permissions.ts, src/components/ui/, src/components/layout/, src/app/, src/db/schema.ts (chỉ nếu thêm store), tests/unit/auth*, tests/e2e/auth* | TC-P3-BOOTSTRAP-RACE |
| [x] G3-T04 | PBKDF2-SHA-256/salt ngẫu nhiên theo metadata G2, xác minh credential ngoài transaction; chống submit lặp và phân biệt lỗi storage với sai mật khẩu | Nguồn UC/BR/SC + code G2 và task trước trong phase | AuthService login/logout; không log hoặc render hash/salt/password | src/features/auth/, src/services/auth/, src/services/permissions.ts, src/components/ui/, src/components/layout/, src/app/, src/db/schema.ts (chỉ nếu thêm store), tests/unit/auth*, tests/e2e/auth* | TC-UC0-MAIN; TC-BR-UC0-01 |
| [x] G3-T05 | Phiên lưu capability ngẫu nhiên, không tin role/username do UI truyền; đọc active/role/version hiện tại ở service trong transaction thao tác nhạy cảm | Nguồn UC/BR/SC + code G2 và task trước trong phase | session và permission guard; thu hồi khi logout/vô hiệu hóa; migration giữ G2 | src/features/auth/, src/services/auth/, src/services/permissions.ts, src/components/ui/, src/components/layout/, src/app/, src/db/schema.ts (chỉ nếu thêm store), tests/unit/auth*, tests/e2e/auth* | TC-P3-PERMISSION; TC-P3-SESSION-REVOKE |
| [x] G3-T06 | Ghép login và shell theo vai trò; route chưa làm không có nút giả; xử lý loading/lỗi/route lạ, thông báo đúng nguồn | Nguồn UC/BR/SC + code G2 và task trước trong phase | router guard + menu dựa quyền; Trang chủ chưa có KPI chỉ là shell chờ G9 | src/features/auth/, src/services/auth/, src/services/permissions.ts, src/components/ui/, src/components/layout/, src/app/, src/db/schema.ts (chỉ nếu thêm store), tests/unit/auth*, tests/e2e/auth* | TC-UC0-ERR-01; TC-P3-DIRECT-ROUTE |

T02–T06 đã hoàn tất code và kiểm thử kỹ thuật; T01 asset/token/component đã làm, checkbox còn mở cho nghiệm thu visual. Không dùng checklist code để tự coi phase DONE. Kết quả từng gate và giới hạn tại REPORT_PHASE_3.md.

## 9 Thứ tự và dependency

Nền G0–G2 hiện có; duyệt master plan và P01 (bootstrap chủ). Làm T01 → T02 → ... theo thứ tự bảng, mỗi task có test trước khi tích hợp. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_0; BR liên quan và mọi control test thuộc SC001, SC002, SC003, SC004, SC005, SC006, SC192, SC193, SC194, SC195, SC196, SC197; SC007/SC198 (shell, KPI để G9). Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

Sai/rỗng credential; DB bị từ chối; reload; logout rồi Back; session bị sửa; tài khoản inactive/đổi quyền ở tab khác; hai bootstrap cùng lúc; lỗi ghi audit. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

Hai vai trò login/logout thật; mọi gọi service trái quyền và route trực tiếp bị chặn; không plaintext credential trong DB/storage/log; bootstrap race một chủ; ảnh UI01 được duyệt theo TEST_MASTER_PLAN; 27 test dữ liệu và 3 smoke cũ tiếp tục đạt hoặc thay assertion shell bằng flow auth tương đương có giải trình. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

Bootstrap chưa có màn trong nguồn: P01 đã được cho phép, form kỹ thuật đang chờ review hình thức. Storage client không chống được người cố ý sửa DevTools; giữ giới hạn demo AD03. Giảm thiểu: đọc đúng role/source, làm migration additive với sentinel, test lỗi giữa transaction, không chỉnh screenshot baseline để che sai lệch. Các vấn đề chưa chốt giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_3.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Tạo nhánh làm việc riêng sau khi được phép code (ví dụ coco/phase-3); ghi commit theo task sau test; không force/reset/ghi đè thay đổi khác. Chỉ push/merge/deploy khi có cho phép. Workflow main hiện có vẫn install/lint/typecheck/unit/audit/build/Chromium trước deploy. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
