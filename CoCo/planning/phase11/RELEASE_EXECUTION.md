# G11-T02 — Release execution

Ngày 14/11/2026. **PO APPROVED RELEASE / RELEASE BLOCKED — local Chromium preflight FAIL.** Không tạo release commit, push hoặc deploy. Quyền release và các ngoại lệ PO giữ nguyên; chúng không cho phép bỏ gate kiểm thử thất bại.

## Phạm vi và quyết định PO

PO cho phép release phiên bản hiện tại, giữ nguyên code, nghiệp vụ, schema và test. Không phát triển thêm chức năng, sửa tồn đọng đã chấp nhận, nới assertion hoặc bỏ CI. G9 đã nghiệm thu; G10 chưa được chứng nhận đầy đủ. G11-T04 rollback/roll-forward và T05 nghiệm thu bàn giao chưa được coi hoàn thành từ lượt T02/T03.

| Known issue | Quyết định release | Rủi ro giữ nguyên |
|---|---|---|
| G10-A01 | ACCEPTED FOR RELEASE / DEFERRED | Mâu thuẫn SRS/Figma, thông tin Nhân viên/Trạng thái trên chi tiết còn thiếu; chưa sửa UI/SRS. |
| G10-A02 | ACCEPTED FOR RELEASE / DEFERRED | Phím tắt/mức giá nhanh chưa chốt hoặc kiểm chứng đủ. |
| G10-A03 | ACCEPTED FOR RELEASE / DEFERRED | Đã có số đo nhưng chưa có SLA được phê duyệt để kết luận NFR hiệu năng đạt. |
| G10-A04 | ACCEPTED FOR RELEASE / DEFERRED | Visual/action coverage chưa hoàn chỉnh; SC105/8 modal PASS không chứng nhận 297 SC. |
| G10-A05 | ACCEPTED FOR RELEASE / DEFERRED | Traceability mọi nhánh UC/control chưa khép; tổng test không thay chứng nhận coverage. |
| G10-A06 | ACCEPTED FOR RELEASE / DEFERRED | 7 moderate dependency vulnerabilities trong nhóm công cụ lint còn tồn tại; không tuyên bố audit sạch. |
| G10-A07 | ACCEPTED FOR RELEASE / DEFERRED | Chưa kiểm thử barcode/cảm ứng trên thiết bị vật lý; Chromium mô phỏng không thay hardware PASS. |

## G11-T01 — Checkpoint Git và an toàn dữ liệu

- Git root `D:\50K142-NEW`, app `CoCo/`, nhánh `main`, remote `https://github.com/thuytrangmai66-oss/50K142.03.3007.git`.
- Khi bắt đầu T02, HEAD/origin/main cùng `1fd4ad4a04e3b870a1c673fd7abd344af50dea69`, 0 ahead/behind; 326 file đã stage, 0 unstaged/untracked không bị ignore. Reflog đã có thao tác đưa main về origin/main trước lượt này; không reset lại.
- Commit cũ `035a16ba7be5cf7096641906e4259afe4f09c6e4` còn tồn tại local và chứa 1.162 file CODEX. Commit này không thuộc lịch sử main chuẩn bị push.
- Đã tạo hai ref **chỉ local** `refs/coco-local-backup/2026-11-14T15-30-53-634Z/{original-035a16b,prepared-index}`; snapshot index tree `47e862d21191727fa6ec2096d2610d5655895498`. Không push các ref này.
- Bản khôi phục tại `.git/coco-release-recovery/2026-11-14T15-30-53-634Z/`: index gốc, manifest SHA-256 working tree và toàn bộ CODEX cùng bản sao. **1.162 file / 579.440.653 byte**, đối chiếu bản sao theo SHA-256 giống hệt. Bảo toàn refactor pure-business-rules và tài liệu test-suite-audit trong candidate.
- Root `.gitignore` đổi từ `CODEX/` sang đúng `/CODEX/`. CODEX không nằm trong index; kiểm tra lại toàn bộ lịch sử mới trước push, không chỉ dựa vào ignore.
- Scan candidate ban đầu: không có CODEX, node_modules, dist, `.env`, DB/backup/archive riêng; không thấy mẫu private key/GitHub token/service-role. Ảnh nguồn riêng chỉ có baseline SC105 đã được PO duyệt; các ảnh runtime dùng profile/dataset kiểm thử. Workflow không thay đổi.

## Preflight và xác minh release

Kiểm tra trên worktree candidate sạch, nội dung Git tương đương source hiện tại tại `D:\50K142-NEW\.g11-release\CoCo`; snapshot local `2c8db14446dec5ab00db25b3a7c8c3c26304245f`. Không có CODEX trong candidate. Lượt `npm ci` đầu ở workspace chính bị EPERM do esbuild đang được sử dụng; đã cài sạch thành công trong candidate (17 giây) và khôi phục dependency workspace theo cùng lockfile, không dừng server hoặc đổi dependency. Checkout Windows chỉ khác CRLF/LF; 198 file source/test/config khớp nội dung Git, workspace gốc giữ nguyên byte. Build có 22 file artifact; không build lại trong khi Chromium sử dụng dist.

