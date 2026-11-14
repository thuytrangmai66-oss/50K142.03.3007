# G10-T02 — Khung giá, phê duyệt và nhân viên

Ngày 14/11/2026. Đã đối chiếu nội dung BR-UC5/6/8 trong SRS traceability, assertion unit/integration và luồng Chromium. Review này không sửa rule hoặc thay nghiệm thu toàn bộ visual/UC. Kết quả cuối của lượt ghi riêng tại [execution](BR_REVIEW_EXECUTION.md).

## Khung giá — 9 BR

| BR | Assertion / bằng chứng đã đọc | Phạm vi |
|---|---|---|
| UC5-01 | `reference-data.test.ts` staff gọi brackets/bracket đều FORBIDDEN; owner list trả đúng dòng/condition. `reference-data.spec.ts` staff không có link và route trực tiếp bị chặn | Service + UI, không chỉ ẩn sidebar |
| UC5-02 | Staff createBracket bị FORBIDDEN; owner tạo bằng form thật và lưu mã 2=Tốt | Không tạo bản ghi khi trái quyền |
| UC5-03 | Test `uses only the approved numeric condition codes…` kiểm type/brand/condition/min/max, mapping 3/2/1 và edit condition | Dropdown và số lưu không có catalog riêng theo màn hình |
| UC5-04 | Cùng combo create trùng bị DUPLICATE; đổi condition sang combo có sẵn cũng bị DUPLICATE | Tạo/sửa đều kiểm unique; không thay ý nghĩa legacy |
| UC5-05 | `checks every required bracket field…` lần lượt bỏ từng key và toThrow; UI submit rỗng kiểm lỗi; sửa dùng validator chung | Đã đọc assertion validator; UI lỗi riêng cho mọi field ở màn hình sửa vẫn chưa được chứng nhận đầy đủ |
| UC5-06 | Min150001>Max150000 bị từ chối; Min=Max150000 hợp lệ; UI nhập200000/100000 hiển thị lỗi | Không chỉ kiểm happy path |
| UC5-07 | Min0/Max-1/phần lẻ/overflow bị từ chối, không làm tròn để chấp nhận input sai | Theo integer-money contract đã duyệt |
| UC5-08 | Staff updateBracket bị FORBIDDEN; owner sửa và reload thấy Mới | Kiểm role tại service và UI |
| UC5-09 | `reference-data.test.ts` history invoice giữ unitPrice100000/cost100000 sau đổi Min/Max; `purchase-approvals.test.ts` reviseRejected dùng revision khung mới nhưng request cũ nguyên vẹn | Giá giao dịch mới dùng khung mới; không reprice lịch sử |

## Phê duyệt — 6 BR

| BR | Assertion / bằng chứng đã đọc | Phạm vi |
|---|---|---|
| UC6-01 | Staff load/list/decide bị FORBIDDEN; owner revoke/logout bị AUTH_REQUIRED; test mới kiểm lại quyền trước replay cả approve/reject | Không dựa vào role nhận từ input |
| UC6-02 | Chỉ pending/revision đúng; removed/cancelled/stale/đã xử lý bị CONFLICT. Hai connection với session độc lập quyết định trái nhau chỉ một winner | Unit mới thực sự Promise.allSettled, không gọi tuần tự giả race |
| UC6-03 | `approvalMatchesLine` kiểm line revision, quantity, unitCost, bracket revision; fixture đổi giá/số lượng/khung đều ineligible, decide không ghi | Phê duyệt gắn đúng dòng/snapshot, không áp request cũ cho giá mới |
| UC6-04 | Reject thiếu reason/rỗng/whitespace hoặc >100 ký tự bị chặn; reason hợp lệ lưu đúng; E2E từ chối yêu cầu nhập lý do | Không thêm checklist chất lượng hoặc quy trình kiểm định |
| UC6-05 | Decision/revision/line/notice/receipt/audit atomic; replay không thêm event; 5 điểm ghi reject lỗi rollback mọi store rồi retry một lần; opId đổi action/revision/request/reason bị OPERATION_REUSED | Test mới so toàn bộ store và xác nhận injector được gọi |
| UC6-06 | Notice recipient đúng requestedBy, delivery pending khác read/delivered; chỉ người tạo ack, ack lại không tăng audit; reject có reason khi nhận kết quả; Chromium hai tab nhận live | Lỗi phát tín hiệu sau commit không giả vờ rollback quyết định đã lưu |

