# Kiểm chứng PostgreSQL cục bộ

## Bản vá reference Thu mua — 16/11/2026

`node supabase/tests/purchase-reference.mjs` chạy migration gốc rồi bản vá
`supabase/patches/20261116_purchase_reference.sql` trong DB riêng, kiểm snapshot,
rollback, replay, nhiều dòng pending, quyền và bảo toàn schema/RLS/ACL/dữ liệu.
`--baseline` chỉ chạy SQL gốc để tái hiện lỗi: dự kiến **11 PASS / 1 FAIL** ở ca
thêm dòng pending thứ hai. Không coi kết quả baseline là nghiệm thu PASS.

Bản vá riêng đã được PO cho phép chuẩn bị/kiểm thử local; **chưa áp dụng cloud**.
Không thay `migration_all.sql`. Sau khi được cho phép áp dụng, cả database mới
chạy migration gốc cũng cần chạy thêm bản vá này. Bản vá tự dừng nếu hàm đang
cài khác câu lệnh đã review; không tự chạy lại migration tổng hoặc sửa dữ liệu.
Xem `planning/ui/purchase-reference/REVIEW.md`.

Chạy từ `CoCo/`:

```powershell
npm.cmd install --prefix test-results/sql-validation --no-package-lock --no-audit --no-fund @electric-sql/pglite@0.5.16
node supabase/tests/run-postgres.mjs
```

Công cụ nằm riêng trong `test-results/`, không thêm dependency vào ứng dụng. Test dùng PostgreSQL WASM/PGlite + extension pgcrypto thật; chỉ shim schema Auth/roles và `auth.uid()`. Không dùng DB hoặc dữ liệu của người dùng.

35 kiểm tra đã chạy PASS: compile/re-run migration, identity/RLS/ACL, idempotency/replay/payload reuse, transaction thu mua, markup 1,30, phê duyệt đúng snapshot/chặn quyết định cũ, hóa đơn bán/stock/điểm/chống bán lại, dấu vết báo cáo, sửa giá/reset chu kỳ, mốc 45 ngày đúng 20.000đ/chống lặp, sửa giá bị từ chối/hủy draft, CRUD khách hàng, import insert-only/rollback/cấm store quyền, staff update/lookup replay, cấm lộ email Auth và chặn thao tác trái quyền/thông báo của người khác. Kết quả tại `test-results/sql-validation/results.json`.

**Giới hạn:** đây là một connection PostgreSQL, không phải kiểm thử race giữa hai kết nối độc lập. Race nhiều máy, Supabase Auth thật, RPC qua PostgREST, Realtime, Edge staff-admin và trình duyệt dùng cloud cần kiểm chứng riêng trên project đã cấu hình. Không báo PASS các mục đó bằng kết quả này.
