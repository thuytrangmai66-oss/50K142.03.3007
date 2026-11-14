# G9-T06 — Kiểm chứng phần đã triển khai

> **Bổ sung G9-D05:** đã duyệt/kích hoạt phương án A so sánh tồn cuối tháng trước từ vòng đời nhập/bán đã xác minh, có kernel/integration/Chromium qua UI thật và timezone khác VN. Full unit mới **491/491 PASS**, full Chromium **151/151 PASS**, 0 FAIL/0 SKIP (8,2 phút). [Bằng chứng](STOCK_COMPARISON_EXECUTION.md). Các dòng historical-stock BLOCKED/chưa quyết định hoặc chưa chạy full 149 ở mốc cũ bên dưới là lịch sử trước G9-D05; không phải trạng thái hiện hành. Nghiệm thu G9 vẫn PENDING REVIEW.

## Hiện hành sau G9-D04 — 14/11/2026

### Tiếp tục T06 theo chỉ đạo mới

Đã bổ sung một Chromium hành trình có phê duyệt thật: Nhân viên gửi giá 120.000 > Max 100.000 → Chủ duyệt → thông báo hai tab/đóng hết popup → thêm món cùng khung giá 80.005 → tạo/chọn khách thật → hoàn tất thu mua 200.005 → nhập 2 món → bán cả hai 260.007 → đối soát doanh thu/chi phí/lợi nhuận/dòng tiền và dashboard hai vai trò. Gross profit/cash flow **60.002**, tồn hiện tại **0**, số nhập hôm nay **2**; chưa hoàn tất draft không tạo hóa đơn/sản phẩm. Kiểm tất cả store bất biến sau xem báo cáo/reload; token hai tab độc lập; console.error/pageerror rỗng.

Thay đổi chỉ `tests/e2e/reports-reconciliation.spec.ts`, tài liệu và bằng chứng; không sửa source sản phẩm, schema/UI/nghiệp vụ. Typecheck/lint **PASS** sau bổ sung; focused toàn file **2/2 Chromium PASS**, 15,1 giây, 0 FAIL/0 SKIP. Không chạy lại unit/build vì source sản phẩm và dependency không đổi: tái sử dụng **464/464 unit**, build PASS và full **148/148 Chromium** của mốc trước. Bộ test hiện có thêm 1 case (149 case), **chưa chạy cả 149 trong cùng một lượt full**, không báo full 149 PASS. Đây là bổ sung kiểm chứng G9-T06, không tự đánh G10-T01 DONE.

Ảnh [Chủ cuối hành trình](evidence/t06/approved-journey/owner-approved-journey.png), [Nhân viên cuối hành trình](evidence/t06/approved-journey/staff-approved-journey.png), [log focused](evidence/t06/approved-journey/chromium.log). [Review tồn kho tháng trước](HISTORICAL_STOCK_REVIEW.md) đã trình phương án cụ thể, vẫn PROPOSED/OPEN trong lúc chờ trả lời; không kích hoạt thuật toán hoặc ghi snapshot mới. Git fetch đầu lượt trùng main/origin tại f580a229; không commit/push khi gate phase chưa đạt.

**VERIFICATION EXECUTED / PENDING REVIEW**. Người dùng đã duyệt M01-B, phạm vi staff và wording; dashboard thật và nguồn khách mới đã triển khai trong [T05](T05_EXECUTION.md). Những chữ chưa phê duyệt/chưa bật dashboard trong nhật ký dưới thuộc mốc trước, không là blocker hiện hành.

