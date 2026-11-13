# G8-T06 — Kiểm chứng đồng thời và hồi quy

Ngày 13/11/2026. **PENDING REVIEW**. Không tự đánh dấu T05/T06/G8 DONE. Không mở rộng kiến trúc hoặc nghiệp vụ.

## Phạm vi thực hiện

Kiểm tra các kiểm thử có sẵn của T01–T04 trước khi bổ sung các khoảng trống: hai tab dùng chung 50 điểm nhưng mua hai món khác nhau, scheduler thay giá khi QR đang mở, lịch sử và bản in T05. Không viết lại finalizer/scheduler đã hoạt động.

| Yêu cầu/ca lỗi | Bằng chứng thực thi |
|---|---|
| UC_3.1, BR-UC3-01..05: hàng còn bán, giá hiện hành, thanh toán đúng một lần | `sales-draft.test.ts`, `sale-payment.test.ts`, `sale-payment.spec.ts`: hàng đã bán, giá/version/revision cũ, double-click, replay, hủy/đăng xuất, hóa đơn và chi tiết |
| BR-UC3-06..10, D01/D02/D05: thành viên/điểm/ưu đãi | Unit calculator/payment; E2E hai tài khoản, hai món cùng 50 điểm: tab đầu thanh toán, tab sau bị chặn quote cũ, không ghi một phần, lấy lại quote theo điểm mới và thanh toán thành công |
| Hai tab không bán cùng món hai lần, session độc lập | E2E native IndexedDB trong `sale-payment.spec.ts`; bài mới giữ footer đúng vai trò, dữ liệu nhất quán sau reload |
| Transaction lỗi và rollback, retry không nhân đôi | Unit fault injection vào invoice/details/product/points/snapshot/receipt/audit và thêm issuedIdentifiers/recordVersions/operations; mỗi lần lỗi toàn bộ dữ liệu không đổi và cùng lệnh retry thành công đúng một lần; E2E native fault injection cũ giữ nguyên |
| BR-UC2-07/09 và chu kỳ giá: scheduler tranh chấp thanh toán | Unit chạy đồng thời scheduler/finalizer: chỉ một thứ tự giao dịch hợp lệ, quote cũ bị CONFLICT nếu scheduler thắng; E2E dịch thời gian 35 ngày, focus kích hoạt catch-up, QR cũ bị chặn rồi thanh toán theo giá mới |
| UC_3.2, lịch sử, snapshot và dữ liệu cũ | Unit/E2E danh sách, detail, nhiều dòng, profile đổi, lỗi snapshot; `reference-data.spec.ts` regression legacy, không tự map mã cũ |
| G2–G7 regression: nền DB, session, quyền, thu mua/phê duyệt hai tab, tồn kho/scheduler | Chạy toàn bộ unit/integration 16 file và toàn bộ Chromium; không skip bài cũ |

Chi tiết nguồn/UI và file sản phẩm: [T05_EXECUTION.md](T05_EXECUTION.md). T06 chỉ bổ sung kiểm thử; không đổi finalizer, scheduler, schema hoặc hợp đồng P05.

## Kết quả thực thi

Lint, typecheck riêng và production build **PASS**. Full unit/integration chạy riêng: **345/345 PASS, 16/16 file PASS, 0 FAIL, 0 SKIP**, exit 0, 153,64 giây; log `unit-full-serial.log`.

**Full Chromium cuối: 125 PASS / 1 FAIL / 0 SKIP**, exit 1, 9,2 phút; log `chromium-full-final.log`. Bài thất bại: `purchase-queries.spec.ts:99`, “T06 read error history: Figma notice closes without fabricated data or writes”. Sau thao tác reload/phục hồi lỗi đọc, assertion tại dòng 128 không tìm thấy link hóa đơn thu mua `TM585bbbe6` trong 5000ms. Nguyên nhân gốc chưa được xác minh; không kết luận chỉ do máy chậm. Ba bài T05/T06 mới đều PASS trong lượt này nhưng **full regression FAIL**. [Error context giữ local](evidence/t05-t06/chromium-final-failure-context.md).

Trong khi chạy bộ cuối, người dùng bổ sung yêu cầu commit/push và bắt buộc dừng nếu có test FAIL. Vì vậy **đã dừng trước staging/commit/push**, không sửa test, không nâng timeout, không rerun để vượt cổng kiểm chứng sau lỗi cuối. T06 **BLOCKED về kiểm chứng / PENDING REVIEW**; G8 chưa DONE, chưa đủ điều kiện chuyển G9.

