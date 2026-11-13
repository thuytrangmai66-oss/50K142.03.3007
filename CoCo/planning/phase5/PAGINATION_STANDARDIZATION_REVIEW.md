# Chuẩn hóa bảng và phân trang CoCo

> Cập nhật sau chỉ đạo bổ sung: dùng tối đa 9 dòng khi đủ chỗ, tự giảm theo vùng nhìn khi cửa sổ hẹp/thấp. Xem [bản tinh chỉnh mới nhất](LIST_LAYOUT_POLISH_REVIEW.md). Số liệu và ảnh dưới đây là snapshot trước lần tinh chỉnh này.

Ngày 11/11/2026, giờ Việt Nam. **Đã triển khai và kiểm thử đạt phạm vi yêu cầu.** Thay cơ chế 10 dòng/cuộn trong bảng của lần sửa trước bằng phân trang thực sự, mặc định 9 dòng. Không thay roadmap, nghiệp vụ SRS, schema hoặc dữ liệu hiện có; không push/deploy.

## Các màn hình đã rà soát

| Màn hình / vai trò | Hiện trạng và xử lý | Số dòng/trang |
|---|---|---|
| Khách hàng — Chủ | Chuẩn hóa bảng/footer và query phân trang; Chromium UI đầy đủ | 9 |
| Khách hàng — Nhân viên | Cùng component/service; Chromium UI đầy đủ, quyền không đổi | 9 |
| Nhân viên — Chủ | Dùng chung hàm chia trang, tự clamp trang khi xóa/live refresh | 9 |
| Khung giá thu mua — Chủ | Dùng chung hàm chia trang, phân trang sau lọc độ mới; tỷ lệ cột phù hợp dữ liệu | 9 |
| Lịch sử mua/bán của khách — hai vai trò | Rà soát source và SC087/091/280/284: không có điều khiển phân trang; giữ nguyên. Regression có lịch sử rỗng cho cả hai role và lịch sử/chi tiết có dữ liệu cho owner | Không thêm |
| Chi tiết hóa đơn mua/bán — hai vai trò | Bảng các dòng trong một hóa đơn, không phải danh sách giao dịch; giữ nguyên. Luồng owner có dữ liệu được regression kiểm tra; staff populated invoice không có test riêng trong lượt này | Không thêm |
| Thu mua, Phê duyệt — G6 | Chưa có route/UI module; đã xem mapping và mô tả SC008/130. Không xây nghiệp vụ ngoài phạm vi | NOT RUN |
| Hàng hóa/tồn kho — G7 | Chưa có module; rà mapping/mô tả SC060, không tự triển khai | NOT RUN |
| Bán hàng — G8 | Chưa có module; rà mapping/mô tả SC037, không tự triển khai | NOT RUN |
| Báo cáo — G9 | Chưa có module; rà mapping/mô tả SC114, không tự thêm phân trang vào báo cáo tổng hợp | NOT RUN |

Nguồn chỉ từ CODEX local, không mở Figma online. Đã mở trực quan SC075/267 (Khách hàng), SC145 (Nhân viên), SC163 (Khung giá), SC087/091 (lịch sử); đối chiếu mô tả cùng SRS/route hiện tại. SC145 có 10 dòng minh họa và SC163 có 11 dòng minh họa, nhưng mô tả không quy định giới hạn/trang khác. Không lấy dữ liệu mẫu thành cấu hình; áp dụng mặc định **9** theo yêu cầu mới. Nhân viên đã có Pagination trước lượt này. Hàm chung hỗ trợ capacity riêng nếu module có quy định rõ sau này.

## Cách sửa và component dùng chung

