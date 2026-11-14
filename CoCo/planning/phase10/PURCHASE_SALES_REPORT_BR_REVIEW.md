# G10-T02 — Thu mua, bán hàng và báo cáo

Ngày 14/11/2026. Review 50 BR còn lại bằng nội dung SRS/locator trong REQUIREMENT_TRACEABILITY, các quyết định dữ liệu đã duyệt và assertion thực trong test. Không dùng tên test làm chứng nhận đủ nhánh/visual. Bảng này hoàn tất kiểm kê assertion 98 BR cùng các review trước, **không đánh dấu 98 BR PASS hoặc nghiệm thu G10**.

## Thu mua — 17 BR

| BR | Assertion đã đối chiếu | Bằng chứng / giới hạn |
|---|---|---|
| UC1-01 | Tra phone không có khách cho phép tạo/chọn khách thật; reload vẫn giữ cùng hồ sơ, chưa tạo invoice/stock | `purchase-drafts.spec.ts` real customer creation/selection; reference-data service search |
| UC1-02 | Tên/phone tạo hồ sơ không được rỗng; lỗi không ghi DB | `reference-data.test.ts`, `reference-data.spec.ts`, `customer-edit.test.ts`; không tự tạo khách placeholder cho draft |
| UC1-03 | Type/brand/condition/quantity rỗng trả đủ field errors; không tìm nhầm combo | `purchase-drafts.test.ts` required fields; UI modal nhập món |
| UC1-04 | Quantity rỗng/0/-1/1.2/overflow/abc bị từ chối trước ghi | Sáu tham số unit findBracket; contract integer và E2E draft |
| UC1-05 | UnitCost0/-1/1.5/abc/unsafe bị chặn; số dương dưới Min không tự thêm yêu cầu duyệt | `purchase-drafts.test.ts` invalid price/accepts Max and below-Min |
| UC1-06 | Duplicate phone race chỉ một hồ sơ; đổi tên/phone giữ MaKH và hai lịch sử | `customer-creation.test.ts`, `customer-edit.test.ts`, `reference-data.test.ts`; không tách dữ liệu theo role |
| UC1-07 | Nhân viên kiểm hàng trước nhập, không có kiểm định tự động hoặc loại theo condition1/2/3 | Quyết định BR-UC1-07 đã chốt trong G6; đây là tiền điều kiện ngoài phần mềm, không báo test tự động thẩm định chất lượng PASS |
| UC1-08 | Khung đúng type+brand+condition đã tagged, khác brand/condition không match; legacy không tự được gán catalog mới | `purchase-drafts.test.ts`, reference-data legacy condition tests |
| UC1-09 | Một product/món, ID riêng; không dùng lại issued/versioned/tombstone hoặc trùng trong batch; hết retry rollback invoice | `purchase-finalization.test.ts` quantity3, forced ID collisions/retry exhaustion |
| UC1-10 | Hóa đơn sinh tự động và một lần khi finalize; replay/race không tạo thêm invoice/stock/receipt | Finalization replay/two-connections + native E2E; **2 unit mới** kiểm invoice ID existing/issued/version-tombstone và exhaustion rollback/retry, giữ raw legacy nguyên vẹn |
| UC1-11 | Giá100001>Max100000 tạo đúng một pending; Max100000 không pending; pending/rejected không finalize; approval đúng snapshot mới tiếp tục | Draft/approval/finalization unit và real two-tab UI; không coi approval là hóa đơn hoàn tất |
| UC1-12 | Tra cứu phải có phiên hợp lệ; logout bị AUTH_REQUIRED, cả owner/staff có quyền đọc đúng | `purchase-queries.test.ts` roles/session + `purchase-queries.spec.ts` |
| UC1-13 | Tìm ID/phone/name/date theo ngày VN, trim/case insensitive theo contract | `purchase-queries.test.ts`: 25 legacy rows độc lập, ngàyUTC18:00 thuộc ngày VN kế tiếp |
| UC1-14 | Kết hợp bốn điều kiện cùng lúc; date không khớp cho0; đổi filter clamp page | Combined filters thực, không dùng OR thay AND |
| UC1-15 | Chỉ kết quả phù hợp; trang1 đúng10 ID, trang3 đúng5 ID, invalid calendar bị từ chối | Unit queries + real UI search/empty/pagination |
| UC1-16 | Hai dòng cùng bracket có quantity2×80005 và1×90000, tổng250010; DTO có actor/status, không dùng khung mới để reprice | `purchase-queries.test.ts` canonical mixed prices. **UI Nhân viên/Trạng thái vẫn BLOCKED** theo quyết định giữ Figma; không miễn trừ SRS |
| UC1-17 | Reload/reopen giữ invoice/line/cost/legacy codes; dữ liệu hỏng báo lỗi, không repair/fallback che sai | Query corrupt customer/employee/snapshot/cost/product/mapping/total; finalization rollback, T06 native read/reload |

