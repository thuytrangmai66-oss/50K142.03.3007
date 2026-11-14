# Roadmap CoCo

> **PO 14/11/2026 — G11 release được phê duyệt:** chấp nhận tạm thời G10-A01–A07, giữ kết quả chưa hoàn thành và rủi ro; không chuyển thành PASS. G11-T02/T03 được thực thi theo [báo cáo release](phase11/RELEASE_EXECUTION.md), không bỏ CI/CD hoặc tự DONE G11. G9 đã nghiệm thu; các mốc chưa mở G11 phía dưới là lịch sử trước phê duyệt mới. Thứ tự/phạm vi task không đổi.

> G10 tiếp tục14/11: đã review assertion98 BR và thực thi538 unit/167 Chromium/8 visual local PASS; chưa đủ mọi nhánh/control/visual hoặc gate để chuyển G11. [Execution hiện hành](phase10/BR_REVIEW_EXECUTION.md). Thứ tự/phạm vi task không đổi, chưa commit/push phase chưa hoàn tất.

> **14/11/2026 — G10 đang thực hiện:** người dùng cho phép kiểm chứng sau G9, duyệt ngưỡng visual/đo trước và gói nâng major tại [Decision Log G10](phase10/DECISION_LOG.md). Đã có hành trình liên module, audit nguồn, benchmark và sửa tương thích; xem [báo cáo hiện hành](phase10/REPORT_PHASE_10.md). G9 vẫn PENDING REVIEW; G10 chưa DONE, G11 chưa bắt đầu. Các mốc “G10 NOT STARTED” và giao việc G8 phía dưới là lịch sử; roadmap/task/dependency không thay đổi.

> Cập nhật13/11/2026: đã nhận nghiệm thu người dùng cho phần G7 đã triển khai; [phạm vi/ngoại lệ](phase7/ACCEPTANCE_2026_11_13.md). Giao Copilot [G8-T01 giỏ hàng/snapshot giá phần độc lập](phase8/COPILOT_T01_TASK.md), chưa coding G8 trong lượt giao việc. Barcode G7, audit và G6 UI vẫn mở; không tự ghi toàn G7 DONE hoặc miễn trừ SRS.

> Cập nhật G7 ngày12/11/2026: theo chỉ đạo tiếp tục, bắt đầu T01 Hàng hóa chỉ đọc trên dữ liệu G6; **G7 IN PROGRESS / T01 PARTIAL**, G6 vẫn PENDING REVIEW. [Báo cáo G7 và các gate chưa chốt](phase7/REPORT_PHASE_7.md). Giữ nguyên thứ tự T01–T06, không tự nghiệm thu G6/G7 hoặc thay quyết định đang OPEN. Các dòng chưa chuyển G7 phía dưới là trạng thái trước chỉ đạo này.

> T07 ngày 12/11/2026: đã chạy gói kiểm chứng cuối G6 (249 unit/integration, 95 Chromium PASS; audit FAIL), không thêm chức năng hoặc đổi thứ tự. **T05/T06/T07/G6 PENDING REVIEW**; hai trường UI BR-UC1-16 BLOCKED và dependency audit FAIL. [Bằng chứng và ngoại lệ T07](phase6/T07_EXECUTION.md), [bảng nghiệm thu UC/BR](phase6/G6_ACCEPTANCE_MATRIX.md). Không tự DONE hoặc chuyển G7; ghi chú tiến độ phía dưới là lịch sử.

> Cập nhật T06 ngày 12/11/2026: đã triển khai tra cứu/chi tiết/lịch sử; **T05 và T06 PENDING REVIEW, G6 IN PROGRESS**. Hai trường Nhân viên/Trạng thái trong chi tiết **BLOCKED** theo lựa chọn giữ Figma. [Báo cáo và kết quả thực thi T06](phase6/T06_EXECUTION.md). Thứ tự tiếp theo vẫn T07, chưa chuyển G7. Các ghi chú T06 PARTIAL/NOT STARTED bên dưới là lịch sử.

## Cập nhật G6 hiện hành

T05 đã kích hoạt Lưu, hoàn tất hóa đơn/nhập kho và QA đạt, trạng thái READY FOR REVIEW. [Báo cáo runtime T05](phase6/T05_EXECUTION.md) có 233 unit/integration và 88 Chromium PASS. Giữ thứ tự tiếp theo T06 → T07; G6 IN PROGRESS. Thông tin T05 PARTIAL/chờ mapping phía dưới là lịch sử đã được thay thế.

T05 đã bắt đầu, có transaction candidate và kiểm thử, đang chờ xác nhận mapping mã trạng thái trước runtime. [Tiến độ và phần còn lại](phase6/T05_CANDIDATE_PROGRESS.md). G6 IN PROGRESS, giữ thứ tự T05 → T06 → T07.

Ngày 12/11/2026, T04 đã triển khai nhận kết quả và nhập lại giá, chờ review/nghiệm thu. [Kiểm thử, ảnh và điểm còn mở](phase6/T04_EXECUTION.md). G6 tiếp tục T05 → T06 → T07. Những mục T04 chưa triển khai phía dưới thuộc lịch sử trước lượt này.

