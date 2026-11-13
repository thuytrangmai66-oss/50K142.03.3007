# G8-T06 — Kiểm chứng đồng thời và hồi quy

> Chốt kiểm chứng G8-T06 ngày 13/11/2026: thêm 3 E2E về lỗi thanh toán/reload/retry hai vai trò và tranh chấp cùng sản phẩm. **Full Chromium 131/131 PASS**, 0 FAIL/SKIP; lint lượt T06 PASS. Runtime/build/lockfile không đổi, tái sử dụng baseline 345/345 unit/integration, typecheck/build PASS từ T05 (không chạy lại các lệnh này trong T06). T06 IMPLEMENTED / PENDING REVIEW; chưa nghiệm thu G8, chưa chuyển G9. [Execution](T06_EXECUTION.md) · [Gói review và ngoại lệ](G8_REVIEW_GATE.md). Không commit/push/deploy lượt này; các mốc dưới giữ làm lịch sử.

> Cập nhật sau khi người dùng yêu cầu tiếp tục G8-T05, trên HEAD nền `7338294`: sửa đúng popup/nền danh sách lịch sử theo Figma và thêm 2 bài lỗi T05. Kiểm chứng cuối **345/345 unit/integration, 128/128 full Chromium, lint/typecheck/build PASS**, 0 SKIP. Bài lịch sử thu mua từng lỗi PASS trong 3 lượt riêng và full cuối, chưa xác minh nguyên nhân lần lỗi cũ. [Execution T05 và bằng chứng](T05_EXECUTION.md). Các kết quả FAIL/dừng push bên dưới thuộc lượt trước, được giữ làm lịch sử. G8/T06 vẫn PENDING REVIEW; trạng thái trên chi tiết lịch sử mua là điểm review OPEN, không tự miễn trừ SRS.

Ngày 13/11/2026. **PENDING REVIEW**. Không tự đánh dấu T05/T06/G8 DONE. Không mở rộng kiến trúc hoặc nghiệp vụ.

## Tiếp tục T06 sau T05 — kiểm chứng bổ sung

Mốc tiếp quản giữ nguyên `coco/phase-7`, HEAD `733829496c2506e637db37445c90672c425d843b` cùng working tree T05. Không chuyển branch, staging, commit, push hoặc deploy. T05 còn điểm UI trạng thái OPEN nhưng không cản việc kiểm chứng các giao dịch đã có; không tự nghiệm thu ngoại lệ này.

Rà soát test hiện hữu xác nhận đã có hai kết nối tranh chấp hàng, điểm trên hai món, scheduler/quote cũ và native rollback. Khoảng trống được bổ sung bằng `tests/e2e/sales-t06-recovery.spec.ts`, không viết lại chức năng đã hoàn thành:

| Kịch bản mới | Thao tác UI và oracle |
|---|---|
| Chủ: lỗi ghi rồi reload/retry | Tạo giỏ và quote thật; inject lỗi native `auditEntries.add`; xác nhận toàn bộ store rollback; reload giữ giỏ, chọn lại khách qua UI, điểm vẫn 50; mở quote mới, double-click Đã nhận; chỉ 1 hóa đơn/chi tiết/snapshot/receipt/audit, điểm 8 và món đã bán; reload lại không nhân đôi |
| Nhân viên: lỗi ghi rồi reload/retry | Cùng oracle, tài khoản nhân viên thật, session riêng tab; quote bị bỏ trước reload không tạo hóa đơn hoặc giữ chỗ mã |
| Chủ và Nhân viên cùng món | Hai tab giữ QR cùng một sản phẩm/thành viên; gửi xác nhận đồng thời; đúng 1 thành công, 1 lỗi dữ liệu đã đổi; kiểm nhân viên trên hóa đơn là người thắng, 1 receipt/điểm cập nhật, đóng popup không ghi tiếp và reload giữ hai vai trò riêng |

