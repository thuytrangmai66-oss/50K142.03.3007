# Sửa thông báo khung giá trùng — 16/11/2026

Phạm vi: ánh xạ lỗi và hành vi form. Nhánh `main`, HEAD `e5aa35b`; không commit/push/deploy, không gọi thao tác ghi trên Supabase thật.

## Nguyên nhân và quy tắc

`coco_bracket_identity` là UNIQUE expression index trên bảng `khungGiaThuMua`:

```sql
((data->>'LoaiSanPham'), (data->>'ThuongHieu'), (data->>'TinhTrang'))
```

Định nghĩa được kiểm tra trong `supabase/migration_all.sql:155` và thực thi lại trong PostgreSQL cục bộ. Khớp BR-UC5-04 trong `planning/REQUIREMENT_TRACEABILITY.md` và `LocalReferenceData.uniqueBracket`: Loại hàng + Thương hiệu + Độ mới. Min/Max không thuộc khóa duy nhất. Không đổi cách trim/so sánh chữ, mapping độ mới hoặc quyền Chủ theo BR-UC5-02/08. Không truy vấn `pg_indexes` trên project production để khẳng định DDL remote ngoài bằng chứng này.

Adapter trước đây đổi mã `23505` thành `DUPLICATE` nhưng giữ nguyên `message` SQL. `BracketForm` hiển thị message đó vì đây là `DataServiceError`.

## Sửa đổi

- `src/cloud/services.ts`: truyền tên method vào mapper. Chỉ `referenceData.createBracket/updateBracket` với SQLSTATE **23505** và tên constraint chính xác **coco_bracket_identity** nhận thông báo **“Khung giá đã tồn tại”**. Nhận diện metadata constraint hoặc mẫu thông báo PostgreSQL chuẩn. Constraint khác dùng thông báo xung đột mã riêng, không lộ tên SQL và không bị gắn nhầm thành trùng tổ hợp.
- Phân biệt validation, quyền, mất kết nối và lỗi hệ thống. Không thêm precheck frontend thay thế database; lỗi do race vẫn đi qua mapper này.
- `src/features/price-brackets/BracketForm.tsx`: hiển thị thông báo quyền/mất mạng đã được định nghĩa, giữ fallback lỗi hệ thống. Không reset input, không đóng form khi thất bại; người dùng đóng thông báo, chỉnh và lưu tiếp.
- Không sửa migration/schema/index, API nghiệp vụ, Min/Max, dữ liệu cũ hay phân quyền.

## Kiểm thử đã thực thi

| Phạm vi | Kết quả |
|---|---|
| `npm.cmd run lint` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS; cảnh báo annotation Zod/chunk >500KB hiện có |
| `npm.cmd test -- tests/unit/bracket-cloud-errors.test.ts tests/unit/cloud-services.test.ts --maxWorkers=1` | **20 PASS**, 0 FAIL |
| `node supabase/tests/bracket-duplicate.mjs` | **7 PASS**, 0 FAIL; PostgreSQL/PGlite + pgcrypto thật, DB RAM riêng |
| `npm.cmd run test:e2e -- tests/e2e/cloud-runtime.spec.ts --workers=1 --reporter=list --output=test-results/bracket-duplicate` | **6 PASS**, 0 FAIL; Chromium/app/SDK thật, HTTP/Auth/WebSocket giả lập |

Đã kiểm tra tạo hợp lệ; trùng tổ hợp dù Min/Max khác; khác thương hiệu; khác độ mới; giữ đủ 5 giá trị sau thông báo trùng và sửa để lưu thành công; validation; offline; không có quyền; lỗi hệ thống; constraint 23505 khác. PostgreSQL chứng minh lượt trùng rollback cả bản ghi, reservation mã, receipt và audit, không tạo trùng. Fixture đầu của script QA bị tạo tài khoản test hai lần; đã sửa fixture, không sửa SQL sản phẩm. Lỗi type `never[]` trong snapshot fixture E2E mới đã được sửa bằng kiểu record rõ ràng; typecheck/build cuối PASS.

**Race:** hai browser context độc lập gửi đồng thời đã kiểm tra một success/một thông báo trùng, form bên thua vẫn sửa được. Backend của bài này là transport giả lập. **Hai máy/two-connection trên Supabase thật: NOT RUN**; PGlite chỉ có một connection. Không dùng kết quả giả lập để tuyên bố race production đã PASS.

## File và bằng chứng

- Source: `src/cloud/services.ts`, `src/features/price-brackets/BracketForm.tsx`.
- Test: `tests/unit/bracket-cloud-errors.test.ts`, `tests/e2e/cloud-runtime.spec.ts`, `supabase/tests/bracket-duplicate.mjs`.
- [Ảnh thông báo mới và form giữ mở](evidence/bracket-duplicate-friendly.png).
- [Hash source và migration](evidence/hashes.json). `git diff --exit-code -- supabase/migration_all.sql` đạt: migration không đổi. Công cụ PGlite nằm trong `test-results/sql-validation` được Git ignore, không thêm dependencies ứng dụng.

Chưa chạy full suite vì phạm vi hẹp; không thay trạng thái nghiệm thu phase.
