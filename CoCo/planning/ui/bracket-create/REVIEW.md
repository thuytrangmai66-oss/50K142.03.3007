# Đồng bộ modal tạo mới: Khách hàng / Nhân viên / Khung giá

15/11/2026. Nhánh `main`, HEAD `213815c`; đã fetch origin, không phân kỳ. Bảo toàn các thay đổi UI chưa commit từ lượt trước. Không commit/push/deploy, không đổi trạng thái nghiệm thu phase.

## Kết quả và giới hạn nguồn

Đã triển khai biến thể gọn của **FormDialog dùng chung**, bật khi **tạo** Khách hàng, Nhân viên và Khung giá theo xác nhận mới của người dùng. Giữ component Field/Button, font Be Vietnam Pro, màu nền `#f5f0e8`, be `--accent: #e8ddce`, viền `--input-border: #aeaeb2`, overlay 36% và bố cục hai cột/nút Hủy–Lưu bên phải. Không thêm icon, placeholder, lựa chọn hoặc thay đổi quy tắc nhập hiện có.

Đã xem nguồn CODEX SC176 (khung giá), SC158 (tạo nhân viên) và render PDF `CODEX/Figma.Chủ/Tạo thông tin khách hàng 1.pdf` bằng PDF.js đã có ở TEMP; không thay dependency, upload hoặc version hóa nguồn thiết kế. SC168–SC179 của Khung giá chỉ có ảnh chụp trong `.uc-ui-matrix-qa`, kích thước ảnh khác nhau, không có export layer gốc tương ứng trong bộ clean export. Figma MCP báo **tool call limit trên Starter plan** khi đọc metadata.

Vì vậy, các số sau là **số đo UI thực tế bằng Chromium**, không gọi chúng là kích thước layer Figma gốc hoặc chứng nhận pixel-perfect. Các số gợi ý trong prompt được dùng cho bản compact sau khi kiểm tra khả năng hiển thị; phần đối chiếu kích thước native Figma **CHƯA XÁC MINH**.

**Phạm vi đã được người dùng xác nhận:** “Thu gọn đồng bộ ba modal tạo mới”. Đã bật `compact={!customer}` tại `CustomerForm.tsx` và `compact={!account}` tại `StaffForm.tsx`, dùng nguyên biến thể đã kiểm tra ở Khung giá. Lượt áp dụng này chỉ thêm hai prop trình bày; không sửa CSS/component chung, submit, validation, quyền hay schema. Các modal **sửa** vẫn giữ bố cục cũ.

## Kiểm chứng đồng bộ sau xác nhận

Đo cả ba modal ở 1366×768, 1440×900 và 1920×1080, zoom 100%, DPR 1:

| Modal tạo | Kích thước trước | Kích thước hiện tại | Header / ô nhập / nút |
|---|---|---|---|
| Khách hàng, 2 trường | 920×420,5px | **720×260px** | 50px / 44px / 78×38px |
| Nhân viên, 4 trường | 920×580,5px | **720×388px** | 50px / 44px / 78×38px |
| Khung giá, 5 trường | 920×660,5px | **720×452px** | 50px / 44px / 78×38px |

Chiều cao co theo nội dung, không ép các modal có số trường khác nhau cao bằng nhau. Typography tiêu đề/label, padding/radius của khung trắng, kiểu nút và khoảng cách đều dùng chung; cả ba nằm giữa viewport, không cần cuộn ở các desktop đã đo.

Ảnh hiện tại: [Khách hàng](evidence/shared/customers-1440.png) · [Nhân viên](evidence/shared/staff-1440.png) · [Khung giá](evidence/shared/price-brackets-1440.png). [Số đo ba viewport](evidence/shared/geometry.json) · [Hash đầu vào](evidence/shared/input-hashes.json).

Kiểm tra mới sau khi bật hai prop:

- Lint, typecheck và production build: **PASS**; giữ nguyên cảnh báo annotation Zod và bundle lớn đã có.
- Chromium kiểm tra hình học/style cả ba modal: **1 PASS / 0 FAIL / 0 SKIP**, 4,7s; khớp chiều rộng/header/input/nút và các computed style dùng chung tại ba viewport.
- `reference-data.spec.ts`, `staff.spec.ts`, `staff-review.spec.ts`: **22 PASS / 0 FAIL / 0 SKIP**, 55,3s. Bao gồm hai vai trò, tạo/sửa/Hủy, lỗi validation, lỗi ghi/rollback/retry, trùng tài khoản, mật khẩu/hiện-ẩn, phân quyền, hai tab và màn hình nhỏ.
- **Tổng kiểm tra Chromium mới: 23 PASS / 0 FAIL / 0 SKIP.** Không chạy lại full suite hoặc các test nghiệp vụ không có thay đổi liên quan. Evidence 18 unit/integration dữ liệu ở lần trước được giữ lại: source nghiệp vụ và dependencies không đổi, không ghi là một lần chạy mới.

Đã khép câu hỏi phạm vi đồng bộ; giới hạn chưa đọc được layer Figma gốc vẫn giữ nguyên, không gọi kết quả này là chứng nhận pixel-perfect. Không commit/push/deploy. Các số liệu và kiểm thử riêng Khung giá bên dưới là evidence từ lượt triển khai trước xác nhận mở rộng phạm vi.

