# G6-T02 — nhập giao dịch thu mua trên dữ liệu local thật

> Cập nhật sau bàn giao T02 theo yêu cầu người dùng: Thu mua hiện mở danh sách; bấm Tạo giao dịch mới mở editor, Hủy quay về danh sách. Ghi chú “tạm mở màn tạo” và bước demo đi thẳng vào form trong snapshot bên dưới đã được thay thế. Xem [báo cáo sửa trang vào](PURCHASE_LIST_ENTRY_REVIEW.md); bằng chứng T02 cũ giữ làm lịch sử, không đại diện hash source sau lượt sửa này.

Ngày 11/11/2026. **T01 ĐÃ NGHIỆM THU; T02 READY FOR REVIEW; G6 IN PROGRESS.** Người dùng xác nhận: “Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”. Không suy ra nghiệm thu G5/G6 hoặc các task T03–T07.

## Chức năng đã triển khai

- Kích hoạt migration additive CoCoDB v4, 27 store / IndexedDB native v40. Giữ version cũ và toàn bộ khóa/quan hệ/trạng thái legacy; không reset hoặc seed dữ liệu người dùng.
- Thêm mục Thu mua cho cả Chủ cửa hàng và Nhân viên. Draft rỗng mới chỉ ở bộ nhớ; chỉ lưu khi có command thật, không tạo khách/hóa đơn/sản phẩm giả.
- Nhập loại sản phẩm, thương hiệu, chất lượng 3=Mới/2=Tốt/1=Khá và số lượng nguyên dương. Tra đúng tổ hợp khung giá đã có marker mapping G4; legacy chưa đối chiếu không bị tự diễn giải.
- Hiển thị snapshot Min/Max, nhập đơn giá nguyên đồng dương. Giá bằng Max không cần duyệt; giá vượt Max tự ghi đúng một request pending gắn line ID/revision/quantity/unitCost/bracket snapshot. Không tự thêm luật cấm giá dương dưới Min.
- Lưu draft/dòng/request/receipt/audit trong transaction có fresh session, quyền và CAS; retry cùng command không nhân đôi. Khi ghi thất bại, form giữ giá để thử lại. Snapshot bracket đã đổi phải được kiểm lại trong transaction.
- Hiển thị tổng tiền, giữ thứ tự nhập và pagination dùng component chung, số dòng thích ứng chiều cao. Không cuộn dọc bên trong bảng.
- Tra cứu/chọn khách có thật; khi chưa có thì tái sử dụng CustomerForm và validation/service G4 để tạo khách thật. Lựa chọn khách được lưu trong draft và khôi phục sau reload.
- Bỏ dòng bằng removedAt, loại khỏi tổng tiền và giữ snapshot request như lịch sử. Hủy draft chuyển cancelled; stale command không mở lại hoặc ghi đè. T03 phải loại yêu cầu trên dòng đã bỏ/draft đã hủy khỏi tập đủ điều kiện quyết định.
- Giữ sessionStorage riêng mỗi tab và dữ liệu IndexedDB chung. Subscription Dexie đã theo dõi draft/line/request/notice; chưa gọi đó là hoàn tất demo phê duyệt hai tab.

BR-UC1-07 vẫn là nhân viên kiểm hàng trực tiếp trước khi nhập. Không có checklist kiểm định, nút Đạt/Không đạt hoặc trạng thái/bảng chất lượng mới. Công thức giá bán đầu đã duyệt giữ nguyên; T02 chưa tạo sản phẩm để áp công thức vào kho.

## Đối chiếu thiết kế

Nguồn local: [mapping SC](../FIGMA_SCREEN_MAPPING.md), CODEX `.uc-ui-matrix-qa/frame-18.png`, `frame-19.png`, `frame-21.png`, `frame-210.png`, `frame-211.png`; mô tả Design cho bỏ dòng, chọn/tạo khách và kết quả. Không đọc Figma online. Giữ sidebar/logo/font đen–be, hai vùng bảng và khách/thanh toán, popup form dùng primitive đã tinh chỉnh.

Các khác biệt/giới hạn được ghi rõ để review:

