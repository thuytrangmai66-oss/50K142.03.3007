# Báo cáo Giai đoạn 3 — xác thực và UI dùng chung

> Snapshot G3 dưới đây là lịch sử bàn giao. Theo chỉ đạo tiếp theo ngày 11/11/2026, đã sửa responsive và thực hiện G4; xem [REPORT_PHASE_4.md](../phase4/REPORT_PHASE_4.md). Auth/DB vẫn local, không Supabase. Không diễn giải câu “chưa chuyển G4” trong snapshot thành trạng thái hiện tại.

Ngày 11/11/2026. **READY FOR REVIEW**: code chức năng G3 và kiểm thử kỹ thuật đạt; chưa nghiệm thu visual cuối cùng, chưa tự chuyển G4. Người dùng yêu cầu “tiếp tục” sau bộ kế hoạch/P01/P02; ghi nhận cho phép triển khai roadmap và bootstrap một lần. P03–P11 vẫn cần quyết định theo phạm vi tương ứng, không được coi là đã duyệt cả bảng issue.

## Kết quả đã triển khai

- Thiết lập chủ lần đầu bằng thông tin tự nhập; không seed admin/password. Marker và ba bản ghi cùng version/receipt/audit được commit nguyên tử, chống tranh chấp hai tab.
- AuthService PBKDF2-SHA-256 + salt ngẫu nhiên, login/logout thật, cùng lỗi cho unknown/wrong/inactive, session capability không tin role/actor do UI truyền. Guard đọc active/role/version trong cùng transaction thao tác, kiểm lại cả retry idempotent.
- Migration additive CoCoDB v2 → v3, chỉ thêm `authSessions`, giữ nguyên 20 store G2. Token tab tại `coco:session`, DB chỉ lưu tokenHash. Không reset storage hoặc sửa dữ liệu người dùng.
- Login UI01 có rỗng/đã nhập/sai/thiếu/lỗi hệ thống/thành công, popup đóng được, loading/chống submit lặp, lỗi storage có hướng phục hồi. Logo/font local, không request dịch vụ ngoài.
- Router bảo vệ, shell chủ/nhân viên lấy tên thật từ phiên, Home/Logout, route sai và route trái quyền. Staff CRUD G5, dashboard G9 và các module business tiếp tục theo roadmap; không có nút/KPI giả.

Chi tiết service/quyền/mapping: [AUTH_CONTRACTS.md](AUTH_CONTRACTS.md). Nguồn/token/crop/logo: [ASSET_MANIFEST.md](ASSET_MANIFEST.md).

## Task và gate

| Task | Kết quả |
|---|---|
| G3-T01 asset/token/UI chung | Đã code + geometry + đối chiếu local; pixel baseline/user visual review còn mở |
| G3-T02 contract/quyền | Đạt trong phạm vi auth; không tự đặt số trạng thái nghiệp vụ chưa rõ |
| G3-T03 bootstrap | Đạt atomic/race/rollback; P01 được cho phép qua yêu cầu tiếp tục |
| G3-T04 credential/login/logout | Đạt unit/integration/E2E; hash/salt không xuất DTO/UI |
| G3-T05 session/guard/migration | Đạt active/role/version/revoke/replay/forged actor và migration v1/v2 |
| G3-T06 router/shell | Đạt hai vai trò, reload/logout/Back, 403/404 và lỗi startup |

Không ghi DONE: nghiệm thu visual theo hợp đồng P11 chưa được chốt; các ảnh bằng chứng không thay thế việc review. Không có lỗi kỹ thuật đang thất bại trong suite đã chạy.

## Kiểm thử đã thực thi

Node v24.22.0, npm 11.19.1, Vitest 3.2.7, Playwright 1.64.1, Chromium project, Windows; viewport 1440×900 DPR 1, production preview đúng base `/50K142.03.3007/`. Mỗi case dùng DB/profile test riêng; không dùng profile dữ liệu thật.

Browser bundle revision 1248 / Chromium 156.0.8078.4 theo metadata Playwright. Kiểm tra tài liệu hiện tại: 23 Markdown, 0 link thiếu; AD/Q, workflow, dependency/lockfile/base giữ nguyên; HEAD chưa đổi, 0 file staged, diff-check PASS. Manifest ghi hash 41 file code/test/config và 14 ảnh (12 login + bootstrap + shell).

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | PASS, exit 0; build cũng chạy lại tsc |
| `npm run lint` | PASS, exit 0 |
| `npm test -- --reporter=verbose` | **49/49 PASS**, exit 0; 27 test G2 giữ lại + 22 auth/migration/permission mới |
| `node scripts/audit-phase1.mjs` | **5/5 PASS**, exit 0; output G3 ở AUDIT_RESULTS.json, không ghi đè evidence G1 |
| `npm run build` | PASS, exit 0; JS ~360 kB, logo/font đóng gói local |
| `CI=true npm run test:e2e -- --reporter=line --global-timeout=120000` | **10/10 PASS**, exit 0, không skip/retry thất bại; 3 smoke cũ + 7 auth/browser mới |
| Pixel diff theo baseline source đã duyệt | **NOT RUN**, không tính vào PASS |
| CI/Pages cho thay đổi G3 | **NOT RUN**, chưa commit/push/deploy |

