# Truy vết thực thi Giai đoạn 3

Ngày 11/11/2026. Bảng này ánh xạ scenario kế hoạch sang test thật, không đếm một test có nhiều assertion thành nhiều test độc lập. Tổng suite 49 Vitest + 10 Chromium. 0 test skip. Những ID ngoài bảng tiếp tục theo catalog, chưa được tự đánh dấu PASS.

| ID/phạm vi kế hoạch | Test thật | Kết quả |
|---|---|---|
| TC-UC0-MAIN, TC-BR-UC0-01 | auth.test.ts: credential/token/DTO; auth.spec.ts owner + staff states | PASS chức năng; visual còn review |
| TC-UC0-ERR-01/02/03 | auth.spec.ts owner + staff: required/wrong/deriveBits failure + dialog close; auth.test.ts missing/unknown/inactive | PASS; chữ “hoặc” theo UI local thay “và” trong SRS, không đổi rule |
| TC-BR-UC0-02, TC-P3-PERMISSION | permissions matrix + fresh-role/read/write guard trong auth.test.ts; shared DB/403/404 trong auth.spec.ts | PASS trong phạm vi auth/G3; module tương lai chưa có service nghiệp vụ |
| TC-P3-CONTRACT | frozen v2 migration, DTO không có hash/salt, opaque token, state/status contract | PASS cho auth; business TINYINT mapping vẫn giữ issue |
| TC-P3-BOOTSTRAP-RACE | simultaneous bootstrap hai CoCoDatabase; hai tab thật + profile/audit rollback | PASS |
| TC-P3-SESSION-REVOKE | logout/hash replay; active/role/version; KDF in-flight; revoke khi tab focus; Back/reload | PASS |
| TC-P3-DIRECT-ROUTE | staff reports denied, owner 404 module chưa code, anonymous redirect; forged storage JSON | PASS |
| G3 failure/atomic | fail audit bootstrap/login/logout; storage persistence failure | PASS; không tạo phiên/record một phần |
| Regression G2 | database.test.ts + repositories.test.ts giữ 27 cases; frozen v2 browser test + v1 sentinel smoke | PASS |
| SC001–006 / SC192–197 controls | auth.spec.ts mỗi role: nhập/submit/masked password/inline error/dialog đóng/reload/logout | PASS hành vi; 12 ảnh capture |
| Geometry login | auth.spec.ts: card (673,55,720,790), first input (721,452,619,70), button (768,726,530,63) | PASS Chromium 1440×900 |
| TC-SC001–006 / SC192–197-VISUAL | Capture và đối chiếu thủ công một số ảnh/local frame, hash từng ảnh trong manifest | REVIEW; automated pixel baseline NOT RUN |
| SC007/SC198 | shell.spec.ts + auth.spec.ts: Home/name/role/logout/fallback/persistence | PARTIAL: chỉ shell G3, KPI/menu module G9 chưa nghiệm thu |
| NFR tốc độ, full security/XSS, multi-browser, toàn bộ visual | Chưa có phép đo/baseline/phạm vi hỗ trợ đầy đủ | NOT RUN; G10/P11 |
| G3 trên Actions/Pages | Chưa đưa code lên remote | NOT RUN |

Artifact được tạo lại tại `test-results/auth-*-chromium/*.png` và `test-results/coco-shell.png`. `EVIDENCE_MANIFEST.json` ghi checksum capture/code/test để phân biệt với HEAD lịch sử; không có password hoặc dữ liệu trình duyệt thật. Nguồn trong `SOURCE_ASSET_MANIFEST.json` không phải baseline tự động đã được duyệt.