Mọi giao dịch kiểm chứng đi qua UI thật và IndexedDB native của browser context riêng. Chỉ inject lỗi đọc/ghi tại ranh giới native hoặc chuẩn bị số dư biên đã được dùng trong fixture, không mock finalizer hoặc kết quả nghiệp vụ. Bắt console error/pageerror trên cả hai tab. Không seed dữ liệu vào origin người dùng cổng 5173.

### Kết quả lượt này

- Ba bài mới **3/3 Chromium PASS**, 37,1 giây, log `chromium-t06-recovery.log`.
- Lint sau khi hoàn tất file test mới **PASS**, log `lint-t06.log`.
- Baseline runtime không đổi từ T05: **345/345 unit/integration**, typecheck và production build PASS, log `unit-t05-full.log`, `typecheck-t05.log`, `build-t05.log`. Không báo là các lệnh này đã chạy lại trong T06: task này chỉ thêm test/docs nên tái sử dụng kết quả trên cùng source/build.
- Full Chromium cuối **131/131 PASS, 0 FAIL, 0 SKIP, exit 0**, 16,6 phút; log `chromium-t06-full-final.log`. Không sửa test cũ, tăng timeout bài cũ hoặc bỏ test để có kết quả này.
- Đối chiếu fingerprint sau test: 0 source hash thay đổi, số file source khớp, index build và lockfile không đổi. Việc tái sử dụng baseline unit/typecheck/build là trên cùng runtime, không suy diễn từ commit HEAD.
- [Danh sách 131 bài đã thực thi](evidence/t05-t06/T06_TEST_EXECUTION.csv), sinh từ progress log và chỉ gán PASS sau khi full suite kết thúc thành công, không có bài skip/fail.
- Bài lỗi lịch sử thu mua cũ tiếp tục PASS ở full T06, sau 3 lượt riêng và full T05 đã PASS. Chưa xác minh nguyên nhân lần lỗi cũ; giữ lịch sử thay vì tuyên bố đã sửa triệt để.
- [Manifest runtime/build](evidence/t05-t06/T06_RUNTIME_MANIFEST.json) ghi SHA-256 source, index build và lockfile; đây là build working tree trên nền commit, không gán kết quả cho clean HEAD.

Ảnh: [Chủ retry sau reload](evidence/t05-t06/owner-retry-after-reload.png), [Nhân viên retry sau reload](evidence/t05-t06/staff-retry-after-reload.png), [tranh chấp tồn kho hai vai trò](evidence/t05-t06/cross-role-stock-conflict.png).

### Trạng thái bàn giao T06

**IMPLEMENTED / PENDING REVIEW**. File code mới của riêng lượt T06: `tests/e2e/sales-t06-recovery.spec.ts`; không sửa source sản phẩm. File báo cáo: `T06_EXECUTION.md`, `G8_REVIEW_GATE.md`, checklist, PLAN/REPORT_PHASE_8 và ghi chú tiến độ master; artifact gồm CSV thực thi, manifest runtime, log và ba ảnh trên. Working tree T05 cùng mọi file ngoài phạm vi được giữ nguyên, không staging/commit/push/deploy.

[Gói review G8](G8_REVIEW_GATE.md) liệt kê trạng thái task và ngoại lệ. Không còn task code tiếp theo trong G8 sau T06; cần review/nghiệm thu và chốt ngoại lệ trước khi mở G9. UI trạng thái trên chi tiết lịch sử mua vẫn OPEN/BLOCKED, các kiểm tra thiết bị thật vẫn NOT RUN. Test PASS không tự tạo quyết định nghiệm thu.

## Phạm vi thực hiện

Kiểm tra các kiểm thử có sẵn của T01–T04 trước khi bổ sung các khoảng trống: hai tab dùng chung 50 điểm nhưng mua hai món khác nhau, scheduler thay giá khi QR đang mở, lịch sử và bản in T05. Không viết lại finalizer/scheduler đã hoạt động.

