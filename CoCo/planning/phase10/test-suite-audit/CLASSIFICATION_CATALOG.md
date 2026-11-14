# Phân loại toàn bộ test case — chỉ đề xuất

Tổng 713 case đã thực thi. KEEP/MERGE/REFACTOR/REMOVE là phân loại audit, không phải thao tác đã áp dụng. Mọi testcase giữ nguyên.

UC/BR/NFR trong catalog JSON là candidate hoặc liên kết hỗ trợ có scope, không chứng nhận coverage. Source line chỉ vị trí khai báo; một khai báo parameterized có nhiều case.

## tests/unit/auth.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-7ad746e9cf27 — matches independent native PBKDF2 SHA-256 and uses fresh random salts | Unit | 245.57 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2d59ca7118f3 — migrates the frozen v2 database to v4, preserving business and metadata without accounts or sessions | Integration | 22.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c3120731a855 — bootstraps once with caller-entered credentials, hash/salt and atomic evidence | Integration | 374.01 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6d1bc1ab5916 — serializes simultaneous bootstrap from two connections into exactly one owner | Integration | 243.82 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-35ecb585348d — rolls back bootstrap marker and all account rows if audit write fails, then allows retry | Integration | 299.15 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e575c35435f2 — rejects malformed bootstrap profile without partial data 0 | Integration | 4.88 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7075d8c1db1f — rejects malformed bootstrap profile without partial data 1 | Integration | 9.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-53db9069713a — rejects malformed bootstrap profile without partial data 2 | Integration | 5.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1350b96437ce — reports missing login input before writing 0 | Integration | 4.97 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1e21f680a7a3 — reports missing login input before writing 1 | Integration | 10.96 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-77843fecca59 — reports missing login input before writing 2 | Integration | 3.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-719f44aa5872 — does not distinguish unknown username, wrong password or inactive account and issues no session | Integration | 513.11 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ac5ecb488b66 — logs in with an opaque token, persists only its hash, reloads session and revokes it on logout | Integration | 254.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b86d58267334 — checks fresh role/active/version on every service call across connections | Integration | 260.05 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-70f07d64a2a9 — revokes role-changed and credential-version-changed sessions | Integration | 370.72 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-adaca87aba6c — binds write guards to the same transaction, ignores forged actor and rechecks permission on replay | Integration | 264.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-236c3b16166d — rejects staff relabeling account writes as public permission with no partial write | Integration | 247.29 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3959d2ea30db — does not allow a read permission to authorize a mutation, even for the owner | Integration | 258.21 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-13f16ad1d821 — rolls back a newly issued session if login audit cannot be written | Integration | 363.73 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c9576b7fafb0 — keeps the session if logout audit fails, then revokes it atomically on retry | Integration | 290.57 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d4850621302d — rejects login if account changes while password derivation is in flight | Integration | 269.06 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-946d86aeb412 — enforces the SRS owner-only permission contract without a system-run permission in UI | Unit | 1.80 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/customer-creation.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-281ef55643c7 — M01-B records creation at Vietnam midnight with matching receipt/audit, survives reload and never mutates on read | Integration | 297.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-37415aabad1c — M01-B keeps the original creation day on profile edits and removes the marker with a legitimate deletion | Integration | 271.93 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-33a18ba782bb — M01-B rolls the entire create back on audit failure | Integration | 258.44 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6f7bf14f9252 — M01-B rolls the entire create back on metadata failure | Integration | 251.26 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-69501a6b42e6 — M01-B rolls a deletion back when removing its marker fails | Integration | 274.67 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9f96a2741246 — M01-B serializes duplicate-phone creates across connections, creating one profile and one marker | Integration | 262.50 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1ba94f84793d — M01-B runs the command effect once, returns the original time on replay, and rechecks authorization | Integration | 264.92 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-551c7a4e01e4 — M01-B excludes absent evidence without backfill or writes | Integration | 288.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-278b77d02375 — M01-B excludes invalid-json evidence without backfill or writes | Integration | 261.88 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6c95c952904b — M01-B excludes wrong-id evidence without backfill or writes | Integration | 254.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-885bec4abf52 — M01-B excludes missing-receipt evidence without backfill or writes | Integration | 299.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-72396135b62d — M01-B excludes wrong-actor evidence without backfill or writes | Integration | 323.36 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7e6a3a25d942 — M01-B excludes wrong-time evidence without backfill or writes | Integration | 261.55 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6a971af31ffe — M01-B excludes missing-audit evidence without backfill or writes | Integration | 252.16 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6b9fce307e64 — M01-B leaves imported/legacy profiles without creation dates after reopen | Integration | 247.33 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0ff0194779ea — M01-B propagates storage faults instead of returning a false zero | Integration | 249.63 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/customer-edit.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-53dfe5d8cb26 — BR-UC4-03/04 invalid edit 0 leaves all stores, versions and provenance unchanged | Integration | 306.88 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3e68c62b8cdf — BR-UC4-03/04 invalid edit 1 leaves all stores, versions and provenance unchanged | Integration | 324.64 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fc7e03baa193 — BR-UC4-03/04 invalid edit 2 leaves all stores, versions and provenance unchanged | Integration | 372.99 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-987557b0b8e5 — BR-UC4-03/04 invalid edit 3 leaves all stores, versions and provenance unchanged | Integration | 289.88 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d0f7fcd220a1 — BR-UC4-03/04 invalid edit 4 leaves all stores, versions and provenance unchanged | Integration | 308.87 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-dc4b1597eee6 — BR-UC4-03/04 invalid edit 5 leaves all stores, versions and provenance unchanged | Integration | 250.48 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5429857740bc — BR-UC4-03/04 invalid edit 6 leaves all stores, versions and provenance unchanged | Integration | 262.67 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d09010deecba — BR-UC4-03/04 invalid edit 7 leaves all stores, versions and provenance unchanged | Integration | 284.52 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fba7b1a835dc — BR-UC4-05 refuses changing a customer phone to another profile without any partial writes | Integration | 391.77 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b2d6a231b7cd — BR-UC4-05 accepts an unchanged phone on a legitimate rename, preserving identity and profile count | Integration | 266.31 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-def9aaf20190 — BR-UC4-05 concurrent edits of two profiles cannot acquire the same phone | Integration | 261.48 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-75c481f20a25 — BR-UC4-08 blocks deletion with purchase-only history independently, preserving every store | Integration | 285.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-803316aa1a37 — BR-UC4-08 blocks deletion with sale-only history independently, preserving every store | Integration | 382.83 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/dashboard-comparison.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-8a95fc3afb49 — keeps signed mathematical percentages without inventing a zero baseline | Unit | 2.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ee99cc4ea54b — rejects invalid comparison input -1 | Unit | 0.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0ddfa20e090f — rejects invalid comparison input 1.5 | Unit | 0.20 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f1c1ed5fbcfe — rejects invalid comparison input NaN | Unit | 0.19 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1926eb9bcdb3 — rejects invalid comparison input 9007199254740992 | Unit | 0.23 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/database.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-c9653f45625f — isolates CoCoDB and preserves records across concurrent startup and reopen | Integration | 38.96 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/discount-scheduler.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-53a724e7644d — handles day 29 using original cycle price and 45-day catch-up priority | Integration | 372.79 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b435168de7bb — handles day 30 using original cycle price and 45-day catch-up priority | Integration | 315.12 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-afc8bd7624cc — handles day 44 using original cycle price and 45-day catch-up priority | Integration | 305.14 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d4e9899f12d8 — handles day 45 using original cycle price and 45-day catch-up priority | Integration | 285.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-41c7ad105b87 — handles day 80 using original cycle price and 45-day catch-up priority | Integration | 303.07 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e7015fa8d379 — applies 30 then 45 once across reload/day checks without compounding or rewriting history | Integration | 349.26 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2a0b7463d33a — sets exactly 20000 even when the current/base price is lower, per confirmed P10 | Integration | 332.42 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e142ad2a2b28 — skips sold products, preserving their prices and never inventing a legacy code mapping | Integration | 288.62 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-30d60d285a7d — serializes two browser connections, producing a single run and one event per product/cycle/milestone | Integration | 356.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-41b6cde7fb6b — rolls back a failed price/milestone/version/audit transaction and retries only missing milestones | Integration | 303.59 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0acf0375c851 — recovers an expired interrupted claim after partial commit without applying the first product twice | Integration | 379.54 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9e5aee6fd40f — rejects stale editor saves after an automatic price update and resets the new cycle after a fresh save | Integration | 405.41 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5dddb89293cf — requires monitor read permission/session and has no UI run capability | Integration | 314.59 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-526cfec9221d — does not conceal a daily completion receipt whose journal is missing | Integration | 293.57 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/financial-number.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b9065a228b2e — preserves negative values and both safe integer limits | Unit | 3.31 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ff8c9a2c0bf7 — rejects unsafe aggregate values in either direction | Unit | 1.57 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/inventory.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-8a10bf9e0595 — computes calendar stock days 2026-11-01 at 2026-11-10T16:59:59Z without device timezone dependence | Unit | 371.56 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-c4e398bffe33 — computes calendar stock days 2026-11-01 at 2026-11-10T17:00:00Z without device timezone dependence | Unit | 279.47 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-fd5e5b886fd6 — computes calendar stock days 2024-02-28 at 2024-03-01T00:00:00+07:00 without device timezone dependence | Unit | 275.12 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-a4e513a047d7 — computes calendar stock days 2026-12-31 at 2027-01-01T00:00:00+07:00 without device timezone dependence | Unit | 269.81 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-b0b3909e6109 — projects real inventory without writes, price recalculation or losing physical item identities | Integration | 287.99 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-01220fdacecf — combines code/name, type, brand and entry day, including empty result and invalid calendar | Integration | 345.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-018fdc624524 — reads frozen acquisition attributes after shared bracket rename without changing historical data | Integration | 377.19 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-29c6868f551b — shows sold only through the invoice-specific approved mapping and never changes status while reading | Integration | 433.56 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fb6255b90938 — does not interpret raw legacy codes as the new mapping, including condition code 2 | Integration | 371.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-170f46b56568 — displays stored milestone 30 only when tied to the current cycle and current price | Integration | 374.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-847aa03043a5 — displays stored milestone 45 only when tied to the current cycle and current price | Integration | 384.54 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cfb71af13ac4 — fails visibly for missing-bracket instead of fabricating inventory metadata | Integration | 488.74 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3b217281d77b — fails visibly for missing-origin instead of fabricating inventory metadata | Integration | 338.23 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5dcd32e2c5d3 — fails visibly for missing-snapshot instead of fabricating inventory metadata | Integration | 442.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-91f81309bf1b — fails visibly for unknown-status instead of fabricating inventory metadata | Integration | 326.78 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-45590caf6b35 — supports both authenticated roles and rejects invalid/revoked sessions without writes | Integration | 531.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fb10a9c3f77b — resets cycle on a real price change by owner, preserving entry date, costs and invoice snapshots | Integration | 280.82 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a61d2f79a967 — resets cycle on a real price change by staff, preserving entry date, costs and invoice snapshots | Integration | 534.53 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-87e90f3fd88c — updates only one item current attributes, without resetting unchanged price or editing the shared bracket | Integration | 291.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a8816c6ca34d — replays exactly once, rejects changed operation payloads and rechecks revoked sessions on replay | Integration | 314.29 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a33007d344d4 — serializes two connections against one product version and prevents stale overwrite | Integration | 320.51 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a4892991a98d — rolls back product/cycle/attributes/version/receipt after metadata failure and retries safely | Integration | 398.35 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8b1f7f591d38 — rolls back product/cycle/attributes/version/receipt after audit failure and retries safely | Integration | 359.40 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f28adc853350 — refuses fixed-date without partial mutation | Integration | 266.60 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-eab8a91bb824 — refuses fixed-status without partial mutation | Integration | 354.79 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1c78340cb2a6 — refuses sold without partial mutation | Integration | 275.46 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-141e88a7c636 — refuses empty-name without partial mutation | Integration | 282.75 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6464edcc93db — refuses zero-price without partial mutation | Integration | 320.47 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-910f004a93e3 — refuses invalid-condition without partial mutation | Integration | 362.64 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d0ad1e483e8d — refuses corrupt current attribute metadata instead of falling back to an acquisition snapshot | Integration | 259.60 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5fe961ab66c3 — rounds original cycle price 1 to final 70% 1 price undefined half-up | Unit | 271.37 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-0705efd01208 — rounds original cycle price 5 to final 70% 4 price undefined half-up | Unit | 267.21 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-f6f31b0c389b — rounds original cycle price 10 to final 70% 7 price undefined half-up | Unit | 318.17 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-4830484e0ac0 — rounds original cycle price 104007 to final 70% 72805 price undefined half-up | Unit | 286.65 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-7a9a4a2ece88 — prioritizes 45 over missed 30, never applies a milestone twice, and schedules the next Vietnam midnight | Unit | 259.95 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |

## tests/unit/pagination.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-26db97373aad — shared list pagination slices 0 records before rendering | Unit | 4.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4a72d53a368b — shared list pagination slices 1 records before rendering | Unit | 0.56 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b3fb1071b6e5 — shared list pagination slices 9 records before rendering | Unit | 0.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-41eb7f6111d1 — shared list pagination slices 10 records before rendering | Unit | 0.33 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d0139350faff — shared list pagination slices 25 records before rendering | Unit | 0.34 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e0c88b56e3ad — shared list pagination partitions 25 records into exactly 9 + 9 + 7 without gaps or duplicates | Unit | 0.59 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1d92d0db78e9 — shared list pagination clamps a removed/filtered last page and cannot bounce back after data is added | Unit | 0.31 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-314c396d7e7d — shared list pagination normalizes invalid requested page 0 | Unit | 0.18 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8e7b27e98211 — shared list pagination normalizes invalid requested page -1 | Unit | 0.14 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7e25227fd136 — shared list pagination normalizes invalid requested page 1.5 | Unit | 0.18 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-77f9083cabff — shared list pagination normalizes invalid requested page NaN | Unit | 0.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-49dd1ef27681 — shared list pagination normalizes invalid requested page Infinity | Unit | 0.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-93c9062e5dd2 — shared list pagination supports an explicit module capacity without mutating the data | Unit | 0.45 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/phase10-audit.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-405f6b6f26ad — never labels list-only or unexecuted cases as passed | Unit | 3.16 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b22b4ddefb1b — preserves actual failure, interruption, skip and flaky attempts | Unit | 0.71 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5e59f5f48ac0 — counts executed success and refuses to turn expected-failure cases into PASS | Unit | 1.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8727e51ba315 — resolves encoded local design paths while rejecting escape outside CODEX | Unit | 0.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7698686aa24e — keeps unit failures/skips and does not call enumeration or missing-duration assertions PASS | Unit | 1.24 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-314a880325a6 — sanitizes unit file paths and ignores raw failure messages | Unit | 0.75 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-18ca62de32d3 — rejects missing unit reports and refuses PASS without an execution start time | Unit | 0.64 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/purchase-approvals.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-a8fbf0562272 — T04 recipient results and rejected-price revision continues adding products and selecting a customer after a superseded rejection and second approval | Integration | 657.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-aeff0c996580 — T04 recipient results and rejected-price revision delivers approve only to its creator and acknowledges once | Integration | 538.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ba8690d9f268 — T04 recipient results and rejected-price revision delivers reject only to its creator and acknowledges once | Integration | 559.23 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8ce21c503624 — T04 recipient results and rejected-price revision revises rejected price 80000 without changing old history and replays once | Integration | 653.63 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c32936b98625 — T04 recipient results and rejected-price revision revises rejected price 130000 without changing old history and replays once | Integration | 656.90 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-08aeb20caacb — T04 recipient results and rejected-price revision rolls back acknowledgement and price revision after audit failure | Integration | 737.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-59b1533984e4 — T04 recipient results and rejected-price revision uses the newly displayed bracket revision while preserving the original rejected snapshot | Integration | 639.24 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-05f8dc93f2fc — T04 recipient results and rejected-price revision blocks invalid price, non-rejected lines, foreign sessions and changed brackets | Integration | 530.53 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-89f5c6294d3a — T04 recipient results and rejected-price revision does not show a stale result after remove | Integration | 540.08 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-10e85eb771ae — T04 recipient results and rejected-price revision does not show a stale result after cancel | Integration | 592.06 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bb49a8e3667f — rejects a changed price snapshot before deciding and keeps decision/event/audit unchanged | Integration | 539.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-09ce35d2f0ad — rejects a changed quantity snapshot before deciding and keeps decision/event/audit unchanged | Integration | 555.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-58e144da47f6 — rejects a changed bracket snapshot before deciding and keeps decision/event/audit unchanged | Integration | 526.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-454ca597e986 — rejects malformed decision input {"action":"invalid"} without writes | Integration | 592.20 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b4f13a5ac13d — rejects malformed decision input {"expectedRevision":0} without writes | Integration | 517.13 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-52d042e4bc4d — rejects malformed decision input {"expectedRevision":1.5} without writes | Integration | 575.25 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9f51e5f11476 — rejects malformed decision input {"operationId":""} without writes | Integration | 549.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5951014bf58d — listRequests filters employee names and Vietnam calendar date | Integration | 519.07 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6419385873cc — listRequests preserves an existing approve decision when adding another product | Integration | 544.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3e063a387b78 — listRequests preserves an existing reject decision when adding another product | Integration | 545.80 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d308f958e289 — listRequests returns empty list when no approvals exist | Integration | 581.90 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1c5de3ed2be9 — listRequests shows pending request and marks it eligible | Integration | 544.72 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b16cb394b22d — listRequests marks request ineligible when line is removed | Integration | 553.62 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ddad373b3a41 — listRequests filters by status=decided after a decision | Integration | 542.55 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-647c0354b940 — listRequests requires approvals.read permission | Integration | 580.86 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ebdbca768c6b — loadRequest loads approval with draft and line context | Integration | 670.35 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-74e67f46b117 — loadRequest throws for unknown approvalId | Integration | 575.97 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4758b488cebb — loadRequest requires approvals.read permission | Integration | 515.60 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8fdba629f0b8 — decide — approve approves a pending request atomically and writes persistent notice | Integration | 535.15 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ea28d21a12be — decide — approve replays the same operationId without duplicating data | Integration | 530.70 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3ce49838c6a1 — decide — reject rejects with reason, updates approval and line, writes notice | Integration | 526.70 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-26d190ba8099 — decide — reject requires non-empty reason when rejecting | Integration | 511.31 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f9a8ac4890d2 — decide — reject rejects reason longer than 100 characters | Integration | 530.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-843d8c897f7f — decide — permission and CAS guards prevents staff from deciding approvals | Integration | 522.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5e43b21f3cee — decide — permission and CAS guards rejects stale expectedRevision (CAS) | Integration | 532.91 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ee0a0fe21417 — decide — permission and CAS guards rejects deciding an already-decided approval | Integration | 575.12 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c98f141f9f3a — decide — permission and CAS guards two owners collide: second sees CONFLICT and first decision is preserved | Integration | 539.26 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4b8dacccc735 — decide — permission and CAS guards rolls back all writes on audit failure — no partial state | Integration | 529.34 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b7d836df4604 — decide — permission and CAS guards refuses to decide a request where the line has been removed | Integration | 513.74 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8a09b64d5b4a — decide — permission and CAS guards requires auth session for decide | Integration | 514.56 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b5b653aae496 — G10 approval integrity review rolls every store back on purchaseApprovals failure, then retries and replays exactly once | Integration | 551.60 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0994549dc6e3 — G10 approval integrity review rolls every store back on purchaseLines failure, then retries and replays exactly once | Integration | 568.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e69b2bdb1f8f — G10 approval integrity review rolls every store back on purchaseNotices failure, then retries and replays exactly once | Integration | 626.86 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-424cf0660f08 — G10 approval integrity review rolls every store back on operations failure, then retries and replays exactly once | Integration | 528.57 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c084998d615d — G10 approval integrity review rolls every store back on auditEntries failure, then retries and replays exactly once | Integration | 676.44 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8af31aa7c36f — G10 approval integrity review rejects reusing a decision operation with changed action without touching any store | Integration | 508.48 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c7b6f79e1101 — G10 approval integrity review rejects reusing a decision operation with changed revision without touching any store | Integration | 579.71 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7661025f9278 — G10 approval integrity review rejects reusing a decision operation with changed request without touching any store | Integration | 514.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-109ca5261f7a — G10 approval integrity review rejects reusing a decision operation with changed reason without touching any store | Integration | 601.96 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6f3fa9171066 — G10 approval integrity review rechecks a revoked owner session before replaying a successful approve | Integration | 508.05 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-82fa480056b1 — G10 approval integrity review rechecks a revoked owner session before replaying a successful reject | Integration | 579.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1b66e0785cc1 — G10 approval integrity review serializes opposing decisions through two live connections and independent sessions | Integration | 620.19 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/purchase-candidate.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b6c7764eec89 — uses approved integer half-up markup 1 -> 1 | Unit | 467.18 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-6e592a46d418 — uses approved integer half-up markup 5 -> 7 | Unit | 434.99 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-3461201b5fcc — uses approved integer half-up markup 15 -> 20 | Unit | 496.50 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-c914f4681606 — uses approved integer half-up markup 80001 -> 104001 | Unit | 484.80 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-0de0e5899525 — uses approved integer half-up markup 120000 -> 156000 | Unit | 494.97 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-25cbf1fcfe8f — uses approved integer half-up markup 6928614811339224 -> 9007199254740991 | Unit | 503.20 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-6f5b9f4c2ee5 — rejects fractional/zero/unsafe costs and sale price overflow | Unit | 466.03 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-2ecf72396d28 — atomically saves a real authorized draft, without invoice/customer fabrication; owner=false | Integration | 426.89 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-aebffb24ed83 — atomically saves a real authorized draft, without invoice/customer fabrication; owner=true | Integration | 362.93 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c4acc0390ed5 — replays identical commands once and rejects changed payloads without mutation | Integration | 375.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2f85b752d0f0 — serializes two connections with the same expected revision into a single winner | Integration | 377.21 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5a52b51b1ed7 — rejects forged provenance and revoked sessions, including replay of a committed command | Integration | 394.20 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-df388979a925 — preserves historical draft actor across real G5 rename, requires new session and records current audit actor | Integration | 547.36 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-73ace87a41b3 — rejects invalid customer link and rolls back all tables | Integration | 418.44 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c706c870c26e — rejects invalid bracket link and rolls back all tables | Integration | 393.45 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e406227ac8dd — rejects invalid request link and rolls back all tables | Integration | 395.12 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f8ab84f829ad — rejects invalid cross-draft link and rolls back all tables | Integration | 409.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7c1148a6e6ca — keeps pending price bound to the exact snapshot, cannot inject an approved decision | Integration | 396.53 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fc56b3fd74c3 — rejects changed bracket versions and preserves old lines until invalidation is implemented | Integration | 446.79 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4c4c760a379b — does not reinterpret an untagged legacy condition even when its numeric value is 2 | Integration | 381.38 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ced1c7352f11 — rolls back draft/lines/receipt when audit fails, then retries exactly once | Integration | 404.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0055335df447 — reads legacy status without interpretation and refuses an incomplete new-format snapshot | Integration | 405.41 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-77c3c2c2d29f — detects orphan notification/provenance and inconsistent finalized snapshot | Integration | 394.50 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b157630e4a19 — checks a complete candidate provenance graph, cost binding and exact physical item count | Integration | 401.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2b9902c4e610 — validates the new-format mixed-price FK without a fabricated legacy aggregate line | Integration | 411.73 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1f8f7d408450 — rejects damaged explicit metadata: missing-origin without legacy fallback | Integration | 394.30 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1fddfbae51d0 — rejects damaged explicit metadata: wrong-line without legacy fallback | Integration | 381.04 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fb47c28e4eea — rejects damaged explicit metadata: wrong-invoice without legacy fallback | Integration | 409.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c5a9c237896c — rejects damaged explicit metadata: missing-snapshot without legacy fallback | Integration | 445.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f284052fdc38 — rejects damaged explicit metadata: wrong-cost without legacy fallback | Integration | 433.35 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-82da7fd78916 — rejects damaged explicit metadata: unmarked-extra-product without legacy fallback | Integration | 443.38 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-12cef81046ad — keeps legacy product FK strict in candidate schema when no new-format marker exists | Integration | 375.59 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a65662b44d60 — rolls back a transaction which breaks a new-format reverse FK after earlier writes | Integration | 368.80 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b9983547e7c2 — revalidates later writes in the same transaction instead of reusing a prior valid FK snapshot | Integration | 383.06 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/purchase-contract.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-c761619c10aa — stores draft identity without fabricating customer or invoice and validates finalization identity | Unit | 6.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4ae40480e0b8 — preserves two same-bracket costs and an odd total without averaging | Unit | 3.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ec8c0c4069b5 — does not create a below-Min rule and requires approval strictly above Max | Unit | 1.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-882970feebd8 — rejects invalid line input {"quantity":0} | Unit | 0.67 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-178aae8e870a — rejects invalid line input {"quantity":1.5} | Unit | 0.50 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5093cfe7035e — rejects invalid line input {"unitCost":0} | Unit | 0.45 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a379bf6df795 — rejects invalid line input {"unitCost":-1} | Unit | 0.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-20fca09fb38d — rejects invalid line input {"unitCost":1.5} | Unit | 0.32 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bb6efe79ce3c — rejects invalid line input {"bracket":{"id":"KG1","revision":1,"type":"Áo","brand":"CoCo","condition":90,"min":50000,"max":100000}} | Unit | 1.05 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-811650cb2bd1 — rejects invalid line input {"bracket":{"id":"KG1","revision":1,"type":"Áo","brand":"CoCo","condition":2,"min":200000,"max":100000}} | Unit | 0.44 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-654d34aff8ae — rejects duplicate line identities and arithmetic overflow instead of rounding | Unit | 2.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c52046fded8a — requires a nonblank refusal reason and does not attach decision fields to pending state | Unit | 3.64 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f69f2ff93e7b — rejects staff decisions, stale versions and repeat processing | Unit | 1.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-30554a44a19f — binds approval to exact line revision, price, quantity and bracket snapshot | Unit | 0.77 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7430d211ae30 — requires customer/items and valid approvals without reusing a decision after an edit | Unit | 1.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a3190b7d367b — separates durable notice from delivery and does not claim a delivery without its time | Unit | 1.74 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3edd530c7c5a — migrates a real frozen v3 test DB additively and preserves all legacy keys and records | Integration | 37.61 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e387e38f0f74 — activates the accepted v4 schema with all six additive stores | Unit | 2.68 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5c78e90bd9d6 — rolls back a failed schema upgrade itself, retaining native v3 stores and data | Integration | 14.91 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b572e1d13216 — rolls back candidate draft and lines on a late transaction failure without touching legacy rows | Integration | 7.48 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/purchase-drafts.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-d7e57eb82c55 — prepares without writes and finds the exact tagged bracket for a valid quantity | Integration | 296.39 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d0c9d1481e71 — rejects invalid quantity  before writing | Integration | 284.71 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9be0de01a2bd — rejects invalid quantity 0 before writing | Integration | 277.08 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3c5f2b031213 — rejects invalid quantity -1 before writing | Integration | 261.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ac7a1d12a1cd — rejects invalid quantity 1.2 before writing | Integration | 322.99 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b0be47064a49 — rejects invalid quantity 2147483648 before writing | Integration | 288.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-364aed3985e7 — rejects invalid quantity abc before writing | Integration | 261.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1fda86b29d63 — returns required field errors and does not match a different condition or missing brand | Integration | 279.13 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5c5c8e59350e — rejects invalid proposed price 0 | Integration | 260.79 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-64140e1d021e — rejects invalid proposed price -1 | Integration | 250.81 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-20efceb55d4b — rejects invalid proposed price 1.5 | Integration | 263.77 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5ff19183c129 — rejects invalid proposed price abc | Integration | 294.63 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-16bac2bec195 — rejects invalid proposed price 9007199254740992 | Integration | 296.37 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-18b5f11522fd — creates a single real pending request only above Max and replays one command without duplicate | Integration | 300.92 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-207c94f50c43 — accepts Max and positive below-Min prices without inventing extra approval rules | Integration | 278.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fba49f31e579 — soft-removes a pending line, retains its request snapshot and does not reuse a cancelled draft | Integration | 291.70 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-346c48d33677 — rolls back remove/cancel on audit failure and rejects revoked sessions | Integration | 269.70 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3e2198ca749b — lists persisted invoices with customer data, combined filters and Vietnam calendar dates; excludes drafts | Integration | 298.08 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/purchase-finalization.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-a61d0ef6cce7 — finalizes real mixed prices without merging cost and preserves legacy data | Integration | 396.16 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8b7ff2f60422 — issues one product per item, rounds initial price half up and uses Vietnam dates | Integration | 302.51 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c622cdafa598 — G10 invoice allocation skips existing, issued and version-tombstoned invoice IDs without altering legacy data | Integration | 286.61 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a87e2fa8a64c — G10 exhausted invoice IDs leave all stores unchanged and allow a fresh retry | Integration | 292.88 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-84351a45bc46 — never reuses issued/versioned product IDs or a duplicate ID within one finalization batch | Integration | 302.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e20832126702 — rolls back the invoice, draft and reservations if product ID retries are exhausted | Integration | 327.47 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f8f5817350b2 — retries a committed operation once and rejects another finalize command or payload | Integration | 311.12 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f97e3a16bf9d — serializes two tabs finalizing the same revision | Integration | 269.75 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-41e224b2cb4f — blocks pending before creating invoice or products | Integration | 275.99 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1d6bfc202a79 — blocks rejected before creating invoice or products | Integration | 264.87 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-85449ff0d346 — blocks missing-customer before creating invoice or products | Integration | 269.91 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2998136f664b — blocks empty before creating invoice or products | Integration | 265.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f055b819a9a6 — blocks cancelled before creating invoice or products | Integration | 293.20 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e7a4d74242b5 — blocks stale before creating invoice or products | Integration | 407.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-dad7324a40a6 — rolls back all stores when hoaDonThuMua add fails, then safely retries | Integration | 328.62 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-670134c6f176 — rolls back all stores when sanPham add fails, then safely retries | Integration | 348.01 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e5cf2111d394 — rolls back all stores when productCosts add fails, then safely retries | Integration | 430.07 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8837cb22b983 — rolls back all stores when purchaseProvenance add fails, then safely retries | Integration | 355.24 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5274af6334a0 — rolls back all stores when purchaseFinalizations add fails, then safely retries | Integration | 304.83 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fcc53ac7e72c — rolls back all stores when auditEntries add fails, then safely retries | Integration | 270.47 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a484a767fb91 — rolls back all stores when issuedIdentifiers add fails, then safely retries | Integration | 285.27 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6cbfbb449e1f — rolls back all stores when recordVersions add fails, then safely retries | Integration | 289.73 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-93034797aae2 — rejects a foreign employee and a revoked session even on receipt replay | Integration | 654.33 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-004be706c5de — requires an explicit valid state mapping and valid command | Integration | 291.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9209f3276da4 — never reuses a reserved product ID and rolls back invoice allocation when random IDs keep colliding | Integration | 261.91 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/purchase-queries.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-7b50070fe2a6 — reads canonical mixed prices, actor and status without writes or current bracket repricing | Integration | 404.34 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c891d2f82e78 — combines trimmed case-insensitive ID/name, phone and Vietnam calendar date with real pagination | Integration | 360.63 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f43291fb2482 — keeps history by customer ID after name/phone change and rejects another customer detail route | Integration | 286.46 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-728bdf960202 — retains legacy codes and unit prices without inferring their meaning or changing stored rows | Integration | 302.96 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4d187f028a7d — rejects corrupt finalized customer without legacy fallback or repairs | Integration | 321.62 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-123a332e0469 — rejects corrupt finalized employee without legacy fallback or repairs | Integration | 346.36 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7e9692e18e69 — rejects corrupt finalized snapshot without legacy fallback or repairs | Integration | 327.05 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7bdc5a2c2d5d — rejects corrupt finalized cost without legacy fallback or repairs | Integration | 317.75 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0ba1e649c953 — rejects corrupt finalized product without legacy fallback or repairs | Integration | 273.25 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8958a3e36cc0 — rejects corrupt finalized mapping without legacy fallback or repairs | Integration | 279.96 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0c77f733a142 — rejects corrupt finalized total without legacy fallback or repairs | Integration | 288.57 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c9c40a5bd901 — rejects legacy missing-lines without inventing history | Integration | 288.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d2e6e76c340c — rejects legacy wrong-total without inventing history | Integration | 268.32 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f694acaae90c — rejects legacy missing-bracket without inventing history | Integration | 289.94 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-49d4f88fd2c6 — requires a valid session for all read entry points | Integration | 282.56 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9bf5d9ae1711 — allows staff to read an owner transaction while keeping role/session and every store unchanged | Integration | 533.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/reference-data.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-30438fea5a28 — creates, searches, renames and deletes a customer, preserving leading zero and points | Integration | 350.03 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8715a19f2e47 — validates customer fields in service before persistence 0 | Integration | 272.04 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bfa12eff8e31 — validates customer fields in service before persistence 1 | Integration | 271.12 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d7c173ac42cd — validates customer fields in service before persistence 2 | Integration | 255.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-46c100b864b1 — serializes duplicate phone races across connections and rejects stale edits without overwriting | Integration | 272.31 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a17162de3279 — keeps history under a changed phone, joins invoice snapshots and prevents linked deletion | Integration | 305.63 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cefaf0ad05e3 — uses only the approved numeric condition codes for new brackets, including create/edit/unique | Integration | 284.96 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8d2c7d47935c — rejects unapproved condition input 0 without storing it | Integration | 300.46 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-849589ac3a7c — rejects unapproved condition input 4 without storing it | Integration | 302.95 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1f7130b80135 — rejects unapproved condition input 90 without storing it | Integration | 248.26 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b2b8c5fe1f5c — rejects unapproved condition input Tốt without storing it | Integration | 255.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b5ef91deedee — rejects unapproved condition input 2.5 without storing it | Integration | 263.53 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d47580681978 — checks every required bracket field and integer Min/Max boundaries | Unit | 293.55 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-318825eb5568 — preserves untagged G2 condition 90 and requires review before any reinterpretation | Integration | 265.72 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9f8b539dd5fb — preserves untagged G2 condition 2 and requires review before any reinterpretation | Integration | 246.80 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3beb214c9b61 — rolls back the condition adoption marker and business row when audit fails | Integration | 280.54 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9cbc9d270044 — removes registration metadata atomically only when the customer has no invoices | Integration | 248.78 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3028bcc15bec — supports staff customers but denies all bracket entry points and revoked sessions | Integration | 521.24 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0f77ebf41292 — paginates deterministically and clamps a deleted last page | Integration | 295.07 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/report-components.test.tsx

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-903d19540407 — UI22 selects each real report kind without inventing a total or querying data | Unit | 157.35 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-133a7dd3ee8a — SC106 confirms the complete inclusive date range with an exclusive UTC boundary | Unit | 47.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cf403df0e4a7 — SC107/109 blocks invalid and reversed dates, then allows correction without stale input | Unit | 75.07 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1deeead6d61d — SC110/112 switches month and year formats and does not reuse the previous value | Unit | 36.61 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/report-eligibility.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-0b6ae3b25a88 — separates payment verification from temporal eligibility without fallback values | Unit | 5.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9e480924ba32 — counts only trusted creation dates in the selected Vietnam period, preserving unknown customers as coverage | Unit | 1.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a7b766d6e619 — excludes invalid creation dates and refuses duplicate profile IDs | Unit | 1.74 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/report-legacy-migration.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-db01d89efd17 — keeps v2 legacy dates/status/customer records unchanged after upgrade and reopening, and never counts them as verified | Integration | 300.42 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/report-period.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-4ec0aca603d1 — G9-T01 Vietnam report periods includes the complete last Vietnam day and excludes the following midnight | Unit | 3.82 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5ae359db3c6b — G9-T01 Vietnam report periods does not use host timezone UTC | Unit | 1.55 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d82e4879d539 — G9-T01 Vietnam report periods does not use host timezone America/Los_Angeles | Unit | 0.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-abeb70bcd441 — G9-T01 Vietnam report periods does not use host timezone Asia/Tokyo | Unit | 0.40 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e45fd085696f — G9-T01 Vietnam report periods handles month 2024-02 through 2024-02-29 | Unit | 0.53 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5fa924821c92 — G9-T01 Vietnam report periods handles month 2026-02 through 2026-02-28 | Unit | 0.28 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8d4e8b528c50 — G9-T01 Vietnam report periods handles month 2000-02 through 2000-02-29 | Unit | 0.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c5874f62148f — G9-T01 Vietnam report periods handles month 1900-02 through 1900-02-28 | Unit | 0.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a337e4fb84e5 — G9-T01 Vietnam report periods handles month 2026-04 through 2026-04-30 | Unit | 0.26 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-643b941051ad — G9-T01 Vietnam report periods handles month 2026-12 through 2026-12-31 | Unit | 0.33 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c4a343bcb297 — G9-T01 Vietnam report periods handles full year 2024 without the year-1900 coercion | Unit | 0.27 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d71bd1b59dda — G9-T01 Vietnam report periods handles full year 2026 without the year-1900 coercion | Unit | 0.16 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-78a84780f94c — G9-T01 Vietnam report periods handles full year 0099 without the year-1900 coercion | Unit | 0.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2ce46085f2e4 — G9-T01 Vietnam report periods rejects invalid period {"kind":"range","start":"2026-11-02","end":"2026-11-01"} | Unit | 0.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-537fa5c78730 — G9-T01 Vietnam report periods rejects invalid period {"kind":"range","start":"","end":""} | Unit | 0.34 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ffa74e795f98 — G9-T01 Vietnam report periods rejects invalid period {"kind":"day","value":"2026-02-29"} | Unit | 0.18 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5253f3633a3a — G9-T01 Vietnam report periods rejects invalid period {"kind":"day","value":"2026-01-33"} | Unit | 0.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a1fe8cac9adc — G9-T01 Vietnam report periods rejects invalid period {"kind":"day","value":"2026-13-01"} | Unit | 0.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2b0dd93e16ad — G9-T01 Vietnam report periods rejects invalid period {"kind":"day","value":"2026-1-1"} | Unit | 0.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-db8c47254a06 — G9-T01 Vietnam report periods rejects invalid period {"kind":"month","value":"2026-00"} | Unit | 0.09 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-91d6d0a79281 — G9-T01 Vietnam report periods rejects invalid period {"kind":"month","value":"2026-13"} | Unit | 0.18 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a073aa67ab03 — G9-T01 Vietnam report periods rejects invalid period {"kind":"year","value":"0000"} | Unit | 0.26 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d3bb25ef3b70 — G9-T01 Vietnam report periods rejects invalid period {"kind":"year","value":"26"} | Unit | 0.13 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b85a79a6335c — G9-T01 Vietnam report periods rejects invalid period {"kind":"year","value":""} | Unit | 0.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cc35cd420334 — G9-T01 Vietnam report periods rejects invalid period {"kind":"invalid","value":"2026"} | Unit | 0.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cbe3587d703a — G9-T01 Vietnam report periods rejects a missing/invalid payment timestamp 2026-11-13 | Unit | 0.32 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-edf4a5528fb9 — G9-T01 Vietnam report periods rejects a missing/invalid payment timestamp 2026-11-13T12:00:00 | Unit | 0.19 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8f8457bb31c5 — G9-T01 Vietnam report periods rejects a missing/invalid payment timestamp 2026-02-30T00:00:00Z | Unit | 0.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-dbff6745b991 — G9-T01 Vietnam report periods rejects a missing/invalid payment timestamp not-a-date | Unit | 0.14 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-948099349d66 — G9-T01 Vietnam report periods normalizes only the display formats supplied by the local design | Unit | 0.77 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/report-queries.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-49b5724f6a9b — T05 staff summary counts all-store verified purchases/imports, sales and existing newly created profiles by Vietnam day | Integration | 412.32 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-154af51abfa3 — T06 invalid purchase snapshot duplicate-lines is quarantined without hiding storage errors | Integration | 331.71 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d1bd653dea8d — T06 invalid purchase snapshot unsafe-total is quarantined without hiding storage errors | Integration | 304.30 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3d2b5ae3a473 — T05 owner KPI uses verified paid instants, stock markers and a readonly consistent snapshot | Integration | 297.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2765a9a9f59f — T05 uses a verified month-end baseline and never invents a percentage when it is zero | Integration | 313.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-315064baad0f — G9-D05 reconstructs prior-month stock from complete purchase evidence without writing a snapshot | Integration | 307.59 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fa575de531ee — G9-D05 excludes an item sold before cutoff from both counts instead of assuming every imported item was still available | Integration | 296.88 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ce22a010bc2f — G9-D05 counts an item sold exactly at Vietnam month start in previous stock and not in current stock | Integration | 541.29 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-94848536e874 — G9-D05 missing-paid-at stays insufficient instead of inferring a historical state | Integration | 383.11 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-82e2f45ae162 — G9-D05 missing-sale-proof stays insufficient instead of inferring a historical state | Integration | 289.83 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e33e1275c29d — G9-D05 missing-purchase-receipt stays insufficient instead of inferring a historical state | Integration | 360.46 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6ce5d92ebc4a — G9-D05 legacy-status-only stays insufficient instead of inferring a historical state | Integration | 308.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cba13590a759 — G9-D05 malformed-status-mapping stays insufficient instead of inferring a historical state | Integration | 320.78 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-98c1cd5abbb0 — G9-D05 missing-purchase-time stays insufficient instead of inferring a historical state | Integration | 332.06 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b049e1925e22 — G9-D05 availability-with-sale-link stays insufficient instead of inferring a historical state | Integration | 343.17 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0486f8b5f399 — G9-D05 a real storage failure propagates without returning a false stock percentage | Integration | 293.89 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-baad0e0d5c52 — T05 pending KPI follows the active approval revision and excludes cancelled drafts | Integration | 320.47 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-05b3f032c193 — T05 unverified legacy sales and unknown stock states do not become confirmed KPI values | Integration | 419.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-aefd60b3e6a4 — T05 staff home.read permission cannot expose owner financial KPIs | Integration | 603.13 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-18b55b34fc50 — T04 reconciles actual revenue, cost of sold items and cash outflow without counting unsold stock in profit | Integration | 303.12 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-aaee552cb606 — T04 reports outflow-only days and zero totals for empty profit/periods | Integration | 358.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1bf64bbe49c1 — T04 permits a real loss and never clips negative profit to zero | Integration | 303.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cab767a70daf — T04 refuses unknown costs on an otherwise verified sale instead of manufacturing zero cost | Integration | 286.26 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0b45d2eebf6d — T04 ignores unverified legacy sales/purchases and preserves their original numeric codes | Integration | 293.57 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c7c0b816cafb — T04 retains costs of sold items across subsequent price bracket edits | Integration | 336.31 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e4fa7df87c3c — T04 stock age uses import day, includes exact threshold and filters available items only | Integration | 354.48 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-aa115568fe5e — T04 rejects invalid minimum stock days 0 at the service boundary | Integration | 289.55 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9a56e5154d30 — T04 rejects invalid minimum stock days -1 at the service boundary | Integration | 289.86 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-aaa54a500e92 — T04 rejects invalid minimum stock days 0.5 at the service boundary | Integration | 289.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a2f5308c2f02 — T04 rejects invalid minimum stock days NaN at the service boundary | Integration | 265.06 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9293e0ab5078 — T04 does not infer stock availability from an untagged legacy numeric state | Integration | 291.54 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-834e8de21c29 — T03 counts physical items and actual purchase cost, keeps snapshots after price edits and never writes | Integration | 281.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1d7b16830468 — T03 excludes legacy presence/date without reinterpreting its numeric state or changing raw rows | Integration | 288.48 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4f819f1d12d4 — T03 excludes missing/invalid paidAt undefined without substituting invoice/audit/finalization time | Integration | 330.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c277baaf35be — T03 excludes missing/invalid paidAt 2026-02-30T00:00:00Z without substituting invoice/audit/finalization time | Integration | 298.40 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-716ac4e5fbec — T03 refuses inconsistent physical cost evidence rather than recomputing it from the current bracket | Integration | 273.39 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7baea60868ab — T03 does not hide native read errors as an empty report and refuses an unauthenticated service caller | Integration | 282.78 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-666176f5d1d3 — T03 reconciles mixed prices in the same bracket and counts finalization replay once | Integration | 322.48 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-913b221be2d8 — T03 requires the finalization receipt even when the snapshot and date exist | Integration | 280.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a7279db57885 — does not count a purchase, empty cart or cancelled draft as sales revenue, and never writes while reading | Integration | 280.51 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d8e32784dfa1 — reconciles a real two-line discounted sale with its paid total and retains history after profile/catalog edits | Integration | 293.16 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-72025ce2fccf — uses payment instants across Vietnam midnight, not a UTC day or imported stock date | Integration | 317.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3902fd3aa58c — excludes UNVERIFIED legacy even with a date and codes matching new invoices, with explicit coverage | Integration | 278.27 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0098fec21e14 — classifies corrupt proof as UNVERIFIED and excludes it without repair or a legacy fallback | Integration | 285.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e68957a1d638 — refuses an orphan paid snapshot without manufacturing a missing invoice | Integration | 288.31 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-713a94a6490f — requires the finalization receipt before marking an input verified | Integration | 290.21 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7bcf2cc976fc — rejects an invoice total inconsistent with the paid snapshot instead of recalculating it | Integration | 284.71 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f9297a4e1551 — retains VERIFIED payment with missing time, excludes it from all periods, and never substitutes header/audit dates | Integration | 278.51 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d94bca6d953a — excludes invalid/untrusted payment time 2026-02-30T00:00:00Z without changing it | Integration | 307.30 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-32e4c1d97c7e — excludes invalid/untrusted payment time 2026-11-13T00:00:00 without changing it | Integration | 282.16 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e4af3de3d1bb — excludes invalid/untrusted payment time 123 without changing it | Integration | 290.74 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9cd7ecebd41a — does not turn a storage read error into an empty report or an UNVERIFIED classification | Integration | 346.23 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3a8d69524c5e — keeps current customers without creation evidence out of the KPI, even with membership and completed transactions | Integration | 311.19 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ce065631b444 — counts an idempotent payment replay only once | Integration | 289.61 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b334cea3d287 — guards direct service calls against staff and revoked sessions before exposing report data | Integration | 590.73 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/repositories.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-2f9b5bebeb83 — migrates a real v1 schema without resetting metadata or seeding business records | Integration | 36.05 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bd0015ec8735 — writes a complete related batch atomically, including both compound-key details | Integration | 49.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0941743cd3d9 — rolls back earlier writes, versions, id reservations, audit and receipt on a missing foreign key | Integration | 18.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7fe9429e7a87 — enforces unique customer phones across competing connections and rolls back the losing command | Integration | 15.21 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-28ddf09971ff — preserves phone leading zero and rejects duplicate employee phone and login | Integration | 11.78 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-94088227f5f7 — enforces unique price-bracket combination and preserves per-item cost after bracket price edits | Integration | 20.08 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0e49f1a1cbc5 — commits only once for simultaneous identical operation ids across tabs and survives reopen | Integration | 51.83 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1d650acfe07c — rejects stale writes across tabs without overwriting the winner | Integration | 38.93 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b1b87f2317c1 — retains customer history while changing a phone and prevents deleting linked customers | Integration | 20.24 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cb673a51e675 — keeps tombstone versions to reject a stale edit after delete/recreate | Integration | 18.64 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a7fba3c4ab0b — never reuses an issued product id even after deletion | Integration | 10.71 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6332e5cd2caa — keeps product import date and provenance immutable and prevents deleting invoices | Integration | 12.67 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b95dfea81373 — stores explicit per-product costs for two different prices in the same invoice/bracket without inference | Integration | 9.94 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-33065650ca0c — rejects wrong cost provenance and mismatched compound purchase links | Integration | 14.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7800a4740f71 — makes a discount milestone unique per product/cycle across connections and records actual execution time | Integration | 19.59 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1329065c218c — requires explicit membership registration and stores only hash/salt security metadata | Integration | 14.13 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-292526850cfa — rolls back all writes if persisting audit evidence fails, then permits retry | Integration | 25.14 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f9bbbac94e28 — rejects duplicate batch targets, missing versions and malformed compound keys | Integration | 4.77 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-667ae40da90b — runtime validation rejects invalid customer data before persistence 0 | Integration | 12.77 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0e7d687ea198 — runtime validation rejects invalid customer data before persistence 1 | Integration | 5.79 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8b614951d7b9 — runtime validation rejects invalid customer data before persistence 2 | Integration | 4.15 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bde782d81b01 — runtime validation rejects invalid customer data before persistence 3 | Integration | 3.96 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-efe3150457dc — runtime validation rejects invalid customer data before persistence 4 | Integration | 3.56 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-173fb41bb3e9 — runtime validation rejects invalid customer data before persistence 5 | Integration | 4.98 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fcff5f053489 — runtime validation rejects unsafe, fractional, negative and inconsistent amounts without rounding | Unit | 2.15 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f8b665f85601 — runtime validation rejects nonexistent dates and plaintext password fields | Unit | 1.52 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/revenue-report.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-09b49c3c8ed5 — BR-UC7-02 returns zero rather than NaN or Infinity for an empty verified period | Unit | 3.37 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-06e35a31c4f5 — counts paid headers once and adds actual receipts rather than prices before discounts | Unit | 2.60 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e324743219c3 — does not invent a persisted rounding rule for a statistical average | Unit | 0.87 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cb5714809a3f — uses the complete Vietnam day and not the UTC date of payment | Unit | 0.82 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-982a6e6c9c82 — rejects duplicate IDs instead of double-counting or silently hiding an inconsistent input | Unit | 1.93 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4e3165cf38c9 — rejects invalid paid amount -1 | Unit | 1.52 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c0a7a1a9cece — rejects invalid paid amount 0.5 | Unit | 0.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-76dc79c7c444 — rejects invalid paid amount NaN | Unit | 0.46 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cde4f18896bf — rejects invalid paid amount Infinity | Unit | 0.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-26372b78c0c6 — rejects invalid paid amount 9007199254740992 | Unit | 0.60 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c150571069d8 — sums in integers and rejects aggregate overflow | Unit | 0.46 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8b6e2450415e — groups by payment day in Vietnam and reconciles rows with the whole-period total | Unit | 13.84 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f3b1468b4265 — does not fabricate empty daily rows and validates duplicates before grouping | Unit | 0.51 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1fac70cf4842 — keeps 25 daily rows ordered with the exact grand total for real pagination | Unit | 3.13 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/sale-payment.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-f08327377073 — creates a read-only post-discount transfer quote with exact bank/account and no fake invoice | Integration | 375.67 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-22bc33cacff6 — G10 quote allocation skips legacy, issued and version-tombstoned sales IDs without writing a reservation | Integration | 345.24 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-98ac44a50ecc — G10 exhausted sales IDs do not create an invoice, reservation or payment side effects | Integration | 327.75 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-dc122cb0fb87 — G10 existing member points remain usable after one year and reload without a date-based reset | Integration | 409.11 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f2f73d41524e — finalizes cash atomically and never reinterprets a legacy invoice | Integration | 337.01 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-845b18d2c39f — finalizes transfer atomically and never reinterprets a legacy invoice | Integration | 293.35 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f40f7408228e — rolls back the entire sale on hoaDonBanHang failure and permits the identical retry | Integration | 304.11 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-95b4bb70d6a3 — rolls back the entire sale on chiTietHoaDonBH failure and permits the identical retry | Integration | 292.06 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b2bc506bf459 — rolls back the entire sale on sanPham failure and permits the identical retry | Integration | 298.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7a6a6d550c2a — rolls back the entire sale on khachHang failure and permits the identical retry | Integration | 316.44 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-710b7bb55c36 — rolls back the entire sale on appMetadata failure and permits the identical retry | Integration | 313.39 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c48b8716ef49 — rolls back the entire sale on issuedIdentifiers failure and permits the identical retry | Integration | 276.51 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-038946a19f67 — rolls back the entire sale on recordVersions failure and permits the identical retry | Integration | 314.72 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-829aaa6720e3 — rolls back the entire sale on operations failure and permits the identical retry | Integration | 390.70 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c0518f2f62b3 — rolls back the entire sale on auditEntries failure and permits the identical retry | Integration | 333.98 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-21394a3f6190 — serializes two tabs selling the same item and rejects a replay after logout | Integration | 325.18 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2a7cd0cecfda — rejects stale customer points/version even when two different items are purchased | Integration | 316.24 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2834e6e58cc2 — preserves individual sale prices for products from the same bracket and never rewrites purchase history | Integration | 292.39 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7b85234c6da5 — rejects stale revision, stock price/version, and tampered snapshot without any partial writes | Integration | 282.87 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-33e20b648afe — permits nonmember purchases without changing points and refuses a foreign employee cart | Integration | 622.88 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-55c5b9ba6d26 — matches independent CRC vectors and rejects invalid QR inputs | Unit | 263.73 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-690bc2b832f6 — automatically applies the new discount rule at 0 points without trusting the old selection flag | Integration | 281.74 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e0cd1422497a — automatically applies the new discount rule at 49 points without trusting the old selection flag | Integration | 354.79 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cf4c8c6c4cb7 — automatically applies the new discount rule at 50 points without trusting the old selection flag | Integration | 315.62 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-42c2b8895bec — automatically applies the new discount rule at 51 points without trusting the old selection flag | Integration | 300.10 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ad4556f6c8bb — queries real finalized sales with combined filters and stable historical detail without writing data | Integration | 345.64 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7aad55c1ae8b — paginates compatible legacy sales without assigning new meanings or backfilling snapshots | Integration | 380.39 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bd819ce9bf79 — refuses malformed or inconsistent saved snapshots instead of falling back to legacy display | Integration | 280.93 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0c127d938a19 — reads pre-D05 optional-discount invoices without retroactively applying the automatic rule | Integration | 312.94 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-313c69b8dac1 — allows both roles to read invoices through the service and refuses missing legacy details | Integration | 618.54 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-eb25ef601bd1 — joins paid customer history by customer ID and keeps invoice snapshots after profile changes | Integration | 309.15 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bc5491e960b2 — does not hide a corrupt paid snapshot behind customer-history legacy fallback | Integration | 282.06 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ce51f121c4bb — serializes the scheduler with payment: sold items cannot be discounted and repriced quotes cannot be paid | Integration | 267.25 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/sales.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-36ca9cccfabd — snapshots one available mapped product, computes integer subtotal and does not finalize a sale | Integration | 393.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a360217ba4f7 — persists explicit membership opt-in immediately, audits the actor, and leaves points and sales unchanged | Integration | 289.13 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6bb93ad6e2da — serializes competing membership opt-ins without duplicate events | Integration | 286.33 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2897bf2068b4 — rolls back membership if its audit write fails and rejects invalid customer/session access | Integration | 312.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fdb9ea090e29 — rejects unmapped, sold and missing products without creating a draft | Integration | 337.70 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a61cca4dc63d — rejects a stale cart after the G7 scheduler changes the current price and version | Integration | 304.81 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4e808e6ecbed — rejects a product that becomes sold while its snapshot remains in a saved cart | Integration | 266.59 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a0703f0553f6 — serializes competing writes to one draft and permits independent unfinalized carts | Integration | 281.92 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7f824c6100eb — rolls back a failed audit write and replays an idempotent add without duplicates | Integration | 286.12 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-99df075c9eca — enforces per-employee draft access while both roles can create their own carts | Integration | 544.30 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d71e1a446962 — cancels a draft without selling the product and rejects empty carts | Integration | 265.86 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-86123d596e1b — rejects safe-integer subtotal overflow | Unit | 259.60 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-cdc655d3d759 — rounds member discount on subtotal and awards points only on the amount actually paid | Unit | 283.21 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-5f1af8730b05 — requires 50 member points for the discount and allows members not to use it | Unit | 272.20 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-37409132ac84 — does not grant member benefits to nonmembers or change their point balance | Unit | 274.12 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-af466fe5c0ee — rejects applying member points to an empty cart and point balance overflow | Unit | 294.31 | REFACTOR R01 | Assertion thuần không dùng DB nhưng chịu beforeEach dựng DB/auth/business graph; chuyển fixture/context phù hợp, giữ mọi vector và oracle. |
| T-d1fe1c9aef74 — does not permit a stale version when a product is re-priced between lookup and add | Integration | 317.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/staff-accounts.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-91772e61eab0 — creates real staff credentials atomically, forces staff role and exposes a safe readonly DTO | Integration | 698.82 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c5029194c0a8 — validates required/profile input at the service boundary 0 | Integration | 272.74 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-46f19e060d27 — validates required/profile input at the service boundary 1 | Integration | 266.62 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0f52fa1e8c24 — validates required/profile input at the service boundary 2 | Integration | 299.20 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-51843ca0f5a0 — validates required/profile input at the service boundary 3 | Integration | 291.42 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f042da347261 — validates required/profile input at the service boundary 4 | Integration | 276.28 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7505c8819bd6 — validates required/profile input at the service boundary 5 | Integration | 274.32 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8d20bba1af91 — validates required/profile input at the service boundary 6 | Integration | 260.79 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-481b088f7ef4 — validates required/profile input at the service boundary 7 | Integration | 272.08 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1afdf2f32bcb — validates required/profile input at the service boundary 8 | Integration | 265.85 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a23f3b95db32 — reports both duplicate phone and username, including owner data, without partial records | Integration | 393.03 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d6ddb8401796 — serializes two create races and preserves the winning account | Integration | 426.98 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-113e23c7f6f5 — keeps credentials and session when editing only profile, and rejects a stale owner form | Integration | 538.68 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7209216d2e06 — renames atomically with stable employee, FK links, historical actor and session revocation | Integration | 1087.69 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-36f12656c12e — does not rename into another existing username or erase either identity | Integration | 592.25 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-91618acbbdf4 — confirmation cancellation keeps account and sessions; deletion disables account while retaining history identity | Integration | 715.44 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2697fce60fd5 — rejects all staff CRUD and owner-account mutation without touching data | Integration | 639.32 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e3827e4a040b — rolls back every row, aliases and session revocation on create audit failure | Integration | 660.16 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-197eed423982 — rolls back every row, aliases and session revocation on rename audit failure | Integration | 540.25 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5efd7e76190a — rolls back every row, aliases and session revocation on remove audit failure | Integration | 546.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a17508d66d57 — G10 invalid staff edit 0 preserves all stores, credentials and live session | Integration | 488.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4876ed5c3c16 — G10 invalid staff edit 1 preserves all stores, credentials and live session | Integration | 495.02 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7d6fb6e5e442 — G10 invalid staff edit 2 preserves all stores, credentials and live session | Integration | 493.08 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4849ab0bfc62 — G10 invalid staff edit 3 preserves all stores, credentials and live session | Integration | 554.76 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d85f9d0bda1d — G10 invalid staff edit 4 preserves all stores, credentials and live session | Integration | 541.66 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-53bfda1865ce — G10 rejects a staff phone edit into another profile without revoking sessions or changing aliases | Integration | 706.42 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-554cf6dfefb9 — G10 staff list and detail are read-only for every store across reopen | Integration | 390.28 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/unit/stock-comparison.test.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-be98c955da51 — G9-D05 uses the same cohort for current/previous counts and signed percentages | Unit | 23.92 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f9abf3534173 — G9-D05 sale cutoff 2026-10-31T23:59:59.999+07:00 preserves the exclusive end-of-month boundary | Unit | 0.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-58166c8e00d0 — G9-D05 sale cutoff 2026-11-01T00:00:00+07:00 preserves the exclusive end-of-month boundary | Unit | 0.54 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e73db133d4fd — G9-D05 sale cutoff 2026-11-01T00:00:00.001+07:00 preserves the exclusive end-of-month boundary | Unit | 0.49 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0c31120f695e — G9-D05 an import at/after cutoff 2026-11-01T00:00:00+07:00 is not previous stock | Unit | 0.55 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5c10def68050 — G9-D05 an import at/after cutoff 2026-11-01T00:00:00.001+07:00 is not previous stock | Unit | 0.37 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0dc3869ac5dd — G9-D05 cutoff respects Vietnam calendar/month/year/leap boundary 2027-01-01T00:00:00+07:00 | Unit | 0.62 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-103d0d530a87 — G9-D05 cutoff respects Vietnam calendar/month/year/leap boundary 2028-03-01T00:00:00+07:00 | Unit | 0.43 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-71b95e230ceb — G9-D05 cutoff respects Vietnam calendar/month/year/leap boundary 2026-11-30T17:00:00Z | Unit | 0.51 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-59527b4a5064 — G9-D05 zero and incomplete evidence never fabricate a percentage | Unit | 1.08 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ec6be01a3c7e — G9-D05 invalid/future/contradictory chronology is insufficient 0 | Unit | 0.65 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c64d4bfa2960 — G9-D05 invalid/future/contradictory chronology is insufficient 1 | Unit | 0.37 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-bea37ca8c771 — G9-D05 invalid/future/contradictory chronology is insufficient 2 | Unit | 0.35 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1cfa6b62daa3 — G9-D05 invalid/future/contradictory chronology is insufficient 3 | Unit | 0.50 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-afc6dcb84e8e — G9-D05 invalid/future/contradictory chronology is insufficient 4 | Unit | 0.60 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2a3bd9bed01e — G9-D05 rejects duplicate product facts rather than counting twice | Unit | 1.22 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/auth.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-d20d911e0b5c — owner: login states, source geometry, real session, logout and Back protection | E2E | 2309.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4e8c8853f2f3 — staff: login states, source geometry, real session, logout and Back protection | E2E | 2170.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7c5b6752c76a — owner and staff share DB with separate sessions, staff route denied and revoked account loses access | E2E | 2102.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9d3157e0517a — real browser v2 migration preserves existing owner credentials and customer data | E2E | 856.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-98766211f3fa — forged session data cannot select an owner identity | E2E | 1168.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-05d8b71623da — failed browser session persistence rolls back the new login session and offers recovery | E2E | 859.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2aa8bc3d1ec7 — bootstrap is race-safe across two browser tabs | E2E | 770.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/confirmation.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b321cb51015d — owner customers: compact centered confirmation, cancel/X/Escape preserve data, confirm targets only selected record | E2E | 3412.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b80fca98e166 — staff customers: compact centered confirmation, cancel/X/Escape preserve data, confirm targets only selected record | E2E | 3636.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9b381f15c925 — owner staff: compact centered confirmation, cancel/X/Escape preserve data, confirm targets only selected record | E2E | 3394.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-29e5cec4b696 — delete failure rolls back data, shows an error, and allows a real retry | E2E | 1748.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-59ae7b241794 — busy confirmation blocks repeat clicks, X, cancel and Escape until one transaction finishes | E2E | 1636.00 | REFACTOR R02 | Giữ chống xử lý lặp nhưng lock pump IDB cần release trong finally để assertion lỗi không giữ transaction/CPU đến teardown. |
| T-6b9509a2d884 — a changed customer cannot be deleted using an old open confirmation snapshot | E2E | 2295.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/discount-scheduler.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-72e81ae6c749 — G7 automatic delayed reopening and two native tabs apply 45 first, including below-20000, and both roles read real monitor logs | E2E | 4094.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ea53000d2799 — G7 native scheduled write failure rolls back price/event/version, logs failure and recovers on another opening without duplicates | E2E | 3106.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2a88da73401d — G7 open app runs at Vietnam midnight with no manual trigger | E2E | 2292.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/g6-verification.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b375bb408212 — T07 native migration abort restores v3 and successful runtime upgrade preserves all legacy stores and numeric codes | Integration | 338.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fe12d16d811a — T07 actual runtime: two UI roles approve, finalize, live-read shared invoice/history and preserve canonical graph on reload | E2E | 4939.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/home-stock-comparison.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b8512b34f3a7 — G9-D05 sell: verified month-end comparison through real UI, foreign timezone and readonly reload | E2E | 3393.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-af2db42d1613 — G9-D05 purchase: verified month-end comparison through real UI, foreign timezone and readonly reload | E2E | 3042.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/home-t05.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-e72807397c4e — T05 approved M01-B: independent staff dashboard updates live on real profile create/delete and preserves legacy after reload | E2E | 2287.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b1ff7dbe0200 — T05 dashboard storage failure reports an error, offers retry and never displays a false zero | E2E | 1150.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c088684bcf3f — T05 owner: real quick actions open lists without creating any business records | E2E | 1639.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2b974f3ce0de — T05 staff: real quick actions open lists without creating any business records | E2E | 1766.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9820fa91b33a — T05 review-only: render proposed card wording outside runtime for approval | E2E | 332.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/inventory-edit.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-9956c88f412b — G7 owner edits one physical item, validates, cancels, resets cycle and preserves historical records | E2E | 2916.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9aa33f51f365 — G7 staff edits one physical item, validates, cancels, resets cycle and preserves historical records | E2E | 3430.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cccbc4109f56 — G7 stale editor reloads the real current form after conflict and never overwrites another tab | E2E | 3426.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-82f99bf6d87a — G7 native metadata write failure rolls back the whole edit, keeps form and permits one retry | E2E | 2328.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/inventory.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-9892eeefdcfe — G7 T01 owner: real inventory, combined filters, pagination, three desktop viewports, detail and read-only reload | E2E | 6123.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5edf38deaa47 — G7 T01 staff: real inventory, combined filters, pagination, three desktop viewports, detail and read-only reload | E2E | 6523.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-91fcf9997671 — G7 T01 empty inventory and native read failure use source error notices without writes | E2E | 1486.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-150fc445f6a7 — G7 T01 inventory list spacing and typography match Thu mua at 1440x900 | E2E | 1208.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/pagination.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-ac8f4fc0d493 — owner customers: responsive pages, stable footer, no internal scrolling | E2E | 13034.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f3e999bbb5f6 — staff customers: responsive pages, stable footer, no internal scrolling | E2E | 12604.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2f2b30c89057 — owner staff: responsive pages, stable footer, no internal scrolling | E2E | 9999.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8997a4d00f22 — owner price-brackets: responsive pages, stable footer, no internal scrolling | E2E | 12650.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b6cdcd315908 — customer search paginates the filtered set and preserves the query across pages | E2E | 1309.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d99376a916a8 — bracket condition filter preserves its value while paging and resets a removed page | E2E | 1224.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c2fd59d78fe8 — customers: UI add creates page 2; live delete clamps page 2 and keeps it clamped on later add | E2E | 2108.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1c02de41d3e1 — staff: UI add creates page 2; live delete clamps page 2 and keeps it clamped on later add | E2E | 2917.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8057dbc3322a — creating a tenth bracket updates the page count using the active filter | E2E | 1199.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b90772c470fd — many pages use ellipsis and never link to a nonexistent page | E2E | 1257.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e779cca9e677 — owner customers: shrinking preserves filters, reslices without gaps, and expanding restores nine | E2E | 1742.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0e524cf11f47 — staff customers: shrinking preserves filters, reslices without gaps, and expanding restores nine | E2E | 1965.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0feb5408b266 — owner staff: shrinking preserves filters, reslices without gaps, and expanding restores nine | E2E | 2079.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3432f6513f54 — owner price-brackets: shrinking preserves filters, reslices without gaps, and expanding restores nine | E2E | 2424.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/phase10-customer-edit.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b5ed7e8431cf — G10 BR-UC4-03/04/05 owner: invalid and duplicate edits preserve all data, cancel and rename retain identity | E2E | 2275.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-62463cb7123c — G10 BR-UC4-03/04/05 staff: invalid and duplicate edits preserve all data, cancel and rename retain identity | E2E | 2292.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/phase10-finalize-benchmark.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-275ebcc0090e — G10-T05 owner 25: measure real purchase and cash-sale commits without an invented SLA | E2E | 8264.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-286d893e1806 — G10-T05 owner 1000: measure real purchase and cash-sale commits without an invented SLA | E2E | 20967.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-274168882786 — G10-T05 staff 25: measure real purchase and cash-sale commits without an invented SLA | E2E | 9109.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-868c49d5b96b — G10-T05 staff 1000: measure real purchase and cash-sale commits without an invented SLA | E2E | 22967.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/phase10-integrity.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-25f020ecad11 — G10-T04 native 1000-item graph: a final audit failure rolls back every write and retry commits exactly once | E2E | 5871.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/phase10-journey.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-4c20de2d953b — G10-T01 staff sells first: approval, real earned points, redemption, history and all financial reports | E2E | 7634.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8f0d7789098e — G10-T01 owner sells first: approval, real earned points, redemption, history and all financial reports | E2E | 8500.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/phase10-security.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-593f91bb1897 — G10-T04 owner: persisted HTML customer name stays literal through detail, history and reload | E2E | 1882.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-88df1d7b2469 — G10-T04 staff: persisted HTML customer name stays literal through detail, history and reload | E2E | 1949.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-74efeec59600 — G10-T04 rejection HTML is stored literally, delivered across tabs and harmless after owner reload | E2E | 3539.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/phase10-usability-benchmark.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-c9dbe51f3224 — G10-T05 owner: measured customer search, keyboard, touch and error-free create/delete | E2E | 3803.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a6694ad989b0 — G10-T05 staff: measured customer search, keyboard, touch and error-free create/delete | E2E | 3836.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/phase10-visual.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-3b3b246bbb4b — G10-T03 SC105 report picker: source geometry and pixel comparison, no runtime baseline update | Visual | 1282.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-approvals.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-70d09b24d203 — T03 approve through UI, independent sessions, live data, search/date and screenshots | E2E | 3884.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6dd9c37a3c9b — T03 reject requires reason, cancel preserves data and shared decision updates live | E2E | 3729.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6578ff16c62e — T03 approve write failure rolls back, retry commits once and delivery failure preserves the decision | E2E | 3248.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-2d3b9f540c6e — T03 reject write failure rolls back, retry commits once and delivery failure preserves the decision | E2E | 3322.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c8804c879897 — T03 refuses a request after employee remove | E2E | 3129.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cf9ca836ce2b — T03 refuses a request after employee cancel | E2E | 3172.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f030c5e7720f — T03 two owner tabs racing preserve a single decision and notice | E2E | 3669.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-64fc488faee4 — G10 opposing approve/reject UI decisions commit once and both owner tabs recover without reload | E2E | 3978.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7999c29507ea — T03 approve: dismiss success with Escape, preserve filters and open another request without overlay | E2E | 3759.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f24b503bc2da — T03 reject: dismiss success with Escape, preserve filters and open another request without overlay | E2E | 3615.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-89008e035059 — T03 real requests paginate and list read error recovers through navigation | E2E | 6664.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-candidate-storage.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-59ae2ceac338 — T01 native Chromium storage integration: candidate migration, CAS, replay, audit rollback and revoked session; no G6 UI claim | Integration | 857.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-231592ec0141 — T01 native FK integration: mixed-price lines, strict provenance and rollback; no finalize UI claim | Integration | 640.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-customer-layout.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-bca5a785a1e5 — owner: existing purchase customer follows local Figma phone suggestion and selected states | E2E | 3039.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4cdaaa2010cb — staff: existing purchase customer follows local Figma phone suggestion and selected states | E2E | 2598.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-drafts.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-a5c79be6083b — T02 owner: real UI input, validation, pending request, reload, remove and cancel | E2E | 2782.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f15190b92a14 — T02 staff: real UI input, validation, pending request, reload, remove and cancel | E2E | 3896.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-560f1ad4a2d8 — T02 native IDB failure keeps the price form, rolls back and retries without duplicate request | E2E | 1810.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b139cd34f8ed — T02 real customer creation and selection persist without creating an invoice or stock | E2E | 1604.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-50ce5842860a — T02 missing bracket is recoverable and ten real lines paginate without hidden rows | E2E | 5459.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-editor-figma.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-c7381c3e3ca4 — owner: empty purchase editor preserves the local Figma canvas layout | E2E | 1577.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-3cc15dc4f2fe — staff: empty purchase editor preserves the local Figma canvas layout | E2E | 1628.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fc7ed0e122f2 — purchase editor keeps the shared shell and reference typography across desktop viewports | E2E | 2065.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-finalization-storage.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-5bbf99d0343e — T05 native storage transaction rolls back, retries, reserves IDs and serializes connections | Integration | 799.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-finalization.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-6c7ba238a484 — T05 owner validates empty and missing customer, finalizes mixed prices and quantity once, then reloads safely | E2E | 2978.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-05ab3f99c568 — T05 staff cannot finalize pending/rejected prices, then completes an approved mixed-price purchase | E2E | 4881.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-94f492a8c8b8 — T05 productCosts failure rolls back and keeps the editor for a single successful retry | E2E | 2309.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e49604ebcd06 — T05 auditEntries failure rolls back and keeps the editor for a single successful retry | E2E | 2367.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-681b7f11e681 — T05 two owner tabs finalize one draft once and the losing tab recovers to the list | E2E | 2869.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-da1db680a279 — T05 reload immediately after native commit restores the completed draft without a second invoice | E2E | 2355.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-42f0252670f4 — T05 cancel customer creation leaves no customer and concurrent phone creation stays unique | E2E | 2456.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-list.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-bd75fa05e984 — owner: Thu mua opens list, filters and pages real legacy data, then explicitly opens creation | E2E | 5403.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c173df443bac — staff: Thu mua opens list, filters and pages real legacy data, then explicitly opens creation | E2E | 5332.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-queries.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-e1ca6d7fdade — T06 owner: real mixed-price purchase, combined search, reload, stable customer history and read-only views | E2E | 4518.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ef39296e256c — T06 staff: real mixed-price purchase, combined search, reload, stable customer history and read-only views | E2E | 5085.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ec6b32467fc3 — T06 read error list: Figma notice closes without fabricated data or writes | E2E | 2659.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f6b0fea75301 — T06 read error detail: Figma notice closes without fabricated data or writes | E2E | 2639.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-644029a629cd — T06 read error history: Figma notice closes without fabricated data or writes | E2E | 2675.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/purchase-results.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-1fda58dd9737 — T04 approval reaches the creator live, is acknowledged once and survives replay/reload | E2E | 3570.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-089de4c04efd — T04 rejection reason and real price revision 80000, immutable history and new snapshot | E2E | 3643.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-49e3b33a351b — T04 rejection reason and real price revision 130000, immutable history and new snapshot | E2E | 3985.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-09deaec32406 — T04 unread result recovers after signal failure and two creator tabs display it once | E2E | 3944.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f5bbed7de5e8 — T04 acknowledgement and price write failures retain the dialog, rollback and retry once | E2E | 3514.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/reference-data.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b0eb87552d4c — owner customer UI validates, cancels, creates, searches, edits, histories, deletes and persists | E2E | 2902.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-864e1a843e04 — staff customer UI validates, cancels, creates, searches, edits, histories, deletes and persists | E2E | 3026.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f99c7b362a61 — two tabs keep independent identities, live customer data without F5, and reject stale UI writes | E2E | 2439.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f8805944556d — owner bracket UI uses fixed dropdown, validates, cancels, edits and blocks staff route | E2E | 2849.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a5cdd27a27d2 — customer UI reads existing purchase/sale history and snapshots, and refuses linked deletion | E2E | 1973.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-da1336274f49 — customer UI handles a real IDB write failure without partial data and allows retry | E2E | 1413.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c61466b6d669 — customer pagination changes real rows and search reset returns to the first page | E2E | 2869.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-39dcfab25dac — layout fits 1366x650 without browser zoom | E2E | 1487.00 | MERGE M01-1366x650 | Cùng viewport có luồng bootstrap/login/customer detail chồng lặp; hợp nhất theo cặp nhưng giữ kiểm staff, scroll, header, history, screenshot và từng assertion. |
| T-e6109476fde2 — layout fits 1280x720 without browser zoom | E2E | 1492.00 | MERGE M01-1280x720 | Cùng viewport có luồng bootstrap/login/customer detail chồng lặp; hợp nhất theo cặp nhưng giữ kiểm staff, scroll, header, history, screenshot và từng assertion. |
| T-eec4016a6f42 — layout fits 1024x768 without browser zoom | E2E | 1572.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c12650cdc614 — layout fits 768x1024 without browser zoom | E2E | 1615.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-726fd8693637 — layout fits 390x844 without browser zoom | E2E | 1472.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-1e167cec4054 — layout fits 320x640 without browser zoom | E2E | 1447.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/reports-purchase-cost.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-07c40249962b — T03 actual purchase, four filters, read-only reload, source empty/error and three desktop viewports | E2E | 3596.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-966357a3cd11 — T03 staff direct route is denied with an independent owner tab | E2E | 2848.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-50e2d4716a7c — T03 25 daily rows from real transactions paginate without changing period totals | E2E | 19472.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/reports-reconciliation.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-19c344d89614 — G9-T06 approved purchase journey reconciles mixed-price stock, a real sale and both role dashboards | E2E | 4927.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-4cdb2f951c4d — G9-T06 partial: independent staff sales update owner reports live and reconcile invoices, stock and costs | E2E | 5611.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/reports-revenue.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-b993df78c1af — G9-T02 owner: real discounted revenue, four period filters, reload, read-only and empty/error recovery | E2E | 4404.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-cb877c879352 — G9-T02: 25 actual UI-completed invoices, daily pagination, stable totals and desktop screenshots | E2E | 12450.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ffaae216dc63 — G9-T02 staff: sidebar hidden and direct report route denied, owner session remains independent | E2E | 3385.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-892f40bd637c — G9-D01 native reload: missing payment time and legacy sale date never manufacture report revenue | E2E | 2840.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/reports-t04.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-f6d5e0e0d435 — T04 profit: real paid totals, period filters, empty/error, reload and desktop geometry | E2E | 4313.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9ae288c8c0f2 — T04 cash-flow: real paid totals, period filters, empty/error, reload and desktop geometry | E2E | 4072.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-d02255f550d3 — T04 aged stock: exact threshold, filters, 25 real products, pagination, empty/error and readonly reload | E2E | 4788.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-66e0685d776a — T04 staff cannot access any new report while owner session remains independent | E2E | 2788.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/sale-payment.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-bbb5229ea103 — G8-T03/T04 owner cash: real payment, immutable totals, exact points and close all dialogs | E2E | 3055.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-72bd5c687cbb — G8-T03/T04 owner transfer: real payment, immutable totals, exact points and close all dialogs | E2E | 3702.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-47d7c1348c84 — G8-T03/T04 staff cash: real payment, immutable totals, exact points and close all dialogs | E2E | 3996.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5ecdc8b25e81 — G8-T03/T04 staff transfer: real payment, immutable totals, exact points and close all dialogs | E2E | 4541.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-a97a608ef3db — G8-T04 native appMetadata failure rolls back and allows one retry | E2E | 2728.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-0a24421bb648 — G8-T04 native auditEntries failure rolls back and allows one retry | E2E | 3024.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-87c0d441cdcf — G8-T04 two real tabs cannot sell the same product twice and stale QR remains recoverable | E2E | 3712.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-5176d14bb115 — G8-T04 point overflow leaves the real cart recoverable and cannot create a sale | E2E | 2728.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/sales-draft.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-9ba7cdf6a6b3 — G8-T01 owner: mapped products remain draft-only | E2E | 3568.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ed117c2c8030 — G8-T01 staff: mapped products remain draft-only | E2E | 4543.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ecd541972469 — G8-T02 owner: explicit membership opt-in persists before payment | E2E | 3318.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6ac7086e7624 — G8-T02 staff: explicit membership opt-in persists before payment | E2E | 4532.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/sales-pages.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-975025ee2208 — G8 sales list: real UI invoices, combined search/reset, pagination, immutable detail and both roles | E2E | 8378.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-e37404a4db30 — G8 sales list shows a native loading error and can retry without writes | E2E | 2385.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ec6fc3056e7c — G8 inline entry: manual/wedge Enter, duplicates and invalid codes preserve the real cart | E2E | 2777.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-547e49979ff8 — G8 automatic discount updates live after another role earns points through a real sale | E2E | 3868.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/sales-t05-errors.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-ebd982ee57bf — T05 owner: invoice and customer purchase-history read errors use Figma notices and recover without writes | E2E | 3332.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-059b51822e29 — T05 staff: invoice and customer purchase-history read errors use Figma notices and recover without writes | E2E | 4287.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/sales-t05-t06.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-761294970fac — T05 both roles: customer purchase history preserves paid snapshots after profile edits and prints read-only | E2E | 5428.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-9b315231986b — T06 two roles holding QR for different items cannot consume the same 50 points twice; stale tab recovers without reload | E2E | 4980.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8c16e89fdd57 — T06 scheduler catch-up invalidates an open QR and retry uses the real new price | E2E | 3279.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/sales-t06-recovery.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-d8d7adf90032 — T06 owner: reload after native payment failure preserves cart and retries exactly once | E2E | 3775.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-82a1435b8c58 — T06 staff: reload after native payment failure preserves cart and retries exactly once | E2E | 4458.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-60a68180e886 — T06 owner and staff confirming the same product concurrently commit one invoice and one point update | E2E | 4595.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/shell.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-8b3f09ab585e — shell, fallback route, persisted metadata and local requests | E2E | 1133.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-454915236a61 — unavailable IndexedDB displays a recoverable startup error | E2E | 227.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-8017b14cf311 — upgrades phase 1 browser data without deleting existing metadata or seeding accounts | E2E | 350.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/staff-review.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-20a77253228c — G5 source controls and successful states SC145/146/148/149/150/152-155/157-160/162 through real UI | E2E | 3988.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-02fe69bd2f3b — G5 failures SC147/151/156/161 preserve complete DB and recover through UI retry | E2E | 3119.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-7efc48687392 — G5 create form and password control fit desktop and narrow viewports without console errors | E2E | 1795.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

