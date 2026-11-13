# CoCo

Mục **Thu mua** mở danh sách giao dịch, chọn **Tạo giao dịch** để mở form. Hủy form quay về danh sách. Chỉ hóa đơn đã lưu xuất hiện trong danh sách, draft chưa hoàn tất vẫn giữ riêng. [Báo cáo sửa trang vào](planning/phase6/PURCHASE_LIST_ENTRY_REVIEW.md).

Hiện đã có G5 quản lý tài khoản nhân viên và G6–T02 nhập giao dịch thu mua, ưu tiên web desktop. T01 đã được người dùng nghiệm thu và cho phép kích hoạt metadata v4. Xem [báo cáo T02 và hướng dẫn demo](planning/phase6/T02_EXECUTION.md). Chủ có thể tạo staff thật rồi mở tab mới đăng nhập độc lập.

Ứng dụng demo React/TypeScript/Vite, lưu dữ liệu riêng trong IndexedDB của từng trình duyệt/origin. Kế hoạch và tiến độ: [planning/MASTER_PLAN_COCO.md](planning/MASTER_PLAN_COCO.md).

Chạy local với Node 24 / npm 11:

```powershell
npm ci
npm run dev
```

Mở URL Vite in ra, có base `/50K142.03.3007/`. Lần đầu nhập thông tin để thiết lập **một chủ cửa hàng**, rồi đăng nhập bằng tài khoản vừa tạo. Không có username/password mặc định. Không dùng xóa storage để xử lý lỗi đăng nhập vì thao tác đó có thể mất toàn bộ dữ liệu demo.

Đã có G3 login/logout/session/quyền, G4 khách hàng/lịch sử/khung giá, G5 tài khoản nhân viên và G6–T02 draft/nhập món/giá/pending request. Chưa có duyệt/từ chối (T03), nhận kết quả (T04), hoàn tất hóa đơn/nhập kho (T05) hoặc dashboard G9. Không Supabase hoặc backend. Danh mục độ mới: 3=Mới, 2=Tốt, 1=Khá; giữ nguyên dữ liệu cũ chưa đối chiếu. Hai tab dùng chung IndexedDB nhưng token sessionStorage riêng. Fixture trong `tests/` không tự nhập vào ứng dụng. [Test A–F G6](planning/phase6/DEMO_ACCEPTANCE.md) vẫn bắt buộc ở task tương ứng.

Kiểm tra local:

```powershell
npm run lint
npm run typecheck
npm test
node scripts/audit-phase1.mjs
npm run build
npx playwright install chromium
npm run test:e2e
```

Workflow ở repository root chạy checks trước deploy; push `main` sẽ tự cập nhật Pages. Các thay đổi G3/G4/G5 hiện chưa commit/push/deploy. Localhost và Pages có origin khác nhau nên không chia sẻ dữ liệu. Không có đồng bộ đa máy hoặc backend; phân quyền client phục vụ demo và không chống sửa dữ liệu bằng DevTools.
