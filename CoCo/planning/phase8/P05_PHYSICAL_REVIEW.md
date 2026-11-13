# P05 — Review lưu snapshot bán hàng trước finalizer

Trạng thái: **CONFIRMED_USER — 13/11/2026**. Chủ dự án đã xác nhận phương án P05 và các mã cho hóa đơn mới trong chat. Cho phép triển khai T04 theo phạm vi dưới đây; không đổi schema hoặc diễn giải lại dữ liệu legacy.

## Phương án vật lý cụ thể

- Giữ DB version 4 và 27 store; không sửa các khóa/quan hệ legacy.
- Hóa đơn mới vẫn dùng `hoaDonBanHang`, dòng bán dùng `chiTietHoaDonBH` với khóa sẵn có. Không tạo hóa đơn khi chỉ mở QR hoặc lưu/hủy giỏ nháp.
- Lưu snapshot bổ sung tại `appMetadata`, khóa `sales-invoice:<MaHDBH>`, format `sales-invoice-v1`. Không backfill hóa đơn legacy thiếu snapshot.
- Snapshot gồm mã hóa đơn/draft/revision; thời gian thực nhận tiền `paidAt`; phương thức thanh toán; mã trạng thái riêng của hóa đơn mới; actor và tên nhân viên tại thời điểm bán; mã/tên/điện thoại khách tại thời điểm bán; membership và điểm trước/dùng/tích/sau; subtotal, discount, total; mỗi dòng gồm mã sản phẩm, hóa đơn nguồn thu mua, tên, số lượng 1, giá bán, thành tiền và productVersion.
- Hóa đơn, chi tiết, snapshot, trạng thái sold, điểm khách, recordVersions, operation receipt và audit phải commit cùng một transaction; lỗi bất kỳ phải rollback toàn bộ.
- Receipt chống double-click/replay; kiểm tra lại session/quyền, revision giỏ, phiên bản/giá/tình trạng sản phẩm và membership/điểm. Hai giỏ không được bán cùng món hoặc tiêu cùng số điểm bằng snapshot cũ.
- Hóa đơn legacy chỉ đọc bằng contract cũ; thiếu snapshot không được bịa điểm/giá/paidAt hoặc suy diễn mã trạng thái.

## Mã kỹ thuật đã chốt cho hóa đơn mới

Ghi rõ trong snapshot mapping của từng hóa đơn mới:

| Trường | Mã đề xuất | Ý nghĩa cho hóa đơn mới |
|---|---|---|
| `hoaDonBanHang.TrangThai` | `1` | Hoàn tất |
| `hoaDonBanHang.PTTT` | `1` | Tiền mặt |
| `hoaDonBanHang.PTTT` | `2` | Chuyển khoản |

Các mã trên **đã được xác nhận cho hóa đơn mới**. Không dùng bảng này để diễn giải hóa đơn legacy. Trạng thái sản phẩm dùng mapping theo hóa đơn thu mua đã duyệt, không đổi mapping `1/1/2` G6.

## Bằng chứng bắt buộc trước nghiệm thu finalizer

- Thành viên/khách thường; 49/50/51 điểm; giảm 20%, làm tròn và số tiền QR đúng giá thực trả.
- Tiền mặt và Đã nhận chỉ ghi dữ liệu sau thành công thật; mở/Quay lại/Escape/hủy QR không ghi hóa đơn/điểm/sold.
- Native IndexedDB, reload, FK, bất biến snapshot lịch sử, nhiều món giá khác nhau.
- Lỗi ghi invoice/detail/product/points/snapshot/audit rollback, stale revision, stale price, revoked session, replay và hai tab tranh chấp.
- Kiểm tra dữ liệu legacy nguyên vẹn, không nâng schema hoặc migration ngầm.

Review đã được chủ dự án xác nhận; runtime T04 triển khai theo phạm vi này và vẫn chờ nghiệm thu code/bằng chứng. UI T03 giữ thiết kế local SC046/SC238; không dùng nút Đã nhận giả hoặc báo thành công khi chưa có transaction thật.
