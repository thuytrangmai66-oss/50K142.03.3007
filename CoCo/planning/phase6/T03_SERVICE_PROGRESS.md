# G6–T03 — giao diện và xử lý phê duyệt

> Bản sửa theo phản hồi tiếp theo đã đóng toàn bộ luồng popup sau khi duyệt/từ chối thành công. Chromium hiện 75/75 PASS, gồm 10 ca T03; unit/integration 202/202 PASS. [Báo cáo sửa lỗi đóng popup](APPROVAL_POPUP_CLOSE_FIX.md). Các số kiểm thử phía dưới thuộc lượt T03 trước phản hồi này.

## Cập nhật triển khai ngày 12/11/2026

Đã hoàn thiện các phần UI và tích hợp còn thiếu của T03. Trạng thái kiểm thử cuối được ghi ở `evidence/t03-ui/playwright.json` và `evidence/t03-ui/vitest.json`. T03 chờ review/nghiệm thu, G6 tiếp tục IN PROGRESS. Nội dung service-only phía dưới thuộc mốc trước lượt triển khai này.

### Chức năng đã triển khai

- [x] Menu và route `/approvals`, `/approvals/:approvalId` chỉ cho Chủ cửa hàng, kiểm quyền lại tại service.
- [x] Danh sách bốn cột theo SC130, tìm tên nhân viên khi nhập và lọc ngày gửi theo giờ Việt Nam. Phân trang thật dùng component chung và số dòng thích ứng viewport.
- [x] SC131/132 cho danh sách rỗng và lỗi truy cập. Bấm dòng hoặc nút mã yêu cầu mở chi tiết.
- [x] SC133 hiển thị snapshot sản phẩm, số lượng, khung giá Min/Max và giá đề xuất. Giữ riêng bố cục chi tiết và popup nhập lý do theo CODEX.
- [x] SC134–144 cho duyệt, từ chối, lý do bắt buộc, hủy, yêu cầu hết điều kiện, lỗi lưu và lỗi phát kết quả. Lý do tối đa 100 ký tự theo schema hiện có.
- [x] Command ID giữ ổn định khi thử lại thao tác ghi lỗi, chặn click lặp, CAS hai chủ và quyền owner. Quyết định, trạng thái dòng, notice bền, audit và receipt ghi trong cùng transaction.
- [x] Phát tín hiệu BroadcastChannel sau commit. Lỗi phát giữ quyết định đã lưu và báo đúng nội dung. Mở lại yêu cầu đã xử lý thử phát lại tín hiệu, giữ nguyên quyết định và notice.
- [x] Cho phép thêm sản phẩm vào draft có dòng đã duyệt/từ chối khi dữ liệu lịch sử được giữ nguyên. Dòng/request mới vẫn chịu validation pending/priced và snapshot như trước.

### Nguồn thiết kế và phạm vi kiểm chứng

Đã đọc SC130–144 và đối chiếu trực tiếp ảnh local `CODEX/.uc-ui-matrix-qa/frame-130.png`, `frame-132.png`, `frame-133.png`, `frame-138.png` với screenshot Chromium. Chi tiết dùng chiều rộng 1011px, popup lý do 692px theo tỷ lệ khung local quy về canvas 1440px. Header lý do nền kem, textarea, nút Hủy/Xác nhận và trạng thái Từ chối khi mở dialog theo ảnh nguồn. Màu/font và component thông báo được tái sử dụng từ UI đã có.

Đã kiểm tra chi tiết ở 1366×768, 1440×900 và 1920×1080. Đây là đối chiếu ảnh trực quan và kiểm tra chức năng/layout. Nghiệm thu pixel toàn bộ SC130–144 bởi người dùng còn chờ review. Các module thuộc phase sau vẫn theo dependency đã duyệt.

### File source và test trong lượt này

- `src/features/approvals/ApprovalsPage.tsx`
- `src/services/purchase-approvals.ts`
- `src/services/purchase-candidate.ts`
- `src/features/auth/AuthProvider.tsx`, `src/features/auth/context.ts`
- `src/app/router.tsx`, `src/components/layout/CoCoLayout.tsx`
- `src/components/ui/FormDialog.tsx`, `src/components/ui/ResultDialog.tsx`
- `src/index.css`
- `tests/unit/purchase-approvals.test.ts`, `tests/e2e/purchase-approvals.spec.ts`