- [x] Oracle native từ UI thật: 1 hóa đơn thu mua, 2 món, 2 hóa đơn bán; revenue 208.014, cost 160.010, gross profit/cash flow 48.004. Sau bán tồn hiện tại 0; nhập hôm nay vẫn 2 món.
- [x] Tab Chủ đang xem profit/cash-flow nhận kết quả live khi Nhân viên thanh toán, không F5. Hai token khác nhau, giữ nguyên. Staff bị chặn menu/route/service báo cáo.
- [x] Bốn báo cáo tiền khớp oracle hóa đơn/chi tiết/productCosts; dashboard Chủ khớp revenue/đơn/tồn, Staff khớp 1 đơn mua/2 đơn bán/2 món nhập/1 khách. Toàn bộ store không đổi khi đọc/reload.
- [x] M01-B create/delete qua form thật: tab Nhân viên 0→1→0 không F5; khách legacy nguyên vẹn. Transaction/replay/race/rollback/invalid proof có integration test.
- [x] Sửa duplicate line/unsafe subtotal trong adapter thu mua: phân loại UNVERIFIED đúng G9-D01, chỉ catch kiểm dữ liệu thuần túy, không che I/O/nới validation/sửa gốc.
- [ ] So sánh tồn kho tháng trước **BLOCKED**, thiếu nguồn/định nghĩa mốc được duyệt; placeholder không miễn trừ chỉ tiêu.
- [ ] Pixel-diff tự động **NOT RUN**; ảnh đã xem so thủ công với nguồn local, nghiệm thu thiết kế **PENDING REVIEW**.
- [ ] T05/T06/G9 **PENDING REVIEW**, không DONE/chuyển G10. Ngoại lệ G6/G8 và thiết bị thực trước đây không được đóng bằng test G9.

| Nguồn | Bộ test / bằng chứng |
|---|---|
| UC7.1 / BR-UC7-01..03 | reports-revenue.spec.ts, report-queries/revenue-report unit: kỳ VN, paidAt, tổng/average, empty/error/read-only |
| UC7.2 / BR-UC7-04..09 | reports-purchase-cost.spec.ts, report-queries unit: món/khác giá cùng khung, receipt/audit/provenance, filter/pagination |
| UC7.3 / BR-UC7-10..14 | reports-t04.spec.ts, report-queries/financial-number unit: revenue trừ cost đúng món đã bán, âm/zero/unsafe |
| UC7.4 / BR-UC7-15..16 | reports-t04.spec.ts, report-queries unit: còn kho, tuổi theo ngày nhập, ngưỡng >=, loại/brand, empty/error |
| UC7.5 / BR-UC7-17..21 | reports-t04.spec.ts, report-queries unit: thực thu/trả theo thời gian riêng, chỉ thu/chỉ chi/âm/zero |
| TC-P9-DASHBOARD-ROLES / SC007/198 | home-t05.spec.ts, customer-creation/dashboard-comparison/report-queries unit: KPI/role, VN, M01-B, quyền/legacy; historical-stock BLOCKED |
| TC-P9-RECONCILIATION | reports-reconciliation.spec.ts: UI mua/bán thật, live hai tab, oracle native, reload/read-only, dashboard khớp báo cáo |
| TC-P9-STAFF-DENIED | Unit staff/revoked + Chromium direct URL/menu báo cáo; session từng tab độc lập |

Full unit/integration **464/464 PASS**, 25 file, 102,27 giây; Chromium full 148/148 PASS (0 FAIL/0 SKIP, 6,7 phút). Lint/typecheck/build PASS (build 4,57 giây, cảnh báo bundle >500 kB còn nguyên). Focused **60/60 unit, 6/6 Chromium PASS** (5 runtime + 1 proposal). Baseline cũ dừng khi nhận phê duyệt để triển khai source mới, **không là PASS**; bộ full mới thay lượt đó, không dùng 445/145 mốc trước cho source hiện hành.

File T06: `src/services/purchase-report.ts`, `tests/unit/report-queries.test.ts`, `tests/e2e/reports-reconciliation.spec.ts`, `tests/e2e/inventory.spec.ts`, `tests/e2e/purchase-approvals.spec.ts`, tài liệu/checklist/evidence. File T05 tách ở execution tương ứng. Ảnh [Chủ](evidence/t05-approved/owner-home-reconciled.png), [Nhân viên](evidence/t05-approved/staff-home-reconciled.png), [profit live](evidence/t06/owner-profit-live.png). Chưa commit/push khi gate phase chưa đạt; không deploy thủ công.

### Regression phát hiện và điều chỉnh fixture

