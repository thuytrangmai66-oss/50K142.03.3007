# G10 — Cổng nguồn visual cho CI

Ngày 14/11/2026. **APPROVED_USER tại G10-D05:** “Duyệt riêng baseline SC105 và metadata”. Đã chuẩn bị đúng hai file dưới `tests/visual/references/`; chưa commit/push phase. Không thay workflow hoặc bỏ test visual. CI/Linux thực thi vẫn NOT RUN, tách khỏi phê duyệt nội dung asset.

Baseline đã chuẩn bị: `SC105-picker.png`, 913×396, 16.447 byte, SHA-256 `c54fc0b16abee3a0336449de3ea3deca0f0906a5bbbe4ddc2382fc2271fa634f`, cùng `SC105-picker.json`. Test không còn đọc CODEX, kiểm hash/geometry/threshold của asset trước đối chiếu. Focused Windows sau sửa **1/1 visual PASS** trong bộ 8/8; không suy ra Linux PASS.

## Vấn đề trước G10-D05 — đã xử lý nguồn test

Workflow hiện có checkout repo → cài dependency → lint/typecheck/test/build → full Chromium. Test SC105 mới đang đọc `../CODEX/Figma.Chủ/Màn hình Báo cáo 1.png`; CODEX không được Git theo dõi. Bản checkout sạch trên CI sẽ thiếu nguồn này. Đây là kiểm tra đường dẫn/cấu hình, chưa phải kết quả chạy GitHub Actions cho G10.

Không giải quyết bằng `test.skip`, grep-invert, giảm ngưỡng hoặc lấy ảnh runtime làm baseline. Không tự đưa cả CODEX lên GitHub.

## Phương án đã được duyệt — giữ đề xuất gốc để đối chiếu

Chỉ version hóa **một ảnh cắt SC105 report picker**, năm thẻ báo cáo với chữ/icon tĩnh, không có thông tin khách/nhân viên hoặc sidebar:

- Ảnh đã chuẩn bị tại `CoCo/tests/e2e/phase10-visual.spec.ts-snapshots/SC105-picker-chromium-win32.png` (hiện bị ignore, chưa stage), kích thước **913×396**, khoảng **16,4 KB**.
- Nguồn 1440×900, crop x476/y198/w913/h396; source SHA-256 `114c0f7d92f587e8518008590673f9892bb80b8229746ab1ae4d291f71b0b72d`.
- Đích dự kiến sau duyệt: `CoCo/tests/visual/references/SC105-picker.png` và metadata cùng thư mục ghi source hash/crop/DPR/threshold và hash baseline.
- Test đọc ảnh nguồn cắt đã duyệt, kiểm hash rồi so sánh runtime; không tự cập nhật file này. Nếu nguồn CODEX còn ở máy local có thể xác minh thêm, nhưng CI không phụ thuộc đường dẫn riêng của máy.
- Giữ nguyên ngưỡng đã duyệt; không sửa workflow. Khả năng render/font trên Linux vẫn cần thực thi thật, không suy ra PASS từ Windows.
- Phê duyệt này chỉ áp dụng asset SC105 nói trên; không tự mở rộng thành quyền công khai toàn bộ 297 ảnh/PDF hoặc CODEX.

## Lý do cần xác nhận

[AGENTS.md](../../../AGENTS.md), mục cuối phase, yêu cầu loại **“tài liệu nguồn riêng trong `CODEX/` nếu chưa có chỉ đạo đưa chúng lên GitHub”**. Ảnh cắt vẫn chứa pixel từ nguồn, nên cần duyệt riêng phạm vi asset trước khi chuẩn bị đưa vào commit. Quyền commit/push theo phase đã có; câu hỏi này chỉ về nội dung nguồn thiết kế được phép version hóa.

Không có thay đổi nghiệp vụ, UI, schema hoặc quyền repository trong phương án này. Quyền version hóa đúng hai file đã được chốt; những ảnh/PDF khác tiếp tục ngoài Git. Việc thực thi CI đúng SHA được kiểm riêng khi đủ gate tích hợp phase.
