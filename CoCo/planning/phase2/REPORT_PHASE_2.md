# Báo cáo Giai đoạn 2 nền dữ liệu CoCo

Ngày 10/11/2026. Đã hiện thực phạm vi nền dữ liệu được nêu trong bước tiếp theo của Giai đoạn 1. Kết quả kỹ thuật local đạt; chưa ghi nhận người dùng nghiệm thu thay cho chỉ đạo trực tiếp. Không thay đổi roadmap, thứ tự phase hoặc AD01–AD08.

## Kết quả

- `src/domain/records.ts`: kiểu dữ liệu và validation cho 10 thực thể, metadata kỹ thuật; không lưu mật khẩu rõ, không đoán mã trạng thái nghiệp vụ.
- `src/db/schema.ts`: migration `CoCoDB` v1 → v2, giữ appMetadata, thêm store/index/unique/khóa kép; không auto-seed hoặc reset.
- `src/repositories/`: đọc kèm version, ghi nhiều bản ghi nguyên tử, kiểm tra FK xuôi/ngược, optimistic concurrency, chống command lặp giữa nhiều kết nối, audit/receipt cùng transaction, giữ mã đã cấp.
- Hoàn tất mapping kỹ thuật Q05/Q06/Q07/Q08/Q09 tại [DATA_MAPPING.md](DATA_MAPPING.md), có nguồn trường, ràng buộc và các chi tiết chưa được tự quyết định.
- Giữ giao diện khung hiện có. Không triển khai lại Giai đoạn 1 hoặc thêm màn hình nghiệp vụ trước thứ tự roadmap.

## Kiểm chứng local

| Kiểm tra | Kết quả |
|---|---|
| Lint, typecheck, build | PASS |
| Unit/integration fake-indexeddb | 27/27 PASS, 2 file |
| Chromium smoke trên bản build với base Pages | 3/3 PASS |
| Audit ngắt tích hợp cũ | 5/5 PASS |

Kiểm thử bao gồm migration v1 giữ dữ liệu và không seed; đủ 10 thực thể/khóa kép; unique điện thoại/login/tổ hợp khung giá; FK lỗi rollback cả bản ghi, version, mã giữ chỗ, audit và receipt; mô phỏng lỗi lưu audit rồi retry; hai kết nối tranh chấp điện thoại/version/command/mốc giảm; tombstone chống ghi đè sau xóa/tạo lại; mã sản phẩm không tái sử dụng; dữ liệu nguồn sản phẩm bất biến; lịch sử khách hàng giữ liên kết sau đổi số điện thoại; giá vốn snapshot theo từng món và không đổi theo khung giá; validation số/ngày/tiền/hash.

Test Chromium mới dựng đúng native IndexedDB v10 tương ứng Dexie v1 trong profile riêng, rồi tải build hiện tại: nâng cấp thành native v20/Dexie v2, metadata sentinel còn nguyên và không có tài khoản tự tạo. Không reset dữ liệu trình duyệt người dùng.

CI/CD trên `main` tiếp tục dùng workflow đã thiết lập. Bảng trên ghi kết quả local; đối chiếu từng commit với [workflow checks và Pages](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/workflows/deploy.yml) để xác minh checks/deploy thực, không đồng nhất PASS local với deploy thành công.

## Giới hạn và tiếp tục

Lớp repository chưa được nối với màn hình ghi dữ liệu; đây chưa phải nghiệm thu 27 UC hoặc xác thực/phân quyền. Các service sau phải kiểm tra quyền và các quy tắc nghiệp vụ trước khi gọi repository. Đã có cấu trúc hash/salt/role nhưng chưa có login hay chủ đầu tiên; cấu trúc membership, snapshot giá vốn, lịch giảm và thông báo chưa đồng nghĩa đã triển khai các luồng đó.

Không tự quyết định Q10, làm tròn khoản giảm Q12, Q20 hoặc Q21. `MASTER_PLAN_COCO.md` chưa có trong checkout, nên báo cáo này chỉ xác nhận phạm vi Giai đoạn 2 đã được ghi ở báo cáo trước, không đặt lại tên hoặc thứ tự phase tiếp theo.