Ngày 12/11/2026, T03 đã triển khai giao diện chủ xử lý yêu cầu và đang chờ review/nghiệm thu. [Báo cáo, kiểm thử và giới hạn T03](phase6/T03_SERVICE_PROGRESS.md). Thứ tự G6-T04 → T05 → T06 → T07 giữ nguyên. Các ghi chú T03 chưa có UI phía dưới là lịch sử trước lượt này.

Ngày 11/11/2026, người dùng xác nhận: **“Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”**. T01 đã được nghiệm thu; P03/P04 runtime APPROVED_USER. Không suy ra nghiệm thu G5 hoặc toàn bộ G6 từ xác nhận này.

Runtime IndexedDB đã nâng additive lên v4/27 store; T02 đã triển khai theo [báo cáo](phase6/T02_EXECUTION.md), chờ nghiệm thu. T03 là task tiếp theo sau T02, không đổi roadmap hoặc tự DONE G5/G6. Demo hai tab duyệt/từ chối A–F vẫn NOT RUN cho đến T03/T04/T07. Các mục P03/P04 “chưa phê duyệt” trong hồ sơ lịch sử dưới đây đã được thay thế; mapping số cho bản ghi mới trước T05 và các quyết định nghiệp vụ khác vẫn OPEN khi chưa chốt.

## Hồ sơ trước xác nhận T01 — lịch sử

Các ghi chú chưa kích hoạt/chưa có UI bên dưới mô tả mốc trước xác nhận, không thay trạng thái hiện tại ở trên.

> Rà soát 11/11/2026: [biên bản bổ sung G5](phase5/REVIEW_COMPLETION.md) là trạng thái/test hiện tại. G5 vẫn READY FOR REVIEW, G6 chưa code; [P03/P04/Q20](phase6/DATA_CONTRACT_REVIEW.md) đã có phương án cụ thể chờ quyết định. Không thay phase/task nghiệp vụ hoặc thứ tự dependency.

> G5 đã code/test theo chỉ đạo mới nhất, [REPORT_PHASE_5.md](phase5/REPORT_PHASE_5.md) READY FOR REVIEW; sửa UX chi tiết trên desktop, không mở rộng mobile. Thứ tự vẫn G4 → G5 → G6. G6 chưa triển khai; không gán kết quả quản lý tài khoản thành PASS demo approval.

> Cập nhật G4 11/11/2026: theo chỉ đạo tiếp tục, đã code customer/history/bracket và responsive; giữ G4 → G5 → G6. Không Supabase/backend hoặc sync đa máy. [Báo cáo G4](phase4/REPORT_PHASE_4.md); [A–F demo hai tab G6](phase6/DEMO_ACCEPTANCE.md) là yêu cầu bắt buộc, không đánh dấu hoàn thành thay cho G6.

Ngày 11/11/2026. Người dùng yêu cầu “tiếp tục” sau bản kế hoạch; P02 được ghi nhận cho phép dùng thứ tự G3–G11, P01 cho phép bootstrap một lần. G3 hiện **READY FOR REVIEW**, xem [báo cáo](phase3/REPORT_PHASE_3.md); kỹ thuật đạt, visual cuối cùng còn review. Không đảo hoặc triển khai lại G0–G2. G3–G11 là roadmap đề xuất vừa được cho phép, không phải bản roadmap cũ đã khôi phục từ nguồn còn thiếu.

