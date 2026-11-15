# Nút đóng popup Yêu cầu thu mua

15/11/2026. UI và thao tác đóng modal; không thay đổi nghiệp vụ thu mua. Các chỉnh sửa local không liên quan được giữ nguyên.

## Triển khai

- Dùng nút đóng sẵn của `FormDialog`, icon `X` từ `lucide-react`, và handler hiện có quay về `#/approvals`.
- Bổ sung nhãn `aria-label="Đóng yêu cầu thu mua"`; các FormDialog khác vẫn giữ nhãn mặc định và hành vi cũ.
- CSS chỉ scope tới popup `.approval-request`: vùng bấm 40×40px, icon 24×24px màu đen, cách mép phải 16px và căn giữa theo header. Nút đặt ngoài flow nên tiêu đề vẫn căn giữa, không đổi chiều cao header.
- Giữ nguyên Escape, backdrop, nội dung, phân quyền và quyết định duyệt/từ chối. Khi chỉ đóng, không phát sinh ghi dữ liệu.

## Kiểm chứng

Chromium zoom 100%, DPR 1:

- Đo bounding box desktop: nút 40×40px, icon 24×24px, right gap 16px; tâm nút và tiêu đề lệch tâm header không quá 1px.
- Kiểm tra responsive tại 390×844: nút vẫn đủ vùng bấm, tiêu đề còn căn giữa, trang không tràn ngang.
- Đóng bằng chuột và phím Enter; focus-visible rõ. Khi đóng ở desktop, focus quay về nút yêu cầu vừa mở popup.
- E2E tạo trạng thái Chờ phê duyệt, Đã phê duyệt và Đã từ chối; mở lại xác nhận đúng dữ liệu/trạng thái. Đóng popup giữ filter nhân viên, ngày gửi, trang 2 và snapshot các IndexedDB store bằng hệt trước thao tác đóng.
- Toàn bộ `purchase-approvals.spec.ts`: **12 PASS / 0 FAIL / 0 SKIP**, gồm các luồng duyệt/từ chối, Escape, lỗi ghi/retry, phân trang và nút X mới.

Ảnh: [desktop 1440×900](./evidence/request-close-1440x900.png) · [responsive 390×844](./evidence/request-close-390x844.png).

Lint, typecheck, build: PASS. Build giữ nguyên cảnh báo annotation Zod và bundle lớn hiện có. Không chạy full unit/integration hoặc full E2E suite trong phạm vi UI này.
