# Ánh xạ dữ liệu Giai đoạn 2

Ngày triển khai 10/11/2026. Phạm vi theo bước tiếp theo trong báo cáo Giai đoạn 1: 10 thực thể Design, metadata đã duyệt, validation/repository/transaction, ràng buộc, rollback và chống xử lý lặp. Giữ nguyên roadmap và AD01–AD08. `MASTER_PLAN_COCO.md` chưa có trong checkout; không tái tạo hoặc tự đổi thứ tự các phase từ suy đoán.

## Nguồn đối chiếu

- Design gốc: `D:\N3.HK1.PTTKHTTT\BTNHOM\50K142.03.3007.Design.docx`, SHA-256 `917FF96B696FD1DE9228560D65D4EA037EDE32297B1699648894DDCA15A1E207`.
- SRS trong repository: `02. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG/50K142.03.3007.SRS.docx`, SHA-256 `2D90ADCA26709BCD4630BBA446BD799061575BACD3E6438F5A195ABAF19F3535`.
- Đã đối chiếu SHA-256: SRS trong repository trùng bản gốc tại `D:\N3.HK1.PTTKHTTT\BTNHOM\50K142.03.3007.SRS.docx`.
- [OPEN_ISSUES.md](../phase0/OPEN_ISSUES.md): toàn bộ hướng kỹ thuật đã được duyệt; mapping cụ thể bên dưới hiện thực Q05/Q06/Q07/Q08/Q09. Không sửa tài liệu nguồn.

Các locator Pxxxx là thứ tự đoạn `w:p` trong `word/document.xml`, bao gồm đoạn trong bảng; không phải số trang Word. Bản trích phục vụ đối chiếu chỉ nằm trong `node_modules/.phase2-sources/`, không commit. Figma không được dùng để suy ra schema hoặc số liệu nghiệp vụ; không sửa giao diện trong giai đoạn này.

## Mười thực thể

Tên thuộc tính lưu giữ nguyên mô hình logic Design P0402–P0411. Tên store dùng camelCase; index chỉ khai báo thuộc tính cần tra cứu/ràng buộc, không phải toàn bộ cột lưu.

| Thực thể / store | Thuộc tính lưu | Khóa và ràng buộc chính |
|---|---|---|
| TaiKhoan / `taiKhoan` | TenDangNhap, MaNV | PK TenDangNhap; FK NhanVien. MatKhau được thay bằng metadata hash/salt theo Q05 |
| NhanVien / `nhanVien` | MaNV, HoTen, SoDienThoai | PK MaNV; unique phone theo BR-UC8-05 |
| KhachHang / `khachHang` | MaKH, TenKH, SoDienThoaiKH, DiemTichLuy | PK MaKH; unique phone theo BR-UC1-06, BR-UC4-01/05 |
| KhungGiaThuMua / `khungGiaThuMua` | MaKhungGia, LoaiSanPham, ThuongHieu, TinhTrang, GiaMin, GiaMax, MaNV | PK MaKhungGia; FK NhanVien; unique tổ hợp LoaiSanPham+ThuongHieu+TinhTrang, Min/Max > 0, Min ≤ Max (BR-UC5-04/06/07) |
| YeuCauPheDuyetGia / `yeuCauPheDuyetGia` | MaYC, GiaDeXuat, GiaToiDa, LyDo, TrangThai, MaNV, MaKhungGia, MaHDTM | PK MaYC; FK nhân viên/khung giá/hóa đơn thu mua |
| HoaDonThuMua / `hoaDonThuMua` | MaHDTM, NgayThuMua, TongTienTM, TrangThai, MaKH, MaNV | PK MaHDTM; FK khách hàng/nhân viên; giữ mã đã cấp và hóa đơn đã lưu |
| ChiTietHoaDonTM / `chiTietHoaDonTM` | MaHDTM, MaKhungGia, SoLuong, DonGia, ThanhTien | PK kép MaHDTM+MaKhungGia; FK hóa đơn/khung giá; lượng nguyên dương, đơn giá dương |
| SanPham / `sanPham` | MaSP, TenSP, NgayNhapKho, GiaGocChuKyGiam, GiaBanHienHanh, TrangThai, NgayBatDauChuKyGiam, MaHDTM, MaKhungGia | PK MaSP; FK kép về dòng thu mua; ngày nhập và nguồn thu mua bất biến; mã đã cấp không tái sử dụng |
| HoaDonBanHang / `hoaDonBanHang` | MaHDBH, NgayBan, TienKhuyenMai, TichDiem, PTTT, TrangThai, TongTien, MaNV, MaKH | PK MaHDBH; FK nhân viên/khách hàng; giữ mã đã cấp và hóa đơn đã lưu |
| ChiTietHoaDonBH / `chiTietHoaDonBH` | MaHDBH, MaSP, DonGia, SoLuong, ThanhTien | PK kép MaHDBH+MaSP; FK hóa đơn/sản phẩm; dùng đúng ThanhTien theo mô hình logic và Q06, không lặp MaHDBH từ lỗi bảng vật lý |

