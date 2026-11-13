# Thực thi kiểm thử G5

> Bổ sung 11/11/2026: [REVIEW_COMPLETION.md](REVIEW_COMPLETION.md) ghi baseline/hồi quy mới nhất và test `staff-review.spec.ts` bao phủ các trạng thái SC145–162 qua UI thật, lỗi index/read/write, snapshot rollback và retry. Mốc 88/29 phía dưới là lịch sử bàn giao ban đầu; pixel comparison tự động vẫn NOT RUN.

Ngày 11/11/2026. `npm test`: 5 file, 88 PASS (68 hồi quy + 20 mới). Chromium: 29 PASS (23 hồi quy + 6 mới), không skip. Mapping dưới đây chỉ ghi hành vi có assertion, không xác nhận mọi control/visual ID trong catalog.

| Yêu cầu / scenario kế hoạch | Bằng chứng đã thực thi | Kết quả |
|---|---|---|
| UC8.1; BR-UC8-02/03/04/05/06 | Service validate 9 boundary, duplicate owner phone/username, forced role; UI nhập/thiếu/phone sai/trùng/Hủy/Lưu, login được bằng account vừa tạo | PASS chức năng; chưa pixel từng variant |
| UC8.2; BR-UC8-04/05/06/07; TC-P5-RENAME | Update profile, CAS stale, rename collision, FK/alias/history/session atomic, rename-back; UI Hủy/sửa tên/username, owner form stale, old/new login | PASS chức năng |
| UC8.3; BR-UC8-08/09; TC-P3-SESSION-REVOKE | Hủy không ghi, confirm soft delete, account có lịch sử giữ FK; UI xác nhận/hủy, tab staff mất phiên không F5, owner còn phiên | PASS chức năng |
| UC8.4; BR-UC8-10; TC-P5-SECRET-DTO | Read snapshot không ghi, DTO/detail không password/hash/salt; UI empty/list/detail | PASS chức năng |
| BR-UC8-01 | Staff gọi thẳng cả list/detail/create/update/delete đều bị chặn, owner account không sửa/xóa từ staff module; staff URL bị từ chối | PASS |
| TC-P5-ACCOUNT-RACE | Hai DB connections tạo trùng chỉ một thắng; version stale không ghi đè; audit fail create/rename/delete rollback mọi bảng/alias/session | PASS |
| DB failure/recovery | Chromium tiêm lỗi IDBObjectStore.put đúng accountSecurity, form giữ input, đóng lỗi và retry thành công | PASS |
| Hai tab dùng UI G5 | Owner tạo staff qua form, tab mới login staff; role/token riêng, tên tự cập nhật; rename/delete thu hồi phiên | PASS nền G5; chưa phải approval demo G6 |
| UX mở chi tiết desktop | 1366×650, 1280×720: staff/customer fields và actions trong viewport; main scroll đúng card/clamp; history, header/logo còn thấy | PASS |
| Pixel SC145–SC162 | Chưa có full baseline/mask được nghiệm thu | NOT RUN |
| A/B/E và request-sync D G6 | Chưa có module thu mua/phê duyệt G6 | NOT RUN |

Source test: `tests/unit/staff-accounts.test.ts`, `tests/e2e/staff.spec.ts`. Hồi quy gồm dữ liệu G2, auth G3, reference data G4, shell/migration/offline lỗi và các viewport có sẵn. Không thay fixture test thành dữ liệu thật của người dùng, không dùng hai context riêng để chứng minh chia sẻ DB.

[Báo cáo](REPORT_PHASE_5.md), [manifest](EVIDENCE_MANIFEST.json), [hợp đồng identity](IDENTITY_CONTRACT.md).
