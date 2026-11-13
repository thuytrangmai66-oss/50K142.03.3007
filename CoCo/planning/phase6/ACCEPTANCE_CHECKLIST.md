# Checklist nghiệm thu G6

> T07 ngày 12/11/2026: gói kiểm chứng tại [T07_EXECUTION.md](T07_EXECUTION.md), bảng từng UC/BR tại [G6_ACCEPTANCE_MATRIX.md](G6_ACCEPTANCE_MATRIX.md). **T05/T06/T07/G6 PENDING REVIEW**: BR-UC1-16 còn hai trường UI BLOCKED; dependency audit FAIL. Không tự DONE hoặc chuyển G7. Các mốc IN PROGRESS/NOT RUN phía dưới là lịch sử trước T07.

> Cập nhật T06 ngày 12/11/2026: **T05/T06 PENDING REVIEW, G6 IN PROGRESS**. Tra cứu và lịch sử đã triển khai; hai trường Nhân viên/Trạng thái ở chi tiết **BLOCKED** theo quyết định giữ Figma. [T06_EXECUTION.md](T06_EXECUTION.md) là mốc hiện hành; các dòng T06 chưa triển khai bên dưới là lịch sử. Giữ thứ tự T07, chưa chuyển G7.

> T05 đã được kích hoạt và kiểm qua UI thật. **233 unit/integration + 88 Chromium PASS**, gồm 7 ca UI T05 và 1 ca native T05. [Báo cáo, ảnh và điểm bàn giao](T05_EXECUTION.md). T05 PENDING REVIEW; trạng thái PARTIAL/NOT RUN của mốc candidate phía dưới là lịch sử.

> T05 hiện PARTIAL. Candidate đạt 21 unit/integration và native Chromium transaction, nằm trong full 232 Vitest + 81 Chromium PASS. Mapping OPEN đang chờ xác nhận; luồng Lưu UI/screenshot/nghiệm thu T05 còn NOT RUN. [Chi tiết và câu hỏi cụ thể](T05_CANDIDATE_PROGRESS.md).

> T04 đã triển khai và có 5 ca Chromium UI cùng regression 211 unit/integration + 80 Chromium PASS. [Báo cáo T04](T04_EXECUTION.md) ghi riêng nghiệm thu người dùng và pixel phần nền popup còn chờ review. Các dòng NOT RUN của T04 bên dưới là mốc trước triển khai này.

> T03 đã triển khai UI SC130–144, owner route/service và kiểm thử Chromium qua giao diện thật. [Bằng chứng và giới hạn](T03_SERVICE_PROGRESS.md). T03 chờ review/nghiệm thu, G6 IN PROGRESS.

Ngày 11/11/2026. Đây là checklist QA phần mềm, **không phải checklist kiểm định hàng hóa**. Không tự thêm control/database trạng thái chất lượng. Mọi task vẫn cần xác nhận nghiệm thu; test PASS không tự đổi trạng thái DONE.

Sau phản hồi làm sai bố cục, bổ sung oracle geometry SC018/SC210 từ PDF gốc: [khôi phục layout editor](PURCHASE_EDITOR_LAYOUT_REVIEW.md), 12 khối tại 1440×900 và ảnh ba viewport, hai role. Không dùng PASS chức năng hoặc PASS một popup để kết luận toàn màn khớp Figma.

Phản hồi UI T02 đã bổ sung kiểm chứng luồng khách có thật SC030–032/SC222–224, vị trí gợi ý, chọn/reload/đổi khách và lỗi ghi/retry; cùng border bảng Thu mua: [báo cáo sửa Figma](PURCHASE_CUSTOMER_FIGMA_REVIEW.md). Trạng thái nghiệm thu task giữ nguyên.

