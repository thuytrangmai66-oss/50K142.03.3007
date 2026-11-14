# G9-D05 — Triển khai so sánh tồn kho tháng trước

Ngày 14/11/2026. **IMPLEMENTED / VERIFIED / PENDING REVIEW**. Người dùng đã duyệt phương án A tại [review](HISTORICAL_STOCK_REVIEW.md); ghi [Decision Log G9-D05](DECISION_LOG.md). Không tự nghiệm thu G9 hoặc chuyển G10.

## Phạm vi và nguồn

- Mốc cuối tháng trước = cận loại trừ 00:00 ngày đầu tháng hiện tại, giờ VN. Cùng phạm vi sản phẩm đã xác minh cho cả hai số lượng; không lấy số nhập tháng trước làm số tồn.
- Nhập: dùng facts của purchaseCostReport sau đối chiếu finalization, productCosts, provenance, snapshot line, mapping, receipt/audit. Chỉ nhận thời gian hoàn tất đủ căn cứ, không dùng ngày nhập nhìn giống hợp lệ để lấp nguồn thiếu.
- Bán: dùng salesReportLedger/P05 và paidAt tin cậy, khớp đúng sản phẩm/chi tiết. Món sold không có đúng một giao dịch đã xác minh/thời điểm thì chưa đủ căn cứ; không suy “chưa bán ở mốc” từ việc không tìm được ngày.
- Món còn kho phải không có cạnh bán mâu thuẫn. Món đã bán trước cận không vào cả hai số; bán đúng cận vẫn có trong tồn tháng trước, không còn ở hiện tại. Nhập đúng cận không vào số trước.
- Kernel loại nguồn thời gian không timezone, tương lai hoặc bán trước nhập. Dữ liệu thiếu/hỏng/mâu thuẫn, receipt/mapping thiếu hoặc orphan evidence: reader bảo thủ không công bố tỷ lệ. Lỗi storage thật tiếp tục là lỗi, không biến thành zero.
- Cả số hiện tại và số trước dùng cùng cohort đủ bằng chứng. Khi còn nguồn chưa xác minh, giữ placeholder theo phê duyệt; không công bố tỷ lệ riêng của một phần dữ liệu như thể là toàn lịch sử cửa hàng.
- Có cơ sở và baseline >0: `(current − previous)/previous ×100`, hiển thị tối đa một chữ số thập phân; baseline 0/thiếu căn cứ giữ “Chưa đủ cơ sở so với tháng trước”. Không thêm card/control, schema/version, migration/backfill hoặc metadata snapshot.
- Chạy trong cùng transaction readonly có guard owner với các KPI còn lại; không ghi dữ liệu khi xem/reload. Nguồn số tồn hiện tại và các trạng thái chưa đối chiếu của G9-D04 được giữ, phần trăm chỉ hiện khi đủ điều kiện.

## File thay đổi

Mới: `src/domain/stock-comparison.ts` (kernel), `src/services/stock-comparison.ts` (reader), `tests/unit/stock-comparison.test.ts`, `tests/e2e/home-stock-comparison.spec.ts`.

Sửa: `src/services/purchase-report.ts` (trả facts đã xác minh mọi thời điểm, không đổi tổng theo kỳ); `src/services/dashboard.ts` (gắn reader trong transaction owner); `src/features/home/HomePage.tsx` (giá trị phần trăm trong slot cũ); `tests/unit/report-queries.test.ts` (hợp đồng đã được G9-D05 mở gate, không còn assert BLOCKED lịch sử). Tài liệu/checklist/bằng chứng liên quan được cập nhật. Không thay workflow/dependency/schema hoặc dữ liệu người dùng.

## Kiểm chứng

