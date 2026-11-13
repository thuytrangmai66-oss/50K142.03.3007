# Kế hoạch Giai đoạn 6 Thu mua và phê duyệt giá liên kết

> T07 ngày 12/11/2026: gói kiểm chứng tại [T07_EXECUTION.md](T07_EXECUTION.md), bảng từng UC/BR tại [G6_ACCEPTANCE_MATRIX.md](G6_ACCEPTANCE_MATRIX.md). **T05/T06/T07/G6 PENDING REVIEW**: BR-UC1-16 còn hai trường UI BLOCKED; dependency audit FAIL. Không tự DONE hoặc chuyển G7. Các mốc IN PROGRESS/NOT RUN phía dưới là lịch sử trước T07.

## Trạng thái thực thi hiện tại

> T05 đã triển khai đầy đủ và QA đạt theo [báo cáo hiện hành](T05_EXECUTION.md), 233 unit/integration + 88 Chromium PASS. Runtime Lưu hoạt động với mapping 1/1/2 theo chỉ đạo hoàn tất T05. T05 READY FOR REVIEW, G6 IN PROGRESS. Tiếp theo T06 → T07. Các ghi chú T05 chờ mapping bên dưới là lịch sử.

> T05 IN PROGRESS / PARTIAL. Đã code/test candidate transaction, cấp mã và source validation/UI chưa kích hoạt. [Báo cáo T05 và mapping OPEN](T05_CANDIDATE_PROGRESS.md). Chờ người dùng chốt mã số để nối runtime và chạy E2E Lưu thật. Các kiểm thử native candidate không xác nhận hoàn tất T05.

> T04 đã triển khai theo chỉ đạo tiếp tục sau T03. [Báo cáo và kiểm chứng T04](T04_EXECUTION.md) ghi 211 unit/integration và 80 Chromium PASS, cùng phần UI còn chờ review. G6 IN PROGRESS, chưa nghiệm thu T04. T05 → T06 → T07 tiếp tục theo thứ tự cũ.

> Tiếp tục 12/11/2026, T03 đã có UI SC130–144, owner route và service quyết định nguyên tử. Kiểm thử và bằng chứng review được cập nhật tại [T03_SERVICE_PROGRESS.md](T03_SERVICE_PROGRESS.md). T03 chờ review/nghiệm thu, G6 IN PROGRESS.

Theo yêu cầu trực tiếp sau T02, đã sửa trang vào Thu mua thành danh sách đọc dữ liệu thật, bộ lọc/phân trang và nút Tạo giao dịch: [báo cáo sửa luồng](PURCHASE_LIST_ENTRY_REVIEW.md). Đây là phần danh sách liên quan T06 được yêu cầu để sửa navigation; không tự nghiệm thu toàn bộ T06 hoặc đổi dependency T03–T07.

Ngày 11/11/2026, người dùng xác nhận: **“Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”**. T01 đã được nghiệm thu; P03/P04 runtime APPROVED_USER. Không suy ra nghiệm thu G5 hoặc toàn bộ G6 từ xác nhận này.

- Runtime CoCoDB v4/27 store (IndexedDB native v40); chỉ thêm sáu metadata store, giữ các version và dữ liệu legacy.
- T02 đã triển khai giao diện nhập món, tra khung giá, giá đề xuất, pending request, chọn/tạo khách, bỏ dòng và hủy draft. Bằng chứng và giới hạn tại [T02_EXECUTION.md](T02_EXECUTION.md). T02 chờ nghiệm thu sau kiểm thử, không tự DONE.
- T03 có phần chủ xử lý, T04 có consumer kết quả/nhập lại giá và T05 đã kích hoạt hoàn tất hóa đơn/nhập kho. T06 mới có phần danh sách và adapter tương thích dữ liệu mới trong reader hiện có, chưa đầy đủ hoặc nghiệm thu. Thứ tự task giữ nguyên.

## Hồ sơ trước xác nhận T01 — lịch sử

Các ghi chú chưa kích hoạt/chưa có UI bên dưới mô tả mốc trước xác nhận, không thay trạng thái hiện tại ở trên.

