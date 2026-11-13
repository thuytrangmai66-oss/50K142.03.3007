# Kế hoạch kiểm thử tổng thể CoCo

> Kết quả mới nhất sau rà soát G5 11/11/2026: **101/101 Vitest + 52/52 Chromium**, lint/typecheck/build và 5/5 audit PASS. Bổ sung đối chiếu thủ công 18 trạng thái nhân viên và kiểm lỗi/rollback/retry tại [REVIEW_COMPLETION.md](phase5/REVIEW_COMPLETION.md). Các mốc số test bên dưới giữ làm lịch sử; full pixel baseline và luồng G6 vẫn NOT RUN.

> G5: 88/88 Vitest + 29/29 Chromium PASS, giữ nền G2–G4; sáu case mới dùng UI tạo staff, hai tab/rename/revoke/stale/storage error và desktop landing. Không thêm mobile design theo chỉ đạo mới; những viewport cũ vẫn chạy regression. [Báo cáo G5](phase5/REPORT_PHASE_5.md), full pixel/CI/Pages/G6 approval chưa chạy.

> Cập nhật G4: thêm responsive sáu viewport, hai role reference-data, live customer two-tab, stale form, danh mục độ mới và legacy preservation. Kết quả hiện tại tại [báo cáo G4](phase4/REPORT_PHASE_4.md). [A–F demo G6](phase6/DEMO_ACCEPTANCE.md) bắt buộc dùng UI thật: test C/nền session và shared customer data đã có evidence, request/approval A/B/D/E chưa triển khai nên NOT RUN. Regression phải giữ G2/G3/G4; không dùng hai browser context riêng để giả chia sẻ dữ liệu.

Ngày 11/11/2026. Kế hoạch kiểm thử tổng thể tiếp tục áp dụng. Baseline trước coding ở BASELINE_AUDIT.md; sau chỉ đạo tiếp tục, **G3 có 49/49 Vitest + 10/10 Chromium PASS**, không skip, cùng lint/typecheck/build/audit PASS. Truy vết test thật ở [phase3/TEST_EXECUTION.md](phase3/TEST_EXECUTION.md). Visual cuối cùng còn review, pixel comparison NOT RUN; các testcase chưa triển khai không được tính PASS.

## Mục tiêu, cấp test và ranh giới

