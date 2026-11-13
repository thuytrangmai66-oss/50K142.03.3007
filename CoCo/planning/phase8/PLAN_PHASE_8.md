# Kế hoạch Giai đoạn 8 Bán hàng, thành viên và QR cục bộ

> Chốt kiểm chứng G8-T06 ngày 13/11/2026: thêm 3 E2E về lỗi thanh toán/reload/retry hai vai trò và tranh chấp cùng sản phẩm. **Full Chromium 131/131 PASS**, 0 FAIL/SKIP; lint lượt T06 PASS. Runtime/build/lockfile không đổi, tái sử dụng baseline 345/345 unit/integration, typecheck/build PASS từ T05 (không chạy lại các lệnh này trong T06). T06 IMPLEMENTED / PENDING REVIEW; chưa nghiệm thu G8, chưa chuyển G9. [Execution](T06_EXECUTION.md) · [Gói review và ngoại lệ](G8_REVIEW_GATE.md). Không commit/push/deploy lượt này; các mốc dưới giữ làm lịch sử.

> Tiếp tục G8-T05 ngày 13/11/2026 trên nền commit `7338294`: đã sửa popup lỗi lịch sử/chi tiết theo Figma, nền bảng lịch sử và vị trí mở danh sách; bổ sung 2 bài lỗi hai vai trò. **345/345 unit/integration, 128/128 full Chromium, lint/typecheck/build PASS**, 0 SKIP. T05 IMPLEMENTED / PENDING REVIEW; ô trạng thái trên chi tiết lịch sử mua vẫn OPEN/BLOCKED do SRS khác UI09. Không nghiệm thu G8, không chuyển G9, không commit/push/deploy lượt này. [Execution, file, mapping và ảnh](T05_EXECUTION.md). Các mốc bên dưới giữ làm lịch sử.

> Cập nhật T05–T06 ngày 13/11/2026: đã nối lịch sử mua của khách với snapshot hóa đơn bán, tái sử dụng UI09 và chế độ in Ctrl+P; bổ sung kiểm thử điểm nhiều tab, scheduler/QR, rollback và reload. 345/345 unit/integration, lint/typecheck/build PASS; full Chromium cuối 125 PASS / 1 FAIL (phục hồi lịch sử thu mua). Đã dừng trước staging/commit/push theo chỉ đạo mới. T06 còn lỗi kiểm chứng; xem [báo cáo T06](T06_EXECUTION.md); chưa nghiệm thu G8. Các mốc phía dưới giữ làm lịch sử.

> Sửa Bán hàng theo chỉ đạo mới 13/11/2026: D05 tự động ưu đãi thay lựa chọn cũ; đã bổ sung danh sách/chi tiết chỉ đọc của T05, thanh nhập/quét mã và chỉnh UI10. Giữ P05/schema/mapping; G8 chưa DONE. [Báo cáo module](SALES_FIGMA_SRS_FIX.md). T05 còn in/tích hợp lịch sử và T06 chưa được nghiệm thu qua gói này; không đổi thứ tự roadmap.

> Cập nhật 13/11/2026: **G8-T01 draft-cart subset ACCEPTED**; UC_3.1/G8 chưa hoàn tất. P05 semantic mapping và P06/P07 business rules đã được xác nhận. UI10 opt-in, membership persistence, và preview ưu đãi đã triển khai; điểm chỉ thay đổi sau thanh toán thành công. P05 physical review đã được chủ dự án xác nhận theo G8-D04; không cần đổi schema. T02 đã nối cập nhật điểm qua T04; T02–T04 IMPLEMENTED / PENDING REVIEW, chưa nghiệm thu G8. Xem [decision log](DECISION_LOG.md), [T01 execution](T01_EXECUTION.md), [T02 execution](T02_EXECUTION.md), [checklist](ACCEPTANCE_CHECKLIST.md), [report](REPORT_PHASE_8.md).

Ngày 13/11/2026. **IN PROGRESS — T01 draft-cart subset ACCEPTED; T02–T04 PENDING REVIEW**. Roadmap đã được cho phép qua chỉ đạo tiếp tục P02. Giữ dependency, review phase trước và quyết định chặn module. Không commit/push/deploy khi chưa được cho phép.

