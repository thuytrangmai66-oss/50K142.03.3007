# Báo cáo Giai đoạn 4 — khách hàng và khung giá

> Snapshot G4 lịch sử. Theo chỉ đạo tiếp theo đã có G5 quản lý nhân viên qua UI và cải thiện mở chi tiết trên desktop; [REPORT_PHASE_5.md](../phase5/REPORT_PHASE_5.md). Những câu chờ UI staff G5 bên dưới không còn mô tả bản local mới nhất.

Ngày 11/11/2026. **READY FOR REVIEW**. Triển khai theo chỉ đạo tiếp tục G4, đồng thời sửa lỗi kích thước G3. Không push main, commit, merge hoặc deploy; không xóa dữ liệu người dùng. Giữ thứ tự G4 → G5 → G6.

## Quyết định và nguồn đã kiểm tra

- Quyết định mới nhất của người dùng: **không Supabase**, không backend, không sync đa máy; IndexedDB chung theo origin, phiên riêng theo tab. SDK Supabase vừa thử cài theo yêu cầu trước đã được gỡ sau khi có quyết định chốt; package.json/lockfile không có thay đổi nội dung so với HEAD, không có cloud adapter hoặc request cloud.
- Kiến trúc thực tế: `CoCoDB` Dexie v3/native IDB 30, 21 store; 10 entity và các metadata G2/G3. Dữ liệu nghiệp vụ không nằm trong localStorage. sessionStorage chỉ giữ capability `coco:session` của từng tab, không role/password. Không viết lại DB/schema/auth.
- Đã đối chiếu UC4.1–4.6/UC5.1–5.3, BR-UC4/5 trong SRS gốc, Design gốc tại ổ D, JSON và ảnh CODEX local. Không thấy bảng mã độ mới khác trong các phần liên quan: Design quy định TINYINT, UI dùng Mới/Tốt/Khá. Không có căn cứ trong các yêu cầu đã đối chiếu bắt buộc Supabase/backend thương mại; mô hình DB logic/vật lý không đồng nghĩa bắt buộc cloud.
- Người dùng chốt **3=Mới, 2=Tốt, 1=Khá**, dropdown và mapping dùng chung tại `src/domain/conditions.ts`. Source SRS/Design không bị sửa.

## Task đã làm

| Task | Kết quả |
|---|---|
| Sửa kích thước | Bỏ min-width 1440px/min-height canvas bắt buộc ở login; compact font/input/sidebar theo viewport, setup theo nội dung; dialog không vượt viewport; giữ geometry tham chiếu ở 1440×900 |
| G4-T01 khách hàng | Danh sách/tìm theo phone giữ 0 đầu, phân trang 10 dòng, tạo/sửa có validation và unique trong transaction; không tự đăng ký membership hoặc cho UI sửa điểm |
| G4-T02 xóa | Confirm/Hủy; chặn khách đã có hóa đơn ngay trong transaction; giữ snapshot version khi confirm; metadata đăng ký chỉ xóa cùng hồ sơ khi không có hóa đơn, không cascade lịch sử giao dịch |
| G4-T03 lịch sử | Hai danh sách theo MaKH và hai viewer read-only; mua của khách = bán hàng CoCo, bán của khách = thu mua CoCo; chặn xem hóa đơn thuộc khách khác, đọc số tiền/đơn giá đã lưu |
| G4-T04 khung giá | Chủ xem/tạo/sửa; dropdown Mới/Tốt/Khá lưu số; trường bắt buộc, tiền nguyên dương/Min≤Max và unique tổ hợp; staff bị chặn cả menu/route/service |
| G4-T05 query | Tìm phone/prefix, xóa tìm kiếm, pagination/clamp trang; lọc độ mới và Tất cả; sửa bracket không hồi tố invoice/productCosts |
| G4-T06 regression | Unit/integration, hai role UI, XSS escaping, cancel/error/retry, hai tab tự cập nhật không F5, stale edit không ghi đè, legacy condition và viewport; đối chiếu trực quan ảnh local ở phạm vi đã mở |

UI/components: Button/Field/ResultDialog G3 được reuse; bổ sung FormDialog, DataTable/Pagination, record cards và reference pages. Menu chỉ thêm Khách hàng cho hai vai trò và Khung giá cho chủ; không dựng nút Thu mua/Phê duyệt chưa có.

## Dữ liệu độ mới cũ và khả năng tương thích

G2 giữ miền TINYINT 0–255 ở repository để đọc dữ liệu cũ; fixture G2 có mã 90 chưa được gán ý nghĩa. Không đổi `90` thành `2`, không suy ra mọi record cũ mang số 2 vốn đã nghĩa là Tốt. Không thêm migration hoặc tự ghi lại record cũ.

Khung giá do G4 tạo được ghi `appMetadata[condition-catalog:<MaKhungGia>] = coco:conditions:2026-11-11` cùng transaction với record/version/audit/receipt. Đọc chỉ dịch Mới/Tốt/Khá khi có marker này; record chưa đối chiếu hiện đúng mã cũ kèm trạng thái cần đối chiếu. Trước create/update, service kiểm toàn bộ record cũ ngay trong transaction và dừng ghi nếu còn mã chưa xác nhận. Marker cũng rollback nếu audit lỗi.