Lượt tập trung trước khi tinh chỉnh nền in/breadcrumb cuối: **49/49 unit/integration**, **16/16 Chromium PASS**. Lượt full unit ban đầu chạy cùng Chromium: **344 PASS / 1 FAIL / 0 SKIP**, bài `staff-accounts.test.ts` đổi tài khoản timeout 5000ms; không có assertion sai dữ liệu. Giữ log lỗi tại `evidence/t05-t06/unit-full.log`, không tăng timeout hoặc bỏ bài; chạy lại toàn bộ riêng sau Chromium để xác minh.

Full Chromium lần đầu: **125 PASS / 1 FAIL / 0 SKIP** trong 8,4 phút. Bài T06 scheduler chụp baseline khi giá đã cập nhật nhưng bookkeeping run còn `running`; sau đó log nền hoàn tất làm so sánh toàn DB thất bại. Sửa riêng test để đợi run đúng ngày thành công và lock được giải phóng trước baseline. Vẫn so sánh toàn bộ store, không bỏ metadata hoặc nới assertion. Logic scheduler/payment không đổi. Thêm bắt console error/pageerror trên cả hai tab cho ba bài T05/T06. Giữ log đầu tại `chromium-full.log`.

## Bằng chứng và bàn giao

- Log tại `evidence/t05-t06/`: `unit-focused.log`, `chromium-focused.log`, `unit-full.log`, `unit-full-serial.log`, `chromium-full.log`, `chromium-full-final.log`, `lint.log`, `typecheck.log`, `build.log`.
- Ảnh T05 hai vai trò và print-media: xem [T05](T05_EXECUTION.md).
- Ảnh T06: [quote điểm cũ bị chặn](evidence/t05-t06/owner-stale-points-qr.png), [quote mới sau scheduler](evidence/t05-t06/scheduler-repriced-qr.png).
- Test dùng DB/origin kiểm thử riêng; các sản phẩm/giao dịch chính đi qua UI thật. Fixture điểm biên chỉ chuẩn bị tiền điều kiện kiểm thử, không seed dữ liệu vào ứng dụng local của người dùng.
- Branch `coco/phase-7`, HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`; giữ working tree đang phát triển. Không commit/push/deploy.

## Ngoại lệ chưa nghiệm thu

- Kiểm tra thủ công app ngân hàng/QR, máy quét mã vật lý và máy in **NOT RUN**; không thay bằng kết quả mô phỏng trình duyệt.
- G6 hai trường nhân viên/trạng thái trên UI vẫn **BLOCKED** theo quyết định giữ Figma; G7 payload máy quét vẫn mở. Không tự miễn trừ các yêu cầu này.
- Audit dependencies trước đó có 13 findings (2 critical, 1 high, 10 moderate); không chạy lại audit hoặc đổi dependencies trong task này.
- Nghiệm thu T02–T06/G8 cần chủ dự án xác nhận. Chỉ đề xuất review sau khi trình bày đầy đủ kết quả; không tự chuyển G9.

## Kiểm tra local

Chạy `D:\50K142-NEW\CHAY_COCO_LOCAL.cmd`; mở http://127.0.0.1:5173/50K142.03.3007/ trong Chrome. Giữ đúng origin để dùng dữ liệu hiện có, không xóa storage. Xem [LOCAL_RUN.md](LOCAL_RUN.md).

1. Đăng nhập Chủ và Nhân viên trên hai tab cùng trình duyệt.
2. Tại Bán hàng, chọn khách đã đăng ký thành viên và sản phẩm hợp lệ; kiểm tra ưu đãi tự động khi đủ 50 điểm.
3. Thanh toán tiền mặt hoặc chuyển khoản sau khi kiểm tra tiền thực nhận; đóng thông báo trở về danh sách.
4. Mở chi tiết từ danh sách hoặc Khách hàng → Lịch sử mua → giao dịch; đối chiếu tiền/hàng. Ctrl+P để xem bản in không có sidebar.
5. Tab còn lại có thể tra cùng lịch sử; nếu đang giữ quote điểm/giá cũ, thanh toán phải bị chặn và cho phép quay lại lấy quote mới.
