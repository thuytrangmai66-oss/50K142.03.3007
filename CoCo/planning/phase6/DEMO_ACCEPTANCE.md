# Nghiệm thu demo hai tab — Giai đoạn 6

> T07 ngày 12/11/2026: gói kiểm chứng tại [T07_EXECUTION.md](T07_EXECUTION.md), bảng từng UC/BR tại [G6_ACCEPTANCE_MATRIX.md](G6_ACCEPTANCE_MATRIX.md). **T05/T06/T07/G6 PENDING REVIEW**: BR-UC1-16 còn hai trường UI BLOCKED; dependency audit FAIL. Không tự DONE hoặc chuyển G7. Các mốc IN PROGRESS/NOT RUN phía dưới là lịch sử trước T07.

## T07 — kết quả QA hiện hành

| Demo | Kết quả lần chạy cuối | Bằng chứng |
|---|---|---|
| A — phê duyệt | PASS QA | T03/T04/T05 và luồng runtime T07 hai tab |
| B — từ chối | PASS QA | Lý do bắt buộc, kết quả đúng, pending/rejected chặn Lưu, nhập lại giá T03–T05 |
| C — phiên độc lập | PASS QA | Auth/G5/T03/T07 cùng context, hai token/role riêng |
| D — đồng bộ không F5 | PASS QA | Request/decision/notice T03/T04; invoice mới đến danh sách chủ T07 |
| E — chống lặp/quyền | PASS QA | CAS/replay/race/rollback, owner-only và đóng luồng popup |
| F — regression | PASS QA lần cuối | 249 unit/integration +95 Chromium, 0 FAIL/SKIP cuối; lưu cả lỗi và lượt kiểm lại |

Đây là kiểm chứng tự động, **chưa là nghiệm thu người dùng**. Hai trường UI BR-UC1-16 BLOCKED và dependency audit FAIL13 package findings; giữ G6 PENDING REVIEW. Test PASS không đóng các gate này. [Bảng nghiệm thu](G6_ACCEPTANCE_MATRIX.md), [lệnh, ảnh và ngoại lệ](T07_EXECUTION.md).

## Các mốc trước T07 — lịch sử

### Tiến độ sau T05

Luồng demo nay có thể tiếp tục từ quyết định T03/T04 tới Lưu thật, cấp hóa đơn/mã từng món và kiểm tồn kho/cost/snapshot trong cùng transaction. [Báo cáo T05](T05_EXECUTION.md) có UI hai vai trò, rollback/retry/hai tab/reload, 233 Vitest + 88 Chromium PASS và ảnh ba viewport. T06/T07 tiếp tục kiểm tra tra cứu đầy đủ và nghiệm thu G6 tổng thể.

## Tiến độ T04

Các bước demo A/B nay đã thực thi qua UI thật đến kết quả/lý do phía nhân viên và nhập lại giá. C/D được kiểm bằng session riêng và live data; E bằng owner CAS, receipt và browser lock khi nhận notice; F có regression 211 unit/integration + 80 Chromium PASS. [Ảnh, hướng dẫn và kết quả T04](T04_EXECUTION.md). Full nghiệm thu G6/T07 tiếp tục sau T05/T06, pixel trạng thái nền popup còn chờ review. Những mục NOT RUN bên dưới là checklist lịch sử trước T04.

## Tiến độ T03 ngày 12/11/2026

Đã chạy qua UI thật các bước nhân viên gửi → chủ thấy không F5 → chủ duyệt/từ chối. Hai tab giữ session riêng, dòng shared data tự thay đổi, CAS hai chủ và chống xử lý trùng có kiểm chứng. Notice đang pending, popup kết quả/lý do cho nhân viên và sửa giá sau từ chối còn T04. A/B đầy đủ chưa hoàn tất. [Báo cáo T03 và kết quả regression](T03_SERVICE_PROGRESS.md). Các trạng thái NOT RUN bên dưới là baseline trước T03, tiếp tục dùng làm checklist cho T04/T07.

Yêu cầu chốt ngày 11/11/2026. **NOT IMPLEMENTED / NOT RUN** cho luồng thu mua/phê duyệt; tài liệu này bổ sung test vào G6, không tạo phase mới hoặc làm sai dependency G4/G5.

## Tiền đề và cơ chế

