# G9-T05 — Dashboard hai vai trò và provenance khách mới

> **Hiện hành sau G9-D05:** mốc cuối tháng trước VN và nguồn nhập/bán đã xác minh được duyệt; đã triển khai reader/kernel so sánh, không thêm schema/snapshot/backfill/UI. [Execution và ảnh tăng/giảm](STOCK_COMPARISON_EXECUTION.md). Full unit mới 491/491 PASS, full Chromium **151/151 PASS**, 0 FAIL/0 SKIP (8,2 phút). Không còn gate nguồn lịch sử BLOCKED; các mô tả đó trong nhật ký G9-D04 là lịch sử. T05/G9 tiếp tục PENDING REVIEW, không tự DONE.

## Trạng thái hiện hành sau phê duyệt 14/11/2026

**IMPLEMENTED / PENDING REVIEW** theo [G9-D04](DECISION_LOG.md). Người dùng duyệt KPI toàn cửa hàng/ngày VN, M01-B và wording trong [gói T05](T05_REVIEW_GATE.md). Không DONE G9; so sánh tồn kho tháng trước vẫn **BLOCKED**. Những phần “chưa kích hoạt” trong nhật ký cuối tài liệu là lịch sử trước phê duyệt này.

Đối chiếu MASTER_PLAN, PLAN_PHASE_9, SRS/SDD, ảnh local CODEX `.uc-ui-matrix-qa/frame-7.png` và `frame-198.png`, cùng ảnh wording đã duyệt. Không đọc Figma online. Git main, HEAD nền f580a229f77cadb4c4e18108ae42bf1189fbeffa trùng origin/main sau fetch đầu lượt; bảo toàn working tree G9 và file ngoài phạm vi. Chưa commit/push khi gate phase còn mở theo AGENTS.md; không deploy thủ công.

### Checklist đã triển khai

- [x] Ghi G9-D04, mở M01-B/U01/phạm vi staff/wording; giữ tồn kho tháng trước BLOCKED.
- [x] Chủ: doanh thu/đơn hôm nay và hôm qua theo paidAt đáng tin cậy, pending đúng draft/line revision/snapshot, tồn kho theo mapping đã duyệt. Mẫu số 0 dùng wording, không tự +100% hoặc NaN/Infinity.
- [x] Nhân viên: số đơn thu mua, đơn bán, sản phẩm nhập và hồ sơ khách mới đủ điều kiện của toàn cửa hàng theo ngày VN. Dùng cùng ledger/adapters; món nhập đếm từng sản phẩm vật lý từ giao dịch thu mua đã xác minh, kể cả món đã bán sau đó. DTO không trả doanh thu/giá vốn/lợi nhuận/pending của Chủ.
- [x] Marker `customer-creation:<MaKH>` / customer-creation-v1 chỉ cho hồ sơ mới từ lúc triển khai; ngày bằng executedAt receipt/audit và actor từ session. Không lấy membership/lần mua đầu/import làm ngày tạo.
- [x] Effect DB-only cùng transaction repository, sau kiểm replay và ghi receipt/audit; không chạy lại effect khi replay. Crypto ở ngoài transaction. Lỗi audit/metadata tạo/xóa rollback toàn bộ.
- [x] Sửa tên/phone giữ nguyên ngày tạo; xóa hợp lệ xóa marker atomically, giảm KPI hồ sơ hiện còn. Khách có lịch sử vẫn bị chặn xóa theo nghiệp vụ cũ.
- [x] Reader kiểm format/ID, receipt/audit actor/time/reference; thiếu/hỏng/lệch bằng chứng → UNVERIFIED, không tự sửa. Lỗi storage phải báo lỗi thay vì false-zero.
- [x] HomePage bốn thẻ 2×2, nền trắng/be, icon bộ hiện có và quick actions vào danh sách. useResource cập nhật hai tab, sessionStorage độc lập. Ngày VN được kiểm tra lại mỗi 30 giây khi tab mở.
- [x] Dùng wording đã duyệt trong ô hiện có; unknown customer caption là toàn tập nguồn, không gán vào ngày. Error/retry bằng ResultDialog hiện hữu.
- [x] Ba viewport desktop: card/nút trọn viewport, không tràn ngang; ảnh runtime và so thủ công bố cục với nguồn local/gói wording.
- [ ] So sánh tồn kho tháng trước: **BLOCKED**, thiếu nguồn lịch sử/định nghĩa mốc được duyệt; placeholder không miễn trừ yêu cầu.
- [ ] Nghiệm thu T05/G9: **PENDING REVIEW**, không tự DONE hoặc sang G10.

