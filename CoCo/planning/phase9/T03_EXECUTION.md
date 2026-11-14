# G9-T03 — Báo cáo chi phí thu mua

Ngày 14/11/2026. **IMPLEMENTED / VERIFIED / PENDING REVIEW**. Không nghiệm thu G9, không chuyển phase.

## Nguồn và phạm vi

MASTER_PLAN và PLAN_PHASE_9: tiếp tục T03 sau T02; UC_7.2, BR-UC7-04 đến 09, Q13 (mẫu số 0 trả 0), quyết định G9-D01/D02. Đọc ảnh local CODEX SC117 populated, SC118 empty và SC119 error trước khi code; tái sử dụng bộ lọc SC106–113 và style hiện hành. Không truy cập Figma online. Giữ nguyên schema v4, marker P03/P04 và mapping mới 1/1/2, không diễn giải mã legacy.

Git main, HEAD nền f580a229f77cadb4c4e18108ae42bf1189fbeffa. Fetch origin thành công, HEAD và origin/main trùng nhau trước code. Giữ toàn bộ thay đổi T02/rule/CODEX/launcher đang có; không stash/reset/rebase. Gate G9 chưa hoàn tất nên chưa commit/push; không deploy thủ công.

## Đã triển khai

- Service `purchaseCost` owner-only qua reports.read, truy vấn trong transaction readonly. Kiểm snapshot, draft đã finalized, dòng hàng, mã hóa đơn/khách/nhân viên, marker trạng thái, receipt/audit và lịch sử định danh nhân viên, provenance/productCosts và số món thực tế. Không đòi sản phẩm hiện còn trong kho mới tính chi phí lịch sử.
- Tổng chi phí lấy paidTotal snapshot đã xác minh, số món từ physical products đối soát quantity từng dòng; nhiều dòng cùng khung giá khác đơn giá được giữ riêng. Không dùng khung giá hiện tại hoặc legacy detail để thay snapshot.
- Chỉ cộng paidAt hợp lệ nằm trong kỳ Việt Nam. Không có bằng chứng là UNVERIFIED; bằng chứng đầy đủ nhưng thiếu/không hợp lệ paidAt vẫn phân loại VERIFIED/MISSING_TIME hoặc INVALID_TIME và loại khỏi tổng theo kỳ. Không dùng ngày hóa đơn/nhập kho/finalization/audit làm ngày thay thế, không ghi backfill.
- Nhóm ngày tăng dần, tính bình quân tổng chi phí/số giao dịch, mẫu số 0 trả 0; tổng số tiền/số món dùng BigInt trước khi chuyển về số an toàn. Tổng cộng trên cả kỳ, không phụ thuộc trang.
- Route `/reports/purchase-cost`, breadcrumb và picker đã kích hoạt cho Chủ. Bốn ô chỉ số, bảng năm cột, tổng cộng và pagination thích ứng dùng component sẵn có. Empty hiển thị bốn số 0 + thông báo trong bảng; lỗi đọc thật dùng popup SC119 và có thể query lại.
- Không có write từ màn hình báo cáo, không thêm metadata, schema, migration, business rule, UI ngoài nguồn hoặc Supabase. G9-M01/U01 về KPI Khách hàng mới vẫn BLOCKED.

## File source/test trong T03

Mới: `src/services/purchase-report.ts`, `src/features/reports/PurchaseCostReportPage.tsx`, `tests/e2e/reports-purchase-cost.spec.ts`.

Sửa: `src/services/report-queries.ts`, `src/features/reports/RevenueReportPage.tsx` (enable lựa chọn), `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx` (breadcrumb), `src/index.css` (grid 4 card scoped), `tests/unit/report-queries.test.ts`, `tests/e2e/reports-revenue.spec.ts` (kỳ vọng nút chi phí nay enabled), `src/repositories/purchase-links.ts` (đọc FK theo lô, xem lỗi hiệu năng bên dưới).

Không sửa finalizer, dữ liệu trình duyệt người dùng, auth/session, schema hay dependencies.

## UC/BR và bằng chứng

| UC/BR | Test và tiêu chí |
|---|---|
| BR-04 số món | Unit: 1 giao dịch/2 món; nhiều dòng cùng khung; E2E 1/3, rồi 26 giao dịch/28 món |
| BR-05 paidAt theo kỳ | Unit: kỳ đúng/không có giao dịch, thiếu/invalid paidAt; E2E bốn loại kỳ và reload |
| BR-06 snapshot giá | Unit đổi khung giá sau hoàn tất, giá 70.001/90.001 cùng khung vẫn cộng đúng |
| BR-07 chỉ hoàn tất | Adapter yêu cầu draft finalized + receipt/audit + graph; không đọc draft/approval làm chi phí |
| BR-08 không đếm trùng | Unit finalize cùng operation hai lần, chỉ tăng 1 giao dịch; E2E tổng cả kỳ không đổi khi paging |
| BR-09 bình quân | Unit 480.006/2 = 240.003, empty = 0; E2E số liệu thực thu mua 240.015/1 |
| UC7.2 MAIN | Giao dịch hoàn tất qua UI, picker/filter/cards/table/footer, 25 ngày dữ liệu, 3 viewport |
| ALT empty | SC118 bốn số 0 và thông báo inline đúng nguồn, không popup giả |
| ERR thời gian/DB | Ngày/kỳ không hợp lệ không query; native IDB getAll lỗi → popup SC119 → restore → query lại |
| Quyền/readonly | Staff URL bị chặn + service FORBIDDEN, revoked token AUTH_REQUIRED; so toàn bộ store trước/sau đọc/lỗi/reload |
| Legacy | Unit hóa đơn có ngày/mã số nhưng không có marker/proof bị loại, giữ nguyên raw; thiếu paidAt không lấy mốc khác thay thế |

