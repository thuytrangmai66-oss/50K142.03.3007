# Kiểm tra tính nhất quán bộ kế hoạch

Ngày 11/11/2026. **Snapshot lịch sử của lượt chỉ lập kế hoạch, trước coding G3**. Bảng PASS bên dưới áp dụng tại thời điểm đó, không phải validation của working tree hiện tại. Sau chỉ đạo “tiếp tục”, G3 có thay đổi ứng dụng hợp lệ; điều kiện “No application/config edits” không còn áp dụng cho lượt coding. Không chạy lại validator cũ để trình bày kết quả đó như evidence G3. Xem [REPORT_PHASE_3.md](phase3/REPORT_PHASE_3.md) và manifest mới cho kết quả hiện tại.

| Kiểm tra | Kết quả | Phạm vi |
|---|---|---|
| Required documents | PASS | MASTER_PLAN_COCO.md, REQUIREMENT_TRACEABILITY.md, FIGMA_SCREEN_MAPPING.md, PHASE_ROADMAP.md, TEST_MASTER_PLAN.md, TEST_CASE_CATALOG.md, OPEN_ISSUES.md, BASELINE_AUDIT.md, SOURCE_INVENTORY.csv |
| Phase plans 3-11, 16 sections each | PASS | 9 phase files; metadata/acceptance/task/test/risk/gates included |
| All 297 screen identifiers | PASS | IDs unique, UI/phase/frame/UC present; relations may be inferred/proposed |
| All 38 UI groups | PASS | UI06/UI07 embedded in UI05; no invented routes |
| All local frame paths | PASS | 297 referenced frames exist |
| Role totals | PASS | 191 owner + 106 staff |
| 27 source UC mapped | PASS | 0 alias UC_0; UC4.4 name retained/corrected via Q04 note |
| 98 BR testcase mappings | PASS | planned testcase, not execution coverage |
| 7 NFR namespaces | PASS | Usability 3, Performance 2, Security 1, Traceability 1 |
| Controls and branches retained | PASS | 928 controls; 175 flow branches; 0 unparsed blocks |
| Cross scenarios indexed | PASS | 47 cross-module/permission/data/release scenario IDs |
| Visual IDs specified | PASS | 297 explicit visual testcase rows; all NOT RUN |
| Relative document/source links | PASS | checked 17 Markdown files; missing=[] |
| 370 export rows and correct nested role | PASS | 146 owner + 78 staff direct + 146 owner alias; 224 unique hashes |
| Unique planned test IDs | PASS | 1552 planned identifiers, no execution claim |
| HEAD unchanged | PASS | No new commit created |
| Approved decisions preserved | PASS | AD01-AD08 and Q01-Q22 rows identical to HEAD |
| No application/config edits | PASS | Only planning documents changed; no feature implementation |

Ở snapshot này chưa có thao tác commit/push/deploy hoặc thay đổi source ứng dụng. Sau đó người dùng đã cho phép tiếp tục P01/P02; PASS tài liệu lịch sử không phải nghiệm thu chức năng hiện tại.

## Kiểm tra sau coding G3 — 11/11/2026

Kiểm tra riêng cho trạng thái mới, không dùng lại điều kiện “không sửa ứng dụng” của snapshot cũ:

- 23 Markdown master/phase mới được kiểm tra relative links: 0 link thiếu; source asset và ảnh tham chiếu tồn tại, checksum đúng manifest.
- Bảng AD01–AD08 và Q01–Q22 giữ nguyên so với HEAD; workflow, dependencies/lockfile, base Vite và Playwright config không đổi.
- HEAD giữ `22d3fbdd7cee0db717c62e003c5f4075f3707712`, nhánh `coco/phase-3-auth`; 0 file staged, `git diff --check` PASS.
- Evidence ghi hash 41 file code/test/config và 14 ảnh: 12 trạng thái login, 1 bootstrap, 1 shell. Đây là checksum capture, không phải pixel baseline được nghiệm thu.
- Lint/typecheck/build, 49 Vitest, 10 Chromium và 5 static checks PASS. Chi tiết/phạm vi chưa chạy tại [báo cáo G3](phase3/REPORT_PHASE_3.md) và [manifest](phase3/EVIDENCE_MANIFEST.json).

G3 READY FOR REVIEW; không có commit/push/merge/deploy hoặc kết luận CI/Pages cho working tree này.

## Kiểm tra sau G4 và quyết định local — 11/11/2026

Các kết quả G3 bên trên là lịch sử. Trạng thái mới:

- 27 Markdown master/phase/README được kiểm relative links: 0 link thiếu; ảnh bàn giao hai role/laptop/mobile/bracket tồn tại và có checksum.
- 23 file source/test/script thay đổi so với snapshot G3 được liệt kê trong [manifest G4](phase4/EVIDENCE_MANIFEST.json); DB schema G3 không đổi, package/lockfile/workflow/base giữ nội dung cũ, không Supabase.
- Giữ nguyên các dòng AD01–AD08/Q01–Q22; thêm chỉ đạo chốt mới và mapping độ mới ở ngoài bảng lịch sử. Không diễn giải lại mã cũ, có guard và test legacy 90/2.
- 68 Vitest + 23 Chromium + 5 static checks PASS; lint/typecheck/build và diff-check PASS. Không skip, chưa commit hoặc stage file.
- Nhánh local `coco/phase-4-reference`, HEAD nền chưa đổi; 34 ảnh test capture và 5 ảnh bàn giao có manifest. So sánh pixel baseline, CI/Pages và demo approval A/B/E G6 vẫn NOT RUN.

G4 READY FOR REVIEW; yêu cầu A–F được đặt đúng G6, không đổi thứ tự G4/G5/G6 hoặc tự triển khai module tương lai.

## Kiểm tra sau G5 và UX desktop — 11/11/2026

- G5 đã code/test theo chỉ đạo tiếp tục; giữ G4 → G5 → G6. Ưu tiên web trên máy tính, không bổ sung phát triển mobile.
- 88 Vitest + 29 Chromium + 5 static checks PASS; lint/typecheck/build PASS. Thêm case desktop 1366×650 và 1280×720: nội dung/nút thao tác hiện trong viewport, sidebar/header vẫn nhìn thấy khi vào chi tiết.
- Schema v3/21 store không đổi so với G4; package/lockfile/workflow/base và bảng AD01–AD08/Q01–Q22 giữ nguyên. Không Supabase, không seed/reset DB.
- Nhánh `coco/phase-5-staff`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`; chưa stage/commit/push/merge/deploy.
- [Manifest G5](phase5/EVIDENCE_MANIFEST.json) ghi danh sách/hash file thay đổi, ảnh và kiểm tra link/diff. Full visual pixel và CI/Pages cho working tree chưa chạy. [Báo cáo G5](phase5/REPORT_PHASE_5.md) READY FOR REVIEW; không tự DONE/G6.
