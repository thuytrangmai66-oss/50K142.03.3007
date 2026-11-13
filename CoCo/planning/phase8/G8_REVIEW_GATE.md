# G8 — Gói review sau T06

Ngày 13/11/2026. **PENDING REVIEW — chưa nghiệm thu G8**. Đây là đầu ra kiểm chứng của T06, không phải phase/task mới.

## Trạng thái task

| Task | Trạng thái và căn cứ |
|---|---|
| T01 | ACCEPTED_USER cho subset giỏ nháp theo plan; không suy rộng thành nghiệm thu toàn UC_3.1 |
| T02 | IMPLEMENTED / PENDING REVIEW; opt-in thành viên, ưu đãi tự động D05, tính/ghi điểm qua T04 |
| T03 | IMPLEMENTED / PENDING REVIEW; QR sinh local, đúng tài khoản/số tiền; chưa quét app ngân hàng thật |
| T04 | IMPLEMENTED / PENDING REVIEW; finalize atomic, ledger/snapshot/stock/điểm và chống replay; P05 được người dùng duyệt |
| T05 | IMPLEMENTED / PENDING REVIEW; list/filter/detail/history/print-media và error UI; ô trạng thái trên chi tiết còn OPEN/BLOCKED |
| T06 | IMPLEMENTED / PENDING REVIEW; recovery sau reload, hai vai trò tranh chấp cùng món và full 131/131 Chromium PASS; không tự DONE |

## Bằng chứng kiểm chứng

| Tiêu chí | Bằng chứng | Kết quả hiện tại |
|---|---|---|
| Một món không bán hai lần | Unit/finalizer, E2E T04, E2E mới Owner/Staff đồng thời | PASS focused và full T06 |
| 50 điểm không dùng hai lần | `sales-t05-t06.spec.ts`, unit `sale-payment.test.ts` | PASS baseline và full T06 |
| Lỗi transaction không ghi dở, reload/retry đúng một lần | Native fault injection hai vai trò trong `sales-t06-recovery.spec.ts`; unit per-store rollback | 3/3 bài mới PASS, full T06 PASS; unit baseline 345 PASS |
| Quote cũ khi scheduler đổi giá bị chặn | Unit scheduler/finalizer và native clock/focus E2E | PASS full T06 |
| Hóa đơn/hàng/điểm/lịch sử nhất quán, reload giữ dữ liệu | Unit + E2E UI thật, snapshot so sánh toàn bộ store | PASS baseline, focused và full T06 |
| Full Chromium G2–G8 | `chromium-t06-full-final.log`, `T06_TEST_EXECUTION.csv` | 131/131 PASS, 0 FAIL, 0 SKIP, exit 0; 16,6 phút |
| Lint | `lint-t06.log` | PASS lượt T06 |
| Unit/integration, typecheck, build | `unit-t05-full.log`, `typecheck-t05.log`, `build-t05.log`; runtime không đổi | PASS baseline: 345 tests/16 files; không chạy lại các lệnh này ở T06 |

[Execution T06, file, ảnh và manifest source/build](T06_EXECUTION.md). Không dùng số bài PASS để tự suy ra mọi control/SC hoặc toàn Use Case được nghiệm thu.

## Ngoại lệ và việc cần chủ dự án xác nhận

1. **UC_4.5 MAIN — trạng thái trên chi tiết:** SRS yêu cầu, UI09 không có vị trí. Giữ Figma; dữ liệu/list có trạng thái, ô trên detail vẫn OPEN/BLOCKED. Chưa có quyết định miễn trừ SRS hoặc duyệt bổ sung UI.
2. **In giấy/native print dialog, app ngân hàng, scanner vật lý:** NOT RUN. Print-media, QR payload/CRC và keyboard Enter đã có bằng chứng tự động; không dùng chúng thay cho kiểm tra thiết bị thật.
3. **Ngoại lệ G6/G7:** hai trường nhân viên/trạng thái thu mua và payload scanner giữ đúng quyết định/giới hạn đã ghi; không đóng chúng bằng nghiệm thu G8.
4. **Lỗi lịch sử thu mua cũ:** từng FAIL khi tìm link sau reload; 3 lượt riêng, full T05 và full T06 cuối PASS. Chưa xác minh nguyên nhân lần thất bại, không nhận đã sửa triệt để; giữ log cũ để theo dõi.
5. **Audit dependencies lịch sử:** 13 findings (2 critical, 1 high, 10 moderate), không audit lại/đổi dependencies trong T06. Không coi lint/build/E2E PASS là audit sạch.

## Cổng chuyển tiếp

Không còn task code tiếp theo trong G8 sau T06. Bước tiếp là review bằng chứng, kiểm tra thủ công và xác nhận nghiệm thu/phương án xử lý ngoại lệ. G9 (báo cáo/dashboard) giữ **NOT STARTED** tới khi có chỉ đạo đáp ứng cổng dependency; không tự chuyển chỉ vì test PASS hoặc đã có source trên GitHub. Lượt T06 này không staging/commit/push/deploy.
