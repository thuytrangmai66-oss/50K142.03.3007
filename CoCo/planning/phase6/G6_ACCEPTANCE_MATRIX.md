# G6 — bảng kiểm chứng và nghiệm thu T07

Ngày 12/11/2026. **G6 PENDING REVIEW, chưa DONE**. PASS dưới đây là kết quả QA, không thay xác nhận nghiệm thu. Hai trường UI còn BLOCKED; dependency audit FAIL. [Lệnh/log/ảnh và ngoại lệ](T07_EXECUTION.md).

Nguồn: SRS local UC_1.1, UC_1.2, UC_4.6, UC_6; CODEX Design hai vai trò; DATA_CONTRACT_REVIEW/T01_REVIEW_GATE và quyết định người dùng. Mã legacy không được diễn giải lại. BR-UC1-07 là nhân viên kiểm hàng thực tế trước nhập, không phải chức năng kiểm định tự động.

## Checklist UC và luồng

| UC | Luồng chính | Thay thế/ngoại lệ | Kết quả |
|---|---|---|---|
| UC_1.1 | Thêm món, tìm khung giá, giá hợp lệ, chọn/tạo khách, Lưu, hóa đơn và từng món tồn kho | Bỏ trống/sai số lượng/giá, không có khung, khách không tồn tại/trùng phone, pending/rejected chặn Lưu, từ chối → nhập lại giá, lỗi transaction/retry/reload | PASS QA; nghiệm thu người dùng còn chờ |
| UC_1.2 | Danh sách, bốn bộ lọc kết hợp, phân trang/reset, mở chi tiết | Empty/not found, lỗi danh sách/chi tiết, quyền/session, legacy và snapshot hỏng | PASS phần đã hiện thực; **BLOCKED 2 trường chi tiết**, không PASS toàn UC |
| UC_4.6 | Lịch sử khách bán cho CoCo theo MaKH, mở đúng hóa đơn | Không có lịch sử/lỗi đọc; đổi tên/SĐT vẫn liên kết, không nhầm lịch sử mua | PASS phần đã hiện thực; **BLOCKED Trạng thái ở chi tiết** theo cùng xung đột Figma |
| UC_6 | Chủ đọc pending, xem snapshot, phê duyệt và nhân viên nhận kết quả không F5 | Từ chối/lý do trắng/hủy, stale/race/replay, staff bị chặn, lỗi lưu và lỗi phát sau commit, đóng toàn bộ luồng popup thành công | PASS QA; pixel/nghiệm thu người dùng còn chờ |

## Checklist từng Business Rule

Các tên file trong bảng là suite **đã chạy**, danh sách từng test/thời gian/trạng thái ở [unit catalog](evidence/t07/unit-test-catalog.json) và [Chromium catalog](evidence/t07/chromium-test-catalog.json). Tên rút gọn `purchase-*.test.ts` thuộc `tests/unit/`, `*.spec.ts` thuộc `tests/e2e/`.

