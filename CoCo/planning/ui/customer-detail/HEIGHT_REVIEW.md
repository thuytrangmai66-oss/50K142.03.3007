# Kéo dài khung Thông tin khách hàng

> Cập nhật tiếp 15/11/2026: giữ nguyên kích thước/đáy khung, đã bỏ margin trên tự động của nhóm Xóa/Sửa theo yêu cầu mới. Xem [CONTENT_SPACING_REVIEW.md](CONTENT_SPACING_REVIEW.md). Cách đặt nút sát đáy bên dưới là lịch sử trước lần sửa đó.

15/11/2026. UI-only, theo yêu cầu mới căn đáy khung với sidebar; đây không phải thông số đo từ Figma. Tiếp nối `WIDTH_REVIEW.md`, chỉ thay chiều cao khung và phân bố khoảng trắng. Không commit/push/deploy. Git `main`, HEAD/origin cùng `213815c0e303c94b0467334768edaba6d67f19f3`; bảo toàn các thay đổi chưa commit khác.

## Cách sửa

Khung cũ cao theo nội dung, không sử dụng phần chiều cao còn lại của workspace. CSS mới giới hạn trong `.customer-detail` / `.customer-detail-card`:

- Desktop: section có `min-block-size: 100%` theo vùng main hiện có; card dùng Flexbox `flex: 1 0 auto` để lấp phần còn lại sau nút Quay lại. Không đo/đổi sidebar bằng JavaScript, không đặt chiều cao card theo một độ phân giải.
- Body dùng cột Flexbox. Form và lịch sử không co/giãn chiều cao; giữ giới hạn chiều rộng cũ. Nhóm Xóa/Sửa dùng margin trên tự động, có khoảng cách tối thiểu 40px (20px ở bố cục gọn) với lịch sử, nằm gần đáy với padding 24px hoặc 20px.
- Cửa sổ thấp vẫn cho card cao theo nội dung và cuộn bằng workspace hiện có; không cắt nút. Không dùng `100vh` trực tiếp cho card, absolute, margin âm, zoom hay transform.
- Giữ nguyên vị trí Header, Quay lại, input và lịch sử; chỉ nhóm thao tác được dịch xuống theo lựa chọn được cho phép trong yêu cầu. Không đổi JSX, handler, nghiệp vụ, dữ liệu hoặc style danh sách/modal/lịch sử.

## Số đo trước / sau

Chromium, zoom 100%, DPR 1. Chủ và Nhân viên có cùng kết quả:

| Viewport | Chiều cao khung trước → sau | Đáy khung trước → sau | Đáy sidebar | Sai lệch đáy trước → sau |
|---|---:|---:|---:|---:|
| 1366×768 | 406 → 616 | 542 → 752 | 752 | 210 → **0px** |
| 1440×900 | 645 → 706 | 823 → 884 | 884 | 61 → **0px** |
| 1920×1080 | 645 → 886 | 823 → 1064 | 1064 | 241 → **0px** |
| 1280×650 | 398 → 498 | 534 → 634 | 634 | 100 → **0px** |

Mục tiêu `|CustomerCard.bottom - Sidebar.bottom| ≤ 8px`: đạt ở bốn viewport trên. Đối chiếu rect trước/sau xác nhận sidebar/header/Quay lại, chiều rộng card, vị trí/kích thước input và lịch sử đều không đổi. Kích thước và tọa độ X hai nút thao tác không đổi, vẫn cùng hàng. Main không cuộn dọc ở bốn viewport này; không tràn ngang.

Tại 1366×500, nội dung cần cuộn: đã xác nhận cuộn tới cả Xóa/Sửa và quay lại danh sách được, không có nút bị mất. Không áp mục tiêu căn đáy desktop cho trường hợp chiều cao không đủ chứa nội dung.

Số đo: [so sánh](evidence/height/comparison.json), [Chủ trước](evidence/height/owner-before.json), [Chủ sau](evidence/height/owner-after.json), [Nhân viên sau](evidence/height/staff-after.json).

## Kiểm thử và file thay đổi

- `src/index.css`: chỉ layout chiều cao/body/action của Chi tiết khách hàng.
- `tests/e2e/customer-detail-layout.spec.ts`: đo sidebar, kiểm tra mục tiêu ≤8px, giữ kích thước input/lịch sử/nút, padding đáy, viewport thấp và điều hướng. Assertion chiều cao cũ 645px/vị trí nút cũ được thay theo yêu cầu mới; giữ nguyên các kiểm tra chiều rộng, nguồn hình học khác và ngưỡng 2px còn liên quan. Không đổi baseline G10.
- Báo cáo này và ảnh/số đo trong `evidence/height/`.

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run lint` | PASS |
| `npm.cmd run typecheck` | PASS; build cuối cũng chạy `tsc --noEmit` thành công |
| `npm.cmd run build` | PASS, 7,15s; cảnh báo annotation Zod và bundle >500KB hiện có giữ nguyên |
| Chromium `customer-detail-layout.spec.ts` + `reference-data.spec.ts` | **15 PASS / 0 FAIL / 0 SKIP**, 38,4s |
| Chạy lại 2 bài layout Chủ/Nhân viên sau điều chỉnh padding cuối cho cửa sổ thấp | **2 PASS / 0 FAIL / 0 SKIP**, 9,0s |
| Full suite / unit service / Visual G10 | NOT RUN; không có thay đổi logic/dependency cần chạy lại |

Đã kiểm tra tìm kiếm/tạo ở danh sách, sửa/xóa và lỗi ghi/retry, lịch sử mua/bán, bảo vệ khách có giao dịch, phân trang, hai tab và dữ liệu chỉ xem không thay đổi. Không có console/pageerror ở hai bài layout. Không phát hiện blocker trong phạm vi sửa, không thay đổi trạng thái nghiệm thu phase.

## Ảnh

- 1440×900: [trước](evidence/height/owner-before-1440x900.png) · [sau](evidence/height/owner-after-1440x900.png).
- 1366×768: [trước](evidence/height/owner-before-1366x768.png) · [sau](evidence/height/owner-after-1366x768.png).
- [Sau 1920×1080](evidence/height/owner-after-1920x1080.png) · [Nhân viên 1440×900](evidence/height/staff-after-1440x900.png) · [cửa sổ thấp 1366×500, đã cuộn tới thao tác](evidence/height/owner-low-1366x500.png).

Ảnh dùng profile kiểm thử riêng, không sửa dữ liệu trình duyệt của người dùng. Các ảnh/kích thước chiều cao trong báo cáo UI trước đó là lịch sử trước yêu cầu mới này; các giới hạn chiều rộng vẫn giữ nguyên.
