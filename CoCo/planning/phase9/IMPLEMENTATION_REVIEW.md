# G9 — Review bổ sung nguồn ngày tạo và trình bày coverage

Ngày 13/11/2026. **PROPOSED / BLOCKED — CHƯA KÍCH HOẠT**. G9-D01/D02 đã chốt nghiệp vụ; tài liệu này xin review phần dữ liệu/UI cần thiết theo ràng buộc của người dùng.

## G9-M01 — Ngày tạo khách hàng

Thực tế `khachHang` chỉ có mã, tên, điện thoại, điểm. `createCustomer` chưa ghi ngày tạo. Không suy luận từ audit đầu tiên, membership hoặc giao dịch.

Phương án review: dùng namespace mới `customer-creation:<MaKH>` trong **appMetadata hiện hữu**, payload versioned gồm `format`, `customerId`, `createdAt`, `createdBy`, `operationId`, `source: customer-create`. Không thêm store/cột, không nâng version DB và không migration/backfill. Đây vẫn là bổ sung dữ liệu nên **chưa được thực hiện**.

- Chỉ ghi cho thao tác tạo mới sau khi phương án được duyệt; timestamp do service xác lập một lần, không lấy từ người nhập hoặc ngày mở app sau đó.
- Ghi cùng transaction của createCustomer. Có thể mở rộng validate callback hiện hữu của `commitAuthorized`, vốn chạy bên trong transaction repository sau guard và trước insert; không await WebCrypto trong transaction.
- Receipt/audit và khóa khách phải khớp; không thay ngày khi sửa tên/phone/membership hoặc retry. Thiết kế retry phải xét callback authorize chạy trước kiểm receipt, tránh thêm metadata trùng khi replay.
- Khách thiếu marker tiếp tục UNVERIFIED; không tự đổi dữ liệu cũ. Cần chốt vòng đời provenance khi khách không có giao dịch bị xóa hợp lệ, trước khi quyết định phạm vi KPI trên hồ sơ đã xóa.
- Test bắt buộc trước kích hoạt: rollback key/khách/receipt/audit, lỗi ghi từng store, retry/multi-tab, trường hợp có/không nguồn và reload/migration giữ nguyên legacy.

Hiện chỉ có classifier đọc/pure function và test trusted input; chưa sửa createCustomer, chưa tạo namespace trên dữ liệu runtime. KPI trên app **BLOCKED** về nguồn.

## G9-U01 — Phân biệt eligible/unverified trong KPI Khách hàng mới

SC198 có ô Khách hàng mới, không có slot/chú giải đủ điều kiện/chưa xác minh riêng. Không tự thêm banner/cột/card, không thay số mẫu bằng một số 0 không rõ phạm vi. Cần review cách thể hiện hai nhóm trong chính ô hiện có trước khi đưa KPI lên dashboard.

DTO đã có `scope`, summary chỉ xác minh, coverage và lý do loại trừ. Phương án review là trình bày trong khối đang có (ví dụ nhãn/chú thích được sửa trong chính khối), kèm bản thiết kế/ảnh đối chiếu trước kích hoạt. Không tự chọn cách trình bày hoặc coi `0 đủ điều kiện` là `0 khách mới của toàn bộ dữ liệu`.

Riêng các báo cáo tiền SC114/117/120/123 vốn được SRS định nghĩa trên giao dịch đã hoàn tất: quyết định mới đã đủ để tiếp tục tích hợp theo thiết kế hiện hữu và chỉ tính phần đã xác minh. Không đặt một gate phê duyệt UI mới cho những tổng đã có trong Figma. Chỉ khi thêm cách hiển thị coverage ngoài thiết kế mới cần review riêng.

Hiện chưa đổi route/sidebar/HomePage. **BLOCKED** áp dụng cho nguồn tạo và phần phân biệt dữ liệu của KPI Khách hàng mới, không phải thiếu quyết định loại trừ hoặc tự chặn toàn bộ công việc báo cáo tiền.
