# Phân bố dọc theo tỷ lệ ảnh tham chiếu mới

> Đã được thay thế bởi yêu cầu mới: nhóm C ở dưới, cách đáy 20–32px. Bản hiện tại đo được 24px ở ba desktop chuẩn; xem [ACTIONS_BOTTOM_REVIEW.md](ACTIONS_BOTTOM_REVIEW.md). Nội dung Grid bên dưới là lịch sử.

15/11/2026. Tiếp tục yêu cầu người dùng “phân bố theo chiều dọc vẫn chưa giống hình 2”, đồng thời với lượt sửa toolbar lịch sử. Bản trước chỉ sửa khoảng cách pixel cố định nên còn dồn nội dung lên trên khi khung cao hơn nguồn. Không thay chiều cao/chiều rộng khung, Sidebar, Header, Back hoặc kích thước input/nút.

## Sửa thực tế

- Body chuyển từ cột Flexbox với khoảng cách cố định sang Grid ba vùng **42fr / 35fr / 23fr**: thông tin, lịch sử, thao tác.
- Vùng thông tin có hai hàng đều nhau, input/label căn giữa từng hàng. Các vùng lịch sử/thao tác căn giữa theo chiều dọc, không kéo giãn nút.
- Tâm bốn hàng lần lượt khoảng **10,5% / 31,5% / 59,5% / 88,5%** chiều cao thân trắng. Đây là tỷ lệ triển khai được làm tròn từ ảnh 2 mới người dùng gửi, **không phải thuộc tính Figma được đọc từ API hoặc thông số vector đã xác minh**. Không áp tọa độ pixel từ ảnh nhỏ lên viewport lớn.
- Bỏ padding dọc và margin/padding cố định giữa các nhóm để không cộng dồn khoảng trắng. Giữ lề ngang, font, màu, icon, max-width và chiều cao control đã hoàn thiện.
- Không dùng space-between, auto-margin dọc, absolute, zoom/transform hay margin âm. Grid sử dụng min-content để cửa sổ thấp vẫn có thể cuộn tới các nút.

## Đối chiếu sau sửa

Chủ và Nhân viên, DPR 1, zoom 100%; rect của khung/Header/Sidebar/Back và kích thước/tọa độ X của input, thẻ lịch sử, nút thao tác không đổi ở cả bốn viewport. [So sánh trước/sau](evidence/vertical-distribution/comparison.json).

| Viewport | Cao khung giữ nguyên | Input 2: Y trước → sau | Lịch sử: Y trước → sau | Xóa/Sửa: Y trước → sau |
|---|---:|---:|---:|---:|
| 1366×768 | 616px | 278 → 343,02 | 350 → 468,38 | 482 → 667,36 |
| 1440×900 | 706px | 395 → 416,75 | 510 → 545,94 | 715 → 786,92 |
| 1920×1080 | 886px | 395 → 473,45 | 510 → 653,03 | 715 → 946,22 |
| 1280×650 | 498px | 274 → 305,84 | 346 → 398,17 | 478 → 562,94 |

Các nhóm được phân bổ theo chiều cao khung thay vì giữ nguyên Y khi viewport thay đổi. Khoảng trắng không tập trung sau nút Xóa/Sửa như bản trước, cũng không hút hết vào riêng khoảng lịch sử → thao tác.

## Kiểm thử và ảnh

`customer-detail-layout.spec.ts` giữ các kiểm tra kích thước/quyền/dữ liệu và mục tiêu đáy khung ≤8px; thay các Y/gap cố định cũ bằng kiểm tra tâm theo bố cục mới, vẫn dùng ngưỡng ≤2 CSS px. Không thay baseline/ngưỡng Visual G10.

Hai bài Chủ/Nhân viên PASS trong regression; kiểm tra thêm 1366×500 (cuộn tới đáy khung, nút hiển thị 100%) và 390×844 (không tràn ngang, thao tác được). Lượt kiểm tra đầu dừng ở mép cuộn phân số làm tỷ lệ thấy nút 99,53%; thao tác kiểm thử đã đổi sang cuộn hết đáy khung, giữ assertion 100%, không sửa CSS cho sai lệch dưới pixel. Kiểm thử chức năng và tổng kết nằm ở [báo cáo lịch sử](../customer-history/REVIEW.md).

- 1280×650: [trước](evidence/content-spacing/owner-detail-1280x650.png) · [sau](evidence/vertical-distribution/owner-detail-1280x650.png).
- 1440×900: [trước](evidence/content-spacing/owner-detail-1440x900.png) · [sau](evidence/vertical-distribution/owner-detail-1440x900.png).
- [Sau 1366×768](evidence/vertical-distribution/owner-detail-1366x768.png) · [Sau 1920×1080](evidence/vertical-distribution/owner-detail-1920x1080.png).
- [Geometry Chủ](evidence/vertical-distribution/owner-after.json) · [Geometry Nhân viên](evidence/vertical-distribution/staff-after.json).

Chỉ đổi CSS `.customer-detail-card` và test layout tương ứng; không đổi JSX hoặc service khách hàng. Không commit/push/deploy, không tự nghiệm thu phase hoặc tuyên bố pixel-perfect toàn màn hình.
