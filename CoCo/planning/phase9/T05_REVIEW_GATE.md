# T05 — Gói review dashboard và quyết định đã nhận

> **Quyết định mới hơn G9-D05:** người dùng duyệt phương án A về mốc cuối tháng trước VN/phạm vi nhập-bán đã xác minh. [Review](HISTORICAL_STOCK_REVIEW.md), [triển khai và test](STOCK_COMPARISON_EXECUTION.md). Gate mà G9-D04 giữ BLOCKED nay đã mở; các dòng BLOCKED/chưa chốt của mốc trước bên dưới được giữ làm lịch sử, không thay quyết định mới.

> **14/11/2026 — APPROVED_USER, G9-D04:** “Duyệt: KPI toàn cửa hàng theo ngày VN + M01-B (xóa marker cùng hồ sơ) + wording đề xuất”. M01-B, U01, phạm vi staff và wording trong gói này được phép triển khai; M01-A không được chọn. So sánh tồn kho tháng trước vẫn BLOCKED. Xem [Decision Log](DECISION_LOG.md), [execution hiện hành](T05_EXECUTION.md). Nội dung đề xuất dưới đây giữ làm lịch sử để đối chiếu chính xác gói đã duyệt; các chữ OPEN/chưa kích hoạt mô tả thời điểm trình review.

Ngày 14/11/2026. **PROPOSED / CHƯA PHÊ DUYỆT**. Lệnh “tiếp tục” không tự thay các gate G9-M01/U01 đã ghi theo chỉ đạo trước. Không ghi metadata khách mới, không gắn KPI mẫu vào Trang chủ.

## Phần đã đủ điều kiện và đang triển khai

Truy vấn readonly KPI Chủ (doanh thu hôm nay/hôm qua, số hóa đơn hoàn tất, pending approval đúng revision/draft đang mở, tồn kho có mapping đã xác minh), kiểm quyền owner tách với home.read của staff. Hai lối vào Thu mua/Bán hàng theo SC007/198 mở **danh sách**, không tạo draft khi bấm. Đây là phần runtime hiện được phép; chưa thay welcome shell bằng dashboard bốn thẻ khi các trạng thái dưới còn OPEN.

## Bản trình bày cụ thể để review

[HTML tự chứa, mở local](review/t05-dashboard.html). Ảnh: [Chủ](evidence/t05/owner-proposal.png), [Nhân viên](evidence/t05/staff-proposal.png).

Đây là tài liệu đề xuất riêng, không là route/app/nguồn dữ liệu thật. Số minh họa được đánh dấu là dữ liệu review, không báo cáo là chức năng KPI hoàn thành. Giữ bố cục 2×2, thẻ trắng, nền be, icon đen và hai nút đen/be theo SC007/198.

## G9-M01 — Nguồn ngày tạo hồ sơ, vẫn OPEN

Payload dự kiến cho **khách mới sau khi được duyệt** trong appMetadata hiện hữu:

```json
{
  "format": "customer-creation-v1",
  "customerId": "<MaKH>",
  "createdAt": "<timestamp ISO có timezone do service xác lập>",
  "createdBy": "<định danh nhân viên>",
  "operationId": "<operation tạo khách>",
  "source": "customer-create"
}
```

Key: `customer-creation:<MaKH>`. Không thêm bảng/cột/version DB; vẫn là dữ liệu mới nên chưa được ghi. Không backfill khách legacy, không lấy ngày hóa đơn/membership/import thay ngày tạo. Ghi marker cùng transaction tạo hồ sơ/receipt/audit; kiểm replay, rollback từng store, trùng phone/đa tab. Không đổi ngày khi sửa profile.

Chủ dự án cần chọn vòng đời khi xóa hợp lệ khách chưa có giao dịch:

