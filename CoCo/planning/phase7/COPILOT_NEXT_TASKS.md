# Bàn giao tiến độ và công việc tiếp theo cho Copilot

> Cập nhật sau nghiệm thu13/11/2026: chủ dự án đã nghiệm thu phần G7 đã triển khai và giao việc tiếp. **Công việc hiện hành là [G8-T01 cho Copilot](../phase8/COPILOT_T01_TASK.md)**. Xem [biên bản phạm vi và ngoại lệ](ACCEPTANCE_2026_11_13.md). Các mục rà soát trước nghiệm thu bên dưới là lịch sử; không giao lại T02–T06. Barcode/audit/G6 UI vẫn mở.

Rà soát ngày **13/11/2026**, workspace `D:\50K142-NEW\CoCo`. Lượt này chỉ đọc repository/log và tạo tài liệu bàn giao, **không sửa application source hoặc chạy lại test**.

## 1. Trạng thái đối chiếu trước nghiệm thu — lịch sử

| Hạng mục | Thực tế |
|---|---|
| Git | Branch `coco/phase-7`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`; nhiều thay đổi tracked/untracked chưa commit. Không reset/clean/ghi đè chúng |
| G6 | Thu mua/phê duyệt/lịch sử đã có runtime/test; vẫn **PENDING REVIEW**. Hai trường UI BR-UC1-16 BLOCKED và dependency audit còn FAIL |
| G7-T01 | Query/filter/pagination/detail/validation đã có; **PARTIAL/PENDING REVIEW** vì barcode chưa xác nhận payload, nút Quét mã vạch còn disabled |
| G7-T02/T03 | Sửa từng món, validation, quyền, CAS/rollback/replay và reset chu kỳ đã có runtime/test; **PENDING REVIEW** |
| G7-T04/T05/T06 | Scheduler trình duyệt, catch-up, claim/lease/idempotency, nhật ký và monitor đã có runtime/test; **PENDING REVIEW** |
| Kiểm thử gần nhất | **298/298 unit (14 file), 107/107 Chromium**, lint/typecheck/build exit0 trong `evidence/handoff-current/` |
| G8 | Có plan; chưa bắt đầu runtime. Không tự chuyển G8 khi các gate hiện hành chưa được xử lý |

Nguồn kiểm chứng: [báo cáo G7](REPORT_PHASE_7.md), [T02–T06](T02_T06_EXECUTION.md), [checks](evidence/handoff-current/checks.txt), [unit log](evidence/handoff-current/unit-full.log), [Chromium log](evidence/handoff-current/chromium-full.log), [Chromium exit](evidence/handoff-current/chromium-exit.txt).

**Mốc đúng để bàn giao là 107 Chromium**, không phải 105 của lượt trước. Ba file `InventoryPages.tsx`, `index.css`, `inventory.spec.ts` đã thay đổi sau lượt105. Chúng đều có mtime trước production build mới nhất; không thấy file TS/TSX/CSS trong `src/` hoặc `tests/` có mtime sau build đó tại lúc rà soát. Đây là đối chiếu log/mtime, không phải một lần tái kiểm thử mới hoặc chứng thực hash của lần chạy cũ.

Các quy tắc **đã chốt**, không hỏi lại: [Decision Log](DECISION_LOG.md).

- Chủ và Nhân viên đổi giá thật đều reset giá gốc/ngày chu kỳ, giữ ngày nhập kho.
- Giá sau giảm30% = giá gốc chu kỳ×0,70; nearest/half-up, không compound/lặp mốc.
- Từ45 ngày luôn đúng20.000đ, kể cả tăng từ giá thấp hơn.
- Local IndexedDB/Dexie, không Supabase/backend; giữ dữ liệu và mã legacy.

## 2. Hồ sơ giao việc trước nghiệm thu và các gate còn mở

### A — Khép review G7 trước khi mở module mới

1. Đọc Master Plan, PLAN_PHASE_7, report, Decision Log, review T01/T02 và SRS/CODEX local. Phân biệt đoạn lịch sử với trạng thái hiện hành; không làm lại T02–T06 đã có runtime.
2. **Giữ danh sách Hàng hóa 5 cột** theo xác nhận trực tiếp của chủ dự án ngày13/11/2026 (G7-D04 trong Decision Log). Việc bỏ cột Số ngày tồn khỏi danh sách đã được chốt; chi tiết vẫn hiển thị số ngày. Không kiểm tra lại quyết định này, không ghi thành gap/blocker hoặc khôi phục cột thứ sáu theo ảnh Figma cũ.
3. Kiểm tra ảnh của hai vai trò, popup sửa, trạng thái sold, pagination và monitor theo CODEX. Giữ các tinh chỉnh giao diện mới; không dùng việc đồng bộ CSS làm lý do bỏ dữ liệu/control theo thiết kế.
4. Cập nhật bảng nghiệm thu G7 theo từng UC_2.1/2.2/2.3, BR-UC2-01…09, ghi riêng PASS/FAIL/BLOCKED/NOT RUN; chưa tự DONE.

### B — Hoàn thiện nhánh barcode G7-T01 khi được xác nhận

Thông tin đang thiếu: payload trên tem có phải **nguyên MaSP** không, và máy quét có hoạt động như bàn phím gửi mã/Enter hay định dạng khác. Câu hỏi đã gửi nhưng chưa có câu trả lời trong Decision Log.

- Khi chưa xác nhận: giữ BLOCKED, chỉ chuẩn bị mapping/test cases; không tự tạo định dạng mã, sinh tem, bật camera hoặc giả scan thành công.
- Sau xác nhận: dùng đúng input/nút/feedback Figma và mapping đã chốt; máy quét nhập mã thì tra cứu cùng dữ liệu thật, có đường nhập tay khi quét lỗi. Không thay schema/giá/trạng thái/phiên đăng nhập chỉ để hỗ trợ lookup.
- Test cả Chủ và Nhân viên: payload hợp lệ mở đúng món; không tìm thấy; payload lỗi/không đọc được; nhập tay; reload; không ghi dữ liệu từ lookup; console và regression. Máy quét vật lý không có thì ghi **NOT RUN phần hardware**, không lấy test phím gõ làm bằng chứng đã kiểm thiết bị thật.

### C — Audit dependency: rà soát và đưa phương án, không tự nâng major

Kết quả gần nhất G6-T07 là **13 package findings**:2 critical,1 high,10 moderate. G7 chưa chạy lại npm audit do package/lock không đổi; không diễn giải thành đã sạch.

- Chạy audit chỉ đọc để cập nhật kết quả; lưu log/exit code và phân loại direct/transitive, runtime/dev.
- Đối chiếu các mục đã ghi nhận: vitest/tinypool critical thuộc dev; zod high và react-router/router-dom moderate thuộc dependency ứng dụng. Không khẳng định mọi advisory đều khai thác được hoặc được miễn vì đây là demo.
- Chuẩn bị bảng phiên bản hiện tại/phương án sửa/tương thích/rủi ro/regression. Không chạy `npm audit fix --force`, thay major hoặc sửa lockfile khi chưa được phê duyệt phạm vi xử lý.
- Giữ audit gate FAIL/OPEN cho đến khi có kết quả và quyết định thực tế.

### D — Sau khi khép gate mới chuẩn bị G8

G8 tiếp theo đúng roadmap là **Bán hàng, thành viên, QR cục bộ**. Trước coding cần đối chiếu P06/sự kiện đăng ký thành viên, cách làm tròn ưu đãi20% còn mở ở P07 và contract snapshot hóa đơn/điểm. **Không tự lấy half-up cho giảm30% G7 áp sang20% G8.** Chưa có quyết định thì ghi OPEN, làm rõ trước task phụ thuộc.

Hai trường Nhân viên thực hiện/Trạng thái trên chi tiết G6 vẫn BLOCKED theo lựa chọn giữ Figma. Không tự thêm vào UI, sửa SRS hoặc coi chỉ đạo tiếp tục là nghiệm thu/miễn trừ.

## 3. Prompt giao Copilot hiện hành

> Chủ dự án đã nghiệm thu phần G7 đã triển khai theo planning/phase7/ACCEPTANCE_2026_11_13.md. Hãy đọc planning/phase8/COPILOT_T01_TASK.md và bắt đầu G8-T01 phần giỏ hàng/snapshot giá độc lập. Giữ nguyên barcode, audit và hai trường UI G6 ở trạng thái còn mở; không làm lại T02–T06 G7. Làm rõ P06 và phần làm tròn20% P07 trước task phụ thuộc; không tự chốt theo quy tắc30% G7. Giữ nguyên roadmap, dữ liệu, kiến trúc local và UI đã được chốt; kiểm thử và bàn giao theo phiếu. Không commit/push/deploy/reset dữ liệu hoặc tự DONE G8.
