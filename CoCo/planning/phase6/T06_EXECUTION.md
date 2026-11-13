# G6–T06 — tra cứu, chi tiết và lịch sử thu mua

Ngày 12/11/2026. **T06 PENDING REVIEW**, **T05 PENDING REVIEW**, **G6 IN PROGRESS**. Không tự nghiệm thu; hai trường UI của BR-UC1-16 còn BLOCKED theo quyết định giữ Figma. [Đối chiếu và quyết định](T06_REQUIREMENT_REVIEW.md).

## Phần đã triển khai

- [x] Danh sách giao dịch đã ghi nhận, không bao gồm draft; tìm kiếm mã, tên, điện thoại, ngày Việt Nam; kết hợp điều kiện, reset, phân trang thật theo viewport hiện có.
- [x] Reader dùng chung cho trang Thu mua và Lịch sử bán; giữ ranh giới khách bán cho CoCo với khách mua hàng từ CoCo.
- [x] Chi tiết theo bố cục Figma: mã/ngày giờ, khách hàng, từng dòng sản phẩm/số lượng/đơn giá/thành tiền và tổng tiền. Mở từ Thu mua và lịch sử có đúng đường Quay lại.
- [x] Tách các dòng cùng khung giá nhưng khác giá; sử dụng snapshot giá thu mua đã lưu, không tính lại bằng khung giá hiện tại.
- [x] Lịch sử theo MaKH tồn tại sau sửa tên/số điện thoại; hai vai trò đọc được giao dịch hợp lệ; session và quyền được kiểm tại service.
- [x] Dữ liệu mới/legacy dùng đúng adapter; lỗi quan hệ, snapshot mất hoặc sai tổng không bị che bằng fallback. Mã legacy không bị diễn giải lại.
- [x] Thông báo lỗi danh sách/chi tiết/lịch sử theo nguồn; X đóng thông báo, chi tiết lỗi quay về danh sách; không cần reload làm giải pháp nghiệp vụ.
- [x] Kiểm tra tính chỉ đọc bằng so sánh toàn bộ store trước/sau truy vấn và thao tác UI, gồm reload; không tạo hóa đơn/khách/snapshot giả.
- [ ] Hiển thị Nhân viên thực hiện trong chi tiết: **BLOCKED**, giữ Figma theo người dùng.
- [ ] Hiển thị Trạng thái trong chi tiết: **BLOCKED**, giữ Figma theo người dùng. Cột Trạng thái lịch sử vẫn theo thiết kế.
- [ ] Review pixel cuối cùng và nghiệm thu T06 bởi người dùng.

## File source/test của lượt T06

| File | Thay đổi |
|---|---|
| `src/services/purchase-queries.ts` (mới) | Query kết hợp, header join, chi tiết canonical/legacy có kiểm tra dữ liệu |
| `src/services/purchase-candidate.ts` | Phát hiện dấu vết hóa đơn mới mất snapshot, chặn fallback legacy |
| `src/services/purchase-finalization.ts` | Export schema mapping hiện có để reader kiểm tra; không thay finalizer/mapping |
| `src/services/purchase-drafts.ts` | Delegate danh sách và thêm API đọc chi tiết có quyền |
| `src/services/reference-data/local.ts` | Dùng chung reader cho lịch sử bán/chi tiết |
| `src/services/reference-data/contracts.ts` | Metadata read model nhân viên/trạng thái/nguồn; không đổi DB |
| `src/domain/formatters.ts` | Định dạng ngày đủ năm và giờ Việt Nam |
| `src/features/purchases/PurchaseInvoicePage.tsx` (mới) | Thẻ chi tiết hai cột theo Figma, dùng chung hai entry point |
| `src/features/purchases/PurchasesPage.tsx` | Link chi tiết riêng, lỗi theo thiết kế, tránh điều hướng hai lần khi click link |
| `src/features/customers/CustomerHistoryPage.tsx` | Chi tiết bán dùng component chung, trạng thái lịch sử và popup lỗi |
| `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx` | Route/breadcrumb/viewer và Quay lại |
| `src/index.css` | CSS giới hạn trong thẻ chi tiết/breadcrumb, giữ editor/list/pagination dùng chung |
| `tests/unit/purchase-queries.test.ts` (mới) | 16 unit/integration về reader, dữ liệu thật, legacy, lỗi và quyền |
| `tests/e2e/purchase-queries.spec.ts` (mới) | 5 Chromium: luồng UI hai role và lỗi danh sách/chi tiết/lịch sử |
| `tests/e2e/purchase-list.spec.ts` | Bổ sung chi tiết hợp lệ cho fixture legacy 25 hóa đơn; không nới validation để fixture thiếu dữ liệu vẫn thành công |

