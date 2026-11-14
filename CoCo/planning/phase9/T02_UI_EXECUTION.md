# G9-T02 — Tích hợp báo cáo doanh thu vào ứng dụng

Ngày 14/11/2026. **IMPLEMENTED / VERIFIED / PENDING REVIEW**. Không nghiệm thu G9.

## Phạm vi và nguồn

- Giữ thứ tự T01 → T02 → T03; lượt này nối T01/T02 vào runtime, chưa làm thay T03–T06.
- UC_7.1, BR-UC7-01/02/03; quyết định G9-D01/D02 và hợp đồng P05 hiện hữu.
- Figma local CODEX: SC105 (picker), SC106–113 (bộ lọc), SC114 (doanh thu), SC115 (rỗng ngay trong bảng), SC116 (popup lỗi hệ thống). Không dùng số minh họa làm dữ liệu nghiệp vụ.
- Git: `main`, HEAD nền `f580a229f77cadb4c4e18108ae42bf1189fbeffa` chứa PR #3 đã merge. Đồng bộ fast-forward và chuyển `main` trước khi sửa source; giữ nguyên rule, CODEX và launcher chưa commit. Chính sách Git mới ở root AGENTS.md thay các chỉ đạo Git cũ trong hồ sơ.

## Đã triển khai

1. Khởi tạo ReportQueriesService theo token của từng tab trong AuthProvider. Menu Báo cáo chỉ hiện cho Chủ cửa hàng; direct route vẫn kiểm reports.read và service kiểm quyền độc lập.
2. Route `/reports` dùng picker 5 ô theo SC105. Chỉ ô doanh thu được kích hoạt; 4 ô còn lại disabled, title nêu chưa triển khai. Không có liên kết giả hoặc báo cáo mock để che tiến độ.
3. Route `/reports/revenue` dùng bộ lọc ngày/tháng/năm/khoảng. Chỉ xác nhận kỳ hợp lệ mới query. Hiển thị 3 chỉ số và bảng 4 cột, dòng Tổng cộng tính trên **toàn bộ kỳ**, không trên trang đang xem.
4. Nhóm các hóa đơn đủ điều kiện theo ngày thanh toán Việt Nam, sắp xếp tăng dần. Tổng dòng đối soát với tổng kỳ; trung bình toàn kỳ lấy tổng thực thu/chỉ số hóa đơn, không lấy trung bình của các trung bình ngày.
5. Dùng PaginatedTable/Pagination và cơ chế đo chiều cao hiện hữu. Bổ sung footer tùy chọn, trừ chiều cao footer khi đo số dòng; các bảng không có footer giữ hành vi cũ. Không cuộn dọc bên trong bảng.
6. SC115: dữ liệu đủ điều kiện bằng 0 hiển thị ba số 0 và thông báo rỗng trong bảng, không mở popup. SC116: lỗi đọc thật hiển thị ResultDialog, không giả thành rỗng/thành công; có thể xác nhận lại sau khôi phục.
7. Không ghi dữ liệu khi xem báo cáo. Không sửa schema/finalizer/legacy; không lấy NgayBan làm paidAt, không ghi nguồn ngày tạo khách. Snapshot/evidence không đủ điều kiện tiếp tục bị loại theo hợp đồng đã duyệt.

## File source/test

- Mới: `src/features/reports/RevenueReportPage.tsx`, `tests/e2e/reports-revenue.spec.ts`.
- Sửa: `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx`, `src/components/ui/DataTable.tsx`, `src/domain/revenue-report.ts`, `src/features/auth/AuthProvider.tsx`, `src/features/auth/context.ts`, `src/features/reference-data/use-list-page-size.ts`, `src/features/reports/ReportPicker.tsx`, `src/index.css`, `src/services/report-queries.ts`, `tests/unit/report-queries.test.ts`, `tests/unit/revenue-report.test.ts`, `tests/e2e/auth.spec.ts`.
- Tài liệu: execution này, REPORT_PHASE_9, PLAN_PHASE_9, T01_EXECUTION, IMPLEMENTATION_REVIEW và ghi chú tiến độ trong master/traceability/catalog.

## Đối chiếu yêu cầu và kiểm thử

| Tiêu chí | Bằng chứng |
|---|---|
| BR-UC7-01: thực thu sau ưu đãi | `report-queries.test.ts`: giao dịch giảm điểm thực; E2E thanh toán UI 83.206đ |
| BR-UC7-02: trung bình, mẫu số 0 | `revenue-report.test.ts`: empty/average/overflow; SC115 ba chỉ số 0 |
| BR-UC7-03: thanh toán có căn cứ | report-queries/report-eligibility/report-legacy-migration; E2E native thiếu paidAt + legacy có ngày bán bị loại, bảo toàn gốc |
| TC-UC7-1-MAIN | E2E 4 loại thời gian, 25 hóa đơn hoàn tất qua UI, bảng/tổng, reload |
| TC-UC7-1-ALT-01 | E2E kỳ 2000 rỗng, thông báo inline SC115 |
| TC-UC7-1-ERR-01 | Form từ chối ngày 33/01, cho sửa và tìm lại |
| TC-UC7-1-ERR-02 | Inject native IDB getAll failure; popup đúng nội dung, khôi phục rồi query lại |
| Quyền và hai tab | Staff không có menu, direct URL bị chặn; owner tab còn hoạt động; service owner-only đã có integration test |
| Read-only | So toàn bộ store trước/sau tìm kiếm, phân trang, reload và lỗi; fixture chỉ nằm trong browser context kiểm thử |
| Layout | Viewport 1366×768, 1440×900, 1920×1080; page size thích ứng, căn giữa trong main, không cuộn dọc trong bảng, tổng kỳ ổn định khi đổi trang |

