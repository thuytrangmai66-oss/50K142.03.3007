# Chi tiết khách hàng — đối chiếu Figma

> Cập nhật tiếp 15/11/2026: đã thu gọn chiều rộng nội dung, căn giữa hai thẻ và căn nhóm Xóa/Sửa theo form. Xem [WIDTH_REVIEW.md](WIDTH_REVIEW.md). Các số đo/ảnh dưới đây là mốc trước đợt chỉnh chiều rộng này.

15/11/2026. Nhánh `main`, HEAD `213815c`, đã fetch origin và xác nhận không phân kỳ. Giữ nguyên các thay đổi chưa commit từ những task UI trước. Không commit/push/deploy, không đổi trạng thái nghiệm thu phase.

## Kết quả

- Bỏ riêng import và lời gọi `CustomerToolbar` trong `CustomerDetailPage`. Không dùng CSS ẩn và không để lại container. **`CustomerToolbar.tsx` và `CustomersPage.tsx` không có diff so với HEAD**; danh sách vẫn có tìm kiếm, xóa tìm kiếm và tạo khách hàng.
- Dùng chung token `--back-content-gap` với Xử lý hàng tồn lâu: **A=B=24px** ở viewport 1440/1920px và **A=B=16px** ở 1366/1280px. Font, icon 24×24 và khoảng cách icon–chữ Quay lại giống màn tham chiếu. Token được đổi tên từ `--discount-monitor-gap`, giữ nguyên giá trị và bố cục màn tồn lâu.
- Khung thông tin khớp kích thước PDF nguồn tại 1440×900; các cửa sổ thấp dùng mật độ gọn để hai nút Xóa/Sửa hiển thị đầy đủ. Thẻ lịch sử bằng nhau, có giới hạn chiều rộng và lề; giữ nguyên tên và route hai loại lịch sử.
- Hai nút Xóa/Sửa vốn đã có. Chỉ chỉnh vị trí/kích thước/màu ở thẻ chi tiết, không tạo logic mới. CSS được scope bằng `.customer-detail-card`, không lan vào modal sửa hoặc xác nhận xóa nằm ngoài thẻ.
- Điều chỉnh `scroll-margin-top` theo vùng Quay lại để cơ chế reveal trang chi tiết hiện có không cuộn mất nút Back. Không sửa logic routing/reload hay dùng zoom, transform, margin âm hoặc absolute để bố trí trang.

## Nguồn và thông số

Đọc `CODEX/Figma.Chủ/Xem thông tin Khách hàng.pdf` bằng PDF.js cục bộ ở tỷ lệ 1:1; lấy kích thước từ path vector và font từ text content, không nhân kích thước của hai ảnh có độ phân giải khác nhau. PDF/ảnh Figma nguồn giữ ngoài Git. [Metadata/hash nguồn](evidence/source-measurements.json).

Ở frame nguồn **1440×900**, khung có X=461, Y=178, **943×645px**, header **75px**, font tiêu đề/field **25px**, input fill **619×70px** (stroke outer 621×72px), thẻ lịch sử **375×165px**, font lịch sử **20px**, nút thao tác khoảng **255×48/49px**. Các số 50–56px/46–50px trong yêu cầu được ghi là tham khảo; không gọi chúng là số đo Figma.

Bản triển khai ở viewport gốc ưu tiên PDF: card/header/thẻ lịch sử trùng kích thước; input outer CSS 70px chênh 2px so với outer stroke PDF. Footer cao 49px, chênh 1px ở nút Xóa. Các phép đo hình học được đối chiếu với ngưỡng ≤2 CSS px, không thay ngưỡng/baseline G10.

Khi chiều cao ≤850px hoặc chiều rộng ≤1100px: header card **54px**, label **18px**, input **48px**, thẻ lịch sử cao **112px**, nút thao tác **40px**; chiều cao ≤700px giảm padding body thêm. Không tăng/giảm kích thước Header hoặc Sidebar toàn hệ thống.

## Trước / sau đo bằng Chromium

Zoom 100%, DPR 1, dữ liệu do UI tạo trong browser context kiểm thử. Mốc trước chụp ở đầu vùng main (`scrollTop=0`) để thấy toolbar dư; sau mở trang tự nhiên, không ép scroll, vẫn `scrollTop=0`.

