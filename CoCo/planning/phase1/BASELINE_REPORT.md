# Mốc kiểm thử ban đầu CoCo

Ngày 10/11/2026, giờ Việt Nam. Người nhận: Nguyên Đỗ.

Nguồn bộ khung: commit tham chiếu `72ffdf8618ee2b99a219546e708d72a8f294748b`, được sao chép thành 190 tệp theo `../phase0/STARTER_COPY_MANIFEST.csv`. Bản CoCo trước chuyển đổi chưa có commit và chưa có remote, nhánh `coco`.

Baseline chạy ứng dụng thuê xe gốc: **NOT_RUN**. Không chạy app trước khi ngắt cloud/auto-seed theo REUSE_MAP; không dùng kết quả test thuê xe làm chứng nhận CoCo. Repo tham chiếu và dữ liệu nguồn không bị sửa. Manifest Giai đoạn 0 là bằng chứng lịch sử bản sao, không còn là assertion rằng bản CoCo sau Giai đoạn 1 phải giống nguyên trạng.

Môi trường triển khai: Windows/PowerShell, Node v24.22.0, npm 11.19.1. Cài dependency bằng `npm.cmd install --ignore-scripts --no-audit --no-fund --prefix CoCo`, exit 0; cập nhật lockfile, gỡ SDK cloud và OCR. Không nâng stack theo một lần cập nhật tổng thể.

Lỗi quan sát và xử lý:

- Build và Vitest lần đầu bị sandbox chặn esbuild đọc thư mục cha; chạy lại ngoài sandbox được cho phép, không sửa cấu hình sản phẩm để lách quyền.
- Vitest lần đầu ngoài sandbox lỗi `expect is not defined`; sửa setup dùng `@testing-library/jest-dom/vitest`, chạy lại PASS.
- Playwright lần đầu thiếu Chromium, chưa thực thi được test; tải trình duyệt vào `.playwright-browsers/` riêng trong CoCo. Lần tải trong sandbox bị EACCES mạng, đã chạy lại với quyền được duyệt.

Kết quả cuối cùng và giới hạn nằm tại `REPORT_PHASE_1.md` cùng `AUDIT_RESULTS.json`.
