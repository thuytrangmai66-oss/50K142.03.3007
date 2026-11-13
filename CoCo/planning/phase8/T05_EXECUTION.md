# G8-T05 — Tra cứu, lịch sử và bản in hóa đơn bán hàng

Ngày 13/11/2026. **IMPLEMENTED / PENDING REVIEW**; chưa nghiệm thu task hoặc G8.

## Tiếp tục T05 sau lệnh commit/push

Mốc tiếp quản mới: HEAD `733829496c2506e637db37445c90672c425d843b`, branch `coco/phase-7`, local tracking `origin/coco/phase-7`; working tree CoCo ban đầu sạch. Đây là thay đổi Git đã có khi nhận lệnh tiếp tục, không phải commit do lượt kiểm chứng trước tạo. Giữ nguyên commit và dữ liệu hiện có; lượt T05 này không commit/push/deploy.

- Đã chạy nguyên bài lỗi hồi quy lịch sử thu mua riêng 3 lần, cả 3 PASS, có trace (`history-recovery-investigation.log`). Chưa tái hiện được nguyên nhân lỗi trước; không gọi đó là lỗi máy chậm hoặc tự sửa test. Lượt full 126 bài đang chạy đã dừng chủ động ở bước 27 khi rà soát tìm thấy thiếu sót T05 cần sửa; lượt này là **INTERRUPTED**, không tính PASS full suite.
- Đối chiếu lại ảnh CODEX `frame-89.png`: lỗi lịch sử mua phải dùng popup cảnh báo, không phải panel inline + nút Thử lại. Đã tái sử dụng `ResultDialog`; phần nền chỉ hiển thị hồ sơ khách lấy thật, không dựng hàng hóa đơn giả hoặc báo “không tìm thấy” khi đọc lỗi. Khách có thể đóng popup, quay lại hồ sơ và mở lịch sử để phục hồi sau khi lỗi được xử lý.
- Lỗi chi tiết hóa đơn đi từ lịch sử dùng cùng thông báo với Bán hàng; đóng thông báo trở về đúng lịch sử khách, không để màn hình kẹt hoặc thêm control ngoài Figma. Không thay đường tính giá, transaction, schema hoặc snapshot.
- Giữ vùng bảng lịch sử mua màu trắng đầy phần nội dung bằng Flexbox/min-height, bỏ tiêu đề lịch sử bị lặp ngoài breadcrumb và ngăn cơ chế tự cuộn chi tiết áp dụng nhầm cho danh sách này. Không đổi kích thước dòng, phân trang các module khác hoặc layout lịch sử khách bán cho COCO.
- Bổ sung `tests/e2e/sales-t05-errors.spec.ts`, hai bài cho Chủ/Nhân viên. Mỗi bài inject lỗi đọc IndexedDB thật vào chi tiết Bán hàng, lịch sử mua và chi tiết qua lịch sử; kiểm tra popup, đóng overlay, phục hồi không F5, console và toàn bộ store không thay đổi.

File source sửa thêm ở lượt tiếp tục: `src/features/customers/CustomerHistoryPage.tsx`, `src/components/layout/CoCoLayout.tsx`, `src/index.css`; test mới `tests/e2e/sales-t05-errors.spec.ts`. Cập nhật execution, plan và traceability để bỏ thông tin NOT IMPLEMENTED đã lỗi thời; không coi cập nhật trạng thái tài liệu là nghiệm thu.

### Điểm review OPEN — trạng thái trên chi tiết lịch sử mua

`TC-UC4-5-MAIN`, bước 5 trong SRS yêu cầu Trạng thái giao dịch trên chi tiết hóa đơn. UI09/SC090/SC283 trong Figma chỉ có mã, ngày, PTTT, thông tin khách/điểm và các dòng hàng/tổng tiền; không có ô trạng thái. Danh sách lịch sử đã hiển thị trạng thái đã mapping P05, dữ liệu trạng thái vẫn có trong bộ đọc; riêng **ô trạng thái trên chi tiết UI đang BLOCKED về đối chiếu thiết kế**. Giữ Figma, không tự thêm trường, không tự miễn trừ SRS hoặc coi quyết định G6 về hóa đơn thu mua là phê duyệt cho hóa đơn bán. Cần chủ dự án chốt ngoại lệ hoặc thiết kế bổ sung khi nghiệm thu.

### Mapping nghiệm thu T05

