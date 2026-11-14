# G10 — Checkpoint tương thích dữ liệu trước release

Ngày 14/11/2026. Đây là kiểm tra source/contract và tham chiếu test, **không thay drill rollback/roll-forward G11-T04**.

## Đã xác minh chỉ đọc

- HEAD `1fd4ad4a04e3b870a1c673fd7abd344af50dea69` và working tree đều khai báo `COCO_SCHEMA_VERSION=4`, giữ các version 1/2/3/4. `git diff -- src/db src/domain/records.ts src/domain/sales.ts` không có thay đổi.
- Không thêm migration/store/cột hoặc thay mapping trạng thái legacy trong G10. Runtime P03/P04 v4 đã được người dùng nghiệm thu/kích hoạt từ G6-T01, không suy từ test G10.
- Thay đổi `src/domain/purchases.ts` chỉ tách structural schema để thay API Zod 3 `.innerType()` sau gói major được duyệt. Các field/format/strict parsing không đổi; writer tiếp tục refinement line/draft/status/subtotal/paidTotal. Hai report reader vẫn tự kiểm quan hệ và cho phép thiếu `paidAt` theo quyết định reporting, không gán ngày giả.
- Auth session vẫn theo tab; dữ liệu dùng chung theo origin. Thay kiểu popup, router transition, lookup FK theo lô không được coi là quyền đổi dữ liệu hoặc quan hệ cũ.

## Bằng chứng kiểm thử liên quan

`purchase-contract.test.ts` có ca rollback schema upgrade bị lỗi và giữ sentinel v3; `auth.spec.ts` nâng DB v2 giữ credential/customer; `shell.spec.ts` giữ metadata v1, không auto-seed; `phase10-integrity.spec.ts` kiểm transaction native graph 1.000 món, audit lỗi cuối rollback toàn bộ và retry một lần. Các test contract/legacy/report còn trong full suite, không bỏ ca hoặc đổi mapping để chạy PASS.

Những bài này có phạm vi riêng: transaction rollback không phải deploy rollback; open/reopen DB không thay thử mở artifact cũ trên bản sao dữ liệu mới. Giữ NOT RUN cho drill G11 khi chưa thực thi.

## Đầu vào cần giữ cho G11-T04

1. Chọn artifact cũ/mới và SHA cụ thể sau gate G10, ghi hash build/dependency/schema/format. Chưa có release SHA cho working tree G10.
2. Chỉ dùng profile/dataset tổng hợp tách biệt; tạo bản sao tất cả store, key/index/schema cùng digest trước/sau. Không export credential hoặc DB thật vào artifact công khai.
3. Thử bản mới trên bản sao schema cũ, kiểm snapshot tiền/điểm/kho/ID/FK/provenance/session và reload. Thử lỗi upgrade trên bản sao độc lập để chứng minh rollback.
4. Thử artifact cũ với bản sao dữ liệu/schema mới: ghi kết quả thực, kể cả VersionError hoặc reader không tương thích. Không nâng/hạ version để ép mở, không xóa storage để sửa lỗi.
5. Roll-forward bằng artifact tương thích; xác minh dữ liệu/digest/hành trình. Nếu không có đường downgrade an toàn, tài liệu khôi phục phải nêu roll-forward và giữ bản sao nguyên vẹn.

Schema version giống nhau là điều kiện cần, **không đủ kết luận artifact cũ đọc đúng metadata hoặc release rollback PASS**. Không đưa backup/restore UI mới vào scope để thay bài drill. [Checkpoint G11](RELEASE_READINESS.md).
