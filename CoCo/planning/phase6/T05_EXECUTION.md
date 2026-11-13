# G6–T05 — hoàn tất thu mua

Ngày 12/11/2026. Đã triển khai runtime và kiểm thử các phần còn lại của T05 theo chỉ đạo người dùng. T05 PENDING REVIEW, G6 IN PROGRESS. Nghiệm thu người dùng tiếp tục theo checklist G6.

## Mapping được áp dụng trong lượt này

Người dùng yêu cầu “hoàn thành hết các phần còn lại trong T05” ngay sau bảng mã đề xuất. Lượt này hiểu chỉ đạo đó bao gồm việc áp dụng bảng mã để kích hoạt T05; cách hiểu đã được thông báo trước khi sửa. Mapping dùng chung tại `src/domain/purchase-status.ts`.

| Dữ liệu mới | Mã | Ý nghĩa |
|---|---|---|
| Hóa đơn thu mua | 1 | Hoàn tất |
| Sản phẩm | 1 | Đang bán / có thể bán |
| Sản phẩm | 2 | Đã bán, dành cho luồng bán sau |

Mỗi hóa đơn mới lưu mapping trong `appMetadata` bằng key `purchase-status-mapping:<invoiceId>`. Marker finalized/provenance xác định nguồn chi tiết mới. Numeric legacy giữ nguyên giá trị và cách đọc trước đây. Mã sản phẩm đã bán chưa được ghi bởi T05.

## Checklist triển khai

- [x] AuthProvider khởi tạo finalizer bằng mapping chung, kiểm session/quyền trong transaction.
- [x] Nút Lưu hoạt động cho Chủ/Nhân viên. Empty items và khách thiếu có thông báo đúng SC034/226, pending/rejected chặn lưu theo SC035/227.
- [x] Chọn khách thật, tạo khách nếu chưa có, Hủy form giữ dữ liệu; hai tab cùng tạo một phone chỉ lưu một hồ sơ.
- [x] Command ID giữ ổn định qua retry cùng revision; khóa nhấn lặp trong lúc xử lý.
- [x] Hóa đơn, snapshot chi tiết từng dòng, từng món hàng, cost, provenance, trạng thái finalized, issuedIdentifiers, recordVersions, receipt và audit nằm cùng transaction.
- [x] Dòng cùng khung giá nhưng khác đơn giá giữ riêng trong snapshot P04; không ghi đè hoặc lấy bình quân vào composite key legacy.
- [x] Giá bán ban đầu từng món = cost ×1,30, nearest/half-up. Ghi giá gốc chu kỳ, giá hiện hành, ngày nhập và ngày bắt đầu chu kỳ Việt Nam thực tế.
- [x] Mỗi món có mã riêng, không tái sử dụng mã đã cấp. Retry/double click/hai tab không tăng hóa đơn hoặc tồn kho lần hai.
- [x] Popup thành công đúng nội dung SC036/228. Đóng popup về danh sách, không để overlay hoặc form đang chỉnh sửa.
- [x] Reload ngay sau native commit đọc được trạng thái hoàn tất và mã hóa đơn, cho trở về danh sách và ngăn hoàn tất lại.
- [x] Trang hóa đơn hiện có đọc snapshot mới qua adapter T01, hiển thị đủ các dòng và tổng tiền của hóa đơn vừa tạo. Các reader legacy tiếp tục dùng bảng cũ.
- [x] Lỗi ghi giữa transaction rollback, giữ editor/khách/sản phẩm để thử lại; thông báo lỗi không bị coi là thành công.

`TenSP` lấy loại sản phẩm đã nhập, trong giới hạn 50 ký tự của schema. Thương hiệu và độ mới được giữ trong snapshot/khung giá; màn đang tạo và reader hóa đơn hiển thị loại cùng thương hiệu. Các bộ lọc, trạng thái và giao diện tra cứu toàn bộ thuộc T06.

## Lỗi đã sửa khi chạy UI thật

Sau khi chọn khách hoặc thêm món, thao tác kế tiếp từng có thể dùng revision cũ trong lúc live query cập nhật. Editor nay ghi nhận revision tối thiểu vừa commit và chỉ cho thao tác tiếp khi dữ liệu đạt mốc này. Helper Playwright chờ form thực sự đóng sau khi ghi, theo khả năng tương tác của trình duyệt.

Sau từ chối → nhập lại → duyệt yêu cầu mới, việc thêm món từng đối chiếu cả request lịch sử với revision hiện hành. Đã giữ kiểm canonical bất biến cho request cũ và chỉ bind revision hiện hành cho request mới/đang được line liên kết. Có unit regression cho thêm món và chọn khách sau chuỗi này, cùng E2E nhân viên hoàn tất giao dịch.

Reader hóa đơn cũ từng chỉ đọc chi tiết legacy, dẫn tới không có dòng khi mở hóa đơn định dạng mới. Đã tái sử dụng `readCandidatePurchase` và kiểm qua UI mở hóa đơn sau lưu; tổng tiền và cả hai đơn giá hiển thị đúng.

## Source và test đã thay đổi