Repository đã có nhiều thay đổi chưa commit trước T06; bảng này chỉ nêu phạm vi lượt T06, không nhận toàn bộ working tree là thay đổi mới. Branch `coco/phase-5-staff`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`; không commit/push/deploy, không reset dữ liệu người dùng.

## Đối chiếu UC/BR với kiểm thử

| UC/BR | Oracle và test case | Kết quả/gate |
|---|---|---|
| UC_1.2, BR-UC1-12 | Unit `requires a valid session`, `allows staff…`; Chromium owner/staff; regression auth/approval permission | Xem log thực thi bên dưới |
| BR-UC1-13/14/15 | Unit combined filter, ngày VN qua nửa đêm, ngày sai, pagination; `purchase-list.spec.ts` 25 legacy, ba viewport, reset; T06 owner/staff kết hợp bốn input | Xem log thực thi |
| BR-UC1-16: nội dung chi tiết | Unit mixed prices/snapshot/total, legacy; Chromium hai dòng 80.005×2 và 90.000×1, tổng 250.010, reload, ba viewport | Phần theo Figma được kiểm; **hai trường UI BLOCKED** |
| BR-UC1-17 | Unit chống fallback/corruption và before/after toàn store; Chromium read-only sau rename/reload; regression T05 atomic finalization | Xem log thực thi |
| UC_4.6, BR-UC4-11/12 | Stable MaKH sau đổi cả tên và điện thoại, hóa đơn không nhập sang lịch sử mua; unit route sai MaKH bị chặn; Chromium Quay lại đúng lịch sử | Xem log thực thi |
| Ngoại lệ | Unit thiếu dòng/khung giá/khách/nhân viên/cost/product/snapshot, mapping sai, sai tổng; Chromium native IDB read faults ở ba màn, X đóng và phục hồi | Xem log thực thi |
| Hồi quy | G2 repository/migration/rollback, auth, G4/G5, G6 draft/approval/result/finalize; hai tab độc lập và đồng bộ qua UI thật | Xem log thực thi |

## Kết quả thực thi và bằng chứng

Baseline unit/integration trước thay đổi: **233 PASS**, JSON `evidence/t06-baseline-vitest.json`. Mốc baseline Chromium gần nhất T05: **88 PASS** theo bằng chứng T05, không gọi là lần chạy baseline mới của T06.

Test tập trung: **55/55 unit/integration PASS**, sau bổ sung ca quyền staff: **16/16 test reader mới PASS**; **27/27 Chromium PASS** cho T06 và các suite finalization/list/reference liên quan. Các số này là các lượt chạy, không cộng vào số test duy nhất.

Hồi quy đầy đủ đã kết thúc thành công:

| Kiểm tra | PASS | FAIL | NOT RUN | Exit |
|---|---:|---:|---:|---:|
| `npm.cmd run lint` | 1 lệnh | 0 | 0 | 0 |
| `npm.cmd run typecheck` | 1 lệnh | 0 | 0 | 0 |
| `npm.cmd test -- --reporter=json …` | **249 test / 12 file** | 0 | 0 | 0 |
| `npm.cmd run build` | 1 lệnh | 0 | 0 | 0 |
| `npm.cmd run test:e2e -- --workers=2 --reporter=line,json` | **93 test Chromium** | 0 | 0 | 0 |
| Nghiệm thu người dùng/pixel cuối cùng | — | — | Chưa thực hiện | — |

Trong số trên có **16 test reader mới**, **5 test UI T06 mới**; không cộng các lượt chạy tập trung vào tổng duy nhất. Console/pageerror của luồng T06 hai role không có lỗi; các ca native IDB read failure là lỗi tiêm có chủ đích và đã hiển thị thông báo tương ứng. Toàn bộ test cũ G2–T05 tiếp tục PASS, gồm approve/reject hai tab, phiên độc lập, CAS/chống xử lý trùng, atomic commit/rollback và native IndexedDB.

Log [checks](evidence/t06/checks.json), [Vitest](evidence/t06/vitest.json), [Chromium](evidence/t06/playwright.json), [execution](evidence/t06/execution.json); [SHA-256 source/test](evidence/t06/source-manifest.json). Đây là bằng chứng QA; không thay xác nhận nghiệm thu.

Ảnh đã chụp từ UI thực, dữ liệu do thao tác tạo giao dịch/khách hoàn tất trong profile test:

- [Chủ: chi tiết 1440](evidence/t06/owner-detail-1440.png), [1366](evidence/t06/owner-detail-1366.png), [1920](evidence/t06/owner-detail-1920.png).
- [Nhân viên: chi tiết 1440](evidence/t06/staff-detail-1440.png), [1366](evidence/t06/staff-detail-1366.png), [1920](evidence/t06/staff-detail-1920.png).
- [Chủ: tìm kiếm](evidence/t06/owner-search.png), [lịch sử](evidence/t06/owner-customer-sales-history.png), [mở chi tiết từ lịch sử](evidence/t06/owner-customer-sales-detail.png).
- [Nhân viên: tìm kiếm](evidence/t06/staff-search.png), [lịch sử](evidence/t06/staff-customer-sales-history.png), [chi tiết từ lịch sử](evidence/t06/staff-customer-sales-detail.png).
- [Lỗi danh sách](evidence/t06/error-list.png), [lỗi chi tiết](evidence/t06/error-detail.png), [lỗi lịch sử](evidence/t06/error-history.png).

Đã xem và đối chiếu cấu trúc với ảnh local: nút Quay lại, header be, hai cột thông tin, bảng và tổng tiền; không công bố pixel-perfect PASS. Menu chỉ hiện các module đã triển khai theo quyền, không dựng menu chức năng chưa làm để giả hoàn thiện.

## Chạy và demo

```powershell
cd D:\50K142-NEW\CoCo
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Mở `http://127.0.0.1:5173/50K142.03.3007/`. Dùng tài khoản đã tạo trong trình duyệt của người dùng; không có tài khoản demo seed tự động. Profile Playwright là riêng, không phải dữ liệu đang dùng ở localhost5173.

