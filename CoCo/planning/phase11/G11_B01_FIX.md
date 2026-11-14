# G11-B01 — Targeted popup/routing fix

PO cho phép xử lý giới hạn G11-B01; giữ các ngoại lệ release G10-A01–A07. Chưa kết luận release thành công từ kết quả targeted.

## Nguyên nhân đã xác minh

- Preflight cũ: 166 PASS / 1 FAIL. Tái hiện lại đúng test `purchase-approvals.spec.ts:160`, giữ nguyên assertion/timeout, bật trace và lặp 3 lần: **3 FAIL / 0 PASS**.
- Đã đọc `purchase-helpers.ts`, error context, các event trong trace và source popup/routing. Khi approve thắng, tab reject thua nhận `RepositoryError('CONFLICT')`; nhánh catch chỉ tạo notice lỗi, không đặt `closeFlow`. `rejectOpen` còn mở nên đóng notice rồi Escape chỉ đóng popup lý do; popup chi tiết và route `#/approvals/<id>` còn giữ. Đây là lỗi source theo outcome của cuộc đua, không tự kết luận flaky.
- Các assertion dữ liệu chạy trước lỗi URL đã qua: một quyết định, một operation/notice, trạng thái dòng thống nhất, không sinh hóa đơn/sản phẩm. Không sửa tầng transaction để xử lý lỗi UI.

## Minimal fix

Chỉ `src/features/approvals/ApprovalsPage.tsx`: đặt `closeFlow: conflict` cho notice lỗi quyết định. Đóng notice bằng X hoặc Escape sử dụng callback sẵn có để navigate `/approvals` với replace và unmount toàn bộ popup lồng nhau. Thông báo vẫn là lỗi, không giả thành công; không gọi lại decide khi đóng. Lỗi ghi dữ liệu/phát thông báo không phải CONFLICT vẫn giữ form để thử lại như trước.

Không sửa common dialog, thiết kế, schema, business rule, transaction/rollback/concurrency, service hoặc test. Không nới timeout/skip/assertion. Main và candidate dùng cùng một bản source đã sửa.

## Kiểm chứng

| Lượt | Kết quả |
|---|---|
| Trước sửa, đúng ca race ×3, trace on | 3 FAIL; giữ nguyên evidence |
| Sau sửa, toàn bộ 11 ca approval ×3, trace on | **33 PASS / 0 FAIL / 0 SKIP**, khoảng 2,8 phút |
| Lint / typecheck / production build sau sửa | PASS; build giữ cảnh báo chunk >500 kB |
| Full unit/integration sau sửa | Đang thực thi |
| Full Chromium sau sửa | Đang thực thi trên cùng bundle; chưa kết luận PASS |

33 lượt targeted bao gồm approve/reject, race hai owner, đóng X/Escape, list/filter, không overlay, mở yêu cầu tiếp theo không reload; cả lỗi ghi dữ liệu/rollback và thử lại vẫn đạt. Đây là 11 case lặp ba lần, không cộng thành 33 case mới hoặc cộng vào tổng full suite. Trace/JSON/log giữ local tại `.git/coco-release-recovery/2026-11-14T15-30-53-634Z/b01-{before,targeted}*`; không push trace hoặc dữ liệu CODEX.

Chỉ tiếp tục commit/push/CI/Pages và smoke sau khi đủ full verification và guard lịch sử sạch; không tự nghiệm thu toàn G10/G11.

Full local verification ?? PASS; [b?ng ch?ng sau s?a](evidence/b01-verification.json). Quy?n resume release do PO c?p v?n c? hi?u l?c; CI/deploy/smoke ph?i x?c minh tr?n release SHA, kh?ng l?y local PASS thay cho CI/Pages.
