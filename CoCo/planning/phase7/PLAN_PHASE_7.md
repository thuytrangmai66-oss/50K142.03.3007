# Kế hoạch Giai đoạn 7 Hàng hóa và lịch xử lý tồn lâu

> Chủ dự án nghiệm thu13/11/2026: phần T01 đã triển khai và T02–T06 **ACCEPTED_USER** theo [biên bản](ACCEPTANCE_2026_11_13.md). Barcode T01 còn thiếu; không ghi toàn G7 DONE hoặc đóng audit/G6 UI. Công việc tiếp đã giao: [G8-T01 phần độc lập](../phase8/COPILOT_T01_TASK.md). Trạng thái chờ review phía dưới là mốc trước nghiệm thu.

> Tiếp quản 13/11/2026: Q10, làm tròn giảm30% Q12 và P10 đã xác nhận; T01 query/detail đã triển khai, barcode BLOCKED; T02–T06 có runtime và kiểm thử. Revalidation trên worktree hiện tại: lint/typecheck/build PASS, 298/298 unit, 107/107 Chromium PASS. T01 PARTIAL; T02–T06 PENDING REVIEW; G6/G7 không tự DONE. [Báo cáo hiện hành](REPORT_PHASE_7.md), [evidence](evidence/handoff-current/).

> Lịch sử kế hoạch 12/11/2026 (đã được cập nhật bởi trạng thái tiếp quản ở trên): lúc đó mới triển khai T01; các dòng NOT STARTED bên dưới thuộc mốc trước khi T02–T06 được tiếp tục.

Ngày 11/11/2026. **NOT STARTED tại thời điểm lập kế hoạch**. Roadmap đã được cho phép qua chỉ đạo tiếp tục P02; phase này chưa triển khai khi đó. Giữ dependency, review phase trước và quyết định chặn module.

## 1 Mục tiêu

Tra cứu/xem/sửa hàng theo quyền và lịch giảm giá tự chạy 00:00 giờ Việt Nam, xử lý bù có bằng chứng thực thi thật.

## 2 Nguồn và yêu cầu

UC_2.1, UC_2.2, UC_2.3. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

SC060, SC061, SC062, SC063, SC064, SC065, SC066, SC067, SC068, SC069, SC070, SC071, SC072, SC073, SC074, SC252, SC253, SC254, SC255, SC256, SC257, SC258, SC259, SC260, SC261, SC262, SC263, SC264, SC265, SC266

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

Tra cứu/xem/sửa hàng theo quyền và lịch giảm giá tự chạy 00:00 giờ Việt Nam, xử lý bù có bằng chứng thực thi thật. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

| Nhóm | Component dự kiến |
|---|---|
| UI12 / Danh sách hàng hóa | ProductSearchTable |
| UI13 / Chi tiết hàng hóa | ProductDetail |
| UI14 / Sửa thông tin hàng hóa | ProductEditForm |
| UI15 / Theo dõi xử lý hàng tồn lâu | DiscountMonitor |

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

sanPham, productCosts, discountApplications, auditEntries; scheduler run metadata trong appMetadata hiện có, version sản phẩm. Tất cả là service local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

