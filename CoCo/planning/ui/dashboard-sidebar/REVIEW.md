# Trang chủ và sidebar — UI review

> Cập nhật Git 15/11/2026: người dùng đã yêu cầu commit và push bản sửa hiện tại. Những ghi nhận “chưa commit/push/deploy” bên dưới là checkpoint lúc bàn giao coding; chúng không phải lệnh cấm cho lượt Git này. Kết quả CI/Pages phải xác minh theo SHA mới, không tự kế thừa trạng thái release cũ.

Ngày 15/11/2026. Phạm vi UI-only, theo chỉ đạo PO và xác nhận dùng **SC007/SC198 trong CODEX**. Không commit/push/deploy, không thay trạng thái nghiệm thu G9/G10 hoặc roadmap. Các file release/evidence G11 có sẵn trong working tree được giữ nguyên.

## Nguồn đối chiếu

Đã xem `CODEX/.uc-ui-matrix-qa/frame-7.png` (Chủ) và `frame-198.png` (Nhân viên), cùng quyết định/wording G9-T05 hiện hành. Hai ảnh là raster có annotation và kích thước khác nhau, không lấy pixel ảnh làm CSS trực tiếp. Đối chiếu theo canvas desktop, tỷ lệ các khối và shell hiện có; screenshot runtime dùng Chromium, zoom mặc định 100%, DPR 1 tại cùng viewport. Không sửa/chép ảnh gốc vào app hoặc thay baseline G10.

## Nguyên nhân và sửa

- Sidebar cũ có `min-height: 868px`, shell tối thiểu 900px ở desktop, padding đáy 170px; footer `position: absolute` neo vào đáy sidebar đó. Trên cửa sổ thấp, footer bị neo theo khối cao hơn viewport. Nhãn vai trò là phần hiển thị dư, không phải nguyên nhân duy nhất của chiều cao.
- Bỏ phần tử hiển thị vai trò ở footer, giữ nguyên user/role và mọi điều kiện `hasPermission`. Sidebar chuyển sang Flexbox; footer dùng `margin-top: auto`, có divider và Đăng xuất; không absolute, zoom hoặc transform để chữa layout. Sidebar theo chiều cao viewport; cửa sổ thấp giảm chiều cao logo/menu một cách đồng bộ, vẫn dùng icon/logo cũ.
- Giữ header 75px và typography 25px ở canvas 1440×900 vì đã phù hợp shell nguồn; tên tài khoản tiếp tục là `auth.user.displayName`. Header và Dashboard thẳng hàng.
- Dashboard vẫn 2 cột × 2 hàng, tăng khoảng cách và tỷ lệ icon/thẻ/font theo SC007/198. Ở 1440×900: vòng icon tối đa 83px, tiêu đề 25px, giá trị 32px; phần so sánh nhỏ hơn. Layout tận dụng chiều cao nhưng giới hạn chiều cao tổng để thẻ không phình trên màn lớn.
- Hai quick action giữ route danh sách `/purchases`, `/sales`; container trắng, nút đen/be, padding và kích thước cân nhau, icon phía trên chữ. Thu hẹp cửa sổ ≤1000px cho nội dung cao tự nhiên và cuộn trong main khi cần để giữ chữ đọc được; không tạo thanh cuộn riêng cho sidebar/thẻ.
- Không sửa `HomePage.tsx`, `HomeQuickActions.tsx`, services/domain/db. Công thức, nguồn KPI, trạng thái thiếu bằng chứng và wording G9 giữ nguyên; không thêm seed/mock vào runtime.

## File thay đổi

| File | Nội dung |
|---|---|
| `src/components/layout/CoCoLayout.tsx` | Bỏ nhãn vai trò footer; thêm class giới hạn style ở route Trang chủ |
| `src/index.css` | Flex sidebar/footer, mật độ menu theo chiều cao, Grid/typography/KPI/quick actions chỉ ở Home |
| `tests/e2e/home-layout.spec.ts` | Hai vai trò; bố cục, overflow, footer, menu được phép, cửa sổ hẹp, submenu và logout |
| `tests/e2e/auth.spec.ts` | Kiểm tra tên tài khoản thực và không có nhãn footer thay cho UI role label đã bị yêu cầu bỏ |
| `tests/e2e/reference-data.spec.ts` | Kiểm tra identity hai tab qua header; giữ assertion token/data/concurrency |
| `tests/e2e/sales-t05-t06.spec.ts`, `sales-t06-recovery.spec.ts` | Chuyển assertion identity sang tên thực ở header sau reload; giữ mọi assertion payment/rollback/replay/quyền |

