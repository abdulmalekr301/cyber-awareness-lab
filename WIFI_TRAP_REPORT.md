# Wi-Fi Trap replacement report

> Fourth-action correction (2026-10-16): the stale `public/` bundle has been rebuilt, and the active three-choice screen was verified in English/Arabic Firefox. The fourth action remains only for historical version-3 sessions. See [WIFI_TRAP_FOURTH_ACTION_REPORT.md](WIFI_TRAP_FOURTH_ACTION_REPORT.md) for the cause, changed files and executed checks.

> Historical version-3 release report. The current version-4 refinement is documented in [WIFI_TRAP_REFINEMENT_REPORT.md](WIFI_TRAP_REFINEMENT_REPORT.md); new sessions now use three cards and the caution question.

Implemented locally on 2026-10-15. **Wi-Fi Trap: Choose Your Network** replaces Network Defender as game 7 for newly registered participants. The first six games, Name/Telegram registration, 20/10/0 scoring, 140-point maximum and administrator authentication are preserved.

## Current active order

1. `login-safety`
2. `phishing`
3. `social-engineering`
4. `url-safety`
5. `permission-detective`
6. `ransomware`
7. **Wi-Fi Trap: Choose Your Network** (`wifi-trap`)

The first six complete backend scenario definitions were checked byte for byte against their pre-change copy and asserted against a preserved fixture. Network Defender is absent from this current active sequence and from the current scenario-performance list.

## Wi-Fi Trap UI and interaction

Added a fictional dark smartphone wireless-settings panel with:

- `Campus_WiFi`: password required, simulated signal strength 3/4.
- `Campus_Free_WiFi`: no password required, simulated signal strength 4/4.
- `Campus_WiFi_Official`: password required, simulated signal strength 2/4.
- A separate action to **verify the official network information with conference staff before connecting**.

Network cards include signal bars, lock/unlocked icons, accessible selection states and lightweight transitions. The separate staff action uses the same neutral visual language. Selecting any action updates a summary; it never connects, scans, requests a password or changes device settings. Names, locks and signal strength are not assigned trust labels or warning colors. The interface explicitly identifies itself as simulated. It supports English and Arabic, including right-to-left layout, and wraps/stacks on narrow screens.

## Security decision, reasoning and feedback

The only correct action is `verify-with-staff`. All three immediate connections to unverified networks are incorrect, even if the participant writes a strong security explanation.

The existing multiline explanation field remains, with the Wi-Fi-specific prompt **“Why did you choose this action?” / “لماذا اخترت هذا الإجراء؟”**. It preserves the existing 240-character limit, backend normalization, rejection of blank/non-string/overlength or fewer-than-three-letter submissions, safe text rendering, and session/scenario-specific draft retention. No predefined reasoning choices or hidden evaluation rules are exposed to the frontend.

Extended the existing deterministic evaluator with English/Arabic concept groups covering copied or impersonated network names, rogue/evil-twin hotspots, trusted identity verification, unreliable trust indicators and interception/privacy risks. Tested exact action repetition, irrelevant text and misleading overclaims do not receive full reasoning credit. The evaluator remains rule-based and can misclassify unfamiliar wording, dialects, complex negation or keyword stuffing; no semantic understanding or external grading service is claimed.

Scoring remains server-side:

- **20:** Verify with staff and provide adequate recognized reasoning.
- **10:** Verify with staff but provide weak/unrecognized reasoning.
- **0:** Connect to any of the three unverified networks, regardless of reasoning.

Feedback in both languages explains that attackers can imitate a familiar wireless name, including an “evil twin”; password protection, the word “Official” and a strong signal do not establish identity. It also states that an open network is **not automatically malicious**, and reinforces trusted verification before connecting. These teaching points appear after submission rather than as suggested explanations.

## Historical sessions and administrator statistics

The current application scenario version is **3**, assigned explicitly by registration. The client cannot select an earlier version through the registration payload.

- Version **1**: existing four-game sequence and maximum 80.
- Version **2**: existing seven-game sequence ending in Network Defender, maximum 140.
- Version **3**: the current seven-game sequence ending in Wi-Fi Trap, maximum 140.

Existing version 2 participants can resume and complete Network Defender. Completed version 2 results, raw attempt scores, completion dates and session codes remain valid. No rows are deleted, renamed, regraded or converted to Wi-Fi attempts. Network Defender's original definition and presentation moved under `legacy/`; its translations and evaluator remain because those sessions still need them. The presentation is unchanged, and the scenario definition changed only its relative type-import path.

New sessions cannot submit Network Defender attempts, and version 2 sessions cannot substitute Wi-Fi Trap for their final game. The server validates the expected scenario against each session's own sequence.

Admin totals, completion and averages include sessions using their proper version/maxima. Current scenario performance includes Wi-Fi Trap, while old Network Defender attempts remain in participant histories. The legacy title is labeled “earlier sessions” in the admin interface. API tests check current Wi-Fi attempt counts and compare aggregate averages against returned participant scores.

