# Rà soát G5 trước khi chuyển G6

Ngày 11/11/2026. **READY FOR REVIEW — đã hoàn thiện các thiếu sót G5 và chạy hồi quy, chưa tự DONE/nghiệm thu pixel**. Đây là lượt hoàn thiện phần còn thiếu của G5 theo yêu cầu kiểm tra trạng thái trước coding; không mở thêm phase/task nghiệp vụ và không triển khai lại G1–G5.

## Xác định giai đoạn thực tế

- Đã đọc MASTER_PLAN, PHASE_ROADMAP, báo cáo/checklist G1–G5, PLAN_PHASE_6 và DEMO_ACCEPTANCE; đối chiếu UC8/SC145–162 và dependency UC1/UC6/P03/P04/Q20 với CODEX local, schema/repository thực tế.
- G0 có ghi nhận nghiệm thu của người dùng; G1 có báo cáo ĐẠT điều kiện chuyển tiếp. G2 có nền dữ liệu và các kiểm thử đã triển khai. G3–G5 vẫn ghi READY FOR REVIEW; không tìm thấy kết luận nghiệm thu DONE riêng cho G5. Không suy ra nghiệm thu từ việc source đã tồn tại hoặc test PASS.
- G5 là giai đoạn có source gần nhất. G6 Thu mua/phê duyệt là giai đoạn kế tiếp, chưa có service/route/UI tương ứng. Vì G5 còn thiếu control/bằng chứng, lượt này xử lý các phần đó trước.
- Git root `D:\50K142-NEW`; app `CoCo/`; nhánh `coco/phase-5-staff`; HEAD `22d3fbdd7cee0db717c62e003c5f4075f3707712`; origin fetch/push `https://github.com/thuytrangmai66-oss/50K142.03.3007.git`. Working tree đã có nhiều thay đổi G3–G5 và CODEX untracked trước lượt này, được giữ nguyên. Không stage/commit/push/deploy hoặc đổi Git/workflow.

## Phần source đã hoàn thiện trong lượt này

1. SC158: thêm nút hiện/ẩn mật khẩu khi đã nhập, đúng mô tả điều khiển local. Mặc định che mật khẩu; đóng/mở form mới không giữ trạng thái hiện; nút có nhãn truy cập và không submit form.
2. SC153/154/155/159/160: thêm icon cảnh báo bên cạnh lỗi trường của form nhân viên theo ảnh nguồn; giữ nguyên rule, nội dung lỗi và transaction.
3. SC147: lỗi đọc chi tiết hiển thị popup cảnh báo chung, đóng được và thử lại được. Không biến tài khoản không tồn tại thành lỗi storage; không chồng popup lên thông báo xóa thành công.
4. SC146: empty state nhân viên đặt icon trên nội dung, màu xám theo nguồn. Giữ bố cục phân trang/bảng đã tinh chỉnh, không thêm đường kẻ dòng.
5. Thêm E2E đi qua giao diện thật cho các trạng thái G5 chưa có bằng chứng đầy đủ: tạo/sửa/xóa/đọc lỗi, retry, snapshot toàn bộ DB không đổi khi hủy hoặc transaction thất bại, password toggle và các viewport.
6. Qua đối chiếu ảnh, sửa SC150/157/162: giữ card vừa xóa ở dạng readonly phía sau kết quả thành công, không hiện lỗi “Tài khoản không tồn tại”; giữ form tạo/sửa phía sau popup thành công đến khi đóng thông báo. Khóa nút Lưu/Hủy/X của form đã lưu để không gửi lại. Xóa mật khẩu khỏi state sau commit, không đưa credential vào DTO hoặc ảnh dưới dạng rõ.

Không sửa service nghiệp vụ, schema, quy tắc rename/inactive/quyền, mapping độ mới hoặc dữ liệu trình duyệt người dùng. Field chỉ thêm slot action/errorIcon tùy chọn; các form khác không tự nhận icon hoặc nút mới.

| File source/test trong lượt này | Thay đổi |
|---|---|
| `src/components/ui/Field.tsx` | Slot action và errorIcon, giữ label/aria liên kết lỗi |
| `src/features/staff/StaffForm.tsx` | Password toggle và icon lỗi theo Design |
| `src/features/staff/StaffPages.tsx` | Popup lỗi đọc chi tiết và class empty state nhân viên |
| `src/index.css` | CSS cho hai slot và empty state có phạm vi staff |
| `tests/e2e/staff-review.spec.ts` | Ba ca nghiệm thu bổ sung, capture SC145–162 và kiểm hồi phục |