Validation dùng Zod strict tại biên ghi repository. Mã/username tối đa 10 ký tự theo CHAR(10); họ tên/tên hàng/loại/thương hiệu tối đa 50; LyDo tối đa 100 theo Design vật lý P0428–P0787. Điện thoại là chuỗi đúng 10 chữ số, giữ số 0 đầu. INT không âm trong miền 32 bit; số lượng dương, số lượng bán theo TINYINT tối đa 255. Thành tiền dòng phải bằng số lượng × đơn giá và không vượt miền số nguyên an toàn.

Tiền VND nguyên đồng, không âm, trong miền `Number.MAX_SAFE_INTEGER` theo hướng Q12 đã duyệt; không tự làm tròn. Giá thu mua và Min/Max phải dương theo SRS. DATE lưu `YYYY-MM-DD` và kiểm tra ngày lịch thực; DATETIME lưu ISO 8601 có offset/Z để tránh phụ thuộc múi giờ máy. NFR/BR báo cáo theo giờ Việt Nam sẽ được xử lý ở module báo cáo.

Nguồn chỉ quy định TINYINT cho TrangThai, PTTT và TinhTrang; lớp dữ liệu giữ miền 0–255, chưa gán mã số cho nhãn nghiệp vụ. Đây không phải xác nhận mọi mã số trong miền đều hợp lệ ở service. Các service tương ứng phải giới hạn trạng thái/phương thức hợp lệ sau đối chiếu nguồn; không đoán bộ tiêu chí chất lượng Q20.

## Metadata kỹ thuật

| Store | Khóa | Nội dung và giới hạn |
|---|---|---|
| `appMetadata` | key | Giữ nguyên dữ liệu khung v1; không đổi namespace DB |
| `accountSecurity` | TenDangNhap | FK tài khoản; role owner/staff, active, passwordHash, passwordSalt, algorithm, iterations. Q05: không lưu mật khẩu rõ hoặc ép hash vào CHAR(16). Định dạng kỹ thuật dự kiến cho auth: PBKDF2-SHA-256, hash 32 byte hex, salt 16 byte hex, iterations 600.000–10.000.000; chưa tạo hoặc xác thực mật khẩu trong Giai đoạn 2 |
| `memberships` | MaKH | FK khách hàng; registeredAt và registeredBy (FK tài khoản). Q07: chỉ có metadata sau sự kiện đăng ký rõ ràng; không suy ra có hồ sơ là thành viên. Chưa thêm UI hay tự đăng ký |
| `productCosts` | MaSP | FK sản phẩm; MaHDTM/MaKhungGia phải khớp nguồn sản phẩm; unitCost do luồng thu mua cung cấp rõ ràng, recordedAt. Q09: snapshot bất biến, không suy ra từ khung giá hiện hành hoặc bình quân dòng hóa đơn; hai món cùng hóa đơn/khung giá vẫn có snapshot khác nhau |
| `discountApplications` | MaSP+cycleStartedOn+milestone | FK sản phẩm; milestone 30/45, scheduledFor, executedAt, priceBefore/priceAfter. Q08: khóa chống lặp theo chu kỳ và mốc; lịch sử bất biến. Đây chỉ là cấu trúc lưu, chưa chạy scheduler, tính ưu tiên mốc hay giả lập thời điểm thực thi |
| `notifications` | id | recipient (FK tài khoản), MaYC (FK yêu cầu), createdAt/readAt; nền lưu liên kết thông báo, chưa có service phát thông báo |
| `recordVersions` | JSON([store, primaryKey]) | Phiên bản tăng trong cùng transaction; giữ tombstone sau xóa để ngăn phiên bản cũ ghi lên bản ghi tạo lại |
| `operations` | id của command | SHA-256 payload chuẩn hóa và executedAt thực; cùng ID/cùng payload trả receipt cũ, cùng ID/khác payload báo lỗi |
| `auditEntries` | id của command | actor nếu có, executedAt thực, các tham chiếu bản ghi thay đổi; không ghi snapshot hash/salt hay mật khẩu. Actor được cung cấp phải có tài khoản; đây chưa phải xác thực phiên hay kiểm tra quyền |
| `issuedIdentifiers` | JSON([store, primaryKey]) | Giữ dấu mã sản phẩm/hóa đơn đã cấp; không tái sử dụng sau xóa. Định dạng và bộ sinh mã nghiệp vụ chưa được tự đặt |

