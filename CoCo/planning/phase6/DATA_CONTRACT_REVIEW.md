# Hợp đồng dữ liệu G6 cần quyết định trước triển khai

## Quyết định hiện hành

Theo chỉ đạo tiếp theo “hoàn thành hết các phần còn lại trong T05”, đã hiểu và áp dụng bảng mã vừa đề xuất để kích hoạt runtime. Hóa đơn mới 1 = Hoàn tất; sản phẩm mới 1 = Đang bán, 2 = Đã bán. Cách hiểu chỉ đạo đã được nêu trước khi sửa và được ghi trong [báo cáo T05](T05_EXECUTION.md) để người dùng kiểm tra. Mapping lưu chung tại `src/domain/purchase-status.ts` và snapshot theo từng hóa đơn bằng appMetadata trong cùng transaction. Numeric legacy tiếp tục giữ raw value, không tự nhận ý nghĩa từ bảng mã mới. Ghi chú OPEN của mốc candidate bên dưới đã được thay thế cho mapping này.

Ngày 11/11/2026, người dùng xác nhận: **“Nghiệm thu T01, cho phép kích hoạt P03/P04 và làm T02”**. T01 đã được nghiệm thu; P03/P04 runtime APPROVED_USER. Không suy ra nghiệm thu G5 hoặc toàn bộ G6 từ xác nhận này.

Migration additive v4 hiện được đăng ký trong CoCoDatabase runtime. Sáu store: purchaseDrafts, purchaseLines, purchaseApprovals, purchaseNotices, purchaseFinalizations, purchaseProvenance. Giữ nguyên khóa/quan hệ/status số legacy; draft không viết hóa đơn hoặc khách giả.

T02 bổ sung metadata tùy chọn position (thứ tự dòng), removedAt (bỏ dòng nhưng giữ snapshot request). Bỏ dòng/hủy draft dùng CAS, quyền, audit và receipt trong transaction. T03 chỉ được quyết định request của dòng **chưa removedAt** và draft **editing**, đúng revision/snapshot; request lịch sử vẫn pending trong dữ liệu nhưng không đủ điều kiện xử lý. Không phát minh trạng thái legacy hoặc trạng thái request “cancelled”.

Producer quyết định T03 và consumer T04 đã tích hợp runtime, chờ review/nghiệm thu. [Báo cáo T04](T04_EXECUTION.md) ghi rõ notice/read acknowledgement và price revision. Theo UC1.1 nhánh từ chối quay lại bước 7, việc nhập lại giá giữ lineId và tăng revision, giữ nguyên request/decision cũ, tạo request mới nếu vượt Max và bind snapshot khung giá đang hiển thị. Đây là hiện thực luồng nhập lại giá đã có trong T04; các thay đổi loại/brand/số lượng ngoài luồng này tiếp tục OPEN. Finalize vẫn T05, mapping số TrangThai cho sản phẩm/hóa đơn mới tiếp tục OPEN. Công thức giá đầu và BR-UC1-07 đã chốt. Xem [T02_EXECUTION.md](T02_EXECUTION.md).

## Hồ sơ trước xác nhận T01 — lịch sử

Các ghi chú chưa kích hoạt/chưa có UI bên dưới mô tả mốc trước xác nhận, không thay trạng thái hiện tại ở trên.

> Lượt tiếp tục khép FK candidate: nhánh chọn FK theo provenance đã bổ sung trong repository, chỉ chạy khi DB candidate có schema/metadata định dạng mới; runtime v3 vẫn theo FK legacy cũ. Adapter từ chối metadata mới thiếu/sai thay vì fallback. [T01_REVIEW_GATE.md](T01_REVIEW_GATE.md) tách rõ phần T01 kiểm chứng và phần producer/UI T02–T07 chưa triển khai. Candidate được chuẩn bị để review, **chưa tự DONE hoặc kích hoạt P03/P04**.

