# Cân bằng spacing Xử lý hàng tồn lâu — A = B

Cập nhật tiếp ngày 15/11/2026 theo yêu cầu lấy A hiện tại làm chuẩn. **Source chỉ sửa `src/index.css`**; dùng chung biến `--discount-monitor-gap` cho margin dưới header và margin trên hàng thẻ. Giá trị A giữ nguyên 24px hoặc 16px theo breakpoint, không dịch Header/nút Quay lại. Không thêm override chồng chéo hoặc điều chỉnh từng section bên dưới.

| Viewport | A trước → sau | B trước → sau | Nội dung dịch lên |
|---|---|---|---|
| 1440×900, 1920×1080 | 24 → 24px | 32 → 24px | 8px |
| 1366×768, 1280×650 | 16 → 16px | 32 → 16px | 16px |

Đo bằng `getBoundingClientRect()`, zoom 100%, DPR 1: **\|A − B\| = 0 CSS px** ở cả bốn viewport, đạt ngưỡng ≤2px. Header và toàn bộ bounding box nút Quay lại không thay đổi. Năm thẻ cùng hàng, cách ngang 12px; mọi article giữ nguyên X, chiều rộng, chiều cao, padding và cùng dịch lên đúng 8/16px. Khoảng cách giữa các section giữ nguyên. Không tràn ngang hoặc chồng lấn; Quay lại vẫn về `#/inventory`. Không thay đổi nghiệp vụ, dữ liệu hoặc scheduler.

[Ảnh trước](evidence/equal-gaps/before-1440.png) · [Ảnh sau](evidence/equal-gaps/after-1440.png) · [Số đo trước](evidence/equal-gaps/before.json) · [Số đo sau](evidence/equal-gaps/after.json).

Kiểm thử đã chạy cho bản cập nhật A=B:

- Lint, typecheck và production build: **PASS**. Cảnh báo annotation Zod/bundle lớn đã có được giữ nguyên.
- Chromium đo A/B và hình học, Quay lại, console, ảnh ba màn danh sách: **1 PASS / 0 FAIL / 0 SKIP**, 5.6s. Ảnh Hàng hóa/Bán hàng/Thu mua có SHA-256 [giữ nguyên](evidence/equal-gaps/list-hashes.json) so với lượt trước.
- Chromium `discount-scheduler.spec.ts`: **3 PASS / 0 FAIL / 0 SKIP**, 12.8s; cả hai vai trò đọc log thật, mốc 30/45, giờ Việt Nam, hai tab, rollback/recovery và reload.
- Không chạy full suite, không thay đổi assertion/baseline hay thêm test vào repository. Dùng evidence sau lần chỉnh liền trước làm mốc trước sửa; script đo và ảnh các viewport khác nằm trong `.git/coco-release-recovery/discount-spacing/equal-gaps/`.

Giữ nguyên các thay đổi chưa commit của task trước. Không commit/push/deploy và không thay đổi trạng thái nghiệm thu phase. Báo cáo và evidence A=B là bổ sung của lượt này; phần dưới là lịch sử lần chỉnh trước.

## Lịch sử — thu gọn spacing lần trước

15/11/2026. UI-only; giữ nguyên các thay đổi chưa commit của task trước. Nhánh `main`, HEAD `213815c`, sau fetch không phân kỳ với `origin/main`. Không commit/push/deploy.

**Source chỉnh sửa:** [src/index.css](../../../src/index.css). Component `DiscountMonitor.tsx` không cần sửa.

Nguyên nhân: margin dưới `.back-link` 20px cộng margin trên `.discount-summary` 24px thành khoảng trống 44px. Đã bỏ margin dưới riêng link của màn này, đổi link sang flex có chiều rộng theo nội dung để không thêm khoảng trống line-box, dùng một margin 32px trên hàng thẻ. Header chỉ được giảm margin khi workspace chứa trực tiếp `.discount-monitor`; không tác động các màn khác.

| Khoảng cách đo thực tế | Trước | Sau | Giảm |
|---|---|---|---|
| Header → Quay lại, viewport 1440/1920px | 32px | 24px | 8px |
| Header → Quay lại, viewport 1280/1366px | 24px | 16px | 8px |
| Quay lại → hàng 5 thẻ | 44px | 32px | 12px |
| Y hàng thẻ tại 1440×900 / 1920×1080 | 206px | 186px | **20px** |
| Y hàng thẻ tại 1366×768 / 1280×650 | 172px | 152px | **20px** |

Chính sách, Lịch xử lý, Lịch sử lượt chạy và Nhật ký thay đổi giá cùng dịch lên đúng 20px. Các article giữ nguyên X, chiều rộng, chiều cao, padding và khoảng cách ngang; gap giữa các section vẫn 12px. Không tràn ngang hoặc che/chồng nội dung ở bốn viewport đã đo. Không thay đổi dữ liệu, scheduler, quy tắc 30/45 ngày hay điều hướng.

Ảnh 1440×900, zoom 100%, DPR 1: [Trước](evidence/before-1440.png) · [Sau](evidence/after-1440.png). [Số đo trước](evidence/before.json) · [Số đo sau](evidence/after.json).

## Kiểm thử

- `npm.cmd run lint`: **PASS**.
- `npm.cmd run typecheck`: **PASS**; production build cuối cũng chạy `tsc --noEmit` thành công.
- `npm.cmd run build`: **PASS**; giữ nguyên cảnh báo annotation Zod và bundle >500 kB đã có, không chỉnh dependency/config.
- Chromium đo trước/sau: **1 PASS / 0 FAIL / 0 SKIP** ở bản cuối, bốn viewport, kiểm tra mọi article và nút Quay lại về `#/inventory`. SHA-256 ảnh ba danh sách tại 1440×900 [trước](evidence/before-list-hashes.json) và [sau](evidence/after-list-hashes.json) giống hệt nhau.
- Chromium hồi quy `discount-scheduler.spec.ts`, `sidebar-figma.spec.ts`, `list-frame-alignment.spec.ts`: **7 PASS / 0 FAIL / 0 SKIP**, 25.1s. Bao gồm cả hai vai trò, lịch tự động giờ Việt Nam, mốc 30/45, hai tab, rollback/recovery, log thật và các khung danh sách trước đó.
- Lượt đo candidate đầu chỉ dịch 14px nên **FAIL**. Đã sửa line-box của link tại source và chạy lại phép kiểm tra giữ nguyên yêu cầu 20px: **PASS**. Không sửa assertion hoặc baseline để che lỗi.
- Không chạy full suite hoặc bộ Visual G10 trong task spacing này. Không tạo/sửa test trong repository; script đo và ảnh các viewport khác lưu cục bộ trong `.git/coco-release-recovery/discount-spacing/`.

Thay đổi bàn giao chỉ gồm các rule CSS scoped cho màn này, báo cáo và evidence; các file khác đang modified/untracked là công việc trước và được giữ nguyên. Không thay đổi trạng thái nghiệm thu phase.
