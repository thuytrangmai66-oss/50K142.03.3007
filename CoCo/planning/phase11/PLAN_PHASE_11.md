# Kế hoạch Giai đoạn 11 Release, xác minh Pages và bàn giao

> **15/11/2026: RELEASE SUCCESS, G11-T02/T03 thực thi PASS.** Commit `4f4b7ff4a191c3d675eada86ece54030a96f4796` đã push main; CI **538 unit + 167 Chromium PASS**, Pages deploy đúng SHA, smoke 17 kiểm tra và 2 E2E production PASS, dữ liệu giữ nguyên qua reload. CODEX không có trong lịch sử push, local giữ nguyên hash. [B03](G11_B03_REVIEW.md) và G10-A01–A07 vẫn **ACCEPTED FOR RELEASE / DEFERRED**, chưa khắc phục; lần FAIL cũ giữ nguyên. [Báo cáo/evidence](RELEASE_EXECUTION.md). **T04/T05 chưa thực thi/nghiệm thu, toàn G11 chưa DONE.** Checkbox T02/T03 bên dưới ghi thực thi release/smoke, không phải nghiệm thu toàn phase.

Ngày lập 11/11/2026. Phạm vi/thứ tự task gốc dưới đây giữ nguyên. Quyền release cụ thể G10-D08 và quy tắc main trong AGENTS.md thay các chỉ dẫn nhánh/quyền cũ; ngoại lệ PO không cho phép bỏ check CI/CD hoặc tuyên bố tồn đọng đã sửa.

## 1 Mục tiêu

Bàn giao bản demo Pages hoạt động với evidence và giới hạn AD03; kiểm khả năng nâng cấp/khôi phục an toàn.

## 2 Nguồn và yêu cầu

UC_0, UC_1.1, UC_1.2, UC_2.1, UC_2.2, UC_2.3, UC_3.1, UC_3.2, UC_4.1, UC_4.2, UC_4.3, UC_4.4, UC_4.5, UC_4.6, UC_5.1, UC_5.2, UC_5.3, UC_6, UC_7.1, UC_7.2, UC_7.3, UC_7.4, UC_7.5, UC_8.1, UC_8.2, UC_8.3, UC_8.4. Chi tiết từng BR/luồng ở [REQUIREMENT_TRACEABILITY.md](../REQUIREMENT_TRACEABILITY.md) và [TEST_CASE_CATALOG.md](../TEST_CASE_CATALOG.md). NFR quyền và truy vết áp dụng cho mọi service; UI và tốc độ theo nguồn được duyệt.

## 3 Màn hình và trạng thái local

Tất cả SC001–SC297 (regression/release)

Mỗi SC có frame/export/vai trò ở [FIGMA_SCREEN_MAPPING.md](../FIGMA_SCREEN_MAPPING.md). G3 chỉ shell của UI02, KPI để G9. Không đọc Figma online theo chỉ đạo mới.

## 4 Chức năng phải thực hiện

Bàn giao bản demo Pages hoạt động với evidence và giới hạn AD03; kiểm khả năng nâng cấp/khôi phục an toàn. Các hành vi chính/phụ/lỗi/hủy đúng nguồn phải có test riêng, không chỉ render được trang.

## 5 Component xây hoặc tái sử dụng

Tái sử dụng toàn bộ component đã xây, không tạo component nghiệp vụ mới để chạy test.

Primitives dùng chung: Button, Input/FieldError, Select/DateField theo nguồn, Modal/Confirm/Alert, SearchTable/Pagination, Loading/Empty/ErrorState. Chỉ dùng primitive phù hợp thiết kế, không áp một form cho mọi layout.

## 6 Dữ liệu và ranh giới xử lý

CoCoDB và mọi metadata; dữ liệu production chỉ quan sát hoặc thao tác demo được cho phép. Tất cả là API/hàm local trong browser; không backend/server/Supabase. UI → service xác thực/quyền/rule → repository transaction. Không export raw credential material sang view.

## 7 File dự kiến tác động

.github/workflows/deploy.yml, planning/release/, README.md, hướng dẫn dùng local và nghiệm thu; không dựng lại CI đã chạy. Đây là đường dẫn dự kiến, chưa phải file đã tồn tại. Giữ stack và dependencies hiện có; không đổi lockfile nếu không cần.

## 8 Checklist task, đầu vào và đầu ra