| Viewport | A trước → sau | B trước → sau | Y card trước → sau | Cao card trước → sau | Đáy nút thao tác trước → sau |
|---|---|---|---|---|---|
| 1366×768 | 146 → 16 | 20 → 16 | 270 → 136 | 449,5 → 406 | 699,5 → 522 |
| 1440×900 | 154 → 24 | 20 → 24 | 304 → 178 | 541,5 → 645 | 817,5 → 764 |
| 1920×1080 | 154 → 24 | 20 → 24 | 304 → 178 | 541,5 → 645 | 817,5 → 764 |
| 1280×650 | 146 → 16 | 20 → 16 | 270 → 136 | 449,5 → 398 | 699,5 → 518 |

Ở viewport gốc, card cao hơn bản cũ vì ưu tiên số đo PDF, nhưng sau khi bỏ toolbar, card được đưa lên 126px và nút thao tác nằm cao hơn 53,5px. Ở cửa sổ thấp, card cũng được thu gọn. Không mô tả sai rằng mọi kích thước đều giảm.

Ở cả bốn viewport: **|A−B|=0px**, Back và Xóa/Sửa hiển thị toàn bộ; hai thẻ lịch sử cùng hàng, bằng nhau; main không cần cuộn dọc, trang không tràn ngang. [Trước](evidence/before.json) · [Chủ sau](evidence/owner-geometry.json) · [Nhân viên sau](evidence/staff-geometry.json).

Ảnh: [Trước 1440](evidence/before-1440.png) · [Chủ 1440](evidence/owner-detail-1440x900.png) · [Nhân viên 1440](evidence/staff-detail-1440x900.png) · [Chủ 1366](evidence/owner-detail-1366x768.png) · [Chủ 1280×650](evidence/owner-detail-1280x650.png).

## File thay đổi trong task

1. `src/features/customers/CustomerDetailPage.tsx`: bỏ toolbar riêng ở detail, thêm class root/card để scope layout. Giữ nguyên dữ liệu, readonly, route, callback sửa/xóa, busy và version.
2. `src/index.css`: token spacing dùng chung với màn tồn lâu; style thẻ chi tiết và mật độ gọn. Không đổi CSS danh sách, Sidebar/logo hoặc style modal.
3. `tests/e2e/reference-data.spec.ts`: thêm kiểm tra detail không có tìm/tạo và quay về danh sách trước bước tìm kiếm cũ. Giữ nguyên toàn bộ assertion chức năng; cập nhật luồng test theo yêu cầu mới.
4. `tests/e2e/customer-detail-layout.spec.ts`: hai vai trò, bốn viewport, hình học PDF và A/B, bảo toàn tìm/tạo tại danh sách, hai lịch sử, readonly, kiểm tra toàn DB không đổi khi chỉ xem/đóng form chưa lưu, console và screenshot.
5. Báo cáo và evidence trong thư mục này. [Hash đầu vào](evidence/input-hashes.json).

## Kiểm thử thực thi

| Phạm vi | Kết quả |
|---|---|
| `npm.cmd run lint` | **PASS** |
| `npm.cmd run typecheck` | **PASS** |
| `npm.cmd run build` | **PASS**; cảnh báo annotation Zod/bundle lớn đã có, không sửa dependency/config |
| `customer-detail-layout.spec.ts` bản cuối | **2 PASS / 0 FAIL / 0 SKIP**, 7,1s; cả hai vai trò, bốn viewport, hình học quan trọng ≤2px; màn tồn lâu vẫn A=B |
| `reference-data.spec.ts`, `phase10-customer-edit.spec.ts` | **15 PASS / 0 FAIL / 0 SKIP**, 27,9s; tìm/tạo, lịch sử thật, sửa, xóa/khách có lịch sử không được xóa, validation/trùng, lỗi ghi/retry, hai tab và responsive |
| Full suite, pixel regression G10, thiết bị thật | **NOT RUN** trong task UI này |

**Tổng mới: 17 Chromium case liên quan PASS.** Unit/integration service không chạy lại vì không đổi code nghiệp vụ/dependency; không ghi evidence cũ thành lần chạy mới. Không sửa schema, marker ngày tạo khách M01-B, điểm/membership, quyết định G9/G10 hoặc dữ liệu người dùng.

## Giới hạn đối chiếu

Đã kiểm cấu trúc, typography và các geometry quan trọng của đúng màn hình yêu cầu. Không chứng nhận pixel-perfect toàn SC086 hoặc toàn bộ G10. Nút Quay lại theo chuẩn màn tồn lâu đã được người dùng yêu cầu; icon/history dùng các icon hiện có, bố cục Sidebar/Header đã được chỉnh ở task trước giữ nguyên. Không mở lại baseline SC105/8 popup hoặc các sai lệch nhỏ ngoài phạm vi. Không còn blocker phát hiện trong các luồng đã kiểm tra.
