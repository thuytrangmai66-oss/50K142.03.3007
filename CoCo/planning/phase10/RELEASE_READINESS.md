# Checkpoint đầu vào G11

Rà ngày 14/11/2026. Tài liệu chuẩn bị từ G10, **không đánh dấu G11 đã bắt đầu hoặc release được nghiệm thu**. Yêu cầu người dùng tiếp tục đến G11 không thay các điều kiện đầu vào, UI/schema/nghiệp vụ hoặc ngoại lệ chưa chốt.

## Git và môi trường

- Root `D:\50K142-NEW`, app `CoCo/`, nhánh `main`.
- HEAD/origin/main sau fetch trùng `1fd4ad4a04e3b870a1c673fd7abd344af50dea69` (0 ahead / 0 behind). Working tree G10 chưa commit, có file ngoài phạm vi được giữ nguyên.
- Vite base `/50K142.03.3007/`, HashRouter, Node 24/npm 11. DB Dexie v4/native 40, không đổi schema trong G10.
- [Checkpoint tương thích source/contract](SCHEMA_COMPATIBILITY.md) ghi rõ phần đã kiểm và drill G11 còn NOT RUN. Các chỉ dẫn feature branch/chờ quyền push cũ trong plan G11 đã được thay bởi AGENTS.md; điều kiện nghiệp vụ/nghiệm thu của plan vẫn giữ nguyên.
- Full cuối: lint/typecheck/build, **538 unit/integration,167 Chromium và8 visual local PASS**,0 FAIL/SKIP/FLAKY; không đổi runtime,22 file bundle giống hệt, guard cuối191 file không đổi. [Execution BR và delta test](BR_REVIEW_EXECUTION.md). Không gán kết quả lịch sử cho source mới hoặc Windows PASS thành CI/Linux PASS.

## Quan sát GitHub chỉ đọc

API công khai xác nhận repo public, default branch main, `has_pages=true`. Run mới nhất khi kiểm tra: [43537965540](https://github.com/thuytrangmai66-oss/50K142.03.3007/actions/runs/43537965540), SHA HEAD G9 trên. Install/lint/typecheck/unit/static audit/build/install Chromium thành công; **test:e2e failure**, upload artifact/deploy **skipped**. Annotation chỉ ghi exit 1, chưa có chi tiết test lỗi để kết luận nguyên nhân. Warning Node 20 của action và thông báo runner Ubuntu không phải bằng chứng nguyên nhân E2E.

URL dự kiến [CoCo Pages](https://thuytrangmai66-oss.github.io/50K142.03.3007/) trả HTTP 200 với title CoCo. Đây chỉ là HTTP probe, **không phải production smoke PASS hoặc xác minh SHA G10**. Endpoint Pages API không xác thực trả 404; không suy ra Pages tắt, cũng chưa xác minh quyền/cấu hình Pages/Actions. Không thay workflow, quyền hoặc dispatch/deploy để kiểm tra.

Workflow hiện có ở `.github/workflows/deploy.yml` root: push main/PR checks, install/lint/typecheck/unit/static audit/build/Chromium trước upload artifact và deploy; deploy cần job checks, chỉ main không phải PR. Chưa chạy CI của G10 vì chưa commit/push.

## Điều kiện theo đúng thứ tự G11

| Task | Trạng thái đầu vào | Bằng chứng/việc cần làm |
|---|---|---|
| T01 checkpoint release | BLOCKED bởi gate G10 | Chốt phạm vi release/ngoại lệ, đủ kiểm chứng, SHA/artifact và compatibility; không tự lấy working tree làm release SHA |
| T02 CI/deploy đúng SHA | NOT RUN | Chỉ sau T01/gate phase; commit/push main theo AGENTS rồi quan sát workflow hiện có; không force/dispatch hoặc đổi quyền |
| T03 production smoke | NOT RUN | Profile riêng; assets/base/hash route/login/quyền/hai tab/DB migration; HTTP 200 hiện có không thay bài smoke |
| T04 rollback/roll-forward | NOT RUN | Thử build/schema trên bản sao, chứng minh dữ liệu được giữ; không downgrade/xóa DB thật. Test transaction/schema upgrade của G10 không thay drill release |
| T05 bàn giao/nghiệm thu | NOT RUN | README được cập nhật cho code hiện có; cần báo cáo release, SHA CI/Pages, smoke/recovery và quyết định nghiệm thu |

Các blocker G10 có owner/đầu vào cụ thể tại [ACCEPTANCE_GAPS.md](ACCEPTANCE_GAPS.md). Người triển khai còn phải khép review từng BR/UC và visual/action SC; chủ dự án cần chốt Q21/SLA, kiểm thiết bị thật và mâu thuẫn UI theo thẩm quyền. Không tự miễn trừ hoặc thêm chức năng ngoài nguồn. G10/G11 chưa DONE; chưa commit/push/deploy.