| Task | Cách triển khai | Đầu vào | Đầu ra | File dự kiến | Test/scenario liên quan |
|---|---|---|---|---|---|
| [ ] G11-T01 | Chốt commit/branch, artifacts, DB schema compatibility, known issues và điều kiện cho phép release | Nguồn UC/BR/SC + code G2 và task trước trong phase | release checklist và checkpoint; không force/reset | .github/workflows/deploy.yml, planning/release/, README.md, hướng dẫn dùng local và nghiệm thu; không dựng lại CI đã chạy | TC-P11-RELEASE-CHECKPOINT |
| [x] G11-T02 | Tích hợp và deploy qua workflow hiện có chỉ sau cho phép; checks failure chặn artifact/deploy | Nguồn UC/BR/SC + code G2 và task trước trong phase | bằng chứng run gắn đúng SHA và Pages URL | .github/workflows/deploy.yml, planning/release/, README.md, hướng dẫn dùng local và nghiệm thu; không dựng lại CI đã chạy | TC-P11-CI-GATE |
| [x] G11-T03 | Production smoke trên base repo thật: assets/routes/login/quyền/quan trọng, reload và DB migration trong profile tách biệt | Nguồn UC/BR/SC + code G2 và task trước trong phase | không ghi vào dữ liệu thật của người dùng để thử nghiệm | .github/workflows/deploy.yml, planning/release/, README.md, hướng dẫn dùng local và nghiệm thu; không dựng lại CI đã chạy | TC-P11-PAGES-SMOKE |
| [ ] G11-T04 | Thử rollback/roll-forward tương thích schema trên bản sao; không trỏ build DB v2 vào DB v3 rồi xóa storage để sửa | Nguồn UC/BR/SC + code G2 và task trước trong phase | quy trình khôi phục có evidence; bản static cũ không tự đảm bảo đọc được schema mới | .github/workflows/deploy.yml, planning/release/, README.md, hướng dẫn dùng local và nghiệm thu; không dựng lại CI đã chạy | TC-P11-SCHEMA-ROLLBACK |
| [ ] G11-T05 | Bàn giao hướng dẫn owner/staff, local origin, giới hạn mất storage/không sync đa máy, cách báo lỗi và biên bản nghiệm thu | Nguồn UC/BR/SC + code G2 và task trước trong phase | README + release report + matrix cuối, không claim ngoài demo | .github/workflows/deploy.yml, planning/release/, README.md, hướng dẫn dùng local và nghiệm thu; không dựng lại CI đã chạy | TC-P11-HANDOVER |

## 9 Thứ tự và dependency

G10 đạt gate; cho phép tích hợp/push/deploy cho release cụ thể. Làm T01 → T02 → ... theo thứ tự bảng, mỗi task có test trước khi tích hợp. Chỉ tối ưu song song các việc độc lập sau duyệt; không nhảy module vì ảnh có sẵn.

## 10 Kế hoạch kiểm thử

Test exact mỗi TC của các UC UC_0, UC_1.1, UC_1.2, UC_2.1, UC_2.2, UC_2.3, UC_3.1, UC_3.2, UC_4.1, UC_4.2, UC_4.3, UC_4.4, UC_4.5, UC_4.6, UC_5.1, UC_5.2, UC_5.3, UC_6, UC_7.1, UC_7.2, UC_7.3, UC_7.4, UC_7.5, UC_8.1, UC_8.2, UC_8.3, UC_8.4; BR liên quan và mọi control test thuộc Tất cả SC001–SC297 (regression/release). Visual TC-SCnnn-VISUAL theo viewport nguồn. Unit: rule/validation/time/permission; integration: service+DB+rollback; E2E: tương tác thực + persistence + role; security: gọi trực tiếp service/URL, stale/revoked session. Xem TEST_MASTER_PLAN cho fixture/oracle và evidence.

## 11 Edge case và failure case

Pages cache còn build cũ; asset base sai; hash route reload; font bị thiếu; nhiều tab đang mở khi nâng schema; origin thay đổi; rollback static không tương thích DB. Mỗi lỗi phải kiểm dữ liệu trước/sau và hiển thị khôi phục đúng nguồn.

## 12 Tiêu chí nghiệm thu đo được

Run checks+deploy đúng SHA success, production smoke PASS, không còn blocker từ G10, rollback/roll-forward thử trên bản sao, tài liệu và checklist người dùng đủ để nghiệm thu; trạng thái DONE chỉ sau kiểm chứng và review. Mọi test bắt buộc exit 0, không skip/NOT RUN bị tính là PASS; 0 blocker chưa xử lý; số test thực thi và mẫu số SC/BR ghi trong report. Không dùng phần trăm tự ước lượng.

## 13 Rủi ro và giảm thiểu

CI xanh không chứng minh nghiệp vụ đúng. IndexedDB theo origin: đổi path không tạo DB riêng; đổi origin không tự chuyển dữ liệu. Không hứa sync đa máy/backend. Giảm thiểu: đọc đúng role/source, làm migration additive với sentinel, test lỗi giữa transaction, không chỉnh screenshot baseline để che sai lệch. Các vấn đề chưa chốt giữ ID tại OPEN_ISSUES.md.

## 14 Kết quả bàn giao

Code và test của task đã duyệt; source/asset index; cập nhật traceability; REPORT_PHASE_11.md với SHA, lệnh/exit code, artifacts, lỗi trước/sau, known issues và kết quả từng tiêu chí. Khi được phép tích hợp mới ghi CI/Pages run đúng SHA.

## 15 Điều kiện vào và chuyển tiếp

Vào: plan và các quyết định chặn task đã được duyệt, baseline phù hợp PASS, working tree người dùng được giữ nguyên. Chuyển: đủ checklist/gate/evidence, review source và kết quả, không blocker. Nếu chưa đạt thì READY FOR REVIEW hoặc BLOCKED có lý do, không tự DONE hoặc chuyển phase.

## 16 Git, CI và regression

Tạo nhánh làm việc riêng sau khi được phép code (ví dụ coco/phase-11); ghi commit theo task sau test; không force/reset/ghi đè thay đổi khác. Chỉ push/merge/deploy khi có cho phép. Workflow main hiện có vẫn install/lint/typecheck/unit/audit/build/Chromium trước deploy. Regression tối thiểu nền G2 và các phase trước, thêm full suite khi thay contract/schema/quyền. Rollback schema phải thử trên bản sao; ưu tiên roll-forward nếu build cũ không đọc schema mới.