Lượt full Chromium đầu trên source mới: **146 PASS / 2 FAIL / 0 SKIP**, 8,7 phút. Hai ca fault injection cũ tiêm lỗi getAll toàn ứng dụng cho `sanPham`/`purchaseApprovals` trước khi đi qua Trang chủ. Dashboard mới cũng cần đọc hai store đó, nên hiển thị lỗi thật và chặn thao tác trước màn hình cần kiểm; đây không phải assertion được miễn trừ.

Sửa **chỉ fixture** trong inventory.spec.ts và purchase-approvals.spec.ts: phạm vi fault injection theo route Hàng hóa/Phê duyệt đang được kiểm thử; vẫn ném cùng DOMException ở màn hình đích, giữ toàn bộ assertion về thông báo/recovery/dữ liệu và timeout. Không sửa runtime để che lỗi; home-t05.spec.ts có ca riêng chứng minh lỗi đọc dashboard vẫn báo lỗi, không false-zero và retry thành công. Focused hai ca cũ **2/2 PASS**, 9,1 giây. Full Chromium chạy lại từ đầu: **148/148 PASS / 0 FAIL / 0 SKIP**, 6,7 phút, exit 0. Lưu [log full lỗi](evidence/t06/initial-full-e2e.log) và error-context ban đầu trong evidence/t06; không dùng lượt lỗi làm kết quả PASS.

## Nhật ký kiểm chứng trước khi nhận phê duyệt — lưu lịch sử

Ngày 14/11/2026. **PARTIAL / VERIFYING / PENDING REVIEW**. Đây là kiểm chứng độc lập các chức năng T02–T04 đã có và hồi quy phần T05 được phép; không bỏ qua dependency T05, không bật dashboard chưa phê duyệt, không bắt đầu G10.

## Trạng thái đầu vào

Đọc MASTER_PLAN, PLAN_PHASE_9, REPORT_PHASE_9, T05_REVIEW_GATE, Decision Log và plan G10. G9 vẫn chưa đạt gate chuyển tiếp: T05 còn các quyết định M01/U01, phạm vi staff và so sánh baseline. Không có xác nhận mới của chủ dự án trong Git/tài liệu hoặc chat để tự chọn các phương án này. Lệnh tiếp tục cho phép làm phần độc lập đã đủ điều kiện, không tự biến thành phê duyệt dữ liệu/wording.

Git main, HEAD f580a229f77cadb4c4e18108ae42bf1189fbeffa trùng origin/main sau fetch; giữ working tree T02–T05, rule, CODEX và launcher. Không stash/reset/rebase, không commit/push/deploy.

## Đã kiểm chứng / sửa

1. Thêm E2E native Chromium dùng UI thật: tạo thu mua, nhân viên thật với phiên riêng, hoàn tất hai hóa đơn bán. Owner mở profit trước khi staff thanh toán; dữ liệu tự cập nhật từ empty sang revenue/cost/profit 104.007/80.005/24.002, **không reload hoặc điều hướng tab owner trong bước cập nhật này**.
2. Owner mở cash-flow trước hóa đơn bán thứ hai; sau staff thanh toán nhận 208.014/160.010/48.004 tự động. Kiểm mã token hai tab khác nhau và giữ nguyên sau các thao tác/reload; staff không có menu Báo cáo.
3. Oracle độc lập từ dữ liệu hoàn tất: 1 hóa đơn thu mua, 2 hóa đơn bán, 2 chi tiết bán, 2 sản phẩm vật lý; tổng receipt bán 208.014, productCosts 160.010, cả hai sản phẩm sold=2 trong mapping invoiceCompleted=1/available=1/sold=2 đã duyệt. Không suy lại mã legacy toàn cục.
4. Mở lần lượt doanh thu/chi phí/lợi nhuận/dòng tiền, kiểm từng chỉ số đúng oracle và toàn bộ store không đổi. Reload giữ kết quả, màn hình Hàng hóa hiển thị đúng 2 món Đã bán. Không tạo hóa đơn/sản phẩm giả hoặc dùng mock trả kết quả báo cáo.
5. Unit bổ sung lỗi snapshot thu mua duplicate line identity và unsafe total. Ban đầu lỗi duplicate ném Error chung từ purchaseSubtotal và làm query thất bại toàn bộ, thay vì phân loại UNVERIFIED theo G9-D01. Sửa **chỉ adapter báo cáo**: chuyển ngoại lệ của phép kiểm tra snapshot thuần túy sang REFERENCE để quarantine; không catch I/O trong nhánh đó. Các lỗi storage thật vẫn propagate và test hiện hữu xác minh không bị đổi thành empty/0. Không sửa schema, finalizer, trạng thái hoặc bản ghi lỗi gốc.