### Source/test của phần bổ sung đã duyệt

Mới: `src/services/customer-creation.ts`, `tests/unit/customer-creation.test.ts`. Các file T05 đã có tiếp tục sửa: `src/services/dashboard.ts`, `report-queries.ts`, `reference-data/local.ts`, `auth/service.ts`; `src/repositories/index.ts` (effect trong transaction, chỉ một lần); `src/features/home/HomePage.tsx`, `src/index.css` (scope home); `tests/unit/report-queries.test.ts`, `tests/e2e/home-t05.spec.ts` và assertion dashboard trong `reports-reconciliation.spec.ts`.

Không thêm bảng/cột/version DB/migration/backfill; không đổi finalizer, mã legacy, workflow, dependency hoặc dữ liệu người dùng. HTML proposal lịch sử không được import vào runtime.

### Mapping bằng chứng và kết quả

| Tiêu chí | Test/bằng chứng |
|---|---|
| SC007: VN midnight, pending, tồn theo mapping, quyền | `report-queries.test.ts`, `dashboard-comparison.test.ts`; staff ownerSummary FORBIDDEN; toàn store bất biến khi đọc |
| SC198: bốn KPI toàn cửa hàng/ngày VN | Unit ngày trước/ngày hiện tại; `reports-reconciliation.spec.ts`: staff khác người thu mua vẫn nhận 1 đơn mua/2 món nhập/2 đơn bán/1 khách |
| M01-B lifecycle/reload/legacy | 16 ca `customer-creation.test.ts`: 00:00 VN, giữ provenance khi sửa, xóa marker đúng hồ sơ, import không backfill |
| Atomicity/replay/race | Lỗi audit/marker tạo/marker xóa rollback toàn DB; trùng phone hai connection chỉ một hồ sơ/marker; effect một lần khi replay; revoked token bị chặn |
| Invalid proof/I/O | 7 biến thể absent/JSON/ID/receipt/actor/time/audit; I/O không biến thành zero |
| Hai tab UI thật | Chủ tạo/xóa bằng form; Nhân viên cập nhật 0→1→0 không F5, legacy nguyên vẹn; reload và token độc lập |
| Empty/error/retry | Native IDB fault → popup, không card false-zero → khôi phục/thử lại; empty mỗi role có 4 card |
| Geometry | 1366×768, 1440×900, 1920×1080: card/actions nằm trong viewport và không tràn ngang |

Focused unit **60/60 PASS**, 2 file, 14,19 giây (44 report queries + 16 creation). Focused Chromium **6/6 PASS**, 14,8 giây: **5 ca runtime + 1 render proposal riêng**, không lấy test proposal làm bằng chứng nghiệp vụ. Lint/typecheck/build PASS; build 4,57 giây, vẫn cảnh báo bundle >500 kB. Full hiện hành: **464/464 unit/integration PASS**, 25 file, 102,27 giây; **148/148 Chromium PASS**, 6,7 phút; cả hai **0 FAIL / 0 SKIP**, exit 0.

Ảnh thật: [Chủ có giao dịch](evidence/t05-approved/owner-home-reconciled.png), [Nhân viên có giao dịch](evidence/t05-approved/staff-home-reconciled.png), [Nhân viên verified/legacy](evidence/t05-approved/staff-kpi-verified-legacy.png). Cùng thư mục có ảnh empty mỗi role tại 1366/1440/1920 và log focused. Đã xem ảnh runtime so bố cục/màu/slot với frame local và gói wording. **Pixel-diff tự động và nghiệm thu thiết kế: NOT RUN/PENDING REVIEW**; capture không phải pixel PASS.

