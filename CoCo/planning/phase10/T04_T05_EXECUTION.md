# G10-T04/T05 — Kiểm thử bổ sung và xử lý lỗi dữ liệu lớn

Ngày 14/11/2026. **IMPLEMENTED / full regression PASS / PENDING REVIEW.** Không tự đóng G10 hoặc các ngoại lệ SRS/Figma.

## Phạm vi đã triển khai

- `phase10-security.spec.ts`: hai vai trò tạo hồ sơ có tên HTML như `<svg onload=alert(1)>`; danh sách/chi tiết/lịch sử/reload giữ nguyên literal, không có markup sự kiện hoặc JavaScript dialog. Luồng chủ từ chối với lý do HTML lưu nguyên chuỗi và nhân viên xem được qua tab riêng; kiểm không tạo hóa đơn/sản phẩm, không đổi graph khi chỉ đọc.
- `phase10-finalize-benchmark.spec.ts`: 4 ca Chủ/Nhân viên × 25/1.000 sản phẩm ban đầu. Toàn bộ hàng/khách/hóa đơn/provenance được tạo qua UI thật. Mỗi ca có 1 warmup +5 mẫu cho thu mua và bán tiền mặt; sau mỗi vòng thêm một món rồi bán một món. Metadata ghi số record trước mỗi thao tác, không giả dataset giữ nguyên kích thước. Đối soát 7 hóa đơn thu mua, 6 hóa đơn bán, đủ receipt/audit và graph sau reload.
- `phase10-integrity.spec.ts`: trên graph 1.000 sản phẩm, lỗi native ở ghi audit cuối phải rollback toàn bộ store; giữ editor để thử lại, retry chỉ tạo đúng một giao dịch mới và đủ provenance/cost/receipt/audit. Không xóa dữ liệu người dùng.
- Unit bổ sung: không tái dùng snapshot FK sau lần ghi tiếp trong cùng transaction; không tái dùng mã sản phẩm đã cấp, tombstone version hoặc mã trùng trong một batch; hết 16 lần cấp mã phải rollback hóa đơn/draft/reservation.
- Audit evidence đọc thêm JSON unit thực thi: phân biệt PASS/FAIL/SKIP/NOT RUN, bỏ đường dẫn máy và không xuất failure message thô. Report thành công/thất bại được giữ riêng, không dùng vài assertion PASS để che suite/report lỗi.

## Lỗi và sửa nguyên nhân

### 1. Kiểm FK đọc nối tiếp

Lượt focused đầu: **5 PASS / 2 FAIL**, hai ca 1.000 sản phẩm dừng khi thêm hàng vào đơn bán; input còn disabled sau assertion mặc định 5 giây. Đường đọc giao dịch gọi `validateReferences` giữ transaction đọc qua nhiều lượt get nối tiếp theo sản phẩm. Đây là lỗi/độ chậm được phát hiện trong phép thử, không phải quyết định rằng SRS có SLA 5 giây.

`constraints.ts` hiện đọc trạng thái cuối transaction theo lô, tra FK/reverse-FK/composite key qua map chỉ tồn tại trong một lần gọi. Cả kiểm provenance/snapshot/cardinality và nhánh legacy vẫn giữ nguyên; không cache qua transaction, không bỏ validation hoặc đổi mapping số.

### 2. Lỗi trung gian do tối ưu và cách khắc phục

Sau tối ưu đọc đầu tiên, ca 1.000 món phát hiện **PrematureCommitError**: có dữ liệu hoàn tất nhưng promise báo lỗi, thông báo UI bị che bởi trạng thái đã hoàn tất. Log chẩn đoán tạm đã xác định vòng lặp `await` hàm kiểm tra thuần trên snapshot làm transaction kết thúc trước receipt/audit. Đây là lỗi ở bản tối ưu trung gian, không được tính PASS hoặc đưa vào bàn giao.

