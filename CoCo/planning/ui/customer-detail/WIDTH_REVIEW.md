# Thu gọn chiều rộng bên trong Chi tiết khách hàng

15/11/2026. UI-only, tiếp nối bản sửa trong `REVIEW.md`. Nhánh `main`, HEAD `213815c`, origin không phân kỳ. Không commit/push/deploy; giữ nguyên các thay đổi chưa commit của những task trước.

## Đã sửa

- Giới hạn input **619px**, theo chiều rộng fill trong PDF nguồn đã đọc. Hai input thẳng trục và bằng nhau. Ở bố cục gọn, cột label 30%, khoảng cách cột 24px giúp input còn **67,27% vùng form**.
- Hàng lịch sử có chiều rộng giới hạn; hai thẻ không giãn quá **375px**, được căn giữa chính xác. Ở cửa sổ thấp, khoảng cách ngang tăng từ 20 lên 36px, chiều rộng mỗi thẻ giảm từ 394 xuống 375px. Ở viewport gốc, thẻ vốn đã đúng 375px nên giữ nguyên; khoảng cách 58px theo PDF vẫn được duy trì.
- Nhóm Xóa/Sửa có `max-width: 879px`, cùng trục phải với vùng form, dùng flex căn phải. Kích thước từng nút giữ nguyên; khoảng cách ngang ở bố cục gọn là 24px, màn nhỏ hơn 600px giữ gap 16px để không thay đổi nhịp xuống hàng.
- Không thay đổi padding/chiều rộng khung ngoài, Header, Sidebar, Back, chiều cao/radius input, chiều cao/màu/icon/font thẻ, khoảng cách dọc hoặc dữ liệu/handler.

## Số đo trước / sau

Chromium, zoom 100%, DPR 1, cả Chủ và Nhân viên:

| Viewport | Rộng input | Rộng mỗi thẻ lịch sử | Gap thẻ | Rộng vùng Xóa/Sửa |
|---|---|---|---|---|
| 1366×768 | 639,25 → **591,31px** | 394 → **375px** | 20 → **36px** | 1018 → **879px** |
| 1280×650 | 639,25 → **591,31px** | 394 → **375px** | 20 → **36px** | 932 → **879px** |
| 1440×900 | 620 → **619px** | 375 → **375px** | 58 → **58px** | 879 → **879px** |
| 1920×1080 | 620 → **619px** | 375 → **375px** | 58 → **58px** | 1359 → **879px** |

Đối chiếu trước/sau: X/Y/width/height của **Header, Back, card ngoài và header card lệch 0px** ở cả bốn viewport. Chiều cao input và thẻ lịch sử cũng không đổi. A=B vẫn 16/24px; không tràn ngang hoặc phát sinh cuộn dọc trên desktop đã kiểm tra. [Bảng số đo](evidence/width/comparison.json), [Chủ](evidence/width/owner-after.json), [Nhân viên](evidence/width/staff-after.json).

Ảnh: [Trước 1366](evidence/width/before-1366x768.png) · [Sau 1366](evidence/width/owner-after-1366x768.png) · [Sau 1440](evidence/width/owner-after-1440x900.png) · [Sau 1920](evidence/width/owner-after-1920x1080.png).

## File và kiểm thử

- `src/index.css`: chỉ thay các selector `.customer-detail-card` cho input, hàng lịch sử và nhóm thao tác. Không sửa JSX, component danh sách hoặc nghiệp vụ trong lượt này.
- `tests/e2e/customer-detail-layout.spec.ts`: kiểm tra input bằng nhau/có giới hạn, tỷ lệ trong bố cục gọn, thẻ giới hạn/căn giữa và nút thao tác thẳng vùng form. Phép đo X bất đối xứng 33/38px của nguồn cũ được thay bằng yêu cầu **căn giữa** mới; giữ ngưỡng ≤2 CSS px và các assertion còn lại, không thay baseline.
- Tài liệu và evidence trong thư mục này.

Lint, typecheck, production build: **PASS**. `customer-detail-layout.spec.ts` và `reference-data.spec.ts`: **15 PASS / 0 FAIL / 0 SKIP**, 29,7s. Có tìm/tạo ở danh sách, hai vai trò, lịch sử, sửa/xóa, bảo vệ khách có giao dịch, lỗi ghi/retry, hai tab, dữ liệu chỉ xem không đổi và responsive xuống 320px.

Không chạy full suite/Visual G10 hoặc unit service không bị ảnh hưởng. Cảnh báo build Zod/bundle lớn đã có được giữ nguyên. Không tuyên bố pixel-perfect toàn màn hình hoặc thay đổi trạng thái nghiệm thu phase.
