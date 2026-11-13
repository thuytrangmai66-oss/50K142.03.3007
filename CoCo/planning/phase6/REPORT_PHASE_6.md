# Báo cáo G6 — tiến độ T01–T05

> T07 ngày 12/11/2026: gói kiểm chứng tại [T07_EXECUTION.md](T07_EXECUTION.md), bảng từng UC/BR tại [G6_ACCEPTANCE_MATRIX.md](G6_ACCEPTANCE_MATRIX.md). **T05/T06/T07/G6 PENDING REVIEW**: BR-UC1-16 còn hai trường UI BLOCKED; dependency audit FAIL. Không tự DONE hoặc chuyển G7. Các mốc IN PROGRESS/NOT RUN phía dưới là lịch sử trước T07.

> Cập nhật T06 ngày 12/11/2026: **T05/T06 PENDING REVIEW, G6 IN PROGRESS**. Tra cứu và lịch sử đã triển khai; hai trường Nhân viên/Trạng thái ở chi tiết **BLOCKED** theo quyết định giữ Figma. [T06_EXECUTION.md](T06_EXECUTION.md) là mốc hiện hành; các dòng T06 chưa triển khai bên dưới là lịch sử. Giữ thứ tự T07, chưa chuyển G7.

> T05 đã hoàn tất triển khai runtime và kiểm thử UI theo chỉ đạo mới. **233/233 unit/integration, 88/88 Chromium PASS**, lint/typecheck/build PASS. [Báo cáo T05, mapping, các file sửa, screenshot và demo](T05_EXECUTION.md). T05 PENDING REVIEW, G6 IN PROGRESS; task tiếp theo là T06. Các ghi chú T05 chưa kích hoạt/NOT RUN phía dưới thuộc mốc candidate đã được thay thế.

> T05 đã có transaction candidate và source UI chuẩn bị, **chưa kích hoạt Lưu do mapping mã trạng thái còn OPEN**. Kết quả 232 unit/integration PASS và 81 Chromium PASS gồm 80 regression UI hiện tại + 1 native storage candidate; E2E Lưu T05 qua UI thật vẫn NOT RUN. [Công việc, mapping cần xác nhận và việc còn lại](T05_CANDIDATE_PROGRESS.md). G6 IN PROGRESS, T05 PARTIAL.

> T04 đã triển khai nhận kết quả/lý do đúng người tạo, live hai tab, acknowledge bền một lần và nhập lại giá theo revision/snapshot. **211/211 unit/integration, 80/80 Chromium regression PASS**, lint/typecheck/build PASS. [Báo cáo T04, source, ảnh, demo và điểm còn chờ review](T04_EXECUTION.md). G6 IN PROGRESS; nghiệm thu T04 và nền popup theo Figma còn chờ review. T05 là task tiếp theo, mapping số trạng thái dữ liệu mới tiếp tục OPEN trước khi finalize.

> Đã sửa lỗi đóng thông báo thành công còn kẹt chi tiết phê duyệt theo phản hồi ngày 12/11/2026. Duyệt và từ chối đều quay về danh sách sau khi đóng, giữ bộ lọc và dữ liệu đã lưu. **202/202 unit/integration, 75/75 Chromium regression PASS**. [Nguyên nhân, file sửa và bằng chứng](APPROVAL_POPUP_CLOSE_FIX.md). Các số 73/73 bên dưới thuộc lượt trước sửa lỗi này.

> Tiếp tục T03 ngày 12/11/2026, đã hoàn thiện danh sách, chi tiết, phê duyệt/từ chối theo SC130–144 và tích hợp owner-only. [Chức năng, source, kiểm thử, ảnh và giới hạn](T03_SERVICE_PROGRESS.md). T03 chờ review/nghiệm thu, G6 IN PROGRESS. Phần thông báo kết quả ở nhân viên và sửa giá sau từ chối tiếp tục ở T04.

Kiểm thử sau tích hợp T03 đạt **202/202 unit/integration và 73/73 Chromium regression PASS**, lint/typecheck/build PASS. Bao gồm 8 ca Chromium T03 qua UI thật. Đã sửa lỗi hồi quy badge mã giao dịch thay đổi chiều rộng theo ký tự; xem báo cáo T03 để đối chiếu lần FAIL và lần chạy lại.