- Kích thước dùng layout desktop thích ứng đã thống nhất, không phóng nguyên tỷ lệ ảnh thiết kế khiến tràn viewport. Chưa có nghiệm thu pixel hoặc chứng nhận toàn bộ 74 SC.
- Chất lượng dùng dropdown mapping đã duyệt. Số lượng dùng input có danh sách gợi ý, cho mọi số nguyên dương trong miền schema; không tự giới hạn theo vài số mẫu trong ảnh.
- Mã draft ngẫu nhiên là ID thật, không lấy GD00242 mẫu làm mã cố định.
- Nút **Lưu** trong vùng thanh toán chưa khả dụng: hoàn tất hóa đơn/nhập kho thuộc **T05**. Mục Thu mua tạm mở màn tạo; danh sách/chi tiết hóa đơn thuộc **T06**. Không có thông báo thành công giả cho những thao tác này.
- Không thêm các menu bán hàng/hàng hóa chưa tới phase tương ứng chỉ để giống ảnh.

## Source và kiểm thử được sửa trong lượt T02

| Nhóm | File |
|---|---|
| Runtime migration / metadata | `src/db/schema.ts`, `src/db/purchase-metadata.ts` |
| Rule / service | `src/domain/purchases.ts`, `src/services/purchase-drafts.ts`, `src/services/purchase-candidate.ts` |
| Tích hợp auth, live data | `src/features/auth/context.ts`, `src/features/auth/AuthProvider.tsx`, `src/services/reference-data/local.ts` |
| Giao diện / route | `src/features/purchases/PurchaseEditor.tsx`, `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx`, `src/index.css` |
| Test migration / schema | `tests/unit/auth.test.ts`, `tests/unit/repositories.test.ts`, `tests/unit/purchase-contract.test.ts`, `tests/e2e/auth.spec.ts`, `tests/e2e/shell.spec.ts` |
| Test T02 / hồi quy layout | `tests/unit/purchase-drafts.test.ts`, `tests/e2e/purchase-drafts.spec.ts`, `tests/e2e/pagination.spec.ts` |
| Static audit | `scripts/audit-phase1.mjs` |

Audit P1-02 được sửa để nhận diện tên module/đường dẫn seed/adapter cũ, thay vì bắt chuỗi `seed` nằm giữa chữ `PurchaseEditor`. Các kiểm tra chống domain cũ, HTTP ngoài, cloud và session vẫn giữ. Test phân trang chụp đúng viewport thay full-page để tránh thao tác chụp ảnh tự kích hoạt resize và làm thay đổi trang đang đo; các assertion dữ liệu/geometry vẫn giữ và bổ sung kiểm page 1 trước gom dữ liệu.

## Kiểm thử thực thi

Kết quả cuối được ghi tại `evidence/t02/execution.json`; ảnh và hash tại `EVIDENCE_T02.json`. Không cộng các lần chạy lại thành số test duy nhất mới.

| Kiểm tra | Kết quả |
|---|---|
| Lint, typecheck | PASS, exit 0 |
| Unit/integration toàn bộ | 171/171 PASS, 9 file; bao gồm 17 test service T02 và nền G2–G5/T01 |
| Build | PASS, exit 0 |
| Static audit phase6 | 5/5 PASS, exit 0 |
| Chromium toàn bộ, lần cuối không retry | **59/59 PASS**, 0 FAIL/skip/flaky, exit 0; 3 phút, gồm 54 regression + 5 T02 |
| T03/T04 quyết định/delivery, T05 hoàn tất, T06 tra cứu, demo A–E | NOT RUN; chưa triển khai, không tính PASS |
| Manual demo do người dùng/giảng viên, pixel acceptance | NOT RUN / chờ nghiệm thu |
| CI/Pages production | NOT RUN; không commit/push/deploy |

Lần Chromium đầu 58 test có 56 pass ngay và 2 flaky sau retry: một test bắt lỗi resource do build lại dist khi preview đang chạy, một test phân trang bị ảnh full-page làm thay đổi viewport. Không coi lượt này là bằng chứng sạch. Đã chạy build trước, sửa cách chụp và bổ sung test T02 thứ năm, rồi chạy lại toàn suite với `--retries=0`. Các lỗi phát sinh khi viết test T02 (thứ tự dòng theo UUID, điều hướng ngay sau Hủy) đã được sửa bằng position ổn định và chờ điều hướng thực; không bỏ assertion hủy/lưu dữ liệu.

