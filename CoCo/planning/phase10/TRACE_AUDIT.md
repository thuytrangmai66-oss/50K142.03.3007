# G10 — Ma trận nguồn và tham chiếu kiểm thử

27 UC / 98 BR / 7 NFR / 297 SC đã kiểm nguồn. Tham chiếu file không chứng minh đủ mọi nhánh hoặc nghiệm thu; pixel comparison vẫn NOT RUN trong inventory này.

**Lượt review BR tiếp tục 14/11:** đã đọc assertion đủ98 BR, [25 BR khung giá/phê duyệt/nhân viên](APPROVAL_STAFF_BR_REVIEW.md) và [50 BR thu mua/bán/báo cáo](PURCHASE_SALES_REPORT_BR_REVIEW.md) bổ sung cho23 BR trước. [Execution](BR_REVIEW_EXECUTION.md) ghi24 unit/1 E2E mới và kết quả mới. Bảng đếm file/test bên dưới là mốc lịch sử; không dùng nó làm coverage mọi nhánh hoặc gán PASS cho UI còn BLOCKED. Ledger có scope G10, không thay nghiệm thu phase trước.

Lượt tiếp tục: [review từng assertion 12 BR khách hàng](CUSTOMER_BR_REVIEW.md) ghi ca cụ thể, 11 test mới và các nhánh còn thiếu. [Tám modal khách hàng](CUSTOMER_VISUAL_EXECUTION.md) đã so pixel PASS; câu NOT RUN phía trên mô tả inventory cũ, không phủ nhận kết quả component mới và không tự chứng nhận toàn màn hình.

[Review hai BR đăng nhập/quyền](AUTH_BR_REVIEW.md) đối chiếu assertion về credentials, session, forged identity/permission, role revocation và UI hai tab. Nhóm khách hàng hiện đã bổ sung đủ 13 unit/2 E2E như execution riêng; không dùng tổng số 14 BR được review nội dung để coi 14 BR hoặc 27 UC đã nghiệm thu đầy đủ.

[Review chín BR Hàng hóa/scheduler](INVENTORY_BR_REVIEW.md) nối từng quy tắc với assertion giá/chu kỳ/ngày VN/version/race/payment và quyết định đã duyệt. Không mở lại yêu cầu 5 cột; không coi review 23 BR của ba nhóm là 23 BR được nghiệm thu hoặc đủ mọi nhánh UC.

| UC | File Chromium / unit liên quan | Ca Chromium / unit trong report đã cung cấp | Nghiệm thu |
|---|---|---|---|
| UC_0 | auth.spec.ts, shell.spec.ts / auth.test.ts | 10 / 22 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_1.1 | purchase-drafts.spec.ts, purchase-finalization.spec.ts, purchase-results.spec.ts, phase10-journey.spec.ts / purchase-drafts.test.ts, purchase-finalization.test.ts, purchase-contract.test.ts, purchase-candidate.test.ts | 19 / 95 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_1.2 | purchase-queries.spec.ts, purchase-list.spec.ts / purchase-queries.test.ts | 7 / 16 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_2.1 | inventory.spec.ts / inventory.test.ts | 4 / 35 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_2.2 | inventory-edit.spec.ts / inventory.test.ts | 4 / 35 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_2.3 | discount-scheduler.spec.ts / discount-scheduler.test.ts | 3 / 14 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_3.1 | sales-draft.spec.ts, sale-payment.spec.ts, sales-t06-recovery.spec.ts, phase10-journey.spec.ts / sales.test.ts, sale-payment.test.ts | 17 / 47 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_3.2 | sales-pages.spec.ts, sales-t05-errors.spec.ts / sale-payment.test.ts | 6 / 30 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_4.1 | reference-data.spec.ts / reference-data.test.ts, customer-creation.test.ts | 13 / 35 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_4.2 | reference-data.spec.ts / reference-data.test.ts | 13 / 19 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_4.3 | reference-data.spec.ts, confirmation.spec.ts / reference-data.test.ts, customer-creation.test.ts | 19 / 35 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_4.4 | reference-data.spec.ts / reference-data.test.ts | 13 / 19 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_4.5 | sales-t05-t06.spec.ts, sales-t05-errors.spec.ts, phase10-journey.spec.ts / sale-payment.test.ts | 7 / 30 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_4.6 | purchase-queries.spec.ts, phase10-journey.spec.ts / purchase-queries.test.ts | 7 / 16 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_5.1 | reference-data.spec.ts, pagination.spec.ts / reference-data.test.ts | 27 / 19 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_5.2 | reference-data.spec.ts / reference-data.test.ts | 13 / 19 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_5.3 | reference-data.spec.ts / reference-data.test.ts | 13 / 19 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_6 | purchase-approvals.spec.ts, purchase-results.spec.ts, phase10-journey.spec.ts / purchase-approvals.test.ts, purchase-contract.test.ts | 17 / 60 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_7.1 | reports-revenue.spec.ts / revenue-report.test.ts, report-eligibility.test.ts, report-legacy-migration.test.ts, report-period.test.ts | 4 / 48 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_7.2 | reports-purchase-cost.spec.ts / report-queries.test.ts | 3 / 55 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_7.3 | reports-t04.spec.ts / report-queries.test.ts | 4 / 55 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_7.4 | reports-t04.spec.ts / report-queries.test.ts | 4 / 55 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_7.5 | reports-t04.spec.ts / report-queries.test.ts | 4 / 55 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_8.1 | staff.spec.ts, staff-review.spec.ts / staff-accounts.test.ts | 9 / 20 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_8.2 | staff.spec.ts, staff-review.spec.ts / staff-accounts.test.ts | 9 / 20 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_8.3 | staff.spec.ts, staff-review.spec.ts / staff-accounts.test.ts | 9 / 20 | PENDING REVIEW / nhánh chưa chứng nhận |
| UC_8.4 | staff.spec.ts, staff-review.spec.ts / staff-accounts.test.ts | 9 / 20 | PENDING REVIEW / nhánh chưa chứng nhận |

Có 209/297 SC có export sạch được ánh xạ; mọi frame có hash, 296/297 đọc được geometry từ header PNG, ảnh định dạng khác cần decoder. Không copy source CODEX vào artifact.

Các blocker UI SRS/Figma G6/G8, barcode vật lý và phím tắt/mức giá/SLA chưa chốt vẫn cần review riêng; không tự đóng từ tổng số test.
