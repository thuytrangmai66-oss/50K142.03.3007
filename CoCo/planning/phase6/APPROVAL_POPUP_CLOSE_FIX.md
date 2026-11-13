# Sửa đóng popup sau xử lý yêu cầu thu mua

Ngày 12/11/2026. Phạm vi sửa sự kiện đóng popup kết quả trong T03.

## Nguyên nhân

`ApprovalDetail` mở theo route `/approvals/:approvalId`. Callback đóng `ResultDialog` trước đây chỉ gọi `setNotice(undefined)`. Route chi tiết vẫn còn nên `FormDialog` tiếp tục nằm trong top layer của trình duyệt, giữ backdrop và chặn danh sách. Test cũ còn kỳ vọng chi tiết ở lại sau khi đóng thông báo, vì vậy chưa bắt được hành vi sai này.

## Xử lý

Thông báo kết quả có cờ `closeFlow` khi transaction quyết định và bước phát tín hiệu thành công. Đóng thông báo gọi điều hướng `/approvals` với `replace`, tháo component chi tiết và mọi dialog con. Cleanup của dialog đóng native modal và backdrop. Danh sách tiếp tục dùng live query để đọc trạng thái mới, giữ tên/ngày và trang đang lọc trong component cha.

Cờ thành công độc lập với màu/icon của thông báo. Kết quả từ chối thành công theo Figma dùng biểu tượng đỏ và thuộc nhánh đóng toàn bộ luồng. Lỗi ghi hoặc lỗi phát kết quả giữ chi tiết và nội dung phù hợp cho người dùng tiếp tục xử lý. Callback đóng chỉ thay UI state và route.

Danh sách hiện có bộ lọc tên nhân viên/ngày gửi và hiển thị tất cả trạng thái. Sau xử lý, dòng hiển thị Đã phê duyệt hoặc Đã từ chối. Bộ lọc pending đã có ở service và tiếp tục loại quyết định đã xử lý theo kiểm thử service hiện có.

## File đã sửa

- `src/features/approvals/ApprovalsPage.tsx`
- `tests/e2e/purchase-approvals.spec.ts`
- Tài liệu báo cáo hiện tại và ghi chú cập nhật T03/G6.

Đã rà các luồng tương tự. CoCo hiện có một module quyết định phê duyệt trong `features/approvals`. CustomerToolbar/BracketForm đóng form qua `onSaved`, StaffForm gọi `onSaved` khi đóng kết quả thành công. Popup thêm món Thu mua đóng ItemDialog trước khi hiện thông báo. Các cơ chế này được chạy lại trong regression.

## Kiểm thử hồi quy lỗi

- Duyệt thành công rồi nhấn X, route về danh sách, không còn `dialog[open]` hoặc `:modal`, trạng thái đúng và snapshot DB không đổi khi đóng.
- Từ chối thành công rồi nhấn X, đóng cả lý do/chi tiết/kết quả, giữ đúng lý do và trạng thái đã lưu.
- Duyệt và từ chối rồi đóng bằng Escape, giữ bộ lọc tên/ngày, tìm kiếm được và mở yêu cầu pending khác bằng click thông thường.
- So sánh toàn bộ approval/line/notice/operation và dữ liệu hóa đơn/sản phẩm trước, sau đóng để phát hiện xử lý lặp.
- Ghi lỗi và lỗi phát sau commit ở cả hai nhánh vẫn giữ chi tiết, cho thử lại đúng luồng. Các ca quyền staff, hai tab, hai chủ, stale, dòng bỏ, draft hủy, rollback và dữ liệu G2 được chạy lại.

Log kiểm thử tại `evidence/approval-popup-close/vitest.json` và `evidence/approval-popup-close/playwright.json`. Tất cả test T03 theo dõi console error và pageerror trong các tab của context test riêng.

| Kiểm tra | Kết quả |
|---|---|
| Lint / typecheck / build | PASS, exit 0 |
| Unit/integration, gồm nền G2 và phê duyệt | 202/202 PASS, 0 FAIL |
| Chromium regression toàn bộ | 75/75 PASS, 0 FAIL, 0 SKIP, 0 flaky |
| Các ca T03 trong regression | 10/10 PASS, console error/pageerror rỗng |
| Duyệt/từ chối rồi đóng X, dữ liệu không ghi lại | PASS |
| Đóng bằng Escape, giữ bộ lọc, tương tác và mở yêu cầu khác | PASS |
| Lỗi ghi/lỗi phát giữ chi tiết, quyền và hai tab | PASS |

Ảnh sau khi đóng toàn bộ popup tại [phê duyệt](evidence/approval-popup-close/approve-closed-to-list.png) và [từ chối](evidence/approval-popup-close/reject-closed-to-list.png). Bản sửa đã kiểm chứng, trạng thái nghiệm thu G6 tiếp tục theo checklist hiện có.
