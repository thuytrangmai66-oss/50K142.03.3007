# Khôi phục bố cục tạo thu mua theo Figma

Ngày 11/11/2026. Người dùng chỉ rõ màn tạo thu mua đang làm khác Figma và cung cấp ảnh chuẩn. Các lượt sửa trước chỉ xử lý từng phần đã bỏ sót bố cục toàn màn; lượt này sửa lại layout tổng thể theo nguồn gốc, không thay nghiệp vụ.

## Nguồn và số đo độc lập

Ảnh người dùng cung cấp; CODEX `Figma.Nhân viên/Tạo giao dịch thu mua 1.pdf`, canvas **1440×900**, SHA-256 `d35e4d36d2aac8c2684be62006c159db12ef649d3ce1172649e64105aab84aed`; đối chiếu bố cục Chủ tại `Figma.Chủ/Tạo giao dịch thu mua 1.pdf` và frame SC018/SC210. Đọc tọa độ vector/MediaBox của PDF local, không truy cập Figma online và không đưa ảnh màn hình vào source làm nền.

Tọa độ dưới đây tính từ góc trên trái canvas; PDF lưu trục y từ dưới lên, đã đổi bằng chiều cao 900. Đây là oracle đưa vào Playwright, không lấy ngược từ CSS sau khi sửa.

| Khối | x | y | rộng | cao |
|---|---:|---:|---:|---:|
| Sidebar | 26 | 16 | 397 | 868 |
| Header | 461 | 31 | 943 | 75 |
| Thêm | 461 | 137 | 108 | 49 |
| Thẻ tiêu đề giao dịch | 579 | 122 | 825 | 73 |
| Badge mã giao dịch | 903 | 139 | 145 | 39 |
| Bảng sản phẩm | 461 | 211 | 619 | 673 |
| Khách hàng | 1093 | 211 | 311 | 255 |
| Thanh toán | 1093 | 481 | 311 | 403 |
| Ô số điện thoại | 1114 | 282 | 278 | 43 |
| Ô họ tên | 1114 | 379 | 278 | 43 |
| Lưu | 1126 | 823 | 108 | 49 |
| Hủy | 1267 | 823 | 108 | 49 |

## Đã sửa

- Thêm nằm ngoài thẻ trắng; tiêu đề và mã giao dịch nằm cạnh nhau thay vì căn giữa cả hàng và đẩy mã ra mép phải.
- Khôi phục tỷ lệ bảng 619 / cột phải 311, khoảng cách 13; Khách hàng cao 255, khoảng cách đến Thanh toán 15. Nút Lưu/Hủy ở cuối card với kích thước, pill và khoảng cách từ PDF.
- Breadcrumb phần Tạo giao dịch màu xám; sidebar giữ tỷ lệ nguồn khi đổi viewport. CSS chỉ áp ở route editor, không làm đổi layout danh sách hoặc module khác.
- Bảng chỉ có bốn cột theo Figma. Nút bỏ dòng đỏ nằm trong cột Thành tiền, không còn thêm cột header trống. Đơn giá/thành tiền trong bảng dùng định dạng số; tổng thanh toán giữ định dạng tiền và cùng phép tính cũ.
- Màn rỗng là vùng trắng, không vẽ thông báo/icon rỗng và không hiện 0đ hay số trang 1 khác ảnh chuẩn. Vẫn có status cho trình đọc màn hình; khi đủ nhiều bản ghi, pagination thật tiếp tục hoạt động và số dòng thích ứng chiều cao, không cuộn dọc trong bảng.
- Sidebar editor có vị trí Bán hàng/Hàng hóa, và Báo cáo/Phê duyệt cho Chủ theo bộ thiết kế. Các module chưa triển khai được đánh dấu không khả dụng, không gắn route hay tạo chức năng giả. Nghiệp vụ G7/G8/T03 vẫn chưa được thực hiện trong lượt sửa UI này.
- Giữ logo, font, primitives, dữ liệu thật, session, phân quyền và transaction hiện có. Mã draft và tên đăng nhập hiển thị dữ liệu thực, không sao chép GD00242 hoặc tên người dùng mẫu thành giá trị cố định.