> Theo chỉ đạo đồng bộ danh sách 12/11/2026, danh sách Thu mua dùng lại divider chung như Khách hàng/Nhân viên/Khung giá; form tạo Thu mua vẫn giữ kiểu riêng Figma. [Báo cáo style hiện hành](../LIST_ROW_DIVIDERS_REVIEW.md). Các bằng chứng “không có line danh sách” bên dưới thuộc mốc yêu cầu cũ.

> Phản hồi về bố cục toàn màn: đã khôi phục màn tạo thu mua theo ảnh chuẩn và tọa độ PDF local 1440×900. Nút Thêm ở ngoài thẻ tiêu đề, đúng tỷ lệ bảng/cột phải, màn rỗng không tự thêm message/0đ/pagination. [Oracle 12 khối, ảnh và kiểm thử](PURCHASE_EDITOR_LAYOUT_REVIEW.md). Các báo cáo UI trước là snapshot lịch sử, không chứng nhận toàn màn đã khớp Figma.

> Sửa UI theo phản hồi tiếp theo: bỏ đường phân cách bảng Thu mua, đưa gợi ý khách nền xám ngay dưới Số điện thoại và đóng sau khi chọn; sửa trạng thái khôi phục/lỗi lưu. [Đối chiếu SC030–032 / SC222–224 và kiểm thử](PURCHASE_CUSTOMER_FIGMA_REVIEW.md). Không thay nghiệp vụ, schema hoặc nghiệm thu G6.

> Điều chỉnh trang vào theo yêu cầu mới: Thu mua mở **danh sách**; nút Tạo giao dịch mới mở form; Hủy quay lại danh sách. Đã thêm query chỉ đọc giao dịch thật, bộ lọc và phân trang dùng chung cho hai role. Xem [PURCHASE_LIST_ENTRY_REVIEW.md](PURCHASE_LIST_ENTRY_REVIEW.md) để biết source/kiểm thử/ảnh mới. Không đánh dấu T06 hoặc G6 DONE.

## Kết quả hiện tại — T01 nghiệm thu, T02 triển khai

Ngày 11/11/2026, người dùng xác nhận: **“Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”**. T01 đã được nghiệm thu; P03/P04 runtime APPROVED_USER. Không suy ra nghiệm thu G5 hoặc toàn bộ G6 từ xác nhận này.

Đã kích hoạt migration v4 và triển khai T02 trên dữ liệu local thật cho hai vai trò. Báo cáo chức năng, kiểm thử, source, ảnh và thao tác demo tại [T02_EXECUTION.md](T02_EXECUTION.md). T03 đã được tích hợp trong lượt mới nêu trên. G6 IN PROGRESS, T02/T03 chờ review/nghiệm thu; T04/T05/T07 còn phía trước. T06 mới có phần danh sách theo yêu cầu sửa trang vào, chưa hoàn tất task.

## Hồ sơ trước xác nhận T01 — lịch sử

Các ghi chú chưa kích hoạt/chưa có UI bên dưới mô tả mốc trước xác nhận, không thay trạng thái hiện tại ở trên.

> Lượt tiếp tục mới nhất: đã bổ sung nhánh FK mới/legacy và read adapter nghiêm ngặt, giữ runtime chưa kích hoạt. **154/154 unit/integration + 54/54 Chromium PASS**, lint/typecheck/build và audit 5/5 PASS. Kết quả và file cụ thể tại [T01_FK_REVIEW_EXECUTION.md](T01_FK_REVIEW_EXECUTION.md); gói đối chiếu tại [T01_REVIEW_GATE.md](T01_REVIEW_GATE.md). Các số test/điểm FK còn thiếu ở những mốc phía dưới là lịch sử, không phải trạng thái hiện tại. G5/G6 chưa DONE và không có UI G6 được triển khai trong lượt này.

## Lượt tiếp tục T01 theo xác nhận của người dùng

