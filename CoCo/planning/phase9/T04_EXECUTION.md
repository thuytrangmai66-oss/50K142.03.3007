# G9-T04 — Lợi nhuận, dòng tiền, hàng tồn lâu

Ngày 14/11/2026. **IMPLEMENTED / VERIFIED / PENDING REVIEW**. G9 vẫn IN PROGRESS, không bắt đầu G10.

## Nguồn và phạm vi

MASTER_PLAN và PLAN_PHASE_9, UC_7.3/7.4/7.5, BR-UC7-10 đến 21. Đã đối chiếu ảnh local CODEX SC120–129 đủ populated/empty/error và bộ lọc SC106–113, không đọc Figma online. Giữ Figma, dữ liệu IndexedDB và quyết định G9-D01/D02; không Supabase/backend/schema/migration/metadata mới. Mapping legacy không tự diễn giải. G9-M01/U01 về KPI khách mới vẫn BLOCKED; không đổi HomePage.

Git main, HEAD nền f580a229f77cadb4c4e18108ae42bf1189fbeffa, fetch origin thành công, HEAD trùng origin/main trước code. Giữ toàn bộ thay đổi T02/T03/rule và CODEX/launcher chưa commit. Theo AGENTS.md commit/push ở mốc phase đạt gate; G9 chưa đạt nên chưa commit/push, không deploy thủ công.

## Chức năng thực hiện

1. Tách DB-only sales-report-ledger từ truy vấn doanh thu hiện hữu để T02 và T04 dùng cùng bằng chứng/snapshot/receipt/audit và quy tắc đủ điều kiện; các transaction báo cáo chỉ đọc, kiểm reports.read đúng vai trò trước truy vấn. Không gọi auth/WebCrypto lồng trong transaction.
2. Lợi nhuận dùng thực thu của hóa đơn bán đã xác minh trong kỳ, trừ productCosts của đúng những món đã bán, đối chiếu invoice nguồn/provenance và bằng chứng thu mua. Không trừ toàn bộ hàng nhập/chưa bán và không tính lại theo khung giá mới. Giá vốn không đủ căn cứ khi hóa đơn bán đã xác minh gây lỗi dữ liệu, không tự thay bằng 0 hoặc công bố lợi nhuận giả. Không chặn lợi nhuận âm. Không có giao dịch thì ba chỉ số bằng 0.
3. Dòng tiền: actual inflow bán hàng trừ actual paid outflow thu mua theo kỳ Việt Nam của từng bên. Bao gồm ngày chỉ chi hoặc chỉ thu; có thể âm. Không gộp chi phí hoạt động hoặc loại giao dịch ngoài SRS. Giao dịch chưa xác minh/thiếu ngày tin cậy bị loại theo G9-D01.
4. Tổng/ngày tính bằng BigInt rồi kiểm giới hạn số an toàn, không NaN/Infinity. Nhóm ngày VN tăng dần, tổng cộng trên cả kỳ, độc lập trang.
5. Tồn lâu dùng ngày nhập kho để tính tuổi tồn, không dùng ngày reset chu kỳ giá. Chỉ hàng có mapping rõ ràng và hiện còn kho; sold/không phải available không vào kết quả, thiếu mapping được loại với danh sách ID chưa xác minh. Không gán nghĩa mới cho trạng thái legacy. Đối chiếu giá vốn/provenance, lấy thuộc tính hiện hành được G7 cho phép, hiển thị đúng giá đang áp dụng và badge giảm giá của chu kỳ hiện tại.
6. Bộ lọc tồn lâu: số ngày nguyên dương, loại hàng/thương hiệu từ dữ liệu thực, ngưỡng >=. Bảng 8 cột theo SC128, hai thẻ tổng hợp. Báo cáo này riêng, không đổi bảng Hàng hóa 5 cột đã được người dùng chốt.
7. Route `/reports/profit`, `/reports/cash-flow`, `/reports/aged-stock`, breadcrumb và picker đủ 5 lựa chọn đã hoạt động. Hai báo cáo tiền dùng layout chung, bộ lọc kỳ/bảng/pagination tái sử dụng. Không cuộn dọc trong bảng; số dòng thích ứng theo chiều cao.
8. Empty đúng thông báo source ngay trong bảng, lỗi đọc thật dùng ResultDialog; có thể thử lại, không còn modal chặn sau khôi phục. Với tồn lâu, xác nhận lại cũng tải lại danh mục khi danh mục từng gặp lỗi.

## Source/test tạo và sửa

Mới: `src/services/sales-report-ledger.ts`, `financial-reports.ts`, `aged-stock-report.ts`; `src/features/reports/FinancialReportPage.tsx`, `AgedStockReportPage.tsx`; `tests/unit/financial-number.test.ts`, `tests/e2e/reports-t04.spec.ts`.

Sửa: `src/services/report-queries.ts`, `purchase-report.ts` (trả tập invoice đã xác minh để đối chiếu giá vốn, không thay tổng T03); `src/features/reports/RevenueReportPage.tsx` (enable picker), `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx` (breadcrumb), `src/index.css` (scoped aged-stock), `tests/unit/report-queries.test.ts`. Không sửa sale/purchase finalizer, scheduler hay DB schema.

## Bảng đối chiếu UC/BR và bằng chứng

