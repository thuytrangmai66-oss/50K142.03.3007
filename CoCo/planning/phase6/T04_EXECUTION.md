# G6–T04 — kết quả phê duyệt và nhập lại giá

Ngày 12/11/2026. Triển khai theo chỉ đạo tiếp tục sau bản sửa đóng popup T03. G6 IN PROGRESS, T04 chờ review/nghiệm thu.

## Nguồn và phạm vi

Đã đối chiếu MASTER_PLAN, PLAN_PHASE_6, contract T01, báo cáo T03 và SRS local `CODEX/.uc-ui-matrix-qa/srs-text.txt`. UC1.1 nhánh 8a.1b.1 quy định từ chối quay về bước 7 nhập giá; BR-UC1-11 vẫn yêu cầu duyệt khi giá vượt Max. UI theo SC026–028 và SC218–220, đọc cả mô tả control và ảnh frame-26/27/28/220 trong CODEX. Skill Figma design-to-code được áp dụng với nguồn local theo chỉ đạo người dùng.

T04 xử lý kết quả ở người tạo và nhập lại giá của dòng đã bị từ chối. Hoàn tất hóa đơn/nhập kho tiếp tục ở T05. Các mã trạng thái số của bản ghi legacy được giữ theo contract cũ.

## Các phần đã triển khai

- [x] Đọc notice bền theo đúng nhân viên tạo yêu cầu và draft đang mở. Kiểm session/quyền tại service; xử lý alias username qua MaNV ổn định.
- [x] Dexie live query cập nhật hai tab không F5. Kết quả vẫn nhận được khi lần phát BroadcastChannel trước đó lỗi hoặc người tạo mở lại draft.
- [x] Thông báo chấp thuận, thông báo từ chối có nút Xem lý do và popup đọc lý do theo CODEX. Dòng hiển thị trạng thái đã duyệt/từ chối.
- [x] Browser Web Locks theo notice ID bảo đảm hai tab cùng người tạo chỉ mở một thông báo tại một thời điểm. Tab đóng/crash giải phóng lock; notice chưa đọc còn bền để nhận lại khi mở draft.
- [x] Khi đóng kết quả, transaction ghi delivery/readAt, deliveredAt và audit cùng nhau. Ghi lỗi giữ thông báo và cho đóng thử lại. Acknowledge lặp không nhân đôi audit hoặc quyết định.
- [x] Đóng kết quả từ chối hoặc lý do quay lại form nhập giá hiện có. Hủy form giữ dữ liệu; bấm tên sản phẩm bị từ chối mở lại form này, dùng kiểu chữ và bố cục dòng hiện có.
- [x] Nhập lại giá chỉ cho người tạo của draft editing, dòng rejected chưa bị bỏ. CAS draft, receipt/fingerprint, kiểm snapshot của yêu cầu cũ, validation giá, tổng tiền và revision khung giá hiển thị trước khi ghi.
- [x] Lần nhập lại tăng revision dòng và giữ nguyên ID, loại/brand/tình trạng/số lượng. Giá trong Max chuyển priced; giá vượt Max tạo request mới gắn revision/giá/snapshot mới. Quyết định và snapshot request cũ được giữ nguyên, không dùng để cấp phép giá mới.
- [x] Khung giá Min/Max đã thay đổi được đọc lại khi mở form. Transaction từ chối snapshot đã cũ trong thời gian nhập; snapshot đã đối chiếu mới có thể được ghi cho revision dòng mới. Đổi tổ hợp sản phẩm nằm ngoài form nhập lại giá.
- [x] Lỗi audit/ghi giá rollback toàn bộ, retry cùng operation ID giữ nhất quán. Nút Lưu hoàn tất tiếp tục thuộc T05, hiện bị chặn.

## File source và test đã sửa

- `src/services/purchase-drafts.ts`
- `src/features/purchases/PurchaseResults.tsx`
- `src/features/purchases/PurchaseEditor.tsx`
- `src/components/ui/ResultDialog.tsx`
- `src/index.css`
- `tests/unit/purchase-approvals.test.ts`
- `tests/e2e/purchase-results.spec.ts`
- `tests/e2e/purchase-helpers.ts`
- `tests/e2e/purchase-approvals.spec.ts`

Helper E2E nhập dữ liệu qua UI được dùng chung cho T03/T04. Các test mở cùng browser context/origin, login riêng theo tab, tạo nhân viên/khung giá/draft/request/decision qua form thật. Native IDB chỉ dùng làm oracle và tiêm lỗi trong context test.

