# G11-T02 — Release execution

Cập nhật 15/11/2026 (giờ Việt Nam). **PO APPROVED RELEASE / LOCAL GATES PASS, CI PENDING:** B03 được **ACCEPTED FOR RELEASE / DEFERRED**, chưa xác định nguyên nhân/chưa sửa. Lượt full Chromium duy nhất theo PO **167/167 PASS**, không skip/retry, đủ điều kiện commit/push B02. CI/deploy/smoke của commit mới còn chờ; CI FAIL trước trên `e0fd2a7` giữ làm lịch sử. Không báo hoàn tất G11-T02/T03 hoặc toàn G11.

## Quyết định và phạm vi

PO phê duyệt release với G10-A01–A07 **ACCEPTED FOR RELEASE / DEFERRED**, giữ tình trạng chưa hoàn thành và rủi ro; không tuyên bố đã sửa/PASS. Sau preflight lần đầu thất bại, PO cho phép xử lý giới hạn G11-B01. Chỉ sửa luồng đóng popup CONFLICT trong ApprovalsPage.tsx; không đổi test, assertion, timeout, schema, transaction, business rule hoặc workflow.

| Known issue | Rủi ro được chấp nhận tạm thời |
|---|---|
| A01 | Mâu thuẫn SRS/Figma; Nhân viên/Trạng thái trên chi tiết còn thiếu. |
| A02 | Phím tắt/mức giá nhanh chưa chốt và kiểm chứng đủ. |
| A03 | Chưa có SLA được duyệt; số đo không đồng nghĩa đạt SLA. |
| A04 | Visual/action coverage chưa đầy đủ; SC105/8 modal không chứng nhận 297 SC. |
| A05 | Traceability từng nhánh UC/control chưa khép. |
| A06 | 7 moderate dependency vulnerabilities thuộc nhóm công cụ lint. |
| A07 | Barcode/cảm ứng vật lý chưa kiểm thử trên thiết bị thật. |
| G11-B03 | Chưa rõ nguyên nhân FAIL thêm sản phẩm bán hàng với 1.000 món khi qua 00:00 giờ VN; ba lượt recheck sau đó PASS chưa tái hiện điều kiện chuyển ngày. PO chấp nhận tạm thời, không sửa source/benchmark/assertion/timeout và không coi lỗi đã khắc phục. |

## Git, CODEX và checkpoint

