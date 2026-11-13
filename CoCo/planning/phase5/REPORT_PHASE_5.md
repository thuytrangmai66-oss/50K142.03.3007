# Báo cáo G5 — tài khoản nhân viên và mở chi tiết trên web

> Rà soát bổ sung 11/11/2026 theo yêu cầu xác định giai đoạn thực tế: đã phát hiện và sửa các control/trạng thái UI còn thiếu của G5, bổ sung kiểm thử lỗi/rollback/retry và bộ ảnh SC145–162. Kết quả mới nhất, file sửa, điều kiện chuyển G6 và hướng dẫn demo tại [REVIEW_COMPLETION.md](REVIEW_COMPLETION.md). Các số 88/29 phía dưới là mốc bàn giao G5 ban đầu, được giữ làm lịch sử; không dùng làm số kiểm thử hiện tại.

Kết quả hiện tại: **101/101 unit/integration, 52/52 Chromium và 5/5 static audit PASS**; lint/typecheck/build exit 0. Đã đối chiếu thủ công 18/18 trạng thái nhân viên, sửa password toggle/icon lỗi/popup đọc và nền thông báo thành công. Pixel baseline tự động chưa chạy; G6 chưa code, đang cần quyết định [P03/P04/Q20](../phase6/DATA_CONTRACT_REVIEW.md). G5 tiếp tục READY FOR REVIEW, chưa tự DONE.

Ngày 11/11/2026. **READY FOR REVIEW**. Người dùng yêu cầu tiếp tục G5 và chốt ưu tiên web trên máy tính, không cần phát triển thêm giao diện điện thoại. Giữ G4 → G5 → G6, không commit/push/merge/deploy hoặc xóa dữ liệu đang có.

## Đã sửa trải nghiệm xem chi tiết

- Desktop giữ sidebar và header trong viewport; vùng nội dung cuộn riêng, không kéo mất cả thanh điều hướng.
- Khi vào chi tiết khách/bracket/staff hoặc lịch sử, chờ card thật tải xong rồi tự đưa card vào vùng đọc và focus heading. Không cần tự kéo qua phần tìm kiếm để tìm nội dung.
- Chuyển về danh sách đặt lại vị trí đầu vùng nội dung. Chỉ thực hiện theo navigation, không nhảy vị trí mỗi khi live data cập nhật hoặc mở/đóng modal.
- `useResource` giữ card hiện tại trong lúc refresh cùng query; đổi query/record thì không lộ dữ liệu cũ sang record mới. Tránh unmount/skeleton khiến mất vị trí đọc khi tab khác ghi dữ liệu.
- Chỉ bổ sung behavior này cho desktop ≥761px. Không thêm thiết kế/tính năng mobile; các case viewport cũ vẫn chạy hồi quy.

## Task G5

| Task | Kết quả code/kiểm thử |
|---|---|
| G5-T01 tạo account | UI bốn trường theo SC158, role luôn staff, PBKDF2 helper G3; atomic employee/account/security/alias/audit/receipt, không seed |
| G5-T02 đọc | Owner-only list/detail; mã/tên/phone/username, không credential material trong DTO/UI; empty/error/retry |
| G5-T03 sửa/rename | Sửa ba trường theo SC152; MaNV và route ổn định, rename/update FK/alias/session cùng transaction, CAS chống form cũ |
| G5-T04 xóa | Confirm/Cancel; inactive và revoke session, giữ lịch sử/employee/FK; không cho sửa/xóa chủ bằng staff module |
| G5-T05 lỗi/quyền/race | Duplicate phone/user, create race, owner form stale, audit rollback, DB failure UI retry, staff direct service/route denial, hai tab thực |

Phương án P08 chi tiết tại [IDENTITY_CONTRACT.md](IDENTITY_CONTRACT.md). Không cần đổi schema: DB vẫn v3, native 30, 21 store. Không tự đổi mã độ mới, trạng thái hóa đơn hoặc nghiệp vụ thu mua.

## Kết quả mốc bàn giao G5 ban đầu — lịch sử

