# Báo cáo tiến độ G8 — Bán hàng, thành viên và QR cục bộ

> Cập nhật T05–T06 ngày 13/11/2026: đã nối lịch sử mua của khách với snapshot hóa đơn bán, tái sử dụng UI09 và chế độ in Ctrl+P; bổ sung kiểm thử điểm nhiều tab, scheduler/QR, rollback và reload. 345/345 unit/integration, lint/typecheck/build PASS; full Chromium cuối 125 PASS / 1 FAIL (phục hồi lịch sử thu mua). Đã dừng trước staging/commit/push theo chỉ đạo mới. T06 còn lỗi kiểm chứng; xem [báo cáo T06](T06_EXECUTION.md); chưa nghiệm thu G8. Các mốc phía dưới giữ làm lịch sử.

> Sửa module theo chỉ đạo 13/11/2026: đã có `/sales` danh sách/chi tiết chỉ đọc, tìm kiếm kết hợp/reset/pagination, Phiếu bán hàng và thanh nhập/quét mã trực tiếp, typography/payment theo Figma local. G8-D05 áp dụng ưu đãi tự động cho thành viên đủ 50 điểm, bỏ checkbox dùng ưu đãi; giữ opt-in đăng ký và P05. 339/339 unit/integration, 123/123 full Chromium PASS; sau kiểm ảnh sửa màu chữ reset/spacing Sales, 19/19 Chromium liên quan trên build cuối PASS, lint/typecheck/build PASS. [Báo cáo, file và ảnh](SALES_FIGMA_SRS_FIX.md). G8 vẫn PENDING REVIEW; các ghi chú trước gói sửa này phía dưới là lịch sử.

> Cập nhật T03–T04 ngày 13/11/2026: P05 đã được người dùng xác nhận (G8-D04). Đã triển khai QR cục bộ, Tiền mặt/Lưu và Chuyển khoản/Đã nhận, snapshot/transaction atomic, điểm chỉ cập nhật sau thành công. T02 phần điểm đã được nối T04. **330/330 unit/integration, 119/119 Chromium cuối, lint/typecheck/build PASS**. Đã sửa hồi quy min-height bảng rỗng và bảo vệ UI khi điểm overflow. T02–T04 **IMPLEMENTED / PENDING REVIEW**, không tự DONE; quét app ngân hàng thật NOT RUN. [Báo cáo và ảnh](T03_T04_EXECUTION.md). Các ghi chú trước T04 dưới đây là lịch sử; task tiếp theo T05 rồi T06 theo plan.

> Rà soát local 13/11/2026 sau Copilot T02: đã sửa lỗi ưu đãi khi xóa món cuối và nút Lưu nháp/Hủy bị khuất. 315/315 unit/integration, full Chromium cuối 111/111, lint/typecheck/build PASS. Đã kiểm tra launcher và ảnh hai vai trò tại ba viewport desktop. T02 vẫn PARTIAL / PENDING REVIEW; không triển khai task tiếp theo. [Báo cáo review](T02_REVIEW_2026_11_13.md), [cách mở local](LOCAL_RUN.md).

## Trạng thái phase

**IN PROGRESS — G8-T01 draft-cart subset ACCEPTED; G8-T02 calculation, opt-in, membership persistence, and discount preview implemented.** Chưa nghiệm thu G8, chưa hoàn tất UC_3.1/UC_3.2.

## Tiếp nhận và bảo toàn

- Tiếp tục từ working tree G7/G8 hiện hữu; không reset hoặc ghi đè các thay đổi không thuộc task.
- Không commit, push, deploy, xóa dữ liệu, thay đổi schema/migration/API hay kiến trúc DB.
- Giữ nguyên quyết định UI danh sách Hàng hóa 5 cột và các kết quả G2–G7 hiện hữu.
- Quyết định nghiệp vụ G8-D01..D03 đã được người dùng xác nhận và ghi tại [Decision Log](DECISION_LOG.md).

## G8-T01 đã triển khai

- Giỏ nháp cục bộ cho Chủ cửa hàng và Nhân viên, tách theo nhân viên tạo.
- Chỉ chọn sản phẩm có mapping trạng thái bán hợp lệ và hiện có sẵn; không tự suy diễn trạng thái legacy chưa map.
- Snapshot sản phẩm/nguồn mua/giá/phiên bản; số lượng mặc định 1; chống trùng sản phẩm; tổng nháp an toàn số nguyên.
- Kiểm tra lại tình trạng, giá và version khi thêm/lưu để phát hiện dữ liệu thay đổi.
- Lưu draft trong `appMetadata`; không tạo hóa đơn, không bán/trừ tồn, không cập nhật doanh thu/điểm.
- T01 draft-cart subset được chấp nhận sau source review và test tập trung; xem [T01 execution](T01_EXECUTION.md).

## G8-T02 đã triển khai một phần

- Pure calculator 20% membership promotion/points theo quy tắc đã xác nhận.
- UI10 tra cứu/chọn khách hàng, lấy membership status từ `memberships`, opt-in rõ ràng và lưu sự kiện membership ngay với audit actor; không tự đăng ký khách hàng thường.
- UI10 cho member đủ điểm chọn dùng 50 điểm và xem giảm giá/tổng thanh toán dự kiến trên giỏ nháp.
- Opt-in ghi membership ngay cả khi draft bị hủy; không cập nhật điểm, hóa đơn, tồn kho hoặc doanh thu trong luồng này.
- Kết quả kiểm tra cập nhật ở [T02 execution](T02_EXECUTION.md).

Các file source/test được liệt kê trong [T02 execution](T02_EXECUTION.md). Quyết định kỹ thuật giữ nguyên database hiện tại, không thêm store hay migration.

## Kiểm chứng

- Unit/integration hiện hành: 15 test files, 315 tests PASS (`npm.cmd test -- --maxWorkers=1`).
- Focused Chromium sales suite: 4/4 PASS, including owner/staff membership persistence and discount preview.
- Full Chromium E2E: 111/111 PASS (`npm.cmd run test:e2e -- --workers=1`).
- Lint (`npm.cmd run lint`), TypeScript typecheck (`npm.cmd run typecheck`), and production build: PASS.
- Build có cảnh báo bundle Vite >500 kB, không làm build thất bại.
- Full unit/Chromium suites were run serially after build; no skipped tests. Chi tiết ở [T02 execution](T02_EXECUTION.md).
- Screenshots 1440×900: [Chủ cửa hàng](evidence/T01-owner-cart-1440x900.png), [Nhân viên](evidence/T01-staff-cart-1440x900.png).
- Checklist chi tiết: [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md).

## Còn mở / BLOCKED

- **P05:** semantics đã chốt; physical snapshot/migration và finalize còn chờ review gate riêng.
- **P06:** UI opt-in and membership persistence đã triển khai; payment/point integration còn chờ finalizer.
- **P07:** quy tắc 20%/points, eligibility và draft preview đã triển khai; chỉ finalizer được phép cập nhật điểm.
- UC_3.1 tổng thể và UC_3.2 tra cứu hóa đơn vẫn chưa hoàn tất.
- Sản phẩm legacy không có `purchase-status-mapping` không được tự đoán trạng thái.

## Bước tiếp theo

Hoàn tất kiểm chứng full suite và review G8-T02; sau đó tiếp tục thanh toán/finalizer theo gate P05. Không thêm schema. G8 vẫn IN PROGRESS; không đánh dấu DONE.
