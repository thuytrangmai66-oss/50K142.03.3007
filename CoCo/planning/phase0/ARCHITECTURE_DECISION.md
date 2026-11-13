# Quyết định kiến trúc CoCo

> Trạng thái hiện hành 11/11/2026: người dùng đã nghiệm thu T01, cho phép kích hoạt P03/P04 và triển khai T02. Runtime CoCoDB v4/27 store thêm metadata thu mua, giữ dữ liệu/khóa/status legacy. T02 nhập món/giá/pending/chọn khách đã code và kiểm thử, READY FOR REVIEW; quyết định/delivery/finalize còn T03–T05. Xem [báo cáo T02](../phase6/T02_EXECUTION.md). AD01–AD08 và kiến trúc local không đổi, không Supabase hoặc backend. Branch `coco/phase-5-staff`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`, không commit/push/deploy lượt này. Những đoạn “mới nhất” dưới đây thuộc mốc lịch sử trước xác nhận này.

> Trạng thái mới nhất 11/11/2026: đã thực hiện G5 local, ưu tiên web desktop và sửa vị trí mở chi tiết; [REPORT_PHASE_5.md](../phase5/REPORT_PHASE_5.md). Giữ nguyên AD01–AD08, DB v3/21 store, no Supabase. Staff create/rename/inactive/revoke có UI thật; session hai tab độc lập. Nhánh `coco/phase-5-staff`, vẫn chưa commit/push/deploy. Các mốc Git/trạng thái G3/G4 bên dưới là lịch sử, không phải trạng thái triển khai G5 lên Pages.

> Chốt lại theo người dùng 11/11/2026 sau yêu cầu xem bản local: **KHÔNG Supabase, không backend, không sync đa máy**. AD02/AD03 tiếp tục có hiệu lực; đề nghị thêm Supabase trước đó đã được rút lại. Kiến trúc đang chạy là IndexedDB dùng chung theo origin, sessionStorage token riêng từng tab, không business data localStorage. G4 đã code khách hàng/khung giá và sửa responsive; xem [REPORT_PHASE_4.md](../phase4/REPORT_PHASE_4.md). Bộ mã độ mới mới được duyệt 3=Mới/2=Tốt/1=Khá, chỉ áp cho record mới có marker; không diễn giải lại mã cũ. Nhánh hiện tại `coco/phase-4-reference`, chưa commit/push/deploy. Kịch bản demo hai tab thu mua/phê duyệt thuộc G6, [test A–F](../phase6/DEMO_ACCEPTANCE.md) bắt buộc, chưa báo PASS trước triển khai.

> Đối chiếu ngày 11/11/2026: giữ nguyên AD01–AD08. Đọc thiết kế chủ/nhân viên từ CODEX local, không đọc Figma qua link. Người dùng đã yêu cầu tiếp tục sau [master plan](../MASTER_PLAN_COCO.md), cho phép roadmap/P01/P02; G3 auth/session/login/shell đã code local, **READY FOR REVIEW**. CoCoDB v3 chỉ thêm session store trên nền G2; 49 Vitest + 10 Chromium và lint/typecheck/build/audit PASS. Xem [báo cáo G3](../phase3/REPORT_PHASE_3.md), không coi test PASS là nghiệm thu visual hoặc đã deploy. Nhánh local `coco/phase-3-auth`, HEAD nền `22d3fbdd7cee0db717c62e003c5f4075f3707712`; chưa commit/push/merge/deploy lượt G3. Các mốc Git bên dưới là lịch sử kiểm kê.

> Cập nhật ngày 10/11/2026 (giờ Việt Nam): người dùng đã phê chuẩn toàn bộ đề xuất kỹ thuật trong [OPEN_ISSUES.md](OPEN_ISSUES.md) và nghiệm thu Giai đoạn 0 **ĐẠT điều kiện chuyển tiếp**. Source CoCo hiện đã được commit và push lên repository GitHub mới. Việc push không đồng nghĩa đã triển khai GitHub Pages hoặc hoàn tất nghiệp vụ.

Ngày kiểm kê và rà soát: 10/11/2026. Nguồn quyết định: chỉ đạo trực tiếp của người dùng trong chat, MASTER_PLAN_COCO.md và hồ sơ Giai đoạn 0. Nguồn xác minh trạng thái: Git local, truy vấn chỉ đọc nhánh `main` trên GitHub, mã hiện tại và [báo cáo Giai đoạn 1](../phase1/REPORT_PHASE_1.md). Bảng AD01–AD08 ghi quyết định đã duyệt, không phải danh sách chức năng đã hoàn thành.

| Mã | Quyết định đã được người dùng chốt | Ngày |
|---|---|---|
| AD01 | React + TypeScript + Vite + Tailwind, giữ cách tách UI, logic và repository của bộ khung | Theo plan đã giao |
| AD02 | Chỉ GitHub Pages + Dexie/IndexedDB; không Supabase, backend server riêng hoặc dịch vụ ngoài | 09/11/2026 |
| AD03 | Dữ liệu riêng theo trình duyệt/origin, phục vụ demo; chủ và nhân viên dùng cùng trình duyệt để thao tác trên cùng dữ liệu | 09/11/2026 |
| AD04 | QR chuyển khoản sinh cục bộ: SHB, tài khoản chuỗi 0947800469, tên MAI THUY TRANG, số tiền cuối cùng sau ưu đãi | 09/11/2026 |
| AD05 | Nhân viên kiểm tra tiền vào và nhấn xác nhận trên màn hình QR; nguồn hiện có đặt tên nút Đã nhận | 09/11/2026; tên nút đối chiếu 10/11/2026 |
| AD06 | SRS + Design gốc tại ổ D và Figma là nguồn chuẩn; 15 Word bổ sung chỉ tham khảo | 10/11/2026 |
| AD07 | Tạo bản CoCo riêng trong workspace hiện tại, chưa gắn GitHub | 10/11/2026 |
| AD08 | Lịch giảm giá 00:00 giờ Việt Nam; chạy khi web mở, xử lý bù khi mở lại | 10/11/2026 |

AD07 được giữ nguyên để lưu quyết định tại thời điểm Giai đoạn 0. Cụm “chưa gắn GitHub” là trạng thái lịch sử, được thay thế bởi chỉ đạo và trạng thái repository mới bên dưới; yêu cầu giữ bản CoCo riêng vẫn được duy trì. AD01–AD06 và AD08 tiếp tục có hiệu lực, không thay đổi quyết định nghiệp vụ.

## Vị trí mã nguồn và Git hiện tại

Kết quả kiểm tra chỉ đọc ngày 10/11/2026, trước khi chỉnh sửa tài liệu này:

| Hạng mục | Trạng thái đã xác minh |
|---|---|
| Thư mục làm việc ứng dụng | `D:\50K142-NEW\CoCo` |
| Git repository root | `D:\50K142-NEW` theo `git rev-parse --show-toplevel`; CoCo là thư mục con được Git theo dõi, không phải repository riêng ở trạng thái hiện tại |
| Repository GitHub | https://github.com/thuytrangmai66-oss/50K142.03.3007 |
| Remote `origin` fetch/push | `https://github.com/thuytrangmai66-oss/50K142.03.3007.git` |
| Nhánh local / upstream | `main` / `origin/main` |
| Commit `HEAD` | `aa9ea2205a538140fe8a16271689dc23fe8db0a7` — `feat: add CoCo application source` |
| Thời gian commit | `2026-11-10T22:43:44+07:00` (metadata Git) |
| Xác minh push | `HEAD` và `origin/main` local trùng nhau; `git ls-remote --heads origin main` trả cùng mã cho `refs/heads/main` trên GitHub |
| Mã CoCo đã commit | `git ls-files -- CoCo` liệt kê source, cấu hình, test và tài liệu trong `CoCo/`; commit mới nhất tác động đến thư mục này là commit `HEAD` nêu trên |
| Working tree trước rà soát | Sạch; `git status --short --branch` trả `## main...origin/main`, không báo ahead/behind |