| Yêu cầu/ca lỗi | Bằng chứng thực thi |
|---|---|
| UC_3.1, BR-UC3-01..05: hàng còn bán, giá hiện hành, thanh toán đúng một lần | `sales.test.ts`, `sale-payment.test.ts`, `sale-payment.spec.ts`, `sales-t06-recovery.spec.ts`: hàng đã bán, giá/version/revision cũ, double-click, replay, hủy/đăng xuất, hóa đơn và chi tiết |
| BR-UC3-06..10, D01/D02/D05: thành viên/điểm/ưu đãi | Unit calculator/payment; E2E hai tài khoản, hai món cùng 50 điểm: tab đầu thanh toán, tab sau bị chặn quote cũ, không ghi một phần, lấy lại quote theo điểm mới và thanh toán thành công |
| Hai tab không bán cùng món hai lần, session độc lập | E2E native IndexedDB trong `sale-payment.spec.ts`; bài mới giữ footer đúng vai trò, dữ liệu nhất quán sau reload |
| Transaction lỗi và rollback, retry không nhân đôi | Unit fault injection vào invoice/details/product/points/snapshot/receipt/audit và thêm issuedIdentifiers/recordVersions/operations; mỗi lần lỗi toàn bộ dữ liệu không đổi và cùng lệnh retry thành công đúng một lần; E2E native fault injection cũ giữ nguyên |
| BR-UC2-07/09 và chu kỳ giá: scheduler tranh chấp thanh toán | Unit chạy đồng thời scheduler/finalizer: chỉ một thứ tự giao dịch hợp lệ, quote cũ bị CONFLICT nếu scheduler thắng; E2E dịch thời gian 35 ngày, focus kích hoạt catch-up, QR cũ bị chặn rồi thanh toán theo giá mới |
| UC_3.2, lịch sử, snapshot và dữ liệu cũ | Unit/E2E danh sách, detail, nhiều dòng, profile đổi, lỗi snapshot; `reference-data.spec.ts` regression legacy, không tự map mã cũ |
| G2–G7 regression: nền DB, session, quyền, thu mua/phê duyệt hai tab, tồn kho/scheduler | Chạy toàn bộ unit/integration 16 file và toàn bộ Chromium; không skip bài cũ |

Chi tiết nguồn/UI và file sản phẩm: [T05_EXECUTION.md](T05_EXECUTION.md). T06 chỉ bổ sung kiểm thử; không đổi finalizer, scheduler, schema hoặc hợp đồng P05.

## Kết quả thực thi lượt trước — lưu lịch sử

Lint, typecheck riêng và production build **PASS**. Full unit/integration chạy riêng: **345/345 PASS, 16/16 file PASS, 0 FAIL, 0 SKIP**, exit 0, 153,64 giây; log `unit-full-serial.log`.

**Full Chromium cuối: 125 PASS / 1 FAIL / 0 SKIP**, exit 1, 9,2 phút; log `chromium-full-final.log`. Bài thất bại: `purchase-queries.spec.ts:99`, “T06 read error history: Figma notice closes without fabricated data or writes”. Sau thao tác reload/phục hồi lỗi đọc, assertion tại dòng 128 không tìm thấy link hóa đơn thu mua `TM585bbbe6` trong 5000ms. Nguyên nhân gốc chưa được xác minh; không kết luận chỉ do máy chậm. Ba bài T05/T06 mới đều PASS trong lượt này nhưng **full regression FAIL**. [Error context giữ local](evidence/t05-t06/chromium-final-failure-context.md).

Trong khi chạy bộ cuối, người dùng bổ sung yêu cầu commit/push và bắt buộc dừng nếu có test FAIL. Vì vậy **đã dừng trước staging/commit/push**, không sửa test, không nâng timeout, không rerun để vượt cổng kiểm chứng sau lỗi cuối. T06 **BLOCKED về kiểm chứng / PENDING REVIEW**; G8 chưa DONE, chưa đủ điều kiện chuyển G9.