### Các trường hợp kiểm thử

| Kiểm tra | Kết quả thực thi |
|---|---|
| Lint | PASS, exit 0 |
| Typecheck | PASS, exit 0; build cũng thực hiện `tsc --noEmit` |
| Unit/integration toàn bộ | 202/202 PASS, 0 FAIL; gồm 30 test approval service |
| Chromium regression toàn bộ | 73/73 PASS, 0 FAIL, 0 SKIP, 0 flaky |
| Chromium T03 | 8/8 PASS trong regression; chạy lại riêng 8/8 PASS khi chụp ảnh không focus ô nhập, console error/pageerror đều rỗng |
| Demo A/B hoàn chỉnh với popup kết quả/lý do ở nhân viên | NOT RUN, tiếp tục T04/T07 |
| Nghiệm thu người dùng T03/G6 | Chờ review |

Regression từng phát hiện badge mã draft trong editor rộng lệch 2,546875px với một số mã ngẫu nhiên. Đã giữ chiều rộng thiết kế 145px theo tỷ lệ canvas và điều chỉnh padding để mã chín ký tự vừa thẻ. Giữ nguyên mã và cách sinh dữ liệu. Lượt trước sửa có 72 PASS/1 FAIL được giữ tại `evidence/t03-ui/playwright-before-badge-fix.json`, lượt chạy lại toàn bộ đã đạt 73/73 PASS.

Log và hash source/test được lưu tại [execution.json](evidence/t03-ui/execution.json), [Vitest](evidence/t03-ui/vitest.json), [Chromium regression](evidence/t03-ui/playwright.json) và [Chromium T03 chạy lại](evidence/t03-ui/playwright-approvals.json). Trạng thái task **READY FOR REVIEW**, chưa có xác nhận nghiệm thu người dùng.

Unit/integration kiểm quyền, validation, snapshot giá/số lượng/khung giá, CAS, thao tác trùng, rollback audit, draft có lịch sử duyệt/từ chối, tìm tên và ngày Việt Nam. Chromium tạo khung giá, nhân viên, draft, sản phẩm và yêu cầu qua UI thật trong context test riêng.

Chromium kiểm duyệt, từ chối, lý do rỗng/quá dài, hủy, ghi lỗi/thử lại, lỗi phát sau commit ở cả hai nhánh, mở lại không tạo quyết định/notice trùng, dòng bỏ, draft hủy, hai chủ cùng xử lý, staff bị chặn route, tìm/lọc và 12 yêu cầu thật qua phân trang. Mỗi test T03 theo dõi console error/pageerror ở các tab.

Ảnh đã lưu tại [danh sách](evidence/t03-ui/owner-list.png), [chi tiết 1440×900](evidence/t03-ui/owner-detail-1440.png), [chi tiết 1366×768](evidence/t03-ui/owner-detail-1366.png), [chi tiết 1920×1080](evidence/t03-ui/owner-detail-1920.png), [nhập lý do](evidence/t03-ui/owner-rejection-reason.png), [kết quả từ chối](evidence/t03-ui/owner-rejected.png), [tab nhân viên sau quyết định](evidence/t03-ui/staff-live-approved.png) và [trang 2](evidence/t03-ui/owner-list-page-2.png).

### Giới hạn và việc kế tiếp

Notice vẫn ở `delivery=pending` đến khi recipient consumer của T04 xác nhận nhận kết quả. Live query đã cập nhật dữ liệu chung và bỏ nhãn chờ khi quyết định được ghi. Popup kết quả/lý do cho nhân viên, thử phát lại khi recipient quay lại và sửa giá sau từ chối còn thuộc T04. Demo A/B đầy đủ và nghiệm thu A–F tiếp tục ở T04/T07. Hoàn tất hóa đơn/nhập kho thuộc T05.

Mở website tại http://127.0.0.1:5173/50K142.03.3007/ , HTTP 200 đã kiểm. Khi cần khởi chạy lại, vào `D:\50K142-NEW\CoCo`, chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5173`.

