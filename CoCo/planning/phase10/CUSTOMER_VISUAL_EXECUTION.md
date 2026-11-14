# G10-T03 — Đối chiếu popup xóa khách hàng

Ngày 14/11/2026. **IMPLEMENTED / PENDING REVIEW**. Chưa đủ gate toàn G10 để chuyển G11.

## Phạm vi và nguồn

Đã đọc tám export PDF sạch trong CODEX: Chủ SC101–104 và Nhân viên SC294–297. Chỉ kiểm vùng popup xác nhận, chặn xóa có lịch sử, thành công và lỗi lưu; **không phải chứng nhận toàn màn hình SC**. Hash PDF/raster và clip nằm trong từng `*-measurement.json`. Không đọc Figma online, không dùng screenshot runtime làm baseline, không công khai PDF/ảnh kỳ vọng hoặc diff có chứa pixel nguồn. Quyền version hóa baseline SC105 không mở rộng sang tám ảnh này.

Ngưỡng giữ nguyên G10-D02: DPR 1, viewport 1440×900, geometry ≤2 CSS px, threshold 0,2 và maxDiffPixelRatio 0,01, không mask. Khung nguồn xác nhận x481/y302/477×297; khung kết quả x481/y319/477×263. PDF text xác nhận cỡ chữ 25, khoảng dòng 32; giữ nguyên toàn bộ thông điệp.

## Sửa lỗi và kết quả

| Lượt chạy | Geometry | Pixel | Ghi chú |
|---|---|---|---|
| Trước sửa | FAIL | 8 FAIL | Chiều rộng/khoảng cách/khung thông báo chưa khớp |
| after1 / after2 | 8 PASS | 8 FAIL | Đã đúng khung, còn sai vị trí nội dung và raster viền/chữ |
| after3 | 8 PASS | 8 FAIL | PDF xác định vị trí chữ/nút; còn mờ do transform trên toàn dialog |
| **after4** | **8 PASS** | **8 PASS** | 19,639 giây; 0 FAIL/SKIP/FLAKY; ảnh nguồn/ngưỡng không đổi |

Nguyên nhân cuối: translate nửa pixel trên toàn dialog tạo lớp compositing làm mờ viền/chữ dù bounding box đúng. Dùng inset layout để căn khung nguyên pixel, sửa khoảng cách, vị trí nút và ngắt dòng theo PDF. Chỉ áp class riêng cho luồng xóa khách hàng; popup nhân viên/module khác giữ thiết kế riêng.

Mỗi ca thao tác qua UI thật trong browser context tách biệt: đăng nhập đúng role, tạo/chọn khách, mở xác nhận; trường hợp có lịch sử dùng luồng tạo hàng thật. Lỗi lưu được inject một lần vào IndexedDB của profile test. Assertion sau visual đã thực thi: hủy/không cho xóa/lỗi giữ nguyên mọi store; thành công chỉ xóa khách được chọn; 0 pageerror/console error. Không thay service, transaction, schema, mapping legacy hoặc dữ liệu người dùng.

[Execution 8 ca](evidence/customer-visual/after/execution.json). Mỗi thư mục ca có ảnh runtime `*-actual.png`, measurement và kết quả nghiệp vụ `*-behavior.json`. Bằng chứng này tách kết quả visual khỏi kết quả nghiệp vụ, không dùng nghiệp vụ PASS để che visual FAIL.

## File liên quan

- `src/index.css`: style riêng theo khung/spacing/icon/typography nguồn, giữ giới hạn viewport.
- `src/components/ui/ConfirmDialog.tsx`, `ResultDialog.tsx`: nhận className tùy chọn; không đổi xử lý xác nhận/đóng.
- `src/features/customers/CustomerDetailPage.tsx`: class riêng theo kết quả HAS_HISTORY đã có, thông điệp và chức năng giữ nguyên.
- `tests/e2e/confirmation.spec.ts`: kỳ vọng khung khách hàng 477px theo nguồn; nhân viên vẫn 480px. Không nới assertion.
- Full đầu sau sửa có 162 PASS/2 FAIL: test cũ giả định cụm nút centered, khác source SC101/294. PDF/crop xác định hai nút x567..712 và x747..892 trong frame x481..958, tâm cụm lệch phải đúng 10px. Sửa oracle theo nguồn, đo control thật thay vì khung actions, **giữ dung sai 1px** và scale compact đang có; không bỏ assertion, đổi ảnh nguồn hoặc nới pixel threshold. Đây là điều chỉnh kỳ vọng theo thiết kế, không biến lượt full lỗi thành PASS.
- Hai test UI mới tái hiện lỗi class xóa lan sang notice sửa khách hàng (2 FAIL trước sửa). Đã thêm cờ luồng deletion để class riêng chỉ áp khi xóa; thông báo sửa giữ style cũ. Sau sửa, nhóm confirmation + sửa khách hàng **8/8 PASS** (28,1 giây).
- `tests/visual/customer-dialogs.local.spec.ts`, `playwright.visual.config.ts`: tám ca local phụ thuộc nguồn riêng; hash nguồn bắt buộc, thiếu nguồn báo lỗi, không skip.
- `package.json`, `tsconfig.json`, `.gitignore`: script/config local và loại cache ảnh nguồn khỏi Git. Không thay workflow hoặc đưa nguồn riêng vào CI.

## Regression và giới hạn

Lượt cuối sau giới hạn class: **514/514 unit, 166/166 Chromium, 8/8 local visual PASS**, 0 FAIL/SKIP; 191 file guard không đổi. [Execution cuối](CONTINUATION_EXECUTION.md). Mốc 501/164 trước chỉnh popup chỉ là lịch sử.

G10-T03 còn các SC khác chưa được kiểm đầy đủ; 8 modal và component SC105 đạt không đồng nghĩa 9/297 màn hình đầy đủ đã đạt. Các blocker quyết định/UI/NFR ở [ACCEPTANCE_GAPS.md](ACCEPTANCE_GAPS.md) vẫn có hiệu lực; không tự nghiệm thu G10/G11 hoặc commit/push khi chưa qua gate.
