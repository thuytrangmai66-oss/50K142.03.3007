# Nghiệm thu phần công việc G7 đã triển khai

Ngày13/11/2026. Nguồn: chỉ đạo trực tiếp của chủ dự án **“nghiệm thu công việc và giao công việc tiếp”**, sau báo cáo tiến độ và bộ kiểm chứng hiện hành.

## Phạm vi nghiệm thu

| Hạng mục | Trạng thái |
|---|---|
| T01: danh sách/query/filter/pagination/detail đã triển khai | **ACCEPTED_USER**, bảng5 cột theo G7-D04 |
| T02: sửa từng món, validation, quyền, transaction/CAS/rollback/replay | **ACCEPTED_USER** |
| T03: reset chu kỳ cho Chủ/Nhân viên theo G7-D01 | **ACCEPTED_USER** |
| T04: scheduler giờ Việt Nam/catch-up/mốc30–45 | **ACCEPTED_USER** |
| T05: claim/lease, idempotency, recovery và log | **ACCEPTED_USER** |
| T06: monitor hai vai trò, dữ liệu thực | **ACCEPTED_USER** |

Bằng chứng được trình trước nghiệm thu: **298/298 unit,107/107 Chromium**, lint/typecheck/build exit0 tại [evidence/handoff-current](evidence/handoff-current/). Lượt ghi biên bản này không chạy lại test và không chứng nhận một buổi kiểm thiết bị vật lý đã diễn ra.

## Các ngoại lệ được giữ nguyên trạng thái

- **Barcode T01 còn BLOCKED**: chưa xác nhận payload/mapping và chưa kiểm máy quét vật lý. Nghiệm thu phần đã làm không tự làm nhánh chưa triển khai thành DONE.
- Audit dependency gần nhất vẫn FAIL13 findings; không phải chấp thuận bỏ audit hoặc nâng package bất kỳ.
- Hai trường UI G6 theo BR-UC1-16 vẫn BLOCKED; không suy ra nghiệm thu toàn G6 hoặc miễn trừ SRS.
- G7 được nghiệm thu **phạm vi đã triển khai**, chưa ghi toàn phase DONE vì barcode còn thiếu.

Theo yêu cầu giao việc tiếp, chuyển bàn giao sang **G8-T01 phần độc lập** theo roadmap. Không bỏ barcode khỏi backlog, không đảo T02–T06 của G8 lên trước T01 hoặc coi các quyết định membership/ưu đãi chưa chốt là đã duyệt. [Phiếu giao Copilot](../phase8/COPILOT_T01_TASK.md).
