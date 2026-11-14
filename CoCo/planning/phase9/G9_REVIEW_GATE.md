# G9 — Gói bàn giao review

Ngày 14/11/2026. **IMPLEMENTED / VERIFIED / PENDING REVIEW**, không tự DONE. Các quyết định G9-D01/D02/D04/D05 đã được người dùng duyệt; không còn chờ M01/U01/phạm vi staff/nguồn so sánh tồn cuối tháng trước. Push thành công không thay nghiệm thu.

## Phạm vi thực hiện

| Task | Kết quả và bằng chứng |
|---|---|
| T01 | Picker 5 báo cáo, bộ lọc ngày/tháng/năm/khoảng theo VN, route/sidebar owner-only; [execution](T01_EXECUTION.md) |
| T02 | Doanh thu verified/paidAt, tổng/average/nhóm ngày, rỗng/error/paging; [execution](T02_UI_EXECUTION.md) |
| T03 | Chi phí thu mua theo snapshot từng món, nhiều giá cùng khung, kỳ VN; [execution](T03_EXECUTION.md) |
| T04 | Lợi nhuận đúng cost món đã bán, dòng tiền thực thu/chi, tồn lâu còn kho và ngày nhập; [execution](T04_EXECUTION.md) |
| T05 | Dashboard bốn thẻ hai vai trò, M01-B/U01, quick actions thật; [execution](T05_EXECUTION.md) |
| T05, G9-D05 | So sánh tồn cuối tháng trước VN/cùng cohort xác minh, mẫu số 0/thiếu căn cứ giữ placeholder, không backfill; [execution](STOCK_COMPARISON_EXECUTION.md) |
| T06 | Đối soát UI giá vượt khung → Chủ duyệt → kho → bán → báo cáo/dashboard; live hai tab, quyền, read-only/reload, regression; [execution](T06_EXECUTION.md) |

## Gate kiểm thử cuối trên source bàn giao

| Lệnh | Kết quả |
|---|---|
| npm.cmd run lint | PASS |
| npm.cmd run typecheck | PASS |
| npm.cmd test -- --maxWorkers=1 | **491 PASS / 0 FAIL / 0 SKIP**, 26 file, 126,19 giây |
| npm.cmd run build | PASS, 4,52 giây; còn cảnh báo bundle >500 kB, không nới cấu hình để che |
| npm.cmd run test:e2e -- --workers=1 | **151 PASS / 0 FAIL / 0 SKIP**, 8,2 phút; gồm một testcase render proposal lịch sử riêng, không coi nó là nghiệp vụ runtime |
| node scripts/audit-phase1.mjs | **5/5 static checks PASS**; đây không phải dependency vulnerability audit |
| git diff --check | PASS |

Log và last-run [evidence/d05](evidence/d05/); các lượt FAIL ban đầu và cách xử lý vẫn lưu trong execution, không xóa dấu vết hoặc nới assertion để báo PASS.

## Source, ảnh và demo

[Danh sách file](CHANGED_FILES.md). Ảnh thật: [Chủ](evidence/t05-approved/owner-home-reconciled.png), [Nhân viên](evidence/t05-approved/staff-home-reconciled.png), [tồn giảm 50%](evidence/d05/sell-month-end.png), [tồn tăng 50%](evidence/d05/purchase-month-end.png). Không sửa schema/version DB, dependencies, workflow hoặc dữ liệu người dùng. Metadata khách mới chỉ ghi theo G9-D04, không backfill.

Local http://127.0.0.1:5173/50K142.03.3007/; chạy nếu cần `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort` trong CoCo. Dùng tài khoản hiện có; hai tab cùng origin giữ session riêng và chung dữ liệu. Chủ mở Báo cáo/Trang chủ, Nhân viên thực hiện giao dịch thật, đối chiếu cập nhật không F5. Tồn tháng trước chỉ có phần trăm khi đủ bằng chứng và baseline >0; thiếu căn cứ là trạng thái dữ liệu hợp lệ theo G9-D05.

## Các mục không được tự coi đã nghiệm thu

- Nghiệm thu nghiệp vụ/thiết kế T05/T06/toàn G9: PENDING REVIEW, không tự DONE.
- Ảnh đã được xem thủ công theo nguồn local; pixel-diff tự động toàn SC chưa chạy, thuộc kiểm chứng visual G10 với ngưỡng/viewport cần chốt.
- Ngoại lệ UI SRS/Figma của G6/G8, thiết bị/ngân hàng thực và dependency audit theo hồ sơ cũ không bị đóng hoặc coi PASS bởi suite G9.
- G10 là giai đoạn kế tiếp trong roadmap; không đổi thứ tự hoặc tự thêm chức năng, Q21/P11 còn theo gate NFR/visual trong plan G10.
- Git theo AGENTS.md: commit/push main sau checks, không đổi quyền/workflow hoặc dispatch deploy thủ công. SHA bàn giao và trạng thái Actions/Pages được xác minh sau push và báo trong chat; không hứa deploy thành công trước kết quả CI.
