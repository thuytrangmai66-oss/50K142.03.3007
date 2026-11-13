# Kiểm toán baseline CoCo ngày 11 tháng 11 năm 2026

## Phạm vi và Git

Đây là kiểm toán mới cho master plan, không tái sử dụng kết quả PASS lịch sử làm bằng chứng hiện tại. Không code tính năng mới, commit, push, merge hoặc deploy. Các kiểm tra trình duyệt dùng profile/test DB riêng.

- Repository root: `D:\50K142-NEW`; ứng dụng tại `CoCo/`.
- Branch `main`, upstream `origin/main`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`.
- Remote fetch/push: `https://github.com/thuytrangmai66-oss/50K142.03.3007.git`.
- Trước khảo sát: tracked working tree sạch; có `CODEX/` và `CoCo/planning/CODEX_SOURCE_REVIEW.md` untracked do người dùng/lượt rà soát trước. Giữ nguyên tất cả.
- Sau khảo sát: chỉ thêm/cập nhật tài liệu planning. Build/test sinh output trong các thư mục ignored; audit ghi lại JSON cùng nội dung cũ. Không stage hoặc đẩy 552 MiB nguồn tham khảo lên Git.

## Nguồn thực sự đã truy cập

| Nguồn | Xác minh và cách dùng |
|---|---|
| Master prompt đính kèm mới | Đọc đủ `C:\Users\LENOVO\.codex\attachments\95dccd33-1003-40a5-853f-95b8d66e6af2\Pasted text.txt`; đây là yêu cầu lập kế hoạch, không phải roadmap phase cũ đã duyệt |
| SRS gốc/repository | `02. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG/50K142.03.3007.SRS.docx`; hash `2D90ADCA26709BCD4630BBA446BD799061575BACD3E6438F5A195ABAF19F3535`, trùng bản gốc tại D theo đối chiếu trước; đọc toàn bộ XML văn bản và đối chiếu 27 UC, 98 BR, 7 NFR |
| Design gốc | `D:\N3.HK1.PTTKHTTT\BTNHOM\50K142.03.3007.Design.docx`; hash `917FF96B696FD1DE9228560D65D4EA037EDE32297B1699648894DDCA15A1E207`; đọc XML/mô hình/outline, không tuyên bố duyệt trực quan mọi trang Word |
| CODEX metadata | Đọc/parse usecases.json, catalog.json, design-blocks.json, nguồn module và artifact notes; 297 frame link tồn tại |
| Hai bộ export local mới | 370 tệp: 146 owner, 78 staff trực tiếp, 146 owner lồng trong staff; 224 hash khác nhau. Đọc text/geometry 271 PDF một trang và verify 99 PNG; CSV có checksum từng tệp |
| Ảnh/thiết kế local | Đã mở các mẫu frame QA đăng nhập, thu mua; render và xem PDF Thu mua owner, Thu mua staff và Bán hàng 18 owner. Đây là lấy mẫu để khảo sát; chưa chứng nhận visual toàn bộ 297 mục |
| Source hiện tại | Đọc src/app, providers/router/layout/home, domain/records, db/schema/init, repositories/constraints; đọc tests/config/scripts/workflow/package/lock versions và toàn bộ hồ sơ phase hiện có |
| Báo cáo cũ | phase0/ARCHITECTURE_DECISION, OPEN_ISSUES, UI_FOUNDATIONS; phase1/REPORT, BASELINE, REUSE_MAP, CI_CD; phase2/DATA_MAPPING, REPORT; CODEX_SOURCE_REVIEW |

Figma online **NOT ACCESSED theo chỉ đạo mới**, không phải yêu cầu gửi lại thiết kế. Nguồn giao diện lượt này là CODEX. Link Drive workflow trong SRS không được mở trong lượt này; chi tiết không có ở bản nhúng vẫn CHƯA XÁC MINH. Không tìm thấy master/roadmap cũ có phase sau G2 trong checkout, các thư mục dự án đã tra hoặc lịch sử Git. Các file SOURCE_REGISTER.csv, SCREEN_MAP.csv, SCREEN_REQUIREMENTS.csv được hồ sơ cũ nhắc tới chưa có trong checkout; không giả định đã đọc. `.build` MotoCare bị loại khỏi đặc tả CoCo.

