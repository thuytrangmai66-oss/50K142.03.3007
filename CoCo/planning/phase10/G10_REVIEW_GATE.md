# G10 — Gói review điều kiện chuyển G11

> **Quyết định mới nhất 14/11/2026 — G10-D08: PO APPROVED RELEASE G11.** A01–A07 được PO chấp nhận tạm thời **ACCEPTED FOR RELEASE / DEFERRED**, không phải đã sửa hoặc PASS; chúng không chặn release được chỉ định này. G10 vẫn chưa được chứng nhận đầy đủ. G11-T02 được phép thực hiện nhưng CI/CD, kiểm tra dữ liệu riêng và smoke đúng SHA vẫn bắt buộc. [Báo cáo release](../phase11/RELEASE_EXECUTION.md).

## Hồ sơ kiểm chứng trước quyết định release — giữ nguyên kết quả gốc

Ngày 14/11/2026, trước G10-D08: **G10 IN PROGRESS / chưa đủ gate nghiệm thu đầy đủ.** G9 đã được Product Owner xác nhận nghiệm thu. Những giới hạn chưa chuyển G11/chưa commit-push trong hồ sơ bên dưới là chỉ đạo lịch sử trước phê duyệt release mới; không thay thế G10-D08.

## Quyết định Product Owner — 14/11/2026

- **G9 đã nghiệm thu.** Các dòng G9 PENDING REVIEW trong kế hoạch/báo cáo trước xác nhận này là lịch sử; việc nghiệm thu G9 không tự nghiệm thu G10.
- PO cho phép đưa yêu cầu **không bắt buộc trong G10** sang backlog G11, nhưng phải giữ tình trạng chưa hoàn thành và ghi rõ rủi ro. Quyết định này không cho phép tự phân loại yêu cầu UC/BR/SC/NFR bắt buộc thành tùy chọn.
- Không chuyển DEFERRED hoặc WAIVED thành PASS. PO chưa miễn trừ cụ thể gate nào; không coi việc cho phép backlog là duyệt toàn bộ ngoại lệ.
- Lượt cập nhật G9/backlog trước đó chỉ sửa hai tài liệu gate, không chạy test/build, xóa test, commit/push/deploy hoặc bắt đầu G11.
- **Ưu tiên thực tế UI — G10-D07:** PO chấp nhận sai lệch thẩm mỹ nhỏ không ảnh hưởng nghiệp vụ/chức năng/khả năng dùng/tính nhất quán quan trọng; không yêu cầu giống Figma 100%, tinh chỉnh pixel-perfect, mở lại phần đã PASS hoặc thêm test chỉ vì thẩm mỹ. A04 phân loại nghiêm trọng / đáng sửa / có thể chấp nhận theo bằng chứng và ảnh hưởng thực tế; chỉ xử lý hai nhóm đầu khi thực sự ảnh hưởng sản phẩm. [Phân loại và sổ sai lệch được chấp nhận](T03_VISUAL_REVIEW.md). Không tự đổi ngưỡng test hoặc tiêu chí bắt buộc khác.

## Phân biệt trạng thái và đối chiếu điều kiện bắt buộc

| Trạng thái | Phạm vi hiện tại |
|---|---|
| PASS | Chỉ các kết quả có evidence đúng phạm vi được liệt kê bên dưới; không phải PASS toàn bộ G10. G9 là **đã nghiệm thu bởi PO**, không phải kết quả test mới. |
| WAIVED | **Không có gate được PO miễn trừ cụ thể.** WAIVED nếu được duyệt sau này vẫn là yêu cầu không được kiểm chứng/đáp ứng, không phải PASS. |
| DEFERRED | **G10-A08**, riêng xác minh CI/Linux/Pages đúng SHA release, được ghi backlog G11-T02/T03 vốn đã có trong roadmap; kết quả thực thi vẫn **NOT RUN**. Không hoãn hoặc tắt CI hiện có. |
| BLOCKED | **G10-A01** vẫn bị chặn bởi mâu thuẫn SRS/Figma; giữ nguyên chỉ đạo chưa thêm trường UI. |
| OPEN / PARTIAL / PENDING | A02–A07 và phần khép evidence/regression cuối chưa đủ; không phải PASS, WAIVED hoặc đã hoàn thành chỉ vì được phép chuyển mục không bắt buộc sang backlog. |

Đối chiếu [MASTER_PLAN_COCO.md](../MASTER_PLAN_COCO.md), mục C và điều kiện hoàn tất; [PLAN_PHASE_10.md](PLAN_PHASE_10.md), T01–T06 và mục 12/15:

