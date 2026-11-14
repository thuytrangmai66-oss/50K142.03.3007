# G11-B03 — Regression review trước release

Ngày 15/11/2026 (giờ Việt Nam). **PO APPROVED: ACCEPTED FOR RELEASE / DEFERRED.** Nguyên nhân chưa xác định, lỗi chưa được khắc phục. Không mở rộng sửa source trong lần release này.

- Full Chromium sau bản sửa B02: **166 PASS / 1 FAIL**, không skip/retry. FAIL: `tests/e2e/phase10-finalize-benchmark.spec.ts:17`, case `G10-T05 owner 1000`, ở bước thêm sản phẩm (`sales-helpers.ts:31`).
- Assertion giữ nguyên: input “Mã sản phẩm” phải về rỗng sau khi thêm. Log cho thấy input còn disabled với mã vừa nhập, sau đó không tìm thấy input; failure context hiển thị “Đang tải giao dịch…”. Timeout 5.000 ms không bị đổi.
- Case bắt đầu `2026-11-14T16:59:49.123Z`, kéo dài 16.252 ms, đi qua **00:00 giờ Việt Nam**. Source `startDiscountScheduler` có lịch chạy vào nửa đêm và `appMetadata` được cập nhật theo từng sản phẩm. Trùng thời điểm là căn cứ điều tra, chưa phải kết luận quan hệ nhân quả. Lần FAIL không có trace do cấu hình hiện tại chỉ trace khi retry, còn local retries = 0.
- Tái kiểm đúng case với `--repeat-each=3 --trace=on`, giữ assertion/timeout/source, **3 PASS / 0 FAIL** sau nửa đêm. Chưa tái hiện lỗi ở điều kiện qua nửa đêm; không tự kết luận flaky hoặc coi full suite đã PASS.
- B02 geometry đã PASS 9/9, unit/integration 538/538, lint/typecheck/build PASS. Không có sai lệch geometry khác vượt 2 px. Source/CSS/schema/dependency/workflow không đổi, chỉ test X được PO duyệt.

PO chấp nhận tạm thời B03 dựa trên kết quả full 166 PASS/1 FAIL, B02 đã PASS, thời điểm qua 00:00 và ba lượt recheck PASS chưa tái hiện điều kiện chuyển ngày. Đây là known issue riêng, không phải đã sửa hoặc test PASS. Giữ nguyên failure context và kết quả cũ.

PO yêu cầu chạy lại full Chromium **một lần** vào thời gian bình thường, giữ nguyên benchmark/assertion/timeout/source. Chỉ khi đủ **167 PASS** mới commit B02 và push thường lên `origin/main`; chỉ deploy khi CI PASS. Nếu lượt full này hoặc CI còn FAIL thì dừng release, báo lỗi, không bypass hoặc tự sửa thêm. Sau deploy thành công mới chạy G11-T03 smoke. G11-T04/T05 chưa hoàn thành.

Lượt chạy mới bắt đầu **00:13:56 ngày 15/11/2026 (giờ Việt Nam)**, không đi qua mốc chuyển ngày: **167 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, exit 0, không retry. Đây là đúng một lượt full được PO yêu cầu. [Evidence lượt release](evidence/b03-release-verification.json) giữ kết quả riêng; lần FAIL trước không bị đổi. Unit/lint/build dùng evidence còn hợp lệ vì protected source/test/dependency và bundle giữ nguyên, ngoài phép đo X B02 đã kiểm chứng.

Đã đủ điều kiện local để commit B02; CI/deploy/smoke của commit mới còn chờ. Kết quả PASS lần này không xác định nguyên nhân hoặc khắc phục B03. Nếu CI FAIL thì dừng release theo PO.

Bằng chứng: [tổng hợp kiểm chứng B02](evidence/b02-verification.json), [failure context](evidence/b03-error-context.md). Log/trace/JSON chi tiết giữ local trong recovery `b02/`. CODEX 1.162 file giữ nguyên hash, không đưa vào Git.
