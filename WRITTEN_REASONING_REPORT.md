# Mini-game UI and written reasoning report

Implemented locally on 2026-10-15. Permission Detective, Ransomware and Network Defender now use a written explanation rather than predefined evidence buttons. Seven-game sessions still have a **140-point maximum**, and scoring remains **20 / 10 / 0**. Existing four-game sessions, stored scores, registration and administrator authentication are preserved.

## UI improvements

**Permission Detective:** Added a fictional smartphone frame, a custom QuickCalc+ icon built with local markup/CSS, app information, a calculator display and keypad preview, and expandable OS-style Microphone/Contacts/Location permission rows. Digit/clear buttons affect only the cosmetic preview. They never select or submit a security decision. The original action choices and correct action are unchanged.

**Network Defender:** Added a dark Campus Network Security Monitor with a clearly fictional status snapshot, three campus devices, 48 observed actions, four event entries, a static traffic chart and selectable monitoring cards. Event cards show timestamps, source/device labels and categories. All unselected events use the same neutral styling. Selecting a card highlights that selection and displays factual details without grading it. Existing event/action IDs and the suspicious event are unchanged. No network interfaces, packet capture, scanning or external services are used.

The chart and counters describe a fictional snapshot: one portal login, one download, one browsing session and 45 unsuccessful logins, totaling 48 actions across four entries. The earlier chart points are labeled as a fictional sample. New styles are scoped to the new interfaces.

## Written explanations

All three new games reuse the existing DecisionPanel multiline textarea. Participants select an action/event, write a short explanation, then submit. English/Arabic labels and generic placeholders provide no suggested answer. Predefined reasoning arrays, public metadata and evidence-button rendering were removed.

- Maximum: **240 characters**, enforced by the frontend and backend.
- Require at least three letters; blank, whitespace-only, numeric-only and punctuation-only submissions are rejected for the three mini-games.
- Backend validates strings, checks raw length, normalizes Unicode/whitespace and trims text before storing it.
- Changing an action, receiving a request error, rerendering or changing language retains the explanation.
- Drafts are stored in session storage under the participant code and scenario. Reloading the tab restores that draft; another participant gets a separate key. Feedback clears the accepted draft.
- Submitted text is untrusted. It is never inserted as executable HTML. Existing administrator rendering uses React text interpolation. Markup does not earn reasoning credit, and feedback does not echo participant input.

## Evaluation and feedback

Extended the existing deterministic local evidence matcher in `backend/src/justification.ts`. The original four scenarios retain their previous rule data, normalization and scoring paths.

The new rules match normalized whole words/phrases in combinations, including English and Arabic alternatives. They recognize relevant relationships such as calculator function versus unrelated access/privacy exposure, containment versus malware spread or uncertain recovery after payment, and repeated login failures versus password guessing/intrusion. Tests include varied English phrasing and Arabic/Libyan wording. Exact wording is not required.

Restating an action/event label alone, tested unrelated notes, markup and tested contradictory claims do not earn full credit. Action correctness remains authoritative:

- **20:** Correct action with recognized adequate reasoning.
- **10:** Correct action with inadequate/unrecognized reasoning.
- **0:** Incorrect action, regardless of reasoning.

Feedback explains the relevant principle only after submission, including when a correct action earns partial credit. English and Arabic feedback distinguish the action from reasoning quality. New briefing text was adjusted where it directly suggested the expected rationale. No hidden evaluation rules or answer keys are returned in public scenario responses.

