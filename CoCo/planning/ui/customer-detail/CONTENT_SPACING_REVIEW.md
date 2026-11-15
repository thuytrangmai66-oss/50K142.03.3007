# Phân bổ nội dung Chi tiết khách hàng theo Figma

> Trạng thái mới nhất: theo yêu cầu tiếp theo, nhóm Xóa/Sửa nằm dưới và cách đáy 24px tại ba desktop chuẩn. Xem [ACTIONS_BOTTOM_REVIEW.md](ACTIONS_BOTTOM_REVIEW.md). Bản khoảng cách cố định và bản Grid tỷ lệ trong các báo cáo trước giữ làm lịch sử.

15/11/2026. UI-only theo yêu cầu mới; giữ chiều cao khung trong `HEIGHT_REVIEW.md`, thay cách bố trí nhóm Xóa/Sửa. Git `main`, HEAD/origin `213815c0e303c94b0467334768edaba6d67f19f3`, không phân kỳ lúc bắt đầu. Không commit/push/deploy; giữ nguyên các thay đổi local khác.

## Nguyên nhân và sửa đổi

`margin: auto auto 0` của `.customer-detail-card .form-actions` hút toàn bộ phần chiều cao còn dư của body Flexbox, đẩy nút xuống đáy. Vì vậy khoảng B → C tăng từ 40px tối thiểu thành 136px tại 1440×900, 316px tại 1920×1080.

Chỉ sửa CSS hiện có, không thêm override hoặc đổi JSX/handler:

| Thuộc tính | Trước | Sau |
|---|---|---|
| Nhóm Xóa/Sửa `margin` | `auto auto 0` | `0 auto` |
| Khoảng tối thiểu trước nhóm Xóa/Sửa | padding-top 40px / 20px gọn | Giữ 40px / 20px, không còn phần margin dọc tự động |
| Hàng label/input | align-items kế thừa `start` | `center` |
| Padding label desktop | `16px 0 0 68px` | `0 0 0 68px` |
| Padding label gọn | `12px 0 0` | `0` |

Body/card tiếp tục Flexbox để giữ chiều cao ngoài; các nhóm đi theo thứ tự tự nhiên A → B → C. Phần chiều cao thừa nằm sau C, không chen vào giữa B/C. Không dùng space-between, absolute, translate/scale, margin âm hoặc zoom. Kích thước/màu/icon nút, input và thẻ lịch sử không đổi.

## Đối chiếu nguồn

Đối chiếu ảnh người dùng và SC086 local `CODEX/Figma.Chủ/Xem thông tin Khách hàng.pdf`, frame 1440×900. Dùng lại bản render/kích thước vector đã kiểm chứng, không truy cập link Figma hoặc đo pixel máy móc từ hai ảnh có độ phân giải khác nhau. [Metadata/hash nguồn](evidence/source-measurements.json).

Tại viewport nguồn: padding trên body 23px, hai hàng thông tin cách nhau 49px, form → lịch sử 45px, hai thẻ lịch sử cách nhau 58px, lịch sử → thao tác khoảng 40px. Các số này được giữ theo nguồn thay cho các khoảng ước lượng trong yêu cầu. Bố cục gọn tiếp tục dùng spacing/chiều cao responsive đã có.

Input vẫn 619×70px, thẻ lịch sử 375×165px, nút thao tác 255×49px tại 1440×900. Nhóm thao tác trở về Y715, đáy Y764 (nguồn có hai nút lệch nhau khoảng 1px; bản triển khai giữ cùng hàng). Khung vẫn cao **706px** theo yêu cầu căn đáy mới trước đó, khác chiều cao 645px của PDF một cách có chủ đích; không tuyên bố toàn màn hình pixel-perfect.

## Số đo trước/sau

Chromium, zoom 100%, DPR 1. Chủ và Nhân viên cho cùng kết quả:

