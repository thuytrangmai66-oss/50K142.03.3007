# G7 — Hàng hóa và lịch xử lý tồn lâu

> Chủ dự án nghiệm thu13/11/2026: phần T01 đã triển khai và T02–T06 **ACCEPTED_USER** theo [biên bản](ACCEPTANCE_2026_11_13.md). Barcode T01 còn thiếu; không ghi toàn G7 DONE hoặc đóng audit/G6 UI. Công việc tiếp đã giao: [G8-T01 phần độc lập](../phase8/COPILOT_T01_TASK.md). Trạng thái chờ review phía dưới là mốc trước nghiệm thu.

> Tiếp quản 13/11/2026: Q10, Q12 (nearest/half-up cho mức giảm30%) và P10 đã xác nhận. T01 query/detail và T02–T06 runtime/test đã có; full revalidation trên worktree hiện tại: **298/298 unit, 107/107 Chromium, lint/typecheck/build PASS**. T01 PARTIAL vì barcode; T02–T06 PENDING REVIEW; G6/G7 không tự DONE. Xem [execution T02–T06](T02_T06_EXECUTION.md) và [evidence handoff](evidence/handoff-current/).

Ngày 13/11/2026. **G7 IN PROGRESS; T01 PARTIAL/PENDING REVIEW, T02–T06 PENDING REVIEW**. Người dùng cho phép tiếp tục phase kế tiếp; G6 vẫn PENDING REVIEW, không tự nghiệm thu G6/G7 hoặc chuyển G8.

## Trạng thái khi tiếp quản và xác minh hiện hành

