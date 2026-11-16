# Thu mua — sửa lỗi reference phê duyệt

16/11/2026, nền `c87c957`, nhánh `main` khớp origin trước sửa. **LOCAL FIX VERIFIED; CLOUD APPLICATION PENDING**. Người dùng duyệt: “Duyệt bản vá hàm SQL và kiểm thử local”. Không áp dụng Supabase thật, commit, push hoặc deploy.

## Nguyên nhân và bản vá

`supabase/migration_all.sql:351`, hàm `coco_purchase_write`, nhánh `commit` kiểm mọi dòng `pending` phải có request khớp. Hàm khai báo biến PL/pgSQL `ap` và `#variable_conflict use_variable`, nhưng subquery cũng dùng alias `ap`. Tham chiếu `ap` được hiểu là biến vòng lặp (request cuối cùng), không phải phần tử JSON hiện tại. Một dòng pending có thể qua; hai dòng pending hợp lệ bị từ chối khi kiểm dòng không khớp request cuối.

Đã tái hiện bằng chính SQL trong repository trên PostgreSQL/PGlite: **11 PASS / 1 FAIL** trước vá, đúng thông báo `P0001 REFERENCE: Thiếu yêu cầu phê duyệt`. Đây là lỗi SQL thực, không kết luận flaky hay lỗi async frontend. Chưa truy xuất definition hàm đang cài trên project thật; không khẳng định mọi tình huống production đều có cùng nguyên nhân. Bộ baseline lưu riêng, không tính FAIL này thành PASS.

Bản vá `supabase/patches/20261116_purchase_reference.sql` đổi đúng subquery:

```sql
from jsonb_array_elements(c->'approvals') as requested(candidate)
where requested.candidate->>'id'=l->>'approvalId'
  and public.coco_approval_matches(requested.candidate,l)
```

Script lấy definition hiện đang cài, chỉ thay đúng câu lệnh đã review, chạy trong transaction; tự dừng nếu không còn đúng câu đó, và chạy lại an toàn khi đã vá. Không chạy lại migration tổng; `migration_all.sql` giữ nguyên. Database mới sau migration gốc cũng phải áp dụng bản vá riêng sau khi được cho phép. Kiểm thử chứng minh bảng/constraint/RLS, ACL/security/search_path của hàm và sentinel dữ liệu cũ không đổi. Không thêm schema/column/policy hoặc sửa dữ liệu legacy để né lỗi.

## Hợp đồng nghiệp vụ giữ nguyên

Đã đọc UC_1.1/UC_6 trong `CODEX/.uc-ui-matrix-qa/usecases.json`, BR-UC1-08/11 và BR-UC6-01..06 trong traceability; đối chiếu hợp đồng Design/P03/P04 tại G6 `DATA_CONTRACT_REVIEW.md`, `T01_REVIEW_GATE.md`, `T02_EXECUTION.md`, `T03_SERVICE_PROGRESS.md` và liên kết FK/RPC hiện tại. T01/P03/P04 đã có phê duyệt runtime; không diễn giải lại legacy.

- Khi xác nhận giá **> Max**, `prepareAdd` tạo line ID, approval ID `Y` + random và request `pending`, ràng buộc draft/line/revision/giá/số lượng/snapshot khung giá. Chỉ `commit` RPC mới lưu draft + line + request nguyên tử. Prepare không tạo request giả trong DB, không tạo hóa đơn hay khách giả.
- Giá bằng Max, hoặc giá dương dưới Min theo quyết định G6, giữ `priced`, không thêm request. Không đổi giá người dùng.
- Owner chỉ quyết định request pending đúng snapshot. Request từ chối giữ lịch sử; sửa giá dùng revision mới. Finalize vẫn chặn giá chưa được duyệt; receipt/idempotency/CAS/row lock/advisory transaction giữ nguyên.
- Unit cloud mới chứng minh command thứ hai gửi đủ cả hai request đúng snapshot trong **một RPC**; retry giữ nguyên operation ID/payload. Không thêm các lệnh ghi frontend rời rạc hoặc workaround sắp xếp request.

## UI và ngoại lệ

Đã xem CODEX frame 21–25, 35–36: thông tin khung giá, lỗi giá inline, thông báo vượt khung và chặn finalize. Giữ component/layout/CSS, các lời nhắc nghiệp vụ và dữ liệu thật. Không dùng ảnh Figma làm dữ liệu.

