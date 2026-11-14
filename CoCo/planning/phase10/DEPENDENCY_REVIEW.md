# G10 — Review dependency audit

Ngày 14/11/2026. **Gói nâng major được người dùng duyệt tại G10-D04 và đã triển khai; full Chromium cuối 156/156 PASS. Phần lint tiếp tục OPEN.** Bảng phiên bản ban đầu bên dưới là bằng chứng trước sửa.

## Bằng chứng thực tế

`npm.cmd audit --json` trả 13 package entries có cảnh báo: 2 critical, 1 high, 10 moderate. Đây không phải số CVE độc lập. Bản đã lọc nằm tại [dependency-audit.json](evidence/regression/dependency-audit.json). Static audit 5/5 PASS là phép kiểm khác, không phủ nhận kết quả này.

| Nhóm | Đang cài theo lockfile | Phương án cần review | Ràng buộc |
|---|---|---|---|
| Bộ test | Vitest/@vitest/mocker 3.2.7, tinypool 1.1.1 | Vitest 5.1.0; registry khai báo hỗ trợ Vite ^6.4.0 và Node ^24.0.0 | Nâng major; kiểm lại cấu hình mock, worker, fake timer, IndexedDB; giữ nguyên assertion và chạy toàn bộ test |
| Validation runtime | Zod 3.25.76 | Zod >=4.6.6; npm đề xuất 4.6.7 | Nâng major; `.innerType()` đang dùng tại purchase-report/aged-stock-report. Không được làm đổi hợp đồng parse, snapshot hoặc dữ liệu legacy; không chỉ chuyển sang compatibility import rồi coi đã sửa advisory |
| Router runtime | react-router/react-router-dom 6.30.6 | npm đề xuất react-router-dom 7.18.5 | Nâng major; giữ HashRouter, base, URL, quyền và hành vi Back/reload. Không thêm server/SSR |
| Tooling lint | typescript-eslint 8.72.1, minimatch 10.2.6 | Xác minh bản tương thích với minimatch đã vá | Registry mới nhất 8.72.2 vẫn thuộc range npm audit báo; không áp dụng gợi ý downgrade/`audit fix --force` một cách máy móc |

Metadata registry đã đọc chỉ bằng `npm view`, không cài đặt: Vitest 5.1.0 nhận Vite ^6.4.0 và Node ^24.0.0; router 7.18.5 yêu cầu Node >=20. Điều này chỉ xác nhận engine/peer, chưa xác nhận ứng dụng tương thích.

## Đối chiếu advisory

- [Tinypool GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr): bản vá 2.1.2; khai thác được mô tả cần prototype pollution và run options tương ứng. Đây là dependency của công cụ test, không được mô tả như backend production của CoCo. Chưa có bằng chứng khai thác trong CoCo, nhưng chưa được coi là đã khắc phục.
- [Zod GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): bản vá 4.6.6; liên quan tiêu thụ bộ nhớ khi kiểm tra collection lớn. Kiến trúc local không tự loại bỏ cảnh báo validation.
- Các advisory router/mocker/minimatch và dependency bắc cầu giữ nguyên URL/range trong JSON audit để đối chiếu tiếp. Không tự đánh dấu N/A chỉ vì CoCo không dùng SSR.

## Gói xử lý đề xuất

1. Review nâng major Vitest, Zod và router như một bản sửa G10, giữ nguyên kiến trúc, UI, schema và dữ liệu. Trước triển khai cần xác nhận phạm vi nâng major; chưa sửa runtime validator để né gate.
2. Với lint, tìm tổ hợp đã vá và tương thích ESLint 9; nếu chưa có, giữ OPEN có bằng chứng thay vì hạ phiên bản theo gợi ý tự động.
3. Sau mỗi nhóm: kiểm contract/legacy/rollback và ca ảnh hưởng; cuối cùng lint/typecheck/full unit/build/full Chromium, rồi audit lại. Không xóa test, nới assertion hoặc force audit.
4. Không commit/push G10 trong khi còn lỗi kiểm thử hoặc blocker bàn giao. Việc nâng dependency không phải nghiệm thu NFR hoặc phase.

## Kết quả sau phê duyệt G10-D04

- Đã pin Vitest 5.1.0, Zod 4.6.7 và react-router-dom 7.18.5 trong package/lock; không chạy `audit fix --force`, không hạ lint hoặc đổi Vite/React/schema.
- Typecheck ban đầu phát hiện đúng hai API `.innerType()` của Zod 3 không còn tồn tại. Đã xuất structural schema riêng, giữ nguyên refinement của writer và kiểm quan hệ của reader; không thay dữ liệu hay quy tắc báo cáo.
- Sau sửa: lint/typecheck/build PASS, full unit/integration **495/495 PASS** (27 file, 137,02 giây); còn cảnh báo chunk >500 kB. Full Chromium cuối **156/156 PASS**, 0 FAIL/SKIP/FLAKY (551,97 giây). Router 7 được cấu hình `useTransitions={false}` để giữ điều hướng trước nâng; hai ca lỗi được chạy lại rồi full suite, không sửa timeout/assertion.
- Audit lại thực tế: **0 critical / 0 high / 7 moderate**, tất cả cảnh báo còn lại liên quan minimatch/nhóm lint. [JSON sau nâng](evidence/regression/dependency-audit-after.json). Chưa khắc phục hết; không đổi thành audit PASS.
- Lượt Chromium đầu sau nâng chưa chạy được ca nào vì port 4173 còn do tiến trình focused test của chính lượt G10 giữ. Đã dừng đúng phiên đó, không bật reuseExistingServer hoặc sửa config; lưu log startup và chạy lại suite.

Gói major đã được cho phép không đồng nghĩa nghiệm thu phase. Cần bổ sung kết quả Chromium thực thi và xử lý/đánh giá phần lint còn mở trước release.
