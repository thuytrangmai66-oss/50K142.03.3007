# Sửa module Bán hàng theo Figma và SRS

Ngày 13/11/2026. **IMPLEMENTED / PENDING REVIEW**. Phạm vi: danh sách/chi tiết UC_3.2, sửa UI10, giữ UI11 và transaction đã có; không tự nghiệm thu G8.

## Nguồn và quyết định

- Chỉ đạo trong attachment `c49701be-4ed3-4d32-89ef-4e71f5943eba/Pasted text.txt`.
- SRS UC_3.1/UC_3.2, BR-UC3-01..12; SDD/UI08–UI11 và nguồn local CODEX SC037–043, SC046, SC233/238.
- Đã đọc PDF gốc Chủ: Quản lý bán hàng 1 và Tạo giao dịch bán hàng 1, **MediaBox 1440×900**. SHA-256 và viewport tại [source-viewport.json](evidence/sales-figma-fix/source-viewport.json). Ảnh Chromium đối chiếu ở 1440×900, device scale 1, zoom mặc định 100%; kiểm thêm 1366×768 và 1920×1080. Không dùng CSS zoom/transform scale.
- **G8-D05:** chỉ đạo mới yêu cầu tự động giảm 20% cho thành viên đủ 50 điểm, bỏ checkbox dùng ưu đãi. Thay phần lựa chọn của D02 cho giao dịch mới; không sửa công thức, snapshot cũ, opt-in đăng ký hoặc P05. Xem [Decision Log](DECISION_LOG.md).

## Thiếu trước sửa / kết quả

| Trước sửa | Sau sửa |
|---|---|
| Sidebar vào thẳng `/sales/new`, thiếu danh sách | Sidebar vào `/sales`, đọc hóa đơn đã lưu; Tạo giao dịch mở route hiện có `/sales/new` |
| Thiếu tìm kiếm/xóa lọc/chi tiết | Kết hợp mã/ngày Việt Nam/tên/SĐT; reset, pagination và chi tiết chỉ đọc |
| Header “Thông tin giao dịch – Mã nháp …” | “Phiếu bán hàng”, mã draft thật đặt trong pill theo bố cục Figma; không hardcode HD00020 hoặc đổi scheme định danh |
| Thêm mở popup nhập mã, không có thanh mã trong trang | Ô nhập/quét mã + Thêm cạnh nhau trên bảng; hỗ trợ nhập tay và keyboard-wedge/Enter |
| Tên cột “Số lượng”, SKU nổi hơn tên | 4 cột Sản phẩm/SL/Đơn giá/Thành tiền, tên đậm và SKU bên dưới, tỷ lệ cột theo thiết kế |
| Checkbox chọn dùng 50 điểm | Không còn control chọn ưu đãi; UI và service tự xét membership/điểm, không tin flag opt-out cũ |
| Nhiều đường chấm giữa từng dòng tiền, label dự kiến | Tổng tiền hàng/Khuyến mãi cùng cấp label; đường phân cách trước Tổng tiền; hai phương thức và Lưu/Hủy dưới cùng |
| Sau thanh toán mở lại giỏ mới trực tiếp | Đóng thông báo trở về danh sách đã cập nhật; Hủy cũng về danh sách |

## Dữ liệu, quyền và tính toàn vẹn