- `paginate()`/`DEFAULT_PAGE_SIZE` tại [domain/pagination.ts](../../src/domain/pagination.ts): slice dữ liệu trước render, tính tổng trang từ tập đã lọc, clamp về trang hợp lệ, không mutate dữ liệu. `PageResult` được re-export để giữ API type hiện có.
- Khách hàng/khung giá dùng hàm chung trong [reference-data/local.ts](../../src/services/reference-data/local.ts). Nhân viên dùng cùng hàm trong [StaffPages.tsx](../../src/features/staff/StaffPages.tsx), lưu lại page đã clamp để không nhảy trở lại trang cũ khi thêm dữ liệu.
- [DataTable/PaginatedTable/Pagination](../../src/components/ui/DataTable.tsx) tiếp tục là component chung; thêm cấu hình độ rộng cột theo tỷ lệ cho bảng khung giá. Không đổi màu, font, trạng thái active hoặc kích thước nút trang.
- [index.css](../../src/index.css): list có min-height theo phần nội dung còn lại; bảng tăng chiều cao tự nhiên, footer trong luồng Flexbox. Bỏ cuộn nội bộ và vùng bảng bị giới hạn chiều cao. Khoảng cách bảng/footer vẫn 28px như CSS hiện có; giảm khoảng trống cuối main để đưa phân trang thấp thêm 24px ở các viewport mục tiêu. Cell padding thích ứng theo chiều cao và liên kết dạng block giúp 9 hàng vừa khung, giữ đủ nội dung.
- Khi cửa sổ thấp hoặc nội dung xuống nhiều dòng, cuộn vùng nội dung chính thay cho cuộn bảng. Không absolute/fixed, không ẩn/cắt nội dung. Bảng lịch sử/chi tiết ngoài PaginatedTable không chịu các rule density mới.

Source sửa thêm: [contracts.ts](../../src/services/reference-data/contracts.ts), [PriceBracketsPage.tsx](../../src/features/price-brackets/PriceBracketsPage.tsx). Khách hàng nhận hành vi mới qua component/service chung, không cần sửa riêng CustomersPage. Không sửa auth/quyền, CRUD/rule dữ liệu, repository, DB schema, dependencies, logo hoặc sidebar.

## Kết quả kiểm thử

| Yêu cầu | Kết quả đã thực thi |
|---|---|
| Test 1 — 0 bản ghi | PASS: empty state đúng, chỉ Trang 1 |
| Test 2 — 1 bản ghi | PASS: footer không nhảy lên |
| Test 3 — 9 bản ghi | PASS: chỉ Trang 1, render đủ 9 dòng |
| Test 4 — 10 bản ghi | PASS: 9 + 1, không render bản ghi thứ 10 vào trang 1 |
| Test 5 — 25 bản ghi | PASS: 9 + 9 + 7 |
| Test 6 — chuyển trang | PASS: so khớp toàn bộ ID, không trùng/thiếu, quay lại được; dấu … và trang cuối với 100 bản ghi |
| Test 7 — tìm kiếm/lọc | PASS: prefix phone và filter độ mới tính lại số trang; giữ điều kiện khi chuyển trang; thay điều kiện reset trang hợp lệ; empty result vẫn Trang 1 |
| Test 8 — thêm/xóa | PASS: tạo khách/staff/bracket thứ 10 làm xuất hiện Trang 2; xóa khách/staff ở tab khác làm danh sách đang ở trang cuối tự clamp, sau thêm mới không bật lại trang cũ. Khung giá không có nghiệp vụ xóa trong module hiện tại nên không tự bổ sung |
| Test 9 — không cuộn bảng | PASS: cả 120 trạng thái đo đều không có vertical overflow bên trong bảng; trên desktop mục tiêu thấy trọn dòng cuối/footer |
| Test 10 — screenshot | PASS: đủ ảnh trước/sau ở 1366×768, 1440×900, 1920×1080; thêm ảnh 0/1/9/10 dòng ở 1366×768 và ảnh role nhân viên |
| Toàn bộ Chromium | **39/39 PASS**, exit 0, không retry/skip: 29 regression hiện có + 10 test chuẩn hóa |
| Unit/integration | **101/101 PASS**, exit 0, gồm nền G2/G3/G4/G5 và 13 assertion case của utility phân trang |
| Lint/typecheck/build | PASS, exit 0; build có `tsc --noEmit` |
| Full pixel baseline Figma | NOT RUN; không tuyên bố toàn website đạt pixel parity |
| CI/Pages cho working tree | NOT RUN; chưa push/deploy |

Ma trận: 4 tổ hợp role/màn hình × 6 số lượng (0/1/5/9/10/25) × 5 viewport = **120 trạng thái**, nằm trong 4 testcase matrix. Ba viewport mục tiêu tương ứng 72 trạng thái; thêm 1366×650 và 800×500 cho cửa sổ thấp. Ở viewport mục tiêu, chênh lệch vị trí Y theo số dòng và sai số căn giữa đều **0 CSS px**; cuộn nội bộ **0 trường hợp**. Không gọi 120 trạng thái là 120 testcase.