| BR | Tiêu chí kiểm chứng | Bằng chứng chính | QA |
|---|---|---|---|
| BR-UC1-01 | Tra cứu phone, chọn khách có thật, tạo khi chưa có | `purchase-customer-layout.spec.ts`, `purchase-drafts.spec.ts`, `purchase-finalization.spec.ts` | PASS |
| BR-UC1-02 | Tên/phone bắt buộc; Hủy không tạo khách | `reference-data.test.ts`, `reference-data.spec.ts`, `purchase-finalization.spec.ts` | PASS |
| BR-UC1-03 | Loại/brand/tình trạng/số lượng bắt buộc | `purchase-drafts.test.ts`, `purchase-drafts.spec.ts` hai role | PASS |
| BR-UC1-04 | Số lượng nguyên dương, không chấp nhận zero/lẻ/overflow | `purchase-contract.test.ts`, `purchase-drafts.test.ts`, UI T02 | PASS |
| BR-UC1-05 | Giá thu mua dương và hợp lệ, không thêm luật dưới Min | `purchase-contract.test.ts`, `purchase-candidate.test.ts`, UI T02/T04 | PASS |
| BR-UC1-06 | Hồ sơ phone duy nhất, lịch sử mua/bán phân biệt | `reference-data.test.ts`, UI customer race T05, `purchase-queries.test.ts` | PASS |
| BR-UC1-07 | Nhân viên kiểm hàng ngoài hệ thống; không tự loại tình trạng 1/2/3, không thêm bảng/control kiểm định | Quyết định người dùng, source review schema/editor/catalog độ mới | PASS đối chiếu phạm vi; chất lượng món thực tế **không thuộc kiểm thử tự động** |
| BR-UC1-08 | Đúng tổ hợp loại/brand/tình trạng và revision khung giá | `purchase-drafts.test.ts`, `purchase-candidate.test.ts`, UI missing bracket T02 | PASS |
| BR-UC1-09 | Một mã cho mỗi món, không tái sử dụng mã đã cấp | `purchase-finalization.test.ts`, native finalization storage, UI số lượng >1 | PASS |
| BR-UC1-10 | Mã hóa đơn duy nhất, double-submit/race không nhân đôi | `purchase-finalization.test.ts`, `purchase-finalization.spec.ts`, T07 runtime graph | PASS |
| BR-UC1-11 | Chỉ giá >Max tự gửi duyệt; pending/rejected không hoàn tất; quyết định đúng line/revision/snapshot | `purchase-contract.test.ts`, `purchase-approvals.test.ts`, UI T02–T05, T07 hai tab | PASS |
| BR-UC1-12 | Tra cứu chỉ khi có phiên hợp lệ; cả Chủ/Nhân viên | `purchase-queries.test.ts`, auth suites, T06/T07 UI | PASS |
| BR-UC1-13 | Tìm mã, phone, tên và ngày Việt Nam | `purchase-queries.test.ts`, `purchase-list.spec.ts`, `purchase-queries.spec.ts` | PASS |
| BR-UC1-14 | Kết hợp các điều kiện AND, reset | Các suite tra cứu phía trên | PASS |
| BR-UC1-15 | Chỉ hiển thị kết quả khớp, pagination không mất/trùng dòng | Unit filter/ngày VN, `purchase-list.spec.ts`, `pagination.spec.ts` | PASS |
| BR-UC1-16 | Khách/sản phẩm/giá/tổng/ngày giờ đúng; Nhân viên và Trạng thái bắt buộc theo SRS | Reader/DTO có dữ liệu và unit PASS; UI Figma không có hai trường, người dùng đã chọn giữ ảnh | **BLOCKED UI Nhân viên + Trạng thái**; không miễn trừ SRS |
| BR-UC1-17 | Lưu và truy xuất lịch sử, giá không tính lại từ giá hiện hành | `purchase-queries.test.ts`, `purchase-candidate.test.ts`, T06 UI và T07 graph/reload | PASS |
| BR-UC4-01 | Phone xác định hồ sơ theo contract hiện tại | G4 customer service/unit/UI, luồng chọn khách T02/T05 | PASS |
| BR-UC4-02 | Một khách có thể mua và bán; không gộp hai loại lịch sử | `reference-data.test.ts`, `reference-data.spec.ts`, reader T06 | PASS |
| BR-UC4-11 | Lịch sử bán chỉ giao dịch thu mua đúng MaKH | `purchase-queries.test.ts`, T06 UI, T07 cả hai role | PASS |
| BR-UC4-12 | Đổi tên/phone không mất lịch sử | `reference-data.test.ts`, `purchase-queries.test.ts`, T06 UI sửa cả hai trường | PASS |
| BR-UC6-01 | Chỉ chủ duyệt/từ chối ở route và service | `purchase-approvals.test.ts`, `purchase-approvals.spec.ts`, auth permission tests | PASS |
| BR-UC6-02 | Chỉ pending đủ điều kiện; stale/race/replay và dòng bỏ/draft hủy bị chặn | Các suite approvals/candidate, UI hai chủ/race và remove/cancel | PASS |
| BR-UC6-03 | Quyết định gắn đúng giá, số lượng, line revision và snapshot khung | `purchase-contract.test.ts`, `purchase-approvals.test.ts`, T07 graph | PASS |
| BR-UC6-04 | Lý do từ chối bắt buộc, hủy không ghi | `purchase-approvals.test.ts`, `purchase-approvals.spec.ts` | PASS |
| BR-UC6-05 | Lưu trạng thái/actor/time và audit atomically; reload không mất | Approval unit/transaction failures, UI T03/T04 và native storage | PASS |
| BR-UC6-06 | Đúng người gửi nhận kết quả/lý do; lỗi phát giữ quyết định, retry không tạo lại | `purchase-results.spec.ts`, `purchase-approvals.spec.ts` hai nhánh lỗi delivery | PASS |