- Branch `coco/phase-7`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`; lúc tiếp quản: 16 tracked modified, 1811 untracked, không có staged changes. Không reset/checkout/xóa hoặc ghi đè các thay đổi đó. Evidence mới của lượt này nằm riêng trong `evidence/handoff-current/`.
- Đọc Master Plan, kế hoạch/báo cáo G7, Decision Log, T01/T02 review, execution T02–T06, SRS UC_2.1–UC_2.3/BR-UC2-01…09 và các phần Design mapping UI12–UI15. Không có checklist riêng cho G7 trong `planning/phase7`.
- Q10/Q1: owner và staff đều reset giá gốc chu kỳ/ngày bắt đầu khi giá thay đổi thật; giữ ngày nhập. Q12/Q2: giảm 30% trên giá gốc chu kỳ, làm tròn đồng nguyên nearest/half-up. P10/Q3: từ45 ngày luôn đặt 20.000đ, kể cả khi giá trước đó thấp hơn. Cả ba quyết định đã có trong Decision Log, không còn là blocker.

| Task | Trạng thái khi tiếp quản | Bằng chứng hiện tại / phần còn mở |
|---|---|---|
| T01 — tra cứu/chi tiết | PARTIAL / PENDING REVIEW | Tìm kiếm, bộ lọc kết hợp, phân trang, chi tiết, lỗi đọc và read-only được kiểm thử. Barcode chưa có payload/định dạng mã để ánh xạ sang MaSP; máy quét vật lý chưa chạy, nên nhánh này BLOCKED/NOT RUN. |
| T02 — sửa thuộc tính | PARTIAL / PENDING REVIEW | Form, validation, cancel, owner/staff, giữ field cố định, rollback/retry và reload đã có runtime/test. |
| T03 — reset chu kỳ khi sửa giá | PARTIAL / PENDING REVIEW | Unit + Chromium kiểm owner/staff đổi giá thật, không reset khi giá giữ nguyên, giữ NgayNhapKho và lịch sử. |
| T04 — scheduler | PARTIAL / PENDING REVIEW | Mốc30/45, mở lại sau thời gian đóng app, giờ Việt Nam và không chạy thủ công đã có kiểm thử. |
| T05 — claim/idempotency/recovery | PARTIAL / PENDING REVIEW | Hai tab, lỗi ghi, rollback, retry, receipt/journal và recovery có kiểm thử. |
| T06 — monitor | PARTIAL / PENDING REVIEW | Hai vai trò đọc run log thật, trạng thái lỗi/thành công; không có nút chạy tay. |

G7 **không DONE** dù suite tự động PASS: chưa nghiệm thu người dùng/visual, barcode còn BLOCKED, G6 còn PENDING REVIEW với audit dependency FAIL 13 findings và hai trường UI BR-UC1-16 BLOCKED. Các mục này không được đổi trạng thái bằng kết quả test G7.

### Source và test G7 hiện có trong worktree

Code/test G7 đã được Codex tạo hoặc chỉnh trong worktree trước khi tiếp quản; lượt này không sửa application source: `src/domain/inventory.ts`, `src/services/inventory.ts`, `src/services/discount-scheduler.ts`, `src/features/inventory/InventoryPages.tsx`, `InventoryEditForm.tsx`, `DiscountMonitor.tsx`, auth wiring, `src/repositories/constraints.ts`, `src/index.css`, `tests/unit/inventory.test.ts`, `discount-scheduler.test.ts`, `tests/e2e/inventory.spec.ts`, `inventory-edit.spec.ts`, `discount-scheduler.spec.ts` và `inventory-helpers.ts`. Một số file mới là untracked, các file khác nằm trong tracked modifications có sẵn; tất cả được giữ nguyên, không viết lại source G7.

## Công việc đã triển khai

- Danh sách Hàng hóa thật từ sản phẩm tạo qua thu mua G6, cho Chủ và Nhân viên; tìm mã/từ khóa, bộ lọc loại/brand/ngày nhập kết hợp, reset, pagination dùng chung và thích nghi chiều cao viewport.
- Chi tiết theo bố cục CODEX local: tên, mã, loại, brand, độ mới, giá hiện hành, trạng thái, ngày nhập và số ngày tồn; Back và reload đúng dữ liệu.
- Service chỉ đọc có kiểm session/quyền, validator FK/provenance/snapshot; không đổi mã trạng thái legacy. Giá đang lưu không được tính lại khi truy vấn. Số ngày tính theo lịch Việt Nam.
- Nhãn giảm/đồng giá chỉ đọc bằng chứng `discountApplications` đúng chu kỳ, không tự tạo bằng chứng scheduler. Thuộc tính G6 lấy snapshot theo provenance, không lấy khung giá mới để viết lại lịch sử.
- Bổ sung subscription trên sản phẩm/discountApplications để các view dùng chung nhận thay đổi qua cơ chế hiện có; giữ session từng tab. Không tách DB theo vai trò.
- Giữ layout/pagination và primitives hiện có; không có bảng cuộn dọc nội bộ để xem thêm bản ghi.

## Checklist task và gate

| Task | Trạng thái thực tế |
|---|---|
| T01 tra cứu/chi tiết | **PARTIAL / PENDING REVIEW**; query/detail tested; barcode BLOCKED chờ payload/mapping tem và máy quét |
| T02 sửa hàng | Runtime/test có; **PENDING REVIEW**; mapping thuộc tính ở [T02 review](T02_DATA_REVIEW.md) |
| T03 reset chu kỳ | Runtime/test có; **PENDING REVIEW**; Q10/Q12 đã xác nhận |
| T04 runner lịch | Runtime/test có; **PENDING REVIEW**; P10 đã xác nhận |
| T05 lock/idempotency/run log | Runtime/test có; **PENDING REVIEW** |
| T06 màn theo dõi | Runtime/test có; **PENDING REVIEW**; monitor đọc log thật, không có nút chạy |

Nút Quét mã vạch vẫn chưa kích hoạt do gate barcode còn mở. Sửa thông tin và mục Xử lý hàng tồn lâu đã có runtime và automated tests, nhưng đang PENDING REVIEW, không coi render hoặc PASS test tự động là nghiệm thu người dùng. [Nguồn/decision gate chi tiết](T01_REQUIREMENT_REVIEW.md). Q10/Q12/P10 đã có xác nhận trong Decision Log; chỉ barcode còn cần làm rõ.

## File source/test từ lượt triển khai T01 (lịch sử)

| File | Phạm vi |
|---|---|
| `src/services/inventory.ts` (mới) | Query/projection/calendar days, quyền và tính chỉ đọc |
| `src/features/inventory/InventoryPages.tsx` (mới) | Danh sách/bộ lọc/chi tiết/error theo nguồn |
| `src/features/auth/context.ts`, `AuthProvider.tsx` | Cấp InventoryService theo token hiện tại |
| `src/services/reference-data/local.ts` | Quan sát sản phẩm và dấu mốc giảm giá để invalidate read view |
| `src/app/router.tsx` | Route `/inventory`, `/inventory/:productId` |
| `src/components/layout/CoCoLayout.tsx` | Menu Hàng hóa thật, heading và detail scroll; mục scheduler chưa kích hoạt |
| `src/index.css` | Style riêng inventory, tái dùng bảng/pagination, không sửa stylesheet module khác |
| `tests/unit/inventory.test.ts` (mới) | 16 test unit/integration trên dữ liệu G6 hoàn tất thật và legacy |
| `tests/e2e/inventory.spec.ts` (mới) | UI hai role, tạo25 món thật, ba viewport, filter/detail/reload/read-only, empty/error |

Không đổi schema/version/store, package/lock, quyền hiện hành, quyết định nghiệp vụ hoặc workflow. Tạo nhánh **coco/phase-7**, HEAD vẫn `22d3fbdd7cee0db717c62e003c5f4075f3707712`, giữ toàn bộ working tree có trước; không commit/push/deploy/reset dữ liệu người dùng.

Tài liệu mới: báo cáo này, `T01_REQUIREMENT_REVIEW.md`, `T02_DATA_REVIEW.md` và evidence/script tạo catalog. Tài liệu cập nhật: `PLAN_PHASE_7.md`, `planning/MASTER_PLAN_COCO.md`, `planning/PHASE_ROADMAP.md`, `planning/REQUIREMENT_TRACEABILITY.md`. Những file dirty có sẵn từ G6 (gồm schema v4) không được coi là thay đổi mới của T01.

## Kiểm thử và bằng chứng

### Revalidation khi tiếp quản

| Kiểm tra | Kết quả | Evidence |
|---|---|---|
| `npm.cmd run lint` | PASS, exit0 | `evidence/handoff-current/lint.log` |
| `npm.cmd run typecheck` | PASS, exit0 | `evidence/handoff-current/typecheck.log` |
| `npm.cmd test -- --maxWorkers=2` | **298/298 PASS**, 14 file | `evidence/handoff-current/unit-full.log` |
| `npm.cmd run build` | PASS, exit0 | `evidence/handoff-current/build.log`; Vite báo bundle 502.98 kB vượt ngưỡng cảnh báo500 kB, không coi là nghiệm thu NFR tốc độ |
| `npm.cmd run test:e2e -- --project=chromium --workers=2 --reporter=line --output=planning/phase7/evidence/handoff-current/playwright-output` | **107/107 PASS**, 0 fail/skip, 3.1 phút | `evidence/handoff-current/chromium-full.log`; gồm G7 và hồi quy G2–G6 |
| `git diff --check` | PASS | Đã chạy sau suite |

Trong 298 unit có 35 inventory + 14 scheduler; trong 107 Chromium có 4 inventory/T01, 4 edit/reset T02–T03, 3 scheduler/monitor T04–T06. Tại thời điểm chạy suite này chưa chạy lại `npm audit` do package/lock không đổi; audit read-only cập nhật sau đó được ghi riêng ở mục dưới, tiếp tục FAIL/OPEN.

Ảnh do Chromium chụp trong cùng lượt revalidation: [Hàng hóa 1440×900](evidence/handoff-current/inventory-owner-1440x900.png), [Thu mua danh sách 1440×900](evidence/handoff-current/purchases-list-1440x900.png), [Monitor Chủ cửa hàng 1440×900](evidence/handoff-current/discount-monitor-owner-1440x900.png). Test T01 so sánh computed typography/spacing của Hàng hóa và Thu mua tại 1440×900; test bảng kiểm 5 cột, chiều rộng, thẳng hàng và không cắt chữ ở 1366×768, 1440×900, 1920×1080.

### Rà soát ảnh và ma trận nghiệm thu G7 — 13/11/2026

Đã đối chiếu evidence Chromium hiện có với CODEX local SC060/066/067/068/074/266. Ảnh list của Chủ/Nhân viên cho thấy cùng bố cục và pagination; ảnh hai form sửa cho thấy các trường chỉnh sửa, trường cố định và nút Lưu/Hủy; monitor của hai vai trò đọc lịch sử thật, không có nút chạy tay. Giữ quyết định G7-D04; ảnh Figma cũ không làm thay đổi cấu hình danh sách hiện hành.

| Ảnh runtime | Bằng chứng 1440×900 | Kết quả review |
|---|---|---|
| Danh sách Chủ | [PNG](evidence/handoff-current/playwright-output/inventory-G7-T01-owner-rea-2b264-detail-and-read-only-reload-chromium/owner-inventory-1440.png) | PASS cho bố cục/filter/table/pagination ở ảnh; hành vi phân trang có E2E |
| Danh sách Nhân viên | [PNG](evidence/handoff-current/playwright-output/inventory-G7-T01-staff-rea-fc5e4-detail-and-read-only-reload-chromium/staff-inventory-1440.png) | PASS cho bố cục/filter/table/pagination ở ảnh; cùng quyền đọc |
| Form sửa Chủ | [PNG](evidence/handoff-current/playwright-output/inventory-edit-G7-owner-ed-10a93-reserves-historical-records-chromium/owner-edit-1440.png) | PASS cho cấu trúc form và trường cố định; thao tác save/cancel có E2E |
| Form sửa Nhân viên | [PNG](evidence/handoff-current/playwright-output/inventory-edit-G7-staff-ed-3e2b2-reserves-historical-records-chromium/staff-edit-1440.png) | PASS cho cấu trúc form và trường cố định; thao tác save/cancel có E2E |
| Monitor Chủ/Nhân viên | [Chủ](evidence/handoff-current/playwright-output/discount-scheduler-G7-auto-8ecc4-oles-read-real-monitor-logs-chromium/owner-monitor-1440.png), [Nhân viên](evidence/handoff-current/playwright-output/discount-scheduler-G7-auto-8ecc4-oles-read-real-monitor-logs-chromium/staff-monitor-1440.png) | PASS cho log đọc thật ở hai vai trò; test xác nhận không có nút chạy tay |
| Chi tiết sản phẩm đã bán | Chưa có ảnh runtime sold trong evidence hiện tại; tham chiếu [CODEX SC067](../../../CODEX/.uc-ui-matrix-qa/frame-67.png) | NOT RUN về ảnh/UI runtime; component ẩn nút sửa cho sold, unit test xác nhận service từ chối cập nhật sold |

Review này không tuyên bố pixel-perfect hay nghiệm thu người dùng. Chi tiết sold có kiểm chứng unit/source nhưng chưa capture UI runtime riêng; chuyển trạng thái sản phẩm qua bán thành công và kiểm tra trên màn hình bán hàng chờ G8. Tập E2E phân trang đã duyệt các trang ở 1366×768, 1440×900 và 1920×1080; screenshot list là bằng chứng trang đang hiển thị, không thay thế toàn bộ lượt tương tác.

**Ma trận UC/BR** (PASS/FAIL/BLOCKED/NOT RUN chỉ biểu thị bằng chứng automated cho phạm vi nêu; không đồng nghĩa G7 được nghiệm thu):

| UC / BR | Trạng thái | Evidence / giới hạn |
|---|---|---|
| UC_2.1 — tra cứu, lọc, phân trang, chi tiết, đọc không ghi | PASS | Unit + Chromium hai vai trò; 3 viewport; read-only reload |
| UC_2.1 — barcode T01 | BLOCKED | Chưa có xác nhận payload tem và cách máy quét gửi dữ liệu; không giả scan |
| UC_2.2 — sửa thông tin / kiểm soát dữ liệu cố định | PASS | Unit + Chromium hai vai trò; validation, Hủy, reload |
| UC_2.2 — cấm sửa sản phẩm sold | PASS | Unit/integration xác nhận từ chối; capture UI sold hiện NOT RUN |
| UC_2.3 — scheduler, mốc, idempotency, monitor | PASS | Unit + Chromium; mốc 29/30/44/45, recovery và hai vai trò |
| BR-UC2-01 | PASS | Mã từng sản phẩm và danh sách sản phẩm thật được kiểm tra trong inventory suite |
| BR-UC2-02 | PASS | Số ngày theo lịch Việt Nam và các ngưỡng scheduler có unit/integration |
| BR-UC2-03 | NOT RUN | Chuyển trạng thái sau bán thành công thuộc luồng bán hàng; chờ G8 |
| BR-UC2-04 | PASS | Giá lưu hiện hành và cập nhật tự động được kiểm tra; assertion ở màn hình bán hàng chờ G8 |
| BR-UC2-05 | PASS | Service guard và UI readonly mã/ngày nhập cho hai vai trò |
| BR-UC2-06 | PASS | Service từ chối cập nhật sold; unit/integration PASS, chưa có ảnh UI sold runtime |
| BR-UC2-07 | PASS | 29/30/44/45, mốc 45 chạy trước khi catch-up, giá thấp hơn 20.000đ |
| BR-UC2-08 | PASS | CAS, stale editor hai tab, rollback và retry |
| BR-UC2-09 | PASS | Reset chu kỳ Chủ/Nhân viên, giữ ngày nhập, không giảm lặp/mỗi mốc một lần |

Các BR PASS trên vẫn ở trạng thái **PENDING REVIEW** cho nghiệm thu G7; UC_2.1 vẫn PARTIAL do barcode. Không có BR-UC2 nào bị đánh dấu DONE.

### Dependency audit chỉ đọc — 13/11/2026

Đã chạy `npm.cmd audit --json` và `npm.cmd audit --omit=dev --json`; không thay đổi `package.json`, lockfile hay `node_modules`. Cả hai lệnh exit 1 do advisory hiện hành; log/exit code được lưu trong `evidence/handoff-current/npm-audit-current.log`, `npm-audit-exit.txt`, `npm-audit-production-current.log`, `npm-audit-production-exit.txt`. Đây là audit mới, không phải PASS:

| Phạm vi | Kết quả |
|---|---|
| Toàn dependency tree | 13 package findings: 2 critical, 1 high, 10 moderate |
| Chỉ production (`--omit=dev`) | 3 package findings: 1 high, 2 moderate — `zod` direct `3.25.76`; `react-router-dom` direct `6.30.6` và `react-router` transitive `6.30.6` |
| Dev findings | `vitest` direct `3.2.7` và `tinypool` transitive `1.1.1` critical; `@vitest/mocker` moderate; ESLint/TypeScript-ESLint cùng `minimatch` moderate |

Phương án để review, **chưa thực thi**:

| Nhóm | Phiên bản hiện tại → hướng audit đề xuất | Tương thích/rủi ro cần tính trước |
|---|---|---|
| Vitest / tinypool / @vitest/mocker | Vitest `3.2.7` → audit đề xuất `5.1.0` (major) | Dev-only nhưng ảnh hưởng runner/config/reporters; nâng major cần chạy toàn bộ unit và Chromium |
| Zod | `3.25.76` → audit đề xuất `4.6.7` (major) | Runtime/direct; cần rà soát schema API, transforms/defaults/errors và chạy regression validation G2–G7 |
| React Router | `react-router-dom`/`react-router` `6.30.6` → audit đề xuất `7.18.5` (major) | Runtime; cần migration compatibility và hồi quy toàn bộ route, auth, back/refresh |
| TypeScript-ESLint / minimatch | Đang `typescript-eslint` và parser/plugin `8.72.1`, `minimatch` `10.2.6`; **chưa chốt target** | `fixAvailable` trong audit đề xuất phiên bản thấp hơn hiện tại (`8.36.0` hoặc `6.15.0`); riêng `8.36.0` vẫn nằm trong range báo vulnerable `<=8.72.2`. Không áp dụng máy móc; cần xác minh advisory/phiên bản đã vá và chuỗi dependency trước khi đổi |

Không có phương án nào được tự nâng cấp trong lượt này. Dependency gate tiếp tục **FAIL/OPEN** cho đến khi chủ dự án duyệt phạm vi remediation và regression tương ứng.

### Bằng chứng từ lượt T01 trước (lịch sử)

Baseline gần nhất T07:249 unit/integration +95 Chromium PASS, lint/typecheck/build PASS; dependency audit FAIL13 package findings và hai trường UI G6 BLOCKED vẫn được giữ nguyên. Đây là mốc trước source G7, không gọi là lần chạy mới G7.

- Unit/integration tập trung: **16/16 PASS**; xem `evidence/t01/unit-focused.log`.
- Production build: PASS, exit0, `build.log`/`build-exit.json`.
- Full lint/typecheck PASS, exit0; production build PASS, exit0.
- Full unit/integration: **265/265 PASS**, 0 FAIL/SKIP,13 file, `--maxWorkers=2`.
- Full Chromium: **98/98 PASS**, 0 FAIL/SKIP/flaky, gồm95 ca G2–G6 và3 ca T01 mới; exit0. Giữ hồi quy hai tab, approvals/finalize/rollback/migration/legacy và G5.
- [Execution](evidence/t01/execution.json), [checks](evidence/t01/checks.json), [Vitest](evidence/t01/vitest.json), [Chromium](evidence/t01/playwright.json), [từng ca unit](evidence/t01/unit-catalog.json), [từng ca Chromium](evidence/t01/chromium-catalog.json), [hash source/test](evidence/t01/source-manifest.json). Không cộng các lượt chạy tập trung vào tổng duy nhất.
- Hai lượt Chromium tập trung đầu có lỗi test mới, giữ log `chromium-focused-first.log` (2FAIL/1PASS), `chromium-focused-second.log` (1FAIL/2PASS). Sửa locator select sang role/accessible name; ảnh chụp sau khi bảng tải xong. Case staff dài vượt tổng30s ở bước cuối; hai ca nhiều bước/ba viewport dùng budget60s, từng assertion vẫn5s, không bỏ assertion/skip. Không tăng timeout cho auth hoặc toàn bộ suite.

Đối chiếu UC_2.1/BR-UC2-01…04: mã từng món/giá hiện hành/query/detail/read-only có unit+integration+UI; ngày VN qua nửa đêm/năm nhuận có unit; raw legacy và hỏng liên kết có integration. Luồng mã vạch **BLOCKED/NOT RUN**; chỉnh sửa và scheduler **NOT RUN**, không tính PASS từ fixture chỉ đọc nhãn giảm giá.

Nguồn thiết kế: CODEX local SC060–067/252–259, ảnh frame60/66 và bản Nhân viên tương ứng, cùng mô tả trong design-blocks.json. Không truy cập link Figma. Đã đối chiếu cấu trúc/card/filter/table với ảnh nguồn; không tuyên bố pixel-perfect. Control chưa kích hoạt khác trạng thái hoạt động trong Figma vì task/gate còn mở; ghi rõ giới hạn, không tự thay nghiệp vụ để làm giống ảnh.

Ảnh được chụp lại trong chính lượt full98 cuối, sau khi dữ liệu tải xong; profile test riêng, hàng thật từ giao dịch tạo bằng UI:

- [Chủ1366](evidence/t01/owner-inventory-1366.png), [1440](evidence/t01/owner-inventory-1440.png), [1920](evidence/t01/owner-inventory-1920.png), [chi tiết1440](evidence/t01/owner-inventory-detail.png).
- [Nhân viên1366](evidence/t01/staff-inventory-1366.png), [1440](evidence/t01/staff-inventory-1440.png), [1920](evidence/t01/staff-inventory-1920.png), [chi tiết1440](evidence/t01/staff-inventory-detail.png).
- [Chỉ mục8 ảnh và hash](evidence/t01/screenshots.json).

**Còn BLOCKED/NOT RUN:** payload/format barcode và máy quét vật lý; nghiệm thu visual/người dùng; G6 audit dependency và hai trường UI. T02–T06 đã có triển khai và automated regression PASS, nhưng vẫn PENDING REVIEW, không được coi là nghiệm thu.

## Chạy và kiểm tra

Mở `http://127.0.0.1:5173/50K142.03.3007/#/inventory`. Nếu dev server chưa mở:

```powershell
cd D:\50K142-NEW\CoCo
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Dùng tài khoản và dữ liệu đã có. Hàng hóa xuất hiện sau khi hoàn tất thu mua thật; không auto-seed hàng mẫu hoặc đổi dữ liệu trình duyệt. Nhấn Hàng hóa → tìm mã/loại/brand/ngày → mở mã sản phẩm → Quay lại. Có thể đăng nhập vai trò còn lại ở tab cùng origin để tra cứu chung.

G7 chưa hoàn tất. Tiếp theo: xác định payload/format mã vạch và kiểm tra máy quét để khép phần còn thiếu T01; review/nghiệm thu T02–T06 và các gate G6 còn mở. Không triển khai lại những phần đã có, không tự DONE G6/G7 hoặc chuyển G8.