## Ảnh trước/sau

| Vai trò | Trước, 1440×900 | Sau, 1440×900 |
|---|---|---|
| Chủ | [Ảnh trước](evidence/owner-before-1440x900.png) | [Ảnh sau](evidence/owner-home-after-1440x900.png) |
| Nhân viên | [Ảnh trước](evidence/staff-before-1440x900.png) | [Ảnh sau](evidence/staff-home-after-1440x900.png) |

Có thêm ảnh cả hai vai trò tại 1366×768, 1920×1080 và 1280×650 trong thư mục evidence. Đã xem ảnh sau sửa, kiểm tra thẻ/icon, khoảng cách, footer và thông tin tài khoản. Ở 800×900 kiểm thêm khả năng đọc, không tràn ngang, nút nhanh và Đăng xuất vẫn dùng được.

## Kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Lint / typecheck / build bản UI cuối | PASS |
| Unit/integration liên quan | **98 PASS / 0 FAIL**, 4 file: dashboard-comparison, report-queries, stock-comparison, auth |
| Chromium sau sửa | **74 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, 14 file liên quan, 4,6 phút, không retry |
| SC105 visual trong Chromium | **PASS**, nguồn/baseline/ngưỡng G10 giữ nguyên |
| Full suite / 8 visual local / thiết bị thật | NOT RUN trong lượt UI này; không báo coverage toàn G10 |

Chromium đã kiểm tra auth/logout, Dashboard/quick actions/KPI thật, hai tab, navigation/quyền, Thu mua/phê duyệt, Bán hàng, Hàng hóa, Khách hàng, phân trang và Báo cáo. Có test SC105 với ngưỡng/baseline G10 nguyên bản; không cập nhật baseline để lấy PASS. [Danh sách test/kết quả/source hash](evidence/verification.json). Log/JSON đầy đủ giữ local trong `.git/coco-release-recovery/2026-11-14T15-30-53-634Z/home-*.json` và thư mục `home-regression/`.

Tại bốn viewport desktop chính, đo cả hai vai trò đều có `mainOverflow.y = 0`, `sidebarOverflow.y = 0`, không tràn ngang. Header và KPI trùng X/chiều rộng: tại 1440×900 cùng X=461, rộng=943, header cao=75. Đăng xuất nằm trọn viewport kể cả route Hàng hóa có thêm submenu; logout thực tế đưa về đăng nhập và xóa session tab. Console/page error của các luồng Dashboard mới bằng 0. Không chạy lại full suite đã có evidence khi không cần thiết.

## Khác biệt còn lại và giới hạn

- Không tuyên bố SC007/SC198 pixel-perfect hoặc đạt automated pixel diff: nguồn local có annotation, kiểm bằng ảnh và geometry/bố cục. Không hạ ngưỡng visual đã duyệt.
- KPI, tên người dùng và trạng thái thiếu cơ sở có thể khác ảnh mẫu; đây là dữ liệu thực/wording đã duyệt. Nhân viên vẫn có bốn KPI riêng theo G9; chữ “người đã xác minh” có thể xuống dòng để hiển thị đầy đủ.
- Giữ bộ icon hiện có theo yêu cầu; không thay bằng hình từ Figma. Không mở lại các tồn đọng G10 hoặc B03 đã được PO chấp nhận cho release.
- Chưa commit/push/deploy: HEAD/remote giữ `4f4b7ff`, staging rỗng; các thay đổi UI/test/report mới còn local. Pages đang chạy release trước. Local `http://127.0.0.1:5173/50K142.03.3007/` đã kiểm tra HTTP 200 và module đang phục vụ có mã UI mới. Nếu cần mở lại, chạy `npm.cmd run dev -- --host 127.0.0.1 --port 5173` trong `CoCo/`. Dùng dữ liệu/tài khoản hiện có trong đúng origin của trình duyệt.