**IN PROGRESS / T01 PARTIAL, chưa nghiệm thu hoặc kích hoạt runtime.** Cho phép hoàn thiện candidate được ghi nhận; **chưa phê duyệt kích hoạt P03/P04**. Q20/BR-UC1-07 đã chốt là kiểm tra thực tế ngoài hệ thống; giá bán ban đầu đã chốt cost từng món ×1,30, làm tròn gần nhất, 0,5 lên. Không yêu cầu trả lời lại hai quyết định này.

### Đã bổ sung source

| File | Công việc trong lượt này |
|---|---|
| `src/domain/purchases.ts` | Schema finalized snapshot/provenance; `initialSalePrice` dùng BigInt và kiểm tràn số, không dùng float để làm tròn tiền |
| `src/db/purchase-metadata.ts` | Candidate v4 thêm 6 store, gồm finalized snapshots và provenance; runtime `CoCoDatabase` vẫn v3/21 store |
| `src/services/auth/service.ts` | Chuẩn bị guard hash token ngoài transaction, kiểm fresh session/role/revocation trong write transaction; luồng auth cũ giữ nguyên |
| `src/services/purchase-candidate.ts` | Internal candidate service lưu editing draft/line/pending request nguyên tử, bind actor, CAS, stable receipt/fingerprint, audit và FK; adapter legacy/new; validator snapshot/cost/provenance và số món |
| `tests/unit/purchase-contract.test.ts` | Thêm kiểm thử **abort chính schema upgrade**: giữ DB native v30/21 store và sentinel khi upgrade v4 lỗi |
| `tests/unit/purchase-candidate.test.ts` | 24 case gồm formula half-up, overflow, hai role, snapshot/version/FK, untagged legacy condition, revoke/replay, hai kết nối, audit rollback/retry, adapter và provenance |
| `tests/fixtures/purchase-candidate-browser.ts`, `tests/e2e/purchase-candidate-storage.spec.ts` | Harness chỉ dùng trong test; native Chromium IDB migration/CAS/replay/rollback/revoke, log JSON; không phải UI flow |

Candidate service từ chối ghi nếu chưa có schema candidate. Không import service/migration vào router/provider/schema runtime. Năm file UI/test trong manifest G5 được đối chiếu SHA-256 và **không đổi**; không thêm màn hình/control/checklist kiểm định. Không thay dữ liệu hoặc mã trạng thái legacy. Snapshot bracket cũ chưa có marker catalog không được tự diễn giải dù số là 2.

### Kiểm thử đã thực thi lần cuối

| Kiểm tra | Kết quả thực tế |
|---|---|
| Baseline đầu lượt: lint/typecheck + unit/integration | PASS, 120/120 |
| Full unit/integration sau sửa | **145/145 PASS**, 8 file, exit 0 |
| Full Chromium | **53/53 PASS**, exit 0, 2,9 phút: 52 regression cũ + 1 native candidate storage integration; sau bổ sung alias đã chạy lại riêng native case 1/1 PASS, không cộng thành test duy nhất mới |
| Lint/typecheck/build | **PASS**, exit 0 |
| Static audit phase6 | **5/5 PASS**, [AUDIT_RESULTS.json](AUDIT_RESULTS.json) |
| Candidate schema upgrade rollback | PASS trong Dexie + fake-indexeddb; native Chromium kiểm migration thành công và rollback write/audit, không tự gọi đó là native upgrade-abort test |
| G6 E2E UI/74 SC/demo A–F | **NOT RUN**, chưa có UI G6 |
| CI/Pages | **NOT RUN**, không commit/push/deploy |

Trong lúc hoàn thiện harness có một lỗi typecheck về Dexie PromiseExtended khi gán mock async; đã sửa mock thành throw đồng bộ, sau đó toàn bộ kiểm tra trên PASS. Không bỏ assertion hoặc thay số vòng password hash để làm xanh.

### Phần còn OPEN và thứ tự tiếp tục