## Kết quả kiểm thử thực thi

| Lệnh / phạm vi | Kết quả đã xác minh |
|---|---|
| Baseline trước sửa: lint/typecheck/unit/build/Chromium | PASS; 101 unit/integration và 49 Chromium, exit 0 |
| `npm test -- --maxWorkers=1` sau sửa | **101/101 PASS**, 6 file, không skip, exit 0 |
| `npm test` mặc định sau nhóm sửa popup cuối | **101/101 PASS**, 6 file, exit 0, 14,81 giây; ca auth từng timeout đạt 789ms |
| `node scripts/audit-phase1.mjs` | **5/5 PASS**, exit 0 |
| `npm run lint`, `npm run typecheck`, `npm run build` cuối | **PASS**, cả ba exit 0 |
| `CI=true npm run test:e2e -- --reporter=line --retries=0 --global-timeout=300000` cuối | **52/52 PASS**, một worker, không retry/skip; exit 0, 2,6 phút |
| Pixel comparison tự động / baseline được người dùng duyệt | **NOT RUN**; không dùng contact sheet làm pixel PASS |
| G6 thu mua/phê duyệt A/B/D/E và tích hợp C/F | **NOT RUN**; G6 chưa triển khai |
| CI/Pages của thay đổi hiện tại | **NOT RUN**, không push/deploy |

Một lần Vitest chạy song song trong quá trình sửa có **100 PASS, 1 timeout 5 giây** tại ca auth thực hiện nhiều phép PBKDF2. Toàn bộ suite chạy lại với một worker đạt 101/101; ca từng timeout mất 640ms trong lần đó. Sau nhóm sửa cuối, lệnh mặc định `npm test` cũng đạt 101/101, ca đó mất 789ms. Không tăng timeout, giảm số vòng PBKDF2 hoặc đổi assertion để bỏ lỗi. Đây không phải kiểm thử SLA/NFR.

Ca tiêm lỗi đọc ban đầu FAIL: fixture lỗi một lần chưa bảo đảm trạng thái lỗi còn tồn tại khi assertion chạy. Fixture cuối mô phỏng lỗi index MaNV kéo dài trong browser test đến khi chủ đóng thông báo và bấm Thử lại; truy vấn xác thực bằng PK không bị chặn. Không thêm cơ chế tiêm lỗi vào source sản phẩm. Một lần build trung gian báo thiếu prop errorIcon khi đang hoàn thiện Field; đã bổ sung prop trước build cuối.

## Ảnh và đối chiếu thiết kế

Nguồn là `CODEX/.uc-ui-matrix-qa/frame-145.png` đến `frame-162.png` và mô tả control trong Design local. Đã mở bộ ảnh đối chiếu đủ **18/18 SC** để review nội dung, bố cục và điều khiển; sửa các sai lệch phát hiện ở password/validation/empty/error và nền popup thành công rồi chạy lại 52 E2E. Không truy cập Figma online, không dùng ảnh nguồn thay ảnh ứng dụng.

Ảnh ở [evidence/staff-review](evidence/staff-review); [manifest SHA-256](STAFF_REVIEW_EVIDENCE.json) liên kết source/test chưa commit, ảnh nguồn, phiên bản Chromium và ảnh ứng dụng. Contact sheet `compare-145-146.png` … `compare-161-162.png` đặt nguồn phía trên, ứng dụng phía dưới, giữ annotation đỏ ở ảnh nguồn để truy vết; không áp annotation vào app.

Ảnh chính: [chủ — danh sách](evidence/staff-review/SC145.png), [chủ — form tạo](evidence/staff-review/SC158.png), [xác nhận xóa](evidence/staff-review/SC149.png), [nhân viên — phiên tab riêng](evidence/staff-review/staff-created-ui-session.png). Sau vòng sửa popup, đã mở lại SC150/157/162 và ảnh phiên nhân viên để xác minh kết quả cuối.

| Trạng thái | Kết quả chức năng thực thi / bằng chứng |
|---|---|
| SC145/146 | Danh sách ba cột, empty icon/nội dung, pagination chung và không có line thừa |
| SC147/148 | Lỗi list/detail có popup đóng/retry, đọc chi tiết không password/secret |
| SC149/150/151 | Hủy/X không ghi; xác nhận đúng tài khoản; thành công giữ snapshot readonly, lỗi rollback/retry |
| SC152/153/154/155 | Sửa ba trường, required/phone sai/trùng phone-user có lỗi đúng và không lưu |
| SC156/157 | Lỗi cập nhật giữ input/rollback/retry; thành công giữ form phía sau kết quả |
| SC158/159/160 | Tạo bốn trường, hiện/ẩn mật khẩu và mặc định che ở form mới; required/duplicate |
| SC161/162 | Lỗi tạo giữ form/rollback/retry; thành công không cho submit lại |