| ID | Bộ kiểm chứng | Phạm vi/giới hạn |
|---|---|---|
| UC_3.2 MAIN, ALT-01/02/03; BR-UC3-11 | `sales-pages.spec.ts`, unit `queries real finalized sales…` và `paginates compatible legacy sales…` | Danh sách, tìm theo mã/ngày/tên/điện thoại, kết hợp/reset, rỗng/không khớp, chọn trực tiếp, phân trang hai vai trò |
| UC_3.2 ERR-01 | `sales-pages.spec.ts` lỗi list + `sales-t05-errors.spec.ts` lỗi detail | Lỗi đọc native, popup đúng nguồn, đóng về list, phục hồi đọc thật |
| BR-UC3-12 | Unit snapshot/legacy và E2E so sánh toàn bộ store | Chỉ đọc, không backfill hoặc ghi giá lịch sử |
| UC_4.5 MAIN; BR-UC4-09/10 | `sales-t05-t06.spec.ts` và unit `joins paid customer history…` | Liên kết theo mã khách sau sửa hồ sơ, không lẫn lịch sử khách bán cho COCO; MAIN còn BLOCKED ô trạng thái chi tiết |
| UC_4.5 ALT-01 | `reference-data.spec.ts` | Khách chưa có giao dịch: thông báo không tìm thấy lịch sử mua |
| UC_4.5 ERR-01 | `sales-t05-errors.spec.ts` | Lỗi lịch sử/chi tiết, không giả dữ liệu, hai vai trò và phục hồi không reload |
| Print | `sales-t05-t06.spec.ts` | Ctrl+P/print-media, nền trắng, không sidebar, chỉ đọc; máy in/native dialog NOT RUN |

Lượt tiếp tục: **345/345 unit/integration PASS** (16 file, 0 FAIL/SKIP, 212,45 giây); lint, typecheck riêng và production build cuối PASS. Kiểm thử tập trung hai vai trò sau sửa layout cuối **2/2 Chromium PASS**, 17,5 giây. **Full Chromium cuối 128/128 PASS, 0 FAIL, 0 SKIP, exit 0, 13,3 phút**, gồm hồi quy G2–G7, hai tab, lịch sử, điểm/giá, lỗi đọc và print-media. Không dùng kết quả full cũ 125/126 để nghiệm thu bản sửa. Log: `unit-t05-full.log`, `lint-t05.log`, `typecheck-t05.log`, `build-t05.log`, `chromium-t05-errors-final.log`, `chromium-t05-full-final.log` trong `evidence/t05-t06/`.

Bài phục hồi lịch sử thu mua từng lỗi đã PASS trong 3 lượt riêng và full suite cuối. Chưa xác minh được nguyên nhân của lần thất bại cũ; không tuyên bố đã sửa được nguyên nhân đó. Không thay bài cũ, không tăng timeout hoặc bỏ assertion. T05 **IMPLEMENTED / PENDING REVIEW**, phần UI trạng thái vẫn BLOCKED theo đối chiếu SRS/Figma ở trên; không tự nghiệm thu T05/T06/G8 hoặc chuyển G9. Máy in/native print dialog và thiết bị ngân hàng/scanner thật NOT RUN.

Ảnh popup sau sửa: [Chủ](evidence/t05-t06/owner-history-read-error.png), [Nhân viên](evidence/t05-t06/staff-history-read-error.png). Đã xem trực tiếp ảnh và đối chiếu cấu trúc với SC089; chưa tuyên bố toàn bộ SC/control đã nghiệm thu pixel.

## Phạm vi và nguồn

Tiếp nối danh sách, tìm kiếm kết hợp, reset, phân trang và chi tiết UC_3.2 đã triển khai trong [gói sửa Bán hàng](SALES_FIGMA_SRS_FIX.md), không triển khai lại. Hoàn thiện liên kết lịch sử khách mua hàng từ COCO và chế độ in của hóa đơn. Nguồn UI09/SC038 và lịch sử khách hàng SC086/090/283 trong dữ liệu Figma local CODEX; không đọc Figma online. Giữ sidebar, màu sắc, typography và thiết kế hiện tại.

## Đã triển khai