> **Cập nhật theo xác nhận mới:** P03/P04 được đồng ý về nguyên tắc và cho phép hoàn thiện candidate/adapter/FK/provenance/transaction service trong T01, **KHÔNG được kích hoạt runtime trước đối chiếu và nghiệm thu**. BR-UC1-07 đã chốt là nhân viên kiểm tra thực tế trước khi nhập; hàng không đạt từ chối ngoài hệ thống, không thêm chức năng/bảng/trạng thái kiểm định. Giá bán ban đầu đã được xác nhận riêng: giá mua thực tế từng món ×1,30, làm tròn gần nhất và 0,5 lên. Các ghi chú “chưa xác định giá”/Q20 dưới đây giữ làm lịch sử, không thay quyết định mới này.

## Đối chiếu P03 và P04 để nghiệm thu kích hoạt

| Hạng mục | P03 — draft/yêu cầu trước hoàn tất | P04 — chi tiết nhiều giá và truy vết |
|---|---|---|
| Vấn đề gốc | Hóa đơn cần khách thật và request cần invoice FK; SRS cho nhập/gửi duyệt trước chọn khách | Khóa `[MaHDTM,MaKhungGia]` không biểu diễn hai dòng cùng khung nhưng khác đơn giá |
| Candidate mới | `purchaseDrafts` PK id; `purchaseLines` PK id + draftId; `purchaseApprovals` PK id + draft/line/revision/snapshot; `purchaseNotices` PK id + request/recipient | `purchaseFinalizations` PK invoiceId, unique draftId + immutable line snapshots/totals/times; `purchaseProvenance` PK productId + invoiceId/lineId/unitCost |
| Legacy | Không viết draft vào bảng hóa đơn/request cũ, không tạo khách/hóa đơn giả; giữ raw status | Không sửa PK/chia/gộp/bình quân chi tiết cũ; adapter chọn đúng nguồn theo metadata, không cộng hai lần |
| Đã có code | Schema/validation; transaction lưu draft/line/pending request kiểm phiên/quyền, FK, expectedRevision, audit/receipt; snapshot giá vượt Max gắn dòng | Validator graph/provenance/chi phí/số món, reader legacy/new; công thức giá bán đầu nguyên đồng |
| Còn OPEN trước kích hoạt | Contract sửa/hủy dòng và vô hiệu hóa request cũ; cần nghiệm thu linkage tổng thể. Workflow quyết định/delivery là T03/T04, chưa triển khai | Nhánh FK sản phẩm mới đã phân biệt rõ theo marker/provenance và có test; command finalize là T05 chưa triển khai; mapping mã số của bản ghi mới chưa được tự gán |
| Quyền kích hoạt tại mốc lịch sử | CHƯA PHÊ DUYỆT lúc lập bảng; nay APPROVED_USER như đầu tài liệu | CHƯA PHÊ DUYỆT lúc lập bảng; nay APPROVED_USER như đầu tài liệu |

Runtime vẫn CoCoDB v3/21 store; candidate thử nghiệm v4/27 store chỉ thêm 6 store. Migration candidate không có đường gọi từ app/router/provider. Giá bán đầu dùng BigInt `(cost*13+5)/10`, kiểm tràn miền số an toàn; chưa áp vào bản ghi thật khi chưa có command finalize được nghiệm thu.

Identity candidate dùng MaNV ổn định và alias G5 để đọc actor cũ sau rename, không sửa historical actor. Guard vẫn yêu cầu session mới hợp lệ; audit của lệnh mới ghi username hiện tại. Đây là adapter kỹ thuật đã bổ sung để kiểm thử, không phải phê duyệt kích hoạt P03/P04.

### Q20 đã chốt — điều kiện ngoài hệ thống

Nhân viên kiểm tra thực tế, hàng không đạt bị từ chối ngoài hệ thống; chỉ hàng được nhận mới nhập giao dịch. Hệ thống chỉ validate trường bắt buộc/số lượng/giá/khung giá/duyệt >Max. Không thêm bảng, trạng thái, checklist kiểm định, nút Đạt/Không đạt hoặc tự loại hàng theo mã 1/2/3. Checklist QA và kiểm tra thủ công phần mềm nằm trong [ACCEPTANCE_CHECKLIST.md](ACCEPTANCE_CHECKLIST.md), tách khỏi BR-UC1-07.

### Giá bán ban đầu đã chốt

