# Đồng bộ layout Hàng hóa / Thu mua theo Bán hàng

Ngày thực hiện: 15/11/2026. Mốc Git trước sửa: `213815c0e303c94b0467334768edaba6d67f19f3`, nhánh `main`, working tree sạch, đã kiểm tra `origin/main` cùng SHA. Phạm vi UI-only theo yêu cầu mới; không commit, push hoặc deploy.

## Kết quả

- Bán hàng hiện tại là chuẩn đối chiếu, không lấy tỷ lệ trực tiếp từ ảnh khác độ phân giải. Ba màn dùng chung gap header → filter **12px**, filter → bảng **12px**, padding filter **16px**, radius filter **12px**. Bảng → pagination vẫn **20px**, nút trang vẫn tối thiểu **32×32px**, font **14px**.
- Khung lọc, khung bảng và vùng phân trang trùng tọa độ với Bán hàng tại cả bốn viewport đã kiểm tra, cho Chủ/Nhân viên, khi không tìm thấy dữ liệu và khi có dữ liệu. Sai lệch hình học lớn nhất đo được: **0 CSS px**, trong ngưỡng đã duyệt ≤2 CSS px. Xem [40 phép đo đối chiếu](evidence/frame-comparison.json).
- Ảnh Bán hàng trước/sau ở 1366×768, 1440×900 và 1920×1080 có **[SHA-256 PNG giống hệt nhau](evidence/sales-image-hashes.json)**: header, nút Tạo giao dịch và phần hiển thị Bán hàng được giữ nguyên.
- Hàng hóa giữ đúng **5 cột** và tỷ lệ cột `17% / 29% / 26% / 14% / 14%`. Không thêm Số ngày tồn. Không đổi trường lọc, handler, route, phân quyền, dữ liệu, schema hoặc service. Quét mã vạch vẫn giữ trạng thái hiện có.
- Khung bảng cao hơn nhờ loại bỏ khoảng trống dư phía trên, không tăng chiều cao dòng. Hook tính số dòng theo viewport và component Pagination không bị sửa. Không xuất hiện cuộn dọc bên trong bảng, tràn ngang trang hoặc phân trang bị cắt tại các viewport đã kiểm tra.

## Nguyên nhân và thay đổi

Trước sửa, chỉ Bán hàng có shell riêng đặt margin dưới header và dưới filter là 12px. Thu mua vẫn nhận margin toolbar `20px 0 32px` và gap header mặc định 24/32px. Hàng hóa thêm padding 20px, margin `20px 0 32px`, gap nút 16px và kiểu nút khác Bán hàng. Những giá trị này làm đầu bảng thấp hơn trong khi footer phân trang đã cùng vị trí.

| Giá trị ở 1440×900 | Bán hàng trước → sau | Hàng hóa trước → sau | Thu mua trước → sau |
|---|---|---|---|
| X / chiều rộng filter | 461 / 943 → giữ nguyên | 461 / 943 → giữ nguyên | 461 / 943 → giữ nguyên |
| Y filter | 118 → 118 | 158 → 118 | 158 → 118 |
| Chiều cao filter | 166 → 166 | 173 → 166 | 164 → 166 |
| Padding filter | 16 → 16 | 20 → 16 | 16 → 16 |
| Header → filter | 12 → 12 | 52 → 12 | 52 → 12 |
| Filter → bảng | 12 → 12 | 32 → 12 | 32 → 12 |
| Y đầu bảng | 296 → 296 | 363 → 296 | 354 → 296 |
| Đáy bảng | 832 → 832 | 832 → 832 | 832 → 832 |
| Y pagination | 852 → 852 | 852 → 852 | 852 → 852 |

Tìm kiếm/xóa lọc giữ font, màu chữ đen và khoảng cách ngang 12px; dùng radius 8px, nút tìm kiếm nền be, xóa lọc nền trắng có viền theo Bán hàng. Không thay đổi nút Tạo giao dịch. Các trường lọc giữ cấu trúc riêng của từng module.

## Tọa độ sau sửa

Bảng dưới áp dụng cho cả ba màn, hai vai trò và hai trạng thái đã đo. Tọa độ CSS px, zoom 100%, DPR 1, Chromium, font đã tải xong.

| Viewport | Filter X → phải | Filter trên → dưới | Bảng X → phải | Bảng trên → dưới | Pagination Y |
|---|---|---|---|---|---|
| 1366×768 | 292 → 1350 | 92 → 258 | 292 → 1350 | 270 → 700 | 720 |
| 1440×900 | 461 → 1404 | 118 → 284 | 461 → 1404 | 296 → 832 | 852 |
| 1920×1080 | 461 → 1884 | 118 → 284 | 461 → 1884 | 296 → 1012 | 1032 |
| 1280×650 | 292 → 1264 | 92 → 258 | 292 → 1264 | 270 → 582 | 602 |

[Số đo trước sửa](evidence/before-metrics.json), [Chủ sau sửa](evidence/owner-frames.json), [Nhân viên sau sửa](evidence/staff-frames.json), [hash các đầu vào kiểm thử](evidence/input-hashes.json).

## Ảnh trước / sau

Ảnh chỉ chứa tài khoản và dữ liệu kiểm thử trong browser context độc lập. Không truy cập/xóa dữ liệu trình duyệt sử dụng thực tế. Dữ liệu mới có trong ảnh được tạo qua luồng Thu mua thật; trạng thái rỗng sau sửa dùng tìm kiếm không khớp. Danh sách thực sự chưa có dữ liệu cũng đã được kiểm tra bởi các bài hồi quy hiện có.

