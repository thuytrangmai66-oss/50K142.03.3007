# G6–T07 — kiểm chứng cuối và đề xuất nghiệm thu

Ngày 12/11/2026 (giờ Việt Nam). Phạm vi **chỉ kiểm chứng**, không thêm chức năng, sửa UI, kiến trúc, schema hoặc dữ liệu người dùng. **T05/T06/T07/G6 PENDING REVIEW; chưa DONE, chưa chuyển G7.**

[Bảng UC/BR và gate nghiệm thu](G6_ACCEPTANCE_MATRIX.md) là bảng hiện hành. PASS QA không phải xác nhận nghiệm thu. BR-UC1-16 còn hai trường UI BLOCKED; dependency audit FAIL.

## Trạng thái và quyết định đã xác minh

- Branch `coco/phase-5-staff`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`. Working tree đã có nhiều thay đổi trước T07; giữ nguyên, không commit/push/deploy/reset storage.
- P03/P04: có chỉ đạo trực tiếp **“Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”**, được lưu trong [T01_REVIEW_GATE](T01_REVIEW_GATE.md) và [DATA_CONTRACT_REVIEW](DATA_CONTRACT_REVIEW.md). Các đoạn candidate chưa duyệt phía dưới là lịch sử.
- Runtime: `src/db/schema.ts` đăng ký version4/sáu metadata store; T07 mở chính CoCoDB do UI thật sử dụng, thấy **native version40 / 27 store**. Draft/request thật có line/revision/bracket snapshot trước khi có khách/hóa đơn; sau finalize có canonical snapshot/provenance/cost. Không suy runtime từ test T05/T06 PASS.
- Mapping giữ **invoiceCompleted=1, productAvailable=1, productSold=2**. Snapshot appMetadata theo invoice; native migration giữ raw legacy90 và PK `[MaHDTM,MaKhungGia]`. Mã sold=2 được đối chiếu contract; không tuyên bố G8 đã có giao dịch bán.
- BR-UC1-07: nhân viên kiểm hàng thực tế trước nhập; không checklist/control/bảng kiểm định tự động, không tự loại hàng theo mã độ mới. Giá bán đầu giữ cost từng món ×1,30, nearest/half-up như đã duyệt.

## Kiểm chứng mới trong T07

1. **Native migration rollback và thành công:** DB test riêng từ frozen v3/21 store với dữ liệu legacy; cố ý lỗi upgrade sau ghi sentinel và draft. Mở lại native version30, toàn bộ store/PK/record cũ giữ nguyên. Sau đó dùng CoCoDatabase runtime nâng lên40/27, sáu store mới rỗng, mọi legacy row/key và status90 giữ nguyên.
2. **Một luồng UI liên tục hai vai trò:** tạo chủ/nhân viên/khung giá bằng UI → nhân viên gửi120.000>Max100.000 → chủ thấy request và phê duyệt → nhân viên nhận kết quả không F5 → thêm cùng khung hai món giá80.005 → chọn/tạo khách bằng UI → Lưu280.010. Chủ đang mở danh sách thấy invoice mới không F5; cả hai mở chi tiết/lịch sử và reload.
3. **Oracle graph native sau UI:** một invoice/finalized draft/snapshot, hai dòng khác giá, ba sản phẩm/chi phí/provenance; request đúng line/revision/quantity/price/bracket; không sinh composite legacy aggregate giả. Hai tab session khác nhau, toàn bộ store bằng nhau và không đổi sau đọc/reload.
4. Hash 13 file mã ứng dụng trong manifest T06 đều không đổi: [t06-preservation.json](evidence/t07/t06-preservation.json). Trong ba test T06 của manifest, chỉ `purchase-queries.spec.ts` được sửa oracle lỗi đọc như mô tả bên dưới. Package/lock và workflow không được chỉnh trong lượt này.

Hai ca mới dùng profile/DB test riêng. Chỉ harness native migration tạo fixture legacy để kiểm nâng schema; luồng giao dịch/phê duyệt/hoàn tất/historic viewer dùng UI thật, không ghi trực tiếp request/decision/invoice để thay nghiệp vụ.

## Kết quả thực thi

| Kiểm tra | Kết quả thực tế | Bằng chứng |
|---|---|---|
| Lint | PASS, exit0 | `verification-checks.json`, `verification-lint.log` |
| Typecheck | PASS, exit0 | `verification-checks.json`, `verification-typecheck.log` |
| Production build | PASS, exit0 | `build-exit.json`, `build.log` |
| Full unit lần đầu | **247 PASS / 2 FAIL / 0 SKIP**, exit1 | `vitest-first-run.json`, `checks-first-run.json`, `initial-failures.json` |
| Auth kiểm lại riêng | **22/22 PASS**, exit0 | `auth-recheck.log` |
| Full unit cuối, `--maxWorkers=2` | **249 PASS / 0 FAIL / 0 SKIP**, 12 file, exit0 | `vitest.json`, `unit-final.log`, `unit-exit-final.json` |
| Hai ca Chromium mới T07 chạy tập trung | **2 PASS / 0 FAIL / 0 SKIP**, exit0 | `verification-focused.log`, `focused-exit.json` |
| Full Chromium lần đầu | **94 PASS / 1 FAIL / 0 SKIP**, exit1 | `playwright-first-run.json`, `chromium-first-run.log` |
| Ba nhánh lỗi đọc kiểm lại, mỗi nhánh lặp2 | **6 PASS / 0 FAIL / 0 SKIP**, exit0 | `read-error-recheck.log`, `read-error-exit.json` |
| Full Chromium cuối | **95 PASS / 0 FAIL / 0 SKIP / 0 flaky**, exit0 | `playwright.json`, `chromium.log`, `e2e-exit.json` |
| Static audit local-only | **5/5 PASS**, exit0 | `static-audit.json`, `audit-exit.json` |
| `npm.cmd audit --json` | **FAIL**, exit1: 13 package findings (2 critical, 1 high, 10 moderate) | `npm-audit.json`, `npm-audit-exit.json`, `audit-summary.json` |
| BR-UC1-16/UI | **BLOCKED 2 trường**, không tính PASS/SKIP test | [review T06](T06_REQUIREMENT_REVIEW.md) |
| Nghiệm thu người dùng / pixel toàn bộ | Chưa thực hiện | Không tự DONE hoặc miễn trừ SRS |

Mọi log trong bảng nằm tại [evidence/t07](evidence/t07/). [Unit catalog](evidence/t07/unit-test-catalog.json) và [Chromium catalog](evidence/t07/chromium-test-catalog.json) liệt kê từng test đã chạy, status và thời gian; không cộng lượt chạy lại vào tổng test duy nhất.

[execution.json](evidence/t07/execution.json) tổng hợp kết quả cuối, [source-manifest.json](evidence/t07/source-manifest.json) lưu SHA-256, [screenshots.json](evidence/t07/screenshots.json) lưu chỉ mục/hash ảnh. Full Chromium cuối chạy đủ95 ca, gồm93 ca cũ và2 ca T07 mới; unit249/249 và Chromium95/95 PASS không làm audit hoặc hai trường UI tự thành PASS.

Hai FAIL unit đầu đều thuộc auth: `logs in with an opaque token…` (5.286ms) và `rolls back a newly issued session…` (5.035ms). JSON chỉ ghi `STACK_TRACE_ERROR`; thời gian quanh ngưỡng5s và việc suite riêng/full2worker PASS là dấu hiệu nhạy tải/timeout, **chưa đủ chứng minh nguyên nhân gốc**. Không đổi timeout, assertion, source hoặc skip để làm xanh; giữ đầy đủ failure và lượt kiểm lại. Nên dùng worker giới hạn khi tái kiểm chứng trên máy này; điểm ổn định khi tải cao còn được ghi nhận.

FAIL Chromium đầu nằm ở oracle ca `T06 read error detail`: test cố ý làm hỏng mọi lần đọc invoice, sau khi đóng chi tiết quay về danh sách thì danh sách cũng phải báo lỗi. Assertion `:modal=0` ngay sau đóng chi tiết đã đua với thông báo lỗi mới của danh sách. Sửa **test**, không sửa app: xác minh route danh sách, nội dung thông báo lỗi danh sách, đóng nó rồi mới kiểm không còn modal; giữ lỗi tiêm, kiểm toàn bộ dữ liệu và phục hồi sau reload. Không gỡ assertion, không skip hoặc dùng CSS/reload để sửa app. Lượt đầu được giữ riêng; kiểm lại ba nhánh lỗi và full suite sau sửa.

## Ngoại lệ phải giữ mở

### UI và SRS

Người dùng chọn **“Giữ ảnh Figma, ghi BLOCKED hai trường trên UI”**. Nhân viên thực hiện và Trạng thái có trong reader/DTO, nhưng không xuất hiện trong thiết kế chi tiết SC016/094 và bản nhân viên tương ứng. BR-UC1-16 yêu cầu cả hai; UC_4.6 bước5 cũng yêu cầu trạng thái ở chi tiết. Không miễn trừ SRS chỉ vì giữ Figma, không gọi UC_1.2/UC_4.6 đạt toàn bộ.

Ảnh hưởng: không thể đối chiếu người thực hiện/trạng thái ngay trên chi tiết; trạng thái ở danh sách lịch sử vẫn có theo Figma. Hai phương án **chờ chủ dự án xác nhận**: phê duyệt thiết kế bổ sung vị trí cho hai trường; hoặc phê duyệt thay đổi SRS/phạm vi trình bày tương ứng. T07 không tự chọn phương án nào. Pixel nền popup kết quả T04 và đối chiếu pixel cuối T06 tiếp tục chờ review; ảnh/test chức năng không thay nghiệm thu thiết kế.

### Dependency audit

Audit hiện tại báo **13 package findings**, không đồng nghĩa13 lỗ hổng độc lập vì có dependency chain. Theo package-lock:

- `vitest@3.2.7` và `tinypool@1.1.1`: critical, nhánh devDependencies.
- `zod@3.25.76`: high, dependency ứng dụng; advisory [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- `react-router`/`react-router-dom`: moderate, dependency ứng dụng; các mục moderate khác thuộc toolchain/dependency chain. Chi tiết version/range/advisory/fixAvailable ở `audit-summary.json`.

Chưa kiểm chứng khả năng khai thác trên app; không kết luận mọi advisory đều khai thác được hoặc được miễn vì local demo. Nhiều fixAvailable là thay major; **không chạy audit fix/force hoặc tự nâng package**. Cần chủ dự án chốt phạm vi xử lý dependency và regression tiếp theo. Gate audit PASS của plan hiện **không đạt**.

### Các quyết định còn cần chủ dự án chốt

| Vấn đề | Loại / trạng thái |
|---|---|
| Cách đáp ứng hai trường chi tiết bắt buộc theo SRS nhưng không có trong Figma | Quyết định trình bày/yêu cầu còn OPEN; giữ BLOCKED, không tự miễn trừ |
| Phạm vi sửa dependency và đánh giá rủi ro từ audit hiện tại | Quyết định kỹ thuật còn OPEN; không phải thay đổi nghiệp vụ tự động |
| Review pixel T04/T06 và nghiệm thu T05/T06/G6 | Nghiệm thu chưa có xác nhận |
| P03/P04, BR-UC1-07, giá đầu ×1,30 half-up, mapping1/1/2 | Đã có quyết định; T07 không mở lại hoặc tự diễn giải legacy |

Không phát hiện quyết định nghiệp vụ G6 mới cần bổ sung ngoài xung đột trình bày đã ghi. Các điểm OPEN thuộc phase khác vẫn giữ nguyên trong hồ sơ gốc, không đóng theo kết quả test G6.

## Demo A–F và regression

| ID | Kết quả QA và bằng chứng đã thực thi |
|---|---|
| A — duyệt | UI T03/T04/T05 và ca runtime T07: gửi → chủ thấy → duyệt → nhân viên nhận, sau đó hoàn tất/lịch sử |
| B — từ chối | UI T03/T04/T05: bắt buộc lý do, kết quả/lý do đúng, pending/rejected chặn Lưu, nhập lại giá tạo revision/request phù hợp |
| C — session độc lập | Suite auth/G5 và T03/T07: hai tab cùng context, token/role riêng; không ghi đè session |
| D — đồng bộ | T03/T04 request/decision/notice không F5; T07 invoice mới đến danh sách chủ đang mở không F5 |
| E — chống lặp/quyền | Unit CAS/replay/rollback/forged snapshot; UI hai chủ race/double-submit, staff bị chặn; đóng popup không gửi lại quyết định |
| F — regression | Full G2–G5 và T01–T07, native IDB/legacy/reload/transaction; số kết quả cuối theo bảng thực thi |

Các tình huống A–F là QA tự động đã chạy; buổi demo/phiếu nghiệm thu của chủ dự án chưa được xác nhận. [DEMO_ACCEPTANCE.md](DEMO_ACCEPTANCE.md) được cập nhật trạng thái mới; giữ checklist lịch sử để truy vết.

## Figma và ảnh

Nguồn local CODEX của hai role, không dùng Figma link: SC010–017/201–209 (danh sách/chi tiết), SC018–036/210–228 (tạo và kết quả), SC091–094/284–287 (lịch sử/chi tiết), bộ approval SC130–144. Giữ logo, palette, layout/component hiện hành; không sửa UI trong T07.

Ảnh mới từ luồng UI T07: [Chủ xem yêu cầu](evidence/t07/t07-owner-request.png), [Nhân viên nhận duyệt](evidence/t07/t07-staff-approved.png), [Chủ nhận hóa đơn live](evidence/t07/t07-owner-live-invoice.png), [Chủ chi tiết](evidence/t07/t07-owner-invoice.png), [Nhân viên chi tiết](evidence/t07/t07-staff-invoice.png), [Chủ lịch sử](evidence/t07/t07-owner-history.png), [Nhân viên lịch sử](evidence/t07/t07-staff-history.png). Ảnh runtime T07 ở1440×900; các suite T02/T03/T04/T06 tái chụp1366×768,1440×900,1920×1080 trong full Chromium. [Chỉ mục ảnh](evidence/t07/screenshots.json) liệt kê bản lưu của lượt T07; không dùng ảnh cũ giả làm ảnh chạy mới.

Ảnh bổ sung từ chính lần full cuối: [Chủ nhập lý do](evidence/t07/approval-owner-rejection-reason.png), [Chủ đã từ chối](evidence/t07/approval-owner-rejected.png), [Nhân viên nhận từ chối](evidence/t07/approval-staff-rejection-result.png), [Nhân viên xem lý do](evidence/t07/approval-staff-read-reason.png). Ảnh chi tiết hai role/ba viewport từ suite T06 cũng được lưu trong cùng thư mục.

Đối chiếu cấu trúc và nội dung với CODEX, xem ảnh sau khi test; không tuyên bố pixel-perfect hoặc mọi màn/states đã được người dùng nghiệm thu. Không chụp ảnh giả cho native migration; dùng [log native](evidence/t07/t07-native-migration.json) và [runtime graph](evidence/t07/t07-runtime-graph.json).

## File thay đổi

- Mới: `tests/e2e/g6-verification.spec.ts`, `tests/fixtures/g6-migration-verification.ts` — chỉ kiểm chứng, app không import harness.
- Sửa: `tests/e2e/purchase-queries.spec.ts` — oracle hai thông báo lỗi độc lập dưới lỗi đọc kéo dài, giữ nguyên các kiểm tra toàn vẹn dữ liệu và không còn overlay.
- Mới: `planning/phase6/T07_EXECUTION.md`, `G6_ACCEPTANCE_MATRIX.md`, evidence/log/catalog/hash và script tái tạo chỉ mục `evidence/t07/summarize.mjs`.
- Cập nhật `REPORT_PHASE_6.md`, `ACCEPTANCE_CHECKLIST.md`, `PLAN_PHASE_6.md`, `DEMO_ACCEPTANCE.md`, `planning/MASTER_PLAN_COCO.md`, `planning/PHASE_ROADMAP.md`, giữ thứ tự và phạm vi.
- Sửa số **20 file → 12 file** trong báo cáo T06:20 là `numPassedTestSuites` (gồm describe), không phải số `testResults`/file. Không sửa JSON bằng chứng cũ.
- Static audit được chạy lại và lưu bản kết quả; không sửa script audit hoặc mã ứng dụng. Manifest hash đi kèm phân biệt pre-existing working tree với thay đổi T07.

## Mở localhost và review

```powershell
cd D:\50K142-NEW\CoCo
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Mở `http://127.0.0.1:5173/50K142.03.3007/`. Tài khoản/dữ liệu Playwright nằm ở profile riêng, không seed vào trình duyệt người dùng. Demo hai tab theo [DEMO_ACCEPTANCE](DEMO_ACCEPTANCE.md) và [T06_EXECUTION](T06_EXECUTION.md); không F5 để chứng minh đồng bộ request/decision/invoice, chỉ reload ở bước kiểm bền dữ liệu.

Đề xuất thực tế: **G6 PENDING REVIEW**, gói T07 đã kiểm chứng các phần không bị chặn và trình đầy đủ ngoại lệ. Không đề xuất DONE/không tự chuyển G7; chưa đạt gate audit và BR-UC1-16, còn review Figma/nghiệm thu người dùng.