| Bước | Kết quả hiện tại |
|---|---|
| `npm ci` | PASS trên candidate sạch; còn 7 moderate đã được PO chấp nhận |
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm test -- --maxWorkers=1` | 538 PASS / 0 FAIL / 0 SKIP, 29 file, 201,21 giây |
| `npm run build` | PASS; giữ cảnh báo chunk >500 kB, không đổi cấu hình để che cảnh báo |
| Chromium E2E `npm run test:e2e -- --workers=1` | **FAIL: 166 PASS / 1 FAIL / 0 SKIP / 0 FLAKY**, 618,05 giây; không rerun để che lỗi |
| CODEX sau kiểm tra / trước push | 1.162 file / 579.440.653 byte giữ nguyên SHA-256; không có CODEX trong index hoặc candidate tree. Main = origin/main, không có commit mới để push; commit 035a16b chỉ giữ ở backup local |
| Release commit SHA / danh sách file | **NOT CREATED** vì preflight FAIL; danh sách file chuẩn bị tại RELEASE_CANDIDATE_FILES.txt, không phải file đã commit |
| Push `origin main` | **NOT RUN**, dừng trước commit/push |
| CI run URL / SHA / kết quả | **NOT RUN cho candidate này**; workflow active nhưng chưa được kích hoạt bởi release |
| Pages deploy / SHA | **NO NEW DEPLOYMENT**; website cũ HTTP 200 không phải bằng chứng deploy candidate |
| Smoke website / routing / JS / IndexedDB / chức năng | **NOT RUN**, vì chưa có release deployment; không chạm dữ liệu trình duyệt thật |

## G11-B01 — Blocker preflight thực tế

- Ca `tests/e2e/purchase-approvals.spec.ts:160`: **G10 opposing approve/reject UI decisions commit once and both owner tabs recover without reload**.
- Assert thất bại tại `purchase-helpers.ts:10`, được gọi từ test dòng 190: sau đóng thông báo và thao tác Escape, một tab vẫn ở `#/approvals/Yc2f5a1ba` thay vì `#/approvals` trong 5 giây; error context còn dialog “Yêu cầu thu mua”. Không kết luận đây chỉ là sai lệch thẩm mỹ hoặc tự gán flaky.
- Các assertion trước đó đã qua: chỉ một quyết định thắng, đúng trạng thái dòng sản phẩm, một notice/operation; không tạo hóa đơn hoặc sản phẩm. Lượt full vẫn **FAIL** do chưa về danh sách đúng yêu cầu.
- Không sửa source, test, timeout, assertion hoặc workflow; không dùng 167 PASS lịch sử để thay kết quả 166/1 hiện tại. Cần PO quyết định phạm vi xử lý lỗi/test sau khi đối chiếu nguyên nhân, trước khi tiếp tục release; không tự bỏ test để vượt gate.

Bằng chứng [release-preflight.json](evidence/release-preflight.json), [chi tiết FAIL](evidence/chromium-failure.json), [error context](evidence/approval-race-error-context.md). Log đầy đủ, JSON runner và bundle manifest ở thư mục khôi phục local nêu trên. Không chạy lại tám popup visual riêng hoặc sửa pixel theo thẩm mỹ.

## Git và bàn giao khi dừng

Nhánh main/HEAD/upstream giữ tại `1fd4ad4a04e3b870a1c673fd7abd344af50dea69`; không tạo commit release hoặc push backup. Những file G10, refactor pure-business-rules, test-suite-audit và tài liệu release vẫn giữ trên máy/index để tiếp tục sau quyết định PO. Không xóa CODEX hoặc thay đổi source/nghiệp vụ/schema. Root ignore `/CODEX/` và bảo toàn dữ liệu được kiểm độc lập với kết quả test thất bại.

Pages mục tiêu: https://thuytrangmai66-oss.github.io/50K142.03.3007/ . Chưa có release SHA/CI run/deployment mới hoặc smoke hợp lệ, nên **RELEASE BLOCKED**, không báo hoàn tất G11-T02/T03 hay toàn G11.

## G11-B01 ?? s?a ? resume ???c PO ph? duy?t

[Root cause v? minimal fix](G11_B01_FIX.md): l?i source ? nh?nh CONFLICT gi? lu?ng popup l?ng nhau. Ch? th?m closeFlow cho CONFLICT; X/Escape ??ng notice s? v? danh s?ch, kh?ng s?a test/timeout/assertion ho?c transaction. Tr??c s?a 3/3 FAIL c? trace; sau s?a 33/33 targeted (11 case ?3), 538/538 unit v? 167/167 Chromium PASS. [JSON execution](evidence/b01-verification.json). M?i k?t qu? FAIL c? ???c gi? nguy?n l?ch s?; kh?ng ??i th?nh PASS.
