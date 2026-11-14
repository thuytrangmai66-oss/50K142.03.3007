# G10-T02/T04 — Execution review BR và transaction

Ngày 14/11/2026, hoàn tất lượt cuối lúc18:26 giờ Việt Nam. **IMPLEMENTED VERIFICATION BATCH / G10 IN PROGRESS, chưa nghiệm thu hoặc mở G11.** Tiếp tục sau baseline514 unit/166 Chromium; không sửa runtime, UI, schema hoặc business rule.

## Phạm vi đã triển khai

- 12 unit phê duyệt: rollback toàn bộ store ở5 điểm ghi/retry/replay; opId không đổi payload; replay sau thu hồi phiên; approve/reject đối nghịch qua hai connection/session thực.
- 7 unit nhân viên: input sửa rỗng/sai định dạng/duplicate phone không đổi dữ liệu/credential/session; list/detail chỉ đọc toàn bộ store qua reopen.
- 5 unit bổ sung sau review: allocator invoice thu mua/bán bỏ qua ID đang tồn tại/đã issued/có version tombstone, exhaustion không ghi dở dang; balance thành viên sau365 ngày và reopen vẫn đủ điều kiện dùng50 điểm, không tự reset.
- 1 Chromium UI mới: hai tab Chủ với session độc lập, một approve/một reject đồng thời; chỉ một decision/line/notice/receipt, không invoice/stock; một success/một conflict; cả hai thoát popup về danh sách không F5 và không ghi lại.
- Review assertion đủ98 BR: [23 BR trước](TRACE_AUDIT.md), [25 BR khung giá/phê duyệt/nhân viên](APPROVAL_STAFF_BR_REVIEW.md), [50 BR thu mua/bán/báo cáo](PURCHASE_SALES_REPORT_BR_REVIEW.md). Đây là review nội dung/evidence, không chứng nhận đủ mọi nhánh/visual hoặc nghiệm thu98 BR.

## Trạng thái kiểm thử tại checkpoint

| Lượt | Kết quả thực thi |
|---|---|
| Approval targeted sau sửa injector | 52/52 PASS,25,53 giây |
| Staff targeted | 27/27 PASS,12,29 giây |
| Opposing UI targeted | 1/1 PASS,9,5 giây |
| Invoice/expiry targeted `-t G10` | 5 PASS,53 ca khác bị filter khỏi lượt targeted; **không** coi là full gate hoặc báo53 PASS |
| Full đầu trước bổ sung5 gap cuối | 533/533 PASS,28 file,160,36 giây |
| Full unit cuối chứa đủ24 ca mới | **538 PASS / 0 FAIL / 0 SKIP / 0 TODO**,28 file,198,30 giây |
| Full Chromium167 ca | **167 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**,620,12 giây |
| Lint/typecheck | PASS sau sửa định dạng/narrowing test; không nới TypeScript strict |
| Build cuối | **PASS**, chạy sau Chromium;22 file bundle có hash giống hệt bản browser đã chạy |
| Visual local8 | **8 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**,55,27 giây, chạy lại sau build; không đổi baseline/ngưỡng/mask |
| Static local-only audit | Không chạy lại; tái dùng baseline5/5 có cùng source/dependency/config inputs, tránh ghi lại báo cáo lịch sử phase5 |

Lượt đầu của matrix fault injection có2 FAIL vì spy dùng `db.table(name)` khác typed handle `db.operations/db.auditEntries` mà service gọi. Đã sửa injector đúng handle và thêm assertion phải được gọi1 lần; yêu cầu reject/rollback không đổi. Lint ban đầu phát hiện newline `it.each` và TypeScript phát hiện snapshot unknown/union reason chưa narrow; sửa format/parse qua schema đã có, không bỏ test, thay expected business result hoặc giảm mức kiểm tra.

## Giữ tính hợp lệ của regression

Full Chromium chạy trên bundle cố định; không build trong lúc browser đang dùng dist. Trong khi Chromium chạy, chỉ thêm5 unit vào `purchase-finalization.test.ts`/`sale-payment.test.ts`; source runtime, config và E2E không đổi. Full unit cuối đã kiểm đủ538 ca. Manifest191 file của lượt unit cuối không đổi; manifest Chromium ghi rõ2 unit file thay đổi có chủ đích,0 thay đổi runtime/E2E. Build sau đó giữ nguyên hash cả22 file; không báo191 file bất biến qua toàn bộ lượt một cách sai lệch.

[Execution và guard](evidence/br-review/final/execution.json), [538 ca unit](evidence/br-review/final/unit-tests.json), [167 ca Chromium](evidence/br-review/final/chromium-tests.json), [8 visual](evidence/br-review/final/local-visual-tests.json), [ảnh/hash](evidence/br-review/final/screenshots.json). Log UTF-8 ở cùng thư mục, gồm cả lượt injector sai trước sửa. Screenshot sau race: [danh sách Chủ, không còn popup chặn](evidence/br-review/final/owner-opposing-decisions.png).

Các file sửa trong lượt: `tests/unit/purchase-approvals.test.ts`, `staff-accounts.test.ts`, `purchase-finalization.test.ts`, `sale-payment.test.ts` và `tests/e2e/purchase-approvals.spec.ts`; thêm hai review nhóm BR, cập nhật ledger98 BR, execution/checklist/master plan. Không sửa source sản phẩm hoặc workflow. Kết quả PASS chỉ cho các ca đã chạy; không cộng các targeted run vào full.

Những test target được đếm lại trong full không cộng vào số ca duy nhất. Không có `test.skip` để loại lỗi; filter của lượt targeted không thay bộ gate full. Các file ngoài phạm vi được giữ nguyên, staging trống; chưa commit/push/deploy phase còn thiếu gate.

## Còn lại

Visual/action-state297 SC, review đầy đủ main/alternative/error của27 UC, một số UI negative field cases, các ngoại lệ SRS/Figma và Q21/SLA/hardware/lint audit vẫn mở. Invoice collision và points non-expiry đã có5 test PASS trong full538. Không dùng việc review98 assertion hoặc tổng test để miễn trừ các phần này. Chưa stage/commit/push/deploy vì chưa khép phạm vi/gate toàn G10; quyền Git đã có theo AGENTS, không cần xin lại.

Local vẫn là `npm.cmd run dev` tại `D:\50K142-NEW\CoCo`, mở `http://127.0.0.1:5173/50K142.03.3007/`; hướng dẫn demo và giới hạn dữ liệu trong README không thay đổi.

Fetch cuối: nhánh main, HEAD và origin/main cùng `1fd4ad4a04e3b870a1c673fd7abd344af50dea69`,0 ahead/behind; staging trống. Không tự commit/push phase đang thiếu gate, không đổi Git config hoặc workflow.

## Kinh nghiệm cho lượt sau

Gom các gap của nhóm BR trước lượt full; chạy lint/typecheck sớm cho test mới. Fault injection phải dùng đúng handle mà service gọi và xác nhận spy đã chạy. Giữ runtime/bundle cố định suốt Chromium; nếu chỉ thêm unit, chạy full unit mới và so hash runtime để tránh lặp E2E không có thay đổi đầu vào. Không rút ngắn bằng bỏ nhánh, nới oracle hoặc dùng tổng PASS làm nghiệm thu.