## Kiểm chứng và bằng chứng

| Kiểm tra thực thi | Kết quả |
|---|---|
| Lint / typecheck / build | PASS, exit 0 |
| Unit/integration toàn bộ | 211/211 PASS, 0 FAIL |
| Chromium regression toàn bộ | 80/80 PASS, 0 FAIL, 0 SKIP, 0 flaky |
| Chromium T04 trong regression | 5/5 PASS, console error/pageerror rỗng |
| Chấp thuận/từ chối, lý do và nhập lại giá qua hai tab | PASS |
| Lỗi phát, nhận lại, đồng thời hai tab người tạo, lỗi acknowledge/ghi giá | PASS |
| Nghiệm thu người dùng và pixel toàn bộ trạng thái nền | Chờ review |

Log thực thi tại [Vitest](evidence/t04/vitest.json), [Chromium](evidence/t04/playwright.json) và [hash/source execution](evidence/t04/execution.json). Ảnh chính tại [chấp thuận](evidence/t04/staff-approval-result.png), [từ chối](evidence/t04/staff-rejection-result.png), [đọc lý do](evidence/t04/staff-read-reason.png). Thư mục bằng chứng có ảnh 1366/1440/1920 cho kết quả và lý do; ảnh chủ nằm trong log regression T03 cùng lượt chạy.

Unit/integration bổ sung quyền recipient, acknowledge một lần và rollback, nhập lại trong/vượt Max, replay/stale, bảo toàn lịch sử, khung giá cũ/mới, draft hủy/dòng bỏ. Các regression nền G2–G5 được chạy lại.

Chromium T04 gồm chấp thuận và nhận kết quả không F5; từ chối/Xem lý do/đọc readonly/nhập lại giá 80.000 hoặc 130.000; duyệt lại request mới; mất tín hiệu và hai tab cùng người tạo; audit acknowledge lỗi, Hủy và mở lại form, ghi giá lỗi/rollback/retry. Các test theo dõi console error và pageerror. Kiểm tra nút đóng popup trong viewport 1366×768, 1440×900, 1920×1080 và chụp ảnh.

Đối chiếu trực quan popup với ảnh local được thực hiện. Nền phía sau popup trong bằng chứng là editor đang hoạt động hiện tại. Ảnh CODEX minh họa kết quả trên form thông tin sản phẩm; chưa nghiệm thu pixel toàn bộ trạng thái nền lồng form này. Tiếp tục review UI với người dùng, không dùng PASS chức năng để chứng nhận pixel toàn bộ màn hình.

## Demo cho giảng viên

1. Mở hai tab cùng http://127.0.0.1:5173/50K142.03.3007/ . Tab chủ đăng nhập chủ, tạo tài khoản nhân viên và khung giá thật với Min 50.000, Max 100.000.
2. Tab nhân viên đăng nhập nhân viên, vào Thu mua → Tạo giao dịch → Thêm. Nhập đúng loại/brand/độ mới trong khung giá, số lượng 1, đề xuất 120.000 và Xác nhận. Đóng thông báo cần phê duyệt.
3. Tab chủ vào Phê duyệt, chọn request và Phê duyệt. Đóng thông báo của chủ, danh sách hiện Đã phê duyệt. Tab nhân viên nhận thông báo chấp thuận không F5, đóng thông báo để tiếp tục.
4. Tạo một dòng/yêu cầu mới để demo từ chối. Chủ nhập lý do rồi xác nhận. Nhân viên nhấn Xem lý do, đọc nội dung, đóng popup và nhập giá mới.
5. Nhập 80.000 để nhận mức giá trong khung. Nhập 130.000 ở một lần demo khác để tạo request mới, chủ xử lý tiếp. Request cũ vẫn có quyết định/lý do ban đầu.

Khi cần khởi chạy, vào `D:\50K142-NEW\CoCo` và chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5173`. Giữ cùng URL/origin để dùng chung IndexedDB.

## Việc còn lại

T04 chờ review/nghiệm thu. T05 tiếp tục command hoàn tất hóa đơn, chi tiết và từng món trong transaction, còn phải đối chiếu mapping số trạng thái cho dữ liệu mới theo DATA_CONTRACT_REVIEW. T06 tra cứu hoàn chỉnh và T07 nghiệm thu G6 vẫn theo roadmap. Các chỉnh sửa loại/brand/số lượng ngoài luồng nhập lại giá sau từ chối chưa được mở rộng trong T04.