Unit bao gồm oracle PBKDF2 độc lập bằng Node crypto; bootstrap tranh chấp hai kết nối; fail audit rollback bootstrap/login/logout; profile/credential không hợp lệ; tokenHash không đăng nhập được; role/version/inactive revoke; forged actor; guard trước receipt; read permission không được ghi; deactivate khi KDF đang chạy.

E2E bao gồm sáu trạng thái login cho mỗi vai trò, geometry khung/input/nút, popup đóng, reload, logout rồi Back; hai phiên chung DB; staff vào reports bị chặn; inactive ở tab khác; forged session JSON; sessionStorage ghi lỗi thu hồi phiên; bootstrap hai tab; IDB denied; fallback/local requests; v1 sentinel và **DB v2 có owner/customer/điểm thật từ fixture cũ được giữ và login được sau migration**.

Smoke cũ đổi precondition từ mở thẳng Home sang setup/login vì G3 đã có auth; vẫn giữ assertion metadata/reload/fallback/no-external. Migration browser v1 đổi expected version 20 → 30 và landing setup khi không account; không bỏ assertion sentinel/account=0. Fixture schema v2 đóng băng tại `tests/fixtures/phase2-schema.ts`, không lấy schema mới để tự so với chính nó.

## Bằng chứng UI và truy vết

SC001–SC006 / SC192–SC197: đã hiện thực và capture 12 ảnh. Geometry assertion PASS và thông báo/hành vi PASS; pixel comparison chưa chạy. SC007/SC198 chỉ shell, phần KPI/navigation module để đúng phase. Asset, source hash, ảnh kiểm tra và code snapshot có manifest riêng; folder `test-results/` bị ignore nên ảnh có thể được tạo lại bằng E2E, không tự đưa vào Git.

UC_0 main + 3 nhánh ERR có assertion thực thi. BR-UC0-01/02 có evidence chức năng/quyền. Chưa gọi UC_0 nghiệm thu toàn bộ khi visual còn review; 26 UC khác NOT STARTED ở cấp business/UI. 1.552 ID trong catalog là kế hoạch, không phải 1.552 test đã chạy. Xem [TEST_EXECUTION.md](TEST_EXECUTION.md).

## Git, CI/CD và dữ liệu

Base HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`; nhánh local **`coco/phase-3-auth`**, remote origin giữ `https://github.com/thuytrangmai66-oss/50K142.03.3007.git`. Các thay đổi source/test/plan hiện chưa commit. Giữ CODEX và tài liệu đang có, không stage hoặc đưa dữ liệu tham chiếu vào repository ngoài ý muốn.

Giữ workflow root đã hoạt động: install/lint/typecheck/unit/audit/build/Chromium trước deploy, push main tự cập nhật Pages. Không sửa cấu hình Git/Actions/Pages/dependencies/lockfile trong G3; script audit chỉ được điều chỉnh cho asset nhị phân và token session mới. CI/Pages trước đó ở BASELINE_AUDIT là evidence của HEAD cũ, không phải evidence G3.

Không push/merge/deploy theo giới hạn tích hợp của master plan; cần chỉ đạo tích hợp riêng trước khi website công khai nhận thay đổi này. Không chạy lại phần nghiệp vụ G0–G2; chỉ migration tăng thêm và regression cần thiết.

## Giới hạn và bước tiếp theo

1. Review login/shell và bootstrap kỹ thuật; P11 còn thiếu ngưỡng/baseline visual được duyệt. Font/token dùng local và hồ sơ nền; icon Lucide không được claim giống pixel từng glyph nguồn.
2. Staff dùng credential đã lưu trong DB; app chưa có UI tạo staff trước G5. Test fixture không được chuyển thành seed production.
3. Phân quyền client là kiểm soát demo, không chống sửa DevTools. Generic auth/repository helper phải được nối qua fixed business services ở phase sau; chưa có rule hoàn chỉnh của module chưa làm. Chưa có timeout tự khóa, password recovery hoặc dọn orphan session tự động theo SRS.
4. Sau review G3, tiếp theo **G4 khách hàng và khung giá**; giữ nguyên thứ tự. P03–P11 tiếp tục được chốt trước task phụ thuộc, không tự áp phương án nghiệp vụ chưa duyệt.

Rollback: schema v3 không tự downgrade về v2. Không reset/xóa DB để chạy code cũ; thử trên bản sao và ưu tiên roll-forward tương thích. Các giới hạn per-origin/mất storage/không đồng bộ AD03 vẫn giữ nguyên.