- Bảng đối chiếu **P03 draft/request** và **P04 chi tiết nhiều giá/provenance** tại [DATA_CONTRACT_REVIEW.md](DATA_CONTRACT_REVIEW.md); chưa có nghiệm thu kích hoạt. Test PASS không thay quyền kích hoạt.
- Candidate hiện mới có command lưu draft/line/pending request. Chưa có command quyết định/delivery, sửa/hủy dòng với invalidation, finalize invoice/products/cost/provenance, hoặc nhánh FK native cho sản phẩm định dạng mới. Validator/provenance fixture không được coi là finalize service đã hoàn thành.
- Candidate đã bổ sung MaNV/alias G5 để giữ historical actor qua rename, guard buộc phiên mới và audit command mới ghi username hiện tại; có integration test dùng chính service rename G5. Adapter đọc raw legacy status không chứng nhận số đó là finalized.
- Mapping số `TrangThai` cho bản ghi **mới**, tính bất biến/cancellation và command finalize còn cần hoàn thiện theo contract; không lấy số legacy làm mặc định. Công thức giá đầu và BR-UC1-07 đã chốt, không còn chặn vì thiếu lựa chọn này.
- Tiếp tục T01 trước T02–T07, không vượt dependency. [Checklist QA từng task](ACCEPTANCE_CHECKLIST.md) ghi phần đã kiểm và phần NOT RUN; cần xác nhận nghiệm thu mới DONE. Không có thay đổi UI trong lượt này.

Log native và ảnh regression của lượt này lưu tại `evidence/t01-review/`, manifest `EVIDENCE_T01_REVIEW.json`. Các ảnh chỉ là UI G5 hồi quy, không giả screenshot UI G6. Localhost giữ http://127.0.0.1:5173/50K142.03.3007/ ; chạy `npm run dev` trong CoCo nếu server chưa mở.

## Mốc coding đầu T01 — lịch sử

Ngày 11/11/2026. **IN PROGRESS, T01 PARTIAL; chưa nghiệm thu G6.** Theo chỉ đạo chạy giai đoạn tiếp sau bản plan, đã bắt đầu phần hợp đồng dữ liệu có thể kiểm thử độc lập. Giữ thứ tự T01–T07. G5 vẫn READY FOR REVIEW; không tự ghi G5/G6 DONE.

## Đã thực hiện

- `src/domain/purchases.ts`: schema versioned cho draft/dòng/request/notification; draft chưa chọn khách không tạo customer/invoice giả. Mỗi dòng có ID và giá riêng, tổng nguyên đồng chống overflow/ID dòng trùng. Snapshot bracket dùng mapping 1/2/3 đã duyệt.
- Kiểm tra giá vượt Max cần duyệt; không tự cấm giá dương dưới Min. Quyết định ràng buộc line ID/revision/giá/số lượng/snapshot khung giá. Điều kiện hoàn tất chặn thiếu khách/món, pending hoặc phê duyệt cũ sau sửa dòng. Phân biệt event bền với trạng thái đã gửi.
- `src/db/purchase-metadata.ts`: migration candidate v3 → v4 chỉ thêm bốn store `purchaseDrafts/purchaseLines/purchaseApprovals/purchaseNotices`, kiểm thử trên DB riêng. **Chưa đăng ký trong CoCoDatabase/runtime**, chưa nâng DB người dùng. Store finalization/product provenance, FK/adapter mới và service transaction còn phải hoàn thiện trong T01 sau chốt contract; không gọi bốn store này là toàn bộ schema G6.
- `tests/unit/purchase-contract.test.ts`: 19 test thực thi cho validation, mixed-price 80.001 + 120.000 = 200.001 đồng, stale/replay guard, điều kiện hoàn tất, migration giữ nguyên toàn bộ hàng/khóa legacy, transaction lỗi cuối rollback và runtime vẫn v3/21 store.
- `scripts/audit-phase1.mjs`: thêm `--phase=6` ghi bằng chứng G6; giữ default phase5 của workflow hiện tại, không ghi đè audit G5 trong lượt này.

Các hàm rule là kiểm tra thuần, **chưa phải service xác thực/ủy quyền hoặc CAS trong transaction**. Chưa có route/UI/CRUD draft, phê duyệt, finalize hay adapter lịch sử mới. Chưa diễn giải lại mã trạng thái legacy, chưa tự xác định giá bán ban đầu. Không sửa UI/pagination/popup hiện có.