Để review T03, chủ tạo nhân viên và khung giá hợp lệ, tab nhân viên vào Thu mua → Tạo giao dịch → Thêm → nhập giá vượt Max. Tab chủ vào Phê duyệt, tìm nhân viên/ngày gửi, mở yêu cầu rồi Phê duyệt hoặc Từ chối kèm lý do. Dùng một yêu cầu mới cho nhánh còn lại. Hai tab cùng origin, đăng nhập riêng.

Nhánh `coco/phase-5-staff`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`. Các thay đổi hiện có trong working tree được giữ lại. Dữ liệu kiểm thử nằm trong context/DB riêng.

## Lịch sử mốc service-only trước triển khai UI

Ngày 12/11/2026. Theo chỉ đạo tiếp tục công việc trong plan, task kế tiếp là T03 trong G6, chưa chuyển G7. **IN PROGRESS / PARTIAL**, chưa nghiệm thu T03/G6. Không suy ra nghiệm thu G5/T02 từ việc chạy test.

## Đã thực hiện

- Rà MASTER_PLAN_COCO, PHASE_ROADMAP, plan/checklist G6 và source hiện tại. T01 đã được nghiệm thu, T02 có UI thực; T03 mới có service và UI chuẩn bị, chưa có route hoạt động.
- Đối chiếu CODEX local SC130/SC131: danh sách chuẩn gồm Mã yêu cầu / Nhân viên thực hiện / Trạng thái / Thời gian, tìm theo tên nhân viên và ngày gửi. UI chuẩn bị hiện dùng sáu cột và bộ lọc status/draft; chưa được coi là khớp Figma hoặc mở runtime.
- `src/services/purchase-approvals.ts`: kiểm eligibility và quyết định bằng `approvalMatchesLine` để bind đầy đủ ID, revision, giá, số lượng, snapshot bracket; dòng/draft phải còn hợp lệ, request và dòng phải pending. Chặn snapshot khác trước ghi, trả CONFLICT thay vì hiển thị đủ điều kiện rồi lỗi cuối transaction.
- Kiểm action chỉ approve/reject, revision nguyên dương an toàn và mã thao tác hợp lệ trước ghi. Giữ nguyên quyền owner, CAS, receipt/fingerprint, event bền và audit cùng transaction hiện có; không đổi mã legacy.
- `src/features/approvals/ApprovalsPage.tsx`: bỏ fallback revision=1 qua cast; dùng `approvalRevision` thực do service trả về. Không thêm route/provider/menu hoạt động trong lượt này.
- `tests/unit/purchase-approvals.test.ts`: thêm bảy case về snapshot giá/số lượng/bracket bị đổi và command sai; kiểm decision/line/event/audit/receipt không bị ghi ngoài ý muốn. Fixture lỗi chỉ nằm trong DB test riêng.

## Kiểm thử

- Lint và typecheck: PASS.
- Toàn bộ unit/integration: **199/199 PASS**, JSON tại `evidence/t03-service/vitest.json`; gồm 27 test approval service và regression nền hiện có.
- Build: PASS, exit 0; không dùng unit PASS thay cho build.
- E2E UI phê duyệt, demo hai tab A–E, screenshot UI approval: **NOT RUN**, chưa có giao diện đúng nguồn được nối route.

## Còn phải thực hiện trong T03

1. Hoàn thiện danh sách/chi tiết/reason dialog theo SC130–144 và BR-UC6; giữ bộ lọc, cột, trạng thái và popup đúng CODEX, không dùng UI chuẩn bị sai làm bản hoàn thành.
2. Nối owner-only route/service; dùng command ID ổn định qua retry. Phân biệt lỗi lưu quyết định với lỗi phát kết quả sau commit theo contract; không tự thêm nút khác nguồn.
3. Chromium qua UI thật cho approve/reject/lý do rỗng/hủy, staff bị chặn, stale/two-owner race, dòng bỏ/draft hủy, ghi lỗi và chống trùng. Đối chiếu ảnh, chạy regression và cập nhật nghiệm thu.
4. Sau T03 còn T04 thông báo/đổi giá sau từ chối, T05 finalize, T06 đầy đủ tra cứu và T07 demo/nghiệm thu; không coi service PASS là hoàn tất G6.

Không sửa schema hoặc dữ liệu người dùng; không Supabase, không commit/push/deploy. Các tinh chỉnh Figma editor và divider danh sách giữ nguyên.
