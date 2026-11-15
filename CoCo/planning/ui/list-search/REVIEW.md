# Thanh tìm kiếm Phê duyệt / Danh sách khách hàng

Ngày 15/11/2026. Phạm vi UI-only; không commit, push hoặc deploy. Git `main`, HEAD và `origin/main` cùng `213815c0e303c94b0467334768edaba6d67f19f3` khi bắt đầu. Giữ nguyên các thay đổi UI chưa commit từ những công việc trước.

## Nguồn đối chiếu và nguyên nhân

- CODEX local: `Figma.Chủ/Quản lý Phê duyệt 1.pdf`, SC130, 1440×900; SHA-256 `CE88C3EFB266E686B5DEBE9DF5AFD30DA54676E55E5AFC16675ACA2E7743221D`. Không sao chép PDF/ảnh nguồn vào tài liệu Git.
- Đo vector PDF: ô tên 706×45, ô ngày 221×45, font 20px; Header → bộ lọc 36px, bộ lọc → bảng khoảng 30px. Các số 15–17px và 20–24px trong yêu cầu là tham khảo, nên ưu tiên số đo nguồn.
- CSS cũ cộng padding dọc của `.search-field` (12px mỗi phía) và input (8px mỗi phía), tạo ô tên cao 70px. Ô ngày có padding riêng, cao 64px. Margin header và toolbar cộng thành 52px ở desktop lớn, 44px tại 1366px.
- Phê duyệt và Khách hàng dùng markup khác nhau nhưng cùng `.search-field`. `CustomerToolbar` còn được dùng ở trang lịch sử; vì vậy chỉ thêm class `customers-list`, dùng token/selector giới hạn trong hai danh sách, giữ nguyên component và handler.

## Thay đổi

- Hai ô Phê duyệt dùng Grid: `minmax(0, 1fr) 221px`, gap 16px; cùng cao 45px. Khi viewport ≤850px, xuống hai hàng.
- Ba ô tìm kiếm dùng chung token: padding ngang 20px, icon 20px, gap icon/chữ 16px, pill 9999px, nền trắng, placeholder `#AEAEB2`, font 20px/400 (16px khi ≤600px).
- Bỏ padding dọc lồng nhau trong đúng phạm vi; icon/text căn giữa. Ngày gửi vẫn dùng input date và bộ chọn ngày hiện có.
- Riêng Phê duyệt: Header → toolbar 36px; toolbar → bảng 30px. Khách hàng giữ margin toolbar/nút Tạo tài khoản hiện có; hàng toolbar cao 48px vì nút này, ô tìm kiếm cao 45px và được căn giữa.
- Không thay đổi service, schema, dữ liệu, filter, pagination, quyền hoặc luồng duyệt/từ chối. Trang Chi tiết khách hàng không có toolbar tìm kiếm/Tạo tài khoản.

## Số đo trước / sau

Chromium, zoom 100%, DPR 1. Kích thước dưới đây là CSS px, viewport 1440×900:

| Hạng mục | Trước | Sau |
|---|---:|---:|
| Ô tên nhân viên (rộng × cao) | 707 × 70 | 706 × 45 |
| Ô Ngày gửi (rộng × cao) | 220 × 64 | 221 × 45 |
| Ô tìm khách hàng (rộng × cao) | 727,33 × 70 | 727,33 × 45 |
| Phê duyệt: Header → toolbar | 52 | 36 |
| Phê duyệt: toolbar → bảng | 32 | 30 |
| Phê duyệt: vị trí đầu bảng Y | 260 | 217 |
| Khách hàng: Header → toolbar | 52 | 52 |
| Khách hàng: toolbar → bảng | 32 | 32 |
| Khách hàng: vị trí đầu bảng Y | 260 | 238 |

Tại 1366×768, bảng Phê duyệt lên 35px (Header → toolbar 44→36px). Tại 1440×900 và 1920×1080 lên 43px. Bảng Khách hàng lên 22px ở cả ba viewport do hàng tìm kiếm thu gọn. Ô ngày giữ rộng 221px, ô tên co giãn theo phần không gian còn lại. Số đo đầy đủ: [trước](evidence/before-geometry.json), [Chủ sau](evidence/after-owner-geometry.json), [Nhân viên sau](evidence/after-staff-geometry.json).