- `src/domain/purchase-status.ts`
- `src/features/auth/AuthProvider.tsx`, `src/features/auth/context.ts`
- `src/features/purchases/PurchaseEditor.tsx`
- `src/services/purchase-finalization.ts`, `src/services/purchase-candidate.ts`
- `src/services/reference-data/local.ts`
- `src/index.css`
- `tests/unit/purchase-finalization.test.ts`, `tests/unit/purchase-approvals.test.ts`
- `tests/e2e/purchase-finalization.spec.ts`, `tests/e2e/purchase-finalization-storage.spec.ts`
- `tests/e2e/purchase-helpers.ts`
- `tests/e2e/purchase-drafts.spec.ts`, `tests/e2e/purchase-results.spec.ts`, `tests/e2e/purchase-editor-figma.spec.ts`

Các assertion Lưu bị vô hiệu hóa ở mốc T02/T04 được cập nhật vì T05 nay kích hoạt hành vi validation và finalize. Bộ kiểm bố cục editor theo geometry cũ vẫn được chạy lại.

## Bộ kiểm thử T05 qua UI

| Kiểm tra đã thực thi | Kết quả |
|---|---|
| Lint | PASS, exit 0 |
| Typecheck và build | PASS, exit 0 |
| Toàn bộ unit/integration | 233/233 PASS, 0 FAIL |
| Chromium regression toàn bộ | 88/88 PASS, 0 FAIL, 0 SKIP, 0 flaky |
| UI hoàn tất T05 trong regression | 7/7 PASS |
| Native storage T05 trong regression | 1/1 PASS |
| Browser console/pageerror các ca UI T05 | Rỗng |
| Chụp và đối chiếu SC034–036/226–228 | Đã thực hiện, ảnh tại evidence/t05 |
| Nghiệm thu người dùng/pixel cuối cùng | Chờ review |

Log tại [Vitest](evidence/t05/vitest.json), [Chromium](evidence/t05/playwright.json), [execution và hash source](evidence/t05/execution.json). Ảnh [chủ hoàn tất](evidence/t05/owner-success-1440.png), [nhân viên hoàn tất](evidence/t05/staff-finalized-success.png), [validation bắt buộc](evidence/t05/owner-required.png), [chưa duyệt bị chặn](evidence/t05/staff-pending-blocked.png), [rollback](evidence/t05/owner-productCosts-rollback.png), [khôi phục sau commit](evidence/t05/owner-recovered-after-commit.png), [hóa đơn đọc snapshot](evidence/t05/owner-invoice-snapshot-lines.png). Có thêm ảnh thành công 1366/1920 trong cùng thư mục.

1. Chủ lưu khi rỗng/thiếu khách bị chặn; sau đó tạo/chọn khách, lưu hai đơn giá cùng bracket, quantity tổng 3 và kiểm half-up. Double click chỉ tạo một hóa đơn. Mở reader thấy đủ hai dòng, reload draft thấy hoàn tất.
2. Nhân viên tạo request thật, pending bị chặn, từ chối bị chặn; nhập lại 130.000, chủ duyệt, thêm món 80.001 và hoàn tất 210.001. Hai quyết định cũ/mới được giữ.
3. Inject lỗi native tại productCosts và auditEntries, so toàn bộ business store trước/sau, đóng lỗi rồi retry thành công đúng một lần.
4. Hai tab chủ cùng hoàn tất một draft, một transaction thắng; tab còn lại đọc trạng thái hoàn tất và quay về danh sách.
5. Reload tại sự kiện native transaction complete, khôi phục trạng thái hoàn tất và không tạo thêm hóa đơn/sản phẩm.
6. Hủy tạo khách không tạo bản ghi; hai form tạo cùng phone chỉ tạo một khách.

Các bài này tạo dữ liệu và quyết định qua UI thật. Native IDB chỉ dùng làm oracle/tiêm lỗi trong browser context test riêng. Console error/pageerror được theo dõi ở tất cả tab của các ca T05.

## Đối chiếu giao diện

Đã đọc ảnh local SC034/035/036 và đối chiếu screenshot thực. Cảnh báo rỗng màu đỏ trong bảng, lỗi cạnh trường khách, cảnh báo dưới món chưa duyệt, popup tick xanh và nút đóng sử dụng component chung. Giữ geometry editor, sidebar và các tinh chỉnh danh sách đã có. Screenshot thành công được chụp tại 1366×768, 1440×900 và 1920×1080; kiểm nút đóng trong viewport.

Đối chiếu này là kiểm trực quan và kiểm layout đã thực thi. Nghiệm thu pixel/thiết kế cuối cùng của người dùng vẫn thuộc review, không được suy ra từ số test PASS.

## Hướng dẫn kiểm tra

Mở http://127.0.0.1:5173/50K142.03.3007/ . Nếu cần khởi chạy, vào `D:\50K142-NEW\CoCo`, chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5173`.

Chủ tạo khung giá và tài khoản nhân viên thật. Vào Thu mua → Tạo giao dịch, thêm món trong khung hoặc gửi giá vượt Max để chủ duyệt ở tab khác. Tìm/chọn khách theo phone hoặc tạo hồ sơ, nhấn Lưu. Đóng thông báo thành công để xem hóa đơn trong danh sách. Với nhánh từ chối, xem lý do, nhập lại giá rồi tiếp tục luồng duyệt theo T04.

## Phạm vi nghiệm thu và bước sau

Các phần triển khai/kiểm thử T05 đã hoàn tất, chờ review người dùng. T06 tiếp tục chuẩn hóa tra cứu/chi tiết/lịch sử và trạng thái hiển thị theo nguồn mới/legacy, T07 thực hiện nghiệm thu G6 tổng thể. G5/G6 chưa được tự đánh dấu DONE. Nhánh làm việc `coco/phase-5-staff`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`; thay đổi đang ở working tree.
