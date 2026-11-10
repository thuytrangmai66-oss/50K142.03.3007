# Quyết định kiến trúc CoCo

> Cập nhật hiệu lực 10/11/2026: người dùng đã phê chuẩn toàn bộ đề xuất kỹ thuật trong OPEN_ISSUES.md và nghiệm thu Giai đoạn 0 **ĐẠT điều kiện chuyển tiếp**. Nội dung khảo sát bên dưới là lịch sử tại thời điểm lập, không thay thế quyết định này. Giai đoạn 1 được triển khai trong CoCo/; xem planning/phase1/REPORT_PHASE_1.md.

Ngày kiểm kê 10/11/2026. Nguồn: chỉ đạo trực tiếp của người dùng trong chat, MASTER_PLAN_COCO.md và mã nguồn khảo sát. Đây là cấu hình đích, chưa phải xác nhận mã sản phẩm đã được chuyển đổi.

| Mã | Quyết định đã được người dùng chốt | Ngày |
|---|---|---|
| AD01 | React + TypeScript + Vite + Tailwind, giữ cách tách UI, logic và repository của bộ khung | Theo plan đã giao |
| AD02 | Chỉ GitHub Pages + Dexie/IndexedDB; không Supabase, backend server riêng hoặc dịch vụ ngoài | 09/11/2026 |
| AD03 | Dữ liệu riêng theo trình duyệt/origin, phục vụ demo; chủ và nhân viên dùng cùng trình duyệt để thao tác trên cùng dữ liệu | 09/11/2026 |
| AD04 | QR chuyển khoản sinh cục bộ: SHB, tài khoản chuỗi 0947800469, tên MAI THUY TRANG, số tiền cuối cùng sau ưu đãi | 09/11/2026 |
| AD05 | Nhân viên kiểm tra tiền vào và nhấn xác nhận trên màn hình QR; nguồn hiện có đặt tên nút Đã nhận | 09/11/2026; tên nút đối chiếu 10/11/2026 |
| AD06 | SRS + Design gốc tại ổ D và Figma là nguồn chuẩn; 15 Word bổ sung chỉ tham khảo | 10/11/2026 |
| AD07 | Tạo bản CoCo riêng trong workspace hiện tại, chưa gắn GitHub | 10/11/2026 |
| AD08 | Lịch giảm giá 00:00 giờ Việt Nam; chạy khi web mở, xử lý bù khi mở lại | 10/11/2026 |

## Vị trí mã nguồn

- Repo tham chiếu: `D:\web-moto-care-main\web-moto-care`.
- Commit tham chiếu: `72ffdf8618ee2b99a219546e708d72a8f294748b`.
- Nhánh tham chiếu: main; trạng thái sạch tại lúc đọc; origin fetch/push là `https://github.com/HuuKhanh06/web-moto-care.git`.
- Bản làm việc mới: `CoCo/` trong workspace. Đã sao chép 190 tệp, đối chiếu SHA-256 từng tệp tại `STARTER_COPY_MANIFEST.csv`.
- Nhánh local CoCo: `coco`, chưa có commit, không có remote. Không sao chép `.git`, `node_modules`, `.agent` hoặc dữ liệu môi trường bí mật.
- Chưa thay logic, schema, UI, dependencies hoặc workflow của bản sao. Vì vậy bản sao VẪN có mã Supabase, tích hợp ngoài, auto-seed và remote workflow cũ trong nội dung file. Không chạy ứng dụng trước khi thực hiện kế hoạch ngắt kết nối trong giai đoạn 1.
- Không push, không gọi DB cũ, không deploy và không reset dữ liệu trình duyệt trong Giai đoạn 0.

## Ánh xạ và giới hạn

FE và logic nghiệp vụ chạy trong trình duyệt; IndexedDB lưu dữ liệu; GitHub Actions thực hiện build/test/deploy khi có repo đích; GitHub Pages phục vụ dist. Không coi GitHub là nơi chạy DB hay backend liên tục.

Tác vụ bù phải ghi thời gian thực sự thực hiện, không tạo bằng chứng giả rằng đã chạy lúc web đóng. Phải chống xử lý lặp theo sản phẩm/mốc/chu kỳ và nhiều tab. Quy tắc ưu tiên mốc 45 ngày khi mở lại sau nhiều ngày cần được mô tả cùng thuật toán, căn cứ SRS UC_2.3; không giảm 30% lặp lại mỗi ngày.

Giới hạn đã ghi nhận: không tự đồng bộ đa máy; phân quyền phía client là kiểm soát demo; mất/xóa storage có thể mất dữ liệu. Việc chọn local không cho phép bỏ validation, kiểm tra quyền tại service hoặc giao dịch nguyên tử.

Chưa chốt: quy tắc làm tròn tiền/điểm, membership, giá vốn và metadata lưu bổ sung. Xem OPEN_ISSUES.md. Không tự lấy số mẫu từ Figma làm kết quả nghiệp vụ cố định.
