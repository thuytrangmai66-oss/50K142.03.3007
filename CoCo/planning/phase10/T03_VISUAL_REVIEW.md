# G10-T03 — Visual đang kiểm chứng

Ngày 14/11/2026. **PARTIAL / chưa nghiệm thu toàn bộ SC001–SC297**.

Lượt tiếp tục: tám popup khách hàng SC101–104/SC294–297 đã **8/8 PASS** ở ngưỡng G10-D02, không mask/thay baseline. [Báo cáo, file sửa và bằng chứng](CUSTOMER_VISUAL_EXECUTION.md). Đây là tám component modal, chưa phải tám SC đầy đủ. Kết quả NOT RUN/PARTIAL về nhóm khác bên dưới không đổi; baseline nguồn riêng vẫn ở local.

[Ledger 297 SC](evidence/audit/visual-execution-ledger.json) tách nguồn sạch (209), cần review nguồn/annotation (88), kết quả component và kết quả toàn màn hình; không ghi 9 component thành 9 SC hoàn tất. Inventory nguồn không bị ghi đè thành PASS.

**G10-D05:** người dùng đã duyệt version hóa riêng crop SC105 và metadata. Hai file `tests/visual/references/SC105-picker.png`/`.json` có hash kiểm trước mỗi ca; test không còn đọc CODEX và không tự cập nhật asset. Focused sau thay nguồn **1/1 visual PASS** trong bộ 8/8. Nguồn CODEX/PDF khác không đưa vào Git; CI/Linux đúng SHA vẫn NOT RUN. [Review nguồn CI](VISUAL_CI_REVIEW.md).

## A04 — đánh giá theo ảnh hưởng sản phẩm, quyết định PO G10-D07

PO không yêu cầu giống Figma 100% hoặc tinh chỉnh pixel-perfect. Chấp nhận sai lệch thẩm mỹ nhỏ không ảnh hưởng nghiệp vụ, chức năng, khả năng đọc/thao tác hoặc tính nhất quán quan trọng. Không mở lại component đã PASS, không tạo test mới chỉ để đo sai lệch nhỏ. Chỉ sửa lỗi có ảnh hưởng thực tế và lợi ích lớn hơn thời gian/rủi ro phát sinh.

Ngưỡng test đã duyệt G10-D02 (geometry quan trọng ≤2 CSS px, threshold 0,2, maxDiffPixelRatio 0,01) giữ nguyên; không sửa test, baseline hoặc kết quả đã chạy. **Đánh giá sản phẩm/sai lệch được chấp nhận ghi riêng với kết quả thực thi**; quyết định này không biến một SC chưa kiểm, test FAIL hoặc gate chức năng còn thiếu thành PASS.

| Nhóm | Căn cứ phân loại và cách xử lý | Tình hình theo bằng chứng hiện có |
|---|---|---|
| Nghiêm trọng | Sai dữ liệu/nghiệp vụ/luồng/quyền; chức năng chính không hoạt động; không thể thao tác, hiểu sai hoặc mất/che thông tin quan trọng; responsive/hiển thị nghiêm trọng. Phải xử lý; nếu vướng quyết định thì giữ BLOCKED. | A01 về thiếu Nhân viên/Trạng thái là yêu cầu thông tin SRS đang BLOCKED do xung đột Figma, không được coi là sai lệch trang trí hoặc tự thêm trường bằng quyết định này. Không suy ra lỗi dữ liệu mới từ thiếu UI. |
| Đáng sửa | Có bằng chứng tái hiện việc khó đọc/thao tác hoặc thiếu nhất quán quan trọng dù vẫn hoàn thành được luồng; chỉ sửa khi lợi ích thực tế lớn hơn thời gian/rủi ro. | Các báo cáo visual hiện có được đọc trong lượt này chưa chỉ ra lỗi đang mở cụ thể thuộc nhóm này. Không lập thêm danh sách tinh chỉnh nhỏ hoặc suy ra toàn sản phẩm không còn lỗi. |
| Có thể chấp nhận | Sai lệch nhỏ spacing/padding/margin, kích thước/vị trí, màu/viền/shadow/radius/font-size, icon/trang trí hoặc raster/trình duyệt, có căn cứ không ảnh hưởng sử dụng. Ghi nhận, không sửa hoặc thêm test thẩm mỹ. | Phần sai khác còn lại trong component SC105 đã PASS được ghi ở sổ dưới. Các component đã PASS giữ nguyên. SC chưa kiểm không được tự xếp vào nhóm chấp nhận. |

### Sai lệch nhỏ được chấp nhận, không cần sửa

| Phạm vi | Sai khác / bằng chứng cũ | Ảnh hưởng và quyết định xử lý |
|---|---|---|
| SC105 — chỉ component report picker | Sau sửa, còn **1.115/361.548 pixel (~0,308%)** khác nguồn; geometry và visual đã PASS trong ngưỡng được duyệt. [Metric](evidence/visual/after-pixel-metric.json), [geometry](evidence/visual/after-geometry.json), [ảnh sau](evidence/visual/after-picker.png). | Evidence component hiện có không ghi nhận ảnh hưởng khả năng đọc/thao tác; chấp nhận phần sai khác còn lại theo G10-D07, không tiếp tục tinh chỉnh để đưa diff về 0 hoặc chạy lại chỉ vì thẩm mỹ. Không mở rộng kết luận sang toàn màn hình SC105. |