## Source/test

- Sửa `src/services/purchase-report.ts`: chuẩn hóa lỗi dữ liệu thuần túy khi đối chiếu subtotal, không nới validation.
- Sửa `tests/unit/report-queries.test.ts`: 2 biến thể duplicate/overflow, coverage UNVERIFIED và toàn bộ DB bất biến.
- Mới `tests/e2e/reports-reconciliation.spec.ts`: đối soát live hai vai trò, số liệu đóng sổ, reload và read-only.
- Chỉ cập nhật tài liệu/checklist/bằng chứng liên quan. Không triển khai thêm chức năng T05 hoặc G10 để xử lý khác biệt tài liệu.

## Kiểm thử và bằng chứng

Focused unit trước sửa: 41 PASS / 1 FAIL, lỗi Duplicate line identity. Sau sửa và thêm biến thể overflow: **43/43 PASS**, 10,95 giây. Không nới assertion hoặc bỏ ca lỗi. Focused Chromium mới: **1/1 PASS**, 8,8 giây, exit 0.

Lint/typecheck PASS. Build PASS 4,88 giây tại mốc trước phê duyệt; cảnh báo bundle >500 kB vẫn như mốc trước. Baseline khi đó đã dừng để triển khai gói T05 vừa được duyệt, không chốt PASS cho lượt dừng. Kết quả full trên source mới nằm trong phần hiện hành đầu tài liệu; không dùng 445/145 mốc cũ thay kết quả mới.

Ảnh [owner profit nhận live](evidence/t06/owner-profit-live.png), [staff sau thanh toán](evidence/t06/staff-paid-list.png). Browser context kiểm thử riêng, không dữ liệu khách thật. Native IndexedDB cùng origin, hai sessionStorage khác nhau. Các listener console.error/pageerror rỗng. Pixel-diff nghiệm thu **NOT RUN**.

## Chưa hoàn tất / không được báo PASS

| Phần | Trạng thái |
|---|---|
| Đối soát báo cáo T02–T04 với giao dịch thực/hai tab | Focused PASS; full regression đang chạy |
| KPI Chủ backend của T05 và quick actions | Đã có test từ T05, được hồi quy; không phải dashboard bốn thẻ runtime |
| Dashboard đầy đủ SC007/SC198, new customer provenance và UI coverage | **BLOCKED / NOT RUN** cho runtime, chưa có lựa chọn M01-A/B, phạm vi staff và wording |
| Chỉ tiêu so sánh tồn kho tháng trước | **BLOCKED**, thiếu định nghĩa mốc và nguồn lịch sử đã duyệt |
| Nghiệm thu T05/T06/G9 và vào G10 | **PENDING REVIEW / CHƯA ĐẠT**; test PASS không tự mở gate |

Đã gửi lại gói quyết định [T05_REVIEW_GATE.md](T05_REVIEW_GATE.md), có HTML/ảnh cụ thể. Không có phản hồi không phải phê duyệt. Khi có quyết định tương ứng mới nối phần dashboard và bổ sung phần kiểm chứng còn thiếu. Không đánh G9 DONE, không commit/push khi gate phase còn mở, không thay roadmap/thứ tự phase.

Local vẫn là http://127.0.0.1:5173/50K142.03.3007/; xem Báo cáo bằng vai trò Chủ. Các quyết định mở không ảnh hưởng khả năng chạy năm báo cáo đã triển khai.