| Viewport | Lịch sử → nút thao tác trước / sau | Nhóm thao tác lên | Chiều cao khung giữ nguyên |
|---|---:|---:|---:|
| 1366×768 | 230 → **20px** | 210px | 616px |
| 1440×900 | 136 → **40px** | 96px | 706px |
| 1920×1080 | 316 → **40px** | 276px | 886px |
| 1280×650 | 116 → **20px** | 96px | 498px |

Rect của toàn khung, Sidebar, Header và Quay lại trước/sau **không đổi**. Vị trí/kích thước input, thẻ lịch sử, chiều rộng và tọa độ X của nút thao tác đều không đổi. Label/input được kiểm tra đồng tâm dọc với sai số ≤2px. Không có cuộn dọc trong main hoặc tràn ngang tại bốn viewport trên. Đáy khung vẫn trùng đáy sidebar.

[So sánh đầy đủ](evidence/content-spacing/comparison.json) · [Chủ trước](evidence/content-spacing/owner-before.json) · [Chủ sau](evidence/content-spacing/owner-after.json) · [Nhân viên sau](evidence/content-spacing/staff-after.json).

## File và kiểm thử

- `src/index.css`: bỏ margin dọc tự động của nhóm thao tác và căn giữa label bằng Grid, chỉ trong `.customer-detail-card`.
- `tests/e2e/customer-detail-layout.spec.ts`: đo label, kiểm tra khoảng B → C ổn định và giữ mục tiêu kích thước/đáy khung; thêm kiểm tra 390×844. Thay assertion cũ buộc nút sát đáy bằng yêu cầu mới về khoảng cách sau lịch sử; không đổi ngưỡng hình học hoặc baseline G10.
- Báo cáo này và ảnh/số đo trong `evidence/content-spacing/`; thêm ghi chú lịch sử vào `HEIGHT_REVIEW.md`.

Lint, typecheck, production build: **PASS**. Build 10,15s, giữ nguyên cảnh báo annotation Zod và bundle >500KB hiện có.

`npm.cmd run test:e2e -- tests/e2e/customer-detail-layout.spec.ts tests/e2e/reference-data.spec.ts --workers=1 --reporter=list --output=test-results/customer-detail-content-spacing`: **15 PASS / 0 FAIL / 0 SKIP**, 36,8s.

Đã chạy cả Chủ/Nhân viên: Quay lại, tìm/tạo ở danh sách, lịch sử mua/bán, sửa/xóa, bảo vệ khách có giao dịch, lỗi ghi/retry, hai tab, phân trang và bảo toàn dữ liệu chỉ xem. Kiểm tra thêm viewport thấp 1366×500 và hẹp 390×844: cuộn tới nút được, không che/cắt nội dung hoặc tràn ngang. Ở viewport hẹp, nút thao tác tiếp tục xuống hàng theo responsive hiện có; desktop vẫn cùng hàng. Không có console/pageerror trong bài layout.

Tận dụng ảnh/số đo trước từ regression hợp lệ ngay trước lượt sửa này, không chạy lại baseline không đổi. Không chạy full suite, unit nghiệp vụ hoặc Visual G10 vì không sửa logic/dependency. Không đổi trạng thái nghiệm thu phase.

## Ảnh

- 1440×900: [trước](evidence/content-spacing/owner-before-1440x900.png) · [sau](evidence/content-spacing/owner-detail-1440x900.png).
- 1366×768: [trước](evidence/content-spacing/owner-before-1366x768.png) · [sau](evidence/content-spacing/owner-detail-1366x768.png).
- 1920×1080: [trước](evidence/content-spacing/owner-before-1920x1080.png) · [sau](evidence/content-spacing/owner-detail-1920x1080.png).
- [Nhân viên 1440×900](evidence/content-spacing/staff-detail-1440x900.png) · [viewport hẹp](evidence/content-spacing/owner-detail-narrow-390x844.png).

Ảnh dùng profile kiểm thử riêng, dữ liệu do luồng UI tạo; không thay giá trị khách hàng đang có trong trình duyệt người dùng. Không có blocker được phát hiện trong phạm vi sửa này.
