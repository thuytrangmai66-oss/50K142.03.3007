# G6–T05 — transaction candidate chờ mapping

> Cập nhật sau chỉ đạo “hoàn thành hết các phần còn lại trong T05”, runtime đã được kích hoạt với bảng mã đề xuất 1/1/2. UI thật và hồi quy đạt **233 unit/integration + 88 Chromium PASS**. [Báo cáo T05 hiện hành](T05_EXECUTION.md) ghi source, ảnh, mapping được áp dụng theo chỉ đạo và tiêu chí review. Nội dung chờ mapping/NOT RUN bên dưới là lịch sử mốc candidate, đã được thay thế.

Ngày 12/11/2026. T05 IN PROGRESS / PARTIAL. Mapping mã số trạng thái còn OPEN theo DATA_CONTRACT_REVIEW. Đã gửi câu hỏi xác nhận, chưa nhận câu trả lời tại thời điểm lập báo cáo. Nút Lưu runtime vẫn chờ cấu hình được duyệt.

## Công việc đã thực hiện

- [x] Rà MASTER_PLAN, PLAN_PHASE_6, contract T01, schema/adapter hiện tại, SRS UC1.1 bước 14–17/15a–15c và CODEX SC034–036/226–228.
- [x] `PurchaseFinalizationService` yêu cầu truyền mapping rõ ràng, không có mã mặc định. UI runtime chưa được cấp service này.
- [x] Kiểm session/quyền trong transaction, chỉ người tạo hoàn tất draft editing đúng revision. Khách phải tồn tại, có ít nhất một dòng active, không còn pending/rejected, approved phải bind đúng snapshot.
- [x] Một transaction lưu hóa đơn, snapshot chi tiết dòng, trạng thái finalized của draft, sản phẩm cho từng món, cost/provenance, issuedIdentifiers/recordVersions, operation receipt và audit.
- [x] Chi tiết mới dùng `purchaseFinalizations.lines` theo P04 đã duyệt. Hai dòng cùng khung giá với đơn giá khác nhau giữ riêng, không ghi đè vào composite key legacy `[MaHDTM, MaKhungGia]`.
- [x] Giá bán từng món = cost ×1,30 half-up theo quyết định người dùng. Ngày nhập và ngày bắt đầu chu kỳ dùng ngày Việt Nam thực tế khi finalize; paidAt/finalizedAt dùng thời gian commit thực.
- [x] Mã SP/TM dài tối đa 10 ký tự, kiểm bản ghi đang có, issuedIdentifiers và recordVersions trước cấp. Dùng store giữ mã đã cấp của G2, rollback cả mã và phiên bản nếu transaction lỗi.
- [x] Receipt/fingerprint giữ kết quả khi retry sau commit; hai kết nối cùng hoàn tất một revision chỉ một bên ghi. Replay trả hóa đơn cũ ngay cả khi cấu hình mapping của service về sau khác.
- [x] Mapping thực sự dùng được snapshot trong `appMetadata` theo key `purchase-status-mapping:<invoiceId>`. Các adapter tương lai có thể đọc đúng mapping của từng hóa đơn, giữ các mã legacy chưa biết nghĩa.
- [x] Source UI đã chuẩn bị command ID ổn định theo revision, validation rỗng/khách/chưa duyệt và đóng thông báo thành công về danh sách. AuthContext có capability optional; AuthProvider chưa khởi tạo finalizer nên callback ghi này chưa được kích hoạt.

Tên sản phẩm `TenSP` lấy từ loại sản phẩm đã nhập, phù hợp độ dài 50 ký tự của schema. Thương hiệu/độ mới được giữ đầy đủ qua khung giá và snapshot dòng; không tự thêm trường tên mới vào form. Cần review mapping hiển thị này khi nối T05/T06/G7.

## Mapping đang cần xác nhận

Schema hiện tại chỉ quy định TINYINT 0–255; SRS mô tả trạng thái bằng chữ, chưa có bảng mã số tương ứng. Theo phần Mapping trước T05 trong DATA_CONTRACT_REVIEW và chỉ đạo giữ quyết định chưa chốt ở trạng thái OPEN, cần xác nhận trước khi ghi runtime.

