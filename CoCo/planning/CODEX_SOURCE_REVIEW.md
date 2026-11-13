# Rà soát nguồn bổ sung trong CODEX

> Cập nhật sau chỉ đạo “tiếp tục” 11/11/2026: đã triển khai G3 theo roadmap/P01/P02, chỉ dùng nguồn local. Asset/crop/token/hash và đối chiếu UI01 được ghi tại [phase3/ASSET_MANIFEST.md](phase3/ASSET_MANIFEST.md); kết quả ở [REPORT_PHASE_3.md](phase3/REPORT_PHASE_3.md). Những đoạn “chưa coding/chờ duyệt” bên dưới là lịch sử lượt rà soát, không mô tả trạng thái G3 hiện tại.

Ngày hoàn tất rà soát: 11/11/2026, giờ Việt Nam. Thư mục: `D:\50K142-NEW\CODEX`. Phạm vi: kiểm kê, kiểm tra cấu trúc và liên kết dữ liệu, đối chiếu nguồn để chuẩn bị coding; không sửa source, roadmap, Git config hoặc dữ liệu gốc, không commit/push thư mục bổ sung.

## Kết luận

### Cập nhật sau khi nhận thêm hai bộ export và master prompt ngày 11/11/2026

Hiện có thêm `Figma.Chủ` (146 tệp) và `Figma.Nhân viên` (78 tệp trực tiếp cùng 146 tệp owner nằm lồng). Tổng phần mới 370 tệp, 224 hash khác nhau; đã đọc cấu trúc/text 271 PDF và verify 99 PNG. Các số 792 tệp/366,06 MiB ở phần kiểm kê dưới đây là snapshot bộ QA trước khi hai thư mục này được thêm, không phải tổng CODEX hiện tại. Không phân quyền staff cho bản owner lồng.

Theo chỉ đạo mới, dùng thiết kế local trong CODEX cho cả hai vai trò, không đọc Figma qua link và không yêu cầu gửi lại hai bộ. Nguồn QA mô tả giúp diễn giải, export local sạch là target hình thức, SRS/Design gốc là nguồn nghiệp vụ; xung đột được ghi để review. Thiếu node ID online không còn là điều kiện chặn phương thức đọc local này. Manifest source/geometry/checksum mới có tại [SOURCE_INVENTORY.csv](SOURCE_INVENTORY.csv).

Master prompt mới yêu cầu lập kế hoạch trước, không coding/commit/push/deploy. Đã tạo [MASTER_PLAN_COCO.md](MASTER_PLAN_COCO.md) và các ma trận/kế hoạch phase, trạng thái READY FOR REVIEW. Đây là kế hoạch đề xuất để duyệt, không phải khôi phục được thứ tự phase cũ còn thiếu. Kết quả khảo sát mới và giới hạn ở [BASELINE_AUDIT.md](BASELINE_AUDIT.md); vấn đề cần quyết định ở [OPEN_ISSUES.md](OPEN_ISSUES.md). Các phần phía dưới giữ dấu vết lượt rà soát trước.

CODEX bổ sung nguồn tham khảo hữu ích cho giao diện và truy vết yêu cầu: 27 use case, 38 nhóm UI, 297 block mô tả màn hình và 297 ảnh tương ứng. Có đủ ảnh được tham chiếu trong các mapping đã kiểm tra. Đây là các bản trích và artifact soạn/kiểm tra tài liệu, chưa phải source ứng dụng hoặc bằng chứng các chức năng đã được triển khai.

Giữ thứ tự nguồn theo AD06: SRS/Design gốc và Figma là nguồn chuẩn; các bản bổ sung dùng đối chiếu. Không tự thay nguồn chuẩn bằng file có tên `word-updated`, `final`, `verified` hoặc bằng thời gian sửa file. Không tự suy ra dữ liệu mẫu trong ảnh là dữ liệu thật, tài khoản mặc định hoặc quy tắc nghiệp vụ.

## Kiểm kê

Tổng 792 tệp, khoảng 366,06 MiB: 707 PNG, 11 JSON, 56 TXT, 5 DOCX, 7 PDF, 3 Markdown, 1 PPTX, 1 NDJSON và 1 MJS. Kiểm tra SHA-256 toàn bộ tệp ghi nhận 769 nội dung khác nhau, 20 nhóm trùng nội dung với 23 bản sao dư. Giữ nguyên các bản sao để bảo toàn dấu vết nguồn.

