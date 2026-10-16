# Wi-Fi Trap fourth-action correction — 2026-10-16

## Why the old action could still appear

The active source was already the three-choice version 4. Inspection found two remaining paths to the old screen:

1. **Stale public build:** `public/index.html` still loaded `index-DIkMdo5X.js`, which contained the old staff action and did not contain `Campus_Guest_Free` or the new caution action. The previous application build refreshed `frontend/dist/`, but did not refresh `public/`, the configured Vercel output directory.
2. **Historical sessions:** the saved local preview session is version 3. That version intentionally uses the legacy Wi-Fi component and its fourth action. Refreshing a saved session does not upgrade its question or answer contract.

These findings explain how the old interface remained available; the exact browser tab or remote deployment viewed by the user was not accessible for inspection.

Both build outputs have now been regenerated. `public/` and `frontend/dist/` load the current `index-Bojs2Etu.js` bundle. No additional deletion from active gameplay source was necessary: its backend definition and frontend component already exclude the fourth action. No CSS hiding was added.

## Active game verified

Exactly three selectable network cards remain:

- `Campus_WiFi` — password required.
- `Campus_Guest_Free` — no password required; intended answer.
- `Campus_WiFi_5G` — password required.

The rendered current page contains no “Another available action” heading, Arabic equivalent, staff card, staff icon or staff selection control. Wi-Fi icons, connection details, question, English/Arabic text, written explanation and 20/10/0 scoring remain unchanged. An obsolete saved `verify-with-staff` draft selection is discarded while its written explanation is retained.

The active backend returns HTTP **400** for `verify-with-staff`. The new regression test also verifies that rejection changes no attempts, progress, scores or session timestamps, and that a subsequent correct guest-network answer earns 20 points. Existing tests retain weak-reasoning partial credit and incorrect-selection zero credit.

## Files changed

- `frontend/src/pages/AwarenessMiniGame.test.tsx`: explicit English/Arabic checks for absent heading/card/button and rejected old draft selection.
- `backend/src/integration.test.ts`: dedicated fourth-action rejection and unchanged-persistence regression.
- `WIFI_TRAP_REPORT.md`: link to this correction report.
- `WIFI_TRAP_FOURTH_ACTION_REPORT.md`: this report.
- Generated `public/` assets/index and application build outputs were refreshed; deployment settings and gameplay source were not edited.

## Executed verification

| Check | Result |
|---|---|
| `npm test`: backend | **PASS — 137 tests** |
| `npm test`: frontend | **PASS — 29 tests** |
| `npm run test:db`: isolated API suite | **PASS — 42 tests** |
| `npm run build` | **PASS** — frontend, backend and Prisma generation |
| `npm run build:vercel` | **PASS** — refreshed `public/` |
| Firefox against the rebuilt public app, EN/AR at 375 and 1280 CSS-pixel widths | **PASS** — exactly three choices; fourth section absent from actual DOM; no horizontal overflow |
| Firefox Arabic written submission and results | **PASS** — 20 points; 140/140 |
| Historical version-3 Arabic screen | **PASS** — original contract remains usable |
| Other source/schema preservation | **PASS** — all 60 other snapshotted source/schema files and checked dependency/deployment files unchanged |
| Live deployment and physical phones | **NOT EXECUTED** |

**208 distinct automated tests passed.** The regular command skips database tests; all 42 were executed separately against a new temporary database. Browser checks used the actual rebuilt `public/` frontend with the existing backend API and isolated temporary sessions. Desktop English and mobile Arabic screenshots were visually inspected. Screenshots: `/tmp/cyberlab-wifi-three-actions-{en,ar}-{375,1280}.png`.

## Historical compatibility and testing it yourself

Version 3's original action and renderer remain only for historical sessions. No session was migrated, deleted or regraded; no new scenario version is needed. Other games, registration, admin features and the 140-point maximum are unchanged.

Restart the local app, reload the browser, and register again from the home page to create a **new version-4 session**. Resuming the earlier version-3 code intentionally retains the original question. A remote deployment needs the rebuilt frontend and current backend deployed together; no deployment was performed by this correction.