`initialSalePrice(unitCost)` = giá mua thực tế **từng món** ×1,30, làm tròn gần nhất (0,5 lên), không lấy trung bình dòng. `GiaGocChuKyGiam` và `GiaBanHienHanh` ban đầu cùng mức này; thời điểm bắt đầu chu kỳ theo mapping lần nhập kho được ghi trong command. Khi chủ sửa giá, xử lý reset chu kỳ ở đúng G7 theo SRS, không sửa `NgayNhapKho`. Không triển khai scheduler/G7 trước thứ tự.

> Sau chỉ đạo bắt đầu G6: đề xuất đã được cụ thể hóa một phần thành `src/domain/purchases.ts`, migration candidate `src/db/purchase-metadata.ts` và 19 test PASS. **Chưa kích hoạt migration**, chưa đủ adapter/FK/provenance/finalization và chưa triển khai nghiệp vụ/UI. Trạng thái phê duyệt P03/P04/Q20 vẫn đang chờ xác nhận; xem [báo cáo](REPORT_PHASE_6.md). Code thử nghiệm không phải bằng chứng contract đã được người dùng chốt.

Rà soát 11/11/2026 trên HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`, nhánh `coco/phase-5-staff`. **ĐỀ XUẤT, CHƯA ÁP DỤNG MIGRATION**. Không thay roadmap hoặc quyết định local/no Supabase. Nguồn: MASTER_PLAN mục F, PLAN_PHASE_6 mục 8–9, P03/P04/P09, SRS UC_1.1/UC_6 và schema/constraints G2 hiện tại.

## Mâu thuẫn đã xác minh trong source

1. `hoaDonThuMua.MaKH` bắt buộc và được kiểm FK; `yeuCauPheDuyetGia.MaHDTM` cũng bắt buộc có hóa đơn thật. SRS cho nhập món/gửi duyệt trước bước chọn khách và hoàn tất. Vì vậy không thể chỉ gắn trạng thái draft vào hóa đơn hiện tại khi chưa có khách; không tạo khách hoặc hóa đơn hoàn tất giả để vượt FK.
2. `chiTietHoaDonTM` có khóa `[MaHDTM, MaKhungGia]`, một `DonGia` nguyên đồng dương, `ThanhTien = SoLuong * DonGia`. Hai dòng cùng khung giá với đơn giá 80.001 và 120.000 đồng, mỗi dòng một món, có tổng 200.001 đồng. Gộp hai món đòi đơn giá 100.000,5 đồng, trái validation; lấy giá đầu hoặc làm tròn làm sai tổng. `productCosts` đã duyệt lưu giá từng món nhưng không tự giải quyết nghĩa/khóa của dòng hóa đơn gốc.
3. BR-UC1-07 đòi hàng đạt tiêu chí chất lượng cửa hàng. Đã có danh mục `3=Mới/2=Tốt/1=Khá`; chưa tìm thấy tiêu chí nhận/loại hàng tương ứng trong các nguồn đã kiểm. Không được coi mã độ mới là một thuật toán thẩm định đã được duyệt.

## Phương án cụ thể đề nghị duyệt cho P03/P04

- Giữ nguyên các bảng G2 và dữ liệu cũ. Thêm store metadata có schema/version rõ cho draft và từng dòng có `lineId`; mỗi dòng giữ khung giá, tình trạng, số lượng, đơn giá và snapshot tên/loại/brand tại thời điểm nhập. Cùng một khung giá được có nhiều dòng, không bình quân giá.
- Draft chưa chọn khách được lưu trong store draft, chưa ghi vào `hoaDonThuMua`; yêu cầu duyệt draft có liên kết tới draft/line trong metadata mới, không giả FK tới hóa đơn chưa tồn tại. Request/decision/notification mới có discriminator phiên bản nguồn và kiểm liên kết thực trong cùng transaction. Các liên kết G2 cũ tiếp tục được kiểm nguyên trạng.
- Khi hoàn tất, tạo `hoaDonThuMua` với khách thật và các dòng thu mua có ID trong store mới. Dữ liệu mới sử dụng dòng có ID làm nguồn chi tiết; không ép ghi một dòng gộp sai vào `chiTietHoaDonTM`. Mỗi sản phẩm mới có liên kết truy vết tới đúng dòng; validator nhận biết định dạng mới bằng marker đã lưu trong cùng transaction, vẫn kiểm FK hóa đơn/khung giá và tổng tiền. Bản ghi legacy tiếp tục dùng khóa/validator G2 cũ. Đây là mở rộng mô hình chi tiết, cần quyết định vì khác biểu diễn entity gốc trong Design.
- Migration chỉ thêm store/index/marker; không đổi/xóa/bình quân giá dữ liệu cũ, không tự phân loại ý nghĩa số `TrangThai` legacy. Đọc legacy và định dạng mới có adapter riêng; báo cáo đối soát dùng đúng nguồn, không cộng hai lần.
- Trạng thái metadata dùng literal có namespace: draft `editing/finalized/cancelled`, dòng `priced/pending/approved/rejected`, quyết định `pending/approved/rejected`. Chuyển trạng thái theo SRS, owner-only quyết định pending, CAS và operation receipt chống lặp. Chỉ finalized mới nhập kho/ghi nhận chi phí. Mapping các cột số của bản ghi mới phải được ghi trước coding và kiểm thử, không diễn giải lại legacy.
- `finalizedAt/paidAt/subtotal/paidTotal` và cost từng món là snapshot nguyên đồng, cùng transaction; lỗi ghi ở bất kỳ bước nào rollback cả receipt/audit/stock. Không lấy giá hiện tại tính lại lịch sử. Với quyết định duyệt/từ chối, transaction lưu event thông báo bền chờ phát; lỗi phát tín hiệu sau commit là nhánh UC6 bước 9a, giữ quyết định và thử phát lại cùng event, không rollback quyết định đã commit hoặc tạo quyết định trùng.

Phương án này giữ kiến trúc browser/local và bảo toàn dữ liệu G2, nhưng mở rộng mô hình liên kết của định dạng giao dịch mới. Chưa sửa `schema.ts`, `records.ts`, repository hoặc nghiệp vụ để áp dụng đề xuất.

Việc phát lại event là xử lý kỹ thuật khi mở lại màn hình/khôi phục subscription; không tự thêm control Retry vào SC137/SC144 chỉ có nút X theo nguồn. Cơ chế này không ghi lại quyết định và không được tuyên bố đã giao đến tab nhận chỉ vì gọi BroadcastChannel thành công.

## Quyết định chất lượng Q20 còn thiếu

Đề nghị người dùng xác định người nhập đánh giá thủ công và chịu trách nhiệm hàng đủ điều kiện theo quy định cửa hàng, hay cung cấp checklist nhận/loại hàng cụ thể để validation. Không tự thêm checkbox hoặc ngưỡng kiểm định chưa có trong Design/SRS. Danh mục Mới/Tốt/Khá tiếp tục giữ nguyên trong cả hai phương án.

## Mapping còn cần trước T05 hoàn tất thu mua

`sanPham` G2 bắt buộc có `GiaGocChuKyGiam`, `GiaBanHienHanh`, `TrangThai`, ngày nhập và ngày bắt đầu chu kỳ. UC_1.1 nhập giá thu mua nhưng chưa xác định giá bán ban đầu; BR-UC2-04/09 chỉ mô tả giá hiển thị và chu kỳ giảm, không cung cấp hệ số khởi tạo. Validation money ở repository chấp nhận 0 không phải quyết định nghiệp vụ cho giá bán. T01 phải đối chiếu/bổ sung mapping, và trước T05 nếu nguồn vẫn thiếu phải trình phương án cụ thể để quyết định; không tự lấy 0, giá mua, Max hoặc hệ số. Đây là dependency dữ liệu của T05, không thêm phase/task mới hoặc triển khai trước CRUD/scheduler G7; không chặn công việc G6 độc lập đã đủ điều kiện.

## Kiểm thử sau khi chốt

Migration giữ nguyên sentinel/legacy; draft không khách không tạo dữ liệu giả; hai dòng cùng khung giá khác giá/tổng lẻ; finalize atomic và retry; pending/rejected không nhập kho; hai chủ quyết định đồng thời; staff không duyệt; thông báo không F5 và session riêng hai tab; history/stock/cost đối soát; demo A–F và full regression. Tất cả kiểm thử nghiệp vụ G6 hiện **NOT RUN**, không coi tài liệu này là hiện thực chức năng.