| Nhóm | Số tệp | Cách dùng |
|---|---:|---|
| `.uc-ui-matrix-qa` | 344 | Điểm vào chính để tra cứu use case, nhóm UI, vai trò, mô tả điều khiển và ảnh màn hình |
| `.employee-purchase-qa` | 126 | Đối chiếu luồng thu mua nhân viên, bảng mô tả 30 màn và 33 nguồn ảnh; dùng mapping kèm theo |
| `.approval-qa` | 84 | Tham khảo 21 nguồn ảnh/trích văn bản cho phê duyệt, từ chối và các trạng thái liên quan |
| `.report-qa` | 67 | Tham khảo 26 nguồn ảnh và các bản render mô tả báo cáo; kiểm tra công thức bằng SRS |
| `.design-merge-qa` | 56 | Bản Design trung gian, outline và ảnh QA; không mặc định là phiên bản chuẩn hiện tại |
| `.uc5-missing-qa` | 56 | Bổ sung đối chiếu các trạng thái khung giá UC5 |
| `.nv-sales-tables-qa` | 36 | Đối chiếu mô tả bảng/màn bán hàng nhân viên |
| `.goods-search-qa` | 11 | Tham khảo trạng thái tìm kiếm hàng hóa |
| `.goods-two-qa` | 8 | Tham khảo các màn hàng hóa được bổ sung |
| `.build` | 4 | Loại khỏi nguồn nghiệp vụ CoCo: report và script xuất slide thuộc MotoCare/thuê xe cũ |

Các file `artifact.md` ghi hướng dẫn định dạng Word (Arial, bảng xanh, lề/trang, đánh số), không phải yêu cầu giao diện web hoặc chỉ dẫn chạy build ứng dụng. Không thực thi `.build/export.mjs`; script này trỏ tới workspace/xuất phẩm MotoCare cũ.

## Các nguồn nên đọc khi coding

1. [`usecases.json`](../../CODEX/.uc-ui-matrix-qa/usecases.json): nội dung 27 UC, actor, điều kiện, luồng chính/phụ/lỗi và BR. Đối chiếu lại SRS khi logic ảnh hoặc mô tả không khớp.
2. [`catalog.json`](../../CODEX/.uc-ui-matrix-qa/catalog.json): 38 nhóm UI và mapping 27 UC → UI. Dùng lập checklist chức năng và quyền truy cập, không dùng thứ tự trong mảng làm thứ tự phase.
3. [`design-blocks.json`](../../CODEX/.uc-ui-matrix-qa/design-blocks.json): 297 block, gồm 191 block cho chủ và 106 cho nhân viên. Tra đúng `title` + `role`, rồi mở ảnh trong trường `images`; tên màn hình có thể trùng giữa vai trò.
4. `frame-N.png`: tham khảo bố cục/trạng thái khi đối chiếu từng màn. Một số ảnh chứa khung đỏ, số chú thích và cả điều khiển chọn đối tượng; không đưa chúng vào giao diện sản phẩm. Không nhúng ảnh toàn màn hình thay cho UI tương tác.
5. Các `sources.json`, `source-N.png`, `text-N.txt` và bảng mô tả theo module: kiểm tra nhãn, thông báo lỗi, điều kiện và biến thể. `sources.json` chứa tên nguồn xuất, không phải Figma node ID hoặc manifest asset gốc.
6. Figma trực tiếp: dùng node tương ứng để lấy font/kích thước/layout/asset gốc và kiểm chứng thị giác trước khi khóa giao diện. Nguồn CODEX giúp tra cứu và chuẩn bị khi MCP bị giới hạn, nhưng chưa cung cấp đầy đủ context Figma có cấu trúc cho tất cả màn.

Quy trình cho mỗi module: UC/BR → nhóm UI và vai trò → block và ảnh trạng thái → node Figma/asset → service kiểm tra quyền và nghiệp vụ → giao diện dữ liệu động → kiểm thử luồng thành công/lỗi/hủy/quyền → CI/CD đã có. Không thêm phase hoặc tự đổi thứ tự roadmap từ mapping UI.

## Các kiểm tra đã thực hiện