> Tiến độ T01 mới nhất: candidate/FK/adapter đã có bộ kiểm chứng và [gói review](T01_REVIEW_GATE.md), 154 unit/integration + 54 Chromium PASS; runtime chưa kích hoạt, chưa nghiệm thu T01/G6. Việc triển khai producer/UI T03/T05 vẫn theo task gốc, không biến thành điều kiện đòi code trước trong T01. Chốt P03/P04 runtime vẫn OPEN; UI hiện có giữ nguyên.

> Chỉ đạo mới: tiếp tục hoàn thiện T01 candidate/adapter/FK/provenance/transaction, **không kích hoạt P03/P04 runtime trước nghiệm thu**, không thay UI. Q20 đã chốt là kiểm tra thực tế ngoài hệ thống; giá bán đầu đã chốt cost từng món ×1,30, half-up. Checklist QA từng task tại [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md). Giữ thứ tự T01–T07, T01 còn PARTIAL và G5/G6 chưa DONE. Các điều kiện Q20/giá còn OPEN ở phần lịch sử dưới đây đã được thay bằng xác nhận này.

> Bắt đầu coding theo chỉ đạo tiếp theo: **IN PROGRESS — T01 PARTIAL**. Đã có contract/rule và migration candidate được kiểm thử độc lập, chưa kích hoạt trên runtime/DB người dùng; T02–T07 chưa triển khai. Xem [REPORT_PHASE_6.md](REPORT_PHASE_6.md). Các đoạn NOT STARTED dưới đây là mốc lập plan trước coding; chưa tự phê duyệt P03/P04/Q20 hoặc nghiệm thu G5/G6.

> Bản kế hoạch thực thi cập nhật theo yêu cầu “lên plan cho giai đoạn tiếp theo”. Giữ nguyên G6-T01–T07 và thứ tự roadmap. **Đang lập/chốt kế hoạch; code G6 vẫn NOT STARTED**. Không suy ra việc duyệt P03/P04/Q20 hoặc nghiệm thu G5 từ yêu cầu lập kế hoạch này. Các phần bổ sung bên dưới làm rõ đầu ra, dependency và cách nghiệm thu trong phạm vi đã có.

> Mốc rà soát coding trước ngày 11/11/2026: G5 là giai đoạn có source gần nhất, còn review/visual; lượt coding đó đã hoàn thiện các thiếu sót G5 trước. [DATA_CONTRACT_REVIEW.md](DATA_CONTRACT_REVIEW.md) cụ thể hóa P03/P04/Q20 bằng schema/FK và ví dụ giá lẻ, đã gửi để quyết định. Chưa áp dụng migration hoặc code G6; không coi tài liệu đề xuất là task triển khai đã PASS.

> Bổ sung yêu cầu chốt ngày 11/11/2026: [DEMO_ACCEPTANCE.md](DEMO_ACCEPTANCE.md) là gate bắt buộc A–F: staff gửi qua UI thật, owner xem/duyệt/từ chối, staff nhận trạng thái không F5, hai tab chung IDB/phiên độc lập, chống xử lý trùng và regression. Không làm trước G4/G5; chưa triển khai/chưa chạy thì NOT RUN. Không Supabase/backend.

Ngày 11/11/2026. **NOT STARTED**. Roadmap đã được cho phép qua chỉ đạo tiếp tục P02; phase này chưa triển khai. Giữ dependency, review phase trước và quyết định chặn module. Không commit/push/deploy khi chưa được cho phép.

## 1 Mục tiêu

Luồng thu mua từ nhập món, đối chiếu giá, duyệt/từ chối, chọn khách đến hoàn tất, cấp mã từng món và snapshot chi phí; tra cứu hai vai trò.

## 2 Nguồn và yêu cầu

UC_1.1, UC_1.2, UC_6. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

