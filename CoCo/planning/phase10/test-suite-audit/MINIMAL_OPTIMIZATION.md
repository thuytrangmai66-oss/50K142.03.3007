# Tối ưu kiểm thử tối thiểu — 14/11/2026

Phạm vi theo chỉ đạo mới nhất: chỉ xử lý R01 và xem xét hai cặp layout đã được phát hiện; không mở rộng audit. Catalog và số liệu audit trước đó là snapshot trước thay đổi này.

- Chuyển **23 ca / 12 khai báo** từ `inventory`, `purchase-candidate`, `reference-data`, `sale-payment`, `sales` sang [pure-business-rules.test.ts](../../../tests/unit/pure-business-rules.test.ts), không có hook tạo DB/tài khoản. Giữ nguyên tên, vector và toàn bộ assertion; các ca integration còn lại vẫn giữ setup cũ.
- Đối chiếu AST/hash xác nhận nội dung 12 khai báo được chuyển và các khai báo giữ lại không đổi (chuẩn hóa CRLF khi so với Git); tên và số lượng 138 ca liên quan khớp evidence cũ. Không xóa, skip hoặc nới assertion.
- **Hai cặp layout giữ nguyên**: `reference-data.spec.ts` và `staff.spec.ts`, tại 1366×650 và 1280×720. Một bên kiểm tra trạng thái chưa có tài khoản; bên kia kiểm tra cả chi tiết nhân viên, khách hàng và vị trí cuộn/lịch sử. Chia sẻ browser context hoặc snapshot sẽ thay đổi tiền điều kiện và tạo phụ thuộc giữa test; chỉ tách helper không có bằng chứng tiết kiệm thời gian. Không sửa hoặc chạy lại Chromium cho các file này.

| Kiểm tra đã thực thi | Kết quả |
|---|---|
| ESLint đúng 6 file test thay đổi | PASS |
| `npm.cmd run typecheck` | PASS |
| Vitest đúng 6 file bị ảnh hưởng, `--maxWorkers=1` | **138 PASS / 0 FAIL / 0 SKIP**, 45,22 giây |
| Đối chiếu assertion/vector/tên ca và hash runtime/config/dependency/E2E cũ | PASS |
| `git diff --check` | PASS |

Tổng duration của cùng 23 ca: **7.887,70 ms** trong evidence cũ → **20,43 ms** ở lần chạy này, chênh **7.867,27 ms**. Đây là tổng thời gian từng ca từ hai lần chạy khác nhau, **chưa phải mức giảm wall time toàn suite**; file mới còn có chi phí khởi tạo môi trường/import. Không chạy benchmark mới hoặc ước lượng lại full suite.

Không chạy lại full Unit/Integration, Chromium, Visual hoặc build vì runtime/config không thay đổi. Kết quả full suite trước đây chỉ là evidence được bảo toàn theo hash, không phải kết quả thực thi mới. Không thay đổi ngưỡng Visual, UC/BR/SC/NFR, acceptance criteria, dependencies hoặc roadmap.

Quy trình áp dụng: khi sửa module chạy test bị ảnh hưởng; cuối task chạy regression liên quan; tại gate nghiệm thu G10 hoặc khi thay đổi ảnh hưởng diện rộng chạy đầy đủ bộ bắt buộc. Chỉ tái sử dụng evidence khi hash source, dependency, cấu hình và tiền điều kiện liên quan còn phù hợp; việc này không thay thế gate bắt buộc.

Còn tồn tại: chưa chứng minh mức tiết kiệm wall time toàn suite; hai cặp layout chưa có cách dùng chung setup an toàn. Các ngoại lệ và gate G10 hiện hữu giữ nguyên; không đánh dấu G10 DONE hoặc chuyển G11. Không tạo commit, push hoặc deploy trong đợt tối ưu này.

Bằng chứng: [MINIMAL_EXECUTION.json](MINIMAL_EXECUTION.json), [CASE_MOVE_MANIFEST.json](CASE_MOVE_MANIFEST.json), baseline `TEST_CATALOG.json` và `../evidence/br-review/final/`. JSON execution ghi lệnh, 138 kết quả, duration và hash báo cáo runner gốc.
