# G7–T02…T06 — sửa hàng, chu kỳ và lịch xử lý tự động

> Chủ dự án nghiệm thu13/11/2026: phần T01 đã triển khai và T02–T06 **ACCEPTED_USER** theo [biên bản](ACCEPTANCE_2026_11_13.md). Barcode T01 còn thiếu; không ghi toàn G7 DONE hoặc đóng audit/G6 UI. Công việc tiếp đã giao: [G8-T01 phần độc lập](../phase8/COPILOT_T01_TASK.md). Trạng thái chờ review phía dưới là mốc trước nghiệm thu.

## Revalidation khi tiếp quản

Chạy lại trên worktree hiện tại, không chỉnh application source: lint PASS, typecheck PASS, 298/298 unit PASS (14 file), production build PASS/exit0, full Chromium **107/107 PASS**, 0 fail/skip. Lệnh và log được lưu tại [evidence/handoff-current](evidence/handoff-current/). Chromium chạy trên `dist` vừa build, gồm G7 T01–T06 và hồi quy G2–G6. `git diff --check` PASS.

G7-focused trong suite: 35 unit inventory + 14 unit scheduler; 4 Chromium inventory/T01 + 4 edit/reset T02–T03 + 3 scheduler/monitor T04–T06. Ảnh 1440×900: [Hàng hóa](evidence/handoff-current/inventory-owner-1440x900.png), [Thu mua](evidence/handoff-current/purchases-list-1440x900.png), [monitor](evidence/handoff-current/discount-monitor-owner-1440x900.png). Build có cảnh báo bundle 502.98 kB vượt ngưỡng500 kB; không nâng ngưỡng và không coi là đạt NFR tốc độ. Audit read-only cập nhật sau đó xác nhận 13 package findings trên toàn dependency tree và 3 package findings production-only; log, phương án và trạng thái FAIL/OPEN nằm trong [báo cáo G7](REPORT_PHASE_7.md).

T02–T06 vẫn **PENDING REVIEW**, không DONE; barcode T01 và nghiệm thu người dùng/visual vẫn mở. Các kết quả ngày12/11 bên dưới là evidence cũ và lịch sử lỗi/sửa; chúng không bị ghi đè bởi lượt xác minh mới.

Ngày12/11/2026. **Đã triển khai, PENDING REVIEW; không DONE G6/G7**. T01 còn luồng barcode chờ xác nhận. Nguồn quyết định mới: [Decision Log](DECISION_LOG.md), được ghi **trước** coding công thức/chu kỳ và trước kích hoạt nhánh tăng lên20.000đ.

## Quyết định đã áp dụng

- Q10: Chủ và Nhân viên thực sự đổi giá đều reset GiaGocChuKyGiam=giá mới, NgayBatDauChuKyGiam=ngày sửa theo lịch Việt Nam; giữ NgayNhapKho. Đổi tên/thuộc tính mà giữ giá không reset chu kỳ.
- Q12 (riêng giảm30% G7): `GiaBanSauGiam = GiaGocChuKyGiam×0,70`, nearest/half-up đến đồng nguyên, dùng BigInt chính xác. Không giảm trên giá đã giảm, không nhân lặp hàng ngày. Không suy xác nhận này sang ưu đãi20% G8.
- P10: từ45 ngày luôn đặt chính xác20.000đ, **kể cả tăng từ giá thấp hơn**; có xác nhận riêng của chủ dự án trước thực thi. Không dùng min().

## T02/T03 — giao dịch sửa một món

Form theo SC068–073/260–265, dùng FormDialog/Field/ResultDialog chung: tên, loại, thương hiệu, độ mới và giá; mã/ngày nhập/trạng thái chỉ đọc. Danh mục độ mới dùng mapping chung Mới/Tốt/Khá; không diễn giải lại phần trăm/legacy. Không sửa sản phẩm đã bán hoặc trạng thái chưa được mapping.

`InventoryService.update` kiểm session và `inventory.update` trong transaction, expectedVersion, trạng thái hiện tại và dữ liệu cố định. Metadata thuộc tính theo MaSP dùng `appMetadata` hiện có; schema strict và kiểm reverse FK trong validator. Không đổi khung giá dùng chung, MaHDTM/MaKhungGia, cost/provenance hoặc line/invoice snapshots. Tên/giá vẫn ở sanPham; thuộc tính hiện hành riêng không viết đè lịch sử.

Một transaction ghi product/attributes/cycle/version/receipt/audit. CAS chặn stale; cùng operationId/payload replay một lần, payload khác bị từ chối; guard kiểm lại cả replay khi session bị thu hồi. Lỗi metadata/audit rollback tất cả. UI chặn double submit bằng ref và busy; chỉ báo thành công sau commit thật. Lỗi ghi giữ form để thử lại; stale đóng thông báo thì lấy dữ liệu mới và trở lại form, không ghi đè lần sửa của tab khác. Nếu sản phẩm đã bán thì không tiếp tục editor.