Lượt tập trung trước khi tinh chỉnh nền in/breadcrumb cuối: **49/49 unit/integration**, **16/16 Chromium PASS**. Lượt full unit ban đầu chạy cùng Chromium: **344 PASS / 1 FAIL / 0 SKIP**, bài `staff-accounts.test.ts` đổi tài khoản timeout 5000ms; không có assertion sai dữ liệu. Giữ log lỗi tại `evidence/t05-t06/unit-full.log`, không tăng timeout hoặc bỏ bài; chạy lại toàn bộ riêng sau Chromium để xác minh.

Full Chromium lần đầu: **125 PASS / 1 FAIL / 0 SKIP** trong 8,4 phút. Bài T06 scheduler chụp baseline khi giá đã cập nhật nhưng bookkeeping run còn `running`; sau đó log nền hoàn tất làm so sánh toàn DB thất bại. Sửa riêng test để đợi run đúng ngày thành công và lock được giải phóng trước baseline. Vẫn so sánh toàn bộ store, không bỏ metadata hoặc nới assertion. Logic scheduler/payment không đổi. Thêm bắt console error/pageerror trên cả hai tab cho ba bài T05/T06. Giữ log đầu tại `chromium-full.log`.

## Bằng chứng và bàn giao

- Log tại `evidence/t05-t06/`: `unit-focused.log`, `chromium-focused.log`, `unit-full.log`, `unit-full-serial.log`, `chromium-full.log`, `chromium-full-final.log`, `lint.log`, `typecheck.log`, `build.log`.
- Ảnh T05 hai vai trò và print-media: xem [T05](T05_EXECUTION.md).
- Ảnh T06: [quote điểm cũ bị chặn](evidence/t05-t06/owner-stale-points-qr.png), [quote mới sau scheduler](evidence/t05-t06/scheduler-repriced-qr.png).
- Test dùng DB/origin kiểm thử riêng; các sản phẩm/giao dịch chính đi qua UI thật. Fixture điểm biên chỉ chuẩn bị tiền điều kiện kiểm thử, không seed dữ liệu vào ứng dụng local của người dùng.
- Branch `coco/phase-7`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`; giữ working tree đang phát triển. Không commit/push/deploy.

## Ngoại lệ chưa nghiệm thu

- Kiểm tra thủ công app ngân hàng/QR, máy quét mã vật lý và máy in **NOT RUN**; không thay bằng kết quả mô phỏng trình duyệt.
- G6 hai trường nhân viên/trạng thái trên UI vẫn **BLOCKED** theo quyết định giữ Figma; G7 payload máy quét vẫn mở. Không tự miễn trừ các yêu cầu này.
- Audit dependencies trước đó có 13 findings (2 critical, 1 high, 10 moderate); không chạy lại audit hoặc đổi dependencies trong task này.
- Nghiệm thu T02–T06/G8 cần chủ dự án xác nhận. Chỉ đề xuất review sau khi trình bày đầy đủ kết quả; không tự chuyển G9.

## Kiểm tra local

Chạy `D:\50K142-NEW\CHAY_COCO_LOCAL.cmd`; mở http://127.0.0.1:5173/50K142.03.3007/ trong Chrome. Giữ đúng origin để dùng dữ liệu hiện có, không xóa storage. Xem [LOCAL_RUN.md](LOCAL_RUN.md).

1. Đăng nhập Chủ và Nhân viên trên hai tab cùng trình duyệt.
2. Tại Bán hàng, chọn khách đã đăng ký thành viên và sản phẩm hợp lệ; kiểm tra ưu đãi tự động khi đủ 50 điểm.
3. Thanh toán tiền mặt hoặc chuyển khoản sau khi kiểm tra tiền thực nhận; đóng thông báo trở về danh sách.
4. Mở chi tiết từ danh sách hoặc Khách hàng → Lịch sử mua → giao dịch; đối chiếu tiền/hàng. Ctrl+P để xem bản in không có sidebar.
5. Tab còn lại có thể tra cùng lịch sử; nếu đang giữ quote điểm/giá cũ, thanh toán phải bị chặn và cho phép quay lại lấy quote mới.
