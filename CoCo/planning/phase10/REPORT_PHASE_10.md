# G10 — Báo cáo kiểm chứng đang thực hiện

Ngày 14/11/2026. **IN PROGRESS / chưa đủ gate nghiệm thu hoặc commit/push.** Không tự DONE G9/G10, không chuyển G11.

## Lượt tiếp tục — review đủ nhóm BR và tăng kiểm chứng transaction

[Execution mới và ảnh](BR_REVIEW_EXECUTION.md): bổ sung24 unit/1 E2E, đối chiếu assertion98 BR có giới hạn. Full cuối **538/538 unit,167/167 Chromium,8/8 visual local PASS**,0 FAIL/SKIP/FLAKY; lint/typecheck/build PASS. Runtime/UI/schema/nghiệp vụ không đổi,22 file bundle giữ nguyên hash. Còn đầy đủ nhánh/control/visual và các gate đã nêu; chưa nghiệm thu G10/chuyển G11 hoặc commit/push. Các số514/166 bên dưới thuộc lượt trước.

## Cập nhật popup khách hàng — sau baseline bên dưới

[Gói review gate chuyển G11](G10_REVIEW_GATE.md) phân biệt công việc kiểm chứng còn lại của người triển khai với đầu vào/ngoại lệ cần chủ dự án chốt; không chuyển phase từ số test tổng hoặc yêu cầu tiếp tục chung.

Đã hoàn tất lượt cuối: **514/514 unit/integration, 166/166 Chromium, 8/8 modal visual PASS**, 0 FAIL/SKIP/FLAKY; lint/typecheck/build/static audit PASS, guard 191 file không đổi. [Execution, file sửa, ảnh và kết quả GitHub](CONTINUATION_EXECUTION.md). Modal SC101–104/SC294–297 đạt geometry/pixel theo ngưỡng đã duyệt; chỉ chứng nhận component, không phải toàn SC/297 trạng thái. Số 501/164 bên dưới là lịch sử trước chỉnh popup. G10 còn review SC/BR/NFR và quyết định/ngoại lệ; chưa đủ gate chuyển G11, chưa commit/push/deploy.

## Mốc trước chỉnh popup — G10-T04/T05 và cổng baseline (lịch sử)

- Full mới: **501/501 unit/integration PASS** (27 file, 131,04 giây), **164/164 Chromium PASS** (579,31 giây), 0 FAIL/SKIP/FLAKY; lint/typecheck/build và static audit 5/5 PASS. [Execution thực thi và hash guard 193 file](evidence/t04-t05/full/execution.json).
- Thêm HTML escaping cho tên/lý do từ chối, benchmark hoàn tất thu mua/bán tiền mặt trên 25/1.000 sản phẩm qua UI thật và rollback native trên graph lớn. Sửa đọc FK theo lô và hàng đợi ghi trong cùng transaction; giữ mọi validation, kiểm quyền, ID/tombstone, provenance, receipt/audit và mapping legacy. Đã phát hiện/sửa PrematureCommitError của bản tối ưu trung gian, giữ log lỗi và bổ sung rollback/retry; không thay UI hoặc schema.
- G10-D05 đã duyệt riêng baseline cắt SC105/metadata. Test visual không còn phụ thuộc CODEX; source khác không đưa vào Git, CI/Linux/Pages G10 vẫn NOT RUN.
- Audit hiện tại: **production-only 0 cảnh báo**, toàn bộ dependency còn **7 moderate lint**, 0 high/critical. Không coi toàn bộ audit hoặc NFR security đã được nghiệm thu.
- [Báo cáo chi tiết T04/T05 và bảng UC/BR–test](T04_T05_EXECUTION.md), [bằng chứng/ảnh cuối](evidence/t04-t05/full), [unit JSON](evidence/audit/unit-executed-tests.json), [Chromium JSON](evidence/audit/executed-tests.json), [các cổng còn mở](ACCEPTANCE_GAPS.md).

Ảnh sau chạy với 1.000 sản phẩm: [Chủ cửa hàng](evidence/t04-t05/full/phase10-finalize-benchmark-3def4-its-without-an-invented-SLA-chromium/owner-1000-committed-list.png), [Nhân viên](evidence/t04-t05/full/phase10-finalize-benchmark-c7287-its-without-an-invented-SLA-chromium/staff-1000-committed-list.png). [Chỉ mục/hash 16 ảnh runtime](evidence/t04-t05/full/screenshots.json). Local đã kiểm HTTP 200 tại `http://127.0.0.1:5173/50K142.03.3007/`; khởi chạy bằng `npm.cmd run dev` trong thư mục CoCo khi chưa mở server.

G10 tiếp tục IN PROGRESS/PENDING REVIEW: visual/action toàn bộ 297 SC, chứng nhận từng nhánh/BR, NFR/ngoại lệ chưa đủ để khép phase. Chưa commit/push/deploy. Các kết quả 495/156 bên dưới là lịch sử trước lượt cập nhật này.

## Kết quả lượt trước — giữ làm lịch sử