| Màn hình | Trước — Chủ, chưa có dữ liệu | Sau — Chủ, rỗng | Sau — Chủ, có dữ liệu | Sau — Nhân viên, có dữ liệu |
|---|---|---|---|---|
| Bán hàng | [Ảnh](evidence/before-sales-1440.png) | [Ảnh](evidence/owner-sales-1440.png) | [Ảnh](evidence/owner-sales-populated-1440.png) | [Ảnh](evidence/staff-sales-populated-1440.png) |
| Hàng hóa | [Ảnh](evidence/before-inventory-1440.png) | [Ảnh](evidence/owner-inventory-empty-1440.png) | [Ảnh](evidence/owner-inventory-populated-1440.png) | [Ảnh](evidence/staff-inventory-populated-1440.png) |
| Thu mua | [Ảnh](evidence/before-purchases-1440.png) | [Ảnh](evidence/owner-purchases-empty-1440.png) | [Ảnh](evidence/owner-purchases-populated-1440.png) | [Ảnh](evidence/staff-purchases-populated-1440.png) |

Ảnh các viewport khác và ảnh Bán hàng có hóa đơn được lưu cục bộ tại `CoCo/test-results/list-alignment-geometry/` và `CoCo/test-results/list-alignment-regression/` (output kiểm thử, không staging).

## Kiểm thử thực thi

| Lệnh / phạm vi | Kết quả |
|---|---|
| `npm.cmd run lint` | PASS, kiểm tra lại sau khi cập nhật test |
| `npm.cmd run typecheck` | PASS, kiểm tra lại sau khi cập nhật test |
| `npm.cmd run build` | PASS, 5.36s Vite; có cảnh báo annotation Zod và bundle >500 kB, không đổi dependency/build config |
| `npm.cmd test -- tests/unit/inventory.test.ts tests/unit/purchase-queries.test.ts tests/unit/sales.test.ts --maxWorkers=1` | **54 PASS / 0 FAIL / 0 SKIP**, 16.66s |
| Chromium `list-frame-alignment.spec.ts` | **2 PASS / 0 FAIL / 0 SKIP**, 13.2s; hai vai trò × bốn viewport × các trạng thái; đối chiếu DB trước/sau màn chỉ đọc |
| Chromium `inventory.spec.ts`, `purchase-list.spec.ts`, `sales-pages.spec.ts`, `sidebar-figma.spec.ts` | **12 PASS / 0 FAIL / 0 SKIP**; gồm 25 bản ghi, chuyển trang, lọc kết hợp/xóa lọc, chi tiết/reload, lỗi tải, dữ liệu legacy, đồng bộ và điều hướng/phân quyền |
| Chromium `purchase-editor-figma.spec.ts` sau cập nhật phép đối chiếu | **3 PASS / 0 FAIL / 0 SKIP**, 6.4s; bố cục editor Chủ/Nhân viên, shell/typography ở ba viewport |
| Full Unit/Integration, full Chromium và bộ Visual G10 | **NOT RUN** trong task UI giới hạn này; không thay đổi baseline hay ngưỡng G10, không coi kiểm tra 3 danh sách là kiểm chứng toàn bộ SC |

**Tổng cuối: 54 unit/integration và 17 Chromium test case liên quan PASS.** Không phát hiện lỗi console trong các luồng đã thực thi.

Lượt hồi quy đầu chạy 15 Chromium case: **14 PASS / 1 FAIL**. Assertion cũ tại `purchase-editor-figma.spec.ts` buộc cả tọa độ vùng main của editor và danh sách giống nhau, mâu thuẫn yêu cầu mới đưa riêng danh sách về gap Bán hàng 12px. Hai test canvas Figma editor vẫn PASS. Đã thay phép so sánh bằng kiểm tra chính xác: danh sách gap 12px, editor giữ gap 24/32px theo viewport, các tọa độ còn lại và đáy main vẫn phải bằng nhau. Không đổi CSS editor, baseline, tolerance hoặc bỏ assertion nghiệp vụ. Chạy lại cả ba case file này: PASS; 12 case khác không bị thay đổi đầu vào nên giữ evidence hợp lệ, không chạy lại thừa.

## File thay đổi

1. `src/components/layout/CoCoLayout.tsx`: thêm class trình bày `aligned-list-shell` chỉ cho ba route danh sách chính xác; không áp dụng editor/chi tiết.
2. `src/index.css`: tái sử dụng token spacing/padding/radius và style control giữa ba danh sách; bỏ margin dư của Hàng hóa. Không dùng zoom, scale, margin âm hay `!important` mới.
3. `tests/e2e/list-frame-alignment.spec.ts`: bổ sung kiểm tra hình học, hai vai trò, các trạng thái và dữ liệu không bị ghi khi chỉ xem/tìm kiếm.
4. `tests/e2e/purchase-editor-figma.spec.ts`: cập nhật phép đối chiếu main theo gap danh sách mới, giữ kiểm tra editor và toàn bộ phần còn lại.
5. Tài liệu này và ảnh/JSON trong `planning/ui/list-alignment/evidence/`.

## Giới hạn và xem local

- Không còn sai lệch frame trong phạm vi viewport/trạng thái đã đo. Chưa kết luận cho viewport dưới 1280px, thiết bị thật hoặc trình duyệt khác; các trường lọc vẫn tự xuống hàng theo breakpoint hiện có.
- Không thay đổi trạng thái nghiệm thu G9/G10/G11 hoặc xử lý tồn đọng của các phase đó. Không commit/push/deploy.
- Dev server: `http://127.0.0.1:5173/50K142.03.3007/`. Nếu đã dừng server, chạy trong `D:\50K142-NEW\CoCo`: `npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Đăng nhập bằng tài khoản local của bạn và mở Bán hàng / Hàng hóa / Thu mua.
