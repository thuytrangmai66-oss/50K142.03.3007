# G11-B01 — Targeted popup/routing fix

PO phê duyệt xử lý giới hạn G11-B01; giữ ngoại lệ G10-A01–A07. B01 đã sửa và push. Hai ca layout FAIL trên CI dưới đây là checkpoint trước phê duyệt B02; trạng thái release mới nhất xem [RELEASE_EXECUTION.md](RELEASE_EXECUTION.md), hiện BLOCKED tại regression B03, chưa deploy/smoke release mới.

## Nguyên nhân và sửa tối thiểu

- Preflight đầu: 166 PASS / 1 FAIL. Tái hiện purchase-approvals.spec.ts:160 ba lần với trace: **3 FAIL / 0 PASS**, giữ assertion/timeout.
- Đã đọc helper, failure context, trace, popup và routing. Tab reject thua cuộc đua nhận CONFLICT nhưng notice không đặt closeFlow; popup lý do còn mở. Đóng notice rồi Escape chỉ đóng lý do, còn chi tiết và route /approvals/<id>. Không tự kết luận flaky.
- Chỉ sửa src/features/approvals/ApprovalsPage.tsx: thêm closeFlow: conflict. Đóng notice bằng X/Escape sử dụng callback hiện có để navigate /approvals và unmount cả luồng popup. Thông báo vẫn là lỗi; đóng popup không gọi lại decide.
- Lỗi ghi dữ liệu/phát thông báo không phải CONFLICT vẫn giữ form để retry. Không đổi common dialog, Figma, business rule, schema, service, transaction, rollback, concurrency hoặc test.

## Bằng chứng sau sửa

| Lượt | Kết quả |
|---|---|
| Toàn bộ 11 ca approval ×3, trace on | **33 PASS / 0 FAIL / 0 SKIP**, 167,96 giây |
| Lint / typecheck / production build | PASS; không che cảnh báo chunk lớn |
| Full unit/integration | **538 PASS / 0 FAIL / 0 SKIP**, 29 file, 191,53 giây |
| Full Chromium local | **167 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, 614,67 giây |

Targeted gồm approve/reject, race, X/Escape, về danh sách, giữ filter, không overlay, mở yêu cầu khác không reload và rollback/retry. 33 lượt là 11 case lặp ba lần, không cộng thành 33 case mới. [Execution/guard](evidence/b01-verification.json); trace/JSON/log local tại .git/coco-release-recovery/2026-11-14T15-30-53-634Z/b01-{before,targeted}*.

## Sau push

Đã push e0fd2a73b8c05b3e70cfb496a1d6ead4326967fd lên origin/main. [CI](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/runs/43615453782): unit 538 PASS, Chromium 165 PASS / 2 FAIL; hai FAIL thuộc purchase-editor-figma.spec.ts, delta X tiêu đề 1,4 px > assertion 1 px, không có B01 trong danh sách FAIL.

Không sửa/bypass hai ca ngoài phạm vi. Deploy SKIPPED, smoke NOT RUN; **release vẫn BLOCKED**. [Báo cáo release](RELEASE_EXECUTION.md). Báo cáo sau CI cập nhật local, chưa push thêm; không coi B01 đã sửa là toàn bộ release PASS.