## Bán hàng — 12 BR

| BR | Assertion đã đối chiếu | Bằng chứng / giới hạn |
|---|---|---|
| UC3-01 | Chỉ mapped available product được thêm; missing/sold/unmapped/stale bị từ chối; quote cũ sau scheduler không được thanh toán | `sales.test.ts`, `sale-payment.test.ts`, native payment/scheduler E2E |
| UC3-02 | Một món vật lý quantity1, subtotal tổng các line snapshot; hai món cùng bracket giá104001/104002 vẫn giữ riêng; overflow bị chặn | Sales draft integer subtotal và paid mixed-price test; không merge mất giá từng món |
| UC3-03 | Cash/transfer đều thật; QR encode bank970443/account chuỗi0947800469, currency704, total sau giảm và invoice ID; quote không ghi DB | `sale-payment.test.ts` giải TLV/CRC độc lập; UI cash/QR; không tự xác minh tiền vào ngân hàng |
| UC3-04 | Chỉ finalize xác nhận thành công mới ghi invoice/stock/points/receipt; lỗi ở9 store rollback mọi dữ liệu và retry | Unit payment fault matrix + UI quota/audit retry; draft/quote không là invoice hoàn tất |
| UC3-05 | Quote cấp invoice ID, finalize lưu cùng ID; replay không tạo bản ghi mới; method đổi với opId cũ bị OPERATION_REUSED | **2 unit mới** kiểm IDexisting/issued/version-tombstone; quote không reservation, exhaustion không có side effect; finalize giữ invoice mới/legacy đúng ID |
| UC3-06 | Membership opt-in được lưu atomic; nonmember không hưởng/trừ/tích điểm; foreign cart và revoked session bị chặn | `sales.test.ts` membership consent/race/rollback; payment nonmember test |
| UC3-07 | Điểm lấy phần nguyên tiền thực trả/10000: total83201 được8; discount không được tích thêm điểm | Promotion unit100003→80002→8 điểm; payment verified snapshot |
| UC3-08 | Eligible member dùng đúng50 điểm giảm20%; 49 không đủ;50/51 xử lý đúng; UI hiện tại tự áp ưu đãi theo D05 | `sales-pages.spec.ts`, sales pure calculation và payment. Helper tương thích pre-D05 cho hóa đơn cũ không là quyền thêm checkbox trở lại UI |
| UC3-09 | Chỉ trừ điểm sau commit thành công; lỗi giữ điểm cũ; tiền giảm không tính điểm mới | Payment9-store rollback, hai tab tranh cùng50 điểm với hai món khác nhau; không double-consume |
| UC3-10 | Replay/race chỉ cập nhật điểm một lần; logout replay bị chặn; lịch sử không tự tính lại điểm | Unit payment + `sales-t05-t06.spec.ts`; **unit mới** tiến clock365 ngày, đăng nhập mới/reopen, balance50 vẫn dùng được50, membership/DB không bị reset khi quote. Đây là mô phỏng clock, không phải quan sát thiết bị qua một năm |
| UC3-11 | Tìm invoice/date/name/phone kết hợp; legacy25 bản ghi chia9/9/7 không trùng; cập nhật profile vẫn tra đúng | `sale-payment.test.ts` queries and legacy pagination; sales pages E2E |
| UC3-12 | Invoice/history read-only mọi store; profile/catalog thay đổi không sửa paid snapshot; corrupt proof không fallback; print không ghi | Unit paid history/query + E2E T05 print/reload; ngoại lệ trường trạng thái UI G8 vẫn giữ BLOCKED |

## Báo cáo — 21 BR

