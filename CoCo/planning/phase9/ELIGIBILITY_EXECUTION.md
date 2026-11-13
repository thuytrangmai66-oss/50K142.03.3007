# G9 — Thực thi quyết định eligibility và bảo toàn legacy

Ngày 13/11/2026. **DATA LAYER IMPLEMENTED / PENDING REVIEW**; nguồn ghi và cách phân biệt dữ liệu trên KPI Khách hàng mới còn BLOCKED. Báo cáo tiền có thể tiếp tục theo thiết kế đã duyệt, không phải chờ chốt lại R01/R02. Không nghiệm thu G9.

## Quyết định và đối chiếu nguồn

- [G9-D01/D02/D03](DECISION_LOG.md): nghiệp vụ đã phê chuẩn, thay thế các câu hỏi R01/R02 trước; không áp dụng phương án cũ bị từ chối.
- SRS BR-UC7-01/03/05/07/08/12/18/19 yêu cầu tiền đã hoàn tất và thời điểm đúng kỳ; Q13/BR-UC7-02 định nghĩa mẫu số 0; Figma SC114/117/120/123/198 không có control coverage bổ sung được duyệt.
- SDD/schema vật lý hiện tại: khách không có ngày tạo; membership và audit không phải ngày tạo. P05 có snapshot/receipt/audit/draft finalized và paidAt. P03/P04 có paidAt riêng; không suy đoán cho legacy hoặc dùng ngày nhập kho.

## Source sửa/mới

- Mới `src/domain/report-eligibility.ts`: tách verification VERIFIED/UNVERIFIED khỏi ELIGIBLE/MISSING_TIME/INVALID_TIME; coverage theo tập nguồn, kernel KPI chỉ tính trusted creation trong kỳ.
- Sửa `src/services/report-queries.ts`: `ReportQueriesService.revenue` lọc đủ điều kiện rồi mới gọi kernel doanh thu. Thiếu chứng cứ/snapshot không nhất quán được phân loại UNVERIFIED và loại trừ có lý do; snapshot mồ côi là diagnostic riêng, không tạo hóa đơn. Lỗi storage thật vẫn reject truy vấn, không biến thành số 0.
- Mất paidAt nhưng graph/receipt/audit vẫn hợp lệ: VERIFIED + MISSING_TIME, không lấy ngày header/receipt/audit để lấp chỗ trống. PaidAt sai hoặc thiếu timezone: VERIFIED + INVALID_TIME, không phân bổ vào kỳ. Trường hợp raw NgayBan khác paidAt của bản ghi P05 đã có đủ hai mốc bị coi là bằng chứng không nhất quán theo hợp đồng P05, không sửa bên nào.
- Sửa `src/services/sales-queries.ts`: tách helper graph/snapshot dùng chung để báo cáo không phải tạo ngày giả mới kiểm được chứng cứ. Đường đọc hóa đơn/lịch sử hiện có vẫn dùng schema paidAt nghiêm ngặt và giữ kết quả/lỗi cũ; cần regression các đường này.
- `newCustomers`: chỉ trả dữ liệu đủ điều kiện/coverage nội bộ và `BLOCKED_NO_APPROVED_CREATION_SOURCE`. Nguồn vật lý hiện chưa được duyệt/ghi, nên không tự coi khách mới tạo, có membership hoặc đã giao dịch là có ngày tạo. Không đưa qualified-zero này lên UI như KPI đầy đủ.
- Không sửa `createCustomer`, schema DB, finalizer, mã trạng thái hoặc business data. Không thêm bảng/cột/migration/UI/namespace dữ liệu runtime.

## Kiểm thử theo yêu cầu

| Trường hợp | Oracle / kết quả tập trung |
|---|---|
| Thanh toán đã xác minh, ngày hợp lệ | Snapshot + graph + receipt/audit/draft thực tế qua finalizer, chỉ tiền thực thu trong kỳ; PASS |
| Thanh toán đã xác minh, thiếu ngày | Xóa paidAt trong fixture, giữ header/audit/receipt có ngày: VERIFIED/MISSING_TIME, không tổng hợp và không sửa; PASS |
| Không đủ chứng cứ | Thiếu receipt/snapshot hoặc mâu thuẫn số tiền → UNVERIFIED, qualified total loại trừ; PASS |
| Legacy có NgayBan nhưng không chứng cứ | Mã trạng thái/PTTT 1 không được tự diễn giải; UNVERIFIED dù ngày header nằm trong kỳ; PASS |
| Khách có trusted createdAt hợp lệ | Kernel kiểm đúng cận ngày Việt Nam và không đổi input; PASS logic. **Nguồn ghi/đọc vật lý cho ngày tạo vẫn BLOCKED**, không nhận đã hoàn tất luồng tạo khách |
| Khách legacy thiếu ngày hoặc có giao dịch/membership | Không dùng registeredAt/giao dịch/audit thay ngày tạo; count đủ điều kiện không tăng, coverage vẫn giữ hồ sơ; PASS |
| Migration/reopen | Fixture schema v2 nâng lên v4 bằng code hiện hữu, khách/hoá đơn/status/date/sentinel nguyên vẹn; không tạo paidAt/createdAt/snapshot, reopen kết quả không đổi; PASS integration |
| Lỗi storage/phân quyền | Không lẫn lỗi đọc với loại trừ; Staff/revoked session không gọi được báo cáo; PASS |

Test mới: `tests/unit/report-eligibility.test.ts`, `tests/unit/report-legacy-migration.test.ts`; cập nhật `tests/unit/report-queries.test.ts` theo chính sách được phê chuẩn. Các assertion trước đòi legacy chặn toàn bộ tổng đã được thay bằng qualified summary + coverage, không phải hạ điều kiện test để che lỗi. Test độc lập G8/sale-payment vẫn giữ nguyên.

## Kết quả

- Focused eligibility/report/revenue/sale-payment **60/60 PASS**; migration/reopen **1/1 PASS**. Logs `unit-focused.log`, `unit-migration.log` trong `evidence/eligibility/`.
- **Lint PASS, typecheck PASS, full unit/integration 410/410 PASS (22 file, 0 FAIL/SKIP, 133,76 giây), production build PASS (10,07 giây)**. Logs `lint.log`, `typecheck.log`, `unit-full.log`, `build.log` trong `evidence/eligibility/`.
- **35/35 Chromium regression PASS**, exit 0, 0 SKIP, 3,8 phút; log `chromium-regression.log`. Phạm vi: shell/persistence/migration, native G6 migration/transaction, payment Owner/Staff, list/detail/history/print và các lỗi đọc. Đây là regression các luồng có thật bị ảnh hưởng bởi helper graph, không nhận là E2E UI báo cáo G9 hoặc đã chạy lại toàn bộ suite 131 bài.
- Chromium UI báo cáo, screenshot coverage, customer-create provenance mới: **NOT RUN / BLOCKED**, vì chưa có thiết kế/nguồn ghi được duyệt. Các số PASS integration không thay cho các mục này.

## Bàn giao và giới hạn

[Review nguồn ngày tạo và KPI coverage](IMPLEMENTATION_REVIEW.md) là đầu ra cụ thể cho phần cần duyệt, chưa tự kích hoạt. Chi phí/lợi nhuận/dòng tiền/dashboard vẫn chưa được coi là đã triển khai hoặc kiểm thử chỉ từ policy chung. T02 có thể tiếp tục nối UI doanh thu theo Figma với verified-only data; không thêm một gate UI mới ngoài phần KPI/metadata thật sự cần review. Giữ branch/working tree hiện hữu; không staging/commit/push/deploy hoặc xóa dữ liệu người dùng.