| UC/BR | Kiểm chứng |
|---|---|
| UC7.3 MAIN / BR10–13 | Unit sale thực: revenue 104.001, cost sold 80.001, profit 24.000; hàng chưa bán không vào cost sold; sửa khung giá không đổi lịch sử; E2E thanh toán UI thực 104.007/80.005/24.002 |
| BR14 / UC7.3 ALT | Không bán thì revenue/cost/profit 0, empty SC121 |
| UC7.5 MAIN / BR17–20 | Unit outflow 160.002 so với revenue 104.001 → net -56.001; ngày chỉ thu/chi, tách kỳ VN; E2E 104.007 - 160.010 = -56.003 |
| BR21 / UC7.5 ALT | Empty trả 0, thông báo SC124 |
| UC7.4 MAIN / BR15–16 | Unit sold bị loại, ngưỡng 2 ngày bao gồm đúng 2 ngày, 3 ngày không có; loại/brand không khớp trả rỗng; mapping thiếu không tự suy trạng thái; E2E 25 sản phẩm thật 13 ngày/13 ngày, threshold14 → empty |
| UC7.4 ALT/ERR | Empty SC129; 0/âm/lẻ/NaN bị service từ chối; SC127 lỗi input trên UI; native read failure và retry |
| UC7.3/7.5 ERR | Input kỳ sai không query; native getAll failure → popup → restore → query lại |
| Quyền / readonly | Staff URL bị chặn 3 route, service FORBIDDEN; hai phiên độc lập; so toàn bộ store trước/sau xem, filter, paging, lỗi/reload |
| Toàn vẹn tiền | Unit negative profit -70.001; safe-number kiểm hai giới hạn số và overflow cả âm/dương; không thay bằng zero |
| Legacy | Unit invoice có ngày/mã số nhưng không proof bị loại khỏi tiền; marker tồn kho thiếu không suy ra available; giữ nguyên raw rows |

## Thực thi và lỗi trước/sau

- Typecheck/lint PASS; build cuối PASS 4,12 giây. Còn cảnh báo bundle >500 kB đã có, không thay config/dependencies để che cảnh báo.
- Full unit/integration ban đầu **435/435 PASS**, 23 file, 97,56 giây, 0 FAIL/SKIP. Lượt focused ban đầu phát hiện một assertion viết kỳ vọng zero trong khi contract implementation đã định nghĩa từ chối giá vốn không xác minh; sửa test yêu cầu lỗi REFERENCE và DB không đổi, không sửa service để tạo zero.
- Focused Chromium ban đầu 3 PASS/1 FAIL do selector getByLabel exact của select có options; đổi sang combobox role/name đúng accessibility snapshot, giữ dữ liệu lọc và assertions.
- Lượt kế 3 PASS/1 FAIL ở so DB: scheduler G7 chạy bù khi test chuyển ngày rồi reload, ghi discount-day/run/sequence hợp lệ (updated=0). Sửa setup: reload và chờ chính scheduler báo success trước baseline, không tắt scheduler hoặc lọc bỏ metadata khỏi so sánh.
- Đã bổ sung retry danh mục và assertion :modal bằng 0 sau khôi phục lỗi. Focused cuối **4/4 PASS**, 16,1 giây, exit 0. Giao dịch/sản phẩm được tạo qua UI thật, không seed hóa đơn giả.
- Full cuối: **435/435 unit/integration PASS**, 23 file, 97,06 giây, **0 FAIL / 0 SKIP**, exit 0; **142/142 Chromium PASS**, 6,7 phút, **0 FAIL / 0 SKIP**, exit 0. Gồm hồi quy G2–G8, hai tab, quyền, rollback/reload và T02/T03. Logs `unit-final.log`, `chromium-full.log`; `chromium-full-last-run.json` ghi passed/failedTests rỗng. Không tính lượt FAIL hoặc kết quả T03 thay bản cuối.
- Bổ sung listener console.error vào test luồng tiền/tồn lâu và chạy lại focused trên cùng build app: **4/4 PASS**, 16,1 giây, không console.error/pageerror ở các luồng được lắng nghe. Lint/typecheck sau bổ sung test PASS. Không cộng lượt chạy trùng này vào 142 ca unique của full suite. Log `chromium-console.log`.

## Bằng chứng và giới hạn

Ảnh dưới [evidence/t04](evidence/t04/): [lợi nhuận](evidence/t04/profit-1440.png), [dòng tiền](evidence/t04/cash-flow-1920.png), [tồn lâu](evidence/t04/aged-stock-1366.png); có đủ ảnh 1366/1440/1920, empty/error tương ứng và staff-t04-denied.png. Đã xem và so bố cục ảnh populated/empty/error nguồn trước code, kiểm bằng mắt ảnh desktop và dùng assertion viewport/paging/rows/totals. Pixel-diff **NOT RUN**, không coi test PASS là nghiệm thu Figma.

SC127 dùng câu “Số ngày tồn kho tối thiểu không hợp lệ…” trong khi catalog SRS rút gọn “Số ngày tồn kho không hợp lệ…”. UI giữ nguyên câu theo ảnh Figma, điều kiện nguyên dương không thay đổi; ghi khác biệt văn bản để review, không bổ sung rule hay control.

Các ngoại lệ G6/G8, G9-M01/U01 và T05/T06 chưa hoàn tất vẫn giữ nguyên. Không tự đánh dấu G9 DONE. Bước tiếp theo T05 dashboard theo plan; KPI Khách hàng mới còn gate nguồn ngày tạo/trình bày riêng.

## Local

http://127.0.0.1:5173/50K142.03.3007/#/reports — Chủ cửa hàng chọn một trong năm báo cáo. Nếu server chưa chạy: trong CoCo dùng `npm.cmd run dev -- --host 127.0.0.1 --port 5173`. Chọn kỳ có giao dịch đã hoàn tất cho tiền; nhập số ngày nguyên dương và loại/brand cho tồn lâu. Nhân viên không có menu báo cáo và URL trực tiếp bị chặn. Không reset/seed dữ liệu của trình duyệt người dùng.
