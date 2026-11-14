# Quy tắc làm việc với dự án CoCo

Áp dụng cho toàn repository; ứng dụng nằm trong `CoCo/`.

## Git — chỉ đạo người dùng ngày 13/11/2026

Từ lần triển khai code tiếp theo, **code trực tiếp trên `main`, commit và push lên `origin/main` theo từng phase**. Người dùng đã cho phép quy trình này; không hỏi lại quyền commit/push sau mỗi phase khi đáp ứng các điều kiện bên dưới.

Quy tắc này thay thế các chỉ dẫn Git cũ như giữ nhánh `coco/phase-*`, tạo feature branch/PR mặc định hoặc chờ cho phép commit/push từng lần. Những thông tin đó trong báo cáo phase là lịch sử. Chỉ đạo mới hơn của người dùng tiếp tục có ưu tiên.

### Trước khi code

- Kiểm tra Git root, `git status`, branch, remote, HEAD và thay đổi hiện có; đọc master plan cùng execution/review liên quan.
- Đồng bộ thông tin từ `origin`, chuyển sang `main` và cập nhật bằng fast-forward khi an toàn **trước khi sửa source**. Nếu chưa có `main` local, tạo nhánh tracking đúng `origin/main`, không tạo nhánh feature/phase mới.
- Bảo toàn mọi thay đổi chưa commit và file ngoài phạm vi. Không tự stash, reset, clean, rebase hoặc ghi đè để ép chuyển nhánh. Nếu không thể chuyển/đồng bộ an toàn, báo rõ trở ngại và giữ nguyên dữ liệu.
- Nếu GitHub bảo vệ `main` hoặc từ chối quyền push, báo lỗi thực tế; không tự bỏ branch protection, đổi cấu hình quyền hoặc lách quy tắc bằng force push.

### Cuối mỗi phase

1. Hoàn thành phạm vi được giao, cập nhật execution/checklist và bằng chứng theo master plan. Giữ nguyên các điều kiện nghiệm thu nghiệp vụ, schema và UI.
2. Chạy các script thực sự được cấu hình trong `CoCo/package.json`: lint, typecheck, unit/integration, build và Chromium E2E theo phạm vi/gate của phase. Với cấu hình hiện tại trên Windows: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --maxWorkers=1`, `npm.cmd run build`, `npm.cmd run test:e2e -- --workers=1`. Không báo PASS cho test chưa chạy; script thiếu phải ghi NOT CONFIGURED.
3. Nếu có test FAIL, build lỗi hoặc blocker chưa xử lý trong phạm vi bàn giao, dừng trước commit/push và báo rõ. Không bỏ test, nới assertion hoặc sửa test chỉ để tạo PASS.
4. Rà diff và chọn chính xác các file thuộc phase để staging; không `git add .` mù quáng. Loại secret, `.env` thật, database/dữ liệu cá nhân, `node_modules`, build output, file tạm và tài liệu nguồn riêng trong `CODEX/` nếu chưa có chỉ đạo đưa chúng lên GitHub. Không xóa các file bị loại.
5. Xác nhận branch vẫn là `main`; tạo commit nêu đúng phase và nội dung thực tế, không gom các phase không liên quan vào cùng commit.
6. Kiểm tra lại `origin/main` trước push. Chỉ đồng bộ fast-forward khi an toàn; nếu lịch sử phân kỳ hoặc remote đã có thay đổi không thể tích hợp an toàn, báo lại, không tự rebase/reset/force push.
7. Push đúng `origin main`; đặt upstream cho `main` nếu chưa có. Không cần xin lại xác nhận commit/push đã được người dùng cho phép theo quy tắc này.
8. Sau push: kiểm tra status, HEAD và SHA remote; báo commit hash/message/link GitHub, kết quả kiểm thử, file còn chưa commit và trạng thái Actions/Pages nếu kiểm tra được.

Push `main` được phép kích hoạt CI/CD theo workflow hiện có. Không tự đổi workflow/cài đặt deploy hoặc kích hoạt deploy thủ công ngoài quy trình đó.

**Commit/push thành công không đồng nghĩa nghiệm thu hoặc phase DONE.** Các trạng thái PENDING REVIEW, BLOCKED, NOT RUN và quyết định chưa được chốt phải được báo đúng; không tự miễn trừ để chuyển phase.

## Ưu tiên thực tế khi xử lý UI — chỉ đạo PO ngày 14/11/2026

- Bắt buộc sửa sai nghiệp vụ/dữ liệu/luồng, chức năng chính không hoạt động, phân quyền sai, responsive/hiển thị nghiêm trọng, hoặc UI gây khó thao tác, hiểu sai hay che/mất thông tin quan trọng.
- Chấp nhận sai lệch nhỏ về spacing, kích thước/vị trí, màu, border/shadow/radius, font-size, icon/trang trí và khác biệt trình duyệt nếu không ảnh hưởng đọc, thao tác, nghiệp vụ hoặc tính nhất quán quan trọng. Không tinh chỉnh pixel-perfect, mở lại phần đã PASS hoặc tạo test chỉ cho khác biệt thẩm mỹ nhỏ.
- Với A04, phân loại nghiêm trọng / đáng sửa / có thể chấp nhận theo ảnh hưởng thực tế có bằng chứng. Chỉ xử lý hai nhóm đầu khi thực sự ảnh hưởng sản phẩm, lợi ích lớn hơn thời gian/rủi ro; ghi sai lệch nhỏ được chấp nhận trong báo cáo, tách khỏi lỗi chức năng. Chưa kiểm chứng thì không tự coi là sai lệch nhỏ.
- Quyết định này không tự đổi ngưỡng test visual đã duyệt, baseline, assertion, UC/BR/NFR hoặc gate bắt buộc; không biến NOT RUN/FAIL/DEFERRED/WAIVED thành PASS. Xem `CoCo/planning/phase10/T03_VISUAL_REVIEW.md` và Decision Log G10-D07.

## Giới hạn chung

Giữ roadmap/thứ tự dependency và quyết định kiến trúc đã duyệt. Không tự đổi nghiệp vụ, Figma, schema, dữ liệu legacy hoặc thêm Supabase/backend. Việc được phép Git commit/push không cấp quyền tự phê duyệt các thay đổi này.
