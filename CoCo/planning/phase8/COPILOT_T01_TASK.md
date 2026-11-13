# Giao Copilot — G8-T01: giỏ bán hàng và snapshot giá

> Cập nhật sau review 13/11/2026: draft-cart subset được chấp nhận; xem [T01 execution](T01_EXECUTION.md). Các hướng dẫn dưới đây ghi phạm vi được giao ban đầu, không còn là trạng thái nghiệm thu hiện hành.

Ngày13/11/2026. Chủ dự án đã nghiệm thu phần G7 được bàn giao và yêu cầu giao việc tiếp. [Biên bản phạm vi/ngoại lệ](../phase7/ACCEPTANCE_2026_11_13.md). **Đây là công việc tiếp theo hiện hành**, thay hướng dẫn chưa bắt đầu G8 trong bàn giao cũ.

## Nhiệm vụ

Bắt đầu **G8-T01 trong PLAN_PHASE_8**, theo MASTER_PLAN: nền giỏ bán hàng, chọn món còn bán được, lưu snapshot giá và kiểm lại trạng thái/giá khi xử lý. Tập trung phần độc lập với đăng ký thành viên và quy tắc làm tròn ưu đãi chưa được xác nhận; không làm lại G7.

## Đọc trước khi code

- `planning/MASTER_PLAN_COCO.md`, `planning/phase8/PLAN_PHASE_8.md`, `planning/OPEN_ISSUES.md`, SRS UC_3.1/3.2 và BR tương ứng, SDD/G2 data mapping.
- Bộ Design/CODEX local của Chủ/Nhân viên, SC037–059/229–251; không cần link Figma online.
- Producer G6, `InventoryService`, scheduler G7 và contract schema v4. Phân biệt giá gốc chu kỳ, giá hiện hành, giá mua/cost và snapshot lịch sử.
- Git/working tree thực tế. Hiện branch `coco/phase-7`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`, nhiều thay đổi chưa commit. Không reset/clean/ghi đè chúng hoặc nhận toàn bộ dirty tree là code mới của mình.

## Phạm vi triển khai ngay

1. Đối chiếu T01 với source hiện có, lập mapping SalesDraft/SalesLine và snapshot giá trong đúng task; không tự đổi nghĩa hoaDonBanHang.TongTien/TienKhuyenMai/TichDiem hoặc đổi PK/FK legacy. Ghi review nếu thiếu contract trước producer phụ thuộc.
2. Chọn/thêm/bỏ sản phẩm thật trong kho vào giỏ theo UI đã duyệt, cho đúng hai vai trò. Dùng mapping trạng thái được lưu cho dữ liệu mới, không suy diễn lại numeric legacy.
3. Giữ từng MaSP/món riêng, snapshot giá bán hiện hành tại lúc chọn; tính subtotal nguyên đồng, kiểm overflow, trùng món và dữ liệu bắt buộc.
4. Recheck trạng thái/giá/version ở service/transaction khi xử lý. Không để giỏ cũ ghi đè giá mới từ scheduler hoặc bán món đã được tab khác xử lý. Thông báo và hướng xử lý theo SRS/Figma, không tự thêm controls.
5. Nếu có lưu draft/reload theo contract T01, draft chưa hoàn tất **không** được đổi sold, trừ điểm, ghi doanh thu hoặc tạo hóa đơn hoàn tất giả. Không dùng mock data thay dữ liệu G6/G7.
6. Bảo toàn quyền tại service và session riêng từng tab, dữ liệu chung cùng origin. Tái sử dụng layout/pagination/popup, giữ tinh chỉnh UI hiện tại và bảng Hàng hóa5 cột.

T01 có phần tính khuyến mãi/tiền trả phụ thuộc quyết định: không tự hardcode chiết khấu0 hoặc bỏ membership rồi báo toàn T01 DONE. Hoàn thành phần độc lập, ghi phần phụ thuộc OPEN/BLOCKED và tiếp tục đúng thứ tự sau khi được chốt.

## Làm rõ sớm, không tự chốt

- **P06:** sự kiện đăng ký thành viên và control được phép. Có hồ sơ khách không đồng nghĩa đã là member.
- **P07/phần G8:** cách làm tròn ưu đãi20%, cơ sở tính, điểm dùng/tích theo SRS. Xác nhận half-up cho mức giảm30% G7 **không** tự áp sang20% G8.
- **P05:** mapping số tiền/điểm và finalizedAt/paidAt snapshot trước finalizer của task sau; không tính lại lịch sử từ giá hiện hành.

Tìm trong tài liệu/chỉ đạo hiện hành trước khi hỏi lại. Nếu còn thiếu, gửi câu hỏi cụ thể và tiếp tục phần độc lập; không hỏi lại Q10/Q12 giảm30%/P10 đã chốt hoặc kiến trúc local.

## Chưa triển khai vượt dependency

T02 membership/điểm → T03 tiền mặt → T04 QR cục bộ → T05 finalize → T06 tra cứu theo PLAN_PHASE_8. Không đưa task sau lên trước để né gate. Các quyết định QR đã chốt (SHB, tài khoản chuỗi0947800469, tên MAI THUY TRANG, số tiền sau ưu đãi, nhân viên xác nhận Đã nhận) giữ nguyên, không cần hỏi lại.

Barcode G7 còn backlog riêng; không tự giả định payload hoặc mở camera. Audit13 findings và hai trường UI G6 vẫn mở; không tự sửa SRS, thêm field hoặc chạy audit fix --force.

## Kiểm thử và bàn giao

- Kiểm baseline phù hợp, ghi rõ bộ log dùng lại hay lệnh mới chạy. Mốc hiện hành:298 unit/107 Chromium, lint/typecheck/build PASS; không lấy số cũ làm kết quả test source mới.
- Unit/integration: subtotal/overflow, trùng món, sold, snapshot giá, quyền, transaction/rollback, conflict/replay nếu T01 có producer.
- Chromium qua UI thật: hai vai trò, giỏ rỗng/hợp lệ, chọn/bỏ/trùng món, lỗi đọc/ghi, scheduler đổi giá, hai tab cùng chọn cùng món, reload theo contract. Chỉ kiểm bán hoàn tất khi task producer đó đã được phép triển khai.
- Chạy test tập trung, sửa lỗi, rồi lint/typecheck/build và regression G2–G7. Chạy full trước bàn giao cần nghiệm thu; không bỏ/skip test thất bại hoặc chỉnh baseline/timeout để che lỗi.
- Tạo `planning/phase8/T01_EXECUTION.md`, cập nhật checklist/REPORT_PHASE_8/traceability: scope thực hiện, file thay đổi, UC/BR↔test, PASS/FAIL/NOT RUN, screenshot hai vai trò, log/exit/count/hash và các gate còn mở.
- Trạng thái sau review: draft-cart subset được chấp nhận; không suy ra nghiệm thu toàn G8.

Không commit/push/deploy, không reset dữ liệu hoặc thay backend/DB architecture. Không tự nâng dependency hoặc thêm dịch vụ ngoài; CoCo vẫn là demo local IndexedDB/Dexie.
