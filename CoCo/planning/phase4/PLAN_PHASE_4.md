# Kế hoạch Giai đoạn 4 Dữ liệu tham chiếu khách hàng và khung giá

Ngày 11/11/2026. **READY FOR REVIEW** theo chỉ đạo thực hiện G4 và sửa kích thước; đã code customer/history/bracket, responsive và test. Giữ local IndexedDB/sessionStorage, không Supabase theo quyết định chốt mới. Mapping độ mới 3=Mới/2=Tốt/1=Khá được duyệt, không tự chuyển dữ liệu cũ. Xem [REPORT_PHASE_4.md](REPORT_PHASE_4.md). Không commit/push/deploy; G5/G6 giữ đúng thứ tự.

## 1 Mục tiêu

CRUD và tìm khách hàng, truy vấn lịch sử, quản lý khung giá theo quyền; tạo các điều kiện dữ liệu thật cho Thu mua/Bán hàng.

## 2 Nguồn và yêu cầu

UC_4.1, UC_4.2, UC_4.3, UC_4.4, UC_4.5, UC_4.6, UC_5.1, UC_5.2, UC_5.3. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

SC075, SC076, SC077, SC078, SC079, SC080, SC081, SC082, SC083, SC084, SC085, SC086, SC087, SC088, SC089, SC090, SC091, SC092, SC093, SC094, SC095, SC096, SC097, SC098, SC099, SC100, SC101, SC102, SC103, SC104, SC163, SC164, SC165, SC166, SC167, SC168, SC169, SC170, SC171, SC172, SC173, SC174, SC175, SC176, SC177, SC178, SC179, SC180, SC181, SC182, SC183, SC184, SC185, SC186, SC187, SC188, SC189, SC190, SC191, SC267, SC268, SC269, SC270, SC271, SC272, SC273, SC274, SC275, SC276, SC277, SC278, SC279, SC280, SC281, SC282, SC283, SC284, SC285, SC286, SC287, SC288, SC289, SC290, SC291, SC292, SC293, SC294, SC295, SC296, SC297

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

CRUD và tìm khách hàng, truy vấn lịch sử, quản lý khung giá theo quyền; tạo các điều kiện dữ liệu thật cho Thu mua/Bán hàng. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

| Nhóm | Component dự kiến |
|---|---|
| UI16 / Danh sách khách hàng | CustomerSearchTable |
| UI17 / Thông tin khách hàng | CustomerDetail |
| UI18 / Tạo thông tin khách hàng | CustomerCreateDialog |
| UI19 / Sửa thông tin khách hàng | CustomerEditForm |
| UI20 / Lịch sử mua của khách hàng | CustomerPurchases |
| UI21 / Lịch sử bán của khách hàng | CustomerSales |
| UI35 / Danh sách khung giá thu mua | PriceBracketTable |
| UI36 / Thông tin khung giá thu mua | PriceBracketDetail |
| UI37 / Tạo khung giá thu mua | PriceBracketCreateForm |
| UI38 / Sửa khung giá thu mua | PriceBracketEditForm |

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

khachHang, memberships (chỉ lưu sự kiện được duyệt), khungGiaThuMua; hóa đơn/chi tiết read-only cho lịch sử. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

