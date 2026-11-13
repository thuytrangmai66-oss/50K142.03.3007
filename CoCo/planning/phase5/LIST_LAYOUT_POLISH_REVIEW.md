# Tinh chỉnh danh sách và phân trang CoCo

Ngày 11/11/2026, giờ Việt Nam. Hoàn thành tinh chỉnh Khung giá thu mua và áp dụng chung cho các danh sách đang có; đã tích hợp chỉ đạo bổ sung cho phép giảm số dòng khi thu hẹp cửa sổ. Không đổi roadmap, dữ liệu đã lưu, schema, quyền hoặc quy tắc nghiệp vụ. Không stage/commit/push/deploy.

## Kết quả đo trên desktop

| Hạng mục | Trước | Sau |
|---|---|---|
| Nút số trang | 36×36px | **32×32px**, giảm 11,1%; vùng bấm vẫn 32px |
| Cỡ chữ nút | 16px | **14px**, giảm 12,5% |
| Màu/bo góc/active | Nền chọn #272727, chữ trắng, radius 8px | Giữ nguyên; focus nằm trong nút để không bị cắt ở đáy |
| Vị trí cụm trang | Mốc đo trước sửa | **Thấp hơn 12px**, căn giữa nội dung, không tính sidebar |
| Chiều cao vùng bảng | Mốc đo trước sửa | **Tăng 20px**; không kéo giãn chiều cao từng dòng |
| Khoảng cách bảng/phân trang | 28px | 20px, thống nhất ở component chung |
| Line Nhân viên | Viền dưới từng hàng dữ liệu | Bỏ riêng tại list Nhân viên; header be/nền trắng giữ nguyên |

Các mức +20px/+12px được đối chiếu từng trạng thái với 72 mẫu trước sửa tại 1366×768, 1440×900, 1920×1080. Không dùng absolute/fixed hoặc cuộn dọc trong bảng để tạo vị trí đó.

## Số dòng tự thích ứng

- Desktop đủ chỗ giữ tối đa **9 dòng/trang**. Khi giảm chiều rộng làm hàng xuống dòng, hoặc giảm chiều cao, hook dùng chiều cao thực của header, toolbar, bảng, phân trang và vùng nhìn để chọn số dòng nhỏ hơn, tối thiểu 1.
- Lấy mẫu các hàng trên trang đầu và tính cả nhãn xuống dòng. Giữ capacity khi chuyển trang để không thay đổi điểm cắt giữa các trang, tránh trùng hoặc thiếu bản ghi. Khi thay đổi kích thước cửa sổ, về Trang 1, đo lại; mở rộng đủ chỗ sẽ trở lại 9 dòng. Từ khóa và bộ lọc vẫn giữ nguyên.
- Page size chỉ là tham số trình bày của query đọc; tiếp tục slice trước khi render và tính tổng trang từ dữ liệu đã lọc. Không có bản ghi nào bị ghi lại hoặc xóa do resize.
- Với fixture 25 bản ghi, cửa sổ 1366×650 hiển thị khoảng 7 dòng/trang; 800×500 khoảng 2–3 dòng/trang. Kích thước 640×768 cũng được đo; con số thực phụ thuộc cột, nhãn xuống dòng và phần điều hướng của vai trò.
- Vùng rỗng/ít dòng vẫn dùng chiều cao còn lại, kể cả khi sidebar chuyển thành thanh phía trên. Không tạo khoảng trống tối thiểu quá cao làm đẩy footer khỏi cửa sổ thấp. Nội dung không bị cắt; trường hợp một hàng riêng quá cao vẫn có thể cuộn vùng nội dung chung.

## Phạm vi áp dụng

| Màn hình | Kết quả |
|---|---|
| Khung giá thu mua — Chủ | Layout/nút nhỏ, footer thấp, bảng cao, capacity thích ứng; filter độ mới giữ nguyên |
| Nhân viên — Chủ | Cùng layout/capacity, thêm `rowDividers={false}` để bỏ line thừa |
| Khách hàng — Chủ/Nhân viên | Cùng layout/capacity; tìm kiếm giữ nguyên khi thu/phóng |
| Lịch sử và chi tiết hóa đơn | Giữ nguyên; không có phân trang tương ứng trong thiết kế hiện tại |
| Module chưa triển khai / thiết kế phân trang riêng | Không thêm giao diện hoặc áp rule mới ngoài PaginatedTable |

## File source và test

