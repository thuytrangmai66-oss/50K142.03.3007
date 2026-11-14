# Sidebar — đối chiếu Figma và kiểm thử

> Cập nhật Git 15/11/2026: người dùng đã yêu cầu commit và push bản sửa hiện tại. Những ghi nhận “chưa commit/push/deploy” bên dưới là checkpoint lúc bàn giao coding. Lượt Git này chỉ đưa các thay đổi đã kiểm chứng lên main; không thay trạng thái nghiệm thu hoặc tự kế thừa kết quả CI/Pages của SHA cũ.

Ngày 15/11/2026. UI-only. Không commit/push/deploy. Bảo toàn các thay đổi Dashboard và tài liệu release đang có; không thay trạng thái nghiệm thu G9/G10.

## Nguồn và nguyên nhân thực tế

Đã đọc trực tiếp [sidebar active trong Figma](https://www.figma.com/design/YLODwa1EXmJimFXhwjXnj0/CoCo?node-id=663-821), node `663:821` (Frame 45), screenshot và metadata của `663:889` (Frame 48, submenu chưa chọn). Đối chiếu thêm ba ảnh người dùng gửi. Khung nguồn **397×868**, trong canvas 1440×900; so sánh runtime ở zoom mặc định 100%, DPR 1, không lấy tỷ lệ pixel giữa các ảnh chụp khác cỡ để áp CSS.

Font-family **Be Vietnam Pro đã đúng từ trước**. Sai lệch chủ yếu do submenu dùng font-size clamp tối đa 16px thay vì 20px, icon Lucide khác nét nguồn, line-height kế thừa, khoảng cách và mức thụt riêng; selector `nav a.active` dùng chung khiến trạng thái cha/con khó kiểm soát. Các style `.purchase-editor-shell .sales-navigation` còn ghi đè layout menu theo từng trang.

**Không phải mọi chữ đậm ở submenu đều sai:** design context node active xác nhận Bold 20px màu `#e8ddce`, đúng ảnh 3. Trạng thái mở/chưa chọn là Regular trắng theo ảnh 2. Figma Starter đã hết quota khi gọi design context lần tiếp cho `663:889`; không khẳng định đã đọc đầy đủ variant/hover hay design token của toàn file. Những phần đó đối chiếu ảnh và metadata có sẵn, không tự sửa Figma.

## Trước/sau ở viewport 1440×900

| Thành phần | Trước lượt này | Sau |
|---|---|---|
| Font menu chính | Be Vietnam Pro 20px; line-height kế thừa | Be Vietnam Pro 20px / normal / letter-spacing normal; Regular 400, active 700 theo nguồn |
| Submenu | `clamp(12px,1.05vw,16px)` (~15,12px tại 1440); active trắng | 20px; mở/hover Regular 400 trắng, active Bold 700 màu be |
| Khoảng cách mũi tên–text | 12px, icon 20px | Gap 22px, SVG 30px gốc; text X=132 trong sidebar theo Figma |
| Icon menu chính | Lucide, 34px | 11 SVG từ design context, giữ kích thước nội tại, đặt trong slot 34px thống nhất; không tự co icon |
| Trục chữ menu chính | Padding 31px, Flex | Grid slot 34px + gap 42px, padding 34px; chữ X=134, không lệch vì icon khác kích thước |
| Menu cha active | Nền be / bo 15px / cao 56px | Giữ màu/bo/cao; vùng chọn rộng 350px theo nguồn |
| Submenu active | Border cao hết hit area | Không pill; vạch be 2×41px ở giữa, tách khỏi CSS active menu cha |
| Footer | Gap 24px, padding đáy sidebar 30px | Gap 28px; icon X=21, chữ X=83; padding đáy 32px, divider cách nút 36px; Flexbox giữ ở cuối |

Cửa sổ thấp/hẹp dùng mật độ responsive, kiểm tra tại 1366×768, 1440×900, 1920×1080, 1280×650; submenu giữ một dòng, Đăng xuất nằm trọn viewport. Không dùng zoom, transform scale hoặc absolute để đẩy footer. Màu icon đổi theo trạng thái bằng CSS filter; SVG gốc không sửa path hoặc root dimensions, URL Figma tạm không nằm trong runtime.

Logo sạch `coco-mark.png` được giữ nguyên và giữ tỷ lệ ảnh. Asset PNG gốc do Figma trả về chứa texture/địa chỉ khác ảnh logo hiện dùng; không thay logo bằng bản đó. Vì vậy không tuyên bố crop/logo khớp từng pixel với ảnh render Figma.

## File sửa trong lượt sidebar này

- `src/components/layout/CoCoLayout.tsx`: dùng `SidebarIcon` và wrapper text; giữ nguyên mọi route, điều kiện permission, điều kiện hiện submenu và hàm logout.
- `src/components/layout/SidebarIcon.tsx`: component SVG chung, ảnh decorative với `aria-hidden`/alt rỗng.
- `src/assets/sidebar/*.svg`: 11 icon tải từ design context, có hash/root metadata tại [verification.json](evidence/verification.json).
- `src/index.css`: scope các selector vào sidebar, tách parent/submenu, bỏ override riêng của menu Bán hàng, typography/spacing/footer responsive. Phần style Dashboard trước đó giữ nguyên.
- `tests/e2e/sidebar-figma.spec.ts`: hai vai trò, Regular/hover/Bold, vị trí text, asset tải được, không xuống dòng, menu theo quyền, navigation và logout.

## Ảnh

| Vai trò | Trước | Sau, mở/chưa chọn | Sau, active |
|---|---|---|---|
| Chủ | [Ảnh trước](evidence/owner-active-before.png) | [Regular](evidence/owner-expanded.png) | [Bold/be](evidence/owner-active.png) |
| Nhân viên | [Ảnh trước](evidence/staff-active-before.png) | [Regular](evidence/staff-expanded.png) | [Bold/be](evidence/staff-active.png) |

Có ảnh hover và bốn viewport trong `evidence/`; đã xem lại ảnh cuối 1440×900 và 1366×768. Không version hóa ảnh Figma gốc hay thay baseline để lấy PASS. Đây là đối chiếu ảnh và geometry/sidebar state, không phải chứng nhận pixel-diff toàn sidebar hoặc mọi SC.

## Kiểm thử

| Kiểm tra | Kết quả thực thi |
|---|---|
| Lint / typecheck / production build | PASS; giữ cảnh báo chunk >500 kB đã có |
| Unit/integration auth/session/quyền/rollback | **22 PASS / 0 FAIL** |
| Chromium liên quan, 9 file | **41 PASS / 0 FAIL / 0 SKIP / 0 FLAKY**, 114,94 giây, không retry |
| SC105 visual | PASS trong lượt Chromium; baseline và ngưỡng G10 không đổi |
| Full suite / 8 visual local / thiết bị thật | NOT RUN trong lượt sidebar này |

[Danh sách test, nguồn và guard](evidence/verification.json). Bao gồm sidebar hai vai trò, Trang chủ, auth, Thu mua, Bán hàng, Hàng hóa, Khách hàng và Báo cáo. Không có lỗi console/page error trong hai luồng sidebar mới; logout xóa session tab thật. Các test dữ liệu khác không bị ảnh hưởng không chạy lại để tiết kiệm thời gian.

Guard so sánh component trước lượt này với sau: danh sách route, điều kiện permission, điều kiện route và nội dung hàm logout **không đổi**; services/domain/db/dependencies/workflow **không đổi**. Mở/đóng submenu vẫn là cơ chế cũ theo route: vào Hàng hóa hiện submenu, sang mục khác thì ẩn. Không tự thêm nút toggle hoặc hành vi mới.

## Bàn giao

Đã hoàn tất sửa local và kiểm thử liên quan. Source trước sửa, log/JSON đầy đủ và helper chụp ảnh giữ tại `.git/coco-release-recovery/2026-11-14T15-30-53-634Z/sidebar-figma/`. Helper chụp ảnh ban đầu có lỗi cwd/selector, đã sửa đúng helper theo DOM; đó không phải FAIL của sản phẩm hoặc test regression đã có. Kết quả 41/41 ở trên là lượt kiểm thử bản UI cuối.

Xem tại `http://127.0.0.1:5173/50K142.03.3007/` bằng origin đang dùng của trình duyệt; vào Hàng hóa rồi Xử lý hàng tồn lâu để đối chiếu hai trạng thái. Chưa commit, push hoặc deploy; Pages vẫn là phiên bản release trước. Git main/HEAD `4f4b7ff` giữ nguyên. Các khác biệt nhỏ về raster/font rendering và crop logo được ghi nhận, không coi là đã kiểm chứng pixel-perfect.