## Kiểm thử đã chạy trong lượt này

| Kiểm tra | Kết quả |
|---|---|
| Baseline trước phần G6: lint/typecheck, unit, build | PASS; 101/101 test, exit 0 |
| Baseline Chromium trên bundle runtime hiện tại | **52/52 PASS**, exit 0, 3,1 phút |
| Sau thêm contract: lint/typecheck | PASS, exit 0 |
| Full unit/integration `npm test -- --maxWorkers=1` | **120/120 PASS**, 7 file, không skip, exit 0 |
| Riêng contract/migration sau bổ sung rollback | **19/19 PASS**, exit 0 |
| Build cuối | PASS, exit 0; JS/CSS runtime giữ cùng tên hash như baseline vì module G6 chưa được import vào app |
| `node scripts/audit-phase1.mjs --phase=6` | **5/5 PASS**, exit 0, [audit](AUDIT_RESULTS.json) |
| Migration candidate trên IndexedDB native Chromium | NOT RUN; migration mới chạy Dexie + fake-indexeddb trong integration test |
| UI G6/74 SC và demo thu mua/phê duyệt A–F | NOT RUN, chưa triển khai |
| CI/Pages của thay đổi G6 | NOT RUN; không commit/push/deploy |

Chromium ở đây là regression G2–G5, không được coi là E2E luồng G6. Hai phiên và dữ liệu live cũ vẫn PASS; chưa có request thu mua qua UI. Ảnh mới từ lần regression: [chủ](evidence/regression/owner-staff-list.png), [nhân viên](evidence/regression/staff-created-ui-session.png), chỉ chứng minh giao diện cũ còn hoạt động, không phải screenshot G6 hoặc đối chiếu Figma mới.

## Checklist và phần còn lại

| Task | Trạng thái thực tế |
|---|---|
| T01 | PARTIAL: rule/schema và migration candidate được kiểm thử; chưa kích hoạt migration, chưa đủ FK/adapter/provenance/finalized snapshot/transaction service |
| T02 | NOT STARTED: cần T01 và chốt Q20 trước thẩm định |
| T03–T04 | NOT STARTED: phụ thuộc request thật T02; chưa có quyết định/event delivery qua UI |
| T05 | NOT STARTED: cần T01–T04, mapping snapshot và nguồn giá bán ban đầu |
| T06–T07 | NOT STARTED: chưa có giao dịch hoàn tất thật để tích hợp/đối soát/demo |

Đã gửi ba câu hỏi: xác nhận kích hoạt P03/P04 theo [DATA_CONTRACT_REVIEW](DATA_CONTRACT_REVIEW.md); cách thẩm định Q20 (thủ công hay checklist); nguồn giá bán ban đầu (chủ nhập hay quy tắc cụ thể). Chưa nhận câu trả lời trong lượt này. MASTER_PLAN mục F và dependency của PLAN_PHASE_6 yêu cầu chốt trước task phụ thuộc; chỉ đạo chạy phase không cung cấp các giá trị nghiệp vụ đang thiếu. Không đoán hoặc tự đánh dấu đã phê duyệt.

## Git, bằng chứng và mở website

Nhánh `coco/phase-5-staff`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`, origin giữ nguyên. Giữ working tree G3–G5/CODEX; không stage/commit/push/deploy, không reset storage. [Manifest](EVIDENCE_MANIFEST.json) ghi hash source/test/evidence chưa commit, không giả commit mới.

Localhost đã kiểm HTTP 200: http://127.0.0.1:5173/50K142.03.3007/ . Nếu cần khởi chạy: `cd D:\50K142-NEW\CoCo`, rồi `npm run dev`. Bản mở hiện vẫn là giao diện G5, chưa xuất hiện menu/luồng G6. Sau khi chốt các câu hỏi, tiếp tục hoàn thiện T01 rồi T02–T07; giai đoạn sau G6 vẫn là G7 theo roadmap.