Đã tách phép kiểm trên snapshot thành hàm **đồng bộ**, giữ mọi kiểm tra và chỉ await thao tác IndexedDB thật. Log chẩn đoán đã gỡ; `PurchaseEditor.tsx` không có thay đổi cuối. Ghi sản phẩm/cost/provenance độc lập được xếp cùng transaction, cấp mã dựa trên tập key hiện tại và tombstone, vẫn giới hạn 16 lần/ID. Bất kỳ lỗi add/FK cuối đều abort toàn bộ; không dùng reload, delay hoặc nới assertion để làm xanh.

Không sửa test fault injection hiện có để né API: các lệnh `.add` và native add vẫn được giữ, nên các test rollback cũ tiếp tục kiểm lỗi ghi thực tế.

## Kết quả đã thực thi

| Lượt | Kết quả | Bằng chứng |
|---|---|---|
| Baseline trước sửa, full cũ | 495 unit /156 Chromium PASS | Báo cáo G10 trước lượt này; không chứng nhận source mới |
| Focused mới lần đầu | 5 PASS /2 FAIL | `evidence/t04-t05/initial/` |
| Focused sau tối ưu trung gian | Vẫn 5 PASS /2 FAIL, khác điểm lỗi | `after-fk-first-run/`, `queued-first-run/` |
| Chẩn đoán 1.000 món | FAIL, xác định PrematureCommitError | `transaction-diagnostic.log` |
| Focused unit FK/finalize | 83/83 PASS | Log trong TEMP, được tổng hợp lại bằng full unit |
| Focused sau sửa đồng bộ | **8/8 Chromium PASS**, gồm security/benchmark/SC105 | `evidence/t04-t05/focused/` |
| Native rollback graph 1.000 món | **1/1 Chromium PASS**, 8,0 giây | `evidence/t04-t05/large-rollback/` |
| Full unit hiện tại | **501/501 PASS**, 27 file, 131,04 giây; 0 FAIL/SKIP/TODO | [Unit JSON đã lọc](evidence/audit/unit-executed-tests.json), [log](evidence/t04-t05/full/full-unit.log) |
| Full Chromium hiện tại | **164/164 PASS**, 0 FAIL/SKIP/FLAKY; 579,31 giây (~9,7 phút) | [Ca thực thi](evidence/audit/executed-tests.json), [execution/hash guard](evidence/t04-t05/full/execution.json), [ảnh/JSON/log](evidence/t04-t05/full) |

Không cộng các lượt rerun vào số test duy nhất. Lượt đầu bị ngắt để sửa selector chờ danh sách đúng markup được ghi INCOMPLETE, không PASS.

Lint/typecheck/build PASS, static audit 5/5 PASS. 193 file trong guard không đổi suốt full regression; không có log chẩn đoán tạm trong source. Build còn cảnh báo chunk >500 kB như đã ghi, không nới ngưỡng để giấu cảnh báo.

## Liên kết tiêu chí với ca mới

| Phạm vi | Ca/test file | Oracle và kết quả cuối |
|---|---|---|
| UC_4.1/4.4, SECURITY-NFR-01 | `phase10-security.spec.ts`, 2 vai trò tên HTML | Literal được lưu/hiển thị đúng, không DOM handler hoặc JS dialog; xem/lịch sử/reload không ghi dữ liệu; 2 PASS |
| UC_6, BR-UC6-04/05/06 | `phase10-security.spec.ts`, lý do HTML | Nhập/lưu/lưu trạng thái và nhận lý do đúng giữa hai tab, không thực thi mã hoặc tạo invoice/stock; 1 PASS |
| UC_1.1/UC_3.1, PERFORMANCE-NFR-02 | `phase10-finalize-benchmark.spec.ts`, 4 tổ hợp role/dataset | Mỗi hóa đơn hoàn tất có đủ graph/receipt/audit, giá 104.007đ theo rule cũ, 7 mua/6 bán và reload ổn định; 4 PASS; chưa nghiệm thu SLA |
| BR-UC1-09/10/17, TRACEABILITY-NFR-01 | `phase10-integrity.spec.ts` | Audit cuối lỗi thì mọi store rollback, retry một lần/không trùng; 1 PASS; không tự chứng nhận mọi nhánh BR |
| BR-UC1-09/10, FK/reverse-FK/transaction | Unit mới trong `purchase-finalization.test.ts`/`purchase-candidate.test.ts` | Chống tái dùng ID, hết retry rollback, phát hiện sửa sau snapshot trong cùng transaction; đều có trong 501 ca cuối |

