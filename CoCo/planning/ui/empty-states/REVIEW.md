# Đồng bộ empty state theo màn hình Nhân viên

15/11/2026. UI-only; giữ thông báo, điều kiện rỗng, lọc, phân trang, loading/error, phân quyền và dữ liệu. Nhánh `main`, HEAD/origin `213815c0e303c94b0467334768edaba6d67f19f3` khi bắt đầu, không phân kỳ. Không commit/push/deploy; bảo toàn các thay đổi local từ các công việc trước.

## Chuẩn đã đo trước sửa

Computed styles của empty state Nhân viên trên Chromium, 1440×900, zoom 100%, DPR 1:

| Thuộc tính | Giá trị thực tế dùng chung |
|---|---|
| Font | `"Be Vietnam Pro", sans-serif` |
| Font-size / weight | **16px / 400** |
| Line-height / letter-spacing | **28,8px / normal** |
| Màu chữ và icon | **#AEAEB2**, `rgb(174, 174, 178)` |
| Icon | `CircleAlert` hiện có, **48×48px**, stroke **1,5px** |
| Hướng / gap | Dọc / **12px** |
| Căn chỉnh | Center theo hai trục, text-align center |

16px/48px/12px là số đo thực tế, được ưu tiên thay cho các khoảng ước lượng 20–22px/52–60px/20–24px trong yêu cầu. [Số đo trước](evidence/before.json).

Trước sửa, nhiều danh sách có chữ đen/icon 24px xếp ngang; Phê duyệt có icon 56px; báo cáo dùng màu `#AEB0B4`, riêng tồn lâu còn kế thừa font 13px. Bảng thực chỉ cao theo nội dung trong khi container nền trắng cao hơn, nên thông báo tập trung ở phần đầu thay vì giữa toàn vùng dữ liệu.

## Thực hiện

- Tái sử dụng nhánh empty hiện có của `DataTable`, thêm class `.list-empty-state` và một kiểu dùng chung; không tạo các bản EmptyState riêng theo module.
- Loại bỏ các override empty của Nhân viên, Phê duyệt và Báo cáo. Dùng cùng icon, font, màu, gap và căn chỉnh theo chuẩn đã đo.
- Flexbox cho wrapper/table **chỉ khi có empty state trung tính**: table lấp vùng trắng hiện có, hàng empty nhận phần chiều cao sau header, cell căn giữa. Giữ nguyên chiều cao header và container; không ép mọi bảng cùng kích thước.
- Điều chỉnh nhánh CSS cửa sổ thấp để container chứa empty state không co về 0 khi bộ lọc cao. Viewport hẹp được cuộn trang khi cần; thông báo không tràn nền bảng hoặc đè header/pagination.
- Thêm prop trình bày `emptyTone="validation"` ở Thu mua/Bán hàng để giữ nguyên cảnh báo đỏ “Hãy thêm ít nhất một sản phẩm”. Không đổi điều kiện validation, handler hoặc cách lưu giao dịch.

Tại 1440×900, cả **14/14** trường hợp có chiều cao container/header và nội dung thông báo trước/sau không đổi. Ví dụ: Nhân viên/Khách hàng/Khung giá có container 594px, Thu mua/Bán hàng/Hàng hóa 536px, Phê duyệt 615px; header của bảy danh sách đều giữ 42px. [So sánh đầy đủ](evidence/comparison.json).

## Phạm vi và ảnh trước/sau

Mọi ảnh trong bảng cùng viewport 1440×900, zoom 100%, DPR 1:

| Màn hình | Trước | Sau |
|---|---|---|
| Nhân viên | [ảnh](evidence/before-staff.png) | [ảnh](evidence/after-staff.png) |
| Bán hàng | [ảnh](evidence/before-sales.png) | [ảnh](evidence/after-sales.png) |
| Thu mua | [ảnh](evidence/before-purchases.png) | [ảnh](evidence/after-purchases.png) |
| Hàng hóa | [ảnh](evidence/before-inventory.png) | [ảnh](evidence/after-inventory.png) |
| Khách hàng | [ảnh](evidence/before-customers.png) | [ảnh](evidence/after-customers.png) |
| Phê duyệt | [ảnh](evidence/before-approvals.png) | [ảnh](evidence/after-approvals.png) |
| Khung giá thu mua | [ảnh](evidence/before-price-brackets.png) | [ảnh](evidence/after-price-brackets.png) |
| Báo cáo doanh thu | [ảnh](evidence/before-report-revenue.png) | [ảnh](evidence/after-report-revenue.png) |
| Báo cáo chi phí thu mua | [ảnh](evidence/before-report-purchase-cost.png) | [ảnh](evidence/after-report-purchase-cost.png) |
| Báo cáo lợi nhuận | [ảnh](evidence/before-report-profit.png) | [ảnh](evidence/after-report-profit.png) |
| Báo cáo dòng tiền | [ảnh](evidence/before-report-cash-flow.png) | [ảnh](evidence/after-report-cash-flow.png) |
| Báo cáo hàng tồn lâu | [ảnh](evidence/before-report-aged-stock.png) | [ảnh](evidence/after-report-aged-stock.png) |
| Lịch sử mua của khách hàng | [ảnh](evidence/before-history-purchases.png) | [ảnh](evidence/after-history-purchases.png) |
| Lịch sử bán của khách hàng | [ảnh](evidence/before-history-sales.png) | [ảnh](evidence/after-history-sales.png) |