| Tiêu chí | Test |
|---|---|
| Cận tháng VN, cuối năm/tháng nhuận, nhập/bán trước/đúng/sau cận | stock-comparison.test.ts, không dùng timezone máy |
| Tăng/giảm/0 và cùng cohort, baseline 0 | Kernel: tăng 100%, giảm 50%/100%, baseline 0 trả null |
| Thiếu/hỏng/tương lai/mâu thuẫn | Kernel invalid chronology; integration thiếu paidAt/receipt, mapping JSON hỏng, state sold không có thanh toán, state available mâu thuẫn cạnh bán |
| Legacy/ngày thanh toán không suy đoán | Thiếu ngày bán hoặc thu mua không dùng ngày header/finalizedAt để lấp; giữ dữ liệu gốc |
| Readonly/reload/quyền | Integration so toàn bộ store, reopen giữ kết quả, stock nằm trong ownerSummary bị guard; hồi quy staff/revoked |
| UI thực và timezone khác VN | Browser America/Los_Angeles, thu mua 2 món lúc 31/10 23:59:59.999 VN; 1/11 00:00 bán 1 món → -50%, hoặc nhập thêm 1 → +50%; screenshot và reload bất biến |
| UI nguồn legacy thiếu thời gian | Sau tạo giao dịch qua UI, fixture native bỏ paidAt trong profile kiểm thử → reopen → placeholder, không còn -50%, toàn bộ store không bị reader sửa |

Focused đầu: **68/68 unit/integration PASS** (16 kernel + 52 report queries), 14,13 giây. Ba ca nguồn thiếu/mâu thuẫn bổ sung sau đó cũng PASS trong full 491 ở dưới. Lint/typecheck/build PASS; build 4,52 giây, cảnh báo bundle >500 kB vẫn tồn tại.

Chromium focused đầu **8 PASS / 1 FAIL**, do fixture native IDB ghi ngoài Dexie không phát notification cùng tab. Điều chỉnh bước setup legacy thành reopen trước assertion, giữ nguyên mọi assertion placeholder/read-only/reload; không sửa runtime để che lỗi. Live business UI hai tab vẫn được kiểm riêng. Focused sau sửa **9/9 PASS**, 24,0 giây, 0 FAIL/SKIP (8 runtime + 1 proposal lịch sử). Full cuối: **491/491 unit/integration PASS**, 26 file, 126,19 giây; **151/151 Chromium PASS**, 8,2 phút; cả hai **0 FAIL / 0 SKIP**, exit 0. Không dùng kết quả 464/148 mốc cũ thay source hiện hành.

Ảnh thật: [giảm 50%](evidence/d05/sell-month-end.png), [tăng 50%](evidence/d05/purchase-month-end.png). Đã xem bố cục ô hiện có theo frame local/gói wording, không sửa màu/font/layout; pixel-diff tự động NOT RUN, nghiệm thu thiết kế PENDING REVIEW. Log focused/build và lượt lỗi ban đầu nằm trong evidence/d05.

## Bàn giao

Rà catalog phát hiện mô tả dẫn xuất SC198-C10..13 bị chép nhãn dashboard Chủ (doanh thu/pending/tồn) sang Nhân viên. Đã đối chiếu frame-198 local và G9-D04 để sửa **catalog test dẫn xuất**, đúng các nhãn thu mua/bán/nhập/khách đã duyệt; không sửa SRS/SDD gốc hoặc nghiệp vụ/UI. Chỉ cập nhật các control T05 có bằng chứng sang IMPLEMENTED/PENDING REVIEW, không tự PASS toàn bộ 297 SC hoặc pixel-diff.

Static audit thực thi script CI hiện có **5/5 PASS**; output mới lưu evidence/d05/static-audit.json/log. Script có đường dẫn output mặc định phase5; đã giữ nguyên nội dung audit phase5 trước lượt chạy (mục scope lịch sử), không đưa thay đổi ngoài phase vào commit.

Gate quyết định về nguồn lịch sử **đã được mở bởi G9-D05**. Trạng thái INSUFFICIENT_EVIDENCE/NO_BASELINE của một dataset là kết quả nghiệp vụ hợp lệ theo quyết định mới, không phải còn thiếu phê duyệt thuật toán. Hoàn tất full checks rồi chuyển gói G9 sang review thực tế; không tự DONE, không coi push là nghiệm thu.