## Công nghệ và đường chạy thực tế

React 18 + TypeScript strict + Vite 6 + Tailwind 3; Dexie/IndexedDB `CoCoDB` logical v2/native v20, 20 store. Zod strict validation, HashRouter, font Be Vietnam Pro 400/600 đóng gói cục bộ. Các thư viện date-fns, lucide-react, qrcode, zustand có trong dependencies nhưng việc có thư viện không chứng minh tính năng tương ứng đã hiện thực. Node thực thi 24.22.0/npm 11 theo môi trường; CI dùng Node 24. Không backend, không dịch vụ dữ liệu ngoài.

Version chính xác trong lockfile đã đọc: React 18.3.1, TypeScript 5.9.3, Vite 6.4.5, Tailwind 3.4.19, Dexie 4.4.7, Zod 3.25.76, Vitest 3.2.7, Playwright 1.64.1; npm thực thi 11.19.1. Không đồng nhất giá trị caret trong package.json với version đã khóa.

Checksum metadata CODEX tại thời điểm mapping:

| Tệp trong `.uc-ui-matrix-qa` | SHA-256 |
|---|---|
| usecases.json | F659D099DC70EFC49761ADD21F4C05375A2BF84DA8BFA29D5B87C8B2E09271B7 |
| catalog.json | 2B31E497409685D018686B3E031E32BB1E03567D80959A94353815CD0577EBD9 |
| design-blocks.json | 902D852B5B9C076AD6090D95A1B5AFEB1A9CB3D2CB16FFC619C98F733427B8A4 |

Source chia UI/provider/router, domain schema, DB và generic repository. Hiện chỉ `/` và fallback, không auth/role guard hoặc business service. `AppProviders` mở DB và xử lý lỗi storage; HomePage ghi rõ đang là khung. Không thấy TODO/FIXME/mock/stub trong `src`; sự thiếu chức năng thể hiện ở route và service chưa tồn tại, không được coi là hoàn thành vì không có TODO.

## Chạy lại kiểm tra

| Kiểm tra thực thi mới | Kết quả | Phạm vi và giới hạn |
|---|---|---|
| `npm.cmd run lint` | PASS, exit 0 | Source/test hiện có |
| `npm.cmd run typecheck` | PASS, exit 0 | TS strict, bao gồm tests/config |
| `npm.cmd test` | PASS, 27/27, 2 file | Fake-indexeddb foundation; không phải 27 UC |
| `npm.cmd run build` | PASS, 43 modules | Build frontend thành công, base `/50K142.03.3007/` |
| `node scripts/audit-phase1.mjs` | PASS, 5/5 | Tĩnh: không tích hợp cũ, không HTTP runtime trong src; không phải chứng nhận nghiệp vụ |
| `CI=true npm.cmd run test:e2e -- --reporter=line --global-timeout=90000` | PASS, 3/3, 5,3 giây | Chromium ngoài sandbox, profile riêng: shell/fallback/reload/metadata, storage denied, migration v1→v2 giữ sentinel và không seed |
| GitHub API chỉ đọc | PASS | Latest run `42854792570` gắn đúng HEAD, conclusion success; Pages build_type workflow, Actions enabled; không trigger run mới |
| Pages HTTP/Chromium đọc | PASS | HTTP 200, Trang chủ/reload/fallback, native DB v20/20 store trong profile riêng, không page error/response lỗi |
| E2E 27 UC / auth / permission / business visual | NOT RUN | Chưa có implementation, không được thay bằng smoke shell |
| Full visual 297 SC | NOT RUN | Chưa có màn nghiệp vụ khớp thiết kế; ảnh tham khảo không phải test đã chạy |
| Multi-browser/WebKit/Firefox, benchmark NFR, thao tác cảm ứng đầy đủ | NOT RUN | Suite hiện chỉ Chromium; chưa có chuẩn dataset/SLA/viewport mở rộng được duyệt |