Đã thực thi test cho cả legacy `90` lẫn legacy `2`, bảo toàn nguyên bản và không tự gán nhãn. **Chưa quét trực tiếp DB trong profile Chrome cá nhân của người dùng**; không được gọi fixture test là kiểm kê dữ liệu thật. Guard kiểm trên DB/origin thực khi app đọc/ghi, nên nếu phát hiện dữ liệu cũ sẽ yêu cầu xác nhận trước thay đổi. Không có công cụ chuyển đổi dữ liệu cũ tự động trong G4.

## Kiểm thử đã thực thi

| Kiểm tra | Kết quả |
|---|---|
| Vitest | **68/68 PASS**, 4 file: giữ 49 data/auth G2/G3 + 19 case G4; không skip |
| Chromium/Playwright | **23/23 PASS**, giữ 10 case G3 + 13 case G4/responsive; không skip |
| Lint / typecheck / production build | PASS, exit 0 |
| Static audit | **5/5 PASS**, không Supabase/legacy/external endpoint; kết quả riêng ở `AUDIT_RESULTS.json` G4 |
| Dependency security | Gỡ SDK xong npm báo 0 vulnerabilities; không thay dependency/lockfile nội dung |
| Responsive | PASS ở 1366×650, 1280×720, 1024×768, 768×1024, 390×844, 320×640; không body tràn ngang, nút setup/login trong viewport; không dùng browser zoom |
| Geometry login desktop G3 | PASS assertion cũ tại 1440×900 vẫn giữ |
| So sánh pixel cho toàn bộ SC | NOT RUN; chưa có baseline/mask được nghiệm thu |
| G6 demo phê duyệt/từ chối A/B/E | **NOT RUN**, module G6 chưa triển khai |
| CI/Pages của working tree này | NOT RUN, không push/deploy |

Lệnh: `npm run lint`, `npm run typecheck`, `npm test -- --reporter=dot`, `node scripts/audit-phase1.mjs`, `npm run build`, `CI=true npm run test:e2e -- --reporter=line --global-timeout=180000`. Các fixture staff/invoice chỉ thuộc test; E2E thao tác UI thật của module đang kiểm tra, không lấy gọi hàm DB trực tiếp thay test demo thu mua/phê duyệt tương lai.

Test G4 kiểm tạo/sửa/xóa/tìm khách cả hai role; empty/not-found, validation/duplicate phone, cancel, reload, escaped tên HTML; list/detail/history/readonly invoice; không xóa khách có giao dịch; tạo/sửa/filter bracket và role denial; DB write lỗi giữ form và retry; phone race/version stale; audit rollback marker; legacy codes; hai session/two-tab live update; snapshot cost không đổi khi bracket sửa.

## Bằng chứng và source

- [Manifest](EVIDENCE_MANIFEST.json): hash file G4 so với snapshot G3, ảnh và lệnh/kết quả; phân biệt HEAD nền với code chưa commit.
- [Chủ — khách hàng](evidence/owner-customer.png), [nhân viên — khách hàng](evidence/staff-customer.png), [login laptop](evidence/login-laptop.png), [mobile](evidence/customer-mobile.png), [khung giá chủ](evidence/owner-bracket.png).
- Mã mới: `src/domain/conditions.ts`, `formatters.ts`, `services/reference-data/{contracts,local}.ts`, `features/reference-data/use-resource.ts`, `features/customers/*`, `features/price-brackets/*`, `components/ui/{FormDialog,DataTable}.tsx`.
- Mã sửa: `src/index.css`, `features/auth/{AuthProvider,context}`, `services/auth/service.ts` (callback DB-only trong transaction), `app/router.tsx`, `components/layout/CoCoLayout.tsx`, `scripts/audit-phase1.mjs` (evidence G4). Test mới: `reference-data.test.ts`, `reference-data.spec.ts`.

Nhánh local `coco/phase-4-reference`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`; thay đổi G3 trước đó vẫn được giữ. Không stage/commit/push/merge/deploy hoặc đổi Git/Pages/workflow.

## Demo hai tab và giới hạn còn lại

Đã PASS session độc lập và shared/live customer data qua hai tab trong Chromium; metadata/version và guard cùng transaction chống ghi đè. Dexie liveQuery là cơ chế tương đương BroadcastChannel để quan sát thay đổi DB giữa các tab dùng Dexie; không cần thêm backend hoặc hai DB theo role.

Các test A/B/E và phần request của D được đưa vào [G6 DEMO_ACCEPTANCE](../phase6/DEMO_ACCEPTANCE.md). Không báo demo thu mua/phê duyệt chạy được lúc G4. Staff provisioning UI thuộc G5; không thêm account/mật khẩu demo mặc định. Hướng dẫn local/G4 và kịch bản giảng viên: [DEMO_GUIDE.md](DEMO_GUIDE.md).

Viewer lịch sử giữ raw code status/PTTT; khi chưa có contract G6/G8 thì hiển thị Chưa xác định, không suy đoán 0 là Hoàn tất/Tiền mặt. Snapshot paidAt/finalized totals/điểm lịch sử vẫn theo P03/P05/G6/G8; chưa chứng nhận toàn bộ UC/SC có host nghiệp vụ tương lai. Một số lỗi truy xuất đang có alert/Thử lại thay vì tất cả popup variant; pixel regression và review toàn bộ SC còn mở. Không tính component/fixture PASS thành toàn journey đã nghiệm thu.

G4 bàn giao **READY FOR REVIEW**, chưa tự DONE hoặc nhảy G6. Không tuyên bố phân quyền client có mức bảo mật backend. Không reset storage; giữ cùng scheme/host/port cho hai tab demo.