Các trạng thái ứng dụng được dựng bằng thao tác UI và lỗi DB trong test, không ghi sẵn request/account mục tiêu để giả chức năng. Ba test mới kiểm console/pageerror bằng mảng rỗng. Form được kiểm ở 1366×768, 1440×900, 1920×1080 và 390×844; regression cũ kiểm thêm sáu viewport, pagination thích ứng và hai tab.

Khác biệt còn ghi nhận: ID/tên/phone/dataset là giá trị kiểm thử động; menu chỉ có module đã triển khai đúng phase; kích thước form/card giữ các tinh chỉnh desktop đã được người dùng yêu cầu trước đó; panel Thử lại phía sau popup lỗi tải có thể khác nền danh sách mẫu của nguồn. Sau khi tạo xong, mật khẩu được xóa khỏi form state nên không giữ dãy ký tự mẫu dưới thông báo như SC162. Chưa chứng nhận đồng nhất pixel hoặc tỉ lệ giống Figma; baseline/ngưỡng visual của TEST_MASTER_PLAN chưa được duyệt. Không thay hình nền hoặc che sai lệch bằng mask/baseline tự tạo.

Các ảnh `before-success-delete.png`, `before-success-edit.png`, `before-success-create.png` giữ bằng chứng lỗi hiển thị vừa tìm được trong vòng review; ảnh SC150/157/162 là kết quả sau sửa. Các mốc `LIST_LAYOUT_POLISH_REVIEW.md`, `CONFIRM_DIALOG_REVIEW.md` và manifest cũ được giữ như lịch sử, không gọi SHA cũ là source hiện tại.

## Điều kiện chuyển tiếp và G6

G5 chưa tự đánh dấu DONE khi review/visual cuối chưa nghiệm thu. Không có căn cứ coi A–F thu mua/phê duyệt đã chạy chỉ vì hai phiên và live customer/staff data đang PASS.

Hai dependency nghiệp vụ/mô hình G6 được cụ thể hóa tại [DATA_CONTRACT_REVIEW.md](../phase6/DATA_CONTRACT_REVIEW.md): draft chưa có khách không thể thỏa FK hóa đơn hiện tại; hai dòng cùng bracket khác giá không thể gộp trung thực bằng composite key G2; BR-UC1-07 chưa có tiêu chí thẩm định ngoài danh mục Mới/Tốt/Khá. Đã gửi yêu cầu quyết định P03/P04 và Q20, chưa có câu trả lời trong lượt rà soát. Chưa áp dụng đề xuất migration, không tạo khách/hóa đơn giả và không đổi thứ tự G5 → G6 → G7.

## Mở website và demo phần đã có

```powershell
cd D:\50K142-NEW\CoCo
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Mở http://127.0.0.1:5173/50K142.03.3007/ . Nếu terminal đã có server cổng 5173 thì dùng server đó. Đăng nhập chủ hiện có; nếu DB thật chưa có chủ thì thiết lập một lần qua form, không có tài khoản mặc định.

1. Chủ → Nhân viên → Tạo tài khoản; nhập bốn trường và thử hiện/ẩn mật khẩu → Lưu.
2. Mở chi tiết, sửa tên/điện thoại hoặc username; thử Hủy và xác nhận thông tin cũ giữ nguyên.
3. Mở tab mới cùng URL/origin, đăng nhập nhân viên vừa tạo; phiên chủ vẫn giữ nguyên. Nhân viên không có quyền quản lý nhân viên/khung giá.
4. Chủ sửa tên nhân viên, tab nhân viên tự cập nhật. Rename username hoặc xóa account thu hồi phiên nhân viên theo contract G5; chủ vẫn đăng nhập.
5. Với popup xóa, Hủy hoặc X không ghi dữ liệu; chỉ Xác nhận mới vô hiệu hóa đúng tài khoản. Đây là demo G5, chưa phải demo gửi/duyệt thu mua G6.

Đồ án dùng frontend/local IDB và sessionStorage riêng từng tab, không Supabase, không đồng bộ đa máy và không tuyên bố bảo mật tương đương backend. Các bài tiêm lỗi chỉ chạy trong profile Chromium kiểm thử riêng.