| Kiểm tra | Kết quả |
|---|---|
| Vitest, 5 file | **88/88 PASS**: giữ 68 G2/G3/G4 + 20 G5, không skip |
| Chromium | **29/29 PASS**: giữ 23 case trước + 6 case G5/desktop, không skip |
| Lint/typecheck/build | PASS, exit 0 |
| Static audit | **5/5 PASS**, evidence G5 riêng; không Supabase/endpoint ngoài/storage cũ |
| Desktop landing | 1366×650 và 1280×720: heading/field và nút sửa/xóa nằm trong viewport, vị trí scroll đúng card, sidebar/logo/header vẫn thấy |
| Source pixel comparison toàn bộ SC | NOT RUN; ảnh local đối chiếu thủ công chưa là full pixel baseline được duyệt |
| Thu mua/phê duyệt A/B/E G6 | NOT RUN; chưa triển khai module G6 |
| CI/Pages cho thay đổi G5 | NOT RUN; chưa commit/push/deploy |

Lệnh: `npm run lint`, `npm run typecheck`, `npm test`, `node scripts/audit-phase1.mjs`, `npm run build`, `CI=true npm run test:e2e -- --reporter=line --global-timeout=180000` (PowerShell đặt `$env:CI='true'` trước lệnh). Node/npm/browser dùng môi trường đã cài của dự án; mọi test ở DB/context riêng, không thử xóa profile Chrome người dùng.

Unit G5: role injection vẫn tạo staff; read DTO không secret/không ghi; chín input boundary; duplicate owner phone/username; create race; profile-only giữ phiên; rename giữ MaNV/invoice/member/notification, audit actor cũ và alias, login cũ bị chặn; collision; soft delete/cancel; mọi staff CRUD bị từ chối; rollback nguyên DB/aliases/sessions khi audit fail ở create/rename/delete.

E2E G5 dùng **tài khoản tạo qua UI thật**, không addStaffFixture: tạo/validate/cancel/duplicate, detail không password; hai tab owner/staff giữ token độc lập; staff không vào staff route; owner sửa tên thì staff tự cập nhật, rename thì staff về login, login mới được, owner xóa thì staff bị thu hồi không F5; stale form; storage write fail/retry; mở customer/staff/history trên desktop không phải tự kéo để thấy nội dung.

## Bằng chứng và file

- [Manifest code/test/ảnh](EVIDENCE_MANIFEST.json) ghi hash và thay đổi so với snapshot G4, không giả SHA của code chưa commit.
- [Desktop — chi tiết khách](evidence/desktop-customer.png), [desktop — chi tiết nhân viên](evidence/desktop-staff.png), [chủ — danh sách nhân viên](evidence/owner-staff-list.png), [chủ — chi tiết](evidence/owner-staff-detail.png), [nhân viên đăng nhập từ account UI](evidence/staff-session.png).
- Mới: `src/services/staff-accounts.ts`, `src/features/staff/StaffForm.tsx`, `StaffPages.tsx`, `tests/unit/staff-accounts.test.ts`, `tests/e2e/staff.spec.ts`.
- Sửa: `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx`, `src/index.css`, `src/features/reference-data/use-resource.ts`, `src/features/auth/{AuthProvider,context}`, script audit và các tài liệu kế hoạch/truy vết.

Nhánh `coco/phase-5-staff`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`. Giữ nguyên các thay đổi G3/G4 chưa commit, CODEX và dữ liệu người dùng; không stage/commit/push, không thay remote/Git/Pages/workflow/dependency.

## Xem và demo

Mở http://127.0.0.1:5173/50K142.03.3007/ (Terminal `cd D:\50K142-NEW\CoCo`, `npm run dev`; tải lại một lần nếu tab còn mã cũ). Chủ → Nhân viên → Tạo tài khoản → tự nhập thông tin/password thật → Lưu. Mở tab mới cùng URL, đăng nhập staff vừa tạo. Staff chưa có Thu mua ở G5; hiện dùng Home/Khách hàng.

Hai tab có thể thử owner sửa tên, staff thấy tên mới không F5; đổi username thì staff phải login lại bằng tên mới; xóa thì staff mất phiên và không login được. Đây là demo quản lý account/phiên, không gọi đó là demo thu mua/phê duyệt G6. [Gate A–F G6](../phase6/DEMO_ACCEPTANCE.md) vẫn bắt buộc sau khi xử lý dependency P03/P04/P05 và hợp đồng trạng thái.

## Giới hạn và bước tiếp

G5 READY FOR REVIEW, chưa tự DONE hoặc triển khai G6. Full visual và mọi variant lỗi chưa được nghiệm thu pixel; không công bố phần trăm giống Figma. Username/phone của account xóa còn giữ để bảo toàn unique/history; không tự thêm restore/reset password chưa có trong SRS. Alias/history metadata không thay backend security. Không cần người dùng gửi lại Figma; tiếp tục dùng CODEX local.
