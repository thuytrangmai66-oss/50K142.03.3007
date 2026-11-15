# Chiều rộng và phân bố cụm lịch sử khách hàng

15/11/2026. UI-only. Giữ nguyên thay đổi local có sẵn; không commit, push hoặc deploy.

## Thay đổi

- Thân trắng dùng Grid ba hàng: thông tin, vùng giữa co giãn, thao tác. Cụm lịch sử được căn giữa theo trục dọc trong vùng giữa; khoảng từ đáy input Số điện thoại tới cụm lịch sử và từ cụm lịch sử tới nhóm Xóa/Sửa bằng nhau.
- Hai thẻ lịch sử giới hạn tổng bề ngang 828px, gồm hai nút 400px và gap 28px tại viewport desktop tham chiếu. Ở cửa sổ thấp, Grid giữ khoảng cách giữa hai vùng dọc cân bằng mà không đổi chiều cao nút.
- Không đổi kích thước khung, input, nút Xóa/Sửa, chiều cao/radius/màu/icon/typography của thẻ lịch sử hoặc handler/route.

## Đo bằng Chromium

Zoom 100%, DPR 1; các mốc là bounding box của input Số điện thoại, thẻ lịch sử và nhóm Xóa/Sửa. X = `history.top - phone.bottom`; Y = `actions.top - history.bottom`.

| Viewport | Rộng mỗi nút trước → sau | Gap trước → sau | X trước → sau | Y trước → sau | |X−Y| sau |
|---|---:|---:|---:|---:|---:|
| 1366×768 | 375 → 400px (+6,7%) | 36 → 28px | 24 → 125px | 226 → 125px | 0px |
| 1440×900 | 375 → 400px (+6,7%) | 58 → 28px | 45 → 90,5px | 136 → 90,5px | 0px |
| 1920×1080 | 375 → 400px (+6,7%) | 58 → 28px | 45 → 180,5px | 316 → 180,5px | 0px |
| 1280×650 | 375 → 400px (+6,7%) | 36 → 28px | 24 → 66px | 108 → 66px | 0px |

Ở 1440×900, card vẫn 943×706px; input giữ 619×70px; nút lịch sử giữ 165px chiều cao; nhóm Xóa/Sửa giữ vị trí top=811px và đáy=860px, cách đáy card 24px. Nút lịch sử sau bằng nhau 400px; `documentElement.scrollWidth - innerWidth = 0` ở cả bốn viewport. Cửa sổ thấp 1366×500 vẫn cuộn được tới nút thao tác; viewport 390×844 không tràn ngang.

## Ảnh sau chỉnh sửa

- Desktop tham chiếu: [1440×900](./evidence/history-spacing/owner-after-1440x900.png)
- Desktop thấp hơn: [1280×650](./evidence/history-spacing/owner-after-1280x650.png)

## Kiểm thử

- `npm.cmd run lint` — PASS
- `npm.cmd run typecheck` — PASS
- `npm.cmd run build` — PASS; còn cảnh báo annotation Zod và bundle lớn như trước.
- E2E Chromium: `customer-detail-layout.spec.ts`, `customer-history-layout.spec.ts`, `reference-data.spec.ts` — **17 PASS / 0 FAIL / 0 SKIP**. Bao gồm đo X/Y, chiều rộng/gap, không tràn, cửa sổ thấp, hai vai trò và điều hướng hai lịch sử.

Không chạy full unit/integration hoặc full E2E suite trong phạm vi CSS này.