| Phương án | Khi xóa hồ sơ | Ý nghĩa KPI |
|---|---|---|
| M01-A | Giữ marker tối thiểu (ID/thời điểm/actor/operation, không tên/phone) | Đếm lượt tạo hồ sơ đã xác minh trong kỳ, kể cả hồ sơ về sau bị xóa; phải cho phép dạng provenance này không còn FK sống |
| M01-B | Xóa marker cùng transaction xóa hồ sơ | Đếm hồ sơ hiện còn và có ngày tạo được xác minh trong kỳ; xóa hợp lệ có thể làm giảm KPI |
| Chưa duyệt | Không tạo namespace | KPI khách mới tiếp tục BLOCKED, không tự hiển thị số 0 đầy đủ |

Chưa triển khai cả A/B, không tự chọn vòng đời. Cần duyệt cùng định nghĩa KPI tương ứng trước code.

## G9-U01 — Chú thích trong ô hiện có, vẫn OPEN

Đề xuất trong ảnh Nhân viên: số lớn **“0 người đã xác minh”**, dòng nhỏ **“3 hồ sơ chưa có ngày tạo tin cậy”**. Số lớn chỉ đếm hồ sơ đủ điều kiện trong kỳ; số nhỏ là tổng hồ sơ chưa có nguồn ngày tạo, không khẳng định chúng được tạo trong kỳ. Không thêm card/banner/cột hoặc lấy giao dịch đầu tiên làm ngày tạo. Đây là thay đổi văn bản/dòng chú thích so với SC198, chưa đưa lên runtime.

## G9-DASH-01 — Phạm vi dashboard Nhân viên, OPEN

SC198 không ghi rõ số liệu toàn cửa hàng hay riêng nhân viên; “Sản phẩm mới nhập/Khách hàng mới” cũng chưa ghi kỳ. Đang xin xác nhận hai lựa chọn:

- Toàn cửa hàng, bốn KPI theo ngày hiện tại Việt Nam.
- Riêng nhân viên đăng nhập, bốn KPI theo ngày hiện tại Việt Nam. Nếu chọn, nguồn actor tạo/mua/bán phải có bằng chứng tin cậy, không suy từ tên.

Không tự áp dụng nguồn customer-creation, phạm vi staff hoặc các nhãn kỳ trước khi chốt.

## G9-DASH-02 — Dòng so sánh, OPEN về UI và lịch sử

- Doanh thu hôm nay/hôm qua cùng dựa hóa đơn hoàn tất có paidAt tin cậy. Mẫu số >0 thì phần trăm = (hôm nay − hôm qua)/hôm qua ×100, dấu +/- theo kết quả. Đề xuất hiển thị tối đa một chữ số thập phân, chỉ là format hiển thị, không lưu/làm tròn tiền.
- Hôm qua =0: DTO trả NO_BASELINE/percent null, không +100%, không NaN/Infinity. Đề xuất dùng dòng **“Chưa có cơ sở so với hôm qua”** ngay slot so sánh cũ.
- Số đơn so với hôm qua: hiệu hai số hóa đơn hoàn tất; không lấy số dòng hàng hoặc draft.
- Tồn kho hiện tại: chỉ đếm trạng thái được mapping; còn hàng chưa xác minh thì không được biến qualified-zero thành toàn bộ tồn kho. Đề xuất ô lớn “Chưa xác minh”, dòng nhỏ nêu số hàng chưa đối chiếu trạng thái khi cần; chưa kích hoạt wording này.
- So sánh tồn kho với tháng trước: chưa có định nghĩa mốc “tháng trước” và nguồn lịch sử đủ tin cậy được duyệt. Đề xuất tạm dòng **“Chưa đủ cơ sở so với tháng trước”** trong slot cũ, giữ chỉ tiêu lịch sử BLOCKED. Không suy lại mã legacy, không lấy lượng nhập tháng trước làm lượng tồn, không tự ghi snapshot mới. Việc duyệt placeholder tạm không đồng nghĩa nghiệm thu chỉ tiêu so sánh lịch sử.

Chỉ sau phê duyệt rõ nguồn dữ liệu, phạm vi và wording mới nối các thẻ tương ứng vào HomePage. Các phần thiếu nguồn còn BLOCKED; không đánh G9 DONE, không chuyển G10 hoặc push vì ảnh đề xuất render thành công.
