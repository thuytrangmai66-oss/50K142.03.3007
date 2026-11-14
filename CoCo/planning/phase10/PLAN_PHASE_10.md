# Kế hoạch Giai đoạn 10 Tích hợp, hồi quy, NFR và đối chiếu giao diện

Ngày lập 11/11/2026; rà trạng thái 14/11/2026. **NOT STARTED**. G9 đã triển khai dashboard/báo cáo và so sánh tồn theo phương án A được duyệt tại G9-D05; full unit mới 491/491 PASS, full Chromium **151/151 PASS**, 0 FAIL/0 SKIP (8,2 phút). Gate quyết định nguồn tồn kho đã mở, G9 vẫn PENDING REVIEW; không tự nghiệm thu hoặc tính đối soát G9-T06 là G10-T01 DONE. Xem [tiến độ G9](../phase9/REPORT_PHASE_9.md), [execution nguồn lịch sử](../phase9/STOCK_COMPARISON_EXECUTION.md). Giữ roadmap/dependency và các gate NFR/visual của G10; không tự đổi Q21/P11.

## 1 Mục tiêu

Đóng mọi gap traceability, test chéo module/quyền/nhiều tab, visual và 7 NFR; không thêm nghiệp vụ mới.

## 2 Nguồn và yêu cầu

UC_0, UC_1.1, UC_1.2, UC_2.1, UC_2.2, UC_2.3, UC_3.1, UC_3.2, UC_4.1, UC_4.2, UC_4.3, UC_4.4, UC_4.5, UC_4.6, UC_5.1, UC_5.2, UC_5.3, UC_6, UC_7.1, UC_7.2, UC_7.3, UC_7.4, UC_7.5, UC_8.1, UC_8.2, UC_8.3, UC_8.4. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

Tất cả SC001–SC297 (regression/release)

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

Đóng mọi gap traceability, test chéo module/quyền/nhiều tab, visual và 7 NFR; không thêm nghiệp vụ mới. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

Tái sử dụng toàn bộ component đã xây, không tạo component nghiệp vụ mới để chạy test.

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

Toàn bộ service/repository đã xây; dữ liệu test tách biệt, không reset browser người dùng. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

