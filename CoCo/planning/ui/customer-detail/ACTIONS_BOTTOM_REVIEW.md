# Nhóm Xóa/Sửa ở đáy thân trắng — yêu cầu mới

15/11/2026. UI-only theo chỉ đạo mới: A/B ở trên, C ở dưới, cách đáy 20–32px; khoảng trắng chủ yếu nằm giữa B và C. Yêu cầu này thay thế bố cục Grid theo tỷ lệ trong báo cáo trước. Nhánh `main`, HEAD/origin `213815c0e303c94b0467334768edaba6d67f19f3`, không phân kỳ; giữ nguyên các thay đổi local khác. Không commit/push/deploy.

## Nguyên nhân và sửa đúng container

Trước sửa, body đã sử dụng chiều cao còn lại của card nhưng Grid `42fr 35fr 23fr` căn nhóm C ở giữa vùng cuối. Vì thế khoảng C → đáy tăng theo chiều cao viewport: 44,64px / 48,08px / 68,78px, vượt yêu cầu mới 20–32px tại ba desktop chuẩn. Bản dùng khoảng cách cố định trước đó lại để phần dư sau C. Cả hai cách đó được thay bằng bố cục hiện tại:

- `.customer-detail-card > .record-body`: cột Flexbox, `flex: 1 0 auto`, padding đáy **24px**. Không dùng `height: 100%` với cha không xác định chiều cao.
- Form và lịch sử giữ kích thước tự nhiên, không co/giãn control. Khoảng giữa hai hàng thông tin và từ A đến B dùng các giá trị hiện có của bố cục desktop/gọn.
- `.form-actions`: `margin: auto auto 0`, không có padding trên; chỉ nhóm C nhận khoảng trống dư. Margin dưới của B bảo đảm khoảng tối thiểu trước C (40px desktop, 20px gọn).
- Card vẫn nhận chiều cao từ layout workspace hiện có; không tăng min-height ngoài, không đổi Sidebar/Header/Back, kích thước khung hay kích thước input/nút. Không dùng absolute, transform/zoom hoặc margin âm.

Component vẫn là `CustomerDetailPage.tsx`, với ba nhóm con hiện hữu trong `.record-body`; **không đổi JSX hoặc handler**. File code sửa trong lượt này: `src/index.css`, `tests/e2e/customer-detail-layout.spec.ts`. Có thêm báo cáo, ảnh và số đo tại `evidence/actions-bottom/`.

## Đo trực tiếp trên Chromium

Đo bằng `getBoundingClientRect()`, zoom 100%, DPR 1. `actionsTop/actionsBottom` là rect thật của `.form-actions`, không cộng khoảng padding giả vào nhóm. Chủ và Nhân viên cho cùng kết quả:

| Viewport | cardTop / cardBottom | bodyTop / bodyBottom | historyBottom | actionsTop / actionsBottom | B → C | C → đáy |
|---|---:|---:|---:|---:|---:|---:|
| 1366×768 | 136 / 752 | 190 / 752 | 462 | 688 / 728 | 226 | **24px** |
| 1440×900 | 178 / 884 | 253 / 884 | 675 | 811 / 860 | 136 | **24px** |
| 1920×1080 | 178 / 1064 | 253 / 1064 | 675 | 991 / 1040 | 316 | **24px** |
| 1280×650 | 136 / 634 | 190 / 634 | 462 | 570 / 610 | 108 | **24px** |

Thân trắng thực sự cao **562 / 631 / 811px** ở ba desktop chuẩn và kết thúc đúng đáy card. Nhóm C nằm trong phần cuối thân trắng, khoảng dư ở B → C lớn hơn rõ rệt khoảng đáy 24px. Không còn vùng dư lớn sau C.

| Viewport | C trước: top / bottom | C sau: top / bottom | Khoảng đáy trước → sau |
|---|---:|---:|---:|
| 1366×768 | 667,36 / 707,36 | 688 / 728 | 44,64 → **24px** |
| 1440×900 | 786,92 / 835,92 | 811 / 860 | 48,08 → **24px** |
| 1920×1080 | 946,22 / 995,22 | 991 / 1040 | 68,78 → **24px** |

Rect khung/Header/Sidebar/Back và kích thước input, lịch sử, Xóa/Sửa được đối chiếu trước/sau, đều giữ nguyên ở bốn viewport trên. Không tràn ngang hoặc phát sinh cuộn dọc trong main ở các viewport này. [So sánh đầy đủ](evidence/actions-bottom/comparison.json), [Chủ sau](evidence/actions-bottom/owner-after.json), [Nhân viên sau](evidence/actions-bottom/staff-after.json).

## Xác minh trực quan và chức năng

Đã mở và kiểm tra ảnh thực tế cả ba desktop chuẩn: hai nút Xóa/Sửa cùng hàng, ở phần dưới khung; khoảng trắng tăng thêm nằm giữa lịch sử và nút thao tác. Ảnh dùng profile kiểm thử riêng, không sửa dữ liệu trình duyệt người dùng:

- 1366×768: [trước](evidence/actions-bottom/owner-before-1366x768.png) · [sau](evidence/actions-bottom/owner-detail-1366x768.png).
- 1440×900: [trước](evidence/actions-bottom/owner-before-1440x900.png) · [sau](evidence/actions-bottom/owner-detail-1440x900.png).
- 1920×1080: [trước](evidence/actions-bottom/owner-before-1920x1080.png) · [sau](evidence/actions-bottom/owner-detail-1920x1080.png).
- [Nhân viên 1440×900](evidence/actions-bottom/staff-detail-1440x900.png) · [cửa sổ thấp 1366×500](evidence/actions-bottom/owner-detail-low-1366x500.png).

Lint, typecheck, production build: **PASS**. Build 4,98s; giữ nguyên cảnh báo annotation Zod và bundle lớn hiện có.

`npm.cmd run test:e2e -- tests/e2e/customer-detail-layout.spec.ts tests/e2e/customer-history-layout.spec.ts tests/e2e/reference-data.spec.ts --workers=1 --reporter=list --output=test-results/customer-actions-bottom`: **17 PASS / 0 FAIL / 0 SKIP**, 36,1s.

Kiểm tra mới ràng buộc chính xác `bodyBottom - actionsBottom = 24px` (nằm trong 20–32px), C ở phần cuối body, kích thước control không đổi, thứ tự A/B/C không chồng lấn. Các assertion tỷ lệ Grid cũ được thay theo yêu cầu bố cục mới; không đổi ngưỡng hoặc baseline Visual G10.

Đã kiểm tra Xóa/Sửa, lịch sử mua/bán, Back, tìm/tạo ở danh sách, hai vai trò/hai tab, lỗi ghi/retry, phân trang và dữ liệu chỉ xem không đổi. Lịch sử vẫn không có toolbar; danh sách vẫn có tìm kiếm/tạo tài khoản. Cửa sổ thấp có thể cuộn đến nút đầy đủ; 390×844 không tràn ngang. Không có console/pageerror trong bài layout.

Không chạy lại full suite, unit nghiệp vụ hoặc Visual G10 vì chỉ thay CSS có phạm vi và bài UI tương ứng. Không thay dữ liệu, service, schema, route, quyền hoặc trạng thái nghiệm thu phase. Không có blocker được phát hiện trong phạm vi này. Bản sửa và ảnh kiểm chứng là bản local, chưa được đưa lên GitHub Pages.
