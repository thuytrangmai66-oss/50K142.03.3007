# Sửa popup xác nhận xóa CoCo

Ngày 11/11/2026, giờ Việt Nam. Đã hoàn thành popup xác nhận theo ảnh tham chiếu thứ 2 và CODEX. **Chiều rộng desktop dùng chung 480px với các thông báo ResultDialog hiện có**, theo chỉ đạo bổ sung mới nhất; trên màn hình nhỏ giới hạn bằng viewport trừ 32px.

## Thiết kế và nguồn

- Đối chiếu CODEX SC101/SC294 (xóa khách hàng hai vai trò), SC149 (xóa nhân viên). PDF gốc `CODEX/Figma.Chủ/Xóa thông tin khách hàng 1.pdf` có panel vector **477×297**, radius **30**, nút **145×49**, khoảng ngang giữa nút **35**, vòng icon khoảng **80,83**. Có bản PDF role nhân viên tương ứng.
- Dùng tỷ lệ 480/477 cho desktop để thống nhất chiều rộng với ResultDialog; cửa sổ hẹp dùng tỷ lệ compact 320/477 cho typography/icon/khoảng cách. Popup desktop thực tế khoảng 480×300, không dùng header be hoặc vùng trắng chia thành panel lớn.
- Thứ tự: X phía trên phải → cảnh báo trong vòng hồng → câu hỏi đậm, căn giữa → hai nút pill cạnh nhau, cân đối và căn giữa. Native dialog giữ chính giữa viewport và có backdrop tối.
- Giá trị màu đọc từ vector PDF: Xác nhận **#E7E7E7**, Hủy **#E8DDCE**, vòng icon **#FFE7E8**, icon **#FF383C**, chữ đen, mặt trắng. Hai màu nút được giữ theo PDF/ảnh tham chiếu. Font Be Vietnam Pro của ứng dụng giữ nguyên.
- X/keyboard focus và icon dùng bộ Lucide hiện có. Icon là TriangleAlert; khác biệt nhỏ về đường nét raster/vector hoặc font anti-alias có thể còn so với PDF. Chưa có baseline pixel-diff tự động; không công bố khớp 100% pixel. Chiều rộng 480px thay tỷ lệ thumbnail 320px của ảnh chat là điều chỉnh có chủ đích theo chỉ đạo mới nhất.

## File/component đã thay đổi

| File | Nội dung |
|---|---|
| [ConfirmDialog.tsx](../../src/components/ui/ConfirmDialog.tsx) | Component mới cho xác nhận; dialog native, focus Hủy, X/Hủy/Escape, busy và khóa xác nhận đồng bộ |
| [CustomerDetailPage.tsx](../../src/features/customers/CustomerDetailPage.tsx) | Dùng ConfirmDialog; giữ snapshot/version, truyền đúng MaKH đang xác nhận; đổi route bản ghi thì đóng popup cũ |
| [StaffPages.tsx](../../src/features/staff/StaffPages.tsx) | Dùng chung ConfirmDialog, giữ employee ID/revision và soft delete; đóng xác nhận khi đổi bản ghi |
| [index.css](../../src/index.css) | Layout/color/scale riêng cho xác nhận; token `--notice-dialog-width: 480px` dùng chung với ResultDialog, không đổi chiều rộng thực của ResultDialog |
| [confirmation.spec.ts](../../tests/e2e/confirmation.spec.ts) | Sáu bài Chromium cho layout, responsive, dữ liệu, lỗi, race và console |

Không sửa service, transaction, validation, schema, quyền hoặc dữ liệu người dùng. Giữ quy tắc cấm xóa khách có giao dịch, CAS/version và xử lý lỗi hiện có. Chỉ sau commit thành công mới có thông báo thành công. `pending` ref chặn xác nhận lặp ngay trong cùng lượt xử lý; trong lúc busy, cả X/Hủy/Xác nhận và Escape đều bị chặn.

## Chuẩn hóa các popup liên quan

