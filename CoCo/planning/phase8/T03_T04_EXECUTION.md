# G8-T03/T04 — QR cục bộ và hoàn tất bán hàng

Ngày 13/11/2026. **IMPLEMENTED / READY FOR REVIEW — chờ nghiệm thu**, không tự nghiệm thu G8. Tiếp tục sau G8-T02 và bản sửa sidebar; không commit/push/deploy.

## Quyết định và dependency

- Chủ dự án đã xác nhận P05 cùng mã cho hóa đơn mới trong chat. Chi tiết tại [P05 physical review](P05_PHYSICAL_REVIEW.md), G8-D04 trong [Decision Log](DECISION_LOG.md).
- Không đổi DB version, store, khóa hoặc dữ liệu legacy. Giữ branch `coco/phase-7`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712` và mọi thay đổi có sẵn.
- T02 phần tích/trừ điểm được nối vào T04 sau thanh toán thành công; đăng ký thành viên vẫn ghi ngay khi opt-in theo G8-D01.

## Chức năng đã triển khai

1. UI10 chọn Tiền mặt/Chuyển khoản và nhấn **Lưu** theo nguồn. Giỏ vẫn tự lưu qua thao tác thêm/xóa; Lưu nay xác nhận thanh toán, không còn là nút chỉ kiểm tra nháp.
2. Tiền mặt: Lưu kiểm dữ liệu/quyền và hoàn tất bằng transaction thật. Chưa có khách hoặc chưa có sản phẩm báo lỗi đúng luồng SRS.
3. Chuyển khoản: Lưu tạo quote chỉ đọc và QR cục bộ theo tiền sau ưu đãi. Không tạo hóa đơn/điểm/sold khi mở, Quay lại hoặc Escape.
4. Popup UI11 theo SC046 Chủ / SC238 Nhân viên: tiêu đề be, mã dự kiến và tên khách, số tiền, QR động, Đã nhận/Quay lại. Không dùng ảnh QR mẫu Figma làm mã thanh toán.
5. Đã nhận: nhân viên/chủ tự kiểm tiền vào theo AD05 rồi xác nhận. Hệ thống không gọi ngân hàng hoặc giả định nhận tiền tự động.
6. Snapshot P05 gồm tiền trước/sau giảm, membership/điểm, actor/khách tại thời điểm bán, dòng hàng/giá/version, paidAt và mapping của riêng hóa đơn mới. Cấp mã BH duy nhất trong transaction, chống tái sử dụng mã đã cấp.
7. Transaction ghi invoice+detail+sold+points+snapshot+draft-finalized+versions+receipt+audit; lỗi bất kỳ rollback toàn bộ. Giữ nguyên giá vốn, snapshot thu mua và ngày nhập kho.
8. Quote được đối chiếu lại trong write transaction: giỏ/revision, sản phẩm/version/giá/trạng thái, khách/version/membership/điểm. Stale quote không được hoàn tất bằng dữ liệu cũ.
9. Chống double-click, replay operation và hai giỏ bán cùng món. Đóng thông báo thành công đóng toàn bộ QR/result và mở giỏ mới; không gửi lại thanh toán. Lỗi giữ QR để quay lại hoặc retry.

## Đối chiếu nguồn QR

- SHB BIN `970443`: [danh sách chính thức của VietQR Kit/Casso](https://www.vietqr.io/api-bank/demo), kiểm tra 13/11/2026.
- Định dạng NAPAS GUID `A000000727`, dịch vụ `QRIBFTTA`: tài liệu gốc NAPAS [VietQR format v1.0, bản lưu PDF](https://kiemtrabank.com/documents/QR_Format_T%26C_v1.0_VN_092021.pdf), ví dụ công bố có CRC `F4E5` được dùng làm vector độc lập.
- [EMVCo QR](https://www.emvco.com/emv-technologies/qr-codes/) là nguồn chuẩn nền; bộ test kiểm thêm CRC CCITT-FALSE `123456789 → 29B1`.
- Tài khoản là **chuỗi** `0947800469`, giữ số 0 đầu. QR mang BIN/account, VND 704, VN, số tiền sau ưu đãi và mã tham chiếu; renderer dùng package qrcode đã có, không đổi dependencies.
- Theo [quy ước VietQR Kit](https://www.vietqr.io/qr-dong), accountName là thông tin hiển thị, không phải trường xác minh tên chủ tài khoản trong payload chuyển khoản. `MAI THUY TRANG` được giữ trong cấu hình/mô tả QR. Không tuyên bố đã đối soát tên/ngân hàng hoặc quét thực tế bằng app ngân hàng.

## UC/BR và test

| Yêu cầu | Bằng chứng |
|---|---|
| UC_3.1, BR-UC3-01/02 | Sales draft tests + revalidation khi quote/finalize; chỉ hàng có mapping và còn bán được, mặc định SL 1 |
| BR-UC3-03 | Unit parser TLV độc lập, BIN/account/currency/amount/reference + vector CRC; E2E cả hai phương thức/hai vai trò |
| BR-UC3-04/05 | Read-only quote; invoice ID chống trùng; transaction thực; native rollback, replay và double-click |
| BR-UC3-06..10 | Calculator cũ + unit/payment/E2E: chỉ thành viên có điểm; dùng 50 giảm 20%; tích theo tiền thực trả; cập nhật một lần sau thành công |
| P05/G8-D04 | Snapshot đủ trường; invoice mapping mới; legacy invoice nguyên vẹn, không backfill |
| Quyền và concurrency | Foreign employee/revoked token bị chặn; stale revision/price/customer points bị từ chối; hai tab native không bán cùng món hai lần |
| Hủy/lỗi | Quay lại/Escape giữ dữ liệu; lỗi từng store rollback và retry; lỗi native appMetadata/auditEntries giữ QR |
| UI11 | Screenshot Chủ/Nhân viên ở 1366×768, 1440×900, 1920×1080; popup căn giữa và nút không cắt |

## Kết quả thực thi

| Check | Kết quả |
|---|---|
| Lint | PASS, exit 0 |
| Typecheck | PASS; chạy riêng và trong build |
| Production build | PASS, exit 0; cảnh báo chunk >500 kB vẫn còn |
| Full unit/integration cuối | PASS 330/330, 16 files; FAIL 0, SKIP 0, exit 0; `unit-final.log` |
| Payment subset trong full unit cuối | PASS 15/15, gồm oracle TLV và mixed-price |
| Focused Chromium payment + sales | PASS 11/11 trước tinh chỉnh hình học popup cuối |
| Full Chromium cuối | PASS **119/119**, FAIL 0, SKIP 0, exit 0; 5,1 phút; `chromium-release.log` |
| Native E2E giới hạn điểm INT | PASS 1/1; không crash, không tạo hóa đơn, sửa giỏ được |
| Quét QR bằng thiết bị/app ngân hàng | NOT RUN; không thay thế bằng khẳng định test bitmap/đối soát ngân hàng |
| Dependency audit mới | NOT RUN; ngoại lệ audit cũ 13 findings giữ nguyên |

Log và ảnh: [evidence/t03-t04](evidence/t03-t04/). Lỗi ban đầu ở hai unit fixtures do gọi `auth.state` bằng raw token đã sửa bằng API `readAuthorized`; payment suite sau sửa PASS, không skip.

### Lỗi hồi quy tìm được và đã sửa

Lượt full Chromium đầu: **116 PASS / 2 FAIL / 0 SKIP**. Hai bài Khách hàng/Khung giá phát hiện phân trang bảng rỗng lệch 3,5625–4,0625px ở 640×768. Chẩn đoán chờ thêm hai animation frames vẫn lệch: đây là lỗi layout thật, không phải flaky test.

Thông báo rỗng có min-height theo viewport, cộng header/padding vượt phần bảng còn lại khi sidebar đã có mục Bán hàng. Bảng rỗng cao hơn bảng một dòng khoảng 4px. Sửa CSS ở điều kiện cửa sổ thấp/hẹp: wrapper rỗng co bằng flex và table lấp phần còn lại, bỏ chiều cao tối thiểu của thông báo rỗng; không đổi hàng có dữ liệu, logic phân trang hoặc kích thước nút. Các đoạn log chẩn đoán tạm đã gỡ khỏi test, giữ nguyên assertions ≤1px.

Sau sửa, cả **4/4** bài phân trang (0/1/5/9/10/25 dòng và các viewport gốc) PASS; [pagination-fixed.log](evidence/t03-t04/pagination-fixed.log). Lượt full sau sửa được lưu riêng tại `chromium-final.log`, không dùng kết quả 116/118 để báo PASS.

Lượt sau sửa phân trang đạt 118/118. Khi bổ sung boundary UI điểm ở INT_MAX, phát hiện calculator đúng quy tắc có thể ném lỗi trong render. Đã bắt lỗi để hiển thị thông báo/chặn Lưu và vẫn cho sửa giỏ, không hiển thị tổng giả. Focused native E2E 1/1 PASS. Bộ cuối có **119 ca**, log `chromium-release.log`; số 118/118 không được dùng thay lượt cuối này. Unit cuối thêm trường hợp hai món cùng khung giá nhưng khác giá bán, giữ nguyên lịch sử thu mua và giá vốn, đạt 330/330.

## File tạo/sửa

- `src/lib/payment/vietqr.ts`: encoder TLV và CRC, cấu hình ngân hàng cố định.
- `src/domain/sale-payment.ts`: quote/snapshot/paid record/command và mapping đã duyệt.
- `src/domain/sales.ts`: bổ sung trạng thái finalized và invoice link cho draft trong appMetadata; tương thích draft cũ.
- `src/services/sales-payment.ts`: quote chỉ đọc, finalize transaction, version/receipt/permission checks.
- `src/features/auth/context.ts`, `AuthProvider.tsx`: cung cấp service đã gắn session theo tab.
- `src/features/sales/SalesEditor.tsx`, `TransferQrDialog.tsx`, `src/index.css`: giao diện thanh toán, QR/result state và CSS riêng.
- `tests/unit/sale-payment.test.ts`, `tests/e2e/sale-payment.spec.ts`: 15 unit/integration và 8 native Chromium mới.
- `tests/e2e/sales-draft.spec.ts`: kiểm tra giỏ/opt-in cũ theo nút Lưu mới, giữ bảo đảm không finalize khi thiếu khách.
- Tài liệu P05, Decision Log, checklist, plan/report G8 và local instructions: cập nhật đúng trạng thái.

## Còn lại

- T05 tra cứu/chi tiết/in hóa đơn bán hàng theo Figma và T06 gói concurrency/regression cuối là phần tiếp theo, chưa triển khai/hoàn tất trong đợt T03–T04 này. Không coi lịch sử/label legacy hiện có là T05 đã hoàn thành.
- Giữ ngoại lệ G6 hai trường UI, barcode G7 và audit dependency. Không đổi mapping legacy để làm báo cáo đẹp hơn.
- Chưa nghiệm thu thủ công quét QR; không tự đánh dấu T02/T03/T04/G8 DONE. Không có commit/push/deploy.

## Demo local

Mở `CHAY_COCO_LOCAL.cmd` ở repository root, vào `http://127.0.0.1:5173/50K142.03.3007/`. Đăng nhập tài khoản đã có → Bán hàng → Thêm mã sản phẩm còn bán được → chọn khách bằng SĐT → chọn ưu đãi nếu là thành viên đủ điểm → Tiền mặt/Lưu hoặc Chuyển khoản/Lưu/Đã nhận. Chỉ nhấn Đã nhận sau khi người thao tác xác nhận tiền thực tế. Dùng dữ liệu demo riêng; thanh toán thành công là thao tác ghi thật vào IndexedDB.

Ảnh bàn giao: [Chủ QR 1440×900](evidence/t03-t04/owner-qr-1440x900.png), [Nhân viên QR 1440×900](evidence/t03-t04/staff-qr-1440x900.png), [Chủ thành công](evidence/t03-t04/owner-cash-success.png), [Nhân viên thành công](evidence/t03-t04/staff-transfer-success.png). Cùng thư mục có ảnh QR 1366×768 và 1920×1080 của cả hai vai trò. Đã xem trực tiếp ảnh QR Chủ và đối chiếu nguồn SC046; E2E xác nhận hình học của cả hai vai trò tại ba viewport.