Bảng Hàng hóa 5 cột và các tinh chỉnh pagination đã được PO duyệt là cấu hình hợp lệ hiện tại; không mở lại để khôi phục ảnh 6 cột hoặc bố cục cũ. Các lượt FAIL đã sửa ở phần lịch sử bên dưới giữ nguyên lịch sử, không trở thành lỗi mới cần làm lại.

Lượt phân loại này chỉ dùng các báo cáo/metric hiện có, không chạy kiểm thử, build, benchmark hoặc rà lại toàn bộ 297 SC. Các nguồn/trạng thái chưa kiểm vẫn là thiếu bằng chứng, không phải lỗi UI đã xác nhận hoặc sai lệch nhỏ đã được chấp nhận.

## SC105 — phạm vi report picker

- Nguồn bất biến: `CODEX/Figma.Chủ/Màn hình Báo cáo 1.png`, 1440×900, SHA-256 `114c0f7d92f587e8518008590673f9892bb80b8229746ab1ae4d291f71b0b72d`.
- DPR 1, clip x476/y198/w913/h396, không mask. Ngưỡng đã duyệt: geometry ≤2 CSS px; threshold 0,2; maxDiffPixelRatio 0,01.
- Ảnh kỳ vọng luôn được lấy từ export nguồn; không dùng screenshot ứng dụng, không update baseline theo runtime. Cache ảnh nguồn nằm trong đường dẫn bị ignore.
- Lượt hồi quy đầu: geometry PASS, pixel **FAIL** 4.236/361.548 (~1,17%). Thử tăng stroke không cải thiện (4.262), đã hoàn nguyên.
- Sửa đúng phần còn lệch: tiêu đề dòng đầu và khoảng cách icon–nhãn được đo riêng từ raster nguồn; giữ nhãn truy cập, màu, hành vi, kích thước thẻ và ngưỡng kiểm tra. Khoảng cách nguồn của ba thẻ profit/aged-stock/cash-flow khác nhau, được scope theo `data-report`, không tác động bảng/pagination/module khác.
- Lượt focused sau sửa: **1/1 Chromium PASS**, 4,0 giây. Đo lại bằng pixelmatch của Playwright: **1.115/361.548 pixel (~0,308%)**. Đây là một component, không phải toàn màn hình SC105 hoặc mọi visual đã đạt.
- [Trước](evidence/visual/full-run-picker-actual.png), [sau](evidence/visual/after-picker.png), [geometry](evidence/visual/after-geometry.json), [metric](evidence/visual/after-pixel-metric.json). Full Chromium sau sửa **156/156 PASS**, bao gồm ca visual này; không đồng nghĩa toàn bộ SC đạt.

## Chuẩn bị nguồn PDF

Windows.Data.Pdf từng render SC101 ra nền trống; kết quả đó không dùng làm baseline. Đã dùng `pdfjs-dist 6.5.438` lấy vào TEMP từ registry chính thức, kiểm SHA-512 tarball; không thêm vào package/lock hoặc ứng dụng. Renderer Node chỉ phục vụ module trên localhost/profile Chromium riêng, nhận PDF bằng bytes cục bộ, chặn origin ngoài. Không upload CODEX.

`scripts/render-pdf-reference.mjs` đã render **154/154 PDF** trong mapping ở scale 1/DPR 1. Kiểm mẫu màu 10.000 điểm mỗi ảnh: 154 ảnh không đồng nhất; điều này không chứng minh từng ảnh đúng Figma. SC101 đã mở ảnh kiểm tra, nội dung popup có hiển thị thay vì ảnh trống. Cache PNG nguồn bị Git ignore; [inventory metadata/hash](evidence/audit/reference-raster-inventory.json) được tách riêng.

Lệnh tái lập khi đã chuẩn bị đúng gói TEMP:

```powershell
node scripts/render-pdf-reference.mjs --pdfjs-root "$env:TEMP/coco-g10-pdfjs-6.5.438/package" --all
```

Gói có integrity `sha512-vg8Pw1x+AFKy4AMDvhuWl5cOYV8d698UoEANoFFhc79hqXDnZQqnOXoxw3HG907WHOg1JYOvLhP756boddFxpA==`. API render theo [ví dụ PDF.js](https://mozilla.github.io/pdf.js/examples/). Công cụ rasterization độc lập với kiểm thử nghiệp vụ; lỗi API dọn PDF ban đầu đã sửa sang loading task, sau đó lệnh render đơn và batch đều exit 0.

## Phần còn lại

209/297 SC có export sạch trong mapping (55 PNG/154 PDF); 88 SC còn chỉ có frame QA/tham chiếu cần đối chiếu nguồn, annotation và thay đổi UI đã được duyệt. Chưa đủ bằng chứng visual/action cho toàn bộ 297 SC; đây là gap phạm vi kiểm chứng, không phải kết luận có 297 lỗi hoặc phải sửa mọi pixel khác nguồn. Tiếp tục đánh giá theo ba nhóm G10-D07, ưu tiên ảnh hưởng thật tới thông tin/thao tác/nghiệp vụ, không tạo thêm test chỉ vì thẩm mỹ nhỏ. Không lấy ảnh annotated/ảnh runtime làm baseline mới để đóng gap; không phục hồi bảng Hàng hóa 6 cột hoặc bỏ các tinh chỉnh pagination đã duyệt. Mọi trường hợp chưa so sánh tiếp tục NOT RUN/PENDING REVIEW theo bằng chứng thực tế; không tự đóng A04 hoặc thay các gate bắt buộc khác.