| Giai đoạn | Phạm vi | Dependency | Kiểm thử bắt buộc | Tiêu chí | Trạng thái |
|---|---|---|---|---|---|
| G0 | Khảo sát/AD01–08, phê chuẩn Q01–22 | Nguồn chuẩn | Báo cáo và chỉ đạo trước | Giữ lịch sử đã duyệt | DONE (lịch sử nghiệm thu) |
| G1 | Khung React/Dexie/HashRouter + CI/CD hiện có | G0 | Baseline lint/typecheck/build/Chromium + CI read-only | Không làm lại CI đã hoạt động | READY FOR REVIEW (kỹ thuật đã tái PASS) |
| G2 | Nền dữ liệu v2/10 entity/metadata/repository | G1 | 27 data + migration browser | Giữ data/rollback/idempotency; không coi là full UC | READY FOR REVIEW (kỹ thuật đã tái PASS) |
| G3 | Nền xác thực, hợp đồng trạng thái và UI dùng chung | Nền G0–G2; P01/P02 đã cho phép | 49 Vitest + 10 Chromium, lint/typecheck/build/audit PASS; pixel NOT RUN | Gate cụ thể tại PLAN_PHASE_3.md | READY FOR REVIEW — code đạt, chờ visual/review |
| G4 | Dữ liệu tham chiếu khách hàng và khung giá | G3/G2, danh mục độ mới đã duyệt | Unit/integration, UI hai role, live two-tab, responsive, regression | Gate cụ thể tại PLAN_PHASE_4.md | READY FOR REVIEW — kỹ thuật đạt, full visual/host tương lai còn review |
| G5 | Quản lý tài khoản nhân viên | G3 auth/session/permission, P08 transaction rename/alias | 101 unit/integration + 52 Chromium tổng regression, lint/typecheck/build/audit PASS; SC145–162 có ảnh đối chiếu thủ công | Gate cụ thể tại PLAN_PHASE_5.md | READY FOR REVIEW — code/test đạt, full visual còn review |
| G6 | Thu mua và phê duyệt giá liên kết | G3, G4 và tài khoản G5; quyết định P03/P04, Q20 và hợp đồng trạng thái | unit/integration + UC/BR/control + E2E/visual/permission + regression | Gate cụ thể tại PLAN_PHASE_6.md | IN PROGRESS — T01 đã nghiệm thu; runtime v4; T02 READY FOR REVIEW, xem T02_EXECUTION.md; T03–T07 chưa triển khai |
| G7 | Hàng hóa và lịch xử lý tồn lâu | G6 tạo hàng thật; G3 quyền; Q10, Q12 phần làm tròn giảm, P10 giá dưới 20.000đ | unit/integration + UC/BR/control + E2E/visual/permission + regression | Gate cụ thể tại PLAN_PHASE_7.md | NOT STARTED — giữ thứ tự, chưa triển khai |
| G8 | Bán hàng, thành viên và QR cục bộ | G3/G4/G6/G7; Q12 làm tròn, P06 sự kiện membership và P05 finalized totals/time | unit/integration + UC/BR/control + E2E/visual/permission + regression | Gate cụ thể tại PLAN_PHASE_8.md | NOT STARTED — giữ thứ tự, chưa triển khai |
| G9 | Báo cáo và dashboard theo dữ liệu thật | G6/G8 hoàn tất giao dịch và snapshot paidAt/cost; G7 tồn lâu; G3 phân quyền | unit/integration + UC/BR/control + E2E/visual/permission + regression | Gate cụ thể tại PLAN_PHASE_9.md | IN PROGRESS / PARTIAL — T01/T02 eligibility; nguồn ngày tạo/UI KPI chờ review |
| G10 | Tích hợp, hồi quy, NFR và đối chiếu giao diện | G3–G9; Q21 và P11 về viewport/nhanh/phím tắt trước chốt NFR | unit/integration + UC/BR/control + E2E/visual/permission + regression | Gate cụ thể tại PLAN_PHASE_10.md | NOT STARTED — giữ thứ tự, chưa triển khai |
| G11 | Release, xác minh Pages và bàn giao | G10 đạt gate; cho phép tích hợp/push/deploy cho release cụ thể | unit/integration + UC/BR/control + E2E/visual/permission + regression | Gate cụ thể tại PLAN_PHASE_11.md | NOT STARTED — giữ thứ tự, chưa triển khai |

G3 → G4 → G5 → G6 → G7 → G8 → G9 → G10 → G11. G4 history queries kiểm bằng fixture riêng, sau G6/G8 tái test với giao dịch thực. Thu mua/phê duyệt nằm cùng G6 vì vòng phụ thuộc draft/request; không tạo fake completed invoice để vượt FK. UI primitives đi cùng auth G3 là dependency kỹ thuật, không mặc định toàn bộ G3 là giao diện. CI hiện đã có, mỗi phase tiếp tục dùng gate, không chờ cuối ứng dụng.

Thứ tự/phạm vi roadmap đã được cho phép. G4/G5 đã có source và kiểm thử, trạng thái READY FOR REVIEW; G6–G11 chưa triển khai nghiệp vụ. Câu “G4–G11 chưa triển khai” ở bản trước là thông tin mốc G3 đã lỗi thời. Các quyết định chặn module vẫn cần giải quyết trước task tương ứng. Trạng thái phase dùng NOT STARTED / IN PROGRESS / BLOCKED / READY FOR REVIEW / DONE. READY FOR REVIEW không bằng DONE; blocker có ID và phần bị chặn. Hết phase có REPORT_PHASE_N.md, evidence theo SHA/test/source, review tiêu chí rồi mới chuyển. Không bắt làm lại G1/G2 đã PASS chỉ vì trạng thái review. Không commit/push/merge/deploy trong lượt hiện tại.

- [G3: Nền xác thực, hợp đồng trạng thái và UI dùng chung](phase3/PLAN_PHASE_3.md)
- [G4: Dữ liệu tham chiếu khách hàng và khung giá](phase4/PLAN_PHASE_4.md)
- [G5: Quản lý tài khoản nhân viên](phase5/PLAN_PHASE_5.md)
- [G6: Thu mua và phê duyệt giá liên kết](phase6/PLAN_PHASE_6.md)
- [G7: Hàng hóa và lịch xử lý tồn lâu](phase7/PLAN_PHASE_7.md)
- [G8: Bán hàng, thành viên và QR cục bộ](phase8/PLAN_PHASE_8.md)
- [G9: Báo cáo và dashboard theo dữ liệu thật](phase9/PLAN_PHASE_9.md)
- [G10: Tích hợp, hồi quy, NFR và đối chiếu giao diện](phase10/PLAN_PHASE_10.md)
- [G11: Release, xác minh Pages và bàn giao](phase11/PLAN_PHASE_11.md)