Local http://127.0.0.1:5173/50K142.03.3007/. Chạy nếu cần: `cd D:\50K142-NEW\CoCo`, `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Giữ cùng origin để thấy dữ liệu hiện có. Demo: hai tab Chủ/Nhân viên → Chủ tạo hồ sơ Khách hàng → KPI Nhân viên tăng không F5 → xóa hồ sơ vừa tạo chưa có lịch sử → KPI giảm. Khách legacy thiếu marker vẫn chưa xác minh, không bị backfill.

## Nhật ký lịch sử trước G9-D04 — không mô tả runtime hiện tại

Ngày 14/11/2026. **PARTIAL / PENDING REVIEW**, không DONE và không chuyển G10. Các chỉ tiêu/chữ chưa được duyệt tiếp tục BLOCKED. [Gói quyết định và ảnh](T05_REVIEW_GATE.md).

## Rà soát và phạm vi

MASTER_PLAN/PLAN_PHASE_9 yêu cầu dashboard hai vai trò theo SC007/198. Đã xem ảnh Figma local CODEX cho cả Chủ/Nhân viên; không đọc Figma online. T02–T04 đã triển khai, các gate M01/U01 chưa có xác nhận mới trong thời điểm bắt đầu T05. Git main, HEAD nền f580a229f77cadb4c4e18108ae42bf1189fbeffa, fetch origin thành công và trùng HEAD; giữ toàn bộ working tree, không stash/reset/commit/push/deploy.

## Phần đã triển khai

1. DashboardService.ownerSummary kiểm home.read rồi kiểm role owner trong transaction readonly. Không dùng quyền home.read chung để lộ tiền/approval KPI cho Nhân viên. Đã đưa service vào AuthContext/Provider theo token từng tab, chưa tự query hoặc render thẻ KPI trên HomePage.
2. Doanh thu hôm nay/hôm qua và đơn hoàn tất dùng sales-report-ledger/paidAt đã xác minh theo ngày Việt Nam. So sánh phần trăm trả DEFINED hoặc NO_BASELINE/percent null khi mẫu số 0; không tự +100%, NaN, Infinity hay ghi chỉ tiêu giả.
3. Pending KPI đối chiếu đúng approval-line revision/bracket snapshot, draft đang editing, line đang pending và chưa removed; hủy draft không còn đếm pending. Tồn kho phân biệt knownAvailableCount/unverifiedCount từ mapping hiện hữu, không suy trạng thái legacy. So sánh tồn tháng trước vẫn BLOCKED_HISTORICAL_STOCK_BASELINE, không tự tái dựng thiếu căn cứ hoặc thêm snapshot.
4. HomeQuickActions theo khối SC007/198 đã lên runtime, cho cả Chủ/Nhân viên: Thu mua/Bán hàng mở danh sách hiện hữu, không tạo draft/hóa đơn khi bấm. Giữ welcome shell hiện tại cho đến khi nguồn/wording KPI được chốt. Chưa gọi đây là dashboard bốn thẻ hoàn chỉnh theo Figma.
5. Chuẩn bị HTML/ảnh đề xuất riêng khỏi runtime, với các dòng phân biệt dữ liệu xác minh và thiếu căn cứ. Template chỉ tồn tại trong test/review; số mẫu được ghi rõ là minh họa review, không cấp làm KPI thật. Không có route demo giả hoặc namespace customer-creation trong dữ liệu runtime.

## File source/test

Mới: `src/services/dashboard.ts`, `src/features/home/HomeQuickActions.tsx`, `tests/unit/dashboard-comparison.test.ts`, `tests/e2e/home-t05.spec.ts`, `tests/e2e/dashboard-review-template.html`.

Sửa: `src/features/home/HomePage.tsx`, `src/features/auth/context.ts`, `AuthProvider.tsx`, `src/index.css` (chỉ CSS quick actions), `tests/unit/report-queries.test.ts`. Tài liệu review/execution và progress được cập nhật. `planning/phase9/review/t05-dashboard.html` là artifact review tự chứa font/icon tái sử dụng, không được import vào app/router.

Không sửa source tạo/xóa khách, schema, dữ liệu legacy, invoice/finalizer hay cấu hình Git/CI.

## Test và bằng chứng