Mốc kiểm tra khi lập bản kế hoạch này: branch `coco/phase-5-staff`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`, working tree đang chứa thay đổi G3–G5 chưa commit. [Rà soát G5](../phase5/REVIEW_COMPLETION.md) ghi lần chạy trước **101 unit/integration + 52 Chromium, lint/typecheck/build và 5 static audit PASS**; đây là kết quả đã chạy ở lượt trước, không phải kiểm thử chạy lại trong lượt lập kế hoạch. G5 vẫn READY FOR REVIEW, chưa có kết luận DONE mới. Source đã có permission `purchases.read/create` cho hai role và `approvals.read/decide` chỉ owner, nhưng chưa có module giao dịch/phê duyệt thực thi.

## 3 Màn hình và trạng thái local

SC008, SC009, SC010, SC011, SC012, SC013, SC014, SC015, SC016, SC017, SC018, SC019, SC020, SC021, SC022, SC023, SC024, SC025, SC026, SC027, SC028, SC029, SC030, SC031, SC032, SC033, SC034, SC035, SC036, SC130, SC131, SC132, SC133, SC134, SC135, SC136, SC137, SC138, SC139, SC140, SC141, SC142, SC143, SC144, SC199, SC200, SC201, SC202, SC203, SC204, SC205, SC206, SC207, SC208, SC209, SC210, SC211, SC212, SC213, SC214, SC215, SC216, SC217, SC218, SC219, SC220, SC221, SC222, SC223, SC224, SC225, SC226, SC227, SC228

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

| Nhóm triển khai | Vai trò | Trạng thái nguồn cần đối chiếu |
|---|---|---|
| Danh sách/tìm kiếm thu mua | Chủ | SC008–SC015 |
| Chi tiết thu mua | Chủ | SC016–SC017 |
| Tạo thu mua, thêm món/đề xuất giá/chọn khách và các kết quả | Chủ | SC018–SC036 |
| Danh sách/chi tiết/duyệt/từ chối/lỗi gửi kết quả | Chủ | SC130–SC144 |
| Danh sách/tìm kiếm thu mua | Nhân viên | SC199–SC207 |
| Chi tiết thu mua | Nhân viên | SC208–SC209 |
| Tạo thu mua, các popup và validation | Nhân viên | SC210–SC228 |

Tổng **74 SC thuộc G6**, dùng chung route/component theo trạng thái, không tạo 74 trang. Luồng thêm khách trong giao dịch (SC033 và trạng thái tương ứng phía nhân viên) tái sử dụng service/validation G4; review cả UI18/SC080–SC085 và SC273–SC278 khi tái sử dụng. Các SC khách hàng này vẫn thuộc G4, không đổi phạm vi phase hoặc coi là module mới phải làm lại.

## 4 Chức năng phải thực hiện

Luồng thu mua từ nhập món, đối chiếu giá, duyệt/từ chối, chọn khách đến hoàn tất, cấp mã từng món và snapshot chi phí; tra cứu hai vai trò. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

Luồng bàn giao chính: người dùng thêm món → hệ thống tìm khung giá → nhập giá; nếu vượt Max thì tự tạo yêu cầu chờ duyệt → chủ duyệt hoặc từ chối có lý do → người tạo nhận trạng thái/lý do không F5 → chọn/tạo khách thật → lưu hoàn tất → tra cứu hóa đơn và lịch sử khách. Cả chủ và nhân viên được tạo/đọc thu mua theo SRS; chỉ chủ quyết định yêu cầu. Không tự cho giá vượt Max đi thẳng khi người tạo là chủ, không tự thêm quy tắc bốn mắt hoặc giới hạn xem “chỉ giao dịch của mình” khi SRS không quy định.

G6 chỉ tạo dữ liệu hàng hóa do giao dịch thu mua hoàn tất. UI quản lý hàng/sửa giá/scheduler vẫn G7; bán hàng/ưu đãi/QR vẫn G8; báo cáo/dashboard vẫn G9. Không thêm backend, Supabase, AI thẩm định, đồng bộ đa máy hoặc dữ liệu mẫu sản phẩm vào runtime.

## 5 Component xây hoặc tái sử dụng

| Nhóm | Component dự kiến |
|---|---|
| UI03 / Danh sách giao dịch thu mua | PurchaseSearchTable |
| UI04 / Chi tiết giao dịch thu mua | PurchaseDetail |
| UI05 / Tạo giao dịch thu mua | PurchaseEditor |
| UI06 / Nhập thông tin sản phẩm thu mua | PurchaseItemDialog |
| UI07 / Nhập giá thu mua đề xuất | PurchasePriceDialog |
| UI28 / Danh sách yêu cầu phê duyệt | ApprovalSearchTable |
| UI29 / Thông tin yêu cầu phê duyệt | ApprovalDetail |
| UI30 / Nhập lý do từ chối | RejectionReasonDialog |

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

hoaDonThuMua, chiTietHoaDonTM, sanPham, productCosts, yeuCauPheDuyetGia, notifications, khachHang; draft/approval/finalization metadata dự kiến. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

Tái sử dụng `src/services/reference-data/{local,contracts}.ts`, `CustomerForm`, auth/permission và repository G2. Session tab tiếp tục dùng `coco:session` trong sessionStorage; không lưu một tài khoản hiện hành chung trong localStorage. Request/status/event lưu chung IDB, không phân DB theo role. Phương án store/marker mới trong DATA_CONTRACT_REVIEW là đề xuất chờ chốt, không phải schema được tự áp dụng.

Quyết định duyệt và bản ghi thông báo chờ phát được ghi bền trong cùng transaction; việc phát tín hiệu sang tab khác diễn ra sau commit. Lỗi lưu quyết định phải rollback, còn lỗi phát kết quả sau commit không được giả rằng quyết định chưa lưu hoặc cho duyệt lần hai. T03/T04 phải thể hiện đúng hai loại lỗi này theo UC6 bước 7a/9a: SC136/SC143 cho lỗi lưu, SC137/SC144 cho lỗi gửi. SC135/SC142 là yêu cầu không còn đủ điều kiện, phải được kiểm riêng.

Thử phát lại thông báo là cơ chế kỹ thuật dựa trên event bền, chẳng hạn khi mở lại màn hình/đăng ký lại subscription, không phải một lần quyết định mới. SC137/SC144 chỉ có nút đóng X; không tự thêm nút “Thử gửi lại” hoặc thay popup nguồn. Kiểm thử phục hồi dùng thao tác UI có thật để mở lại màn hình và kiểm event cũ được nhận đúng một lần.

## 7 File dự kiến tác động

src/features/purchases/, src/features/approvals/, src/services/purchases.ts, src/services/approvals.ts, src/domain/purchase*.ts, src/db/ (migration theo hợp đồng được duyệt trước task phụ thuộc), tests/unit/purchases*, tests/e2e/purchase-approval*. Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

Tích hợp dự kiến: `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx`, `src/repositories/constraints.ts`, adapter lịch sử trong `src/services/reference-data/local.ts` và test hồi quy liên quan. Chỉ sửa khi task cần; không viết lại auth, schema G2 hoặc CRUD G4/G5. Dùng lại `PaginatedTable`, `Pagination`, `useListPageSize`, `Field`, `FormDialog`, `ResultDialog`; dùng `ConfirmDialog` khi kiểu nguồn phù hợp. Giữ phân trang nhỏ/căn giữa cuối nội dung, số dòng thích ứng viewport, không thêm cuộn dọc trong bảng, giữ trải nghiệm mở chi tiết và màu/font/logo đã tinh chỉnh.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [x] G6-T01 | Thiết kế draft và snapshot theo P03/P04; định nghĩa pending/approved/rejected/finalized/cancelled có mapping rõ, chưa tính draft vào báo cáo | Nguồn UC/BR/SC + code G2 và task trước trong phase | hợp đồng dữ liệu, migration additive, không đòi tạo giao dịch hoàn tất để có yêu cầu duyệt | src/features/purchases/, src/features/approvals/, src/services/purchases.ts, src/services/approvals.ts, src/domain/purchase*.ts, src/db/ (migration theo hợp đồng được duyệt trước task phụ thuộc), tests/unit/purchases*, tests/e2e/purchase-approval* | TC-P6-DRAFT-FK; TC-P6-MIXED-PRICE |
| [ ] G6-T02 | Nhập loại/brand/tình trạng/quantity, tìm khung giá, validate giá >0; giá vượt Max tạo yêu cầu, giữ món pending | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI05/06/07; PurchaseDraftService kiểm quyền | src/features/purchases/, src/features/approvals/, src/services/purchases.ts, src/services/approvals.ts, src/domain/purchase*.ts, src/db/ (migration theo hợp đồng được duyệt trước task phụ thuộc), tests/unit/purchases*, tests/e2e/purchase-approval* | TC-UC1-1-MAIN; TC-UC1-1-ALT-01 |
| [ ] G6-T03 — triển khai xong, chờ review/nghiệm thu | Owner-only duyệt/từ chối một yêu cầu pending; lý do từ chối bắt buộc; lưu request + reason snapshot + thông báo chờ phát atomically, phân biệt lỗi phát sau commit | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI28–30, ApprovalService với expectedVersion và phát kết quả có thể thử lại | src/features/approvals/ApprovalsPage.tsx, src/services/purchase-approvals.ts, tests/unit/purchase-approvals.test.ts, tests/e2e/purchase-approvals.spec.ts | TC-BR-UC6-01..06; TC-P6-APPROVAL-RACE; bằng chứng T03_SERVICE_PROGRESS.md |
| [ ] G6-T04 — đã triển khai, chờ review | Nhân viên nhận thông báo local, xem kết quả, sửa giá sau từ chối; không hoàn tất khi còn món pending/rejected chưa xử lý | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI/notifications read state; log/ảnh và giới hạn tại T04_EXECUTION.md | src/features/purchases/PurchaseResults.tsx, PurchaseEditor.tsx, src/services/purchase-drafts.ts, tests/e2e/purchase-results.spec.ts | TC-P6-PENDING-BLOCK; TC-P6-REJECTION |
| [ ] G6-T05 — đã triển khai/QA đạt, chờ nghiệm thu | Hoàn tất: một command lưu hóa đơn, chi tiết, từng món, snapshot cost và paidAt/finalizedAt; mã không trùng/reuse; kiểm rollback tất cả | Nguồn UC/BR/SC + code G2 và task trước trong phase | Finalizer runtime, mapping 1/1/2, UI thật hai vai trò, bằng chứng T05_EXECUTION.md | src/services/purchase-finalization.ts, src/domain/purchase-status.ts, PurchaseEditor.tsx, tests/unit/purchase-finalization.test.ts, tests/e2e/purchase-finalization.spec.ts | TC-P6-FINALIZE-ATOMIC; TC-P6-DOUBLE-SUBMIT |
| [ ] G6-T06 | Tra cứu multi-filter/pagination/reset, chi tiết read-only; cập nhật lịch sử khách hàng và dữ liệu inventory | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI03/04 và tích hợp history G4 | src/features/purchases/, src/features/approvals/, src/services/purchases.ts, src/services/approvals.ts, src/domain/purchase*.ts, src/db/ (migration theo hợp đồng được duyệt trước task phụ thuộc), tests/unit/purchases*, tests/e2e/purchase-approval* | TC-UC1-2-MAIN; TC-P6-HISTORY |
| [ ] G6-T07 | Chạy demo hai tab qua UI thật theo yêu cầu A–F; giữ session độc lập, live update request, CAS/idempotency và owner-only; full regression | G4/G5, G6-T01–06 và DEMO_ACCEPTANCE.md | purchase-approval.spec.ts, screenshot hai role, kết quả từng A–F, hướng dẫn giảng viên | tests/e2e/purchase-approval.spec.ts, planning/phase6/REPORT_PHASE_6.md | TC-G6-DEMO-A..F |

### Chi tiết thực thi theo từng task đã có

| Task, theo đúng thứ tự | Đầu vào cần đủ | Công việc và đầu ra phải kiểm được |
|---|---|---|
| T01 — hợp đồng/migration | Điều kiện chuyển G5; quyết định P03/P04 | Ghi schema/version/PK/FK, adapter legacy/new, phân quyền read/write, namespace trạng thái và chuyển trạng thái, snapshot giá/actor/time; giữ lý do đề xuất khác lý do từ chối. Phân biệt draft chưa có khách với hóa đơn hoàn tất. Thiết kế command ID, expectedVersion, cancellation và retry/reload trước khi viết migration additive. Đầu ra: contract đã chốt, migration trên DB test có sentinel không mất dữ liệu và test mixed-price 80.001 + 120.000 = 200.001 đồng. |
| T02 — tạo draft/nhập món | T01; cách thực hiện BR-UC1-07/Q20 | UI05–07 theo hai role; loại/brand/độ mới bắt buộc, số lượng nguyên dương, giá nguyên đồng dương theo validation hiện có; tìm bracket đúng tổ hợp, xử lý không có bracket/lỗi đọc. Giá vượt Max tự tạo đúng một request cho phiên bản dòng; double click/reload không nhân đôi. Giá bằng Max có test riêng; không tự thêm luật giá dưới Min khi nguồn chưa quy định. Không nhập kho/ghi chi phí lúc pending. |
| T03 — chủ xử lý | T02 đã tạo request thật; contract snapshot/CAS T01 | UI28–30: danh sách chờ/empty/error, chi tiết snapshot sản phẩm/khung giá/giá đề xuất. Duyệt/từ chối chỉ pending; lý do từ chối không trắng và đúng giới hạn dữ liệu; Hủy không ghi. Quyết định + actor/time/reason + event bền + audit/receipt cùng transaction. Kiểm staff gọi route/service, stale/version, hai chủ cùng xử lý, lỗi lưu quyết định và lỗi phát sau commit. |
| T04 — kết quả ở người tạo | T03 | Subscription/live query hoặc cơ chế tương đương; hiển thị đúng request/line, trạng thái và lý do, không F5. Thử phát lại cùng event không tạo quyết định/thông báo trùng. Từ chối quay lại nhập giá theo SRS; sửa dòng không được dùng duyệt của giá/số lượng/khung giá cũ. Hoàn tất bị chặn khi còn món chưa đủ điều kiện. |
| T05 — chọn khách/hoàn tất | T04; mapping finalized snapshot và giá/trạng thái hàng ban đầu | Tìm khách theo phone, chọn hồ sơ; không có thì mở form G4 tạo khách, Hủy không tạo; chống trùng phone khi hai tab cùng tạo. Chỉ lưu với khách thật và ≥1 món đủ điều kiện. Một command lưu hóa đơn, chi tiết/dòng theo contract, đúng số sản phẩm có mã riêng, cost từng món, ngày nhập/cycle và finalized/paid snapshot; tổng tiền bằng tổng các dòng. Retry sau mất phản hồi/double click không tăng stock hai lần; lỗi bất kỳ bước nào rollback toàn bộ command. |
| T06 — tra cứu/tích hợp | T05 | UI03/04 cho hai role: mã/phone/tên/ngày, kết hợp điều kiện, reset và pagination thật. Dùng ngày Việt Nam theo contract chung. Detail readonly hiển thị dữ liệu/snapshot đã lưu; phân biệt legacy chưa biết ý nghĩa trạng thái. Lịch sử khách đọc được hóa đơn vừa tạo, không cộng draft vào hóa đơn hoàn tất và không đếm cả bản legacy lẫn bản mới của cùng giao dịch. |
| T07 — nghiệm thu | T01–T06 | Chạy A–F bằng UI thật trong một context/hai tab; các ca lỗi/race/rollback/migration; full regression G2–G5, lint/typecheck/build/audit; ảnh hai role và các trạng thái nguồn, console không có lỗi ngoài lỗi test đã xử lý. Ghi kết quả thực thi, hướng dẫn demo và tất cả điểm còn mở vào REPORT_PHASE_6.md; không tự DONE nếu còn gate chưa đạt. |

## 9 Thứ tự và dependency

G3, G4 và tài khoản G5; quyết định P03/P04, Q20 và hợp đồng trạng thái. Làm T01 → T02 → ... theo thứ tự bảng, mỗi task có test trước khi tích hợp. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

| Điều kiện / phạm vi | Cần chốt hoặc xác minh | Cách xử lý khi chưa đủ |
|---|---|---|
| Chuyển từ G5 | Review checklist/bằng chứng G5 và ghi kết luận chuyển tiếp; không tự sửa G5 thành DONE | Vẫn được chuẩn bị kế hoạch/traceability, không coi lập plan là nghiệm thu. Không kéo toàn bộ 297 visual G10 lên thành task G6. |
| P03/P04, trước T01 migration | Draft chưa có khách và dòng cùng bracket khác giá; schema/adapter/FK mới theo [DATA_CONTRACT_REVIEW](DATA_CONTRACT_REVIEW.md) | Chỉ ghi đề xuất, chưa sửa schema/validator hoặc tạo hóa đơn/khách giả. Không lấy bình quân/giá đầu để lấp composite key cũ. |
| Q20/P09 | CLOSED: nhân viên kiểm tra thực tế trước khi nhập, hàng không đạt từ chối ngoài hệ thống | Không có chức năng kiểm định; không thêm checklist/control/bảng/trạng thái hoặc tự loại theo mã 1/2/3. Giữ 3=Mới/2=Tốt/1=Khá. Checklist QA/test phần mềm vẫn áp dụng từng task. |
| Snapshot P05 và mapping hàng đầu vào, trước T05 | Giá bán đầu đã duyệt: cost thực tế từng món ×1,30, nearest/half-up; đối chiếu `NgayThuMua/TongTienTM`, finalizedAt/paidAt và mapping trạng thái/ngày chu kỳ | Hai trường giá đầu cùng giá tính bằng hàm đã kiểm thử; không hỏi lại công thức/làm tròn. Mapping numeric status cho bản ghi mới và command finalize/legacy FK còn OPEN trước kích hoạt; không tự diễn giải lại legacy hoặc coi validator fixture là finalize đã xong. |
| Bracket/dòng thay đổi khi chờ, trước tích hợp T03–T05 | Snapshot/version nào đang được duyệt; xử lý request cũ khi đổi giá/số lượng/bracket hoặc Hủy draft | Mô tả và đối chiếu SRS trong contract T01; nếu còn lựa chọn làm thay đổi nghiệp vụ thì xin quyết định trước nhánh phụ thuộc, không âm thầm tái sử dụng duyệt cũ hoặc tự duyệt. |

Không đòi chốt các quyết định G7/G8/G9 chưa liên quan để hoàn thành việc độc lập đã rõ trong G6. Yêu cầu lập kế hoạch không phải cho phép commit, push, deploy hoặc reset dữ liệu.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_1.1, UC_1.2, UC_6; BR liên quan và mọi control test thuộc SC008, SC009, SC010, SC011, SC012, SC013, SC014, SC015, SC016, SC017, SC018, SC019, SC020, SC021, SC022, SC023, SC024, SC025, SC026, SC027, SC028, SC029, SC030, SC031, SC032, SC033, SC034, SC035, SC036, SC130, SC131, SC132, SC133, SC134, SC135, SC136, SC137, SC138, SC139, SC140, SC141, SC142, SC143, SC144, SC199, SC200, SC201, SC202, SC203, SC204, SC205, SC206, SC207, SC208, SC209, SC210, SC211, SC212, SC213, SC214, SC215, SC216, SC217, SC218, SC219, SC220, SC221, SC222, SC223, SC224, SC225, SC226, SC227, SC228. Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

| Bộ kiểm thử dự kiến | Oracle bắt buộc | Trạng thái khi lập plan |
|---|---|---|
| Unit | Miền giá/số lượng/độ mới, tổng tiền, bảng chuyển trạng thái, role, điều kiện finalize; expected tính độc lập | NOT RUN cho G6 |
| Integration với IDB | Migration bảo toàn sentinel/legacy; FK mới/cũ đúng; mixed-price; command receipt; quyết định/finalize rollback kể cả audit; quyết định đã commit không bị đảo do lỗi phát | NOT RUN cho G6 |
| E2E thu mua | Hai role nhập/giá vượt Max/chọn hoặc tạo khách/Hủy/validation/finalize/search/detail/history; dữ liệu mục tiêu qua UI thật | NOT RUN |
| E2E A–F | Phê duyệt, từ chối, session riêng, live update không F5, chống xử lý trùng, regression theo DEMO_ACCEPTANCE | NOT RUN; C/F nền G2–G5 đã có bằng chứng lịch sử, chưa tính PASS tích hợp G6 |
| Lỗi riêng UC6 bước 9a | Sau khi lưu quyết định, tiêm lỗi phát kết quả → hiện “Kết quả phê duyệt chưa được gửi đi”; retry chỉ phát lại, không thêm decision/audit quyết định và không đảo trạng thái | NOT RUN |
| UI/visual | 74 SC có mapping/bằng chứng; desktop 1366×768, 1440×900, 1920×1080; viewport hẹp/resize hồi quy; danh sách 0/1/9/10/25 bản ghi, pagination thích ứng và không cuộn trong bảng | NOT RUN cho UI G6; không tự duyệt ngưỡng pixel |
| Console và bảo toàn dữ liệu | Không pageerror/console error ngoài lỗi được kiểm soát; Hủy/validation/stale/rollback không làm sai DB; retry/reload không tăng số món/hóa đơn/yêu cầu | NOT RUN |

Sau từng task chạy unit/integration và Chromium liên quan, sửa lỗi rồi chạy lại. Sau thay schema/contract/quyền chạy regression nền dữ liệu/auth/reference/staff; trước bàn giao T07 chạy toàn bộ suite. Dùng DB/context test riêng; hai tab demo cùng context/origin, không fixture trực tiếp request/decision thay luồng UI cần nghiệm thu.

Lệnh dự kiến khi triển khai (ghi exit code và số PASS/FAIL/NOT RUN thực tế, chưa thực thi lại ở lượt lập plan):

```powershell
npm run lint
npm run typecheck
npm test
node scripts/audit-phase1.mjs
npm run build
$env:CI='true'
npm run test:e2e -- --reporter=line --retries=0 --global-timeout=300000
```

Nếu cần tăng thời gian toàn suite vì có thêm test, ghi rõ lý do/giới hạn harness; không tăng ngưỡng nghiệp vụ hoặc bỏ assertion để che lỗi. Script audit hiện ghi evidence G5; khi code G6 phải đổi nơi ghi/scope evidence đúng phase và giữ snapshot lịch sử.

## 11 Edge case và failure case

Thay bracket khi đang đợi duyệt; hai owner xử lý cùng yêu cầu; hủy draft; hai món cùng bracket khác giá; không có khách/món; lỗi nhận thông báo; retry sau reload; stock không tăng hai lần. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

3 UC qua main/alternative/exception; chỉ owner quyết định giá; pending không nhập kho/không tính chi phí; đúng số món thực tế có mã riêng/cost riêng; finalize và approval rollback/idempotent; mọi trạng thái SC theo nguồn local được kiểm. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

FK request → invoice và composite key dòng thu mua hiện chưa biểu diễn trọn draft/mixed-price. Giải bằng mapping được duyệt, không âm thầm bỏ FK hoặc tự lấy trung bình giá. Giảm thiểu: đọc đúng role/source, làm migration additive với sentinel, test lỗi giữa transaction, không chỉnh screenshot baseline để che sai lệch. Các vấn đề chưa chốt giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_6.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

Gói bàn giao T07 gồm: checklist T01–T07; contract và quyết định được duyệt; `TEST_EXECUTION.md`; manifest hash source/test chưa commit hoặc SHA commit thực tế; ảnh danh sách/form/chi tiết/approval của hai role, ảnh trước/sau quyết định và trạng thái lỗi; kết quả từng A–F; demo giảng viên từ tạo staff/khách/bracket bằng UI đến gửi/duyệt/hoàn tất/tra cứu; URL localhost và câu lệnh mở. Không chuẩn bị credential mặc định hoặc gọi hình mẫu là bằng chứng chạy.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

Checklist gate, không đánh dấu chỉ vì đã có kế hoạch:

- [ ] Kết luận chuyển tiếp G5 được ghi nhận, các quyết định đúng phạm vi T01/T02/T05 đã đủ.
- [ ] T01–T07 hoàn thành; UC_1.1/UC_1.2/UC_6 đủ luồng chính, phụ, lỗi, quyền và dữ liệu.
- [ ] A–F thực thi PASS, hai tab không ghi đè phiên, không có quyết định/nhập kho/hóa đơn trùng.
- [ ] Migration/legacy/mixed-price/snapshot/rollback/notification-delivery có bằng chứng đúng nguồn.
- [ ] UI được đối chiếu CODEX cho hai vai trò, giữ pagination/popup/desktop detail đã chỉnh; không công bố pixel PASS chưa đo/duyệt.
- [ ] Full regression, lint, typecheck, build, audit PASS; không còn blocker; report/evidence được review.

Sau khi G6 đạt điều kiện chuyển tiếp, giai đoạn kế tiếp giữ nguyên là **G7 — Hàng hóa và scheduler tồn lâu**, không tự bắt đầu G7 trong scope G6.

## 16 Git, CI và regression

Khi bắt đầu code, xác định nhánh/checkpoint phù hợp và giữ nguyên các thay đổi đang có; lượt lập plan không đổi branch. Không force/reset/ghi đè thay đổi khác. Chỉ commit/push/merge/deploy khi có cho phép. Workflow main hiện có vẫn install/lint/typecheck/unit/audit/build/Chromium trước deploy; chỉ điều chỉnh những bước cần để chạy test G6, không tự đổi quyền Pages/Actions. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