- `SalesQueriesService` chỉ dùng authenticated read transaction với `sales.read`; cả Chủ/Nhân viên được truy cập. Không tạo hóa đơn từ draft, không seed/mock runtime.
- Hóa đơn mới được đối chiếu với snapshot P05, dòng hàng, FK, mapping, ngày/tiền/điểm trước khi hiển thị. Snapshot hỏng không được fallback thành legacy để che lỗi.
- Danh sách tìm theo hồ sơ khách hiện tại qua MaKH; chi tiết hóa đơn mới dùng snapshot lịch sử tên/SĐT/giá/điểm tại thời điểm bán. Đổi hồ sơ không viết lại lịch sử.
- Legacy tiếp tục dùng dữ liệu đã lưu; không gán lại mã PTTT/trạng thái bằng mapping hóa đơn mới, không bịa điểm sau giao dịch. Chỗ không có căn cứ hiển thị “Chưa xác định”.
- Giảm tự động chỉ cho thành viên đủ 50 điểm; trừ đúng 50 và tích điểm theo tiền thực trả trong transaction cũ, chỉ sau thành công. Backend/DB schema, migrations và mã P05 không đổi.
- Cập nhật membership/điểm từ thao tác app ở tab khác được phản ánh vào preview, không cần F5. Quote/finalizer vẫn kiểm tra lại dữ liệu trong transaction.
- Mã nhập/quét phải là MaSP hiện có; giữ validation availability/version/giá, mặc định SL 1 và chống trùng. Không suy diễn barcode lạ, thêm camera hoặc thay mapping barcode G7.

## Kiểm chứng

| Check | Kết quả |
|---|---|
| Lint | PASS, exit 0 |
| Typecheck / production build | PASS; build chạy `tsc --noEmit`; cảnh báo bundle >500 kB còn giữ |
| Full unit/integration cuối | **339/339 PASS**, 16 files, FAIL 0, SKIP 0 |
| Focused danh sách/chi tiết/lỗi/nhập mã | 3/3 PASS trước bổ sung live flow |
| Hai vai trò cập nhật ưu đãi không F5 | 1/1 PASS: 49 → 59 điểm ở tab bán khác, tab còn lại tự giảm 20%, thanh toán xong còn 17 điểm |
| Full Chromium regression | **123/123 PASS**, FAIL 0, SKIP 0, exit 0; 12,8 phút; trước tinh chỉnh màu nút/spacing danh sách cuối |
| Chromium liên quan trên UI cuối | **19/19 PASS**, FAIL 0, SKIP 0, exit 0; toàn Sales và hình học Thu mua, sau tinh chỉnh màu/spacing; 2,8 phút |
| Máy quét vật lý / app ngân hàng thật | NOT RUN; đã test keyboard events/Enter và QR/payment native Chromium |
| Audit dependency mới | NOT RUN; ngoại lệ audit trước đây vẫn được giữ |

Các bài unit mới kiểm đủ 0/49/50/51 điểm với flag chọn cũ=false; tìm kết hợp, ngày sai, quyền, 25 hóa đơn legacy qua 3 trang, corrupted snapshot/details và hóa đơn trước D05 không dùng ưu đãi. E2E tạo 10 hóa đơn bằng UI thật trước khi kiểm danh sách; không thay fixture giả cho chức năng ghi nhận giao dịch.

Các lần kiểm thử trung gian bắt được nút bị cắt ở 1366×768; đã giảm spacing theo chiều cao và giữ kiểm tra nút nằm trọn viewport. Hai assertion mới ban đầu đo sai content box (không trừ padding) / giả định cố định 9 dòng đã được sửa theo cùng oracle dùng ở pagination chung và yêu cầu page size thích ứng. Không nới ngưỡng hình học, không skip test. Trường hợp sản phẩm không tồn tại kiểm popup đúng SC043; fault injection đọc DB được đặt trên đúng trang Bán hàng, không chặn trang Thu mua trước khi điều hướng.

Kiểm ảnh sau full suite phát hiện chữ nút Xóa bộ lọc trắng trên nền trắng do kế thừa Button nền đen. Đã sửa màu chữ đen, bo góc hai nút tìm/reset và spacing chỉ riêng Sales list: header → form 12px, form → bảng 12px, lấy lại vùng trống cho bảng. Bổ sung kiểm màu reset và khoảng cách header/form tại 1440×900 cho cả hai vai trò; 19/19 E2E trên build cuối PASS. Bộ 123/123 trước đó không được trình bày như đã chạy lại toàn bộ sau chỉnh CSS cuối.

