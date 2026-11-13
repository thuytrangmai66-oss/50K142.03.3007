# G8-T05 — Tra cứu, lịch sử và bản in hóa đơn bán hàng

Ngày 13/11/2026. **IMPLEMENTED / PENDING REVIEW**; chưa nghiệm thu task hoặc G8.

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
