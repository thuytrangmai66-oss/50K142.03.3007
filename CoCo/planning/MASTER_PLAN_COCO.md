# Master plan phát triển CoCo

> Cập nhật T05–T06 ngày 13/11/2026: đã nối lịch sử mua của khách với snapshot hóa đơn bán, tái sử dụng UI09 và chế độ in Ctrl+P; bổ sung kiểm thử điểm nhiều tab, scheduler/QR, rollback và reload. 345/345 unit/integration, lint/typecheck/build PASS; full Chromium cuối 125 PASS / 1 FAIL (phục hồi lịch sử thu mua). Đã dừng trước staging/commit/push theo chỉ đạo mới. T06 còn lỗi kiểm chứng; xem [báo cáo T06](phase8/T06_EXECUTION.md); chưa nghiệm thu G8. Các mốc phía dưới giữ làm lịch sử.

> Sửa Bán hàng theo yêu cầu mới ngày 13/11/2026: D05 tự động ưu đãi thay checkbox; danh sách/chi tiết, tìm kết hợp và thanh nhập/quét mã UI10 đã có. P05/schema/mapping không đổi. Kiểm chứng 339 unit/integration, 123 full Chromium; sau chỉnh màu/spacing cuối, 19 Chromium liên quan, lint/typecheck/build PASS. [Báo cáo sửa module](phase8/SALES_FIGMA_SRS_FIX.md). Không đổi roadmap hoặc tự DONE G8; phần T05 còn lại/T06 vẫn theo plan.

> G8 cập nhật 13/11/2026 sau chỉ đạo tiếp tục: P05 physical snapshot và mã hóa đơn mới đã được chủ dự án xác nhận; T03 QR cục bộ và T04 thanh toán atomic đã triển khai, nối phần điểm của T02. Kiểm chứng cuối 330/330 unit/integration, 119/119 Chromium, lint/typecheck/build PASS. T02–T04 PENDING REVIEW; G8 chưa DONE; T05/T06 tiếp theo theo thứ tự cũ. [Báo cáo T03–T04](phase8/T03_T04_EXECUTION.md). Ghi chú tiến độ cũ phía dưới giữ làm lịch sử, không thay đổi roadmap hoặc ngoại lệ G6/G7.

> Cập nhật13/11/2026: đã nhận nghiệm thu người dùng cho phần G7 đã triển khai; [phạm vi/ngoại lệ](phase7/ACCEPTANCE_2026_11_13.md). G8-T01 phần giỏ nháp/snapshot độc lập đã được triển khai và kiểm thử, hiện **PENDING REVIEW**; G8 chưa hoàn tất. P05/P06/P07 và các ngoại lệ G7/G6 vẫn mở; không tự ghi toàn G7/G8 DONE hoặc miễn trừ SRS. Xem [báo cáo G8](phase8/REPORT_PHASE_8.md).

> Tiếp quản G7, 13/11/2026: branch `coco/phase-7`, HEAD `22d3fbd`; lúc kiểm kê có 16 tracked modified, 1811 untracked, không có staged changes. Giữ nguyên toàn bộ. T01 query/detail và T02–T06 runtime/test đã có; full revalidation hiện tại 298/298 unit, 107/107 Chromium, lint/typecheck/build PASS. G7 vẫn **IN PROGRESS / PARTIAL / PENDING REVIEW** vì barcode chưa có payload/mapping và các gate nghiệm thu còn mở; G6 vẫn PENDING REVIEW. Xem [báo cáo tiếp quản G7](phase7/REPORT_PHASE_7.md) và [evidence mới](phase7/evidence/handoff-current/). Không tự DONE G6/G7 hoặc chuyển G8.