Ở các viewport khác 1440×900, các chiều dài ngang/font theo tỷ lệ canvas, phần bảng/thanh toán tận dụng chiều cao thực tế bằng Grid/Flex; không phóng toàn bộ ảnh thành trang bị tràn. Geometry tại canvas gốc là tiêu chí đo cụ thể, không gọi nó là nghiệm thu pixel mọi icon/asset hoặc mọi trạng thái G6. Các icon điều hướng dùng bộ icon đang có của ứng dụng; không tuyên bố nét icon Lucide là bản vector Figma giống từng pixel. Nút Lưu vẫn disabled vì finalize thuộc T05, giao diện giữ màu nguồn và không báo thành công giả.

## File sửa

`src/components/layout/CoCoLayout.tsx`, `src/features/purchases/PurchaseEditor.tsx`, `src/index.css`; thêm `tests/e2e/purchase-editor-figma.spec.ts`; cập nhật `tests/e2e/purchase-drafts.spec.ts` và `tests/e2e/purchase-customer-layout.spec.ts` để kiểm trạng thái rỗng theo Figma thay vì bắt hiển thị thiết kế cũ. Các assertion lưu/reload, validation, quyền và dữ liệu giữ nguyên.

## Kiểm thử và ảnh

| Kiểm tra | Kết quả |
|---|---|
| Lint / typecheck / build | PASS, exit 0 |
| Unit/integration regression hiện tại, 12/11/2026 | **192/192 PASS**, xem JSON |
| Static audit phase6 | 5/5 PASS |
| Geometry Figma, cả hai role | 2/2 PASS: 12 khối, sai số tối đa 1px tại 1440×900 |
| Luồng thêm món/chọn khách/ghi lỗi/reload/paging | 7/7 Chromium PASS, không retry |
| Chromium toàn bộ, 12/11/2026 | **65/65 PASS**, 0 FAIL/skip/flaky, không retry; exit 0 |

Kiểm 1366×768, 1440×900, 1920×1080: nút cuối card nằm trong viewport; màn rỗng không có cuộn dọc nội dung hoặc tràn ngang. Đã xem ảnh rỗng 1440×900 và 1366×768, đối chiếu với ảnh chuẩn người dùng; các kiểm tra chức năng vẫn dùng UI thật và dữ liệu riêng của browser test. Bằng chứng mới lưu `evidence/editor-layout/` và `EVIDENCE_EDITOR_LAYOUT.json`, không ghi đè bằng chứng các lần sửa trước.

Không thay schema hoặc các service nghiệp vụ; không xóa dữ liệu, commit/push/deploy hoặc tự nghiệm thu G6. Xem tại http://127.0.0.1:5173/50K142.03.3007/ → Thu mua → Tạo giao dịch.

## Chốt kiểm chứng 12/11/2026

Lần chạy lại sau giới hạn công cụ đã thực thi thành công trên bản source hiện tại, gồm badge mã giao dịch có khoảng cách cuối cùng. Toàn bộ 192 unit/integration và 65 Chromium PASS. Số unit tăng do working tree có thêm 20 test service phê duyệt được chuẩn bị sẵn; không coi đó là nghiệm thu giao diện hoặc kích hoạt T03.

Baseline ban đầu dừng vì import thừa và thiếu kiểu trong phần chuẩn bị phê duyệt. Đã sửa tối thiểu tại `src/services/purchase-approvals.ts` (import, approvalRevision) và `src/features/approvals/ApprovalsPage.tsx` (dependency service có kiểu rõ qua prop); giữ nguyên quy tắc quyết định, không thêm route, provider hoặc menu phê duyệt hoạt động. Bản build, source layout và toàn bộ regression đã được kiểm lại sau các sửa này.

Ảnh sau sửa: [Nhân viên 1440×900](evidence/editor-layout/staff-empty-1440x900.png), [Chủ 1440×900](evidence/editor-layout/owner-empty-1440x900.png), [Nhân viên 1366×768](evidence/editor-layout/staff-empty-1366x768.png). Số đo 12 khối cho từng role, báo cáo test JSON và SHA-256 nằm trong thư mục bằng chứng cùng manifest EVIDENCE_EDITOR_LAYOUT.json.
