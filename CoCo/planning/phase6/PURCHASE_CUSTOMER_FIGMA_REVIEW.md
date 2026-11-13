# Thu mua — bỏ đường kẻ và sửa tìm khách theo Figma local

Ngày 11/11/2026. Theo yêu cầu người dùng: bỏ đường line thừa trong danh sách Thu mua và kiểm tra luồng tìm khách đã có bị khác Figma. Chỉ sửa UI/trạng thái tương tác của chức năng hiện có; không thay schema, service transaction hoặc quy tắc nghiệp vụ.

## Đối chiếu và sửa

- CODEX `.uc-ui-matrix-qa/frame-30.png` / `frame-222.png` và mô tả SC030/SC222: khi số điện thoại khớp, hiển thị gợi ý **tên khách** ngay bên dưới ô Số điện thoại. Đã chuyển gợi ý từ cuối card lên đúng vị trí trước ô Họ tên, dùng nền xám từ token `--input-border` hiện có, bỏ số điện thoại lặp trong gợi ý.
- SC031/SC223: chọn gợi ý mới ghi khách vào draft qua transaction hiện có, điền tên/số điện thoại và đóng gợi ý. Khi mở lại/reload draft, thông tin được khôi phục nhưng không tự mở lại gợi ý. Ô Họ tên là thông tin của khách đã chọn, không tự ghi nhận khách chỉ vì số nhập khớp.
- SC032/SC224: thông báo không tìm thấy nằm dưới ô Số điện thoại; nút + Thêm khách hàng ở phần tiêu đề card. Tiếp tục dùng CustomerForm G4, không tạo khách giả.
- Hủy kết quả lookup cũ khi số điện thoại thay đổi; không để lần đọc khôi phục chậm ghi đè số người dùng vừa nhập. Nhập số mới xóa tên đang hiển thị để tránh hiểu nhầm đã chọn khách mới. Chỉ lựa chọn xác nhận được lưu, không tự thay FK khi đang gõ tìm kiếm.
- Nếu transaction chọn khách thất bại, hiện popup lỗi, giữ gợi ý để thử lại và không điền tên như thể đã lưu thành công. Vẫn dùng CAS/quyền/transaction hiện có.
- Danh sách giao dịch và bảng sản phẩm trong editor dùng `rowDividers={false}` của component chung: không còn đường kẻ dưới dòng hoặc vùng dữ liệu rỗng. Không sửa border bảng ở module khác. Đường chấm trong phần Thanh toán được giữ vì có trong thiết kế.

Đã xem trực quan các frame local trên, không truy cập Figma online. Bố cục desktop thích ứng đã thống nhất được giữ; chưa tuyên bố nghiệm thu pixel toàn bộ G6.

## File sửa

`src/features/purchases/PurchaseEditor.tsx`, `src/features/purchases/PurchasesPage.tsx`, `src/index.css`; kiểm thử tại `tests/e2e/purchase-customer-layout.spec.ts`, `tests/e2e/purchase-list.spec.ts`, `tests/e2e/purchase-drafts.spec.ts`.

## Bằng chứng kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Lint / typecheck / build | PASS, exit 0 |
| Unit/integration toàn bộ | 172/172 PASS |
| Static audit phase6 | 5/5 PASS |
| Chromium tập trung luồng khách hai vai trò | 2/2 PASS, không retry |
| Chromium hồi quy toàn bộ | **63/63 PASS**, 0 FAIL/skip/flaky, không retry; exit 0 |

Test mới tạo hai khách thật bằng UI G4 trong browser context riêng, tìm theo số, đo gợi ý sát ô điện thoại và trước Họ tên, kiểm tên đơn thuần/nền xám, chọn khách và reload, đổi số nhanh rồi chọn khách khác. Chủ còn kiểm lỗi ghi IDB một lần, popup lỗi và retry. Hai role đều có ảnh ở 1366×768, 1440×900 và 1920×1080, thêm ảnh gợi ý và không tìm thấy. Test danh sách kiểm computed border bằng 0 với dữ liệu rỗng và có bản ghi.

Lần test đầu reload ngay sau click đổi khách đã cắt transaction chưa kết thúc; đã sửa test chờ tên khách cập nhật sau commit rồi mới reload, giữ nguyên assertion khách được lưu đúng. Không bỏ kiểm tra persistence hoặc dùng dữ liệu giả làm kết quả nghiệp vụ.

Ảnh và kết quả lần này ở `evidence/customer-figma/`, hash tại `EVIDENCE_CUSTOMER_FIGMA.json`; bằng chứng các lượt trước giữ làm snapshot lịch sử, không đại diện source mới này. Không tự nghiệm thu T02/G6 hoặc triển khai task mới. Không commit/push/deploy, không xóa dữ liệu người dùng.

Xem local: http://127.0.0.1:5173/50K142.03.3007/ → Thu mua → Tạo giao dịch → nhập số khách đã có → chọn tên gợi ý.

Ảnh: [gợi ý khách Chủ](evidence/customer-figma/owner-existing-suggestion.png), [khách đã chọn Nhân viên](evidence/customer-figma/staff-selected-1366x768.png), [danh sách không đường kẻ](evidence/customer-figma/owner-1366x768.png), [không tìm thấy](evidence/customer-figma/owner-not-found.png).
