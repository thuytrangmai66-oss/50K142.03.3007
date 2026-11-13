# Asset và giao diện local Giai đoạn 3

Ngày 11/11/2026. Chỉ đọc CODEX local theo chỉ đạo người dùng. Không gọi Figma online, không dựng ảnh nguyên màn làm UI. Manifest checksum máy đọc được: [SOURCE_ASSET_MANIFEST.json](SOURCE_ASSET_MANIFEST.json).

## Nguồn và phép trích

Asset runtime `src/assets/coco-mark.png`, 380×235, SHA-256 `69d06b27c6906dc97d08fe096e72bcd60cb11bf65cc6f0d99c3f08de94599410`, trích phần logo trắng từ trang 1 của `CODEX/Figma.Chủ/Quản lý Thu mua 1.pdf` (1440×900pt). PDF hash `8065a2673b9147349cfad2e5f59274a7e1f771afa0eeeefe9e9b5026eda62e50`.

Render Poppler ở 144dpi (2 px/pt), crop x=270,y=40,w=380,h=235 px. Giữ file PDF gốc. Logo dùng trực tiếp ở sidebar, dùng CSS invert/multiply cho bản đen trên login. Không dùng ảnh nhúng JP2 thô vì đó là ảnh trước mask/effect của PDF; đã kiểm tra logo sau render không có địa chỉ hoặc chi tiết thừa. Lệnh tái tạo, chạy từ app root với `pdftoppm` đã có trong PATH:

```powershell
pdftoppm -f 1 -singlefile -r 144 -x 270 -y 40 -W 380 -H 235 -png "../CODEX/Figma.Chủ/Quản lý Thu mua 1.pdf" "src/assets/coco-mark"
```

Poppler nguồn này có cảnh báo Type3 glyph ở phần chữ khác trên trang; PNG vùng logo đã được mở kiểm tra trực quan. Không coi text extraction PDF là bằng chứng font/layout chính xác.

## Token và component

| Thành phần | Thông số hiện dùng / nguồn |
|---|---|
| Font | Be Vietnam Pro local 400/600/700, reuse dependency G1; đối chiếu `phase0/UI_FOUNDATIONS.md` và ảnh local; không tải Google Fonts |
| Nền / surface | #f5f0e8 / #fff, sidebar/button #000 |
| Input / placeholder / subtitle | #aeaeb2 / #aeaeb2 / #8e8e93 |
| Lỗi / thành công | #ff3b48 / #34c759; dialog tick xanh |
| Login viewport | 1440×900, không tự thêm thiết kế mobile |
| Khung login | x673,y55,w720,h790,r30 |
| Input thứ nhất | x721,y452,w619,h70,r10; input thứ hai y578 |
| Nút login | x768,y726,w530,h63, bo tròn |
| Popup | Native dialog 480px, backdrop xám, nút đóng thật, focus trap của dialog |
| Logo | Cùng asset local ở hai slot login và sidebar; không có chú thích đỏ của QA |
| Icon | Lucide đã có trong dự án: UserRound/LockKeyhole/ArrowRight/Check/TriangleAlert/House/LogOut/CircleUserRound; không có SVG/icon rời được xác minh cho mọi node local, không claim pixel-identical icon |

Primitives hiện có: Button, Field với label/error/aria, Notice, ResultDialog. Không viết Select/Table/Pagination khi G3 chưa có luồng dùng; xây đúng nguồn tại phase tương ứng, không thêm UI không hoạt động.

## Đối chiếu và giới hạn nghiệm thu

SC001–SC006 và SC192–SC197 có cùng checksum frame theo từng cặp role; dùng một login form với phiên/role thật. Geometry khung/input/nút được assertion độc lập trong Chromium cho cả hai vai trò. Đã mở ảnh thực tế rỗng, sai thông tin, popup thành công và shell; đối chiếu với frame local cùng trạng thái. Text lỗi và popup được test bằng hành vi, password luôn masked. Giao diện chủ/nhân viên không suy ra role từ artwork.

12 ảnh trạng thái được chụp trong test E2E; danh sách/checksum tại [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json). Chúng là ảnh kiểm tra, không phải baseline pixel đã được phê chuẩn. Frame annotated có kích thước raster khác nhau và chú thích đỏ; chưa lập mask/baseline pixel được duyệt theo P11. **Automated pixel comparison: NOT RUN.** Không công bố tỷ lệ giống thiết kế hoặc visual PASS cho 297 SC.

SC007/SC198 mới có shell, tên người dùng động, Home và Logout. Không dựng menu module chưa triển khai hoặc KPI mẫu. Review dashboard đầy đủ thuộc G9. Form bootstrap là màn kỹ thuật mới P01, không tự gán thành SC thứ 298 trong nguồn.
