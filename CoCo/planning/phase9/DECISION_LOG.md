# G9 — Decision Log

Ngày 13/11/2026. Nguồn phê duyệt: chỉ đạo trực tiếp “COCO – QUYẾT ĐỊNH XỬ LÝ DỮ LIỆU LEGACY VÀ KPI KHÁCH HÀNG MỚI”. Thay thế trạng thái chờ quyết định nghiệp vụ R01/R02; không nghiệm thu phase và không cho phép thay schema/UI.

| ID | Quyết định | Trạng thái |
|---|---|---|
| G9-D01 | Không suy đoán thanh toán từ sự tồn tại hóa đơn/mã số/ngày bán. Thiếu bằng chứng hoàn tất đáng tin cậy → UNVERIFIED ở tầng báo cáo, loại khỏi doanh thu/lợi nhuận/dòng tiền đã xác nhận. Có bằng chứng hoàn tất nhưng thiếu mốc thanh toán → giữ VERIFIED và ghi thiếu thời gian, không phân bổ vào kỳ. Không dùng ngày tạo/import/migration hoặc tự đổi nghĩa NgayBan. Dữ liệu gốc/status legacy bất biến. | APPROVED_USER |
| G9-D02 | Chỉ tính Khách hàng mới khi có ngày tạo đáng tin cậy đã lưu và thuộc kỳ. Không dùng giao dịch đầu tiên, membership, migration/import để thay ngày tạo; khách thiếu căn cứ không vào KPI. Nếu hiển thị phải phân biệt phần đủ điều kiện và chưa xác minh trong thiết kế đã duyệt. | APPROVED_USER |
| G9-D03 | Không thêm bảng/cột/migration/UI; phần cần bổ sung dữ liệu hoặc thiết kế phải có review riêng. Không ghi/backfill legacy, không mở rộng báo cáo, không commit/push/deploy hoặc tự DONE. | APPROVED_USER |

## Hợp đồng nhận diện hiện có

- Bán hàng mới P05: snapshot `sales-invoice-v1` hợp lệ, header/chi tiết/sản phẩm/khách/nhân viên/mapping khớp; draft finalized và receipt/audit đúng giao dịch. `paidAt` tường minh là nguồn kỳ; NgayBan chỉ được kiểm tra nhất quán theo P05, không dùng làm fallback cho legacy hoặc paidAt thiếu.
- Báo cáo tách kiểm tra graph khỏi kiểm tra thời gian: `VERIFIED + MISSING_TIME/INVALID_TIME` vẫn không đủ điều kiện kỳ; `UNVERIFIED` không trở thành completed chỉ vì mã số giống bản ghi mới. Snapshot lỗi hoặc receipt thiếu không được sửa/fallback; được phân loại UNVERIFIED và loại trừ có coverage. Lỗi truy cập storage vẫn là lỗi truy vấn, không biến thành số 0.
- Thu mua mới đã có `purchaseFinalizations.paidAt` trong hợp đồng P03/P04. T03/T04 chưa triển khai, khi nối phải áp dụng cùng nguyên tắc; không lấy NgayThuMua/finalizedAt thay paidAt ngoài hợp đồng được duyệt.
- Hiện **không có nguồn ngày tạo hồ sơ khách đã được phê duyệt trong physical contract**. `memberships.registeredAt` và audit generic không đủ để tự xác nhận ngày tạo; vì vậy việc ghi nguồn mới giữ BLOCKED tại review riêng, không giả định khách mới hiện tại đã có timestamp.

## Coverage và UI

DTO trả scope rõ ràng và phân loại/coverage theo tập nguồn. Hóa đơn/khách thiếu ngày không thể tự gán vào một kỳ, nên coverage chưa xác minh là của tập nguồn đã kiểm tra, không phải số loại trừ biết chắc thuộc kỳ. Các summary tiền/KPI chỉ gồm bản ghi đủ điều kiện trong kỳ.

UI báo cáo/dashboard chưa tích hợp. Nguồn ngày tạo và cách phân biệt eligible/unverified trong KPI Khách hàng mới vẫn cần review: [IMPLEMENTATION_REVIEW.md](IMPLEMENTATION_REVIEW.md). Các báo cáo tiền có thể tiếp tục theo thiết kế đã duyệt, chỉ tính giao dịch đủ điều kiện; không cần hỏi lại quyết định loại trừ. Không dùng quyết định nghiệp vụ để tự bổ sung component ngoài Figma.