| Gate thực thi | Kết quả |
|---|---|
| Lint / typecheck / build sau sửa | PASS; build vẫn có cảnh báo chunk >500 kB |
| Full unit/integration sau nâng major | **495 PASS / 0 FAIL / 0 SKIP**, 27 file, 137,02 giây |
| Full Chromium sau sửa tương thích và visual | **156 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, 551,97 giây (~9,2 phút), exit 0 |
| Static audit sau nâng | **5/5 PASS** |
| Dependency audit sau nâng | 0 critical / 0 high / **7 moderate OPEN**, không coi audit sạch |
| Visual SC105 report picker | **PASS** geometry ≤2px và pixel ~0,308%; toàn màn hình/297 SC chưa được chứng nhận |
| Nghiệm thu G10 / chuyển G11 | **CHƯA ĐẠT ĐIỀU KIỆN**, còn traceability, visual/NFR và ngoại lệ đã nêu |

187 file trong hash guard không đổi suốt lượt full Chromium cuối; renderer PDF mới là công cụ QA riêng, đã chạy kiểm đơn/batch và lint, không được bundle vào app. [Hash guard](evidence/regression/source-preservation.json), [ca thực thi cuối](evidence/audit/executed-tests.json), [log Chromium cuối](evidence/regression/full-chromium-after.log), [unit sau nâng](evidence/regression/full-unit-after.log), [ảnh sau nâng/sửa](evidence/runtime-after), [danh sách file](FILES_CHANGED.md).

## Mốc kiểm thử trước nâng dependency

Branch `main`, HEAD `1fd4ad4a04e3b870a1c673fd7abd344af50dea69`, origin `https://github.com/thuytrangmai66-oss/50K142.03.3007.git`. Working tree có thay đổi G10 và các thay đổi bên ngoài được giữ nguyên. Hash 184 file source/test/script/config trước và sau lượt hồi quy không đổi. Mốc dưới đây không được dùng chứng nhận bản dependency mới chưa kiểm xong.