## Kết quả thực thi

- Baseline full unit/integration: **410/410 PASS**, 22 file, 0 FAIL/SKIP, 195,77 giây.
- Sau bổ sung query rows và test: **413/413 PASS**, 22 file, 0 FAIL/SKIP, 173,44 giây. Log `evidence/t02-ui/unit-full.log` (local, gitignored). Thay đổi tiếp theo chỉ sửa biểu diễn rỗng theo SC115; không sửa kernel/service.
- Lint/typecheck/build trên source cuối: **PASS**, build 4,20 giây. Cảnh báo bundle >500 kB vẫn tồn tại; không đổi dependency/giới hạn để che cảnh báo.
- Focused Chromium ban đầu **3/3 PASS** trước khi hoàn thiện SC115; không dùng kết quả đó thay cho kiểm chứng giao diện cuối.
- Full Chromium lượt đầu được chủ động dừng khi đối chiếu phát hiện empty state sai SC115; **CANCELLED**, không báo PASS cho lượt đó.
- Full Chromium lần kế: **132 PASS / 3 FAIL / 0 SKIP**, 9,1 phút. Không tính là PASS. Một assertion cũ mong owner `/reports` trả 404 đã lỗi thời sau tích hợp; một fixture legacy bị màn hình Sales strict chặn bằng popup; một lỗi thật làm header khuất ở 1366×650 do scrollIntoView cuộn cả ancestor. Log `chromium-initial-failures.log` lưu local.
- Sửa đúng nguyên nhân: test owner kiểm picker thật nhưng giữ kiểm staff/session revoke; fixture dữ liệu không hoàn chỉnh được nạp trên route reporting, không bỏ validation Sales; layout chi tiết cuộn riêng main và giữ window ở đầu trang, giữ scroll-margin hiện hữu. Không nới timeout/assertion hình học. Targeted rerun **4/4 PASS**, 9,9 giây.
- Full unit/integration lặp lại trên source cuối: **413/413 PASS**, 22 file, **0 FAIL / 0 SKIP**, 94,65 giây, exit 0. Log `unit-full.log` đã cập nhật theo lượt cuối.
- Full Chromium build cuối: **135/135 PASS / 0 FAIL / 0 SKIP**, 6,7 phút, exit 0. Có đủ 4 ca reports-revenue, toàn bộ regression G2–G8, kiểm quyền, hai tab, migration/reload, rollback và các viewport thấp. Log `chromium-full.log`; `chromium-last-run.json` ghi trạng thái passed. Không dùng lượt FAIL hoặc CANCELLED làm bằng chứng PASS.

## Rút kinh nghiệm cho task tiếp theo

- Xem đủ ảnh populated/empty/error trước khi code, không suy bố cục rỗng từ nội dung SRS hoặc dùng popup mặc định.
- Khi mở route mới, kiểm test quyền cũ đang dùng route placeholder 404 trước full regression; cập nhật kỳ vọng theo chức năng thật, giữ các kiểm bảo mật.
- Fixture lỗi phải được nạp từ đúng màn hình đang kiểm, tránh validation hợp lệ của module khác chặn setup. Không sửa nghiệp vụ để fixture lỗi đi qua.
- Rà toàn bộ marker lỗi trong log, không chỉ đọc vài dòng cuối khi báo tiến độ. Chạy ca thất bại trước rồi mới full; phân biệt CANCELLED/FAIL/PASS và giữ log.

## Bằng chứng và giới hạn

Ảnh tại [evidence/t02-ui](evidence/t02-ui/): [1366×768](evidence/t02-ui/owner-revenue-1366x768.png), [1440×900](evidence/t02-ui/owner-revenue-1440x900.png), [1920×1080](evidence/t02-ui/owner-revenue-1920x1080.png), [khoảng ngày](evidence/t02-ui/owner-revenue-range.png), [rỗng SC115](evidence/t02-ui/owner-revenue-empty.png), [lỗi SC116](evidence/t02-ui/owner-revenue-error.png), [chặn Nhân viên](evidence/t02-ui/staff-report-denied.png). Ảnh từ browser profile kiểm thử, không chụp dữ liệu người dùng. Đây là đối chiếu bố cục thủ công và assertion hình học, **không phải** pixel-diff được nghiệm thu. Phân trang thích ứng là tinh chỉnh đã được người dùng duyệt; 4 lựa chọn chưa triển khai bị khóa có chủ đích.

G9-M01/U01 vẫn BLOCKED về KPI khách hàng mới. T03 chi phí thu mua là task tiếp theo; T04/T05/T06 chưa được báo hoàn tất. G9 tiếp tục IN PROGRESS/PENDING REVIEW. Chưa đạt mốc kết thúc phase để commit/push; không deploy thủ công.

## Chạy và kiểm tra local

Giữ origin hiện có: `http://127.0.0.1:5173/50K142.03.3007/#/reports`. Nếu chưa có server: trong CoCo chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5173`. Đăng nhập Chủ → Báo cáo → Xem báo cáo doanh thu bán hàng → chọn kỳ có hóa đơn đã thanh toán → Xác nhận. Không cần reset hoặc seed dữ liệu trình duyệt. Dùng Nhân viên để kiểm menu không hiện và URL báo cáo bị chặn.