| Cấp | Nội dung và oracle | Công cụ/tệp dự kiến | Gate |
|---|---|---|---|
| Unit | Validation, money nguyên đồng/overflow, ngày VN, trạng thái, permission, QR TLV/CRC và rule thuần; expected độc lập hàm implementation | Vitest, tests/unit/* | Từng BR/scenario có success/boundary/negative; 0 fail |
| Integration | UI/service/repository, atomic mutation/audit/receipt, FK, unique, CAS, migration, revoke session và snapshots tài chính | Vitest + fake-indexeddb, tests/integration/*; browser cho semantics IDB thật | DB trước/sau abort bằng nhau; retry không lặp; orphan/forged role bị chặn |
| E2E | Nhập/click/modal/confirm/hủy/search/reset/pagination; owner/staff đúng quyền; reload và persistence; luồng liên module | Playwright hiện có, tests/e2e/* | UC main và mọi nhánh ALT/ERR bắt buộc PASS; kiểm persisted data và UI, không chỉ heading |
| Visual | Mọi SC và component source, logo/icon/font/color/spacing/layout ở trạng thái dữ liệu biết trước | Playwright screenshot + so sánh PNG local/raster PDF local | Baseline/threshold được duyệt; không auto cập nhật ảnh để làm xanh |
| Security/permission | Direct route và service, giả role/input, revoked/inactive account, XSS tên/lý do, credential leakage | Vitest/Playwright; không cần công cụ cloud | Staff không vào owner functions; password/hash/salt không lộ DTO/UI/log; fail không ghi DB |
| Regression | Nền G2 cùng các module đã hoàn thành; full suite khi đổi contract/schema/auth | Workflow hiện có và local scripts | Không làm mất sentinel/data, không giảm coverage đã nghiệm thu |
| Production smoke | Base URL thật, assets, route reload, auth/role sau khi có, DB compatible trong profile riêng | Playwright profile riêng + HTTP | Chỉ sau deployment được cho phép; SHA đúng, 0 error/blocker; không dùng dữ liệu người dùng để thử |

Kiến trúc client demo không chống được người chủ động sửa DB/JS bằng DevTools. Permission tests chứng minh đường app/service hoạt động đúng; không tuyên bố mức bảo vệ của backend.

## Danh mục và cách tính

Nguồn testcase chi tiết: [TEST_CASE_CATALOG.md](TEST_CASE_CATALOG.md). Có 175 test luồng/nhánh, 98 test BR, 7 test NFR, 928 test điều khiển, 297 test visual (một cho mỗi SC) và 47 scenario chéo: tổng 1.552 ID kế hoạch duy nhất. Các số đếm là kế hoạch, không phải số test đã viết hoặc chạy.

- Coverage UC nghiệm thu = số UC có đủ main/ALT/ERR/role/data/visual bắt buộc đạt chia 27. Hiện 0/27 UC end-to-end được chứng nhận.
- Coverage BR = số BR có assertion business/service và evidence được review chia 98. PARTIAL_DATA_ONLY không tính là hoàn thành BR.
- Coverage visual = số SC đã có baseline phù hợp, compare được duyệt và kết quả PASS chia 297; hiện NOT RUN, không dùng ảnh nguồn làm PASS.
- Coverage mapping = số ID có liên kết nguồn + phase + testcase chia tổng nguồn. 27 UC/98 BR/7 NFR/297 SC đều có index dự kiến, không suy ra code coverage từ đó.
- Dùng trạng thái NOT RUN / PASS / FAIL / BLOCKED / NOT APPLICABLE có lý do cho kết quả test; trạng thái phase dùng bộ trạng thái master prompt. Skip/NOT RUN không được tính PASS.

## Fixture và dữ liệu thật

Mỗi unit/integration test tạo DB tên test, đóng/xóa đúng DB đó ở teardown; browser context riêng cho mỗi test. Scenario hai tab dùng hai page cùng context/origin để chia sẻ DB, session tab riêng. Không chạy `db.delete()` trên profile browser người dùng hoặc origin production thật đang sử dụng.

Fixture chỉ trong `tests/fixtures`; không import vào production hoặc tạo mặc định. Credential dùng riêng từng test, không push secret thật. Chuỗi số điện thoại giữ số 0 đầu; tên có dấu và HTML là test escaping. Tạo member/nonmember và điểm 0/49/50/51; hàng có ngày nhập/cycle khác nhau; bracket cũ/mới; hóa đơn pending/completed/cancelled; hai món cùng combo khác cost. Không tự dùng fixture để định nghĩa quy tắc chưa được duyệt.

Oracle tiền/kho/điểm phải ghi expected totals độc lập: ví dụ thu mua hai món cost 80k/120k → 200k, bán một món thu 150k → cost 80k và gross 70k khi fixture không dùng ưu đãi; ví dụ điểm/20% chỉ thực hiện sau chốt làm tròn. Timestamp nghiệp vụ ở VN được tạo rõ offset; dùng clock test cho 29/30/44/45 ngày và 23:59/00:00, test clock không trở thành bằng chứng job từng chạy lúc web đóng.

## Hợp đồng visual cần phê duyệt

1. Viewport chuẩn hiện có 1440×900, DPR 1, Chromium/version ghi trong evidence; reference native 1440×923/933 giữ chiều cao tương ứng hoặc full-page capture với transform ghi rõ. Không bóp mọi khung về 900px. Component PDF nhỏ được kiểm riêng theo kích thước nguồn.
2. Nguồn target là export local sạch theo role. Nếu chỉ có frame annotated thì giữ file/hash gốc, lập mask chỉ annotation và ghi lý do; không che các thành phần UI hoặc lỗi validation. PDF phải render ở geometry xác định (1440px chiều ngang cho page 1440pt) và so với PNG khi có Type3 glyph warning.
3. Baseline gồm source checksum, dataset/state, viewport, fonts, browser, thời gian cố định và các phần dynamic. Sample tên/số tiền trong ảnh là fixture visual được kiểm soát, không dữ liệu production. Không snapshot hash/password.
4. Đề xuất ngưỡng để người dùng duyệt: geometry quan trọng sai ≤2 CSS px; màu token/asset/label/nút đúng nguồn; pixel comparison threshold 0,2 và maxDiffPixelRatio 0,01 sau chuẩn hóa, không dùng ratio để bỏ qua asset sai hoặc component thiếu. Nếu font/PDF raster không tương thích thì ghi blocker, không tăng threshold tùy ý. Đây là ngưỡng đề xuất, chưa tự coi được phê duyệt.
5. CI không được chạy `--update-snapshots` để che mismatch. Chỉ đổi baseline sau review có source diff, before/after và phê chuẩn thay đổi chủ đích. Toàn bộ 297 SC có ID test, nhiều SC chạy chung route với fixture/state khác, không cần tạo 297 route.

## Ma trận bắt buộc theo phase

| Phase | Test tăng thêm | Regression tối thiểu |
|---|---|---|
| G3 | Bootstrap/login/logout, permission/session revoke, UI01 và shell role | 27 data + migration/storage/fallback; cập nhật smoke chỉ khi hành vi auth mới được duyệt |
| G4 | 9 UC khách/khung giá, unique/hủy/FK/history/search | G2/G3, lịch sử đối soát lại sau G6/G8 |
| G5 | 4 UC account, role staff enforced, rename identity/inactive/revoke | G2–G4, security DTO và nhiều tab |
| G6 | 3 UC purchase/approval, mixed-price/draft, approve race/finalize rollback | G2–G5 và dữ liệu khách/history/cost |
| G7 | 3 UC inventory/scheduler, 29/30/44/45, catch-up, midnight VN, multi-tab | G2–G6, race sửa/bán và price snapshot |
| G8 | 2 UC sales, 2 payment methods, QR decoder/CRC, points và stock race | G2–G7, liên kết khách/thu mua/cost/scheduler |
| G9 | 5 UC reports, dashboard hai role, boundary/zero/reconciliation | G2–G8 và toàn bộ snapshot tài chính |
| G10 | Toàn bộ 27 UC/98 BR/7 NFR/297 SC, security/touch/performance | Full required suite, 0 blocker |
| G11 | CI gate, asset/base/reload/role/DB compatible trên Pages, rollback dry run | Release SHA tái chạy required suite, smoke độc lập |

## Điều kiện lỗi và kiểm thử phá hủy trong profile test

Inject lỗi ở write cuối/audit để bảo đảm rollback; quota/denied storage; ngắt giữa run rồi mở lại; đồng thời hai kết nối; account revoked giữa form và commit; stale product giá/stock; same command id khác payload; timezone browser khác VN; tràn số; ngày không tồn tại; mẫu số zero; QR back/cancel; hủy form/confirm. Không nuốt lỗi bất đồng bộ để transaction commit một phần.

Mỗi lỗi có case ID, bước tái hiện, dữ liệu đầu vào, expected/actual, screenshot/trace/log không chứa credential, DB snapshot trước/sau. Sửa nguyên nhân rồi chạy affected + regression phù hợp. Không xóa test, bỏ tính năng hoặc thay oracle cho khớp implementation lỗi.

## CI/CD, artifact và bằng chứng

Giữ workflow tại `.github/workflows/deploy.yml`: npm ci/lint/typecheck/test/audit/build/Chromium rồi upload/deploy nếu checks thành công; PR chỉ checks, push main tự deploy như yêu cầu đã có. Lượt lập plan không push/dispatch/deploy. Khi được duyệt tích hợp, ghi run URL, head SHA, Pages URL và kết quả smoke; CI xanh là một bằng chứng, không thay traceability.

Đề xuất khi code mở rộng: lưu Playwright trace/screenshot/report cho failure, manifest source/test IDs và kết quả máy đọc được; thời hạn giữ artifact theo nhu cầu review, không đưa DB/secret thật lên artifact công khai. Chưa sửa workflow ở lượt này.

Benchmark: dataset kích thước và máy/browser cố định, đo p50/p95 tìm kiếm/finalize, số lượt đo/warmup và lỗi. Q21/P11 cần duyệt shortcut/quick price/SLA trước khi đánh dấu NFR tốc độ đạt; không tự lấy ngưỡng đề xuất thành yêu cầu nguồn. WebKit/Firefox và viewport mở rộng nằm trong ma trận sau khi được chốt hỗ trợ, hiện NOT RUN.

Release cần thử dữ liệu nâng cấp và rollback trên bản sao; không coi static rollback là DB downgrade. Tài liệu mất storage/khác origin/không sync là bắt buộc bàn giao; thêm UI backup/restore hoặc offline cold start chỉ khi có scope riêng được duyệt.