| Tiêu chí | Bằng chứng |
|---|---|
| KPI Chủ đọc theo paidAt VN | Unit 2 hóa đơn qua 23:59:59 → 00:00, hôm nay/hôm qua đều 104.001, orders 1/1, delta 0 |
| Không bịa baseline | Unit 0/0 và 100/0 trả null; +12%/-100% đúng toán; stock lịch sử trả BLOCKED |
| Pending hợp lệ | Unit tạo yêu cầu vượt Max thực → pending 1; hủy draft → 0 |
| Legacy | Mapping thiếu → unknown stock 2, known available 0, không tự coi mã 1 là available |
| Quyền | Staff ownerSummary FORBIDDEN; token owner revoked AUTH_REQUIRED; so toàn bộ store không đổi khi đọc |
| Runtime quick actions | Chromium cả hai vai trò, 1366×768/1440×900/1920×1080, vào đúng list và toàn bộ DB giữ nguyên, reload giữ nguyên, console.error/pageerror rỗng |
| Review artifacts | Test riêng tạo 4 card/role và ảnh; chỉ chứng minh bản đề xuất render, không tính là E2E dashboard nghiệp vụ đã hoàn thành |

Focused unit **46/46 PASS** (41 report queries gồm 5 KPI mới, 5 comparison), 11,07 giây. Typecheck/lint/build **PASS**, build 4,20 giây; còn cảnh báo bundle >500 kB như mốc trước. Đã sửa lời gọi cancel trong test sang API removeOrCancel thực tế sau khi typecheck phát hiện tên phương thức không tồn tại; không đổi service nghiệp vụ để test qua.

Focused Chromium **3/3 PASS**, 4,9 giây: **2 ca runtime hai vai trò + 1 ca render proposal riêng**. Không dùng số này làm bằng chứng hoàn tất KPI staff/owner runtime. Full cuối: **445/445 unit/integration PASS**, 24 file, 98,85 giây; **145/145 Chromium PASS**, 6,7 phút, cả hai **0 FAIL / 0 SKIP**, exit 0. Full Chromium gồm đúng 1 ca render proposal, không phải 145 ca dashboard đầy đủ. Logs `unit-full.log`, `chromium-full.log`, `chromium-last-run.json` tại evidence/t05 ghi passed, failedTests rỗng. Không lấy 435/142 của T04 thay kết quả T05, không tự mở gate vì test PASS.

Ảnh runtime: [Chủ 1366](evidence/t05/owner-home-1366.png), [Nhân viên 1366](evidence/t05/staff-home-1366.png), cùng ảnh 1440/1920 tại evidence/t05. Ảnh [đề xuất Chủ](evidence/t05/owner-proposal.png)/[đề xuất Nhân viên](evidence/t05/staff-proposal.png) và [HTML](review/t05-dashboard.html) chỉ phục vụ review; chưa phải HomePage bốn KPI đang chạy. Pixel-diff nghiệm thu **NOT RUN**.

## Chưa được xác nhận / BLOCKED

- G9-M01: namespace ngày tạo mới và vòng đời khi xóa hồ sơ chưa được duyệt; không backfill, không lấy ngày giao dịch/membership thay ngày tạo.
- G9-U01: dòng phân biệt khách đủ điều kiện/thiếu nguồn trong thẻ SC198 chưa được duyệt.
- G9-DASH-01: phạm vi staff toàn cửa hàng hay riêng nhân viên và kỳ của hai KPI “mới” chưa rõ trong nguồn; đang hỏi, không tự chốt.
- G9-DASH-02: wording khi baseline doanh thu 0 và thiếu lịch sử tồn; nguồn/mốc so sánh tồn với tháng trước cần chốt. Không tự bỏ yêu cầu lịch sử chỉ vì bản đề xuất có placeholder.

Các câu hỏi đã có gói review cụ thể, trả lời chưa đến không được coi là đồng ý. Tiếp tục T05 sau quyết định tương ứng; T06 và G10 chưa được báo hoàn tất. Không commit/push khi phase còn gate.

## Local

http://127.0.0.1:5173/50K142.03.3007/ — đăng nhập một trong hai vai trò, xem hai lối vào nhanh phía dưới welcome shell. Các thẻ KPI chỉ xem qua HTML/ảnh review ngoài app. Nếu server chưa chạy: `npm.cmd run dev -- --host 127.0.0.1 --port 5173` trong CoCo. Không reset hoặc seed dữ liệu người dùng.