tests/unit/, tests/integration/, tests/e2e/, tests/visual/, tests/fixtures/, planning/*, .github/workflows/deploy.yml (chỉ thêm test được duyệt). Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [ ] G10-T01 | Chạy 27 UC theo main/alternative/exception và cả hai vai trò phù hợp, kiểm chuỗi thu mua→phê duyệt→kho→bán→điểm→báo cáo | Nguồn UC/BR/SC + code G2 và task trước trong phase | bằng chứng từng TC/BR/SC và đối soát độc lập | tests/unit/, tests/integration/, tests/e2e/, tests/visual/, tests/fixtures/, planning/*, .github/workflows/deploy.yml (chỉ thêm test được duyệt) | TC-P10-FULL-JOURNEY |
| [ ] G10-T02 | Kiểm 98 BR, 7 NFR và các control test trong matrix; giải quyết hoặc ghi blocker có owner/đầu vào cần thiết | Nguồn UC/BR/SC + code G2 và task trước trong phase | không lấy 27 data tests làm full UC coverage | tests/unit/, tests/integration/, tests/e2e/, tests/visual/, tests/fixtures/, planning/*, .github/workflows/deploy.yml (chỉ thêm test được duyệt) | TC-P10-TRACE-AUDIT |
| [ ] G10-T03 | Visual regression tất cả 297 trạng thái, reuse route/components, dataset baseline riêng; không tự update baseline che lỗi | Nguồn UC/BR/SC + code G2 và task trước trong phase | ngưỡng/viewport/mask theo TEST_MASTER_PLAN chờ duyệt | tests/unit/, tests/integration/, tests/e2e/, tests/visual/, tests/fixtures/, planning/*, .github/workflows/deploy.yml (chỉ thêm test được duyệt) | TC-SC001-VISUAL..TC-SC297-VISUAL |
| [ ] G10-T04 | XSS tên/lý do, forged role/input, direct service call, account revoked, concurrency/rollback/transaction error/reload | Nguồn UC/BR/SC + code G2 và task trước trong phase | quyền kiểm ở service; không hứa chống DevTools tuyệt đối | tests/unit/, tests/integration/, tests/e2e/, tests/visual/, tests/fixtures/, planning/*, .github/workflows/deploy.yml (chỉ thêm test được duyệt) | TC-P10-SECURITY |
| [ ] G10-T05 | Touch/focus/labels/error recovery; benchmark tra cứu/giao dịch theo dataset và máy ghi rõ, thu p50/p95 để duyệt ngưỡng NFR | Nguồn UC/BR/SC + code G2 và task trước trong phase | không tự invent SLA/shortcut; Q21 có danh sách được duyệt | tests/unit/, tests/integration/, tests/e2e/, tests/visual/, tests/fixtures/, planning/*, .github/workflows/deploy.yml (chỉ thêm test được duyệt) | TC-NFR-USABILITY-NFR-01..03; TC-NFR-PERFORMANCE-NFR-01..02 |
| [ ] G10-T06 | Regression G2 migration và local-only requests; build clean; triage/fix lỗi nguồn gốc, chạy lại affected + full required suite | Nguồn UC/BR/SC + code G2 và task trước trong phase | báo cáo lỗi, trạng thái cuối và liên kết evidence | tests/unit/, tests/integration/, tests/e2e/, tests/visual/, tests/fixtures/, planning/*, .github/workflows/deploy.yml (chỉ thêm test được duyệt) | TC-P10-REGRESSION |

## 9 Thứ tự và dependency

G3–G9; Q21 và P11 về viewport/nhanh/phím tắt trước chốt NFR. Làm T01 → T02 → ... theo thứ tự bảng, mỗi task có test trước khi tích hợp. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_0, UC_1.1, UC_1.2, UC_2.1, UC_2.2, UC_2.3, UC_3.1, UC_3.2, UC_4.1, UC_4.2, UC_4.3, UC_4.4, UC_4.5, UC_4.6, UC_5.1, UC_5.2, UC_5.3, UC_6, UC_7.1, UC_7.2, UC_7.3, UC_7.4, UC_7.5, UC_8.1, UC_8.2, UC_8.3, UC_8.4; BR liên quan và mọi control test thuộc Tất cả SC001–SC297 (regression/release). Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

Chuyển role khi tab đang chạy; schema upgrade nhiều tab; storage denied/quota; back/reload form; timeout query; ký tự HTML; font thiếu; viewport nguồn 900/923/933 cao khác nhau. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

Mỗi test case bắt buộc có kết quả/evidence; mọi visual/action SC được kiểm hoặc có blocker rõ, không tính NOT RUN là PASS; 0 blocker; lint/typecheck/build đạt; 7 NFR được xét với tiêu chí đã duyệt; không sửa baseline không có review. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

Phạm vi viewport/shortcut/SLA chưa có nguồn định lượng; cần chốt P11/Q21. Không tự thêm mobile layout hay offline/backup UI không có yêu cầu chuẩn. Giảm thiểu: đọc đúng role/source, làm migration additive với sentinel, test lỗi giữa transaction, không chỉnh screenshot baseline để che sai lệch. Các vấn đề chưa chốt giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_10.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Theo chỉ đạo Git hiện hành tại [AGENTS.md](../../../AGENTS.md): code trực tiếp `main`, đồng bộ fast-forward khi an toàn và bảo toàn working tree; commit/push `origin/main` theo phase khi đủ gate/test, không hỏi lại quyền đã cấp. Không tạo feature branch/PR mặc định, không reset/rebase/stash/force push hoặc ghi đè dữ liệu. Blocker/test FAIL thì dừng trước commit/push; push không phải nghiệm thu. Không đổi workflow/quyền Pages hoặc deploy thủ công ngoài phạm vi. Workflow hiện có vẫn thực hiện các checks trước deploy tự động khi push main. Regression nền G2/các phase trước và full suite khi đổi contract/schema/quyền; rollback schema chỉ thử trên bản sao.