Source/test thực tế được liệt kê trong [REPORT_PHASE_7.md](REPORT_PHASE_7.md); các đường dẫn trong bảng task dưới đây là phạm vi dự kiến ban đầu, không phải manifest đầy đủ. Giữ stack/dependencies hiện có; không đổi lockfile.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [ ] G7-T01 — PARTIAL / PENDING REVIEW; query/detail tested, barcode BLOCKED | Tra cứu mã/tên/điều kiện/mã vạch đúng nguồn; mapping mã vạch với mã sản phẩm cần xác nhận trước sinh định dạng mới | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI12/13, query và số ngày tồn theo ngày nhập thật | src/features/inventory/, src/services/inventory.ts, src/services/discount-scheduler.ts, src/lib/vietnam-time.ts, src/db/ (run log), tests/unit/discount*, tests/e2e/inventory* | TC-UC2-1-MAIN |
| [x] G7-T02 — ACCEPTED_USER13/11/2026 | Sửa field được phép, giữ mã/ngày nhập/trạng thái; hàng đã bán không sửa; CAS chống stale form | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI14, InventoryService; chuyển sold chỉ trong bán hàng | src/features/inventory/, src/services/inventory.ts, src/services/discount-scheduler.ts, src/lib/vietnam-time.ts, src/db/ (run log), tests/unit/discount*, tests/e2e/inventory* | TC-UC2-2-MAIN; TC-BR-UC2-05..08 |
| [x] G7-T03 — ACCEPTED_USER13/11/2026 | Chu kỳ sau owner sửa giá giữ ngày nhập; staff reset theo Q10; dùng giá gốc chu kỳ và quy tắc làm tròn đã duyệt | Nguồn UC/BR/SC + code G2 và task trước trong phase | chu kỳ và version thay trong cùng command | src/features/inventory/, src/services/inventory.ts, src/services/discount-scheduler.ts, src/lib/vietnam-time.ts, src/db/ (run log), tests/unit/discount*, tests/e2e/inventory* | TC-P7-PRICE-RESET |
| [x] G7-T04 — ACCEPTED_USER13/11/2026 | Scheduler tính ngày VN, khởi động/mở lại/focus và hẹn mốc 00:00 khi web mở; bù ưu tiên 45 ngày rồi 30, không nhân giảm mỗi ngày | Nguồn UC/BR/SC + code G2 và task trước trong phase | DiscountScheduler thuần tính + runner; không nút chạy tay | src/features/inventory/, src/services/inventory.ts, src/services/discount-scheduler.ts, src/lib/vietnam-time.ts, src/db/ (run log), tests/unit/discount*, tests/e2e/inventory* | TC-P7-DAY-29-30-44-45; TC-P7-CATCHUP-45 |
| [x] G7-T05 — ACCEPTED_USER13/11/2026 | Lock/claim qua IndexedDB, khóa product+cycle+milestone; kiểm tra lại trạng thái/version trước ghi; log scheduledFor và executedAt thật | Nguồn UC/BR/SC + code G2 và task trước trong phase | thay giá + mốc + audit nguyên tử; run log ghi lỗi không giả thành công | src/features/inventory/, src/services/inventory.ts, src/services/discount-scheduler.ts, src/lib/vietnam-time.ts, src/db/ (run log), tests/unit/discount*, tests/e2e/inventory* | TC-P7-TWO-TABS; TC-P7-INTERRUPTED-RUN |
| [x] G7-T06 — ACCEPTED_USER13/11/2026 | UI15 theo dõi lịch/chính sách/run log/error; kiểm tương tác với sửa giá và bán hàng ở tab khác | Nguồn UC/BR/SC + code G2 và task trước trong phase | không thêm điều khiển ngoài nguồn; regression stock và cost | src/features/inventory/, src/services/inventory.ts, src/services/discount-scheduler.ts, src/lib/vietnam-time.ts, src/db/ (run log), tests/unit/discount*, tests/e2e/inventory* | TC-P7-SELL-EDIT-RACE |

## 9 Thứ tự và dependency

G6 tạo hàng thật; G3 quyền; Q10, Q12 phần làm tròn giảm, P10 giá dưới 20.000đ đã được xác nhận trong Decision Log. Trình tự T01 → T02 → ... vẫn là thứ tự chuẩn; T02–T06 đã có triển khai, không làm lại. Barcode T01 và các gate review còn mở; chỉ tiếp tục các phần độc lập phù hợp, không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_2.1, UC_2.2, UC_2.3; BR liên quan và mọi control test thuộc SC060, SC061, SC062, SC063, SC064, SC065, SC066, SC067, SC068, SC069, SC070, SC071, SC072, SC073, SC074, SC252, SC253, SC254, SC255, SC256, SC257, SC258, SC259, SC260, SC261, SC262, SC263, SC264, SC265, SC266. Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

Web đóng nhiều ngày; đổi timezone máy; chu kỳ reset đúng nửa đêm; 45 trước 30; crash giữa run; hai tab mở; sản phẩm vừa bán; giá nhỏ hơn 20k; phần lẻ 30%. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

3 UC; đúng các biên 29/30/44/45; 45 thắng khi mở muộn; mỗi mốc một lần/cycle; không đổi ngày nhập; không giảm hàng đã bán; multi-tab/retry không lặp; executedAt không giả thời gian web đóng; UI giám sát local khớp nguồn. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

Runner và rule trạng thái G7 đã có trong source; metadata tồn tại không tự chứng minh một lượt scheduler đã chạy. Không thêm backend/cron để né AD08. Giảm thiểu: kiểm read/write cùng transaction, test lỗi giữa transaction, không chỉnh screenshot baseline để che sai lệch. Các vấn đề chưa chốt giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_7.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Nhánh hiện tại là `coco/phase-7`; khi tiếp quản không có staged changes. Bảo toàn các thay đổi có sẵn; trong lượt này không stage/commit/push/deploy/reset. Workflow main vẫn chạy install/lint/typecheck/unit/audit/build/Chromium trước deploy. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