`PurchaseEditor.tsx`: lỗi dữ liệu/SQL không còn lộ `REFERENCE:` hay raw SQL; dùng fallback **đã có** “Không thể lưu thông tin sản phẩm”. Đây là fallback hệ thống, không phải lời nhắc chờ phê duyệt và không tuyên bố là câu SRS dành riêng cho lỗi reference (nguồn không định nghĩa câu đó). Lỗi trường vẫn inline; quyền/offline giữ thông báo đã dịch. Không mở ResultDialog chồng FormDialog: giữ toàn bộ input/match/command trong state, chỉ mount một dialog; đóng lỗi khôi phục form, không mất giá. Không báo đã gửi duyệt nếu RPC thất bại.

Ảnh Chromium 1440×900, DPR 1/zoom 100%, transport cloud giả lập:

- [Thông báo an toàn, một dialog](evidence/purchase-reference-error.png).
- [Đóng lỗi, giữ giá và khung giá](evidence/purchase-reference-form-retained.png).

Đã xem cả hai ảnh; không thay baseline/ngưỡng visual, không mở lại các sai khác thẩm mỹ ngoài phạm vi.

## Kiểm thử thực thi

| Nhóm/lệnh | Kết quả | Phạm vi |
|---|---|---|
| `npm.cmd run lint` | PASS | Source/tests |
| `npm.cmd run typecheck` | PASS | TypeScript |
| `npm.cmd run build` | PASS | Cả cấu hình cloud và local cho Chromium; cảnh báo Zod/chunk lớn có trước |
| Unit/integration: cloud-purchase-reference, cloud-services, purchase-drafts, purchase-candidate, purchase-approvals, purchase-finalization | **133 PASS / 0 FAIL**, 86,14s | Chuẩn bị/link request, retry và regression transaction/quyền/finalize |
| Chromium `cloud-runtime.spec.ts --grep 'purchase reference failure'` | **1 PASS / 0 FAIL**, 3,9s | SDK/UI thật, HTTP/Auth/Realtime giả lập: lỗi reference, giữ giá, chỉ một dialog, offline, double submit/retry, reload |
| Chromium purchase-drafts, purchase-approvals, purchase-results, purchase-finalization | **28 PASS / 0 FAIL**, 1,4 phút | IndexedDB native riêng: hai vai trò/tab, approve/reject/race, kết quả live, lỗi ghi/rollback, finalize/reload |
| `node supabase/tests/purchase-reference.mjs --baseline` | **11 PASS / 1 FAIL** | SQL gốc: ca hai dòng pending tái hiện lỗi, có bằng chứng FAIL |
| `node supabase/tests/purchase-reference.mjs` | **17 PASS / 0 FAIL** | PostgreSQL + patch: nhiều pending/thứ tự request/lịch sử approved/rejected, thiếu/sai link/giá/revision/bracket, rollback/replay, staff bị chặn, pending không finalize, chống quyết định cũ; patch lặp và guard definition khác |

SQL chạy PostgreSQL WASM/PGlite, shim Auth/roles; không gọi project thật. [Baseline](evidence/purchase-reference-sql-baseline.json), [sau vá](evidence/purchase-reference-sql.json). Không cộng bài Chromium transport giả lập thành bằng chứng PostgreSQL production. Không chạy lại full suite ngoài module.

## File thay đổi

- `src/features/purchases/PurchaseEditor.tsx` — thông báo an toàn, một dialog, giữ state.
- `supabase/patches/20261116_purchase_reference.sql` — bản vá riêng một câu truy vấn của hàm.
- `supabase/tests/purchase-reference.mjs`, `supabase/tests/README.md` — kiểm chứng SQL/baseline/hướng dẫn.
- `tests/unit/cloud-purchase-reference.test.ts`, `tests/e2e/cloud-runtime.spec.ts` — kiểm linkage payload và UI lỗi/retry.
- Báo cáo này và `evidence/` — ảnh, JSON kết quả/hash.

## Còn chờ

**NOT RUN / PENDING:** áp dụng patch lên Supabase thật; so sánh definition thực tế nếu guard báo khác; chạy hai máy độc lập với hai kết nối PostgreSQL và Realtime thật, lỗi mạng giữa transaction/commit trên cloud. Race native hai tab PASS không thay thế các mục đó. Frontend chưa deploy. Bản vá local chưa có hiệu lực trên website đang dùng: cần phê duyệt riêng việc áp dụng SQL/deploy, không dùng quyền kiểm thử local để tự ghi production.

Không sửa schema, constraint, RLS, giá hoặc lịch sử; không sửa source Supabase tổng, dependency, workflow hay trạng thái nghiệm thu phase.