## Kích thước trước / sau

Đo tại 1366×768, 1440×900, 1920×1080, zoom 100%, DPR 1:

| Thành phần | Trước | Sau |
|---|---|---|
| Modal | 920×660,5px | **720×452px** |
| Header | 80,5px; font 27px | **50px; font 22px / line-height 28px** |
| Ô nhập / select | 56px; font 20px | **44px; font 17px** |
| Label | 20px | 18px / line-height 24px |
| Khoảng cách dòng | 24px | 20px |
| Khoảng cách dòng cuối → nút | gap 24px + margin 28px | một gap 20px |
| Nút Hủy / Lưu | 106×48px | **78×38px** |
| Body margin | 24px | 8px trên / 22px ngang / 12px dưới |
| Body padding | 28px | 8px trên / 22px ngang / 16px dưới |

Modal giảm 200px chiều rộng, 208,5px chiều cao. Bản cũ thực tế không có overflow tại ba viewport chuẩn khi chưa có lỗi; không gọi việc giảm scrollbar ở các viewport này là sửa một lỗi đã tái hiện. Nguyên nhân cảm giác quá lớn là khung dùng chung 920px, header padding 40px, field 56px và khoảng cách footer cộng dồn.

Dialog nằm giữa theo cả hai trục, 5 field và hai nút hiển thị đầy đủ, không cần cuộn ở desktop. Ở 768×1024 và 1024×570 vẫn vừa toàn bộ form. 390px/320px dùng một cột; 320×640 có đúng một vùng body cuộn 24px, dialog không cuộn lồng nhau hay tràn ngang. Header tự tăng lên 78px khi tiêu đề cần hai dòng.

[Ảnh trước 1440](evidence/before-1440.png) · [Sau 1366](evidence/after-1366x768.png) · [Sau 1440](evidence/after-1440x900.png) · [Sau 1920](evidence/after-1920x1080.png) · [Sau 320](evidence/after-320x640.png).

[Số đo ba form trước sửa](evidence/before.json) · [Hình học sau sửa](evidence/after-geometry.json) · [Hash source/test](evidence/input-hashes.json).

## File và hành vi

- `src/components/ui/FormDialog.tsx`: thêm tùy chọn trình bày `compact`, mặc định tắt. Đổi cleanup sang `useLayoutEffect` để native dialog đóng khi còn trong DOM và trả focus đúng nút mở; không đổi busy guard hoặc sự kiện đóng.
- `src/features/price-brackets/BracketForm.tsx`: bật compact riêng khi tạo, không đổi submit/validation/state/service.
- `src/features/customers/CustomerForm.tsx`, `src/features/staff/StaffForm.tsx`: bật cùng compact riêng khi tạo theo lựa chọn đã được người dùng xác nhận, không đổi form sửa hoặc logic nghiệp vụ.
- `src/index.css`: style của biến thể, responsive và một vùng cuộn body. Không sửa CSS các màn khác để bù layout.
- `tests/e2e/bracket-create-dialog.spec.ts`: hai bài kiểm tra UI thật, geometry, mở/đóng/mở lại, focus, lỗi ghi native IndexedDB, retry và double-click chỉ tạo một bản ghi.
- Báo cáo và evidence trong thư mục này. Source DB/schema/migration, mapping độ mới 3/2/1, Min/Max, transaction và phân quyền không bị sửa.

## Kiểm thử lượt Khung giá trước xác nhận đồng bộ

| Phạm vi | Kết quả |
|---|---|
| Lint, typecheck, production build | **PASS**; giữ cảnh báo Zod annotation/bundle lớn đã có |
| `tests/unit/reference-data.test.ts --maxWorkers=1` | **18 PASS / 0 FAIL / 0 SKIP**, 6,52s |
| `bracket-create-dialog.spec.ts` | **2 PASS / 0 FAIL / 0 SKIP**, 5,2s; bảy viewport, đóng Hủy/X/Escape, validation, native write failure/retry, giữ dữ liệu nhập, chống lưu trùng |
| `reference-data.spec.ts`, `staff.spec.ts`, `purchase-approvals.spec.ts` | **30 PASS / 0 FAIL / 0 SKIP**, khoảng 1,1 phút; CRUD, quyền, hai tab, rollback, modal lồng nhau và hồi quy |
| Full suite / Visual G10 / pixel comparison với layer Khung giá gốc | **NOT RUN**; không đổi baseline/ngưỡng và không báo PASS cho phần này |

Lượt đầu bài UI mới: 1 PASS / 1 FAIL do focus không trở về nút mở sau khi dialog bị gỡ khỏi DOM trước cleanup. Đã sửa lifecycle tại FormDialog và chạy lại nguyên assertion: cả hai PASS. Không xóa assertion hoặc nới timeout.

**Lượt Khung giá: 18 unit/integration và 32 Chromium case liên quan PASS.** Xác minh native Figma chưa khép; phạm vi đồng bộ đã được xác nhận và thực hiện ở mục cập nhật phía trên. Không coi test PASS là nghiệm thu thiết kế.
