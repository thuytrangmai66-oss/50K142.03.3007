# Kết quả giữ, thay và gỡ Giai đoạn 1

| Nhóm | Kết quả |
|---|---|
| React/TS/Vite/Tailwind/Dexie, Vitest/Playwright | Giữ stack; lockfile cập nhật theo dependencies còn dùng, Node 24/npm 11 |
| Providers/router/layout | Thay bằng khởi tạo CoCoDB, HashRouter, Trang chủ và route không tồn tại |
| Components/features/auth/engine/config/integrations/AI cũ | Xóa; không giữ quy trình, role, tài khoản, timer hoặc UI thuê xe |
| DB/schema/types/repo/seed/backup/adapter cũ | Xóa; chỉ tạo CoCoDB version 1, store kỹ thuật appMetadata; schema nghiệp vụ ở Giai đoạn 2 |
| Supabase client/SQL/dependency/env/workflow secrets | Xóa hoàn toàn khỏi repo và đường chạy; không gọi cloud gốc |
| Images xe/banner/favicon/manifest/SW/404 cũ | Xóa; font Be Vietnam Pro đóng gói cục bộ; không đăng ký SW mới |
| README/docs/plan AI cũ | Xóa; README CoCo và hồ sơ giai đoạn mới thay thế; nguồn tham chiếu ngoài CoCo được giữ nguyên |
| Vite base và Pages | base tương đối, HashRouter; workflow có typecheck/lint/unit/build, deploy chỉ khi gọi thủ công |
| Netlify/Vercel | Xóa cấu hình |
| Tests cũ | Xóa; kiểm tra DB mới và smoke test shell mới; không mang độ phủ nghiệp vụ cũ sang CoCo |
| localStorage/sessionStorage | Chưa dùng; dành prefix coco: cho triển khai sau, không đọc namespace cũ |

Shell hiện chỉ có Trang chủ. Chưa có login, menu quản trị hay route nghiệp vụ giả; hai vai trò và route bảo vệ sẽ triển khai cùng auth. Không giữ số liệu mẫu từ Figma làm số liệu thật.
