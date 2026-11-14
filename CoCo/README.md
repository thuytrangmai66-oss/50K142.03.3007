# CoCo

Ứng dụng demo React/TypeScript/Vite, lưu dữ liệu trong IndexedDB của từng trình duyệt/origin; không có Supabase hoặc backend. Ưu tiên trình duyệt Chrome trên desktop.

Trạng thái rà soát 14/11/2026: đã có đăng nhập/phân quyền, khách hàng, nhân viên, khung giá, thu mua/phê duyệt, hàng hóa/lịch giảm giá, bán hàng/thanh toán/điểm, báo cáo và dashboard. **G10 đang kiểm chứng; G11 chưa qua điều kiện đầu vào.** Chức năng có trong code và test PASS không tự đồng nghĩa phase đã được nghiệm thu. Xem [master plan](planning/MASTER_PLAN_COCO.md), [báo cáo G10](planning/phase10/REPORT_PHASE_10.md), [cổng nghiệm thu](planning/phase10/ACCEPTANCE_GAPS.md).

Chạy local với Node 24 / npm 11:

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở **http://127.0.0.1:5173/50K142.03.3007/**. Vite dùng port cố định; nếu port đã có server, kiểm tra server đang chạy thay vì đóng tiến trình không rõ chủ sở hữu. Cần xem bản production local: `npm.cmd run build`, rồi `npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort`; mở **http://127.0.0.1:4173/50K142.03.3007/**. Hai port có hai origin/dữ liệu khác nhau.

Lần đầu nhập thông tin để thiết lập **một chủ cửa hàng**, rồi đăng nhập bằng tài khoản vừa tạo. Không có username/password mặc định. Không dùng xóa storage để xử lý lỗi đăng nhập vì có thể mất toàn bộ dữ liệu demo. Fixture trong `tests/` chỉ chạy trong profile kiểm thử, không tự nhập vào ứng dụng.

Demo hai vai trò trong cùng Chrome, cùng origin:

1. Đăng nhập Chủ, tạo tài khoản Nhân viên và khung giá hợp lệ. Độ mới dùng chung: 3=Mới, 2=Tốt, 1=Khá.
2. Mở tab mới, đăng nhập Nhân viên. Hai tab dùng chung IndexedDB và token sessionStorage độc lập. Kiểm tra tên/vai trò trên từng tab.
3. Nhân viên mở **Thu mua** → **Tạo giao dịch**, nhập món và khách hàng hợp lệ. Giá vượt Max phải gửi yêu cầu phê duyệt; chưa tạo hóa đơn hoàn tất.
4. Chủ mở **Phê duyệt**, chọn yêu cầu rồi phê duyệt hoặc từ chối (cần lý do). Đóng thông báo kết quả quay về danh sách, không xử lý lại yêu cầu.
5. Tab Nhân viên nhận kết quả không cần F5. Chỉ hoàn tất thu mua khi mọi điều kiện đạt; kiểm tra giao dịch và sản phẩm trong Hàng hóa. Với từ chối, nhập lại giá theo quy trình thay vì duyệt lại request cũ.
6. **Bán hàng** → tạo giao dịch, chọn hàng còn được phép bán và khách; thanh toán tiền mặt hoặc QR. Với QR, nhân viên kiểm tra tiền thực nhận rồi xác nhận; ứng dụng không tự kiểm tra tài khoản ngân hàng.
7. Mở lịch sử khách hàng: **Lịch sử bán** là khách bán cho CoCo; **Lịch sử mua** là khách mua từ CoCo. Báo cáo theo kỳ chỉ tính dữ liệu đủ bằng chứng; không suy diễn trạng thái hoặc thời gian của hóa đơn legacy.

[Kịch bản thu mua hai tab](planning/phase6/DEMO_ACCEPTANCE.md), [bán hàng](planning/phase8/REPORT_PHASE_8.md), [báo cáo/dashboard](planning/phase9/REPORT_PHASE_9.md). Không có dữ liệu mẫu cố định thay kết quả nghiệp vụ thực tế.

Kiểm tra local:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test -- --maxWorkers=1
node scripts/audit-phase1.mjs
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e -- --workers=1
```

`npm.cmd run test:visual:local -- --workers=1` chạy thêm tám popup khách hàng, cần PDF nguồn CODEX và cache raster/hash như [execution](planning/phase10/CUSTOMER_VISUAL_EXECUTION.md). Thiếu nguồn báo lỗi; không cập nhật baseline từ screenshot ứng dụng. CI dùng baseline SC105 đã được duyệt riêng; các nguồn khác vẫn ngoài Git.

Workflow ở repository root chạy checks trước deploy; push `main` chỉ cập nhật Pages khi checks thành công. Quy trình commit/push theo [AGENTS.md](../AGENTS.md); trạng thái triển khai được kiểm riêng với đúng SHA, không suy ra từ build local. Xem [điều kiện release](planning/phase10/RELEASE_READINESS.md).

Dữ liệu thuộc origin (scheme/host/port), không thuộc đường dẫn GitHub repo: localhost và Pages không chia sẻ dữ liệu; đổi path trong cùng origin không tạo DB riêng. Không đồng bộ đa máy. Xóa site data, profile hoặc dùng chế độ riêng tư có thể làm mất dữ liệu. Schema hiện tại Dexie v4 (IndexedDB native 40); rollback static build không tự downgrade DB. Không mở bản cũ vào dữ liệu đang dùng rồi xóa storage để sửa lỗi; việc khôi phục phải thử trên bản sao/profile tách biệt trước. Chưa có chức năng backup/restore UI được bàn giao trong phạm vi này.

Phân quyền phía client phục vụ demo, không có mức bảo mật tương đương backend và không chống sửa dữ liệu bằng DevTools. Khi báo lỗi, ghi role, đường dẫn, thao tác, expected/actual, thời điểm và build SHA nếu biết; ảnh/log cần che thông tin cá nhân, không gửi mật khẩu hoặc database thật lên GitHub.
