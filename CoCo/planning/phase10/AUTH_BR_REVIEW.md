# G10-T02 — Assertion đăng nhập/phân quyền

Ngày 14/11/2026. Review theo BR-UC0-01/P0201,P0242 và BR-UC0-02/P0203,P0243 trong SRS/traceability; không đổi chính sách quyền.

| BR | Assertion đã đọc và thực thi trong suite | Kết luận phạm vi |
|---|---|---|
| UC0-01 | `auth.test.ts:99`: input rỗng/whitespace trả REQUIRED, không session; `:104`: username lạ/sai password/inactive đều INVALID_CREDENTIALS và session count 0; `:115`: login hợp lệ trả đúng role, opaque token, DB chỉ giữ token hash, logout thu hồi. `auth.spec.ts` hai role đi qua input lỗi, lỗi lưu, retry/login/reload/logout/Back; `:160` lỗi sessionStorage không để session ghi dở | Assertion chức năng đã review; full unit cuối 514 PASS, các ca Chromium này đã thực thi ở lượt full đang chạy. Chưa chứng nhận đầy đủ pixel mọi trạng thái đăng nhập |
| UC0-02 | `auth.test.ts:132`: staff reports.read bị FORBIDDEN, customers.read được phép; inactive qua kết nối khác bị AUTH_REQUIRED. `:143`: đổi role/version thu hồi session. `:153`: forged actor không thay audit actor, replay vẫn kiểm quyền. `:168/:179`: không thể mượn home.read để ghi account/customer, không operation ghi dở. `auth.spec.ts:65`: owner report được mở, staff route bị chặn, session riêng và thu hồi staff không logout owner; `:152`: session giả không chọn được owner và bị xóa token | Kiểm service + UI + session độc lập, không chỉ ẩn sidebar. Cần tiếp tục đối chiếu ma trận mọi module/branch và visual; không tự chứng nhận toàn UC/NFR security từ nhóm auth |

Không suy ra khả năng chống sửa IndexedDB/DevTools tương đương backend. Việc source local không có backend đã được chốt; các test này kiểm đúng phạm vi demo. Các nhánh quyền tại service thu mua/bán/khung giá/nhân viên/báo cáo vẫn là phần riêng của review 98 BR, không tự PASS qua tham chiếu bảng này.
