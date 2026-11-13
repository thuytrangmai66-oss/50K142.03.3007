# Đồng bộ đường phân cách danh sách

Ngày 12/11/2026. Theo yêu cầu mới nhất của người dùng, danh sách Nhân viên và các danh sách khác dùng đường phân cách mảnh giống ảnh Khách hàng. Yêu cầu này thay thế các yêu cầu cũ bỏ line Nhân viên và bỏ line danh sách Thu mua; các báo cáo/bằng chứng cũ giữ làm lịch sử.

## Thay đổi

- Nhân viên, Thu mua và template Phê duyệt bỏ override `rowDividers={false}`, dùng cùng mặc định DataTable/PaginatedTable với Khách hàng và Khung giá.
- Mỗi dòng dữ liệu dùng đường kẻ dưới **1px, màu #f5f0e8** hiện có. Giữ nguyên màu nền, header, font, nút và phân trang.
- Hàng thông báo rỗng có class `data-table-empty`, không vẽ đường kẻ vì đó không phải bản ghi. Tránh tái xuất hiện một đường line ngang thừa giữa vùng trắng khi không có dữ liệu.
- Bảng sản phẩm trong **form tạo Thu mua** vẫn giữ kiểu riêng theo Figma, `rowDividers={false}`; đây không phải trang danh sách giao dịch. Các số đo layout editor được kiểm hồi quy.
- Template Phê duyệt dùng cùng quy tắc nhưng chưa mở route hoặc kích hoạt chức năng trong lượt này. Không coi chỉnh style là nghiệm thu module.

Không đổi dữ liệu, service, transaction, phân quyền, bộ lọc hoặc logic pagination. Không tạo migration hoặc sửa dữ liệu thật.

## File sửa

`src/components/ui/DataTable.tsx`, `src/index.css`, `src/features/staff/StaffPages.tsx`, `src/features/purchases/PurchasesPage.tsx`, `src/features/approvals/ApprovalsPage.tsx`. Cập nhật assertion theo yêu cầu mới tại `tests/e2e/pagination.spec.ts` và `tests/e2e/purchase-list.spec.ts`.

## Kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Lint / typecheck / build | PASS, exit 0 |
| Chromium chọn lọc | **18/18 PASS**, không retry; 0 FAIL/skip/flaky |
| Unit/integration | NOT RUN trong lượt CSS này; không thay nghiệp vụ |
| Toàn bộ E2E ngoài phạm vi | NOT RUN trong lượt này; không lấy kết quả trước làm PASS hiện tại |

Chạy `pagination.spec.ts`, `purchase-list.spec.ts` và `purchase-editor-figma.spec.ts` với `--retries=0`: kiểm danh sách hai vai trò, border 0 khi rỗng / 1px khi có dữ liệu, 0/1/5/9/10/25 bản ghi, trang/thứ tự dữ liệu, tìm kiếm và lọc, viewport 1366×768, 1440×900, 1920×1080 cùng cửa sổ hẹp trong suite có sẵn. Không thêm unit test chỉ để phản chiếu CSS. Hình và JSON kết quả ở `planning/evidence/list-row-dividers/`.

Không commit/push/deploy và không tự đánh dấu phase DONE. Local: http://127.0.0.1:5173/50K142.03.3007/.