## tests/e2e/staff.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-2b5829a2f908 — staff management UI validates all fields, cancels, creates, reads safe details and checks duplicates | E2E | 2417.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-6a95f3e79e68 — two real UI-created roles retain independent sessions; rename and delete revoke staff live | E2E | 3307.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-fe37376e108f — two owner forms cannot overwrite a staff profile with a stale version | E2E | 2264.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b65e4ffc8f35 — account create storage failure keeps form, rolls back and allows UI retry | E2E | 1576.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-eb16d7f241b2 — desktop details land on loaded content at 1366x650 | E2E | 2047.00 | MERGE M01-1366x650 | Cùng viewport có luồng bootstrap/login/customer detail chồng lặp; hợp nhất theo cặp nhưng giữ kiểm staff, scroll, header, history, screenshot và từng assertion. |
| T-6cb0d73c8bef — desktop details land on loaded content at 1280x720 | E2E | 2180.00 | MERGE M01-1280x720 | Cùng viewport có luồng bootstrap/login/customer detail chồng lặp; hợp nhất theo cặp nhưng giữ kiểm staff, scroll, header, history, screenshot và từng assertion. |

## tests/visual/customer-dialogs.local.spec.ts

| Test ID / tên | Loại | ms thực đo | Đề xuất | Lý do |
|---|---|---:|---|---|
| T-3efd380d6964 — SC101 owner confirm: exact private source comparison and actual deletion rules | Visual | 2866.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-b18048d9d265 — SC102 owner linked: exact private source comparison and actual deletion rules | Visual | 10313.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-f262acfa8eda — SC103 owner success: exact private source comparison and actual deletion rules | Visual | 8264.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-ec9f7e6f12fc — SC104 owner failure: exact private source comparison and actual deletion rules | Visual | 4294.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-39a12ff02899 — SC294 staff confirm: exact private source comparison and actual deletion rules | Visual | 5252.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-680004b18b41 — SC295 staff linked: exact private source comparison and actual deletion rules | Visual | 8912.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-011e410e399d — SC296 staff success: exact private source comparison and actual deletion rules | Visual | 4807.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |
| T-c33d3996243f — SC297 staff failure: exact private source comparison and actual deletion rules | Visual | 3967.00 | KEEP | Giữ kiểm chứng độc lập về hành vi, dữ liệu hoặc ranh giới của test; không thay bằng kiểm thử ở lớp khác. |