1. **G10-T01/T02:** đầy đủ MAIN/ALT/ERR/control của 27 UC, 98 BR và 7 NFR theo tiêu chí được duyệt; A01/A02/A03/A05/A06/A07 chưa khép. Review assertion 98 BR không thay thế kiểm chứng UI/từng nhánh.
2. **G10-T03:** kiểm chứng visual/action theo phạm vi 297 SC; áp dụng phân loại tác động G10-D07, không đặt yêu cầu giống Figma 100% hoặc sửa sai lệch nhỏ đã được chấp nhận. Ngưỡng test đã duyệt giữ nguyên. A04 chưa khép vì thiếu bằng chứng ở các trạng thái, còn 88 SC cần rà nguồn/annotation/alias; không tự hoãn phần kiểm chứng bắt buộc này.
3. **G10-T04/T05:** đủ bằng chứng security, quyền, transaction/rollback, tương tác, hiệu năng và thiết bị theo yêu cầu. Số đo p50/p95 không thay SLA; mô phỏng không thay thiết bị thật; production audit 0 không tự khép rủi ro 7 moderate của công cụ lint.
4. **G10-T06 và gate cuối:** kết quả các kiểm tra bắt buộc, regression nền G2–G9, lint/typecheck/build, source/test guard và screenshot phải còn hợp lệ với bản nghiệm thu; mọi thiếu sót/FAIL được xử lý, 0 blocker chưa khép và có review. Evidence cũ chỉ tái dùng khi đầu vào liên quan còn phù hợp, không tạo kết quả chạy mới.

Các mục trên vẫn bắt buộc; không tự đưa sang G11. A08 được tách vì [kế hoạch G11](../phase11/PLAN_PHASE_11.md), T02/T03 đã quy định xác minh workflow đúng SHA và Pages sau checkpoint/release; đây không phải miễn trừ checks local hay thiết lập CI từ đầu dự án.

### Backlog G11 được ghi nhận, chưa thực hiện

| Mục | Trạng thái thực thi giữ nguyên | Dependency / người xử lý | Rủi ro còn nguyên |
|---|---|---|---|
| G10-A08 → G11-T02/T03 | **DEFERRED / NOT RUN** | G10 qua gate, G11-T01 checkpoint và đủ điều kiện release; người triển khai/QA dùng workflow hiện có. G11 chưa bắt đầu. | Chưa xác minh CI/Linux, artifact và Pages trên đúng SHA release; local PASS không chứng minh build/deploy/production smoke thành công. Phải khép ở gate G11, không tính PASS G10 từ việc ghi backlog. |

Chưa có căn cứ xác định các mục A01–A07 là không bắt buộc trong G10; giữ nguyên trạng thái thiếu. Chi tiết, owner và rủi ro tại [ACCEPTANCE_GAPS.md](ACCEPTANCE_GAPS.md).

## Bằng chứng có thể review

- [Popup khách hàng](CUSTOMER_VISUAL_EXECUTION.md): tám modal hai role đúng khung/pixel nguồn, giữ nguyên ngưỡng; sửa riêng class luồng xóa. Ghi cả các lượt FAIL và nguyên nhân.
- [Assertion 12 BR khách hàng](CUSTOMER_BR_REVIEW.md): 13 unit mới, hai E2E mới; invalid/duplicate/race/history độc lập, không ghi dở dang.
- [Execution cuối](BR_REVIEW_EXECUTION.md):538 unit,167 Chromium,8 visual local PASS; lint/typecheck/build PASS,22 file bundle giống hệt và guard cuối191 file không đổi. Static audit5/5 được tái dùng với đầu vào runtime không đổi, không gọi là lượt chạy mới. Không dùng các lượt FAIL hoặc số PASS lịch sử thay kết quả mới.
- [Ledger từng SC](evidence/audit/visual-execution-ledger.json): 297 trạng thái, 209 nguồn sạch/88 cần review nguồn; component PASS tách khỏi kết quả toàn màn hình.
- [Tương thích schema/contract](SCHEMA_COMPATIBILITY.md) và [checkpoint GitHub/release](RELEASE_READINESS.md): không đổi schema, đúng origin/SHA, Actions cũ thất bại không được coi deploy mới.
- README cập nhật tiến độ thực tế, khởi chạy và demo hai tab; không còn mô tả module hiện có là chưa triển khai từ mốc G6-T02.
- [Tối ưu test tối thiểu](test-suite-audit/MINIMAL_OPTIMIZATION.md): 23 ca được tách setup DB, 138/138 ca liên quan, lint 6 file và typecheck PASS trong lượt đã ghi nhận; assertion/case không đổi. Không phải full suite hoặc nghiệm thu G10 mới.