> T07 ngày 12/11/2026: đã chạy gói kiểm chứng cuối G6 (249 unit/integration, 95 Chromium PASS; audit FAIL), không thêm chức năng hoặc đổi thứ tự. **T05/T06/T07/G6 PENDING REVIEW**; hai trường UI BR-UC1-16 BLOCKED và dependency audit FAIL. [Bằng chứng và ngoại lệ T07](phase6/T07_EXECUTION.md), [bảng nghiệm thu UC/BR](phase6/G6_ACCEPTANCE_MATRIX.md). Không tự DONE hoặc chuyển G7; ghi chú tiến độ phía dưới là lịch sử.

> Cập nhật T06 ngày 12/11/2026: đã triển khai tra cứu/chi tiết/lịch sử; **T05 và T06 PENDING REVIEW, G6 IN PROGRESS**. Hai trường Nhân viên/Trạng thái trong chi tiết **BLOCKED** theo lựa chọn giữ Figma. [Báo cáo và kết quả thực thi T06](phase6/T06_EXECUTION.md). Thứ tự tiếp theo vẫn T07, chưa chuyển G7. Các ghi chú T06 PARTIAL/NOT STARTED bên dưới là lịch sử.

## Cập nhật G6 hiện hành

T05 đã hoàn tất triển khai runtime và QA theo chỉ đạo hoàn thành phần còn lại, dùng bảng mã đề xuất 1/1/2. [Báo cáo T05](phase6/T05_EXECUTION.md) ghi cách hiểu chỉ đạo, source, 233 unit/integration + 88 Chromium PASS, ảnh và demo. T05 PENDING REVIEW; G6 IN PROGRESS và tiếp theo là T06/T07. Các mục T05 chưa kích hoạt phía dưới thuộc lịch sử candidate.

T05 hiện IN PROGRESS / PARTIAL theo [báo cáo candidate](phase6/T05_CANDIDATE_PROGRESS.md). Đã có transaction và kiểm chứng độc lập, source UI chuẩn bị. Mapping mã số trạng thái còn OPEN nên runtime Lưu và E2E luồng hoàn tất thật tiếp tục chờ xác nhận; chưa chuyển T06/G7.

T04 đã được triển khai theo chỉ đạo tiếp tục ngày 12/11/2026. [Báo cáo T04](phase6/T04_EXECUTION.md) ghi nhận kết quả/lý do hai tab, nhập lại giá và hồi quy 211 unit/integration + 80 Chromium PASS. G6 IN PROGRESS, T04 chờ review/nghiệm thu UI. Task kế tiếp là T05; mapping số trạng thái mới được đối chiếu trước hoàn tất dữ liệu. Các ghi chú T04 chưa triển khai bên dưới thuộc mốc trước lượt này.

Ngày 12/11/2026, đã triển khai phần còn lại của T03 theo chỉ đạo trực tiếp. Danh sách/chi tiết/phê duyệt/từ chối của chủ và kiểm thử được ghi tại [báo cáo T03](phase6/T03_SERVICE_PROGRESS.md). T03 chờ review/nghiệm thu. T04 là task kế tiếp trong cùng G6, gồm thông báo kết quả/lý do ở nhân viên và nhập lại giá sau từ chối. Ghi chú T03 chưa có UI và A–F NOT RUN phía dưới thuộc mốc trước T03, xem báo cáo mới để phân biệt phần đã kiểm chứng và demo đầy đủ còn thiếu.

Ngày 11/11/2026, người dùng xác nhận: **“Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”**. T01 đã được nghiệm thu; P03/P04 runtime APPROVED_USER. Không suy ra nghiệm thu G5 hoặc toàn bộ G6 từ xác nhận này.

Runtime IndexedDB đã nâng additive lên v4/27 store; T02 đã triển khai theo [báo cáo](phase6/T02_EXECUTION.md), chờ nghiệm thu. T03 là task tiếp theo sau T02, không đổi roadmap hoặc tự DONE G5/G6. Demo hai tab duyệt/từ chối A–F vẫn NOT RUN cho đến T03/T04/T07. Các mục P03/P04 “chưa phê duyệt” trong hồ sơ lịch sử dưới đây đã được thay thế; mapping số cho bản ghi mới trước T05 và các quyết định nghiệp vụ khác vẫn OPEN khi chưa chốt.