## 1 Mục tiêu

Giỏ hàng động, ưu đãi/điểm đúng nguồn, tiền mặt và QR offline; xác nhận hoàn tất nguyên tử, tra cứu hóa đơn.

## 2 Nguồn và yêu cầu

UC_3.1, UC_3.2. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

SC037, SC038, SC039, SC040, SC041, SC042, SC043, SC044, SC045, SC046, SC047, SC048, SC049, SC050, SC051, SC052, SC053, SC054, SC055, SC056, SC057, SC058, SC059, SC229, SC230, SC231, SC232, SC233, SC234, SC235, SC236, SC237, SC238, SC239, SC240, SC241, SC242, SC243, SC244, SC245, SC246, SC247, SC248, SC249, SC250, SC251

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

Giỏ hàng động, ưu đãi/điểm đúng nguồn, tiền mặt và QR offline; xác nhận hoàn tất nguyên tử, tra cứu hóa đơn. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

| Nhóm | Component dự kiến |
|---|---|
| UI08 / Danh sách giao dịch bán hàng | SalesSearchTable |
| UI09 / Chi tiết hóa đơn bán hàng | SalesDetail |
| UI10 / Tạo đơn bán hàng | SalesEditor |
| UI11 / Thanh toán chuyển khoản | TransferQrDialog |

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

hoaDonBanHang, chiTietHoaDonBH, sanPham, khachHang, memberships, productCosts; sale totals/points/finalization metadata dự kiến. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

src/features/sales/, src/services/sales.ts, src/lib/payment/vietqr.ts, src/lib/money.ts, src/components/invoices/, tests/unit/sales*, tests/e2e/sale-payment*. Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [x] G8-T01 **ACCEPTED — draft-cart subset only** | Thêm sản phẩm còn bán được, giữ snapshot giá và kiểm lại khi lưu; phần discount/payment chưa làm | Nguồn UC/BR/SC + code G2 và task được giao [COPILOT_T01_TASK.md](COPILOT_T01_TASK.md) | UI08/09/10, SalesDraft và SalesService | src/features/sales/, src/services/sales.ts; tests/unit/sales.test.ts, tests/e2e/sales-draft.spec.ts | TC-BR-UC3-01..02 (subset); TC-P8-PRICE-CHANGE |
| [ ] G8-T02 **IMPLEMENTED / PENDING REVIEW — including paid-point integration in T04** | Ghi nhận thành viên tại checkout sau opt-in rõ ràng; membership lưu ngay cả khi giao dịch sau đó hủy/thất bại; khách không đăng ký vẫn mua được nhưng không dùng/tích điểm; thành viên đủ 50 điểm tự động dùng đúng 50 để giảm 20% theo G8-D05, không còn checkbox chọn ưu đãi | [Quyết định](DECISION_LOG.md), nguồn UC/BR/SC, code G2; task [COPILOT_T02_TASK.md](COPILOT_T02_TASK.md) | Calculator, control, persistence và preview eligibility đã làm; final payment/point update đã nối T04, chờ nghiệm thu | src/domain/sales.ts, src/features/sales/, src/services/sales.ts, tests/unit/sales.test.ts, tests/e2e/sales-draft.spec.ts | TC-BR-UC3-06..10; TC-P8-POINT-49-50 |
| [ ] G8-T03 **IMPLEMENTED / PENDING REVIEW** | Tạo payload QR chuyển khoản cục bộ SHB/0947800469/MAI THUY TRANG theo số tiền cuối cùng; kiểm chuẩn TLV/BIN/CRC bằng vector độc lập | Nguồn UC/BR/SC + code G2 và task trước trong phase | qrcode chỉ render; không HTTP ngân hàng/VietQR runtime; UI11 và nút Đã nhận | src/features/sales/, src/services/sales.ts, src/lib/payment/vietqr.ts, src/lib/money.ts, src/components/invoices/, tests/unit/sales*, tests/e2e/sale-payment* | TC-P8-QR-CRC; TC-P8-QR-AMOUNT |
| [ ] G8-T04 **IMPLEMENTED / PENDING REVIEW** | Tiền mặt/Đã nhận hoàn tất: invoice+lines+sold+điểm+paidAt+totals snapshot+receipt cùng transaction, kiểm quyền/session và phiên bản tồn kho | Nguồn UC/BR/SC + code G2 và task trước trong phase | không finalize bằng action quay lại/hủy; một product không được bán hai lần | src/features/sales/, src/services/sales.ts, src/lib/payment/vietqr.ts, src/lib/money.ts, src/components/invoices/, tests/unit/sales*, tests/e2e/sale-payment* | TC-P8-COMPLETE-ATOMIC; TC-P8-DOUBLE-SALE |
| [ ] G8-T05 **IMPLEMENTED / PENDING REVIEW — list/detail/history/print; status UI OPEN** | Tra cứu/filter/reset/pagination và chi tiết read-only; hóa đơn/in theo điều khiển Design khi được mapping, không thêm export không có nguồn | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI08/09, print stylesheet nếu nút nguồn yêu cầu, history khách hàng | src/features/sales/, src/services/sales.ts, src/lib/payment/vietqr.ts, src/lib/money.ts, src/components/invoices/, tests/unit/sales*, tests/e2e/sale-payment* | TC-UC3-2-MAIN; TC-P8-HISTORY |
| [ ] G8-T06 **IMPLEMENTED / PENDING REVIEW — full 131/131 PASS** | Multi-tab khách đủ điểm và một món đang mua; retry sau reload/lỗi DB; regression scheduler tranh chấp với bán hàng | Nguồn UC/BR/SC + code G2 và task trước trong phase | test cuối luồng hai vai trò, dữ liệu production không seed | src/features/sales/, src/services/sales.ts, src/lib/payment/vietqr.ts, src/lib/money.ts, src/components/invoices/, tests/unit/sales*, tests/e2e/sale-payment* | TC-P8-POINT-RACE; TC-P8-SCHEDULER-RACE |

