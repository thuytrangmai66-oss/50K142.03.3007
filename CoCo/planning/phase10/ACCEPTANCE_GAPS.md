# G10 — Cổng nghiệm thu còn mở

> **14/11/2026 — PO APPROVED RELEASE G11, G10-D08.** Toàn bộ A01–A07: **ACCEPTED FOR RELEASE / DEFERRED**, giữ nguyên rủi ro và kết quả kiểm chứng gốc dưới đây, không tuyên bố đã khắc phục/PASS. A08 chuyển sang thực thi CI/Pages trong G11-T02/T03. CI thất bại, dữ liệu riêng trong lịch sử push hoặc deploy/smoke chưa đạt vẫn là blocker release; không được bypass. [Theo dõi release](../phase11/RELEASE_EXECUTION.md).

## Hồ sơ thiếu sót trước phê duyệt release — không phải kết quả đã sửa

Ngày 14/11/2026, trước G10-D08: **G10 IN PROGRESS / chưa đủ gate nghiệm thu đầy đủ.** PO đã xác nhận **G9 đã nghiệm thu**; trạng thái G9 PENDING REVIEW trước xác nhận này không còn là blocker. Bảng dưới giữ trạng thái kiểm chứng gốc; các câu chưa chuyển G11/chưa commit-push là lịch sử và nay được thay bởi quyền release cụ thể G10-D08.

## Quyết định PO và cách đọc trạng thái

PO cho phép đưa phần **không bắt buộc trong G10** sang backlog G11, giữ nguyên tình trạng chưa hoàn thành và ghi rõ rủi ro. Không tự đưa yêu cầu bắt buộc UC/BR/SC/NFR sang backlog; không chuyển DEFERRED/WAIVED thành PASS. Xem [quyết định và đối chiếu kế hoạch](G10_REVIEW_GATE.md).

**G10-D07 — ưu tiên thực tế UI:** PO không yêu cầu A04 giống Figma 100%. Sai lệch nhỏ không ảnh hưởng nghiệp vụ/chức năng/đọc/thao tác/tính nhất quán quan trọng được ghi nhận và chấp nhận, không sửa hoặc thêm test thẩm mỹ, không mở lại phần đã PASS. [T03_VISUAL_REVIEW.md](T03_VISUAL_REVIEW.md) phân loại nghiêm trọng / đáng sửa / có thể chấp nhận và ghi sai khác SC105 còn lại. Đây không phải WAIVED toàn bộ A04 hoặc thay ngưỡng/tiêu chí bắt buộc; kết quả test và đánh giá tác động ghi riêng.

- **PASS:** chỉ bằng chứng đúng phạm vi: các execution đã ghi nhận 538 unit/integration, 167 Chromium, 8 modal visual local và lint/typecheck/build; component SC105; lượt tối ưu riêng 138 ca liên quan. Không phải một lượt chạy mới hoặc PASS toàn bộ 297 SC/G10.
- **WAIVED:** không có gate được PO miễn trừ cụ thể.
- **DEFERRED:** chỉ A08, phần xác minh release thuộc G11-T02/T03 theo roadmap; thực thi vẫn NOT RUN, giữ trong backlog với rủi ro và dependency bên dưới.
- **BLOCKED:** A01 còn mâu thuẫn SRS/Figma. **OPEN/PARTIAL/PENDING/NOT RUN** ở các mục khác vẫn là chưa hoàn thành; không đổi sang PASS hay WAIVED.

## Gate còn thiếu và backlog được ghi nhận

