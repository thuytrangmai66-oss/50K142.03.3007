# Báo cáo — lịch chọn ngày của Báo cáo

Ngày thực hiện: 15/11/2026. Phạm vi UI và tương tác ngày; chưa commit/push/deploy. HEAD giữ nguyên `213815c0e303c94b0467334768edaba6d67f19f3`, nhánh `main`. Bảo toàn các thay đổi UI có trước trong working tree.

## Nguyên nhân và sửa đổi

`ReportPeriodForm` trước đây chỉ render `input` dạng text cho ngày/khoảng ngày. Không có native date control hoặc handler mở lịch; nguyên nhân không phải một icon bị CSS ẩn.

- Dùng lại cơ chế `input type="date"` native của Thu mua/Hàng hóa, không thêm thư viện hay dựng calendar riêng. Hai màn hình nguồn đang dùng native input trực tiếp, chưa có component calendar riêng để import.
- Một `ReportDateField` dùng chung trong `ReportPeriodForm`: text giữ `dd/mm/yyyy`, native input giữ ISO và cung cấp icon/lịch thật. Click icon hoặc vùng text mở lịch; vùng icon rộng 36px. Hỗ trợ Alt+Down trên text, Enter/Space trên native input và thao tác bàn phím trong lịch.
- Kiểm tra khả năng `showPicker()`, bắt lỗi API; giữ nhập tay và hành vi native khi API không khả dụng. Chuyển ISO/hiển thị bằng thành phần chuỗi, không parse `dd/mm/yyyy` bằng `new Date`.
- Đồng bộ Doanh thu, Chi phí thu mua, Lợi nhuận, Dòng tiền. Chế độ ngày dùng cùng control; tháng/năm giữ cách nhập hiện có. Không sửa bộ lọc tồn lâu hoặc ngày của module khác.
- Giữ parser/validation, query, kỳ báo cáo giờ VN, dữ liệu và quyết định legacy G9/G10. Không đổi schema, công thức, route, quyền, dependency hoặc baseline visual.

## File thuộc thay đổi này

| File | Nội dung |
|---|---|
| `src/features/reports/ReportPeriodForm.tsx` | Native calendar chung, đồng bộ text/ISO, mở lịch có guard |
| `src/index.css` | Chỉ nhóm `.report-date-*`; icon native, border/radius đồng bộ nguồn |
| `tests/unit/report-components.test.tsx` | Thêm 6 case; giữ các assertion cũ |
| `tests/e2e/report-date-picker.spec.ts` | 3 test mới về lịch, dữ liệu theo ngày VN và layout |
| `planning/ui/report-date-picker/` | Báo cáo, ảnh và hash bằng chứng |

`src/index.css` cũng có thay đổi từ các nhiệm vụ UI trước; chúng không bị hoàn tác hoặc đưa vào phạm vi nghiệp vụ của lần sửa này.

## Kiểm thử thực thi

Chromium `156.0.8078.4`, zoom 100%, DPR 1. Các E2E mới chạy với browser timezone `America/New_York` để phát hiện lệch ngày so với Việt Nam.

| Nhóm/lệnh | Kết quả |
|---|---|
| `npm.cmd run lint` | PASS, exit 0 |
| `npm.cmd run typecheck` | PASS, exit 0 |
| `npm.cmd run build` | PASS, exit 0; 5,26 giây. Cảnh báo annotation Zod/chunk lớn hiện có vẫn còn |
| `npm.cmd test -- tests/unit/report-components.test.tsx tests/unit/report-period.test.ts tests/unit/report-queries.test.ts --maxWorkers=1` | 95 PASS / 0 FAIL; 17,28 giây, bao gồm integration query/Dexie |
| Hai E2E tương tác/dữ liệu trong `report-date-picker.spec.ts` | 2 PASS / 0 FAIL; 9,6 giây |
| E2E layout trong cùng file, `--grep "report date fields"` | 1 PASS / 0 FAIL; 3,7 giây |
| `npm.cmd run test:e2e -- tests/e2e/reports-revenue.spec.ts tests/e2e/reports-purchase-cost.spec.ts tests/e2e/reports-t04.spec.ts --workers=1 --reporter=list --output=test-results/report-date-final-regression` | 11 PASS / 0 FAIL; 58,1 giây |