## Hồ sơ trước xác nhận T01 — lịch sử

Các ghi chú chưa kích hoạt/chưa có UI bên dưới mô tả mốc trước xác nhận, không thay trạng thái hiện tại ở trên.

> Lượt tiếp tục T01 mới nhất: đã hoàn thiện selector FK theo metadata mới và adapter từ chối marker hỏng, giữ nguyên FK legacy khi không có marker. **154 unit/integration + 54 Chromium PASS**, code/UI runtime vẫn chưa kích hoạt P03/P04. [Gói review T01](phase6/T01_REVIEW_GATE.md) tách rõ phần contract/foundation T01 với producer/UI task sau. G6 vẫn IN PROGRESS, G5/G6 chưa tự DONE; xem [báo cáo mới](phase6/T01_FK_REVIEW_EXECUTION.md).

> Xác nhận và lượt tiếp tục T01 mới nhất: chỉ hoàn thiện candidate, **chưa kích hoạt P03/P04**; BR-UC1-07 do nhân viên kiểm tra trực tiếp ngoài app, không có module kiểm định; giá bán đầu = cost từng món ×1,30, nearest/half-up. T01 bổ sung adapter/FK/provenance/transaction foundation, 145 unit/integration + 53 Chromium PASS; xem [báo cáo G6](phase6/REPORT_PHASE_6.md) và [checklist QA](phase6/ACCEPTANCE_CHECKLIST.md). G5/G6 không tự DONE, UI G6/demo A–F vẫn NOT RUN, không đổi UI hiện có hoặc push/deploy. Các ghi chú Q20/giá còn thiếu bên dưới là lịch sử đã được thay thế.

> Theo chỉ đạo bắt đầu giai đoạn tiếp: G6 **IN PROGRESS — T01 PARTIAL**, đã code/test contract và migration candidate trong DB kiểm thử; chưa kích hoạt runtime hoặc triển khai UI G6. [Báo cáo G6](phase6/REPORT_PHASE_6.md) phân biệt 120 unit/integration PASS và 52 regression Chromium PASS với demo G6 chưa chạy. P03/P04/Q20 và nguồn giá bán ban đầu còn chờ xác nhận; các ghi chú lập plan trước đó là lịch sử. Không tự chuyển G5/G6 sang DONE.

> Theo yêu cầu lập kế hoạch giai đoạn tiếp theo: đã cụ thể hóa [G6-T01–T07](phase6/PLAN_PHASE_6.md) thành dependency, đầu ra và kiểm thử có thể nghiệm thu; giữ nguyên thứ tự/phạm vi. G5 vẫn READY FOR REVIEW, code G6 vẫn NOT STARTED; P03/P04/Q20 và mapping dữ liệu còn thiếu trước T05 chưa tự được phê duyệt. Lượt lập plan không sửa source hoặc chạy lại kiểm thử sản phẩm.

> Rà soát trạng thái 11/11/2026: G5 là phase có source gần nhất, vẫn READY FOR REVIEW; chưa có kết luận DONE G5. Đã bổ sung phần UI/test còn thiếu và bằng chứng SC145–162 tại [biên bản rà soát G5](phase5/REVIEW_COMPLETION.md). G6 là phase kế tiếp, chưa code; phương án cần quyết định P03/P04/Q20 tại [hợp đồng G6](phase6/DATA_CONTRACT_REVIEW.md). Không thay roadmap/thứ tự/kiến trúc local hoặc tự push/deploy.

> Cập nhật sau chỉ đạo G5 11/11/2026: ưu tiên **web desktop**, không phát triển thêm điện thoại. Đã sửa mở chi tiết đúng vùng đọc, giữ sidebar/header, và triển khai quản lý nhân viên G5 theo SRS; [báo cáo G5](phase5/REPORT_PHASE_5.md) READY FOR REVIEW. P08 dùng transaction rename/alias giữ MaNV, không viết lại schema. Vẫn local/no Supabase, không commit/push/deploy. Nhánh hiện tại `coco/phase-5-staff`; các snapshot G3/G4 bên dưới là lịch sử.