| Bảng / trường | Mã đề xuất cho dữ liệu mới | Ý nghĩa đề xuất | Trạng thái |
|---|---|---|---|
| hoaDonThuMua.TrangThai | 1 | Hoàn tất | OPEN |
| sanPham.TrangThai | 1 | Đang bán / có thể bán | OPEN |
| sanPham.TrangThai | 2 | Đã bán, dùng ở task bán hàng sau | OPEN |

Các mã 240/241/242 trong test là fixture riêng, không phải mapping được đề xuất hoặc áp dụng cho runtime. Các bản ghi legacy vẫn giữ raw numeric status; metadata mới phân biệt nguồn, không diễn giải lại lịch sử.

## Source và test

- `src/services/purchase-finalization.ts`
- `src/features/auth/context.ts`
- `src/features/purchases/PurchaseEditor.tsx`
- `tests/unit/purchase-finalization.test.ts`
- `tests/fixtures/purchase-finalization-browser.ts`
- `tests/e2e/purchase-finalization-storage.spec.ts`

## Kết quả kiểm thử

| Kiểm tra | Kết quả thực thi |
|---|---|
| Lint/typecheck/build | PASS, exit 0 |
| Toàn bộ unit/integration | 232/232 PASS, gồm 21 test T05 candidate |
| Chromium regression | 81/81 PASS, gồm 80 bài trước và 1 native storage T05 |
| Native T05 sau bổ sung marker mapping/replay | 1/1 PASS chạy lại riêng |
| E2E bấm Lưu qua UI thật T05 | NOT RUN, chờ mapping/runtime activation |
| Screenshot trạng thái thành công/validation T05 runtime | NOT RUN, chưa kích hoạt |
| Nghiệm thu T05/G6 | Chưa hoàn tất |

Unit kiểm mixed-price 80.001 + 120.000, cost riêng, quantity và half-up; pending/rejected/khách thiếu/rỗng/hủy/stale; quyền người khác và revoked session; replay/race; lỗi add ở hóa đơn, sản phẩm, cost, provenance, snapshot, audit, cấp mã và version. Kiểm va chạm mã đã cấp và bảo toàn dữ liệu legacy.

Chromium T05 dùng DB native riêng `T05Native-<uuid>`, fixture gọi service để kiểm transaction. Log xác nhận rollback khi productCosts lỗi, retry và replay, hai kết nối ghi cùng draft chỉ một lần. Đây là storage integration, không thay test luồng UI thật. Fixture cleanup chỉ áp dụng DB test vừa tạo trong context test.

Log tại [Vitest](evidence/t05-candidate/vitest.json), [Chromium regression](evidence/t05-candidate/playwright.json), [native chạy lại](evidence/t05-candidate/playwright-native-final.json), [native oracle](evidence/t05-candidate/native-finalization-storage.json) và [execution/hash](evidence/t05-candidate/execution.json).

## Phần còn lại trong T05

1. Xác nhận mapping số trạng thái ở bảng trên hoặc bảng mã người dùng cung cấp.
2. Khởi tạo finalizer trong AuthProvider bằng mapping đã chốt, kích hoạt Lưu theo nguồn.
3. Chạy UI thật cho hai vai trò, validation, chọn/tạo khách, pending/rejected bị chặn, mixed price/quantity, double click, lỗi ghi/retry, hai tab cùng draft, reload và không nhập kho/hóa đơn trùng.
4. Chụp screenshot trạng thái thành công/lỗi theo CODEX và chạy regression sau khi kích hoạt.
5. Review/nghiệm thu T05 trước tiếp tục T06/T07.

Nhánh `coco/phase-5-staff`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`. Localhost hiện tại http://127.0.0.1:5173/50K142.03.3007/ vẫn phục vụ UI trước kích hoạt T05. Khi cần chạy lại, dùng `npm.cmd run dev -- --host 127.0.0.1 --port 5173` từ `D:\50K142-NEW\CoCo`.