src/features/customers/, src/features/price-brackets/, src/services/customers.ts, src/services/price-brackets.ts, src/components/ui/, tests/unit/customers*, tests/e2e/reference-data*, src/components/invoices/, src/services/invoice-queries.ts. Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [x] G4-T01 | Đọc/sửa/tìm khách theo 10 chữ số; giữ 0 đầu; validation tên/phone và unique ở DB, không chỉ form | Nguồn UC/BR/SC + code G2 và task trước trong phase | CustomerService và UI16–19, dùng cùng form ở các luồng liên quan | src/features/customers/, src/features/price-brackets/, src/services/customers.ts, src/services/price-brackets.ts, src/components/ui/, tests/unit/customers*, tests/e2e/reference-data*, src/components/invoices/, src/services/invoice-queries.ts | TC-BR-UC4-01..06; TC-UC4-4-MAIN |
| [x] G4-T02 | Xác nhận xóa/hủy; kiểm tra đã phát sinh hóa đơn trong cùng transaction; không cascade lịch sử | Nguồn UC/BR/SC + code G2 và task trước trong phase | UC4.3 và modal kết quả/lỗi | src/features/customers/, src/features/price-brackets/, src/services/customers.ts, src/services/price-brackets.ts, src/components/ui/, tests/unit/customers*, tests/e2e/reference-data*, src/components/invoices/, src/services/invoice-queries.ts | TC-UC4-3-MAIN; TC-UC4-3-ALT-01 |
| [x] G4-T03 | Truy vấn lịch sử mua/bán theo MaKH; xây sớm PurchaseDetail/SalesDetail read-only và invoice query để G4 không phụ thuộc editor G6/G8; empty/error và fixture chỉ trong test | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI20/21 và SC chi tiết lịch sử; G6/G8 reuse viewer rồi kiểm lại với giao dịch thật | src/features/customers/, src/features/price-brackets/, src/services/customers.ts, src/services/price-brackets.ts, src/components/ui/, tests/unit/customers*, tests/e2e/reference-data*, src/components/invoices/, src/services/invoice-queries.ts | TC-UC4-5-MAIN; TC-UC4-6-MAIN |
| [x] G4-T04 | Owner xem/tạo/sửa khung giá; Min/Max >0, Min≤Max, unique tổ hợp; staff gọi trực tiếp cũng bị từ chối | Nguồn UC/BR/SC + code G2 và task trước trong phase | UI35–38, PriceBracketService + optimistic version | src/features/customers/, src/features/price-brackets/, src/services/customers.ts, src/services/price-brackets.ts, src/components/ui/, tests/unit/customers*, tests/e2e/reference-data*, src/components/invoices/, src/services/invoice-queries.ts | TC-BR-UC5-01..09 |
| [x] G4-T05 | Tìm kiếm/pagination/filter/reset đúng mô tả; thay đổi giá không hồi tố giao dịch và cost snapshot | Nguồn UC/BR/SC + code G2 và task trước trong phase | query repository có index, UI loading/empty/error | src/features/customers/, src/features/price-brackets/, src/services/customers.ts, src/services/price-brackets.ts, src/components/ui/, tests/unit/customers*, tests/e2e/reference-data*, src/components/invoices/, src/services/invoice-queries.ts | TC-P4-FILTER; TC-P4-HISTORICAL-COST |
| [ ] G4-T06 | Regression quyền, popup/hủy, XSS chuỗi tên, xung đột hai tab; đối chiếu mọi SC của phase | Nguồn UC/BR/SC + code G2 và task trước trong phase | bộ test có mapping vào UC/BR/SC | src/features/customers/, src/features/price-brackets/, src/services/customers.ts, src/services/price-brackets.ts, src/components/ui/, tests/unit/customers*, tests/e2e/reference-data*, src/components/invoices/, src/services/invoice-queries.ts | TC-P4-CONCURRENT-EDIT |

T06: code/test hồi quy đã thực thi; checkbox visual còn mở vì chưa có full pixel baseline/mask được nghiệm thu. T01–05 đánh dấu phần code, không tự coi toàn phase DONE.

## 9 Thứ tự và dependency

G3: service auth/permission + primitives; G2: schema/constraints. Làm T01 → T02 → ... theo thứ tự bảng, mỗi task có test trước khi tích hợp. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_4.1, UC_4.2, UC_4.3, UC_4.4, UC_4.5, UC_4.6, UC_5.1, UC_5.2, UC_5.3; BR liên quan và mọi control test thuộc SC075, SC076, SC077, SC078, SC079, SC080, SC081, SC082, SC083, SC084, SC085, SC086, SC087, SC088, SC089, SC090, SC091, SC092, SC093, SC094, SC095, SC096, SC097, SC098, SC099, SC100, SC101, SC102, SC103, SC104, SC163, SC164, SC165, SC166, SC167, SC168, SC169, SC170, SC171, SC172, SC173, SC174, SC175, SC176, SC177, SC178, SC179, SC180, SC181, SC182, SC183, SC184, SC185, SC186, SC187, SC188, SC189, SC190, SC191, SC267, SC268, SC269, SC270, SC271, SC272, SC273, SC274, SC275, SC276, SC277, SC278, SC279, SC280, SC281, SC282, SC283, SC284, SC285, SC286, SC287, SC288, SC289, SC290, SC291, SC292, SC293, SC294, SC295, SC296, SC297. Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

Trùng phone khi hai tab cùng lưu; stale form; xóa khách có hóa đơn; số rỗng/sai; thay phone không mất lịch sử; bracket trùng sau sửa; DB lỗi. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

Các chức năng/query/readonly viewer của 9 UC có test success/negative; unique và rollback kiểm tại service; staff không quản lý khung giá. Modal tạo khách dùng source slot/component ở G4; full host Thu mua/Bán hàng và các SC tổng thể tích hợp ở G6/G8, không tính SC full-frame PASS trước đó. G4 không bị chặn bởi editor chưa có: invoice viewers read-only được xây ở task 03. Toàn UC chỉ được chứng nhận khi các nhánh/host liên quan đã test, không lấy component PASS làm full journey. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

Không tự đăng ký membership khi tạo khách; P06 chỉ chặn phần đăng ký/ưu đãi ở G8. Không dùng sample khách/số điện thoại trong ảnh làm seed production. Giảm thiểu: đọc đúng role/source, làm migration additive với sentinel, test lỗi giữa transaction, không chỉnh screenshot baseline để che sai lệch. Các vấn đề chưa chốt giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_4.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Tạo nhánh làm việc riêng sau khi được phép code (ví dụ coco/phase-4); ghi commit theo task sau test; không force/reset/ghi đè thay đổi khác. Chỉ push/merge/deploy khi có cho phép. Workflow main hiện có vẫn install/lint/typecheck/unit/audit/build/Chromium trước deploy. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