## Kết quả thực thi

- Lint, typecheck: **PASS**. Production build sau tối ưu validator **PASS**, 5,59 giây; vẫn có cảnh báo bundle >500 kB, không thay giới hạn/dependency.
- Full unit/integration: **421/421 PASS**, 22 file, 0 FAIL/SKIP, 177,82 giây, exit 0. Có 8 ca T03 mới và mở rộng ca quyền staff/revoked.
- Lượt focused unit đầu 20 PASS/2 FAIL do assertion dùng sai tên trường coverage (`unverified` thay vì contract `unverifiedRecords`); sửa đúng tên contract, không đổi classifier hay nới điều kiện. Full unit phía trên đã kiểm lại thành công.
- Focused Chromium: **3/3 PASS**, 1,3 phút, exit 0. 25 dòng ngày đến từ 26 giao dịch tạo/thanh toán qua UI thật, không seed hóa đơn giả.
- Full Chromium đầu: **137 PASS / 1 FAIL / 0 SKIP**, 9,8 phút. Ca 25 ngày bị timeout ở bước thêm sản phẩm (`Đang lưu…`, trước khi mở báo cáo); chạy riêng lại nguyên ca cũng FAIL. Không bỏ ca, nới timeout hay báo full PASS.
- Rà luồng lưu cho thấy validator purchase-links lặp truy vấn IDB theo từng dòng/quan hệ và toàn bộ lịch sử, gây nhiều lượt đọc khi số giao dịch tăng. Chuyển validator sang bulk read và map tra cứu trong transaction hiện hữu, giữ nguyên từng điều kiện schema/FK/snapshot/cardinality và identity alias. Không thêm cache ngoài transaction, không bỏ kiểm tra hoặc sửa UI/nghiệp vụ để test qua. Cần chạy lại full unit/contract và Chromium sau thay đổi này.
- Sau tối ưu: full unit/integration **421/421 PASS**, 22 file, 0 FAIL/SKIP, 137,51 giây; ca 25 ngày chạy lại **1/1 PASS**, 25,5 giây, giữ nguyên timeout/assertion và luồng UI. Full Chromium sau tối ưu đang chạy; không coi kết quả trước bản sửa là kết quả cuối.
- Kết quả cuối trên build sau tối ưu: **138/138 Chromium PASS, 0 FAIL/SKIP**, 6,6 phút, exit 0; **421/421 unit/integration PASS, 0 FAIL/SKIP**, 137,51 giây. Gồm hồi quy G2–G8, quyền, hai tab, rollback, reload/migration và cả báo cáo doanh thu T02. Log `chromium-full.log`, `unit-final.log`, trạng thái `chromium-last-run.json`: passed, failedTests rỗng. Giữ log lượt FAIL và lượt kiểm tra lại; không dùng kết quả 135/135 của T02 làm kết quả cho build T03.

## Ảnh và giới hạn

[1366](evidence/t03/purchase-cost-1366.png), [1440](evidence/t03/purchase-cost-1440.png), [1920](evidence/t03/purchase-cost-1920.png), [empty](evidence/t03/purchase-cost-empty.png), [error](evidence/t03/purchase-cost-error.png), [staff denied](evidence/t03/staff-cost-denied.png). Phân trang nhiều dòng: [1366](evidence/t03/cost-pagination-1366.png), [1440](evidence/t03/cost-pagination-1440.png), [1920](evidence/t03/cost-pagination-1920.png). Logs nằm tại evidence/t03 (gitignored), ảnh là browser context kiểm thử riêng, không dữ liệu thật của người dùng. Đối chiếu ảnh bằng mắt và assertion viewport/row/total; pixel-diff **NOT RUN**, không tuyên bố nghiệm thu Figma tự động.

Local: http://127.0.0.1:5173/50K142.03.3007/#/reports/purchase-cost. Nếu chưa chạy server: trong CoCo dùng `npm.cmd run dev -- --host 127.0.0.1 --port 5173`. Đăng nhập Chủ → Báo cáo → Xem báo cáo chi phí thu mua → chọn kỳ đã thu mua hoàn tất → Xác nhận. Không reset/seed dữ liệu. Bước tiếp theo là T04 (lợi nhuận, dòng tiền, hàng tồn lâu) theo dependency; T05 KPI khách mới vẫn có review riêng.