- [index.css](../../src/index.css): kích thước nút, khoảng cách, chiều cao list và empty state responsive; chỉ scoped list/PaginatedTable.
- [DataTable.tsx](../../src/components/ui/DataTable.tsx): tùy chọn viền hàng, mặc định giữ viền; Nhân viên tắt riêng.
- [use-list-page-size.ts](../../src/features/reference-data/use-list-page-size.ts): hook chung đo vùng nhìn/hàng, ResizeObserver, ổn định capacity khi chuyển trang.
- [CustomersPage.tsx](../../src/features/customers/CustomersPage.tsx), [PriceBracketsPage.tsx](../../src/features/price-brackets/PriceBracketsPage.tsx), [StaffPages.tsx](../../src/features/staff/StaffPages.tsx): dùng hook chung.
- [contracts.ts](../../src/services/reference-data/contracts.ts), [local.ts](../../src/services/reference-data/local.ts): query đọc nhận page size từ UI, default vẫn 9; CRUD/transaction/validation không thay đổi.
- [pagination.spec.ts](../../tests/e2e/pagination.spec.ts): mở rộng matrix responsive, kiểm kích thước nút/line, thu hẹp khi ở Trang 2, giữ filter/search, duyệt toàn bộ ID và khôi phục 9 dòng khi mở rộng.

## Kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| 0, 1, 9, 10, 25 bản ghi | PASS; có thêm 5 bản ghi để hồi quy |
| Viewport yêu cầu | PASS: 1366×768, 1440×900, 1920×1080 |
| Cửa sổ hẹp/thấp | PASS: 1366×650, 800×500, 640×768 |
| Matrix | **144 trạng thái PASS** = 4 tổ hợp màn hình/vai trò × 6 số lượng × 6 viewport; nằm trong 4 testcase matrix |
| Footer ổn định/căn giữa | PASS; chênh lệch vị trí theo số lượng tối đa 1 CSS px, tâm cụm nút đúng vùng nội dung |
| Không cuộn bảng/tràn trang | PASS; 0 trường hợp cuộn dọc nội bộ trong matrix; không cần cuộn main trong các fixture đo |
| Chuyển trang | PASS; toàn bộ ID đủ, không trùng; capacity ổn định trong khi duyệt trang |
| Tìm kiếm/lọc + resize | PASS cho hai vai trò Khách hàng và filter Khung giá; resize về Trang 1 hợp lệ, giữ query/filter, mở rộng phục hồi 9 |
| Line Nhân viên | PASS, border-bottom 0px; các bảng khác giữ viền cũ |
| Chromium toàn bộ | **49/49 PASS**, không retry/skip; gồm popup, auth, reference data, staff, migration và responsive regression |
| Unit/integration | **101/101 PASS**, 6 file, không skip |
| Lint/typecheck/build | PASS, exit 0; build gồm `tsc --noEmit` |
| CI/Pages / full pixel baseline | NOT RUN; không push/deploy và không tuyên bố pixel parity toàn website |

Lệnh: `npm run lint`, `npm test`, `npm run build`; PowerShell `$env:CI='true'; npm run test:e2e -- --reporter=line --retries=0 --global-timeout=300000`. Test chạy trên context/IndexedDB tạm. Đã sửa vấn đề empty state và vùng main có chiều cao tự nhiên khi cửa sổ hẹp, rồi chạy lại toàn regression.

## Ảnh đối chiếu

| Màn hình | Trước | Sau |
|---|---|---|
| Khung giá — 1366×768 | [Ảnh](evidence/list-polish/before/owner-price-brackets-25-1366x768.png) | [Ảnh](evidence/list-polish/after/owner-price-brackets-25-rows-1366x768.png) |
| Khung giá — 1440×900 | [Ảnh](evidence/list-polish/before/owner-price-brackets-25-1440x900.png) | [Ảnh](evidence/list-polish/after/owner-price-brackets-25-rows-1440x900.png) |
| Khung giá — 1920×1080 | [Ảnh](evidence/list-polish/before/owner-price-brackets-25-1920x1080.png) | [Ảnh](evidence/list-polish/after/owner-price-brackets-25-rows-1920x1080.png) |
| Line Nhân viên — 1 dòng | [Ảnh](evidence/list-polish/before/owner-staff-1-1366x768.png) | [Ảnh](evidence/list-polish/after/owner-staff-1-rows-1366x768.png) |
| Khách hàng — Chủ | [Ảnh](evidence/list-polish/before/owner-customers-25-1366x768.png) | [Ảnh](evidence/list-polish/after/owner-customers-25-rows-1366x768.png) |
| Khách hàng — Nhân viên | [Ảnh](evidence/list-polish/before/staff-customers-25-1366x768.png) | [Ảnh](evidence/list-polish/after/staff-customers-25-rows-1366x768.png) |

[Khung giá 800×500 — tự giảm dòng](evidence/list-polish/after/owner-price-brackets-adaptive-800x500.png), [Khung giá 640×768](evidence/list-polish/after/owner-price-brackets-adaptive-640x768.png), [sau mở rộng lại](evidence/list-polish/after/owner-price-brackets-expanded.png). [Manifest và số đo/checksum](LIST_LAYOUT_POLISH_EVIDENCE.json) chứa toàn bộ ảnh và phạm vi kiểm chứng.

Local: **http://127.0.0.1:5173/50K142.03.3007/** — tải lại tab để nhận bản build mới. Dữ liệu cùng origin giữ nguyên. Không tự push hoặc deploy.
