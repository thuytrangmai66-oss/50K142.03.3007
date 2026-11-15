# Gỡ toolbar khỏi lịch sử khách hàng

15/11/2026. UI-only; không commit/push/deploy. Nhánh `main`, HEAD/origin `213815c0e303c94b0467334768edaba6d67f19f3`, không phân kỳ khi bắt đầu. Giữ nguyên các thay đổi local khác.

## Nguyên nhân và kết quả

Toolbar được gọi trực tiếp bởi `CustomerHistoryPage` và hai component hiển thị hóa đơn từ lịch sử, không phải do sidebar hoặc route guard. Đã bỏ lời gọi/import ở đúng component; không dùng CSS ẩn. Trong source hiện tại, nơi duy nhất gọi `CustomerToolbar` là `CustomersPage`.

| Màn hình | Tìm kiếm | Tạo tài khoản |
|---|---|---|
| Danh sách khách hàng | Có | Có |
| Chi tiết khách hàng | Không | Không |
| Lịch sử mua | Không | Không |
| Lịch sử bán | Không | Không |
| Hóa đơn mở từ lịch sử | Không | Không |

Hai lịch sử dùng cùng class/layout. Header → Quay lại và Quay lại → khung đều 24px ở desktop >1400px, 16px khi hẹp hơn, dùng chung token với Chi tiết khách hàng/Xử lý hàng tồn lâu. Hai lịch sử cùng áp dụng quy tắc cuộn danh sách, giữ Back ở đầu main; không đổi URL, route hay phân quyền.

Tại 1440×900, DPR 1, zoom 100%: Back X461/Y130, khung X461/Y178, rộng 943px, bảng Y299,59. Cả hai trang có cùng hình học. Bảng được kéo lên **126px** so với trước và vẫn rộng 943px. Cột, nội dung, formatter ngày, trạng thái và truy vấn theo `customerId` không đổi.

## File đã sửa

- `src/features/customers/CustomerHistoryPage.tsx`: bỏ toolbar ở lịch sử và hóa đơn bán hàng con; thêm class layout riêng.
- `src/features/purchases/PurchaseInvoicePage.tsx`: bỏ toolbar khi mở hóa đơn thu mua từ lịch sử; chỉ thêm class khi `fromHistory`, giữ nhánh vào từ Thu mua như cũ.
- `src/components/layout/CoCoLayout.tsx`: áp dụng cùng quy tắc cuộn UI cho cả hai trang lịch sử, không đổi định tuyến/permission.
- `src/index.css`: mở rộng token Back, thống nhất khung hai lịch sử. Cùng lượt này hoàn tất [phân bố dọc Chi tiết khách hàng](../customer-detail/VERTICAL_DISTRIBUTION_REVIEW.md) theo yêu cầu đang dở trước đó.
- `tests/e2e/customer-history-layout.spec.ts`: hai vai trò, bốn màn hình, reload route, Back, tìm/tạo ở danh sách và snapshot dữ liệu.
- `tests/e2e/reference-data.spec.ts`: xác nhận không có toolbar ở hai hóa đơn con.
- `tests/e2e/sales-t05-errors.spec.ts`: thay assertion cũ đòi toolbar bằng quy tắc không có toolbar/Back dưới Header, giữ toàn bộ kiểm tra lỗi/khôi phục/dữ liệu.
- `tests/e2e/customer-detail-layout.spec.ts`: phần phân bố dọc và thao tác cuộn cửa sổ thấp; báo cáo/ảnh trong hai thư mục UI tương ứng.

## Kiểm thử thực thi

| Nhóm | Kết quả cuối |
|---|---|
| Lint, typecheck, build | PASS; build 4,92s, giữ cảnh báo Zod/bundle lớn hiện có |
| `reference-data.test.ts --maxWorkers=1` | **18 PASS**, 0 FAIL/SKIP, 6,33s |
| `customer-history-layout.spec.ts` | **2 PASS**, Chủ và Nhân viên |
| Regression 29 trường hợp | 27 PASS; 2 lỗi do assertion toolbar cũ, đã cập nhật theo yêu cầu mới |
| Chạy lại `sales-t05-errors.spec.ts` sau cập nhật | **2 PASS**, 0 FAIL/SKIP, 11,2s |
| Tổng E2E khác nhau đã đạt sau sửa | **31 PASS**, không còn FAIL/SKIP chưa xử lý |

Không báo lần chạy regression đầu là toàn PASS: log 27 PASS/2 FAIL vẫn ở `test-results/customer-history-regression`. Hai bài thất bại được chạy lại thành công tại `test-results/customer-history-errors-final`; các bài khác không bị thay đổi/không chạy lại. Không sửa timeout, bỏ test hoặc nới assertion lỗi dữ liệu.

Regression gồm `customer-detail-layout`, `empty-states`, `purchase-queries`, `reference-data`, `sales-t05-errors`, `sales-t05-t06`. Đã kiểm tra lịch sử có giao dịch thật và nhiều giá, sửa tên/số điện thoại vẫn truy xuất theo mã khách, hóa đơn/snapshot, lỗi đọc và khôi phục, hai vai trò/hai tab, không ghi từ màn chỉ xem. Không đổi schema, membership, điểm hoặc legacy.

Hai bài layout lịch sử kiểm tra 1440×900, 1366×768, 1920×1080, 768×1024 và 390×844; direct reload cả hai lịch sử và trang chi tiết, toolbar không xuất hiện lại. Danh sách vẫn tìm đúng khách và mở/hủy tạo tài khoản được. Không có console/pageerror trong các bài layout. Profile kiểm thử riêng; không sửa storage của người dùng hoặc thêm dữ liệu mẫu vào ứng dụng.

## Ảnh và số đo

- Lịch sử mua: [trước](evidence/before-purchases-1440x900.png) · [sau](evidence/owner-purchases-1440x900.png).
- Lịch sử bán: [trước](evidence/before-sales-1440x900.png) · [sau](evidence/owner-sales-1440x900.png).
- [Nhân viên — lịch sử mua](evidence/staff-purchases-1440x900.png) · [Nhân viên — lịch sử bán](evidence/staff-sales-1440x900.png).
- [Lịch sử bán có giao dịch](evidence/owner-populated-sales-history.png) · [Hóa đơn bán hàng mở từ lịch sử mua](evidence/owner-sale-invoice-through-history.png).
- [Geometry Chủ](evidence/owner-history-geometry.json) · [Geometry Nhân viên](evidence/staff-history-geometry.json).

Không chạy full suite/Visual G10, không đổi baseline hoặc trạng thái nghiệm thu phase. Không có blocker còn lại trong phạm vi bàn giao.