## T04/T05 — runner thực trong trình duyệt

- Tự kiểm khi web mở, pageshow/focus/visibility và hẹn mốc00:00 giờ Việt Nam. Không backend/cron/Supabase, không nút Chạy ngay. Khi tất cả tab đóng, không có JS chạy; mở lại mới xử lý bù.
- Ưu tiên45 khi đã vượt45 và chưa áp dụng; không tạo mốc30 giả trong thời gian web đóng. Mỗi ứng dụng có khóa duy nhất `[MaSP,cycleStartedOn,milestone]`.
- Claim/lease trong IndexedDB dùng metadata dùng chung; nhiều tab không giữ lock riêng trong RAM làm nguồn sự thật. Mỗi sản phẩm kiểm lại trạng thái/chu kỳ/version trong write transaction, rồi ghi giá/mốc/version/audit/progress nguyên tử. Hàng bán giữ giá; trạng thái legacy chưa được mapping báo lỗi và giữ nguyên, không tự hiểu mã cũ1/2.
- Lease được gia hạn trong transaction. Lượt gián đoạn có progress bền; sau expiry tab khác đánh dấu gián đoạn, chỉ xử lý mốc còn thiếu. Lỗi ghi không tạo marker thành công, giá/version/audit rollback. Lượt lỗi không có daily success receipt; mở/focus sau đó có thể thử lại. Không tạo event hoặc giá thành công giả.
- `scheduledFor` của mốc là ngày chu kỳ+mốc; `executedAt` là lúc thực thi thật. Run log có thời gian bắt đầu/kết thúc, trạng thái, số đã xét/cập nhật/giữ/lỗi và ghi chú. Số thứ tự transaction xác định lượt gần nhất khi timestamp bằng nhau; không bịa thêm thời gian. Nhật ký cũ chưa có sequence được đọc với thứ tự0, không viết lại executedAt.
- Đã kiểm receipt↔journal/key, không che journal thiếu bằng fallback. Runner qua nửa đêm lên lịch kiểm lại ngày mới ngay khi hoàn tất, không bỏ qua cửa sổ mới.

Scheduler là tác vụ hệ thống nội bộ; audit không giả danh Chủ/Nhân viên. UI chỉ được facade đọc có kiểm `discounts.read`. Không thêm quyền system-run hoặc endpoint chạy tay. Phân quyền/frontend/local vẫn là kiểm soát demo theo kiến trúc đã duyệt.

## T06 — màn theo dõi

Theo SC074/266: năm chỉ số, chính sách30/45, tần suất/giờ/lượt kế tiếp/trạng thái lịch, lịch sử lượt chạy và nhật ký giá. Hai vai trò đọc chung dữ liệu thực, cập nhật qua subscription. Nền be/đen, bảng/nhãn và sidebar giữ hệ component hiện có; không thêm retry/run button ngoài Figma. Bảng log theo thiết kế riêng, cuộn trang tự nhiên, không có vùng cuộn dọc bên trong bảng.

## Kết quả kiểm thử

| Lượt/kiểm tra | Kết quả / bằng chứng tại evidence/t02-t06 |
|---|---|
| Unit/integration tập trung ban đầu | 48 PASS: inventory35 + scheduler13; sau bổ sung kiểm journal và sửa lỗi thứ tự, scheduler14/14 PASS |
| Full unit đầu | **297 PASS / 1 FAIL / 0 SKIP**; giữ `vitest-first-full.json`, `checks-first-full.json` |
| Nguyên nhân FAIL unit | Hai run cùng timestamp bị sắp theo UUID nên có thể hiển thị lượt lỗi cũ làm gần nhất. Đã sửa source bằng sequence cấp trong claim transaction, giữ nguyên assertion và timestamp |
| Full unit cuối | **298/298 PASS**, 0FAIL/SKIP,14 file; `vitest.json`, `unit-full.log` |
| Lint/typecheck/build | PASS exit0; `checks.json`, các log tương ứng |
| Chromium tập trung đầu | 5PASS/2FAIL; giữ `chromium-focused-first.log`. Ba ca scheduler tự động PASS. Hai ca form bị khuất Lưu tại1366×768 do kế thừa height70px |
| Sửa lỗi form và kiểm lại | Scoped height44px theo tỷ lệ source; bốn ca edit PASS, `editor-focused.log`; không bỏ assertion viewport. Lỗi field được xóa khi người dùng sửa giá trị |
| Full Chromium cuối | Chốt từ `playwright.json`/`chromium-full.log`/`execution.json` sau khi lệnh kết thúc; không báo PASS khi đang chạy |
| Barcode / máy quét vật lý | **BLOCKED/NOT RUN**; không dùng test giá/scheduler thay cho kiểm scan |
| Audit / nghiệm thu | Audit read-only mới: 13 toàn tree, 3 production-only; FAIL/OPEN, chưa sửa package. Pixel/nghiệm thu người dùng chưa xác nhận |