Các lựa chọn định dạng metadata là cách hiện thực kỹ thuật trong phạm vi phương án đã duyệt, không tạo quyết định nghiệp vụ mới. Không tạo chủ mặc định, tài khoản mẫu, dữ liệu kinh doanh mẫu hoặc membership tự động. Dữ liệu mẫu trong test chỉ nằm trong database/profile kiểm thử tách biệt.

## Repository và giao dịch

`CoCoRepository.get/list` trả bản ghi cùng version trong một read transaction. `commit` nhận command ID, actor tùy chọn và các mutation create/update/delete; update/delete bắt buộc expectedVersion. Payload được kiểm tra và sao chép trước khi hash, SHA-256 chạy ngoài transaction IndexedDB.

Mọi mutation, kiểm tra tham chiếu xuôi/ngược, version, giữ mã đã cấp, audit và receipt cùng một read/write transaction. Chỉ thành công sau commit; bất kỳ lỗi ràng buộc hoặc lỗi lưu audit đều rollback toàn bộ. Có thể ghi con trước cha trong một batch nếu trạng thái cuối hợp lệ. Không xóa dây chuyền; không xóa hóa đơn lịch sử. Đổi số điện thoại khách hàng giữ nguyên MaKH và liên kết giao dịch. Các kết nối cùng origin dùng cùng phạm vi store nên transaction được tuần tự hóa khi tranh chấp; không dùng mutex chỉ trong bộ nhớ một tab.

Lớp hiện tại quét kiểm tra tham chiếu của trạng thái cuối trong transaction để bảo đảm toàn vẹn cho demo. Chưa có kết quả đo SLA hoặc tối ưu dữ liệu lớn. Receipt chỉ trả trạng thái lặp và thời điểm; caller đọc lại dữ liệu hiện tại nếu cần.

Đây là lớp dữ liệu nội bộ, chưa được nối với bất kỳ route ghi dữ liệu nào. Các service nghiệp vụ phải xác thực phiên, kiểm tra quyền và quy tắc chuyển trạng thái trước khi gọi repository. Không dùng quyền ở UI thay cho service; storage phía client không phải ranh giới an ninh trước người cố tình sửa DevTools.

## Migration và các chi tiết còn theo dõi

`CoCoDB` giữ khai báo v1 với appMetadata và thêm v2 gồm 10 store nghiệp vụ, 5 store metadata nghiệp vụ và 4 store kỹ thuật dùng chung (tổng 20 cùng appMetadata). Nâng cấp thêm store/index, không xóa dữ liệu, không reset DB, không gọi DB tham chiếu. Chưa có dữ liệu nghiệp vụ v1 cần chuyển đổi.

Chưa tự chốt Q10 (nhân viên đổi giá có reset chu kỳ), cách làm tròn khoản giảm Q12, tiêu chí Q20, phím tắt/mức giá Q21. Chưa hiện thực auth/khởi tạo chủ đầu tiên, thanh toán, tích/trừ điểm, đăng ký thành viên, scheduler, xử lý phê duyệt hay báo cáo. Các phần đó tiếp tục theo phase/module gốc, dùng nền dữ liệu này.

Nguồn kỹ thuật: [Dexie schema/index](https://dexie.org/docs/Tutorial/Design), [transaction và phạm vi bất đồng bộ](https://dexie.org/docs/Dexie/Dexie.transaction()), [versioning](https://dexie.org/docs/Version/Version.upgrade()).
