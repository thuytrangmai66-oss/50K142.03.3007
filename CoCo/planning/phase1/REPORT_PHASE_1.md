# Báo cáo Giai đoạn 1 — Khung CoCo

**Kính gửi Nguyên Đỗ,**

Ngày báo cáo: 10/11/2026, giờ Việt Nam. **Giai đoạn 1: ĐẠT điều kiện chuyển tiếp.** Đã hoàn tất việc loại bỏ nghiệp vụ thuê xe, ngắt Supabase và dựng khung CoCo chạy được typecheck/build.

## Phê chuẩn và phạm vi

Đã ghi nhận chỉ đạo phê chuẩn toàn bộ phương án kỹ thuật tại `planning/phase0/OPEN_ISSUES.md`, cập nhật trạng thái Q01–Q22 và kết luận nghiệm thu Giai đoạn 0 ĐẠT. Các dữ kiện nguồn và hạng mục đối chiếu còn lại được giữ dấu vết; việc phê chuẩn không biến chúng thành bằng chứng đã kiểm thử.

Giai đoạn 1 hiện thực nền kiến trúc AD01/AD02/AD03/AD07. Chưa hiện thực các UC nghiệp vụ, BR hoặc đăng nhập/phân quyền. Nền màu #f5f0e8, trắng/đen và font Be Vietnam Pro lấy từ UI_FOUNDATIONS; chưa chứng nhận giao diện khớp chi tiết các node Figma. Không có lượt đọc/ghi Figma mới trong giai đoạn này.

## Commit và môi trường

- Repo riêng: `CoCo/`, nhánh `coco`; commit đầu tiên chứa khung và hồ sơ này. Xác định mã bằng `git rev-list --max-parents=0 HEAD`; bản báo cáo tại workspace cha ghi bổ sung mã commit sau khi tạo.
- Windows/PowerShell, Node v24.22.0, npm 11.19.1; Chromium Playwright v1248, viewport 1440×900.
- Không có remote, chưa push/deploy. Repo tham chiếu và toàn bộ tài liệu nguồn không bị chỉnh sửa.

## File và dữ liệu thay đổi

| Hạng mục | Kết quả và bằng chứng |
|---|---|
| Màn hình/components nghiệp vụ thuê xe | Xóa toàn bộ; thay bằng `src/components/layout/CoCoLayout.tsx` và `src/features/home/HomePage.tsx` |
| Schema/repositories/seed cũ | Xóa; không giữ tài khoản, trạng thái, engine/timer thuê xe |
| Supabase | Xóa client, adapter, SQL, env mẫu, dependency và secrets workflow; không còn trong lockfile |
| Tích hợp ngoài | Xóa AI/OCR, webhook/notifier/QR online; không còn endpoint HTTP trong mã ứng dụng |
| Assets/cache | Xóa hình xe/banner/logo/manifest/service worker cũ; font đóng gói nội bộ |
| Layout/Router | Shell CoCo, Trang chủ, HashRouter và fallback; trạng thái đang mở/lỗi dữ liệu và nút thử lại |
| Dexie | `CoCoDB`, version 1, chỉ store kỹ thuật `appMetadata`; khởi tạo transaction có thể lặp, không reset dữ liệu |
| Namespace phiên | Chưa dùng localStorage/sessionStorage; prefix dự kiến `coco:`; không đọc dữ liệu cũ |
| Build/Pages | base tương đối, workflow kiểm tra typecheck/lint/unit/build; deploy cần thao tác thủ công; gỡ Netlify/Vercel |
| Hồ sơ | README mới, BASELINE_REPORT, REUSE_MAP, AUDIT_RESULTS và ảnh shell |

Schema 10 thực thể, repository CoCo và seed nghiệp vụ dành cho Giai đoạn 2. Giai đoạn 1 không tự nạp dữ liệu mẫu hoặc tạo chủ mặc định.

## Kiểm tra đã thực hiện

| Lệnh / kiểm tra | Exit code cuối | Kết quả |
|---|---:|---|
| `npm.cmd run typecheck` | 0 | PASS |
| `npm.cmd run build` | 0 | PASS; 43 modules, dist tạo thành công |
| `npm.cmd run lint` | 0 | PASS |
| `npm.cmd test` | 0 | PASS; 1 test DB |
| `npm.cmd run test:e2e` | 0 | PASS; 2 test Chromium |
| `node scripts/audit-phase1.mjs` | 0 | PASS; 5 kiểm tra tĩnh |
| Test nghiệp vụ thuê xe gốc | — | NOT_RUN, không dùng làm chứng nhận CoCo |
| Deploy/kiểm thử URL Pages thực | — | NOT_RUN, ngoài phạm vi Giai đoạn 1 |

Build/Vitest/Playwright được chạy ngoài sandbox sau khi quyền đọc thư mục cha của esbuild và quyền mạng tải browser bị chặn. Chi tiết lỗi ban đầu và cách xử lý nằm trong BASELINE_REPORT; bảng trên ghi kết quả cuối sau sửa.

Test DB kiểm tra khởi tạo đồng thời, giữ bản ghi qua đóng/mở lại và kết nối thứ hai, không ảnh hưởng DB kiểm thử tham chiếu. Smoke test trình duyệt kiểm tra shell, bản ghi tự tạo vẫn còn sau reload, route lạ và quay về Trang chủ, không có request HTTP ra host ngoài; kiểm tra riêng lỗi IndexedDB bị từ chối và nút thử lại.

Ảnh `coco-shell.png` đã được mở để kiểm tra trực quan ở 1440×900: chữ tiếng Việt rõ, sidebar/header/nội dung hiển thị đầy đủ, không còn UI thuê xe. Đây là ảnh khung ứng dụng, chưa phải bằng chứng nghiệm thu từng màn hình Figma. Kiểm tra dữ liệu sử dụng fake-indexeddb và Chromium profile kiểm thử tách biệt.

## Giới hạn và việc tiếp theo

Không còn lỗi chặn khung Giai đoạn 1 sau kiểm tra. Chưa triển khai đăng nhập, kiểm tra quyền, nghiệp vụ, backup/restore, scheduler hoặc khả năng mở app khi offline. Chưa kiểm tra deployment trên đường dẫn Pages thật, cache cũ trên origin đã từng chạy sản phẩm khác, hoặc full regression 27 UC.

Các giá trị chưa được nêu cụ thể ở Q10/Q12/Q20/Q21 tiếp tục được theo dõi tại module tương ứng; không chặn chuyển tiếp khung. Không hỏi lại việc phê chuẩn phương án đã có.

**Bước tiếp theo đủ điều kiện: Giai đoạn 2 — ánh xạ 10 thực thể Design, metadata đã được chấp thuận, validation/repository/transaction và kiểm thử ràng buộc, rollback, chống xử lý lặp.**