- Đọc và parse được cả 11 JSON; 27 UC không trùng ID, khớp các key mapping sau alias `0` → `UC_0`; không có index UI ngoài khoảng 1–38.
- Cả 297 ảnh được tham chiếu trong design-blocks đều tồn tại, không thiếu liên kết. Đây là kiểm tra liên kết tệp, chưa phải duyệt trực quan từng ảnh.
- Các danh sách nguồn ảnh phê duyệt (21), thu mua nhân viên (33) và báo cáo (26) đều có render `source-N.png` tương ứng. Mapping thu mua có 30 phần tử, mọi tham chiếu đều trong 1–33.
- Mapping `UC_2.3` đang rỗng. Phù hợp vấn đề Q22 đã ghi nhận: không tự điền dấu tick vào nguồn hoặc tạo nút chạy tay. UI theo dõi U15 có thể là quan hệ giám sát suy ra; tác vụ vẫn tự động theo AD08.
- Đọc cấu trúc XML của 5 DOCX, so sánh với Design gốc. Các bản `word-updated.docx` có hash/nội dung khác nhau; 20 dòng schema logic (10 thực thể lặp ở hai mục) trùng Design gốc. Chưa xác nhận mọi bảng và đoạn còn lại giống nhau.
- Bản `.uc-ui-matrix-qa/word-updated.docx` có hash `2C66A1582D39EE8B10A985B387BADD9238018DF6DEB0691EA57566F6C9D234FD`; Design gốc có hash `917FF96B696FD1DE9228560D65D4EA037EDE32297B1699648894DDCA15A1E207`. So sánh outline ghi nhận thêm hai heading: “Màn hình Tìm kiếm giao dịch thu mua 6” và “Màn hình Tìm kiếm giao dịch thu mua 7”. Giữ chúng làm nguồn bổ sung để đối chiếu trạng thái lỗi, không tự đổi baseline Design.
- Đã mở trực quan `frame-1.png` (đăng nhập có chú thích) và `.employee-purchase-qa/source-2.png` (màn danh sách thu mua sạch). Không tuyên bố đã duyệt hết 707 PNG, 7 PDF hoặc toàn bộ chi tiết của 5 DOCX.

## Những gì còn thiếu hoặc chưa được xác nhận

- **Roadmap đã duyệt:** ở lượt rà soát nguồn ban đầu chưa có master/checklist G3; nay đã có bản master đề xuất theo prompt mới, còn chờ phê duyệt. Bộ 27 UC/38 UI không tự xác định thứ tự phase đã được duyệt.
- **Liên kết từng màn tới Figma:** JSON trong CODEX chưa có file key/node ID cho từng block. Các node đã xác minh trước vẫn có trong `planning/phase0/UI_FOUNDATIONS.md`, nhưng chưa có `SCREEN_MAP.csv`/manifest node đầy đủ trong bộ này.
- **Asset và token gốc cho các màn chưa đối chiếu:** chưa thấy bộ SVG/icon/font rời hoặc asset manifest Figma trong CODEX. Dự án đã có Be Vietnam Pro cục bộ; font/asset khác phải lấy đúng nguồn khi triển khai. PNG toàn màn và tài liệu Word không thay thế được asset thành phần.
- **Trạng thái phiên bản tài liệu:** các bản Word trung gian khác Design chuẩn; chưa có chỉ đạo thay baseline. Các khác biệt UI cần đối chiếu SRS/Figma theo AD06 khi làm module đó.
- **Chi tiết nghiệp vụ còn mở:** chưa có bằng chứng rõ trong bộ bổ sung giải quyết Q10, quy tắc làm tròn khoản giảm ở Q12, tiêu chí chất lượng Q20 hoặc phím tắt/mức giá Q21. Không lấy các con số minh họa trong ảnh làm giá trị nghiệp vụ đã chốt. Việc tạo chủ đầu tiên vẫn cần được cụ thể hóa trong phạm vi auth đúng roadmap.

Nguồn mới đủ hữu ích để chuẩn bị và đối chiếu nhiều module UI; chưa đồng nghĩa toàn bộ điều kiện còn thiếu đã được giải quyết. Không cần gửi lại SRS/Design đang đọc được chỉ vì bộ CODEX là artifact bổ sung.

## Trạng thái Git

Khi kiểm tra, toàn bộ `CODEX/` đang untracked. `CoCo/.gitignore` chỉ áp dụng dưới CoCo, không áp dụng thư mục CODEX cùng cấp; `git check-ignore` xác nhận các tệp mẫu trong CODEX chưa được ignore. Lần rà soát không sửa `.gitignore`, không xóa trùng, không stage/commit/push dữ liệu bổ sung.

Nếu đưa tài liệu tham khảo vào Git sau này, nên chọn index/metadata/ảnh nguồn cần dùng và giữ dấu vết xuất xứ, thay vì đưa cả mọi bản Word/PDF/render QA vào commit. Việc chọn tệp để theo dõi và cách quản lý bộ tham khảo lớn chưa được thay đổi trong lần kiểm tra này.