- Bắt đầu: main và origin/main cùng 1fd4ad4a04e3b870a1c673fd7abd344af50dea69; 326 file staged, không có unstaged/untracked không bị ignore. Reflog đã có reset về origin/main trước lượt release; không reset lại.
- Commit cũ 035a16ba7be5cf7096641906e4259afe4f09c6e4 chứa CODEX nhưng không thuộc lịch sử main mới. Đã bảo vệ bằng ref local, không push backup.
- Recovery tại .git/coco-release-recovery/2026-11-14T15-30-53-634Z/: index gốc, snapshot, manifest và bản sao CODEX. Ref local dưới refs/coco-local-backup/2026-11-14T15-30-53-634Z/ giữ original-035a16b, prepared-index và release-candidate.
- **1.162 file CODEX / 579.440.653 byte giữ nguyên SHA-256**, bản sao đã đối chiếu. Root .gitignore có /CODEX/; không có CODEX trong index, commit release hoặc bất kỳ commit mới nào push. API cây GitHub cũng xác nhận 0 đường dẫn CODEX.
- Commit release: **e0fd2a73b8c05b3e70cfb496a1d6ead4326967fd**, parent 1fd4ad4a04e3b870a1c673fd7abd344af50dea69.
- Message: fix(coco): close conflicted approval flow and prepare G11 release.
- Push thường origin main **SUCCESS**, remote SHA đã xác minh; đúng một commit mới, không force/push-all/backup. [Commit GitHub](https://github.com/thuytrangmai66-oss/50K142.03.3007/commit/e0fd2a73b8c05b3e70cfb496a1d6ead4326967fd), [335 file đã commit](RELEASE_CANDIDATE_FILES.txt).
- Refactor pure-business-rules và test-suite-audit được bảo toàn. Scan staging không thấy secret pattern, .env, database riêng, node_modules, dist hoặc tài liệu CODEX. Baseline SC105 là nguồn riêng duy nhất đã được PO duyệt version hóa; ảnh khác trong evidence là runtime với dữ liệu kiểm thử.

## Kiểm thử local và G11-B01

npm ci đầu ở workspace bị EPERM do esbuild đang được dùng. Đã cài sạch candidate tại D:\50K142-NEW\.g11-release\CoCo và khôi phục dependency workspace theo cùng lockfile, không dừng server hoặc xóa dữ liệu. Không dùng lượt install lỗi làm PASS.

| Kiểm tra sau sửa | Kết quả thực thi |
|---|---|
| npm ci | PASS trên candidate sạch, 17 giây; còn 7 moderate đã chấp nhận |
| Lint / typecheck | PASS |
| Production build | PASS; giữ cảnh báo chunk >500 kB |
| Targeted approval E2E | **33 PASS / 0 FAIL / 0 SKIP**, 11 case lặp 3 lần |
| Full unit/integration | **538 PASS / 0 FAIL / 0 SKIP**, 29 file, 191,53 giây |
| Full Chromium | **167 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, 614,67 giây |

Trước sửa: full 166 PASS/1 FAIL; đúng ca race lặp 3 lần đều FAIL có trace. Nhánh CONFLICT giữ popup lý do và chi tiết; một Escape chỉ đóng lớp lý do. Sửa closeFlow: conflict khiến đóng thông báo unmount cả luồng và về /approvals. Lỗi lưu thông thường vẫn giữ form/retry. Không sửa test hoặc transaction. [Root cause/fix](G11_B01_FIX.md), [execution sau sửa](evidence/b01-verification.json).

Guard: trong source/test/config chỉ ApprovalsPage.tsx đổi; service/repository/schema/test/workflow không đổi. Full Chromium dùng cùng bundle 22 file, không build giữa lượt. Giữ kết quả FAIL cũ ở [preflight cũ](evidence/release-preflight.json), [chi tiết FAIL cũ](evidence/chromium-failure.json), [error context](evidence/approval-race-error-context.md); không chuyển lịch sử FAIL thành PASS. Log/trace/JSON runner đầy đủ giữ local trong recovery.

## CI và blocker G11-B02

[Workflow run 43615453782](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/runs/43615453782) kiểm đúng release SHA. [Bằng chứng CI/remote](evidence/release-ci.json).

| Bước CI | Kết quả |
|---|---|
| Install / lint / typecheck / unit / static audit / build / install Chromium | SUCCESS; unit 538 PASS |
| Chromium Linux | **165 PASS / 2 FAIL** |
| Upload Pages artifact / deploy | SKIPPED do checks failure |

Hai FAIL: tests/e2e/purchase-editor-figma.spec.ts:15, role Chủ và Nhân viên. Assertion dòng 25, .purchase-title-card > strong, tọa độ X: delta **1,4 CSS px**, vượt ngưỡng **1 px**; lần đầu và hai retry cùng lỗi. Không có G11-B01 trong danh sách FAIL. Chưa có bằng chứng lỗi nghiệp vụ từ hai phép đo layout này.

**G11-B02 — quyết định mới của PO:** cho phép chỉ tọa độ X của `.purchase-title-card > strong` dùng 2 CSS px theo G10-D02; mọi giới hạn khác vẫn 1 px. Đã sửa đúng test, giữ CSS/reference/timeout/functional assertions. [Báo cáo B02](G11_B02_FIX.md).

### Kiểm chứng B02 ngày 15/11/2026

- Lint/typecheck/build PASS; unit/integration **538/538 PASS**; targeted layout **9/9 PASS** (3 case × 3 lượt), không có delta khác vượt 2 px. Source và bundle 22 file giữ nguyên.
- Full Chromium **166 PASS / 1 FAIL** ở benchmark Chủ/1.000 sản phẩm, bước thêm sản phẩm bán hàng: input không về rỗng trong 5 giây; context hiển thị “Đang tải giao dịch…”. Case đi qua 00:00 giờ Việt Nam. Chưa xác nhận nguyên nhân bằng trace lần FAIL; không tự kết luận flaky.
- Tái kiểm riêng đúng case, có trace, **3/3 PASS** sau nửa đêm; không thay kết quả full suite thành PASS. [B03 cần review](G11_B03_REVIEW.md), [evidence](evidence/b02-verification.json).
- Tại checkpoint này đã dừng trước commit/push; HEAD và origin/main cùng `e0fd2a73b8c05b3e70cfb496a1d6ead4326967fd`. Sau đó PO quyết định B03 **ACCEPTED FOR RELEASE / DEFERRED**, cho chạy lại full Chromium một lần vào thời gian bình thường (bắt đầu 00:13:56 giờ VN). Chỉ đủ 167 PASS mới commit/push B02; CI còn FAIL phải dừng, chỉ deploy khi CI PASS. Kết quả lần FAIL vẫn giữ nguyên; không kết luận nguyên nhân hoặc sửa B03.
- **Lượt full mới đã thực thi: 167 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, exit 0, không retry; [bằng chứng riêng](evidence/b03-release-verification.json). Các source/test/config được đối chiếu giữa main và candidate; chỉ test geometry B02 thay đổi so với SHA cũ. Unit 538/538 và lint/typecheck/build dùng evidence B02 còn hợp lệ; bundle 22 file giữ nguyên. Đủ gate local để commit/push, còn chờ CI đúng SHA mới, deployment và smoke.

## Pages và bàn giao

- [Pages mục tiêu](https://thuytrangmai66-oss.github.io/50K142.03.3007/) HTTP 200 hiện là site cũ, dùng index-DPPpdAm4.js và index-DJtNdkG8.css; không phải deployment release mới.
- Deployment release **SKIPPED**; G11-T03 smoke **NOT RUN**. Không thao tác storage/profile trình duyệt thật. Script smoke profile riêng được chuẩn bị nhưng chưa chạy khi chưa có deployment.
- G11-T04 rollback/roll-forward và T05 nghiệm thu bàn giao chưa thực thi/nghiệm thu; không tự DONE toàn G11.
- Báo cáo sau CI cập nhật local, chưa commit/push thêm để tránh kích hoạt lại pipeline khi blocker chưa xử lý. Source release đã push đúng SHA; dữ liệu local/CODEX được bảo toàn.

**Trạng thái hiện tại: LOCAL GATES PASS / CI PENDING.** Được phép commit/push B02 và tiếp tục kiểm đúng SHA trên CI/deploy/smoke. B03 được PO chấp nhận tạm thời, chưa rõ nguyên nhân/chưa khắc phục. Chưa có release mới deploy/smoke thành công.