| Lệnh/kiểm chứng | Kết quả thực thi |
|---|---|
| `npm.cmd run lint` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd test -- --maxWorkers=1` | 495 PASS, 27 file; 133,76 giây |
| `npm.cmd run build` | PASS; còn cảnh báo chunk >500 kB |
| `npm.cmd run test:e2e -- --workers=1 --reporter=line,json` | 155 PASS / 1 FAIL / 0 SKIP / 0 FLAKY; 607,6 giây |
| Static audit hiện có | 5/5 PASS; không thay thế audit dependency |
| `npm.cmd audit --json` trước nâng | 13 package entries: 2 critical, 1 high, 10 moderate |

Ca Chromium FAIL duy nhất: `phase10-visual.spec.ts`, SC105 report picker. Geometry 5 thẻ đạt ≤2 CSS px; sai khác 4.236/361.548 pixel (~1,17%) vượt giới hạn 1%. Ảnh kỳ vọng được lấy từ export CODEX gốc, không từ runtime. Không tăng threshold hoặc mask lỗi để tạo PASS. Thử tăng stroke icon cho kết quả 4.262 pixel, không cải thiện nên đã hoàn nguyên thử nghiệm đó. Chưa chứng minh nguyên nhân phần sai khác còn lại.

## Phần đã thực hiện

- Hai hành trình UI hai vai trò: đề xuất vượt Max → chủ duyệt → thu mua → tồn kho → bán tiền mặt/chuyển khoản → tích/đổi điểm → lịch sử/báo cáo. Đối soát độc lập doanh thu 650.000đ, giá vốn 520.000đ, lợi nhuận 130.000đ, thu mua 620.000đ; 5 món bán/1 món còn; không dùng mock để giả hoàn tất giao dịch.
- Kiểm phiên độc lập, cập nhật hai tab, snapshot sau reload, quyền và không lộ hash/salt vào HTML trong hành trình. Kết quả trước nâng: 2/2 PASS.
- Script kiểm kê nguồn và kết quả thực thi: 27 UC / 98 BR / 7 NFR / 297 SC. Có hash và tham chiếu; file test liên quan không được coi là đủ branch coverage. 209 export sạch được ánh xạ, 88 SC chưa có export sạch trong mapping. Visual của các trạng thái chưa chạy vẫn NOT RUN.
- Bàn phím/cảm ứng tạo, tìm, mở, hủy và xóa hồ sơ bằng UI cho Chủ/Nhân viên; kết quả trước nâng 2/2 PASS. Benchmark tra cứu đã đo, chưa benchmark finalize hoặc nghiệm thu SLA.
- Điều chỉnh report picker theo export SC105: vị trí/kích thước thẻ, ngắt dòng nhãn và vector icon; không sửa schema/nghiệp vụ hoặc bảng Hàng hóa 5 cột.
- G10-D04 đã cho phép nâng major Vitest 5.1.0, Zod 4.6.7, Router 7.18.5. Tách structural schema khỏi refinement để thay `.innerType()` Zod 3, giữ writer dùng đầy đủ refinement và reader kiểm quan hệ như trước. Kết quả tương thích sẽ bổ sung khi lệnh thực thi kết thúc.

## Kiểm tương thích sau nâng major

Đã thực thi lint/typecheck PASS; full unit/integration **495/495 PASS, 27 file, 137,02 giây** trên Vitest 5.1.0; build PASS. Lỗi `.innerType()` được sửa bằng structural schema riêng, không nới writer hoặc thay quan hệ lịch sử.

Lượt Chromium đầu gặp port 4173 do focused runner của chính G10 chưa kết thúc: không có ca nào được tính PASS. Lượt sau phát hiện hai hành trình timeout khi chọn khách từ danh sách sang editor; đã lưu log và dừng lượt đó để sửa. Router 7 mặc định dùng transition trong lúc form cũ còn hiện; đặt `HashRouter useTransitions={false}` giữ hành vi trước nâng. Hai ca chạy lại **2/2 PASS** (15,7 giây), giữ nguyên timeout/assertion. Full Chromium cuối sau sửa **156/156 PASS**, không tính lượt bị ngắt là full PASS. Khi chạy focused trong sandbox Windows từng có lượt hoàn tất ảnh nhưng chưa đóng runner/report; lượt chính thức ngoài sandbox kết thúc exit 0, không dùng lượt bị ngắt làm bằng chứng PASS.

Visual SC105 sau đo lại vị trí chữ từ nguồn đã **1/1 focused PASS**, sai khác 1.115/361.548 pixel (~0,308%), ngưỡng không đổi. Chỉ chứng nhận component report picker; [review visual](T03_VISUAL_REVIEW.md) ghi cả lỗi trước và phần chưa chạy. Đã render 154 PDF nguồn vào cache riêng, không coi rasterization là 154 visual PASS.

## Số đo tra cứu trước nâng — chi tiết

Windows 10.0.26200, i5-12450H/12 logical CPU, RAM 16 GiB, Node 24.22.0, Chromium 156.0.8078.4, viewport 1440×900; mỗi dataset 1 warmup +5 mẫu. Đo gồm Playwright tương tác/auto-wait, không phải latency riêng của IndexedDB và chưa có SLA.

| Vai trò | Bản ghi | p50 (ms) | p95 (ms) |
|---|---:|---:|---:|
| Chủ | 25 | 49,8 | 59,1 |
| Chủ | 1.000 | 60,4 | 64,1 |
| Nhân viên | 25 | 48,1 | 50,0 |
| Nhân viên | 1.000 | 50,9 | 65,0 |

Lượt full cuối sau sửa, cùng cấu hình đo: Chủ 25 bản ghi p50/p95 **47,3/53,1ms**, 1.000 bản ghi **49,7/64,1ms**; Nhân viên tương ứng **52,0/60,1ms** và **50,5/69,1ms**. [JSON và ảnh từng vai trò](evidence/runtime-after). Các số đo này không được dùng tự đặt SLA hoặc chứng nhận thao tác finalize.

## Bằng chứng và điểm còn mở

- [Kết quả từng ca](evidence/audit/executed-tests.json), [ma trận nguồn](TRACE_AUDIT.md), [runtime screenshots và benchmark](evidence/runtime), [geometry](evidence/visual/full-run-geometry.json), [ảnh picker](evidence/visual/full-run-picker-actual.png). Raw export/ảnh kỳ vọng CODEX không đưa vào staging.
- Audit sau nâng: 0 critical, 0 high, còn 7 moderate từ nhóm lint/minimatch; xem [review](DEPENDENCY_REVIEW.md) và [JSON](evidence/regression/dependency-audit-after.json). Không coi đã sạch audit.
- SC105 component đã PASS focused sau sửa, toàn màn hình và toàn bộ 297 visual/action states vẫn chưa hoàn thành; chứng nhận 98 BR/7 NFR và mọi nhánh 27 UC còn thiếu. PDF.js đã khắc phục việc đọc nguồn PDF cục bộ; ảnh trống của renderer Windows không dùng làm baseline.
- Phím tắt/quick-price/SLA và các ngoại lệ SRS/Figma G6/G8 tiếp tục OPEN/BLOCKED theo quyết định đã ghi. Không tự miễn trừ bằng số lượng test.
- Thay đổi CSS bán hàng và `sales-draft.spec.ts` xuất hiện ngoài phần G10 đang sửa được bảo toàn; kết quả hồi quy trên mốc đã ghi bao gồm chúng, chưa tự gom vào commit G10. File root/CODEX ngoài phạm vi không stage.
- Chưa commit/push/deploy G10 vì còn FAIL/blocker. Source local mở bằng `cd D:\50K142-NEW\CoCo` rồi `npm.cmd run dev`, địa chỉ cấu hình `http://127.0.0.1:5173/50K142.03.3007/`; không reset dữ liệu trình duyệt người dùng.

Task tiếp tục: hoàn tất kiểm tương thích sau nâng, xử lý visual đúng nguồn, đóng từng ca traceability/NFR có đủ bằng chứng; vẫn trong G10.
