# G10-T01 — Hành trình liên module

Ngày 14/11/2026. **PARTIAL / PENDING REVIEW**; hai hành trình không thay thế chứng nhận đủ nhánh của 27 UC.

## Ca đã thực thi trước nâng major

`tests/e2e/phase10-journey.spec.ts`: 2/2 PASS trong bộ 156 Chromium (toàn suite 155 PASS/1 visual FAIL). Một ca Nhân viên bán trước, một ca Chủ bán trước; hai tab cùng origin và DB native, session riêng. Lượt đầu focused có hai lỗi selector `.sales-promotion` không tồn tại; đã sửa oracle sang khối khuyến mãi thực tế `.purchase-total`, không sửa nghiệp vụ/giá trị kỳ vọng. Lượt focused sau sửa 2/2 PASS; không cộng lượt chạy lại vào số ca duy nhất.

| Phạm vi UC/BR đối chiếu | Oracle thực thi trong hành trình | Giới hạn |
|---|---|---|
| UC_1.1, UC_6; BR-UC1-11, BR-UC6-01/05/06 | Giá 120.000 > Max 100.000, chặn hoàn tất khi pending; chủ duyệt, đóng cả luồng modal; nhân viên nhận kết quả live | Ca từ chối/lỗi/race ở regression riêng, không nằm trong hai happy journeys này |
| UC_1.1; BR-UC1-09/10 | Thu mua 6 món, một dòng 120.000 và năm món 100.000; tổng 620.000, không có hóa đơn/stock trước hoàn tất | Không diễn giải lại mã legacy; snapshot mới dùng mapping 1/1/2 đã duyệt |
| UC_3.1; BR-UC3-01..10 | Tiền mặt và QR cục bộ, trả 546.000 nhận 54 điểm; hóa đơn sau 130.000 giảm 26.000, trả 104.000, dùng 50/nhận 10/còn 14 điểm; 5 sold/1 available | Không tự coi đây là đủ mọi biên/rollback của 10 BR; các ca đó có suite riêng |
| UC_4.5/4.6; BR-UC4-11/12 | Cả hai tab đọc đúng lịch sử khách bán cho COCO và khách mua từ COCO; đúng mã hóa đơn | Không bỏ ngoại lệ hai trường chi tiết UI đã BLOCKED theo Figma |
| UC_7.1/7.2/7.3/7.5 | Doanh thu 650.000; thu mua 620.000; giá vốn 520.000; lợi nhuận 130.000; dòng tiền 30.000 | Bộ số là fixture kiểm thử, không phải dữ liệu production hoặc số cố định UI |
| UC_0, quyền/session/read-only | Token hai tab không đổi; toàn bộ store không đổi sau đọc báo cáo/lịch sử/reload; HTML không chứa hash/salt; không HTTP ra origin ngoài; không pageerror | Frontend demo; không tuyên bố bảo mật tương đương backend hoặc chống DevTools |

BR-UC1-07 là kiểm định thực tế do nhân viên thực hiện trước khi nhập; không có test tự đánh giá chất lượng theo 1/2/3, không thêm control/database tương ứng.

## Bằng chứng

[Kết quả ca thực thi](evidence/audit/executed-tests.json), [ảnh hai vai trò sau sửa](evidence/runtime-after), [báo cáo tổng](REPORT_PHASE_10.md). Mốc trước nâng 184 hash không đổi. Sau nâng và sửa tương thích Router: hai hành trình 2/2 PASS focused, full Chromium cuối 156/156 PASS; 187 file trong hash guard không đổi. Không tự DONE T01 hoặc G10.
