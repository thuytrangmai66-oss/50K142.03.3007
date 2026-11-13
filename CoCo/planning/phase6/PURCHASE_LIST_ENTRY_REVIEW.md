# Sửa trang mở đầu Thu mua

Ngày 11/11/2026. Theo yêu cầu trực tiếp của người dùng: bấm Thu mua phải mở danh sách như các chức năng khác, không tự vào form tạo.

## Thay đổi

- `/purchases` hiển thị danh sách bốn cột Mã giao dịch / Số điện thoại / Tên khách hàng / Thời gian, theo CODEX local SC008 và SC199. Tiêu đề trang là **Thu mua**.
- Có bộ lọc mã, số điện thoại, tên khách và ngày; Tìm kiếm áp dụng đồng thời các tiêu chí, Xóa bộ lọc trở lại trang đầu. Ngày được đối chiếu theo giờ Việt Nam, không lấy ngày UTC để lọc lệch một ngày.
- Nút **Tạo giao dịch** mới mở `/purchases/new`. Hủy form trở lại danh sách. Sidebar vẫn chọn Thu mua ở cả hai màn hình.
- Danh sách đọc `hoaDonThuMua` và khách liên quan bằng service kiểm phiên/quyền `purchases.read`, cho cả Chủ và Nhân viên. Không giới hạn giao dịch theo người tạo khi SRS không quy định.
- Dùng chung PaginatedTable, Pagination và useListPageSize: số dòng thích ứng viewport, phân trang ở cuối, không cuộn dọc bên trong bảng. Dữ liệu thay đổi được nhận qua subscription Dexie sẵn có.
- Chưa có giao dịch thật thì hiển thị trạng thái rỗng. Draft chưa hoàn tất không bị biến thành hóa đơn hoặc trộn vào danh sách này. Không auto-seed dữ liệu mẫu vào ứng dụng.
- Mã giao dịch liên kết tới màn đọc hóa đơn theo khách đã có ở G4 (`sales` nghĩa là khách bán hàng cho CoCo). Không viết lại dữ liệu hay diễn giải trạng thái legacy.

Đây là điều chỉnh trang vào được người dùng yêu cầu rõ ràng; phần danh sách đọc liên quan T06 đã có trước để sửa luồng này. Không đổi thứ tự T03–T07 hoặc tuyên bố T06/UC1.2/G6 hoàn tất. Màn chi tiết hiện tái sử dụng G4, chưa phải toàn bộ thiết kế chi tiết Thu mua T06; phê duyệt/delivery/finalize vẫn theo task tương ứng. Không đổi schema, transaction tạo draft hoặc quyết định nghiệp vụ.

## File thay đổi

- `src/features/purchases/PurchasesPage.tsx`: danh sách, lọc và phân trang.
- `src/services/purchase-drafts.ts`: query danh sách chỉ đọc, join khách và kiểm phiên/quyền.
- `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx`: route trang vào và tiêu đề.
- `src/features/purchases/PurchaseEditor.tsx`: Hủy quay về danh sách.
- `src/index.css`: CSS riêng cho bộ lọc, dùng màu và primitives hiện có.
- `tests/e2e/purchase-list.spec.ts`: kiểm tra mới cho cả hai role; `purchase-drafts.spec.ts` cập nhật thao tác vào form qua nút Tạo giao dịch.
- `tests/unit/purchase-drafts.test.ts`: query/filter/timezone/revocation, không đưa draft vào danh sách và không sửa status legacy.

## Kiểm thử

| Kiểm tra | Kết quả thực thi |
|---|---|
| Lint / typecheck / build | PASS, exit 0 |
| Unit/integration toàn bộ | 172/172 PASS, 9 file |
| Static audit phase6 | 5/5 PASS |
| Chromium toàn bộ, không retry | **61/61 PASS**, 0 FAIL/skip/flaky; exit 0 |

Chromium mới kiểm hai role: trang vào rỗng, bấm Tạo giao dịch/Hủy, danh sách nhận dữ liệu không F5, 25 bản ghi qua các trang không thiếu/trùng, lọc nhiều tiêu chí/ngày Việt Nam/reset, mở hóa đơn có thật và console. Viewport 1366×768, 1440×900, 1920×1080. Các fixture lịch sử chỉ được ghi vào browser context kiểm thử riêng; không dùng fixture để giả chức năng tạo hóa đơn runtime đã hoàn thành.

Một test ngày không hợp lệ ban đầu phát hiện service throw đồng bộ trước khi trả Promise; đã chuyển query thành async để validation được trả qua cơ chế lỗi của useResource, rồi chạy lại toàn bộ unit/integration PASS. Không bỏ assertion ngày sai hoặc thay đổi dữ liệu legacy để làm xanh.

Các lần E2E đầu phát hiện fixture native không phát tín hiệu mutation Dexie và thiếu recordVersions của khách khi thử sửa qua service G4. Đã nạp fixture đúng metadata G2, reload riêng sau cài fixture, rồi kiểm live update bằng thao tác sửa khách thật từ tab thứ hai. Không coi ghi IDB thô là luồng UI hoặc xóa assertion đồng bộ. Ảnh được chờ bảng tải xong sau chuyển trang, tránh chụp nhầm trạng thái loading.

Ảnh và hash lần này lưu riêng trong `evidence/list-entry/` và `EVIDENCE_LIST_ENTRY.json`, không ghi đè bằng chứng T02 đã bàn giao. Kết quả T02 cũ trong T02_EXECUTION.md và EVIDENCE_T02.json là snapshot của lượt trước; source hiện tại đã được cập nhật theo yêu cầu trang danh sách.

Localhost: http://127.0.0.1:5173/50K142.03.3007/#/purchases. Nếu chưa có server: chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5173` trong `D:\50K142-NEW\CoCo`. Mở Thu mua → danh sách → Tạo giao dịch; Hủy để trở về.

Không commit/push/deploy, không reset dữ liệu, không tự nghiệm thu G5/G6.

Ảnh: [Chủ 1366×768](evidence/list-entry/owner-1366x768.png), [Nhân viên 1440×900](evidence/list-entry/staff-1440x900.png), [danh sách rỗng](evidence/list-entry/owner-empty.png). Có đủ ảnh cả hai role ở ba desktop viewport trong thư mục bằng chứng.