Tất cả số PASS trên là evidence từ các execution đã có, có giới hạn phạm vi; lượt cập nhật quyết định PO này không chạy kiểm tra mới.

## Phần người triển khai phải tiếp tục khép

1. Hoàn tất bằng chứng visual/action-state SC còn thiếu theo nguồn phù hợp và phân loại G10-D07. Giữ các phần đã PASS, ghi riêng sai lệch nhỏ chấp nhận được, không tinh chỉnh pixel-perfect hoặc tạo test mới chỉ vì thẩm mỹ. 8 modal + SC105 picker không thay 297 màn hình. Không tự dùng runtime baseline hoặc che UI bằng mask. 88 trạng thái chưa ánh xạ export sạch cần kiểm annotation/alias; source hiện có không tự là kết quả kiểm thử.
2. Đã đối chiếu nội dung assertion98/98 BR theo BR_REVIEW_EXECUTION.md; còn khép đủ MAIN/ALT/ERR/control của27 UC và các UI negative field cases. Phân biệt assertion review với nghiệm thu UI/NFR; không đổi các dòng lịch sử NOT IMPLEMENTED thành PASS bằng tên file hoặc tổng test.
3. Giữ đủ regression và triage FAIL; chỉ báo kết quả từ lệnh đã kết thúc. Full source/test guard và screenshot phải gắn với cùng bản kiểm.

Đây là công việc kiểm chứng còn lại, **không được tự trình bày như chỉ cần chủ dự án ký là đã kiểm đủ**.

## Đầu vào/ngoại lệ cần chủ dự án chốt

| Mục | Quyết định hiện hành | Cần chốt trước khi coi gate đạt |
|---|---|---|
| BR-UC1-16 / ngoại lệ chi tiết G8 | Giữ Figma, Nhân viên/Trạng thái ở UI còn BLOCKED | Giữ blocker; hoặc phê duyệt ngoại lệ release cụ thể; hoặc duyệt xử lý mâu thuẫn SRS/UI. Không tự thêm hai dòng |
| Q21/P11 | Đo trước; chưa duyệt phím tắt/mức giá nhanh | Danh sách hành vi/phím/mức giá nếu cần triển khai, hoặc quyết định phạm vi/ngoại lệ riêng. Không lấy control đang có làm đủ NFR |
| SLA | Chưa có ngưỡng được duyệt | Review cách đo/dataset/máy, chốt tiêu chí hoặc ngoại lệ. Timeout của Playwright không phải SLA |
| Thiết bị thật | Mới có Chromium touch/input mô phỏng | Kiểm thử trên thiết bị thực và bằng chứng, hoặc phê duyệt giới hạn release; không báo hardware PASS từ mô phỏng |
| Lint audit | Production audit 0; toàn bộ còn 7 moderate | Registry đã kiểm lại: typescript-eslint mới nhất 8.72.2 vẫn trong range cảnh báo, minimatch mới nhất 11.0.8 là major khác. Chưa có tổ hợp vá tương thích được duyệt; cần review riêng nếu override/nâng major tiếp, hoặc quyết định xử lý rủi ro công cụ lint. Không tự cài major/force audit |

Quyết định PO mới đã nghiệm thu G9 và cho phép backlog đối với phần không bắt buộc G10; **chưa duyệt WAIVED cho gate cụ thể hoặc nghiệm thu G10/G11**. Việc chọn “lập gói release có ngoại lệ để review” trước đây cũng không phải duyệt ngoại lệ. Không gộp quyết định giữ Figma thành miễn trừ SRS, không dùng chỉ đạo Git làm quyền tự chốt nghiệp vụ.

## Sau khi đủ điều kiện

Giữ thứ tự G11-T01 checkpoint → T02 workflow đúng SHA → T03 Pages smoke trong profile riêng → T04 rollback/roll-forward trên bản sao → T05 bàn giao/nghiệm thu. Quy trình Git theo AGENTS chỉ áp dụng khi đủ scope/gate và không có chỉ đạo mới hơn. **Chỉ đạo lượt này: chưa commit/push, chưa chuyển G11.** G10 tiếp tục IN PROGRESS vì A01–A07 và việc khép gói kiểm chứng cuối còn thiếu; không đánh dấu G10/G11 DONE.