## File tác động

- Tạo `src/services/sales-queries.ts`, `src/features/sales/SalesPages.tsx`.
- Sửa `src/features/sales/SalesEditor.tsx`, `src/services/sales-payment.ts`, `src/index.css` với CSS scoped Sales.
- Sửa router, layout (route/active/sidebar Bán hàng), AuthProvider/context để nối query service.
- Bổ sung `tests/e2e/sales-pages.spec.ts`; cập nhật sales-draft, sale-payment, sale-payment unit và assertion href Bán hàng trong purchase-editor-figma. Các assertion hình học Thu mua giữ nguyên.
- Cập nhật Decision Log, plan/checklist/report G8 và hướng dẫn local.

## Ảnh và đối chiếu

Ảnh đã lưu trong [evidence/sales-figma-fix](evidence/sales-figma-fix/): danh sách Chủ/Nhân viên ba viewport, giỏ tạo giao dịch, chi tiết, empty và QR. Đã xem trực tiếp ảnh danh sách Chủ, Phiếu bán hàng Chủ, chi tiết và Nhân viên 1366×768; sau sửa reset đã xem lại ảnh danh sách cuối. Ảnh thực tế dùng dữ liệu test tạo qua UI nên mã/tên/giá khác số minh họa Figma; không hardcode dữ liệu để làm ảnh giống mẫu.

- [Danh sách Chủ 1440×900](evidence/sales-figma-fix/owner-sales-list-1440x900.png), [Nhân viên 1440×900](evidence/sales-figma-fix/staff-sales-list-1440x900.png).
- [Phiếu bán hàng Chủ 1440×900](evidence/sales-figma-fix/owner-cart-1440x900.png), [Nhân viên đủ điểm 1366×768](evidence/sales-figma-fix/staff-membership-preview-1366x768.png).
- [Chi tiết](evidence/sales-figma-fix/sales-detail-1440x900.png), [danh sách rỗng](evidence/sales-figma-fix/sales-empty-1440x900.png).
- [Ảnh trước sửa header/thanh nhập](evidence/t02-review-2026-11-13/owner-membership-preview-1440x900.png).

Các khác biệt có chủ đích còn giữ: mã draft D…/invoice BH… theo contract; control opt-in đăng ký thành viên đã được duyệt; menu module chưa triển khai theo roadmap không được coi là tính năng đã làm. Không kết luận pixel-perfect từ ảnh SDD có DPI khác; dùng PDF gốc 1440×900 và ảnh browser cùng viewport để kiểm layout.

Giữ `/sales/new` và `/sales/:draftId`; bổ sung index `/sales` còn thiếu và `/sales/transactions/:invoiceId` cho hóa đơn, theo cấu trúc sẵn có của Thu mua. Không dùng route draft để mở nhầm hóa đơn hoặc đổi scheme ID.

## Còn mở và cách xem

- G8 vẫn **PENDING REVIEW**; không tự đánh dấu DONE. Phần in hóa đơn/tích hợp lịch sử khách hàng của toàn T05 và kiểm chứng cuối T06 chưa được nhận là hoàn tất qua gói sửa này. Không tự thêm nút in khi frame đang đối chiếu không có control đó.
- Giữ nguyên ngoại lệ G6/G7, audit dependency; không reset browser data, commit/push/deploy hoặc sửa Figma gốc.
- Chạy `CHAY_COCO_LOCAL.cmd`; mở `http://127.0.0.1:5173/50K142.03.3007/#/sales`. Chọn Tạo giao dịch → nhập mã sản phẩm và Thêm/Enter → chọn khách → kiểm số tiền tự giảm nếu đủ điều kiện → Tiền mặt/Lưu hoặc Chuyển khoản/Lưu/Đã nhận. Thanh toán thành công là ghi dữ liệu thật trong IndexedDB, dùng dữ liệu demo riêng.