CI đã quan sát: [run 42854792570](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/runs/42854792570). Pages đã đọc: https://thuytrangmai66-oss.github.io/50K142.03.3007/. Đây là trạng thái release đang có, không có deployment mới trong lượt lập kế hoạch.

## Đã hoàn thành thật và phần còn là nền

**Đã tái kiểm:** schema/unique/composite key, appMetadata migration v1→v2, runtime shape validation, FK cuối transaction, rollback gồm audit/receipt, CAS version, tombstone và dấu mã đã cấp, idempotency theo command fingerprint giữa hai kết nối. Các test có tình huống lỗi và race, không chỉ schema mirror. Danh sách assertion ở `tests/unit/repositories.test.ts` và `database.test.ts`.

**Mới là khả năng lưu trữ:** accountSecurity chưa có tạo/xác thực hash; memberships chưa có sự kiện đăng ký; productCosts chưa có luồng thu mua hoàn tất; discountApplications chưa có scheduler; notifications chưa có phát/đọc nghiệp vụ. Các test input cho các store này là fixture riêng.

**Chưa triển khai:** 27 UC end-to-end, auth/session/permission ở service, bootstrap chủ, UI hai vai trò, khách hàng/khung giá/account CRUD, draft và phê duyệt, thu mua, scheduler, bán hàng/QR/điểm, dashboard và 5 báo cáo. Không có seed production giả hoặc tài khoản admin hardcode. HomePage chưa phải dashboard UI02.

## Rủi ro kỹ thuật đã đối chiếu code

1. TINYINT hiện chấp nhận 0–255 mà chưa encode nhãn trạng thái/phương thức. Phải có contract ở module/service, không suy ra trạng thái từ số fixture 0.
2. `commit.actor` chỉ kiểm tài khoản tồn tại, không xác thực quyền. Generic repository chưa nối UI nên baseline không có đường ghi public; khi nối phải có service guard và kiểm lại active/role/version trong transaction nhạy cảm.
3. FK yêu cầu phê duyệt → invoice và product → composite detail cần phương án draft thực tế trước G6; không dựng completed invoice giả để có FK.
4. Dòng mua khóa invoice+bracket có một DonGia, còn SRS có thể có từng món cùng bracket khác giá. Cost snapshot không tự giải hết biểu diễn dòng; P04 cần quyết định trước finalize.
5. Thời điểm paidAt/finalizedAt, snapshot tiền/điểm, reason quyết định phê duyệt và scheduler run error chưa có đầy đủ store. Chỉ thêm migration có scope và test, không viết lại G2.
6. Username là PK/FK, đổi username theo UC8.2 cần identity/rename contract; xử lý xóa account nên giữ lịch sử và revoke session thay vì xóa nhân viên có hóa đơn.
7. Kiểm FK đang quét trạng thái các store trong transaction, mọi write dùng cùng scope: đúng tính nguyên tử cho demo nhưng có thể chậm khi dữ liệu lớn; cần đo trước tối ưu, không tự đặt SLA.
8. Audit hiện ghi ref/actor/time của command, chưa đủ snapshot nghiệp vụ cho mọi báo cáo/đối soát; bổ sung evidence theo module, không lộ password material.
9. Export staff chứa owner lồng; menu một số ảnh staff còn quyền quản trị. Quyền lấy từ SRS, việc folder tồn tại không cấp quyền.
10. Poppler trả cảnh báo `Bad bounding box in Type 3 glyph` khi render mẫu PDF; mẫu staff có dòng chữ ghép/giãn khác. Đối chiếu PNG QA sạch và bản nguồn local, không sao chép lỗi renderer vào UI hoặc tự duyệt baseline lỗi.
11. Static rollback về build DB v2 sau migration v3 có thể không mở được DB; thử rollback/roll-forward trên bản sao, không reset storage người dùng.

Mức sẵn sàng: nền dữ liệu và CI còn PASS, đủ đầu vào lập master plan. Phát triển G3–G11 cần duyệt thứ tự đề xuất và các quyết định chặn đúng module; các điểm này không phủ nhận hoặc yêu cầu làm lại nền G1/G2.