| BR | Assertion đã đối chiếu | Bằng chứng / giới hạn |
|---|---|---|
| UC7-01 | Revenue tổng paid total sau ưu đãi theo paidAt trong kỳ; real two-line discounted sale166402 chỉ một invoice | `report-queries.test.ts` revenue reconciliation; midnightVN split104001/104001 |
| UC7-02 | Average=total/count; count0 cho0; daily rows2+7+7 đối soát tổng, average ngày có thể3.5 ở kernel | `revenue-report.test.ts`; không tự đổi công thức để ép thành số mẫu Figma |
| UC7-03 | Draft/cancel/purchase không là revenue; legacy dù date/code giống mới vẫn UNVERIFIED; proof hỏng/thiếu ngày bị loại khỏi kỳ | Report eligibility/revenue integration, không backfill NgayBan thành paidAt |
| UC7-04 | ProductCount tính món thật, không số dòng; hai giao dịch6 món report6 | `report-queries.test.ts` T03 multiple lines/quantity |
| UC7-05 | Purchase cost theo trusted paidAt thuộc kỳ; metadata thiếu paidAt không lấy finalizedAt/date khác thay | Unit purchase-cost missing-time/date filters, period VN kernel |
| UC7-06 | Cost từ paidTotal/snapshot, thay Min/Max sau hoàn tất không đổi cost lịch sử | Unit report purchaseCost after bracket edit và finalization mixed prices |
| UC7-07 | Chỉ approval/pending/cancel chưa finalize không tăng purchase cost | Purchase report draft/pending fixtures; hành trình approve→finalize→report |
| UC7-08 | Finalize replay không làm report đếm lại; invoice IDs unique, receipt phải tồn tại | Unit T03 replay + missing finalization receipt loại record |
| UC7-09 | averageCost480006/2=240003; không giao dịch cho0 | Unit T03 summary + empty report |
| UC7-10 | Gross profit104001−80001=24000; giá bán10000 cho−70001, không clamp lỗ thành0 | Unit financial reconciliation/real loss; profit UI E2E |
| UC7-11 | COGS lấy productCosts/provenance của từng món; thiếu hoặc sửa cost sai gây REFERENCE, không fallback0 | Unit unknown costs + canonical purchase snapshot |
| UC7-12 | Chỉ sale đã có bằng chứng paid dùng trong profit; legacy chỉ có header không tính | Unit verified-only financial và report-eligibility |
| UC7-13 | Chỉ cost món đã bán tính vào profit; hàng chưa bán vẫn nằm outflow cash-flow | Cùng dataset profit outgoing80001 nhưng cash outgoing160002; sau bán cả2 cost160002 |
| UC7-14 | Kỳ chưa có sale hợp lệ: revenue/cost/profit0 | Unit empty profit summary, không fabricate daily rows |
| UC7-15 | Aged stock chỉ available được map, loại sold/unknown legacy; không suy numeric status | Unit stock age after real sale, untagged legacy case |
| UC7-16 | Stock age từ ngày nhập VN, minDays2 gồm đúng ngưỡng; minDays3 không có; 0/-1/fraction/NaN bị chặn theo contract hiện tại | Unit agedStock và E2E T04 filters; đổi giá/reset cycle không đổi ngày nhập |
| UC7-17 | Net cash=incoming−outgoing:104001−160002=−56001 | Unit financial reconciliation + cash-flow UI |
| UC7-18 | Incoming chỉ verified paid sales trong kỳ; day sale104001/outgoing0 | Unit period cash summary; legacy bị loại kèm coverage |
| UC7-19 | Outgoing chỉ verified finalized purchases có paidAt; ngày thu mua riêng160002, không lấy giá hiện hành | Unit outflow-only day, purchase report paid-time rules |
| UC7-20 | Dòng tiền chỉ hai nguồn sale/purchase; không thêm khoản thu/chi ngoài scope | Summary count2 (một thu/một chi) trên fixture được đối soát; UI không thêm control nguồn mới |
| UC7-21 | Kỳ không có thu/chi hợp lệ cho0, không backfill hoặc tạo bản ghi rỗng | Unit financial empty/year2000 và revenue empty grouping |

Rule nguồn và quyết định G9-D01..05 tiếp tục có hiệu lực: VERIFIED thiếu ngày khác UNVERIFIED; thiếu thời gian không vào kỳ, khách legacy không có createdAt tin cậy không vào KPI mới; M01-B xóa marker cùng hồ sơ. Các unit `report-eligibility.test.ts`, `customer-creation.test.ts`, report-legacy-migration và dashboard month-end kiểm riêng những điều kiện này. Không thêm schema/UI từ review.

## Kết luận phạm vi

Đã đọc assertion cho toàn bộ98 BR (23 trước +25 khung giá/phê duyệt/nhân viên +50 ở đây); chưa chứng nhận mọi MAIN/ALT/ERR/control/visual. Ba gap allocator invoice-ID/non-expiry đã bổ sung5 unit, nằm trong **full538 PASS**; invalid edit từng field trên UI, toàn bộ visual và ngoại lệ SRS/Figma còn mở. G10-T02 giữ PARTIAL/PENDING REVIEW, không đánh dấu DONE hoặc dùng review98 làm full UC coverage. Kết quả thực thi mới và ledger có scope G10 riêng tại [BR_REVIEW_EXECUTION.md](BR_REVIEW_EXECUTION.md).
