# G9 — Decision Log

## G9-D05 — So sánh tồn kho lịch sử, APPROVED_USER 14/11/2026

Người dùng xác nhận: **“Duyệt phương án A: mốc cuối tháng trước và phạm vi dữ liệu đã xác minh”** tại [HISTORICAL_STOCK_REVIEW.md](HISTORICAL_STOCK_REVIEW.md).

Mốc là cận loại trừ 00:00 ngày đầu tháng hiện tại theo giờ VN. Chỉ dùng chuỗi nhập/bán đã xác minh, cùng phạm vi cho số hiện tại và số trước; không suy thời điểm bán từ trạng thái hiện tại/NgayBan, không backfill legacy. Phần trăm `(hiện tại − trước)/trước ×100`, hiển thị tối đa một chữ số thập phân trong ô hiện có. Thiếu bằng chứng hoặc mẫu số 0 giữ “Chưa đủ cơ sở so với tháng trước”. Không thêm schema/snapshot/UI, không tự nghiệm thu G9. G9-D05 mở gate nguồn/thuật toán lịch sử mà G9-D04 trước đó giữ BLOCKED; các mô tả BLOCKED trong nhật ký cũ thuộc thời điểm trước xác nhận này.

## Quyết định bổ sung 14/11/2026 — G9-D04 APPROVED_USER

Người dùng xác nhận: **“Duyệt: KPI toàn cửa hàng theo ngày VN + M01-B (xóa marker cùng hồ sơ) + wording đề xuất”** cho [T05_REVIEW_GATE.md](T05_REVIEW_GATE.md).

- Dashboard Nhân viên: cả bốn KPI toàn cửa hàng theo ngày hiện tại Việt Nam; chỉ tính nguồn đủ điều kiện đã xác minh.
- G9-M01-B: kích hoạt `customer-creation:<MaKH>` / `customer-creation-v1` cho hồ sơ mới từ thời điểm triển khai; cùng transaction hồ sơ/receipt/audit. Xóa marker cùng transaction xóa hồ sơ hợp lệ; KPI đếm hồ sơ hiện còn. Sửa hồ sơ không đổi ngày tạo. Không thêm bảng/cột/version DB, không backfill legacy.
- G9-U01: dùng hai dòng “N người đã xác minh” và “N hồ sơ chưa có ngày tạo tin cậy” trong thẻ Khách hàng mới. Dòng thứ hai là tập nguồn chưa đủ căn cứ, không gán vào ngày báo cáo.
- Duyệt wording so sánh doanh thu “Chưa có cơ sở so với hôm qua”; tồn kho “Chưa đủ cơ sở so với tháng trước”; trạng thái tồn chưa đủ căn cứ “Chưa xác minh” và số sản phẩm chưa đối chiếu trạng thái. Phần trăm có cơ sở hiển thị tối đa một chữ số thập phân, không đổi số tiền lưu.
- **So sánh tồn kho tháng trước vẫn BLOCKED**: duyệt placeholder không phê duyệt nguồn lịch sử hoặc miễn trừ tiêu chí nghiệm thu. Không tự DONE G9.

Các đoạn “chưa có nguồn được phê duyệt/chưa nối UI” bên dưới là lịch sử trước G9-D04; đọc cùng execution hiện hành. Quy trình Git hiện hành theo AGENTS.md thay chỉ dẫn Git cũ trong G9-D03.

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