1. Mở Thu mua → Tạo giao dịch; chọn khung giá hợp lệ, thêm hai dòng cùng khung giá có giá khác nhau trong khung; chọn/tạo khách bằng UI và Lưu.
2. Đóng thông báo thành công → danh sách; thử tìm theo mã/tên/điện thoại/ngày Việt Nam và kết hợp; mở mã hóa đơn để đối chiếu hai giá/tổng, Quay lại và reload.
3. Mở Khách hàng → đúng khách → Lịch sử bán → cùng mã giao dịch. Sửa tên/điện thoại ở hồ sơ, mở lại lịch sử để xác minh liên kết không mất.
4. Mở tab Chrome thứ hai cùng origin, đăng nhập vai trò còn lại; thực hiện tra cứu cùng hóa đơn. Luồng gửi giá vượt khung → chủ quyết định → nhân viên nhận kết quả vẫn được suite T03/T04/T05 kiểm hồi quy; không tạo shortcut quyết định từ màn chỉ đọc.

## Phần còn lại

**PASS:** các phần dữ liệu/tra cứu/UI theo thiết kế và toàn bộ kiểm thử tự động nêu trên. **FAIL:** 0 test. **BLOCKED:** 2 trường detail UI; **chưa thực hiện:** nghiệm thu người dùng/pixel cuối cùng. T05/T06 chờ review, G6 chưa nghiệm thu. Task tiếp theo trong thứ tự hiện hành là **T07 — gói kiểm chứng/nghiệm thu G6**, cần giữ nguyên gate và các điểm OPEN này; chưa chuyển G7.