Tổng test chính thức liên quan: **95 unit/integration và 14 Chromium PASS, không skip**. Không chạy full suite/visual toàn dự án.

Đã kiểm chứng: click mở lịch thật (`:open`), chọn bằng bàn phím và đồng bộ hai ô; giữ giá trị khi đổi focus; 29/02, qua tháng/năm; khoảng bằng nhau, đảo ngược, thiếu/sai ngày; đổi chế độ; reload theo hành vi cũ. Giao dịch được hoàn tất bằng UI thực để kiểm tra lọc dòng tiền đúng ngày VN và tổng tiền. Snapshot dữ liệu trước/sau báo cáo không đổi. Regression bao gồm legacy, phân quyền Nhân viên, session độc lập, lỗi/rỗng, phân trang và tổng kỳ. Không có `pageerror` trong hành trình lịch của bốn báo cáo.

### Giới hạn phải giữ mở: chọn ô ngày bằng chuột

- **FAIL ở probe tự động, chưa kết luận lỗi sản phẩm:** thử `page.mouse.click` trên ô ngày trong popup native không đổi ngày. Probe nằm ngoài suite chính tại `test-results/report-date-mouse/`; không sửa assertion/timeout để tạo PASS. Click mở lịch và chọn bàn phím trong suite chính đã chạy thành công, nhưng không thay thế bằng chứng chọn ngày bằng chuột.
- **BLOCKED xác minh trực tiếp:** Computer Use báo `Computer Use app approval timed out` khi yêu cầu quyền Chrome. Đã hỏi người dùng cho phép mở lại yêu cầu; chưa nhận câu trả lời tại thời điểm lập báo cáo. Chưa thực hiện click ngày bằng chuột qua Computer Use, không ghi PASS cho mục này.
- Cần kiểm tra trực tiếp hai ô bằng chuột sau khi có quyền Chrome; nếu thất bại phải điều tra tiếp. Chưa thể tuyên bố hoàn tất toàn bộ yêu cầu nghiệm thu tương tác chuột.

### Sửa phép đo trong test mới

Lần chạy layout đầu thất bại vì `getComputedStyle(input, '::-webkit-calendar-picker-indicator')` trả kích thước host input (36px), không phải icon native. Đã đổi sang `DOM.getBoxModel` của indicator thật trong UA shadow tree Chromium; đo được 20×20px. Giữ nguyên các ngưỡng/assertion kích thước, không sửa CSS hay baseline để che lỗi. Targeted layout sau sửa PASS.

## Đối chiếu giao diện

Các ô ngày cao 43,78125px, nguồn Thu mua 45px (lệch 1,21875px); border `1px solid #AEAEB2`, radius 8px, font 14px giống nguồn. Icon thật 20×20px, tâm dọc lệch 0px, vùng click rộng 36px. Hai ô bằng chiều cao/chiều rộng, chuỗi ngày hiển thị đủ, không tràn ngang tại 1366×768, 1440×900, 1920×1080 và 768×1024. Không thay baseline/ngưỡng G10.

- [Lịch native đang mở](evidence/cash-flow-calendar-open.png)
- [Dòng tiền — khoảng ngày đã chọn](evidence/cash-flow-selected-range.png)
- [Doanh thu](evidence/revenue-selected-range.png), [Chi phí thu mua](evidence/purchase-cost-selected-range.png), [Lợi nhuận](evidence/profit-selected-range.png)
- [1366×768](evidence/report-date-1366x768.png), [1920×1080](evidence/report-date-1920x1080.png), [768×1024](evidence/report-date-768x1024.png)
- [Nguồn Thu mua](evidence/reference-purchase-date.png), [nguồn Hàng hóa](evidence/reference-inventory-date.png)
- [Số đo thực](evidence/geometry.json), [hash source/dependency](evidence/source-hashes.json)

**Trạng thái:** source đã sửa và kiểm thử liên quan đạt; yêu cầu chọn ô ngày bằng chuột còn chờ xác minh trực tiếp. Không đổi trạng thái nghiệm thu phase.
