# G10-T02 — Assertion hàng hóa và lịch giảm giá

Ngày 14/11/2026. Review chín BR-UC2 theo locator SRS trong traceability và các quyết định giá/làm tròn đã duyệt. **Bảng Hàng hóa 5 cột đã được người dùng chốt; không mở lại so sánh với ảnh 6 cột.**

| BR | Assertion đã đọc | Ca chứng minh / giới hạn |
|---|---|---|
| UC2-01 | Hai món vật lý có ID khác nhau, phân trang không mất identity; finalizer không dùng lại ID đã issued/versioned hoặc trùng trong batch | `inventory.test.ts` “projects real inventory…”; `purchase-finalization.test.ts` “does not reuse issued/versioned product IDs…” và “never reuses a reserved product ID…”. Không chỉ dựa unique index |
| UC2-02 | Stock days đổi đúng lúc 00:00 Việt Nam, không phụ thuộc timezone máy; qua năm nhuận/năm mới | `inventory.test.ts:35` bốn cặp ngày/expected; scheduler ghi scheduledFor riêng executedAt. Không dựng bằng chứng job chạy khi web đóng |
| UC2-03 | Sau payment thật, sản phẩm chuyển TrangThai=2; trước payment/cancel/failure không ghi sold | `sale-payment.spec.ts:47` và assertion DB trước/sau của cash/transfer hai role; unit sale-payment rollback. Mã chỉ trong mapping sản phẩm mới đã duyệt, không diễn giải lại legacy |
| UC2-04 | Reader trả giá đang lưu, không tính lại khi xem; milestone chỉ hiện nếu đúng chu kỳ/giá hiện tại | `inventory.test.ts` “projects real inventory…” và “displays stored milestone…”; `discount-scheduler.spec.ts` hai tab đọc giá thật. UI đọc không ghi DB |
| UC2-05 | Ngày nhập sửa bị từ chối/no-write; mã sản phẩm readonly; reset chu kỳ không đổi NgayNhapKho | `inventory.test.ts:158` fixed-date; `inventory-edit.spec.ts:6` cả hai role kiểm readonly và cancel; unit “resets cycle on a real price change…” giữ entry date và snapshot |
| UC2-06 | Sản phẩm sold không được sửa; scheduler bỏ qua sold, không tự đặt trạng thái khi đọc | `inventory.test.ts:158` sold/no-write; `discount-scheduler.test.ts:58` price giữ 104007/event count 0; reader “projects mapped sold items…”. Không sửa sold bằng control thủ công |
| UC2-07 | Ngày 29 giá104007; 30/44 giá72805; 45/80 đúng20000; giá10000 cũng chuyển20000 theo quyết định đã duyệt | `discount-scheduler.test.ts:37/53`, `inventory.test.ts` half-up cases, `discount-scheduler.spec.ts:17`. Không giảm lặp trên giá đã giảm |
| UC2-08 | Hai connection sửa một version chỉ một winner, loser CONFLICT; form stale sau scheduler không ghi đè | `inventory.test.ts:141`; `inventory-edit.spec.ts:42`; `discount-scheduler.test.ts:94`. Metadata/audit lỗi rollback mọi store và retry giữ kiểm version |
| UC2-09 | Mỗi milestone/chu kỳ chỉ một event qua reopen/multi-tab; sửa giá thật bởi Chủ hoặc Nhân viên reset cycle, giữ NgayNhapKho; sửa tên không reset giá | `discount-scheduler.test.ts:46/63/94`; `inventory.test.ts:115/126`; `discount-scheduler.spec.ts` catch-up, midnight, failed write/recovery. Trường hợp nhân viên reset và giá dưới20000 đã được duyệt trong chat |

Các assertion unit nằm trong full cuối 514 PASS; full Chromium sau sửa popup **166/166 PASS**, 8 visual local PASS. [Execution](CONTINUATION_EXECUTION.md) ghi từng ca/cuối lượt, không chứng nhận toàn bộ 3 UC inventory hoặc 297 visual từ bảng này. Không đổi UI, schema, thuật toán tiền hoặc mapping để “khép” review.