- `Khách hàng → Lịch sử mua` truy xuất hóa đơn bán theo mã khách hàng, dùng cùng bộ đọc snapshot P05 với trang Bán hàng. Đổi tên/số điện thoại khách không làm mất liên kết.
- Chi tiết hiển thị tên, điện thoại, điểm và số tiền tại thời điểm thanh toán từ snapshot; không thay bằng hồ sơ/giá hiện tại. Hóa đơn legacy không được tự gán mã thanh toán hoặc trạng thái mới.
- Bộ đọc kiểm chứng snapshot với hóa đơn, chi tiết, sản phẩm và quan hệ nguồn. Snapshot sai/thiếu quan hệ báo lỗi, không rơi xuống fallback legacy để che sai dữ liệu.
- Tách `SaleInvoiceCard` để trang Bán hàng và lịch sử mua dùng chung đúng bố cục UI09. `Lịch sử bán` của khách cho COCO vẫn là luồng thu mua riêng, không lẫn hóa đơn bán hàng.
- Hỗ trợ Ctrl+P bằng CSS print: chỉ in hóa đơn, bỏ sidebar/header/thanh công cụ/nút quay lại, nền trắng, cho phép nội dung dài chảy trang; không thêm nút in/export ngoài ảnh thiết kế.
- Màn hình tra cứu và chế độ in chỉ đọc; kiểm thử so sánh tất cả store trước/sau thao tác. Không đổi schema, migration, trạng thái hoặc transaction thanh toán.

## File nguồn và kiểm thử

- Tạo `src/features/sales/SaleInvoiceCard.tsx`.
- Sửa `src/features/sales/SalesPages.tsx`, `src/features/customers/CustomerHistoryPage.tsx`, `src/services/reference-data/local.ts`, `src/services/reference-data/contracts.ts`, `src/components/layout/CoCoLayout.tsx`, `src/index.css`.
- Sửa `tests/unit/sale-payment.test.ts`, `tests/e2e/reference-data.spec.ts`, `tests/e2e/sale-payment.spec.ts`; tạo `tests/e2e/sales-helpers.ts` và `tests/e2e/sales-t05-t06.spec.ts`. Helpers được tách để tái sử dụng luồng UI có sẵn, không bớt bài test cũ.
- Các file đã có thay đổi từ gói trước được bảo toàn; danh sách trên chỉ mô tả phạm vi lượt triển khai này, không nhận toàn bộ working tree là thay đổi mới.

## Đối chiếu và bằng chứng

| Yêu cầu | Kiểm chứng | Kết quả |
|---|---|---|
| UC_3.2 / BR-UC3-11..12: danh sách, tìm kiếm, chi tiết | `sales-pages.spec.ts` giữ nguyên bộ kiểm tra UI, tìm kiếm kết hợp, reset, phân trang, dữ liệu rỗng/lỗi và cả hai vai trò | Xem kết quả cuối T06 |
| Lịch sử theo mã khách, không nhầm chiều giao dịch | `sales-t05-t06.spec.ts` sửa hồ sơ qua UI rồi mở lịch sử cả hai vai trò; kiểm tra lịch sử bán không chứa hóa đơn bán hàng | Xem kết quả cuối T06 |
| Snapshot lịch sử, nhiều dòng và giá riêng | Unit `sale-payment.test.ts`, bộ đọc hóa đơn cũ và E2E hóa đơn hai sản phẩm sau đổi hồ sơ/reload | Xem kết quả cuối T06 |
| Không sửa dữ liệu khi xem/in; lỗi snapshot không bị che | Unit snapshot hỏng + E2E so sánh tất cả store trước/sau | Xem kết quả cuối T06 |
| Figma và chế độ in | Ảnh hai vai trò 1440×900, print-media, phần tử điều hướng bị ẩn, nội dung và nền trắng còn nguyên | Xem kết quả cuối T06 |

Kết quả thực thi tổng hợp và ngoại lệ: [T06_EXECUTION.md](T06_EXECUTION.md). Ảnh: [Chủ](evidence/t05-t06/owner-customer-paid-history-1440x900.png), [Nhân viên](evidence/t05-t06/staff-customer-paid-history-1440x900.png), [bản in Chủ](evidence/t05-t06/owner-invoice-print.png), [bản in Nhân viên](evidence/t05-t06/staff-invoice-print.png).

## Giới hạn và bàn giao

Print-media trong Chromium được kiểm thử tự động; hộp thoại in native, xuất PDF và máy in vật lý **NOT RUN**, không tuyên bố đã in giấy thành công. Dùng Ctrl+P tại trang chi tiết hóa đơn, xem trước bản in trong Chrome trước khi in. Không sửa dữ liệu người dùng, không commit/push/deploy.