## Dữ liệu, runtime và regression

| Gate | Bằng chứng | Kết quả |
|---|---|---|
| P03/P04 đã duyệt | Trích xác nhận “Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02” trong chat/T01_REVIEW_GATE/DATA_CONTRACT_REVIEW | APPROVED_USER; không suy từ số test |
| Kích hoạt thật | `schema.ts` version(4), provider/service dùng runtime; T07 đọc native CoCoDB 40/27 store và graph do UI thật sinh | PASS runtime |
| Draft chưa hoàn tất không sinh khách/invoice/stock giả | T07 đọc DB ngay khi pending: cả ba bảng chưa có bản ghi; suite T01/T02 | PASS |
| P04 nhiều đơn giá cùng khung | T07 120.000×1 + 80.005×2 = 280.010; snapshot 2 dòng, 3 products/cost/provenance; không tạo legacy aggregate | PASS |
| Migration thành công/rollback lỗi nâng version | T07 native: lỗi upgrade giữ version30/21 store và toàn bộ legacy rows/PK; upgrade thật lên40/27, sáu store mới rỗng | PASS |
| FK, provenance, snapshot/cost hỏng | Candidate graph tests và native FK; reader không fallback che thiếu metadata | PASS |
| Mapping 1/1/2 | Contract hiện hành, constant và snapshot từng invoice; legacy90 giữ nguyên sau migration | PASS đối chiếu; mã sold=2 chưa phải nghiệp vụ bán hàng G8 đã triển khai |
| Stale/replay/chống trùng/rollback | Unit candidate/approvals/finalizer; UI lỗi hai store/retry/race, native transaction | PASS |
| Reload/readonly | So sánh toàn bộ store trước/sau tra cứu và reload cả hai tab T07; T06 rename/readonly | PASS |
| Session/permission/live A–F | Suite auth, T03/T04/T05 và T07; cùng context, hai tab, không F5 để chứng minh cập nhật | PASS QA A–F |
| G2–G5 regression | Full unit249/249 và Chromium95/95, 0 FAIL/SKIP ở lượt cuối; giữ log thất bại trước đó | PASS QA lần cuối; độ ổn định auth khi tải cao còn ghi nhận |
| Static local-only audit | 5/5 checks trong `static-audit.json` | PASS |
| Dependency audit | `npm-audit.json`, `audit-summary.json`, exit1 | **FAIL: 13 package findings** |
| Figma tổng thể/pixel/nghiệm thu người dùng | Ảnh local đối chiếu ảnh UI, danh sách ngoại lệ T04/T06 | **PENDING REVIEW**, không coi geometry/function PASS là pixel PASS |

## Đề xuất nghiệm thu

Giữ **T05/T06/G6 PENDING REVIEW**. Gói kiểm chứng T07 trình review kèm đầy đủ log và ngoại lệ; không đề xuất G6 READY FOR REVIEW/DONE khi audit FAIL và BR-UC1-16 còn BLOCKED. Cần chủ dự án chốt phương án cho hai trường UI và phạm vi xử lý dependency; giữ thêm review Figma/pixel T04/T06 và xác nhận nghiệm thu. Không thay UI, không nâng package trong T07, không chuyển G7.