### UC/BR ↔ bằng chứng

| Nguồn | Unit/integration | Chromium/UI/native |
|---|---|---|
| UC_2.2, BR-UC2-05/06 | Fixed fields, sold, role/session/revoked, validation, attrs từng món, lịch sử không đổi | Hai role nhập thật, Hủy không ghi, validation, readonly fields, sửa/reload |
| BR-UC2-08 | Hai connection cùng expectedVersion một thắng; stale không overwrite, rollback và replay | Hai form thực ở hai tab; conflict → mở dữ liệu mới trong form; native write fault và retry |
| Q10 / reset cycle | Owner/staff đổi giá reset base/date, giữ ngày nhập và snapshot; giữ giá không reset | UI hai role, kiểm native product/cycle/operations; double submit chỉ một receipt |
| UC_2.3, BR-UC2-07/09 | Biên29/30/44/45/80, giá gốc, half-up, không compound, mốc duy nhất, P10 dưới20k | Tạo hàng bằng UI ở clock kiểm thử, đóng web thật, mở lại sau60 ngày; mốc45 trước30, tăng10k→20k |
| AD08 / giờVN | Date/calendar helpers, lease/run/receipt/progress | App đang mở chạy qua nửa đêm VN không nút chạy; hai tab native cùng mở, một run, một event/món/mốc |
| Toàn vẹn / lỗi / legacy | Rollback price/marker/version/audit, interrupted claim recovery, legacy không diễn giải lại, journal thiếu bị chặn | Native scheduler add-fault: không đổi giá/event, ghi lỗi thật; mở tab khác phục hồi, không trùng; cùng monitor cho Chủ/Nhân viên |
| Regression | Full G2–G6/T01 và inventory/scheduler mới | Full Chromium giữ mọi test cũ, không skip/bỏ bài thất bại |

Clock trong test là **clock kiểm thử**, không phải bằng chứng tác vụ đã chạy trên dữ liệu người dùng từ tháng01 đến tháng03. UI nghiệp vụ tạo/hoàn tất/sửa được thực thi thật trong profile riêng; probes IndexedDB chỉ đọc oracle. Không ghi request/decision/price mẫu thay thao tác mục tiêu.

## File và kiến trúc

Mới: `src/domain/inventory.ts`, `src/services/discount-scheduler.ts`, `src/features/inventory/InventoryEditForm.tsx`, `DiscountMonitor.tsx`; `tests/unit/discount-scheduler.test.ts`, `tests/e2e/inventory-helpers.ts`, `inventory-edit.spec.ts`, `discount-scheduler.spec.ts`.

Sửa: `src/services/inventory.ts`, `src/repositories/constraints.ts`, `src/features/inventory/InventoryPages.tsx`, auth context/provider, router/layout, `src/index.css`, `tests/unit/inventory.test.ts`; Decision Log, plan/review/report/Open Issues và traceability.

**Không đổi schema v4/27 store, PK/FK legacy, package/lock, workflow hoặc kiến trúc local.** Metadata mới có schema/FK và transaction trong store hiện có. Nhánh coco/phase-7, HEAD22d3fbdd7cee0db717c62e003c5f4075f3707712; không commit/push/deploy, không reset dữ liệu trình duyệt. Working tree cũ được giữ nguyên.

Build có cảnh báo bundle vượt ngưỡng500kB; không tăng ngưỡng để che warning, không coi là build FAIL hoặc NFR tốc độ đã được nghiệm thu. SLA/pixel vẫn theo gate review hiện hành.

## Demo và phần còn lại

Mở `http://127.0.0.1:5173/50K142.03.3007/#/inventory` → chọn hàng G6 thật → Sửa thông tin → Lưu → kiểm ngày nhập/giá và hóa đơn cũ. Mở tab vai trò khác cùng origin để kiểm dữ liệu và stale editor. Vào **Xử lý hàng tồn lâu** để xem log thật; không có nút chạy tay, không đổi đồng hồ máy người dùng để giả chứng cứ.

T02–T06 chờ review/nghiệm thu; T01 barcode vẫn cần trả lời. G6 vẫn PENDING REVIEW với hai trường UI và audit. Không tự DONE G7 hoặc sang G8 khi các gate này chưa xử lý.