## Database and deployment requirements

**No database schema change or new migration is needed.** The existing integer `scenarioVersion` supports version 3, and registration already explicitly writes the current application version. Existing schema defaults remain unchanged for compatibility with older inserts/clients. Do not bulk-update old participant versions.

Deploy backend and frontend together, restart the app, and reload old tabs. Earlier email-removal and scenario-version migrations remain prerequisites for deployments that never applied those releases; their historical files were not rewritten. Docker/deployment configuration and dependencies are unchanged. No production database was opened or migrated.

The local preview was restarted using its existing temporary database at **http://localhost:3000**. **Start a new session to test Wi-Fi Trap**; resuming an old seven-game session intentionally retains Network Defender. The local admin password remains `local-preview-admin`.

## Executed verification

| Check | Result | Evidence |
|---|---|---|
| Backend unit/security/scenario/version/migration suite | PASS | 121 tests, including 110 justification tests |
| Frontend tests | PASS | 23 tests, including Wi-Fi networks, signal/lock indicators, all selections, English/Arabic written entry, drafts, blank rejection and final results |
| Database-backed API suite | PASS | 33 tests through `npm run test:db`, fresh temporary SQLite using the existing Turso adapter |
| Active order and first-six preservation | PASS | Current sequence ends with Wi-Fi; fixture and byte comparisons retain all six definitions |
| Correct/weak reasoning | PASS | Wi-Fi verified-information action tested for 20/10, natural English/Arabic paraphrases and insufficient explanations |
| Unverified connections | PASS | Each of the three connection actions scores 0, even with strong reasoning |
| Completion and maximum | PASS | Seven-game runs complete with maximum 140; final Wi-Fi submission transitions to results |
| Historical compatibility | PASS | Four-game results retained; partial version 2 sessions reach Network Defender, complete, and retrieve unchanged results; attempts remain stored |
| Administrator statistics and session isolation | PASS | Current Wi-Fi counts, mixed-version averages and eight independent parallel participant completions |
| Production application build | PASS | `npm run build`: both Prisma clients, frontend and backend |
| Vercel packaging | PASS | `npm run build:vercel` |
| Real Firefox layouts | PASS | English/Arabic screenshots at actual CSS viewport widths 500 and 1280; no horizontal overflow |
| Real Firefox submission | PASS | Staff-verification action plus a written explanation earned 20 points and reached results out of 140 |
| Physical-phone / narrower viewport testing | NOT EXECUTED | No physical device testing; Firefox's earlier measured minimum here was 500 CSS pixels |
| PostgreSQL/Docker runtime | NOT EXECUTED | Those tools are unavailable in this environment; no schema/deployment configuration changes |
| k6 event-scale load test | NOT EXECUTED | Load fixture updated to Wi-Fi reasoning; no load test performed |

**177 distinct automated tests passed** (121 backend + 23 frontend + 33 API), plus the Firefox checks. The regular suite intentionally skips API tests by default; all 33 were executed separately by the isolated runner. Initial fixture-generation and Arabic matching failures were corrected before the complete passing runs. A transient automatic-approval timeout on the socket-enabled test run was resolved by retry; no test is counted as passed from that interrupted attempt.

Screenshots: `/tmp/cyberlab-wifi-trap-en-500.png`, `/tmp/cyberlab-wifi-trap-ar-500.png`, `/tmp/cyberlab-wifi-trap-en-1280.png`.

## Files changed

Modified:

- `backend/src/scenarios/index.ts`
- `backend/src/app.ts`
- `backend/src/justification.ts`
- `backend/src/justification.test.ts`
- `backend/src/integration.test.ts`
- `backend/src/scenarioVersion.test.ts`
- `backend/src/scenarios/scenarios.test.ts`
- `frontend/src/pages/AwarenessMiniGame.tsx`
- `frontend/src/pages/AwarenessMiniGame.test.tsx`
- `frontend/src/pages/Simulation.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Admin.tsx`
- `frontend/src/i18n.tsx`
- `frontend/src/index.css`
- `load-test/k6.js`
- `README.md`
- `ARCHITECTURE.md`
- `CODEX_BUILD_PROMPT.md`

Added:

- `backend/src/scenarios/wifiTrap.ts`
- `backend/test-fixtures/retained-six-scenarios.json`
- `frontend/src/components/WifiTrap.tsx`
- `WIFI_TRAP_REPORT.md`

Moved for required historical-session support:

- `backend/src/scenarios/networkDefender.ts` → `backend/src/scenarios/legacy/networkDefender.ts`
- `frontend/src/components/NetworkMonitor.tsx` → `frontend/src/components/legacy/NetworkMonitor.tsx`

Generated clients and build outputs were refreshed; stale emitted files from the old backend module location were removed. The first six definitions, Name/Telegram registration/validation, shared DecisionPanel, PermissionReview, administrator security, progress helper, schemas, database initialization SQL and historical migrations are unchanged.
