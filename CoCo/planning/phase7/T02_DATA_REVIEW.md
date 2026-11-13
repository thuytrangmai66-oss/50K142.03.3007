# G7–T02 — review thuộc tính hiện hành của từng món

> Mapping đã triển khai trong T02/T03, **PENDING REVIEW**, không thay bảng/PK/FK/schema v4. Reader/producer metadata, CAS, rollback và kiểm FK đã có test; không coi đây là nghiệm thu người dùng. Q10/Q12/P10 đã xác nhận trong DECISION_LOG.md. Phương án bên dưới là hồ sơ thiết kế trước producer, không còn mô tả runtime chưa kích hoạt.

Ngày 12/11/2026. **PROPOSED / CHƯA KÍCH HOẠT**. Không migration, không thêm store hoặc sửa dữ liệu trong lượt T01.

SRS UC_2.2 cho sửa tên, loại, thương hiệu, độ mới và giá hiện hành của từng sản phẩm. G2 `sanPham` chỉ có TenSP, giá/ngày/trạng thái và MaKhungGia; loại/brand/độ mới ở khung giá dùng chung. G6 còn có provenance/cost và snapshot lịch sử bất biến. Sửa thẳng khung giá sẽ đổi các món khác và có thể phá lịch sử; đổi MaKhungGia có thể làm sai binding cost/provenance. Không dùng hai cách này như fallback.

## Phương án kỹ thuật để review trước T02

- Giữ nguyên mọi bảng/PK/FK G2 và dữ liệu thu mua G6. Tên và giá hiện hành vẫn lưu trong `sanPham`.
- Đề xuất metadata thuộc tính hiện hành riêng theo MaSP, dùng `appMetadata` sẵn có với key `inventory-attributes:<MaSP>`, format `inventory-attributes-v1`, type/brand/condition và updatedAt. Condition dùng chung catalog3=Mới/2=Tốt/1=Khá; không đổi tình trạng legacy bằng suy đoán.
- Reader ưu tiên metadata hiện hành hợp lệ; khi chưa từng sửa dùng line snapshot G6, hoặc FK legacy theo adapter T01. Metadata đã có nhưng sai/mất FK phải báo lỗi; không dùng fallback che lỗi.
- Update command kiểm phiên/quyền `inventory.update`, version sản phẩm, giá trị cố định, sold và version/chu kỳ mới nhất trong transaction. Ghi sản phẩm/metadata/version/audit/receipt nguyên tử; rollback toàn bộ khi lỗi. Giữ MaSP, NgayNhapKho, TrangThai, MaHDTM, MaKhungGia, cost/provenance và invoice snapshots.
- Owner đổi giá reset GiaGocChuKyGiam/NgayBatDauChuKyGiam theo SRS, không đổi ngày nhập. Staff đổi giá chờ Q10; khoản giảm scheduler chờ Q12/P10. Không tự thêm trường vào Figma.
- Kiểm thử dự kiến: sửa một món không đổi món cùng khung/hóa đơn lịch sử; CAS/stale/sold/session; rollback cả metadata và product; reload; dữ liệu legacy; hai tab; owner/staff và chu kỳ theo quyết định được chốt.

Đây là review mapping kỹ thuật trong **T02 hiện có**, không thêm phase/task nghiệp vụ hoặc xem metadata đề xuất là đã được người dùng nghiệm thu. Chưa viết producer đọc/ghi metadata này vào runtime ở T01. Giữ việc kiểm đầy đủ backup/restore metadata cho phase tương ứng, không coi metadata string là lý do bỏ schema validation/FK/transaction.