## 9 Thứ tự và dependency

G3/G4/G6/G7; G8-D01..D03 trong [decision log](DECISION_LOG.md). Làm T01 → T02 → ... theo thứ tự bảng. Checkout opt-in/member controls đã được duyệt để triển khai trong UI10. P05 physical review đã được xác nhận tại P05_PHYSICAL_REVIEW.md / G8-D04; runtime T04 được phép triển khai và vẫn phải kiểm chứng. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_3.1, UC_3.2; BR liên quan và mọi control test thuộc SC037, SC038, SC039, SC040, SC041, SC042, SC043, SC044, SC045, SC046, SC047, SC048, SC049, SC050, SC051, SC052, SC053, SC054, SC055, SC056, SC057, SC058, SC059, SC229, SC230, SC231, SC232, SC233, SC234, SC235, SC236, SC237, SC238, SC239, SC240, SC241, SC242, SC243, SC244, SC245, SC246, SC247, SC248, SC249, SC250, SC251. Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

49/50/51 điểm; khách thường; 0 dòng; sản phẩm đã bán; QR quay lại; tiền có phần giảm lẻ; double-click; hai đơn cùng món/cùng điểm; tràn số; lỗi audit sau cập nhật. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

2 UC; 2 phương thức thanh toán; chỉ xác nhận thành công mới sold/điểm/doanh thu; atomic rollback và idempotency được kiểm; QR scan đúng bank/account/tên/tiền; không external request; lịch sử và tổng snapshot nhất quán. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

Membership store và ngữ nghĩa legacy đã được đối chiếu; UI opt-in còn thiếu trong local Design. Không coi T01/T02 calculator là membership registration hay finalization. Review UI change và physical P05 snapshot/migration trước khi thực hiện các phần phụ thuộc; bảo toàn hóa đơn legacy, không backfill khi thiếu căn cứ.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_8.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và quyết định nghiệp vụ của task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker trong phạm vi task. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do; không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Tạo nhánh làm việc riêng sau khi được phép code (ví dụ coco/phase-8); ghi commit theo task sau test; không force/reset/ghi đè thay đổi khác. Chỉ push/merge/deploy khi có cho phép. Workflow main hiện có vẫn install/lint/typecheck/unit/audit/build/Chromium trước deploy. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
