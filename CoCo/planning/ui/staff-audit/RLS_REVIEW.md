# Cần review phạm vi đọc hồ sơ nhân sự

16/11/2026 — **OPEN / CHƯA SỬA RLS, RPC HOẶC SCHEMA**.

UC_8.1–8.4 và BR-UC8-01 quy định Chủ quản lý tài khoản. Router/service/Edge/RPC chặn thao tác quản lý của Nhân viên; `coco_profiles` chỉ trả profile của mình hoặc cho Chủ. Tuy nhiên `coco_can_read` hiện chủ động cho đọc các document nhân sự để phục vụ tên nhân viên và liên kết tài khoản trên chứng từ. Fallback `return true` cho phép staff đọc cả phone trong `nhanVien` của người khác.

Đã xác minh bằng PostgreSQL riêng: staff đang active truy vấn `nhanVien` thấy 2 hồ sơ khác mình với phone. Không sử dụng production hay dữ liệu thật. [Bằng chứng OPEN](evidence/staff-sql-audit.json). Không coi khả năng quản lý bị chặn là bằng chứng toàn bộ trường hồ sơ bị hạn chế.

Phương án cần PO xác nhận: với hồ sơ của nhân viên khác, chỉ cho phép MaNV/Họ tên cần để hiển thị giao dịch; SĐT và chi tiết tài khoản chỉ Chủ được đọc. Sau khi chốt, cần thiết kế projection tương ứng và rà phụ thuộc snapshot/repository/FK/hiển thị lịch sử trước khi đề xuất bản vá. Không được chỉ đổi policy khiến reader thiếu dữ liệu, hoặc điền SĐT giả để qua schema validation.

Chưa có quyền áp dụng phương án này: yêu cầu hiện tại quy định báo cáo riêng trước khi sửa RPC/RLS/schema. Không triển khai thay đổi đó trong lượt này, không tự ghi nhận ngoại lệ cho quyền đọc đang có.