Lần rà soát tài liệu ban đầu chỉ sửa tài liệu này, không sửa source, cấu hình Git, tạo commit, push hoặc deploy. Bảng trên là mốc kiểm kê trước yêu cầu CI/CD bổ sung; không phải cam kết rằng `HEAD` sẽ giữ nguyên sau khi triển khai yêu cầu mới. Cập nhật CI/CD theo chỉ đạo tiếp theo được ghi tại [CI_CD.md](../phase1/CI_CD.md).

## Trạng thái triển khai thực tế

- Nền React/TypeScript/Vite/Tailwind, layout CoCo, Trang chủ và route dự phòng tiếp tục được giữ. Giai đoạn 2 đã thêm `CoCoDB` version 2 với 10 store nghiệp vụ, metadata và repository/validation/transaction; migration giữ dữ liệu appMetadata của version 1. Xem [mapping](../phase2/DATA_MAPPING.md) và [báo cáo Giai đoạn 2](../phase2/REPORT_PHASE_2.md). Đây là nền dữ liệu, chưa phải hoàn tất các luồng nghiệp vụ.
- Báo cáo Giai đoạn 1 ghi **ĐẠT điều kiện chuyển tiếp**, đã loại bỏ nghiệp vụ thuê xe, Supabase và các tích hợp ngoài; đồng thời ghi PASS cho typecheck, build, lint, unit, e2e và audit. Đây là kết quả lưu trong báo cáo, không phải kiểm thử chạy lại trong lần rà soát tài liệu này.
- Phần schema 10 thực thể từng được báo cáo Giai đoạn 1 dành cho giai đoạn tiếp theo đã hiện thực ở G2. G3 bổ sung xác thực/phiên/quyền nền, bootstrap và login/shell; chưa phải toàn bộ module nghiệp vụ. Scheduler, QR và báo cáo theo roadmap còn chưa triển khai. Backup/restore UI và cold-start offline không tự đưa vào scope khi chưa có yêu cầu riêng. Không coi quyết định đã duyệt là bằng chứng đã hiện thực.
- Theo yêu cầu CI/CD bổ sung ngày 10/11/2026: Vite dùng `base: '/50K142.03.3007/'`; workflow chuyển lên `.github/workflows/deploy.yml` ở root, chạy lệnh trong `CoCo/` và xuất artifact `CoCo/dist`. Mỗi push `main` tự chạy install/lint/typecheck/unit/audit/build/smoke test, chỉ deploy khi checks thành công. PR vào `main` chỉ chạy checks; có thêm tùy chọn chạy thủ công trên `main`.
- Đã kiểm tra bằng GitHub API: Actions bật, policy cho phép các action đang dùng; giữ nguyên quyền token mặc định read và cấu hình review PR. Pages ban đầu chưa được cấu hình, đã bật với nguồn GitHub Actions (`build_type: workflow`). Kết quả kiểm thử và xác minh deploy thực được theo dõi tại [CI_CD.md](../phase1/CI_CD.md); việc có cấu hình không tự chứng minh deploy đã thành công.