E2E mới `G10 opposing approve/reject…` dùng hai tab đăng nhập độc lập, một bên mở lý do từ chối rồi click hai control thật đồng thời. Một success/một conflict, trạng thái approval/line khớp, chỉ một notice/receipt, không invoice/stock giả. Đóng thông báo và chi tiết phù hợp ở cả hai tab, danh sách tương tác được, dữ liệu không ghi lại, không reload/console error. Targeted **1/1 PASS**.

Nhóm unit phê duyệt **52/52 PASS**, tăng 12 ca. Lượt đầu có 2 FAIL vì spy nhầm instance `db.table(name)` thay vì typed `db.operations/db.auditEntries` mà service dùng; đã sửa fault injector và thêm assertion phải được gọi đúng một lần. Giữ nguyên yêu cầu reject/rollback và production code; không báo đây là lỗi transaction sản phẩm hoặc đổi kết quả cũ thành PASS.

## Nhân viên — 10 BR

| BR | Assertion / bằng chứng đã đọc | Phạm vi |
|---|---|---|
| UC8-01 | `staff-accounts.test.ts` staff bị FORBIDDEN với mọi CRUD/list/detail, owner-account mutation bị chặn; Chromium staff route denied | Service + route |
| UC8-02 | UI form đủ tên/username/password/phone; create nhận role giả owner vẫn lưu staff; detail DTO không chứa credential | Không nhận role từ form |
| UC8-03 | Bốn input tạo rỗng bị VALIDATION và không thêm employee/account; UI hiển thị bốn lỗi | Không tự đổi quy tắc mật khẩu khi sửa |
| UC8-04 | Duplicate username kể cả owner bị từ chối; rename vào username khác bị chặn, hai identity nguyên vẹn | Create + update; race create chỉ một winner |
| UC8-05 | Phone phải đúng10 chữ số và unique; test mới sửa phone rỗng/9 chữ số/full-width Unicode/trùng profile khác bị từ chối, mọi store và session nguyên vẹn | Bổ sung nhánh update thay vì suy từ test create |
| UC8-06 | Validate ở service trước ghi; tạo/sửa lỗi không làm đổi credential, alias hoặc thu hồi session; audit lỗi rollback create/rename/remove | Không nới validation để chạy PASS |
| UC8-07 | UI Hủy edit không đổi dữ liệu; Save tên hợp lệ cập nhật live, credential/session giữ; rename username hợp lệ giữ MaNV/FK và thu hồi phiên cũ đúng hợp đồng; stale revision bị CONFLICT | Không coi sửa tên thường là thay credential |
| UC8-08 | remove confirmed=false bị CONFIRMATION; UI Hủy/X/Escape giữ tài khoản, pending chặn lặp | Tái sử dụng confirmation theo thiết kế riêng |
| UC8-09 | Xóa là disable tài khoản, giữ employee/history identity; session cũ null, đăng nhập lại INVALID_CREDENTIALS, không xóa nhầm audit/FK | Không thay bằng xóa vật lý legacy |
| UC8-10 | DTO không lộ password/hash/salt; test mới so mọi store trước/sau list/detail/reopen, không chỉ so số dòng; UI detail không có field mật khẩu | Truy vấn chỉ đọc thật |

Nhóm unit nhân viên **27/27 PASS**, tăng7 ca. Không có sửa runtime/UI/schema trong lượt này. Full regression đang thực thi; review 25 BR ở tài liệu này cộng 23 BR trước là nội dung assertion đã đối chiếu, **không đồng nghĩa 48 BR được nghiệm thu đủ mọi nhánh/visual**. Các phase đã được chấp thuận trước không bị hạ trạng thái bởi review G10.