> Trạng thái sau chỉ đạo G4 ngày 11/11/2026: giữ local IndexedDB/sessionStorage, **không Supabase**; không đổi kiến trúc hoặc roadmap. G4 đã triển khai customer CRUD/history, owner bracket CRUD/filter và responsive, [báo cáo G4](phase4/REPORT_PHASE_4.md) READY FOR REVIEW. Danh mục 3=Mới/2=Tốt/1=Khá được duyệt, không tự đổi mã dữ liệu cũ. Bổ sung [test demo hai tab A–F](phase6/DEMO_ACCEPTANCE.md) đúng G6. Các mốc G3 và baseline bên dưới giữ làm lịch sử; nhánh local hiện tại `coco/phase-4-reference`, không commit/push/deploy.

Mốc sau G3 ngày 11/11/2026 (lịch sử): người dùng yêu cầu **“tiếp tục”** sau bản kế hoạch; ghi nhận cho phép dùng thứ tự G3–G11 (P02) và bootstrap một lần (P01). **G3 READY FOR REVIEW**: đã code auth/session/quyền/login/shell, 49 Vitest + 10 Chromium và lint/typecheck/build/audit PASS. Xem [báo cáo G3](phase3/REPORT_PHASE_3.md). Tại mốc đó chưa chuyển G4 và P03–P11 còn mở; cập nhật hiện tại nằm ở đầu tài liệu và OPEN_ISSUES.md. Chỉ đọc thiết kế CODEX local. Không commit/push/merge/deploy trong lượt coding này.

## A Tổng quan và nguồn

Ứng dụng demo local React 18/TypeScript/Vite/Tailwind, Dexie IndexedDB và GitHub Pages. UI/logic/repository tách lớp; không backend/Supabase/dịch vụ ngoài, không đồng bộ đa máy. Dữ liệu theo browser/origin, hai vai trò cùng browser dùng chung dữ liệu. AD01–AD08 giữ nguyên; cách đọc UI dùng bộ export local chủ và nhân viên thay cho Figma online.

Đã đọc SRS/Design gốc, 27 UC/98 BR/7 NFR, CODEX JSON và export local, source/tests/workflow và báo cáo G0–G2. Chi tiết nguồn/hash/phạm vi thực sự đọc ở [BASELINE_AUDIT.md](BASELINE_AUDIT.md). Không có file master/roadmap cũ sau G2 để khôi phục chính xác; G3–G11 được đề xuất trong lượt lập plan và nay được dùng theo chỉ đạo tiếp tục, không gọi đó là roadmap cũ đã khôi phục. Bảo toàn G0–G2, không đảo phase hoặc thêm nghiệp vụ.

Nguồn UI: `CODEX/.uc-ui-matrix-qa` và `CODEX/Figma.Chủ`, `CODEX/Figma.Nhân viên`; folder staff có bản owner lồng, đã đánh dấu. SRS/Design gốc quyết định nghiệp vụ/logic/schema; export UI quyết định hình thức theo vai trò. Mâu thuẫn phải ghi nguồn và xử lý theo OPEN_ISSUES, không âm thầm chọn phiên bản. Loại `.build` MotoCare. Không coi ảnh, tên `final/verified`, hoặc package đã cài là bằng chứng chức năng chạy.

## B Baseline trước G3 — giữ làm lịch sử khảo sát

- HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`, branch main, origin đúng repository đã cung cấp. Tracked tree sạch trước khảo sát, CODEX và bản rà soát nguồn đang untracked; không ghi đè chúng.
- Chạy lại lint/typecheck/build đều PASS; 27/27 data tests, 3/3 Chromium và 5/5 static audit PASS. CI hiện tại success đúng HEAD; Pages đọc HTTP 200, shell/reload/fallback và DB v20/20 store, không console/HTTP error trong profile kiểm thử.
- Giữ nền G2: 10 entity + metadata, migration giữ data, unique/FK, transaction rollback, version/tombstone/id giữ chỗ, idempotency. Không làm lại vì có nhu cầu UI.
- 0/27 UC được chứng nhận end-to-end. Chưa có auth/session/permission service, customer/bracket/account UI, thu mua/phê duyệt/kho/scheduler, sales/QR/điểm hoặc reports. HomePage là shell tự khai báo, không phải dashboard đã xong. Không có business production mock/seed để tạo cảm giác hoàn thiện.
- Các gốc rủi ro cần thiết kế: bootstrap, draft/FK, dòng mua khác giá cùng bracket, finalized time/totals, membership event, username rename identity, staff reset/làm tròn/quality/shortcut. Có issue cụ thể và phạm vi bị chặn, không phủ nhận nền dữ liệu đã tái PASS.

Trạng thái sau coding G3 khác baseline trên: nhánh local `coco/phase-3-auth`, HEAD chưa đổi; CoCoDB v3/21 store, auth/login và guard đã có. Chưa chứng nhận UC hoàn tất toàn bộ khi visual còn review. Bằng chứng mới tách trong báo cáo G3, không ghi đè baseline lịch sử.

## C Master roadmap

| Phase | Phạm vi | Dependency | Kiểm thử bắt buộc | Gate / trạng thái |
|---|---|---|---|---|
| G0 | Yêu cầu/kiến trúc đã duyệt | Nguồn chuẩn | Hồ sơ nguồn/AD/Q | DONE lịch sử; không triển khai lại |
| G1 | Khung app và CI/CD đã có | G0 | Baseline/smoke/CI | READY FOR REVIEW, kỹ thuật tái PASS |
| G2 | Nền dữ liệu v2 đã có | G1 | 27 data + migration thật | READY FOR REVIEW, kỹ thuật tái PASS |
| G3 | Auth/session/quyền, bootstrap, contracts và UI chung đủ cho login/shell | G0–G2, P01/P02 đã cho phép | Credential/bootstrap race/direct-call/route/revoke + UI01 | READY FOR REVIEW; kỹ thuật PASS, visual còn review |
| G4 | Khách hàng và khung giá, query lịch sử | G3; chỉ đạo G4 hiện tại | 9 UC, validation/unique/FK/search/hủy/role; hai tab/responsive | READY FOR REVIEW; kỹ thuật đạt, full visual/host tương lai chưa nghiệm thu |
| G5 | Tài khoản nhân viên | G3, P08 transaction rename/alias | 4 UC, staff-role forced/rename/inactive/revoke | READY FOR REVIEW; code/test đạt, full visual còn review |
| G6 | Thu mua + phê duyệt liên kết | G4/G5, P03/P04/Q20 | 3 UC, draft/decision/finalize atomic/races/history | IN PROGRESS — PENDING REVIEW; audit và UI gate còn mở |
| G7 | Hàng hóa + scheduler tồn lâu | G6, Q10/Q12/P10 | 3 UC, 29/30/44/45, catch-up, midnight, nhiều tab | IN PROGRESS — T01 PARTIAL; T02–T06 implemented, automated checks PASS, all PENDING REVIEW; barcode BLOCKED |
| G8 | Bán hàng + membership + QR cục bộ | G4/G6/G7, P05/P06/Q12 | 2 UC, tiền mặt/QR, points/stock atomic/races | IN PROGRESS — T01 PENDING REVIEW; P05/P06/P07 gates open; G8 not accepted |
| G9 | 5 báo cáo + dashboard hai vai trò | G6/G8 snapshots, G7 | 5 UC, VN period/zero/reconciliation/owner-only | NOT STARTED |
| G10 | Tích hợp, visual, security, NFR và hồi quy | G3–G9, P11/Q21 | Mọi required UC/BR/SC/NFR và cross-flow | NOT STARTED |
| G11 | Release Pages/rollback compatible/bàn giao | G10 và cho phép release | CI đúng SHA, production smoke, rollback dry run | NOT STARTED |

Roadmap/tiêu chí chi tiết: [PHASE_ROADMAP.md](PHASE_ROADMAP.md). G3 không bị mặc định thành "làm toàn bộ UI"; auth/quyền và contract là dependency đầu tiên. Thu mua/phê duyệt gộp G6 để xử lý vòng phụ thuộc draft một cách đúng dữ liệu. Dashboard đưa G9 vì số liệu phụ thuộc giao dịch thật; shell và các primitive xây G3. CI đã hoạt động từ giao diện đầu tiên, tiếp tục dùng trong mọi phase, không đợi G11.

## D Chi tiết có thể thực thi

Mỗi file bên dưới có 16 mục: mục tiêu, nguồn/UC, toàn bộ SC liên quan, chức năng, reuse component, entity/local service, file tác động, task với input/output/cách làm/test, dependency, unit/integration/E2E/visual/security, edge/failure, gate đo được, risk, bàn giao, chuyển tiếp và Git/CI. Mọi đường dẫn source tương lai được ghi là dự kiến.

- [G3 auth và nền chung](phase3/PLAN_PHASE_3.md)
- [G4 khách hàng/khung giá](phase4/PLAN_PHASE_4.md)
- [G5 tài khoản nhân viên](phase5/PLAN_PHASE_5.md)
- [G6 thu mua/phê duyệt](phase6/PLAN_PHASE_6.md)
- [G7 hàng hóa/scheduler](phase7/PLAN_PHASE_7.md)
- [G8 bán hàng/QR](phase8/PLAN_PHASE_8.md)
- [G9 báo cáo/dashboard](phase9/PLAN_PHASE_9.md)
- [G10 tích hợp/NFR/visual](phase10/PLAN_PHASE_10.md)
- [G11 release/bàn giao](phase11/PLAN_PHASE_11.md)

Không thêm nghiệp vụ chỉ vì có thư viện hoặc vì báo cáo cũ từng nói "chưa có". Backup/restore UI, cold-start offline, sync đa máy và tích hợp ngoài không được thêm vào phạm vi chính thức khi thiếu căn cứ/duyệt; giữ thông báo giới hạn AD03 và test dữ liệu nâng cấp.

## E Truy vết và độ bao phủ

- [REQUIREMENT_TRACEABILITY.md](REQUIREMENT_TRACEABILITY.md): 27 UC, 98 BR duy nhất và 7 NFR tách namespace; source → role/module → UI/SC/component → service/repo → TC → phase. Ghi rõ PARTIAL_DATA_ONLY khác hoàn thành business rule.
- [FIGMA_SCREEN_MAPPING.md](FIGMA_SCREEN_MAPPING.md): đủ 297 block, 38 nhóm và 370 export local. Phân loại đề xuất page/base, variant, validation/error, empty, success, modal, confirm và subflow; UI06/07 nhúng UI05, UI15 giám sát Q22. Không dựng 297 route.
- [TEST_CASE_CATALOG.md](TEST_CASE_CATALOG.md): 175 luồng/nhánh, 98 BR, 7 NFR, 928 mục điều khiển, 297 visual ID và các scenario race/transaction/release. Đây là testcase dự kiến, không claim đã có implementation hoặc PASS.
- [TEST_MASTER_PLAN.md](TEST_MASTER_PLAN.md): fixture/oracle/công cụ/viewport/threshold/gate/regression/production và quy trình review baseline.
- [SOURCE_INVENTORY.csv](SOURCE_INVENTORY.csv): checksum/role/geometry từng export. Chỉ mục không thay thế duyệt trực quan.

209/297 block có export sạch cùng tên/role theo đối chiếu tên, 88 block còn lại vẫn có frame QA; tên match chưa phải xác minh equivalence. G3 đã capture 12 trạng thái UI01, test hành vi và geometry; visual pixel baseline vẫn NOT RUN. 27 data tests G2 không phải tỷ lệ 27/27 UC. Không công bố phần trăm tiến độ/code coverage không đo được.

## F Quyết định và xung đột

Danh sách có phạm vi chặn ở [OPEN_ISSUES.md](OPEN_ISSUES.md), giữ nguyên [Q01–Q22 đã duyệt](phase0/OPEN_ISSUES.md). Hai điểm đã được cho phép khi người dùng yêu cầu tiếp tục:

1. P02: dùng thứ tự G3–G11 theo dependency sau khi không khôi phục được master cũ.
2. P01: bootstrap chủ một lần với form kỹ thuật nhập thông tin thật, không seed admin/password. Đã hiện thực G3 và kiểm race/rollback.

Trước G6 cần P03/P04/Q20; trước G7 cần staff reset/làm tròn/P10; trước G8 cần sự kiện membership và finalized snapshot; trước G10 chốt Q21/viewport/visual/SLA. Không hỏi lại kiến trúc, bank/account, thao tác Đã nhận, giờ VN hoặc phương án metadata đã được chấp thuận.

Mâu thuẫn staff menu/owner lồng, Word khác baseline, UC4.4 alias, UC2.3 mapping và PDF Type3 được ghi C01–C08. Các quyết định hình thức nào thay hành vi nguồn phải có review, không dùng lựa chọn kỹ thuật để né chức năng đã có trong SRS.

## G Giai đoạn đang bàn giao để review

Hiện tại: **G5 quản lý tài khoản nhân viên**, gồm các lượt tinh chỉnh pagination/popup và rà soát bổ sung được liên kết ở đầu tài liệu. Chưa có source G6; chỉ chuyển sang thu mua/phê duyệt sau điều kiện review G5 và các quyết định chặn G6. Các đoạn sau trong mục này là mốc G3 lịch sử, không mô tả phase đang coding.

G3 đã thực hiện asset local, primitives, contract/quyền, bootstrap, password/session/login/shell trên nền G1/G2; migration chỉ thêm session store. Còn review ảnh/visual baseline, không tự gọi DONE. Sau review G3, phase kế tiếp là G4 khách hàng/khung giá; không nhảy sang dashboard hay account CRUD.

File dự kiến: `src/services/auth/`, `src/services/permissions.ts`, `src/features/auth/`, `src/components/ui/`, `src/app/`, metadata session trong DB nếu cần, tests auth/permission/bootstrap/race/visual. Kết quả mong đợi: đăng nhập hai vai trò thật, logout/revoke, gọi service/route trái quyền bị chặn, không plaintext/hardcoded credential, source UI local được đối chiếu, regression nền dữ liệu còn PASS. Không dựng module/KPI giả để lấp menu.

## Quy tắc tích hợp và điều kiện hoàn tất

Sau phê duyệt phase mới mới code. Trước sửa kiểm working tree; làm nhánh/checkpoint rõ; giữ CODEX untracked và mọi thay đổi người dùng cho đến khi có quyết định chọn nguồn đưa Git. Chỉ commit/push/merge/deploy khi được cho phép trong phiên; lệnh push main tự deploy nên không có "chỉ push mà không deploy" ngoài chính sách workflow hiện tại. Không force-push/reset hoặc xóa storage.

Mỗi phase chỉ DONE khi đủ task/traceability/UI/function/tests/regression/lint/typecheck/build/evidence, không blocker và đã review. NOT RUN không tính PASS; không sửa test/baseline để che lỗi. Rollback phải xét DB schema, không chỉ Git SHA; test trên bản sao và ưu tiên roll-forward compatible khi cần.

P01/P02 đã được giải quyết bằng chỉ đạo tiếp tục; không yêu cầu duyệt lại G0/AD01–AD08. Trạng thái từng P03–P11 được cập nhật riêng tại OPEN_ISSUES.md; việc nghiệm thu visual và tích hợp Git/Pages không suy ra từ test PASS.