**Limitations:** This matcher does not understand meaning like a human or an LLM. It can miss valid unfamiliar phrasing, dialects, implicit context and spelling variants. Complex negation, mixed claims and deliberate keyword stuffing can still cause false positives or false negatives. The explicit contradiction examples are not a general logical-negation parser. Tests establish supported examples, not universal semantic accuracy. No external grading API or dependency was added.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Backend unit/security/scenario/migration suite | PASS | 95 tests, including 86 justification tests |
| Frontend tests | PASS | 20 tests, including 14 mini-game checks |
| Database-backed API suite | PASS | 29 tests through `npm run test:db`, fresh temporary SQLite using the existing Turso adapter |
| Written scoring | PASS | All three games tested for 20/10/0, English/Arabic reasoning, paraphrases, blank/invalid/overlength input and irrelevant/repeated answers |
| UI interaction | PASS | Phone/icon/keypad/permission controls, static graph/event cards/details, textarea-only reasoning, draft retention, action changes and submission |
| Safety and privacy | PASS | Untrusted markup tests, public answer/rule omission, session separation and independent participant progression |
| Historical compatibility | PASS | Original four-game results and historical seven-game scores are retained without regrading |
| Production build | PASS | `npm run build`: both Prisma clients, frontend and backend; frontend rebuilt after the chart CSS fix |
| Static frontend packaging | PASS | `npm run build:vercel` (both clients and static frontend) |
| Firefox visual checks | PASS | Real Firefox screenshots, English calculator and Arabic/English network monitor, actual CSS viewport widths 500 and 1280; no horizontal overflow detected |
| Firefox written submission through results | PASS | Real browser entered an explanation, received 20 points, and reached results out of 140 |
| Physical phone / narrower real viewport | NOT EXECUTED | Firefox enforced a 500 CSS-pixel minimum in this environment; the requested 390 window width was not falsely counted as a 390 viewport test |
| PostgreSQL/Docker runtime | NOT EXECUTED | No schema changes; those tools are unavailable here |
| k6 event-scale load test | NOT EXECUTED | Fixture updated for written reasons; load test not run |

**144 distinct automated tests passed** (95 backend + 20 frontend + 29 API). The regular suite skips API tests by default; all 29 were run separately. Early Arabic matching failures were corrected and the relevant complete suites rerun successfully. No production database was opened or migrated.

Browser screenshots were captured under `/tmp/cyberlab-permission-detective-en-500.png`, `/tmp/cyberlab-network-defender-ar-500.png` and `/tmp/cyberlab-network-defender-en-1280.png`. The local preview at http://localhost:3000 was restarted with the new evaluator and its existing temporary database. Browser checks use separate records named Browser Preview.

## Compatibility and migrations

**No database migration is required for this update.** Prisma schemas, prior migrations, scenario versioning and progress calculation are unchanged. Existing historical attempt scores are read as stored and are not recomputed from the new text rules. All previous Name/Telegram behavior remains unchanged. Older tabs should reload to use the written-reasoning screens. Previously required email-removal/scenario-version migrations remain prerequisites for deployments that never applied those earlier releases.

## Files modified and added

Modified:

- `backend/src/app.ts`
- `backend/src/justification.ts`
- `backend/src/justification.test.ts`
- `backend/src/integration.test.ts`
- `backend/src/scenarios/permissionDetective.ts`
- `backend/src/scenarios/ransomware.ts`
- `backend/src/scenarios/networkDefender.ts`
- `backend/src/scenarios/types.ts`
- `backend/src/scenarios/scenarios.test.ts`
- `frontend/src/components/DecisionPanel.tsx`
- `frontend/src/pages/AwarenessMiniGame.tsx`
- `frontend/src/pages/AwarenessMiniGame.test.tsx`
- `frontend/src/pages/Simulation.tsx`
- `frontend/src/i18n.tsx`
- `frontend/src/types.ts`
- `frontend/src/index.css`
- `load-test/k6.js`
- `README.md`
- `ARCHITECTURE.md`
- `CODEX_BUILD_PROMPT.md`

Added:

- `frontend/src/components/PermissionReview.tsx`
- `frontend/src/components/NetworkMonitor.tsx`
- `WRITTEN_REASONING_REPORT.md`

Original four backend scenario files, registration code/form, administrator security, session version/progress logic, schemas and historical migrations were compared against the pre-change copy and are unchanged. Generated build outputs were refreshed.