## Kiểm thử thực thi

| Lệnh / phạm vi | Kết quả |
|---|---|
| `npm.cmd run lint` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS; giữ nguyên cảnh báo annotation Zod và bundle >500KB hiện có |
| `npm.cmd test -- tests/unit/purchase-approvals.test.ts tests/unit/reference-data.test.ts --maxWorkers=1` | 70 PASS, 0 FAIL; 55,43s |
| Chromium: `purchase-approvals.spec.ts`, `reference-data.spec.ts`, `customer-detail-layout.spec.ts` | 26 PASS, 0 FAIL; 1,4 phút |
| Chromium: `list-search-layout.spec.ts` | 2 PASS, 0 FAIL; 6,3s |

Các lần chạy nêu trên không skip test. Chỉ chạy phạm vi liên quan, không chạy full suite hoặc visual regression G10. Không đổi baseline/ngưỡng visual; không tuyên bố toàn bộ SC130 đạt pixel-perfect.

Đã kiểm tra: tên/ngày riêng và kết hợp, không có kết quả, xóa điều kiện, phân trang sau lọc và reset trang 1, reload, bộ chọn ngày native, tìm khách hàng, tạo/sửa/xóa và lịch sử, hai vai trò, hai tab độc lập/cập nhật trực tiếp, cạnh tranh duyệt/từ chối và rollback. Màn hình chỉ xem/đổi viewport không phát sinh ghi dữ liệu; không có lỗi console/pageerror trong bài layout.

Layout hai danh sách được kiểm tra tại 1366×768, 1440×900, 1920×1080, 768×1024, 390×844 và 320×640: control cùng cao, placeholder tên không bị cắt, không tràn ngang; trang chi tiết vẫn không có tìm kiếm/Tạo tài khoản. Bảng vẫn giữ bốn cột và pagination thật.

## Ảnh và giới hạn đối chiếu

- Phê duyệt: [trước](evidence/before-approvals-1440x900.png), [sau](evidence/after-owner-approvals-1440x900.png), [ngày đã chọn](evidence/after-approvals-filled-date-1440x900.png).
- Khách hàng: [trước](evidence/before-customers-1440x900.png), [sau — Chủ](evidence/after-owner-customers-1440x900.png), [sau — Nhân viên](evidence/after-staff-customers-1440x900.png).
- Có thêm ảnh desktop 1366×768 và 1920×1080 trong `evidence/`. Ảnh dùng profile kiểm thử riêng, không thay dữ liệu ứng dụng của người dùng bằng số liệu Figma.
- Tại viewport nguồn, tọa độ và kích thước chính của bộ lọc/bảng được kiểm tra với sai số ≤2px. Gap hai ô 16px so với nguồn khoảng 15px, đầu bảng Y217 so với nguồn Y218; không ảnh hưởng thao tác. Khoảng icon/chữ được thống nhất 16px theo yêu cầu đồng bộ; PDF gốc có khoảng này không đồng nhất giữa ô tên và ngày. Giữ bảng, sidebar và header ngoài phạm vi; không coi chúng là đã được kiểm chứng đầy đủ bằng đợt sửa này.

## File thuộc lần sửa này

- `src/features/customers/CustomersPage.tsx`: class giới hạn style cho danh sách.
- `src/index.css`: token và CSS giới hạn hai danh sách; Grid/spacing Phê duyệt.
- `tests/e2e/list-search-layout.spec.ts`: kiểm tra hai vai trò, geometry, responsive, date, tính nhất quán và bảo toàn dữ liệu.
- `tests/e2e/purchase-approvals.spec.ts`: mở rộng test phân trang hiện có để kiểm tra lọc kết hợp, reset/reload; giữ nguyên assertion cũ.
- Báo cáo này và ảnh/số đo trong `evidence/`.

Không có blocker được phát hiện trong phạm vi sửa. Các thay đổi UI cũ và tồn đọng G10/G11 giữ nguyên trạng thái; không tự nghiệm thu phase.
