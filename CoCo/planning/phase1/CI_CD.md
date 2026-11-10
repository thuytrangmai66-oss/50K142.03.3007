# Bổ sung CI/CD trong Giai đoạn 1

Ngày bổ sung: 10/11/2026, theo yêu cầu trực tiếp về GitHub Actions và continuous deployment. Đây là phần bổ sung kỹ thuật cho khung Giai đoạn 1 đã có giao diện đầu tiên; giữ nguyên roadmap, thứ tự phase, task nghiệp vụ và AD01–AD08. Không triển khai lại khung hoặc thêm phase mới. `MASTER_PLAN_COCO.md` chưa có trong checkout hiện tại; không tự tạo lại hoặc sửa roadmap từ suy đoán.

## Các task CI/CD bổ sung

| Task trong Giai đoạn 1 | Thực hiện |
|---|---|
| Đặt workflow tại root repository | `.github/workflows/deploy.yml`; bỏ bản lồng trong `CoCo/` |
| Kiểm tra mỗi push `main` và PR vào `main` | Node 24, `npm ci` theo lockfile, lint, typecheck, unit test, audit, build và smoke test Chromium trên bản build |
| Cấu hình ứng dụng trong thư mục con | Lệnh npm chạy tại `CoCo`, cache theo `CoCo/package-lock.json`, artifact từ `CoCo/dist` |
| Cấu hình đường dẫn Pages | Vite base `/50K142.03.3007/`; smoke test dùng preview tại cùng đường dẫn |
| Deploy sau checks thành công | Job deploy phụ thuộc checks; chỉ push `main` hoặc chạy thủ công trên `main` mới deploy; PR chỉ kiểm tra |
| Giới hạn quyền và điều phối | Mặc định `contents: read`; riêng deploy có `pages: write`, `id-token: write`; environment `github-pages`, tuần tự hóa deploy |
| Kiểm tra quyền repository và Pages | Actions đã bật, policy `allowed_actions: all`, token mặc định read; giữ nguyên. Tài khoản có quyền admin; Pages trước đó trả 404, đã tạo với `build_type: workflow` |

Sau mỗi push `main`, workflow tự kiểm tra và cập nhật website nếu tất cả bước đạt. Bước thất bại chặn upload/deploy. Smoke test hiện có kiểm tra shell, fallback, lưu metadata sau reload, không gọi host ngoài và thông báo lỗi khi IndexedDB bị từ chối. Phạm vi này không chứng nhận các UC chưa triển khai.

## Kiểm chứng

- Local: `npm ci`, lint, typecheck, 1 unit test, 5 kiểm tra audit và build đều PASS. HTML build tham chiếu JS/CSS dưới `/50K142.03.3007/assets/`.
- Smoke test bản build: 2/2 PASS trên Chromium với đường dẫn Pages. Lượt đầu trong sandbox không kết thúc sau khi tạo ảnh; đã dừng và chạy lại ngoài sandbox với `CI=true`, 1 worker và global timeout 90 giây, hoàn tất trong 2,9 giây.
- Workflow đầu tiên tự kích hoạt bằng push commit `2f6b8271e73e5cda1c13e7ba60eb12defd50fbd1` lên `main`: [run 42851055574](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/runs/42851055574) **SUCCESS**, cả `checks` và `deploy` thành công. Tất cả các bước install/lint/typecheck/unit/audit/build/Chromium smoke/artifact/Pages đều success.
- URL Pages thực trả HTTP 200. Chromium profile kiểm thử riêng xác minh Trang chủ, reload, route không tồn tại và link quay lại Trang chủ đều PASS; không có page error hoặc response HTTP lỗi khi kiểm tra. Ảnh kiểm tra: `test-results/coco-pages-live.png` (artifact local, không commit). Lượt xác minh live đầu tiên bị lỗi chuỗi tiếng Việt khi PowerShell truyền script qua stdin; đã chạy lại bằng Unicode escape và đạt.
- URL Pages đã được GitHub cấp: https://thuytrangmai66-oss.github.io/50K142.03.3007/.
- Không thay đổi visibility, branch protection, quyền review PR, policy Actions hoặc các thiết lập repository khác. Chỉ bật Pages nguồn workflow; quyền deploy khai báo riêng trong workflow.

Nguồn kỹ thuật: [Vite — GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub — workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [GitHub — Pages API](https://docs.github.com/en/rest/pages/pages).

## Tiếp tục roadmap

Sau khi xác minh CI/CD, bước nghiệp vụ tiếp theo vẫn là Giai đoạn 2 theo [báo cáo Giai đoạn 1](REPORT_PHASE_1.md): ánh xạ 10 thực thể Design, metadata đã duyệt, validation/repository/transaction và kiểm thử ràng buộc, rollback, chống lặp. Bổ sung này không tự chốt các thông số nghiệp vụ còn thiếu.