- Một Chrome context/origin, hai tab; cùng CoCoDB IndexedDB, không tách dữ liệu theo role. Dùng hai tài khoản hợp lệ đã tạo qua UI G5, capability sessionStorage riêng theo tab; không hardcode owner/staff credential.
- UI nhập dữ liệu thật theo SRS, bracket dùng danh mục 3=Mới/2=Tốt/1=Khá. Khách/bracket qua G4; xử lý draft/FK, mixed-price lines, finalized snapshot theo quyết định P03/P04/P05 trước task phụ thuộc, không tạo invoice hoàn tất giả.
- Dùng Dexie liveQuery hoặc thông báo thay đổi tương đương để request/status/notification tự cập nhật. Không F5 trong test D. Permission phải kiểm trong service và cùng transaction với CAS/status transition, không chỉ menu.
- Một quyết định pending → approved/rejected hợp lệ chỉ ghi một lần; transaction gồm request/decision actor/time/reason/notification/audit/receipt. Reason và điều kiện phê duyệt theo SRS UC6; không tự nới quyền chủ/staff.
- Notification trong transaction là bản ghi bền chờ phát, không phải bằng chứng tab nhận đã hiển thị. Phát kết quả sau commit có thể lỗi theo UC6 bước 9a/SC137/SC144: giữ quyết định đã lưu, hiển thị “Kết quả phê duyệt chưa được gửi đi”, cho thử phát lại cùng event không tạo quyết định/thông báo trùng. Nếu bản thân transaction lưu quyết định/event thất bại thì rollback toàn bộ, báo lỗi lưu tương ứng.
- Mỗi quyết định gắn đúng lineId/phiên bản dòng/giá/số lượng/khung giá snapshot. Thay dòng không được tái sử dụng phê duyệt cũ; test này nằm trong T02/T04/T07, không thêm task nghiệp vụ mới.

## A–F bắt buộc thực thi

| ID | Các bước UI thật | Oracle và trạng thái hiện tại |
|---|---|---|
| TC-G6-DEMO-A | Staff nhập thu mua hợp lệ, giá cần phê duyệt → gửi → chủ thấy request/chi tiết → chủ phê duyệt → staff xem kết quả | Cùng request ID, đúng trạng thái/actor/time, thông báo và data nhất quán; không request ghi bằng API test thay UI. **NOT RUN** |
| TC-G6-DEMO-B | Staff gửi request mới → chủ từ chối đúng điều kiện/lý do → staff xem trạng thái và lý do | Reason giữ nguyên, không ghi nhận hoàn tất/nhập kho sai; pending/rejected được xử lý lại theo SRS. **NOT RUN** |
| TC-G6-DEMO-C | Hai tab login staff/owner; thao tác và logout một phiên | Username/role/token riêng, không ghi đè session. Nền G3/G4/G5 **PASS**, G5 tạo staff qua UI thật; phải chạy lại trên UI G6 |
| TC-G6-DEMO-D | Hai tab đang ở danh sách/chi tiết request; gửi và quyết định ở tab khác, không reload | Tab nhận thay đổi tự cập nhật đúng data/status. Shared customer live data G4 **PASS**; request/approval **NOT RUN** |
| TC-G6-DEMO-E | Double submit, click lại quyết định cũ, hai tab chủ cùng quyết định; staff thử route/service owner-only | Một quyết định hợp lệ/notification/audit; stale/replay không đổi trạng thái lần hai; staff bị từ chối. **NOT RUN** |
| TC-G6-DEMO-F | Full data/auth/reference regression và tích hợp G5/G6, migration/rollback | G2/G3/G4/G5 tái chạy **101 Vitest + 52 Chromium PASS**, xem [review G5](../phase5/REVIEW_COMPLETION.md); phần tích hợp G6 **NOT RUN** |

Test dự kiến `tests/e2e/purchase-approval.spec.ts` dùng `context.newPage()` với cùng browser context để chia sẻ IDB, login và click/form/dialog thật. Fixture chỉ chuẩn bị dữ liệu phụ trợ trong context test; request và quyết định mục tiêu phải đi qua UI. Không dùng hai browser context tách dữ liệu để chứng minh shared DB; không gọi hàm lưu DB thay hành vi cần nghiệm thu.

Ca phụ bắt buộc cho A/B/E: tiêm lỗi phát thông báo sau khi decision đã commit, kiểm đúng thông báo lỗi/actor/reason/version, phát lại rồi staff nhận kết quả không F5, số quyết định và bản ghi thông báo không tăng lần hai. Chạy cả nhánh phê duyệt và từ chối; các ca này hiện **NOT RUN**. Thêm test chủ tạo yêu cầu vượt Max theo cùng BR-UC1-11, không tự bỏ qua luồng duyệt.

Phục hồi delivery qua cơ chế kỹ thuật khi mở lại màn hình/đăng ký lại subscription; test đóng popup X và điều hướng thật, không gọi lại thao tác quyết định. Không tự thêm nút Retry vào SC137/SC144 vốn chỉ có X trong CODEX.

## Bằng chứng cần bàn giao G6

Source/test list, SHA/branch, lệnh và exit code, từng A–F PASS/FAIL/NOT RUN; screenshot cả hai vai trò trước/sau quyết định; trace nếu lỗi; request ID/version, decision/audit/notification count; localhost và hướng dẫn demo cho giảng viên. Chạy regression sau mỗi sửa lỗi, không báo PASS nếu chưa thực thi.

Phân quyền frontend/local chỉ phục vụ đồ án demo, không ngang bảo mật backend. Không Supabase, không đồng bộ đa máy, không xóa DB, không push main hoặc production deploy nếu chưa được cho phép.