## Lịch sử Giai đoạn 0 — đã lỗi thời về môi trường hiện tại

Các dữ kiện dưới đây được giữ làm dấu vết khảo sát, không mô tả repository đang làm việc:

- Repo tham chiếu khi khảo sát: `D:\web-moto-care-main\web-moto-care`, commit `72ffdf8618ee2b99a219546e708d72a8f294748b`, nhánh `main`; trạng thái sạch tại lúc đọc, origin fetch/push là `https://github.com/HuuKhanh06/web-moto-care.git`. Không kiểm tra lại repo tham chiếu trong lần rà soát này.
- Bản sao ban đầu tại `CoCo/`: hồ sơ Giai đoạn 0 ghi đã sao chép 190 tệp và đối chiếu SHA-256 tại `STARTER_COPY_MANIFEST.csv`; không sao chép `.git`, `node_modules`, `.agent` hoặc dữ liệu môi trường bí mật. Không kiểm chứng lại manifest trong lần rà soát này.
- Trạng thái ban đầu “nhánh `coco`, chưa có commit, không có remote” đã lỗi thời. Phần “Commit và môi trường” trong báo cáo Giai đoạn 1 và Q17 trong OPEN_ISSUES.md cũng giữ thông tin môi trường cũ; dùng mục Git hiện tại ở tài liệu này cho trạng thái repository mới.
- Cảnh báo “bản sao chưa thay logic/schema/UI/dependencies/workflow, vẫn chứa Supabase, tích hợp ngoài, auto-seed và workflow cũ; không chạy trước khi ngắt kết nối” chỉ áp dụng bản sao ban đầu. Báo cáo Giai đoạn 1 đã ghi nhận việc ngắt kết nối và thay khung; không dùng cảnh báo lịch sử này làm mô tả mã hiện tại.
- Giới hạn “không push, không gọi DB cũ, không deploy và không reset dữ liệu trình duyệt trong Giai đoạn 0” thuộc phạm vi công việc lúc đó. Việc người dùng đưa source vào repository mới là cập nhật sau đó, không thay đổi kiến trúc lưu dữ liệu local đã duyệt.

## Ánh xạ và giới hạn

Kiến trúc đích đã duyệt: FE và logic nghiệp vụ chạy trong trình duyệt; IndexedDB lưu dữ liệu; GitHub Actions thực hiện build/test/deploy và GitHub Pages phục vụ dist khi được cấu hình, triển khai thành công. Hiện đã có repo đích; trạng thái workflow/Pages được nêu riêng ở trên. Không coi GitHub là nơi chạy DB hay backend liên tục.

Tác vụ bù phải ghi thời gian thực sự thực hiện, không tạo bằng chứng giả rằng đã chạy lúc web đóng. Phải chống xử lý lặp theo sản phẩm/mốc/chu kỳ và nhiều tab. Quy tắc ưu tiên mốc 45 ngày khi mở lại sau nhiều ngày cần được mô tả cùng thuật toán, căn cứ SRS UC_2.3; không giảm 30% lặp lại mỗi ngày.

Giới hạn đã ghi nhận: không tự đồng bộ đa máy; phân quyền phía client là kiểm soát demo; mất/xóa storage có thể mất dữ liệu. Việc chọn local không cho phép bỏ validation, kiểm tra quyền tại service hoặc giao dịch nguyên tử.

Phương án kỹ thuật trong [OPEN_ISSUES.md](OPEN_ISSUES.md) đã được phê chuẩn; không còn coi toàn bộ tiền/điểm, membership, giá vốn và metadata là các phương án chưa được duyệt. Q05/Q06/Q07/Q08/Q09 đã được cụ thể hóa về lưu trữ tại [mapping Giai đoạn 2](../phase2/DATA_MAPPING.md); các luồng nghiệp vụ sử dụng chúng chưa được coi là hoàn thành. Q10, cách làm tròn khoản giảm ở Q12, Q20 và Q21 chưa có giá trị/thuật toán cụ thể trong đề xuất gốc, tiếp tục được theo dõi khi triển khai module tương ứng. Không tự bổ sung quyết định nghiệp vụ hoặc lấy số mẫu từ Figma làm kết quả cố định.
