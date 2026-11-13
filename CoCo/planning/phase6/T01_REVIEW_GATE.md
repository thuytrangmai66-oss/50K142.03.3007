# G6-T01 — gói candidate để review

Giữ nguyên phạm vi T01: hợp đồng dữ liệu, migration, adapter, FK/provenance và transaction foundation. Các API/UI nhập món, quyết định, delivery, hủy/sửa dòng và command finalize thuộc các task sau; không yêu cầu triển khai trước T03/T05 để nghiệm thu thiết kế T01. **T01 ĐÃ NGHIỆM THU ngày 11/11/2026.** Ngày 11/11/2026, người dùng xác nhận: **“Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”**. T01 đã được nghiệm thu; P03/P04 runtime APPROVED_USER. Không suy ra nghiệm thu G5 hoặc toàn bộ G6 từ xác nhận này. Runtime đã kích hoạt v4 qua T02; bằng chứng tại [T02_EXECUTION.md](T02_EXECUTION.md).

## Điều kiện kiểm chứng kỹ thuật T01

- [x] Draft riêng, chưa chọn khách vẫn không tạo khách/hóa đơn giả.
- [x] PK dòng riêng và giá từng món; cùng bracket có thể có 80.001 và 120.000, tổng 200.001 đồng, không bình quân.
- [x] Snapshot request ràng buộc line/revision/price/quantity/bracket; decision cũ không cho phép dòng đã đổi.
- [x] Migration additive, giữ store/PK/record legacy; lỗi nâng schema rollback về native version 30, không mất sentinel.
- [x] Transaction foundation kiểm phiên/quyền cùng transaction, CAS, receipt/fingerprint, audit rollback/retry và alias sau rename G5.
- [x] Adapter chọn đúng nguồn, không diễn giải số trạng thái cũ; từ chối marker mới không đầy đủ thay vì fallback để che lỗi.
- [x] FK legacy vẫn bắt buộc chi tiết `[MaHDTM,MaKhungGia]` nếu không có metadata định dạng mới.
- [x] Candidate mới chỉ chọn FK theo provenance khi snapshot invoice/line/product/cost/quantity cùng nhất quán; sản phẩm dư không provenance, sai dòng/cost/invoice hoặc thiếu marker bị từ chối.
- [x] Trước nghiệm thu: candidate đã kiểm trên DB riêng, runtime giữ v3. Sau xác nhận: runtime được kích hoạt v4/27 store; không sửa dữ liệu legacy.
- [x] Người dùng xác nhận nghiệm thu T01 và cho phép kích hoạt P03/P04 runtime bằng câu trả lời trích ở đầu tài liệu.

## Hợp đồng chuyển trạng thái để đối chiếu trước các task phụ thuộc

| Đối tượng | Hợp đồng hiện có / đề xuất cần review | Phạm vi hiện thực |
|---|---|---|
| Draft | `editing` → `finalized` chỉ khi có khách và món đủ điều kiện; `editing` → `cancelled` khi hủy; finalized/cancelled không trở lại editing bằng stale command | Schema/rule và chặn ghi draft không editing đã có; command hủy đã có ở T02; finalize vẫn T05 |
| Request hiện hành | Pending → approved/rejected chỉ owner, đúng revision và snapshot dòng hiện hành; rejected cần lý do | Rule/binding đã có; transaction quyết định + notification là T03 |
| Đổi dòng | Đề xuất tăng revision, giữ snapshot request cũ như lịch sử; quyết định cũ không áp dụng revision mới; request trên draft hủy không đủ điều kiện xử lý | Binding kiểm thử đã có. T02 bỏ dòng bằng removedAt và hủy draft bằng cancelled, giữ request snapshot. T03 phải chặn dòng đã bỏ/draft hủy; sửa giá sau từ chối vẫn T04 |
| Delivery | Event bền và decision cùng transaction; phát sau commit, retry event cũ không tạo decision mới | Schema/contract đã có; producer/consumer thực tế là T03/T04, không coi native-storage test là demo này |
| Nhập kho | Hóa đơn/chi tiết mới/sản phẩm/cost/provenance/snapshot và receipt/audit cùng một command; lỗi phải rollback; giá đầu cost×1,30 half-up | FK/validator và fixture/integration test đã có; command finalize là T05, chưa hoàn thành |

Số `TrangThai` cho bản ghi mới chưa được tự gán từ legacy: mapping này phải ghi rõ trước producer T05. `purchase-lines-v1` và các literal trạng thái metadata là namespace riêng, không chuyển nghĩa dữ liệu cũ. Chính sách chưa được xác nhận vẫn OPEN theo [DATA_CONTRACT_REVIEW.md](DATA_CONTRACT_REVIEW.md).

## Phân biệt bằng chứng

Fixture finalized graph dùng để kiểm FK, không phải nghiệp vụ finalize đã hiện thực. Chromium storage/FK integration dùng IndexedDB native và log JSON; demo hai tab qua UI A–F, toàn bộ màn hình G6 và nghiệm thu pixel vẫn NOT RUN. QA checklist phần mềm tách khỏi BR-UC1-07 kiểm hàng ngoài hệ thống; không thêm UI hay bảng kiểm định.
