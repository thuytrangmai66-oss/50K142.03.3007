# G8-T01 Execution — draft cart and price snapshots

## Status

**ACCEPTED — draft-cart subset only (13/11/2026).** This is only the independent subset authorized by [COPILOT_T01_TASK.md](COPILOT_T01_TASK.md). It does not complete UC_3.1 or G8.

## Delivered

- Owner and staff can open their own persisted local sales draft and add/remove eligible products.
- A product is eligible only when its purchase status has a valid `purchase-status-mapping` to the available state. Legacy numeric or unmapped states are not guessed.
- Each line snapshots product ID, source purchase, name, current sale price, quantity 1, product version, and selection time. Duplicate product IDs are rejected.
- Safe-integer subtotal calculation detects overflow.
- Draft mutations and save revalidate current product availability, price, and version; stale or sold product data cannot silently produce a valid draft.
- Draft data uses existing `appMetadata`; no invoice, sale detail, stock update, revenue, membership, points, or payment record is created.
- Draft cancel/removal and role-scoped persistence are covered.

## Verification

| Check | Result |
|---|---|
| `npm.cmd test` | PASS — 15 test files, 308 tests |
| Focused sales + purchase-editor Chromium E2E | PASS — 5 tests |
| `npm.cmd run test:e2e` | PASS — 109 Chromium tests |
| `npm.cmd run lint` | PASS |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd run build` | PASS; Vite reports a non-fatal existing bundle-size warning (>500 kB) |
| Owner/staff screenshots | Captured at 1440×900; see `evidence/T01-owner-cart-1440x900.png` and `evidence/T01-staff-cart-1440x900.png` |

## Changed files

- `src/domain/sales.ts`
- `src/services/sales.ts`
- `src/features/sales/SalesEditor.tsx`
- `src/features/auth/context.ts`
- `src/features/auth/AuthProvider.tsx`
- `src/app/router.tsx`
- `src/components/layout/CoCoLayout.tsx`
- `src/index.css`
- `tests/unit/sales.test.ts`
- `tests/e2e/sales-draft.spec.ts`
- `tests/e2e/purchase-editor-figma.spec.ts` (regression expectation for the now-enabled Bán hàng navigation link)

No schema, migration, API, package, or DB architecture was changed. No commit, push, or deployment was performed. The pre-existing dirty worktree was preserved.

## Not included / open gates

- Invoice allocation/finalization, paid-time and money snapshots (P05).
- Membership registration event and member-only controls (P06).
- The G8 20% discount rounding/points rules (P07 remains open for this behavior).
- Cash/QR payment, invoice history/search, revenue or stock updates.
- Unmapped legacy product status interpretation.

These features remain out of scope for T01 or blocked in later tasks. Do not treat T01 acceptance as acceptance of G8.

## Review and acceptance

- Source review confirmed role-scoped drafts, mapped-availability checks, price/version revalidation, safe integer totals, transaction/audit behavior, and no invoice/stock/points side effects.
- Fresh focused tests before acceptance: sales unit tests 10/10 and owner/staff Chromium flows 2/2 PASS.
- G8-T01 is accepted only for the draft-cart subset above. The phase remains IN PROGRESS.