Có thêm ảnh của Nhân viên cho bốn danh sách được cấp quyền, tên `staff-after-*.png` trong `evidence/`.

## Kiểm thử thực thi

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run lint` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS, 7,88s; giữ cảnh báo annotation Zod/bundle >500KB hiện có |
| `empty-states.spec.ts` | **4 PASS / 0 FAIL / 0 SKIP**, 14,7s |
| Regression 10 file Chromium liên quan bên dưới | **50 PASS / 0 FAIL / 0 SKIP**, 3,9 phút |
| Tổng Chromium cuối | **54 PASS / 0 FAIL / 0 SKIP** |
| Full suite, unit/integration nghiệp vụ, Visual G10 | NOT RUN; không có thay đổi nghiệp vụ/dependency và không cập nhật baseline |

Lệnh Chromium: `npm.cmd run test:e2e -- <các file> --workers=1 --reporter=list`. Output: `test-results/empty-state-after` và `test-results/empty-state-regression`.

Regression gồm: `customer-detail-layout.spec.ts`, `inventory.spec.ts`, `purchase-approvals.spec.ts`, `purchase-editor-figma.spec.ts`, `purchase-list.spec.ts`, `reference-data.spec.ts`, `reports-purchase-cost.spec.ts`, `reports-revenue.spec.ts`, `reports-t04.spec.ts`, `sales-pages.spec.ts`.

Đã kiểm chứng:

- **67 phép đo màn hình** cho Chủ/Nhân viên: cùng computed styles; icon/text căn giữa vùng dữ liệu sau header với sai số ≤2 CSS px; không tràn ngang. [Chủ](evidence/after-owner.json), [Nhân viên](evidence/after-staff.json).
- Bảy danh sách và hai lịch sử ở 1440×900, 1366×768, 1920×1080, 390×844; năm báo cáo ở ba viewport desktop. Chỉ kiểm tra những route được cấp quyền cho từng vai trò.
- Native loading khách hàng được giữ bằng transaction chỉ thực hiện read để chặn query tạm thời: hiển thị loading, không hiển thị empty; bỏ chặn trả về kết quả thật.
- Không có dữ liệu, tìm không ra kết quả, tạo hồ sơ qua UI rồi hiển thị dòng thật, xóa điều kiện tìm kiếm và reload. Các truy vấn/đổi viewport không ghi dữ liệu.
- Validation đỏ và icon 24px Thu mua/Bán hàng giữ nguyên, nhấn Lưu thiếu dữ liệu không phát sinh ghi.
- Regression có tìm/lọc kết hợp, phân trang dữ liệu thật, lỗi đọc/ghi và retry/rollback, hai tab, duyệt/từ chối, lịch sử, dữ liệu legacy/chưa xác minh và quyền báo cáo. Trang chi tiết khách hàng và các tinh chỉnh UI trước vẫn PASS.

Lượt kiểm tra đầu phát hiện 2 lỗi layout mới ở viewport hẹp do container co về 0; đã sửa CSS gốc và tăng kiểm tra để đo tâm **toàn container sau header**, không chỉ tbody. Không nới ngưỡng/assertion, không skip hoặc đổi timeout để đạt PASS. Kết quả cuối ở bảng trên đã chạy sau sửa.

Không seed mock vào ứng dụng hoặc sửa storage của người dùng. Các profile E2E độc lập; tài khoản/hồ sơ cần cho luồng kiểm thử được tạo qua giao diện thật. Ảnh là ứng dụng chạy với profile kiểm thử, không phải ảnh Figma thay thế dữ liệu.

## File của lần sửa này và giới hạn

- `src/components/ui/DataTable.tsx`: class dùng chung và prop trình bày cho validation.
- `src/index.css`: kiểu empty trung tính, căn giữa theo vùng bảng và bỏ override trùng.
- `src/features/purchases/PurchaseEditor.tsx`, `src/features/sales/SalesEditor.tsx`: chỉ truyền `emptyTone="validation"`.
- `tests/e2e/empty-state-helpers.ts`, `tests/e2e/empty-states.spec.ts`: phép đo, luồng UI và kiểm tra trạng thái/quyền/dữ liệu.
- Báo cáo này, ảnh và số đo trong `evidence/`.

Không còn empty state trung tính hiện hữu nào chưa đồng bộ trong các route đã rà. Hai bảng nhật ký ở Xử lý hàng tồn lâu hiện không truyền thông báo `empty` vào DataTable; giữ nguyên, không tự thêm điều kiện hoặc thông điệp mới. Loading, lỗi hệ thống, trạng thái chưa xác minh, màn hình báo cáo chưa xác nhận bộ lọc và cảnh báo validation nằm ngoài kiểu empty trung tính này.

Không thay ngưỡng/baseline Visual G10, không tuyên bố pixel-perfect toàn hệ thống hoặc thay trạng thái nghiệm thu G10/G11. Không có blocker còn lại trong phạm vi UI này.
