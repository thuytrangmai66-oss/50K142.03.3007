# Chỉnh vị trí phân trang CoCo

> Chỉ đạo mới ngày 12/11/2026: đồng bộ đường kẻ danh sách theo ảnh Khách hàng, bao gồm Nhân viên. Đã dùng lại divider mặc định 1px; dòng rỗng không có line. [Báo cáo hiện hành](../LIST_ROW_DIVIDERS_REVIEW.md). Các ghi chú “bỏ line Nhân viên” phía dưới là lịch sử đã được thay thế; layout form tạo Thu mua theo Figma giữ riêng.

> Tinh chỉnh mới nhất: [LIST_LAYOUT_POLISH_REVIEW.md](LIST_LAYOUT_POLISH_REVIEW.md) — nút trang nhỏ hơn, bảng cao thêm, bỏ line Nhân viên và số dòng tự thích ứng khi thu hẹp cửa sổ. Các mốc bên dưới được giữ làm lịch sử.

> **Đã được thay thế bởi yêu cầu chuẩn hóa mới ngày 11/11/2026:** mặc định 9 bản ghi/trang, không cuộn dọc bên trong bảng. Xem [báo cáo chuẩn hóa hiện tại](PAGINATION_STANDARDIZATION_REVIEW.md). Phần dưới là snapshot lịch sử của lần sửa 10 dòng có cuộn bảng, không mô tả hành vi mới.

Ngày 11/11/2026. Hoàn thành yêu cầu sửa layout phân trang trên nền G5. Không thêm task/phase nghiệp vụ, không thay service, repository, schema hoặc dữ liệu người dùng. Manifest và báo cáo G5 trước đó giữ nguyên như snapshot lịch sử.

## Kết quả

- Khách hàng, Khung giá thu mua và Nhân viên dùng chung `PaginatedTable` và `Pagination`. List dùng Flexbox, chiều cao theo vùng nội dung desktop; cửa sổ hẹp dùng chiều cao linh hoạt theo viewport và `rem`, có `min-block-size`.
- Khung bảng chiếm phần còn lại; phân trang ở cuối list trong luồng layout bình thường, căn giữa khu vực nội dung chính. Không dùng absolute/fixed hoặc offset theo số dòng. Khi bảng dài, cuộn trong vùng bảng; nút phân trang không bị che.
- Giữ nguyên CSS màu, font, kích thước nút và khoảng cách phân trang hiện có. Danh sách Nhân viên cũng hiện Trang 1 khi có tối đa một trang, thống nhất với hai danh sách còn lại.
- Giữ nguyên page size 10, tính số trang, dữ liệu, bộ lọc, tìm kiếm, callback chuyển trang và quyền. Các bảng lịch sử/chi tiết không phân trang giữ layout cũ.

## File source và test

| File | Thay đổi |
|---|---|
| [DataTable.tsx](../../src/components/ui/DataTable.tsx) | Thêm wrapper `PaginatedTable`, tái sử dụng bảng và Pagination hiện có |
| [index.css](../../src/index.css) | Flex layout cho list/table/footer, overflow vùng bảng, min-height linh hoạt |
| [CustomersPage.tsx](../../src/features/customers/CustomersPage.tsx) | Dùng layout danh sách chung |
| [PriceBracketsPage.tsx](../../src/features/price-brackets/PriceBracketsPage.tsx) | Dùng layout danh sách chung |
| [StaffPages.tsx](../../src/features/staff/StaffPages.tsx) | Dùng layout danh sách chung, hiện cùng Pagination cho một trang |
| [pagination.spec.ts](../../tests/e2e/pagination.spec.ts) | Ba bài kiểm thử Chromium cho cả ba danh sách, dữ liệu fixture chỉ trong context test |

## Kiểm thử đã thực thi

| Phạm vi | Kết quả |
|---|---|
| Số bản ghi | 0, 1, 5, 10, 11 và 25 ở mỗi màn hình |
| Viewport | 1440×900, 1366×650, 1280×720, 1024×768, 800×500, 600×700, 390×844 |
| Ma trận layout | **126 trạng thái PASS** = 3 màn hình × 6 số lượng × 7 viewport; đây là các assertion bên trong 3 testcase, không phải 126 testcase riêng |
| Vị trí | Chênh lệch Y theo số dòng: **0 CSS px** tại mỗi viewport; sai số căn giữa nút: **0 CSS px**; không chồng lấn bảng/footer, không tràn ngang trang |
| Chuyển trang | Kiểm chính xác ID các dòng trên từng trang 1/2/3 và quay lại; trang cuối 1 hoặc 5 dòng giữ nguyên vị trí phân trang |
| Nội dung dài/cửa sổ thấp | Label xuống dòng; cuộn đến dòng cuối bảng vẫn truy cập được và không dịch footer; viewport desktop thấy toàn bộ nút phân trang |
| Hồi quy Chromium | **32/32 PASS**, gồm 29 case trước và 3 case mới; không retry/skip |
| Unit/integration | **88/88 PASS**, không skip |
| Lint, typecheck/build | PASS, exit 0; build gồm `tsc --noEmit` |

Lệnh: `npm run lint`, `npm test`, `npm run build`; PowerShell `$env:CI='true'; npm run test:e2e -- --reporter=line --retries=0 --global-timeout=180000`. Lượt Chromium chạy ngoài sandbox hoàn tất exit 0; lượt thử trước trong sandbox bị dừng khi teardown tiến trình không kết thúc, không tính lượt đó là PASS.

## Ảnh và dữ liệu đo

- Khách hàng: [0 dòng](evidence/pagination/customers-0.png), [1 dòng](evidence/pagination/customers-1.png), [5 dòng](evidence/pagination/customers-5.png), [10 dòng](evidence/pagination/customers-10.png), [25 bản ghi / trang 1](evidence/pagination/customers-25.png).
- [Khung giá](evidence/pagination/price-brackets-25.png), [Nhân viên](evidence/pagination/staff-25.png), [cửa sổ hẹp 600×700](evidence/pagination/narrow-window.png).
- [Manifest kiểm chứng và checksum](PAGINATION_LAYOUT_EVIDENCE.json), [đo Khách hàng](evidence/pagination/customers-metrics.json), [đo Khung giá](evidence/pagination/price-brackets-metrics.json), [đo Nhân viên](evidence/pagination/staff-metrics.json).

Ảnh là dữ liệu test riêng. Đối chiếu trực quan ảnh capture để kiểm layout, không tuyên bố full pixel baseline Figma PASS. Không push/deploy; xem local tại http://127.0.0.1:5173/50K142.03.3007/ và tải lại tab nếu còn giữ code cũ.