| ID | Phạm vi / trạng thái | Người xử lý / đầu vào cần thiết | Điều kiện khép / rủi ro còn lại |
|---|---|---|---|
| G10-A01 | **BLOCKED — bắt buộc G10-T01/T02:** BR-UC1-16 và ngoại lệ chi tiết G8, trường Nhân viên/Trạng thái UI còn thiếu theo chỉ đạo giữ Figma | PO chốt cách xử lý mâu thuẫn SRS/Figma; hiện vẫn giữ BLOCKED | Chưa đáp ứng yêu cầu thông tin chi tiết; chưa có WAIVED cụ thể. Không tự thêm control/đổi SRS hoặc gán PASS |
| G10-A02 | **OPEN — bắt buộc G10-T02/T05:** Q21/P11 chưa chốt phím tắt/mức giá chọn nhanh | PO chốt danh sách theo G10-D03; người triển khai kiểm chứng sau khi được duyệt | Chưa có căn cứ nghiệm thu NFR tương tác. Không tự coi là tùy chọn hoặc lấy datalist hiện có làm bằng chứng đủ |
| G10-A03 | **OPEN — bắt buộc G10-T02/T05:** SLA chưa chốt, đã có số đo nhưng chưa nghiệm thu NFR hiệu năng | PO review dataset/máy/phương pháp và ngưỡng; QA đối chiếu evidence | Không kết luận hiệu năng đạt khi thiếu tiêu chí; không biến timeout test thành SLA hoặc tự áp ngưỡng |
| G10-A04 | **OPEN/PARTIAL — bằng chứng visual/action chưa đủ theo phạm vi G10-T03:** SC105 component và 8 modal SC101–104/SC294–297 PASS giới hạn phạm vi; không yêu cầu giống nguồn 100% | Người triển khai/QA kiểm các trạng thái còn thiếu và phân loại theo G10-D07; 88 SC cần rà nguồn/annotation/alias. Không mở lại phần đã PASS hoặc thêm test chỉ vì thẩm mỹ | Chỉ xử lý sai lệch nghiêm trọng/đáng sửa khi có ảnh hưởng thực tế. Sai khác nhỏ SC105 đã ghi nhận chấp nhận; trạng thái chưa kiểm vẫn NOT RUN, không tự coi là lỗi UI hoặc PASS. Giữ ngưỡng/tiêu chí bắt buộc, không dùng baseline runtime |
| G10-A05 | **OPEN/PARTIAL — bắt buộc G10-T01/T02:** đã review assertion 98 BR; chưa đủ MAIN/ALT/ERR/control của 27 UC và UI negative fields | Người triển khai/QA khép từng nhánh và liên kết assertion/evidence; xem BR_REVIEW_EXECUTION.md | Có thể còn lỗi ở nhánh chưa được kiểm chứng; review assertion/tổng test không thay coverage từng UC/control/visual |
| G10-A06 | **OPEN — review audit/NFR security G10-T02/T04 chưa khép:** production audit 0, còn 7 moderate thuộc công cụ lint | Người triển khai tìm phương án tương thích; PO duyệt review riêng nếu override/nâng major hoặc cần quyết định rủi ro | Rủi ro dependency công cụ còn nguyên. Chưa có WAIVED/risk acceptance cụ thể; không tự coi optional, ghi audit sạch hay tự đặt tiêu chí mới “0 moderate”; không `audit fix --force` |
| G10-A07 | **OPEN / NOT RUN — NFR thiết bị G10-T02/T05 chưa khép:** barcode/màn hình cảm ứng vật lý chưa kiểm tra thật | PO/QA bố trí thiết bị thực và lưu evidence | Mô phỏng không chứng minh tương thích hardware. Chưa có quyết định cụ thể thay đổi yêu cầu; không tự đưa gate này sang G11 |
| G10-A08 | **DEFERRED / NOT RUN — backlog G11-T02/T03:** CI/Linux/Pages đúng SHA release chưa được xác minh; không phải hoãn CI hiện có | Theo PO cho phép backlog phần không bắt buộc G10 và roadmap G11 đã duyệt; người triển khai/QA thực hiện sau G10 qua gate và G11-T01 checkpoint | Chưa biết kết quả workflow/Linux/artifact/Pages trên SHA release; local PASS không chứng minh deploy thành công. Gate này vẫn bắt buộc trước nghiệm thu G11; chưa thực hiện/chuyển G11, không tự dispatch/deploy |

## Đối chiếu gate bắt buộc để nghiệm thu G10

Theo [PLAN_PHASE_10.md](PLAN_PHASE_10.md), T01–T06 và mục 12/15, cùng điều kiện hoàn tất trong [MASTER_PLAN_COCO.md](../MASTER_PLAN_COCO.md):

- A01–A07 chưa đủ điều kiện khép; không có căn cứ xác định chúng là phần không bắt buộc để chuyển backlog theo quyết định PO chung.
- Cần đủ bằng chứng UC/BR/SC/NFR theo phạm vi đã duyệt, giải quyết blocker, giữ ngưỡng test visual; các ca chưa kiểm vẫn NOT RUN. A04 áp dụng phân loại G10-D07: sai lệch thẩm mỹ nhỏ được chấp nhận không phải lỗi chức năng cần sửa, không đòi pixel-perfect hoặc mở lại phần đã PASS.
- **G10-T06 / gói evidence cuối — PENDING REVIEW:** phải khép regression G2–G9, checks bắt buộc và triage; source/test guard, screenshot, SHA/phạm vi phải phù hợp bản nghiệm thu. Chỉ tái dùng evidence còn hợp lệ; không coi số PASS cũ là lượt chạy mới hoặc tự bỏ full suite bắt buộc tại gate. Lượt cập nhật này không chạy test/build.
- G9 đã nghiệm thu chỉ khép tiền đề G9; không tự nghiệm thu G10. A08 được ghi backlog release G11 vốn có, không thay đổi thứ tự task/dependency.

BR-UC1-07 là tiền điều kiện nhân viên kiểm định hàng ngoài hệ thống, không phải chức năng tự thẩm định theo 1/2/3. Không tạo checklist/UI/database kiểm định để “đóng” yêu cầu này.

**Kết luận: G10 giữ IN PROGRESS.** Còn A01–A07 và việc khép gói kiểm chứng cuối; không có WAIVED, A08 DEFERRED vẫn NOT RUN. Chỉ đề xuất khép phase khi checklist/evidence và các quyết định được xử lý đúng thẩm quyền. Theo chỉ đạo lượt này: chưa commit/push, không deploy và chưa chuyển G11; không sửa code, xóa test hoặc thay roadmap.