Đây là liên kết các assertion cụ thể mới, không phải chứng nhận toàn bộ UC/BR/NFR hoặc thay ma trận ngoại lệ.

## Benchmark focused — chưa phải SLA

Máy Windows 10.0.26200, i5-12450H/12 logical CPU, RAM 16 GiB, Node 24; browser/version/viewport chính xác nằm trong từng JSON. Mốc đo: từ click Lưu tới thông báo thành công thật, gồm chi phí Playwright/auto-wait, loại setup/nhập liệu/đối soát khỏi khoảng đo. Mỗi nhóm chỉ 5 mẫu sau warmup; p95 dùng nearest rank nên chính là mẫu lớn nhất trong nhóm, không suy rộng thành hiệu năng mọi máy/dữ liệu.

| Vai trò / sản phẩm ban đầu | Thu mua p50/p95 (ms) | Bán tiền mặt p50/p95 (ms) |
|---|---:|---:|
| Chủ /25 | 97,1 /120,5 | 82,0 /82,4 |
| Chủ /1.000 | 343,8 /356,9 | 139,7 /248,7 |
| Nhân viên /25 | 106,6 /110,6 | 76,8 /86,9 |
| Nhân viên /1.000 | 238,1 /322,9 | 140,4 /142,9 |

Phím tắt/mức giá/SLA giữ OPEN theo G10-D03. Không đo thời gian con người kiểm tra tiền ngân hàng hoặc máy quét vật lý. Kết quả lượt full cuối được lưu riêng; không chọn mẫu tốt nhất giữa các lượt để thay thế dữ liệu.

Lượt full cuối, cùng phương pháp/máy, [JSON từng dataset](evidence/t04-t05/full):

| Vai trò / sản phẩm ban đầu | Thu mua p50/p95 (ms) | Bán tiền mặt p50/p95 (ms) |
|---|---:|---:|
| Chủ /25 | 100,5 /110,0 | 72,2 /82,2 |
| Chủ /1.000 | 256,4 /335,5 | 135,0 /270,2 |
| Nhân viên /25 | 100,3 /107,1 | 81,5 /85,6 |
| Nhân viên /1.000 | 247,1 /331,9 | 123,3 /131,4 |

## CI visual và giới hạn còn lại

G10-D05 đã cho phép riêng baseline SC105 và metadata. Test đọc hai file đã chuẩn bị trong `tests/visual/references`, không còn lệ thuộc CODEX; focused Windows PASS. Không tự upload nguồn khác hoặc suy ra GitHub/Linux PASS. Không đổi workflow.

Audit hiện tại: production-only **0 cảnh báo**; toàn bộ dependency vẫn **7 moderate** lint, 0 high/critical. Đây là kết quả npm audit theo phạm vi, không chứng nhận an toàn hệ thống. [JSON toàn bộ](evidence/regression/dependency-audit-cont-all.json), [production](evidence/regression/dependency-audit-cont-production-only.json).

Chưa xong chứng nhận 27 UC/mọi nhánh, 98 BR, 7 NFR, 297 SC. Hai trường UI SRS/Figma, barcode vật lý và các quyết định chưa chốt tiếp tục giữ nguyên trạng thái review. Chưa commit/push/deploy phase.
