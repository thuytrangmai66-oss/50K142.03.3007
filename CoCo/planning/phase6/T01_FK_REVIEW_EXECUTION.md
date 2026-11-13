# T01 — hoàn thiện FK và adapter candidate

Ngày 11/11/2026. **Candidate đã có bằng chứng để review; chưa nghiệm thu hoặc kích hoạt P03/P04.** Lượt này tiếp tục phần T01 được cho phép, không xây UI hoặc triển khai trước task T03/T05.

## Thay đổi source

| File | Thay đổi |
|---|---|
| `src/repositories/errors.ts` | Tách RepositoryError dùng chung, giữ re-export tương thích và cùng class identity cho caller cũ |
| `src/repositories/purchase-links.ts` | Tách validator graph/provenance khỏi service, selector FK theo metadata định dạng mới đầy đủ; không có side effect khi import |
| `src/repositories/constraints.ts` | Runtime v3 giữ nguyên đường FK legacy; chỉ DB candidate v4 có store provenance mới chạy validator/selector candidate. Không có marker thì vẫn bắt buộc composite detail cũ |
| `src/services/purchase-candidate.ts` | Dùng validator repo chung; read adapter kiểm graph trước trả snapshot mới, thiếu snapshot nhưng có provenance phải báo lỗi thay vì fallback |
| `tests/fixtures/purchase-finalized-graph.ts` | Fixture validator gồm hai món cùng bracket khác giá, tổng 200.001; không giả là finalize/approval service đã có |
| `tests/unit/purchase-candidate.test.ts` | Thêm 9 case: FK mới hợp lệ không cần dòng gộp giả; 6 biến thể metadata lỗi; legacy FK strict; reverse-FK abort rollback cả transaction |
| `tests/fixtures/purchase-candidate-browser.ts`, `tests/e2e/purchase-candidate-storage.spec.ts` | Thêm native Chromium FK integration, lỗi cost trong transaction phải rollback; log JSON riêng |

Không sửa `CoCoDatabase` hoặc đăng ký migration trong app/provider/router. Runtime vẫn v3/21 store, candidate test v4/27 store. Không ghi lại/xóa dữ liệu legacy hoặc gán nghĩa cho số `TrangThai`. SHA-256 của năm file UI/test G5 được so với manifest và giữ nguyên.

## Kết quả đã thực thi

| Kiểm tra | Kết quả |
|---|---|
| Baseline đầu lượt | Lint/typecheck PASS; 145/145 unit/integration PASS |
| Targeted contract/candidate sau thêm FK | 53/53 PASS; sau đó adapter được siết chặt thêm và chạy full suite |
| Full unit/integration cuối | **154/154 PASS**, 8 file, exit 0: 101 regression + 20 contract + 33 candidate |
| Lint/typecheck/build cuối | PASS, exit 0 |
| Static audit phase6 | 5/5 PASS, exit 0 |
| Full Chromium cuối | **54/54 PASS**, exit 0, 3,2 phút: 52 regression UI cũ + 2 native candidate storage/FK integration |
| UI G6 / demo A–F / 74 SC | NOT RUN; chưa được triển khai, native IDB integration không thay UI E2E |
| Production/Pages | NOT RUN; không commit/push/deploy |

Một lần typecheck trung gian bắt lỗi thứ tự `async/export` trong thao tác tách module; đã sửa trước full suite. Không bỏ kiểm thử hoặc nâng timeout để che lỗi.

## Phạm vi bàn giao và việc còn mở

Gói [T01_REVIEW_GATE.md](T01_REVIEW_GATE.md) dùng để đối chiếu P03/P04: giữ data/khóa legacy, draft riêng, dòng ID riêng, snapshot request, FK/provenance có discriminator, migration và transaction foundation có rollback/CAS/receipt/guard.

API quyết định/delivery, invalidation/hủy dòng, command finalize và UI tương ứng vẫn thuộc T02–T07, chưa được báo hoàn thành. T01 cần mô tả/đối chiếu contract trước các producer này, không đòi code producer T05 để hoàn thành thiết kế T01. Các lựa chọn cancellation/invalidation và mapping số cho bản ghi mới còn OPEN trước task phụ thuộc; không lấy mã legacy làm mặc định.

Q20 đã chốt là nhân viên kiểm tra hàng ngoài app; không thêm checklist/bảng/trạng thái kiểm định. Công thức giá đầu đã chốt cost từng món ×1,30, nearest/half-up, giữ nguyên. **Quyền kích hoạt runtime P03/P04 chưa được phê duyệt.** Test PASS không thay nghiệm thu G5/G6 hoặc quyền này.

Bằng chứng lưu riêng tại [evidence/t01-fk-review](evidence/t01-fk-review) và [EVIDENCE_T01_FK_REVIEW.json](EVIDENCE_T01_FK_REVIEW.json), không ghi đè các manifest cũ. Ảnh regression chỉ là UI cũ; T01 dùng native JSON log, không chụp ảnh giả UI G6.