| Nhóm | Kết quả |
|---|---|
| Xác nhận xóa khách hàng — Chủ/Nhân viên | Dùng ConfirmDialog chung, đúng SC101/294 |
| Xác nhận xóa tài khoản nhân viên — Chủ | Dùng cùng component vì SC149 có cùng bố cục |
| Form tạo/sửa khách, staff, khung giá | Giữ FormDialog; không áp thiết kế xác nhận lên form |
| Thông báo kết quả auth/customer/staff/bracket | Giữ ResultDialog và hình thức riêng; chỉ chuyển literal width sang token có cùng giá trị 480px |
| Khung giá | Module hiện tại không có hành động xóa, không tự bổ sung xác nhận hoặc nghiệp vụ xóa |
| Hàng hóa, thu mua, bán hàng, phê duyệt | Chưa có module UI trong roadmap hiện tại; NOT RUN, không thêm popup trước nghiệp vụ |

## Kiểm thử đã thực thi

| Kiểm tra | Kết quả |
|---|---|
| Căn giữa/kích thước/bố cục | PASS tại 1366×768, 1440×900, 1920×1080; desktop width 480px, tâm lệch tối đa 1 CSS px, không có header be |
| Responsive | PASS tại 390×844 và 320×640; popup/nút nằm trong viewport, không tràn |
| Hủy/X/Escape | PASS, so sánh snapshot toàn DB trước/sau không đổi; kiểm cho owner/customer, staff/customer, owner/staff |
| Đổi sang bản ghi khác khi popup mở | PASS: đóng popup cũ, không xóa; snapshot DB không đổi |
| Xác nhận | PASS: xóa đúng khách mục tiêu, giữ khách còn lại; staff inactive đúng account, giữ account khác |
| Busy/xác nhận lặp | PASS: khóa transaction IDB test; các nút disabled, Escape không đóng; khi mở khóa chỉ thêm một operation/audit của thao tác xóa |
| Lỗi xóa | PASS: tiêm lỗi delete ở IDBObjectStore; rollback toàn DB, chỉ báo “Xóa không thành công”; đóng lỗi rồi retry UI thật thành công |
| Dữ liệu đổi ở tab khác | PASS: xác nhận snapshot cũ bị CAS từ chối; tên mới và bản ghi vẫn tồn tại |
| Console | PASS: 0 pageerror/console.error trong sáu luồng mới |
| Chromium toàn bộ | **45/45 PASS**, không retry/skip, gồm 39 regression và 6 bài xác nhận mới |
| Unit/integration | **101/101 PASS**, 6 file, không skip |
| Lint/typecheck/build | PASS, exit 0; build gồm `tsc --noEmit` |
| Full pixel baseline / CI / Pages | NOT RUN; chưa push/deploy |

Lệnh: `npm run lint`, `npm test`, `npm run build`; PowerShell `$env:CI='true'; npm run test:e2e -- --reporter=line --retries=0 --global-timeout=240000`. Tất cả test dùng DB/context tạm; không reset hay xóa dữ liệu Chrome cá nhân.

## Ảnh trước và sau

| Popup | Trước | Sau — desktop | Sau — màn hình hẹp |
|---|---|---|---|
| Khách hàng — Chủ | [Popup cũ](evidence/confirmation/before/customers-popup.png) | [Popup mới](evidence/confirmation/after/owner-customers-popup-1366x768.png), [toàn màn hình](evidence/confirmation/after/owner-customers-1366x768.png) | [320×640](evidence/confirmation/after/owner-customers-popup-320x640.png) |
| Khách hàng — Nhân viên | Cùng component khách hàng cũ | [Popup mới](evidence/confirmation/after/staff-customers-popup-1366x768.png) | [390×844](evidence/confirmation/after/staff-customers-popup-390x844.png) |
| Nhân viên — Chủ | [Popup cũ](evidence/confirmation/before/staff-popup.png) | [Popup mới](evidence/confirmation/after/owner-staff-popup-1366x768.png) | [320×640](evidence/confirmation/after/owner-staff-popup-320x640.png) |

[Manifest code/source/ảnh](CONFIRM_DIALOG_EVIDENCE.json) ghi checksum, phạm vi và kết quả. Không còn test lỗi trong phạm vi đã sửa; khác biệt pixel nhỏ và module chưa triển khai được ghi riêng ở trên. Phân trang 9 dòng của [lượt chuẩn hóa trước](PAGINATION_STANDARDIZATION_REVIEW.md) tiếp tục được regression xác nhận.

Local hiện phục vụ bản build mới: **http://127.0.0.1:5173/50K142.03.3007/**. Tải lại tab, mở Khách hàng → chọn khách → Xóa tài khoản để xem. Chưa stage/commit/push/deploy.
