# G8-T02 Execution — membership and promotion preview

> T03/T04 continuation: user approved P05 physical mapping on 13/11/2026; successful-payment point persistence is now integrated. The earlier PARTIAL status below describes the pre-T04 implementation. Current status: IMPLEMENTED / PENDING REVIEW, subject to [T03/T04 evidence](T03_T04_EXECUTION.md), not automatic acceptance.

> Independent local review 13/11/2026: fixed the empty-cart promotion render failure and sales-only spacing that clipped action buttons. Latest validation: 315 unit/integration tests and 111 final Chromium tests PASS; lint/typecheck/build PASS. Task remains PARTIAL / PENDING REVIEW. See [review and evidence](T02_REVIEW_2026_11_13.md) and [local launcher](LOCAL_RUN.md).

## Status

**PARTIAL — calculation, explicit membership registration, and draft discount preview implemented. Payment finalization and point persistence remain out of scope pending the P05 physical snapshot review.**

## Delivered

- Added a pure sale-promotion calculator for the user-confirmed member discount and points rules.
- Uses integer-safe arithmetic for 20% nearest/half-up discount and post-discount point accrual.
- Requires member status and at least 50 points before consuming exactly 50 points.
- Non-members receive no discount or new points.
- Empty-cart discount attempts and point-balance overflow are rejected.
- Added authorized customer membership lookup and explicit opt-in persistence through the existing `memberships` store.
- Membership registration records the authenticated actor and timestamp transactionally, deduplicates members, handles competing tabs, and rolls back if audit persistence fails.
- Added customer lookup/selection, registration opt-in, member status/points, discount selection, and a draft-only discount/estimated-total preview to UI10.
- Owner/staff browser flows verify opt-in persists through draft cancellation; no invoice, stock, or point changes are made by this flow.
- Points and invoice/stock/revenue persistence remain deferred until a successful payment finalizer.

## Verification

| Check | Result |
|---|---|
| Focused unit tests `tests/unit/sales.test.ts` | PASS — 17 tests |
| Focused Chromium sales suite `npm.cmd run test:e2e -- --workers=1 tests/e2e/sales-draft.spec.ts` | PASS — 4 tests, including owner/staff opt-in and cancellation |
| Full unit suite `npm.cmd test -- --maxWorkers=1` | PASS — 15 files, 315 tests |
| Full Chromium suite `npm.cmd run test:e2e -- --workers=1` | PASS — 111 tests |
| Lint `npm.cmd run lint` | PASS |
| Typecheck `npm.cmd run typecheck` | PASS |
| Production build | PASS; existing Vite chunk-size warning above 500 kB |

An initial targeted browser run used stale `dist` output and failed to locate the newly added checkout fields. After rebuilding, the sales suite passed; the existing T01 assertions were narrowed to the new estimated-total row. No test was skipped to hide a failure.

## Gates

- User approved adding explicit checkout registration and discount controls to the existing UI10 flow, without schema change.
- Membership opt-in is to persist immediately even if payment later fails or the sale is cancelled. Point changes remain deferred until successful payment.
- Existing membership storage is sufficient for `{ MaKH, registeredAt, registeredBy }`; no schema change is authorized or needed for that record.
- P05 semantic mapping is confirmed, but physical snapshot representation/migration remains a review gate before finalization.
- This execution does not accept G8-T02, UC_3.1, or G8; successful payment and point update remain unimplemented.