Kiểm thử T02 qua UI thật gồm cả hai vai trò, required/giá lỗi, không có khung giá, pending/reload/bỏ dòng/hủy, rollback ghi rồi retry, khách thật và mười dòng thật qua các trang. Fixture và lỗi ép chỉ chạy trong browser context/DB kiểm thử riêng, không ghi vào dữ liệu demo của người dùng.

Ảnh sau triển khai: [Chủ 1366×768](evidence/t02/owner-1366x768.png), [Nhân viên 1440×900](evidence/t02/staff-1440x900.png), [10 dòng phân trang 1366×768](evidence/t02/ten-lines-1366x768.png), [form validation](evidence/t02/staff-item-required.png), [popup giá sau lỗi nhập, chưa xác nhận lại](evidence/t02/staff-price-dialog.png), [khách thật/draft rỗng](evidence/t02/customer-selected-empty-draft.png). Có thêm ảnh cả hai role ở 1920×1080 trong cùng thư mục. Đã xem ảnh Chủ, Nhân viên, popup giá và bảng 10 dòng; chưa có nghiệm thu visual của người dùng.

## Mở website và demo T02

Localhost đã kiểm HTTP 200: **http://127.0.0.1:5173/50K142.03.3007/**.

Nếu server chưa mở:

```powershell
cd D:\50K142-NEW\CoCo
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

1. Đăng nhập tài khoản Chủ đã tạo. Nếu origin mới hoàn toàn thì thiết lập chủ bằng thông tin tự nhập; không có mật khẩu mặc định và không cần xóa storage.
2. Trong Khung giá thu mua tạo tổ hợp loại/brand/độ mới, ví dụ Áo / CoCo / Tốt, Min 50.000 và Max 100.000. Đây là dữ liệu tự nhập để demo, không auto-seed runtime.
3. Nếu demo nhân viên: Chủ tạo tài khoản thật trong Nhân viên; mở tab Chrome thứ hai cùng URL/origin và đăng nhập tài khoản đó. Hai phiên không ghi đè nhau.
4. Vào Thu mua → Thêm, nhập đúng tổ hợp, số lượng 1 → Xác nhận. Nhập 80.001 và xác nhận để có dòng trong khung.
5. Thêm món cùng tổ hợp giá 120.000. Quan sát thông báo vượt mức, dòng Chờ phê duyệt giá, tổng 200.001 đồng. Reload vẫn thấy dữ liệu draft theo URL đó; chưa có hóa đơn hoặc hàng kho.
6. Nhập số điện thoại khách có thật, bấm kết quả để chọn; hoặc tạo khách bằng form G4 khi chưa có. Reload kiểm tên/số điện thoại đã chọn.
7. Bỏ dòng pending, kiểm tổng còn 80.001. Hủy để đóng draft; truy cập URL cũ thấy giao dịch không còn đang tạo.

T02 chỉ chứng minh gửi/persist pending. Chủ xem rồi duyệt/từ chối, nhân viên nhận kết quả không F5 và chống hai chủ xử lý trùng sẽ triển khai/kiểm A–E đúng T03/T04/T07. Không hướng dẫn nhấn Lưu để tạo hóa đơn khi T05 chưa có.

## Gate và phần còn lại

T01 đã được người dùng nghiệm thu rõ ràng. T02 chờ review/nghiệm thu dựa trên bằng chứng; không tự đánh dấu cả G6 DONE. Task tiếp theo giữ nguyên **T03 — phê duyệt/từ chối chỉ Chủ cửa hàng**, sau đó T04 → T05 → T06 → T07. Mapping số TrangThai cho bản ghi mới và các quyết định còn thiếu trước producer tương ứng vẫn OPEN trong hợp đồng; không suy từ số legacy hoặc tự thêm quy tắc.

Branch `coco/phase-5-staff`, base HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`. Source G3–G6 và CODEX có nhiều thay đổi chưa commit từ trước; giữ nguyên, không tự đổi branch hoặc remote. Không commit/push/deploy và không thay quyền repository.
