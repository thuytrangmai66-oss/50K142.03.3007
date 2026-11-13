# Kế hoạch Giai đoạn 9 Báo cáo và dashboard theo dữ liệu thật

Ngày 11/11/2026. **NOT STARTED**. Roadmap đã được cho phép qua chỉ đạo tiếp tục P02; phase này chưa triển khai. Giữ dependency, review phase trước và quyết định chặn module. Không commit/push/deploy khi chưa được cho phép.

## 1 Mục tiêu

Năm báo cáo owner-only và dashboard hai vai trò lấy dữ liệu thật, đúng kỳ Việt Nam và giao dịch hợp lệ.

## 2 Nguồn và yêu cầu

UC_7.1, UC_7.2, UC_7.3, UC_7.4, UC_7.5. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

SC007, SC105, SC106, SC107, SC108, SC109, SC110, SC111, SC112, SC113, SC114, SC115, SC116, SC117, SC118, SC119, SC120, SC121, SC122, SC123, SC124, SC125, SC126, SC127, SC128, SC129, SC198

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

Năm báo cáo owner-only và dashboard hai vai trò lấy dữ liệu thật, đúng kỳ Việt Nam và giao dịch hợp lệ. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

| Nhóm | Component dự kiến |
|---|---|
| UI02 / Trang chủ | RoleShell/Dashboard |
| UI22 / Chọn báo cáo thống kê | ReportPicker |
| UI23 / Báo cáo doanh thu bán hàng | RevenueReport |
| UI24 / Báo cáo chi phí thu mua | PurchaseCostReport |
| UI25 / Báo cáo lợi nhuận | ProfitReport |
| UI26 / Báo cáo hàng tồn lâu | AgedStockReport |
| UI27 / Báo cáo dòng tiền | CashFlowReport |

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

hóa đơn/chi tiết hoàn tất, productCosts, sanPham, khachHang, finalized metadata; queries read-only. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

src/features/reports/, src/features/home/, src/services/report-queries.ts, src/lib/vietnam-time.ts, tests/unit/reports*, tests/e2e/reports-dashboard*. Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [ ] G9-T01 | Định nghĩa kỳ ngày/tháng/năm/khoảng theo VN, bao gồm ngày cuối bằng cận trên ngày kế tiếp; validate khoảng đảo/ngày không có thật | Nguồn UC/BR/SC + code G2 và task trước trong phase | ReportPeriod và UI22 picker/filter | src/features/reports/, src/features/home/, src/services/report-queries.ts, src/lib/vietnam-time.ts, tests/unit/reports*, tests/e2e/reports-dashboard* | TC-P9-VN-BOUNDARY |
| [ ] G9-T02 | Doanh thu: chỉ sales đã hoàn tất; tổng thu thực tế, số hóa đơn và bình quân; không cộng draft/cancel/retry | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI23, BR7-01..03 | src/features/reports/, src/features/home/, src/services/report-queries.ts, src/lib/vietnam-time.ts, tests/unit/reports*, tests/e2e/reports-dashboard* | TC-UC7-1-MAIN |
| [ ] G9-T03 | Chi phí: chỉ mua hoàn tất theo paidAt; số món thay vì số dòng; giá snapshot, zero mẫu số theo Q13 đã duyệt | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI24, BR7-04..09 | src/features/reports/, src/features/home/, src/services/report-queries.ts, src/lib/vietnam-time.ts, tests/unit/reports*, tests/e2e/reports-dashboard* | TC-UC7-2-MAIN |
| [ ] G9-T04 | Lợi nhuận: revenue trừ cost từng món đã bán; dòng tiền: thực thu trừ thực chi trong kỳ; tồn lâu lọc trạng thái còn kho và điều kiện | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI25/26/27, không dùng khung giá hiện tại làm cost | src/features/reports/, src/features/home/, src/services/report-queries.ts, src/lib/vietnam-time.ts, tests/unit/reports*, tests/e2e/reports-dashboard* | TC-UC7-3-MAIN; TC-UC7-4-MAIN; TC-UC7-5-MAIN |
| [ ] G9-T05 | Dashboard owner/staff đúng menu và các KPI có trong local; không hardcode tên/ngày/số liệu; một nguồn query dùng chung | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI02, HomePage thay shell khi aggregate đã có | src/features/reports/, src/features/home/, src/services/report-queries.ts, src/lib/vietnam-time.ts, tests/unit/reports*, tests/e2e/reports-dashboard* | TC-P9-DASHBOARD-ROLES |
| [ ] G9-T06 | Đối soát bộ fixture đóng sổ, empty/error, read-only và direct route/service staff bị chặn; reload giữ số liệu | Nguồn UC/BR/SC + code G2 và task trước trong phase | kiểm chéo hóa đơn, lịch sử khách, tổng kho và báo cáo | src/features/reports/, src/features/home/, src/services/report-queries.ts, src/lib/vietnam-time.ts, tests/unit/reports*, tests/e2e/reports-dashboard* | TC-P9-RECONCILIATION; TC-P9-STAFF-DENIED |

## 9 Thứ tự và dependency

G6/G8 hoàn tất giao dịch và snapshot paidAt/cost; G7 tồn lâu; G3 phân quyền. Làm T01 → T02 → ... theo thứ tự bảng, mỗi task có test trước khi tích hợp. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_7.1, UC_7.2, UC_7.3, UC_7.4, UC_7.5; BR liên quan và mọi control test thuộc SC007, SC105, SC106, SC107, SC108, SC109, SC110, SC111, SC112, SC113, SC114, SC115, SC116, SC117, SC118, SC119, SC120, SC121, SC122, SC123, SC124, SC125, SC126, SC127, SC128, SC129, SC198. Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

Không giao dịch; mẫu số 0; 23:59:59 VN; ngày cuối tháng/năm, nhuận; máy timezone khác; approved chưa mua; hàng thanh lý/hủy; cost thiếu/mâu thuẫn; duplicate command. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

5 UC + 2 dashboard; bộ số liệu đối soát có expected totals độc lập; tất cả kỳ/empty/zero được kiểm; staff không gọi báo cáo; không sửa DB khi đọc; không NaN/Infinity; ảnh UI02/UI22–27 được kiểm. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

Các KPI mẫu Figma là minh họa. Query phải dựa thời điểm hoàn tất và cost snapshot; không hồi tố theo giá mới. Giảm thiểu: đọc đúng role/source, làm migration additive với sentinel, test lỗi giữa transaction, không chỉnh screenshot baseline để che sai lệch. Các vấn đề chưa chốt giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_9.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Tạo nhánh làm việc riêng sau khi được phép code (ví dụ coco/phase-9); ghi commit theo task sau test; không force/reset/ghi đè thay đổi khác. Chỉ push/merge/deploy khi có cho phép. Workflow main hiện có vẫn install/lint/typecheck/unit/audit/build/Chromium trước deploy. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
