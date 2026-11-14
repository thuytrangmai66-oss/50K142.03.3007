# G11-B02 — Geometry assertion correction

PO phê duyệt ngày 14/11/2026; kiểm chứng kết thúc ngày 15/11/2026 (giờ Việt Nam). Chỉ sửa giới hạn tọa độ X của `.purchase-title-card > strong` từ 1 thành 2 CSS px, theo G10-D02. Không thay CSS, reference, nghiệp vụ, schema, dependency, timeout hoặc workflow.

## Căn cứ và thay đổi

- CI của `e0fd2a73b8c05b3e70cfb496a1d6ead4326967fd`, [run 43615453782](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/runs/43615453782): hai case Chủ/Nhân viên cùng lỗi selector, tọa độ X và delta `1.3999999999999773` CSS px. Lần đầu và hai retry đều cùng kết quả; không kết luận flaky.
- Đối chiếu nguồn local và bằng chứng layout G6: PDF Nhân viên `Tạo giao dịch thu mua 1.pdf`, SHA-256 `d35e4d36d2aac8c2684be62006c159db12ef649d3ce1172649e64105aab84aed`; PDF Chủ SHA-256 `35209d73ed4ed64adf99d7672d02275d52ed030ff7e9496cc91cc26c8ec2de52`. Đã xem ảnh xuất local `CODEX/.employee-purchase-qa/source-12.png` và screenshot runtime hai vai trò 1440×900. Badge có thể đọc và không che control. Không dùng screenshot runtime để thay reference.
- Reference đang kiểm `[905.4, 155, 145, 39]` giữ nguyên. Chỉ `selector === '.purchase-title-card > strong' && key === 'x'` dùng 2; Y/rộng/cao của badge và mọi selector khác vẫn 1. Assertions nội dung, responsive và chức năng không đổi.
- Linux CI không lưu artifact ảnh/trace ra ngoài runner trong workflow hiện tại; nguyên nhân hai FAIL được xác nhận từ log CI. Ảnh đối chiếu runtime là bằng chứng local, không gọi là screenshot Linux.

## Kiểm chứng

| Kiểm tra thực thi | Kết quả |
|---|---|
| Lint / typecheck / production build | PASS; bundle 22 file giữ nguyên hash so với B01 |
| Targeted `purchase-editor-figma.spec.ts` | **9 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, 3 case × 3 lượt, 22,35 giây |
| Full unit/integration | **538 PASS / 0 FAIL / 0 SKIP**, 29 file, 183,75 giây |
| Full Chromium | **166 PASS / 1 FAIL / 0 SKIP / 0 FLAKY**, 673,26 giây |
| Tái kiểm riêng case vừa FAIL, có trace | **3 PASS / 0 FAIL / 0 SKIP**, giữ code/assertion/timeout; không tái lập thời điểm qua nửa đêm |
| CI / deploy / production smoke cho B02 | NOT RUN; chưa commit/push vì full regression có FAIL |

Targeted geometry: cả hai vai trò, ba lượt, delta lớn nhất `0.03750000000002274` CSS px; không có phép đo khác vượt 2 px. Các assertion khác vẫn giữ giới hạn 1 px. Bằng chứng tổng hợp: [b02-verification.json](evidence/b02-verification.json). Log/JSON/trace và screenshot runtime giữ local trong `.git/coco-release-recovery/2026-11-14T15-30-53-634Z/b02/`.

FAIL mới nằm ở `phase10-finalize-benchmark.spec.ts:59` → `sales-helpers.ts:31`, case Chủ/1.000 món: sau Thêm, input mã sản phẩm chưa về rỗng trong 5 giây rồi biến mất; failure context ghi “Đang tải giao dịch…”. Case chạy từ `2026-11-14T16:59:49.123Z` qua 00:00 giờ Việt Nam, kéo dài 16,252 giây. Đây là trùng thời điểm scheduler hằng ngày theo source; chưa đủ trace của lần FAIL để xác nhận nguyên nhân. Ba lượt tái kiểm sau đó PASS không được dùng để đổi full suite FAIL thành PASS hoặc tự kết luận flaky.

**Cập nhật PO 15/11/2026:** [G11-B03](G11_B03_REVIEW.md) được **ACCEPTED FOR RELEASE / DEFERRED**, nguyên nhân chưa xác định, chưa khắc phục. PO cho phép chạy lại full Chromium một lần ở thời gian bình thường; chỉ khi 167 PASS mới commit/push B02, theo dõi CI và deploy khi CI PASS. Không sửa helper/assertion/timeout hoặc mở rộng sửa source. Lần FAIL ở bảng trên vẫn là FAIL lịch sử; kết quả lượt mới ghi riêng. G11-T03 chỉ chạy sau deploy thành công.

**Lượt full theo quyết định mới: 167 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, exit 0, không retry. Chạy đúng một lần, bắt đầu 00:13:56 giờ VN; [evidence](evidence/b03-release-verification.json). Đủ gate local để commit/push B02; CI/deploy/smoke mới vẫn chờ, không tuyên bố release thành công trước kiểm chứng.

## Giới hạn release

CODEX tiếp tục chỉ ở local, không thuộc commit hoặc lịch sử push. G10-A01–A07 giữ **ACCEPTED FOR RELEASE / DEFERRED**, chưa được khắc phục. G11-T04/T05 chưa thực thi/nghiệm thu; không tự đánh dấu DONE.