Lệnh: `npm run lint`, `npm test`, `npm run build`; PowerShell `$env:CI='true'; npm run test:e2e -- --reporter=line --retries=0 --global-timeout=240000`. Lượt đầu phát hiện footer lệch do nhãn dài và một expected message test chưa khớp UI; đã sửa spacing/cột và assertion theo message hiện có, sau đó chạy lại toàn bộ regression đạt. Test dùng context/DB cô lập, không mở profile Chrome cá nhân.

Test source: [pagination.spec.ts](../../tests/e2e/pagination.spec.ts), [pagination-helpers.ts](../../tests/e2e/pagination-helpers.ts), [pagination.test.ts](../../tests/unit/pagination.test.ts). Điều chỉnh kỳ vọng page size ở test reference-data unit/E2E, giữ lại kiểm tra CRUD/permission/rollback và dữ liệu G2.

## Ảnh trước / sau

Dataset 25 bản ghi; trước render 10 dòng và có cuộn nội bộ, sau render 9 dòng của trang 1 và không có cuộn nội bộ. Ảnh dữ liệu kiểm thử, không phải dữ liệu trình duyệt cá nhân.

| Màn hình | Viewport | Trước | Sau |
|---|---|---|---|
| Khách hàng — Chủ | 1366×768 | [Ảnh](evidence/pagination9/before/customers-1366x768.png) | [Ảnh](evidence/pagination9/after/owner-customers-25-1366x768.png) |
| Khách hàng — Chủ | 1440×900 | [Ảnh](evidence/pagination9/before/customers-1440x900.png) | [Ảnh](evidence/pagination9/after/owner-customers-25-1440x900.png) |
| Khách hàng — Chủ | 1920×1080 | [Ảnh](evidence/pagination9/before/customers-1920x1080.png) | [Ảnh](evidence/pagination9/after/owner-customers-25-1920x1080.png) |
| Nhân viên — Chủ | 1366×768 | [Ảnh](evidence/pagination9/before/staff-1366x768.png) | [Ảnh](evidence/pagination9/after/owner-staff-25-1366x768.png) |
| Nhân viên — Chủ | 1440×900 | [Ảnh](evidence/pagination9/before/staff-1440x900.png) | [Ảnh](evidence/pagination9/after/owner-staff-25-1440x900.png) |
| Nhân viên — Chủ | 1920×1080 | [Ảnh](evidence/pagination9/before/staff-1920x1080.png) | [Ảnh](evidence/pagination9/after/owner-staff-25-1920x1080.png) |
| Khung giá — Chủ | 1366×768 | [Ảnh](evidence/pagination9/before/price-brackets-1366x768.png) | [Ảnh](evidence/pagination9/after/owner-price-brackets-25-1366x768.png) |
| Khung giá — Chủ | 1440×900 | [Ảnh](evidence/pagination9/before/price-brackets-1440x900.png) | [Ảnh](evidence/pagination9/after/owner-price-brackets-25-1440x900.png) |
| Khung giá — Chủ | 1920×1080 | [Ảnh](evidence/pagination9/before/price-brackets-1920x1080.png) | [Ảnh](evidence/pagination9/after/owner-price-brackets-25-1920x1080.png) |

Khách hàng role nhân viên sau sửa: [1366×768](evidence/pagination9/after/staff-customers-25-1366x768.png), [1440×900](evidence/pagination9/after/staff-customers-25-1440x900.png), [1920×1080](evidence/pagination9/after/staff-customers-25-1920x1080.png). Ảnh các trạng thái ít dòng và JSON đo đi kèm trong [manifest](PAGINATION_STANDARDIZATION_EVIDENCE.json).

## Giới hạn và mở kiểm tra

Không còn lỗi kiểm thử trong phạm vi đã triển khai. Các module G6–G9 chưa có UI nên chưa thể nghiệm thu pagination của những module đó; báo cáo không gán PASS thay cho triển khai tương lai. Trên cửa sổ thấp/nội dung dài, main có thể cuộn để giữ nguyên font và đọc đủ dữ liệu, theo yêu cầu responsive. Không thay bằng cắt dòng/ẩn nội dung hoặc giảm số bản ghi ngoài cấu hình.

Local đang mở tại **http://127.0.0.1:5173/50K142.03.3007/**. Nếu cần khởi chạy: `cd D:\50K142-NEW\CoCo`, `npm run dev`. Tải lại tab đang mở để nhận code mới; giữ nguyên origin để dùng dữ liệu hiện có. Không reset storage. Bản sửa vẫn chưa stage/commit/push/deploy.