| Task | Đối chiếu nguồn / tiêu chí | Unit + integration | Chromium / kiểm tra thủ công / bằng chứng | Nghiệm thu |
|---|---|---|---|---|
| T01 | P03/P04; giữ khóa/quan hệ/trạng thái legacy; draft không tạo khách/hóa đơn giả; snapshot line/revision/price; FK/provenance; CAS/receipt/audit/rollback | `purchase-contract.test.ts`, `purchase-candidate.test.ts`; giá ×1,30 half-up, FK mới/legacy, marker lỗi, rollback schema/write, quyền, stale/replay, adapter, alias G5 | `purchase-candidate-storage.spec.ts`: 2 native IDB integration, log JSON. Full regression 154 unit/integration + 54 Chromium PASS. [Gói review](T01_REVIEW_GATE.md) | ĐÃ NGHIỆM THU bởi xác nhận người dùng 11/11/2026; cho phép và đã kích hoạt runtime v4. Producer quyết định/finalize vẫn T03/T05 |
| T02 | UC1.1, BR-UC1-01..11, SC018–036/210–228; nhập món/chọn khách/tạo khách theo nguồn; >Max tự gửi; quality kiểm thủ công ngoài app | `purchase-drafts.test.ts` và regression contract/candidate: validation, Max, pending, replay, audit rollback, session | `purchase-drafts.spec.ts`: hai role qua UI, input/price lỗi, pending/reload/remove/cancel, lỗi ghi/retry, khách thật; ba desktop viewport. [Bằng chứng](T02_EXECUTION.md) | READY FOR REVIEW; chưa có nghiệm thu T02 |
| T03 | UC6, BR-UC6-01..06, SC130–144; chỉ chủ quyết định pending, lý do bắt buộc | purchase-approvals.test.ts kiểm quyền, snapshot, CAS, replay, rollback, filter và giữ lịch sử khi thêm món | purchase-approvals.spec.ts kiểm UI thật, hai tab, approve/reject, reason-empty/long/cancel, save/delivery failure cả hai nhánh, remove/cancel, race, phân trang và console; ảnh ba desktop viewport | Đã triển khai, chờ review/nghiệm thu; kết quả tại T03_SERVICE_PROGRESS.md |
| T04 | UC1.1 ALT, UC6 bước 9; staff nhận đúng trạng thái/lý do không F5 | Quyền recipient, acknowledge CAS/audit/rollback; reprice revision/receipt/snapshot; khung giá cũ/mới; bỏ dòng/hủy draft | 5 Chromium T04 PASS qua UI thật, 3 desktop viewport, kết quả/đọc lý do/nhập lại giá, lỗi phát/ghi/ack, hai tab cùng người tạo không hiện trùng | Đã triển khai, chờ review UI/nghiệm thu theo T04_EXECUTION.md |
| T05 | UC1.1 hoàn tất; cost từng món, giá bán đầu ×1,30 half-up; ngày nhập bất biến; inventory nhất quán | 21 finalizer PASS với mapping runtime, thêm regression lịch sử request; full 233 Vitest PASS | 7 UI T05 PASS cho hai vai trò, 1 native PASS, full 88 Chromium PASS; validation/customer/duplicate/retry/race/reload, ảnh hai role và ba viewport theo T05_EXECUTION.md | PENDING REVIEW; chờ đối chiếu đủ bằng chứng theo chỉ đạo mới |
| T06 | UC1.2, UC4.6, BR-UC1-12..17, BR-UC4-11/12; kết hợp bộ lọc, chi tiết/snapshot/lịch sử chỉ đọc | 16 test reader mới; full 249 unit/integration PASS; không đổi mapping legacy | UI hai role, ba viewport, lỗi native IDB; full Chromium và ảnh tại [T06_EXECUTION.md](T06_EXECUTION.md) | PENDING REVIEW; hai trường Nhân viên/Trạng thái trong chi tiết BLOCKED theo quyết định giữ Figma |
| T07 | UC1.1/1.2/4.6/6, từng BR và A–F theo G6_ACCEPTANCE_MATRIX.md; không thay chức năng/UI | Full unit/lint/typecheck/build và native migration/rollback/runtime graph; log cả lần thất bại và kiểm lại | Full Chromium, ảnh hai role, catalog và ngoại lệ tại T07_EXECUTION.md | PENDING REVIEW; UI hai trường BLOCKED, dependency audit FAIL, chưa nghiệm thu G6 |

## Quy tắc đánh dấu

- Lưu lệnh, exit code, PASS/FAIL/NOT RUN và oracle dữ liệu, log/screenshot/trace tương ứng; không sửa baseline để che lỗi.
- UI/module chưa triển khai ghi NOT RUN. Test helper tạo dữ liệu không thay cho luồng UI mục tiêu.
- T01 native storage không có giao diện mới: dùng log, không dựng screenshot giả. Các ảnh regression chỉ chứng minh UI cũ còn hoạt động.
- Chỉ DONE khi đủ bằng chứng và được xác nhận nghiệm thu. G5/G6 không tự DONE; candidate không tự kích hoạt dù unit/native IDB đã PASS.
