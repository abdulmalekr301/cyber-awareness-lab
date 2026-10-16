# Wi-Fi Trap refinement — 2026-10-16

New registrations now use scenario **version 4**. Only Wi-Fi Trap changes; the other six scenario definitions were verified byte for byte against the pre-change snapshot. Order, maximum **140**, Name/Telegram registration, results, admin behavior, email removal, persistence and deployment configuration remain unchanged.

## Screen and question

Exactly three selectable cards appear, with consistent neutral styling:

| Network | Connection detail | Relative signal |
|---|---|---|
| `Campus_WiFi` | Password required | 3/4 |
| `Campus_Guest_Free` | No password required | 4/4 |
| `Campus_WiFi_5G` | Password required | 2/4 |

Generic vertical signal bars were replaced with curved Lucide `WifiHigh`, `Wifi`, and `WifiLow` icons. The existing library supplies all icons; no dependency was added. Accessible strength labels remain. The fourth staff-verification action and its explanatory UI are absent from the current screen and public scenario contract. Selection identifies the network deserving caution; it does not offer to connect.

**English:** “Which network would you be most cautious about connecting to without verification?”

**Arabic:** «أي شبكة ستكون أكثر حذراً من الاتصال بها دون التحقق منها؟»

## Answer and reasoning

The intended answer is **Campus_Guest_Free** (`caution-guest-free`). Backend-authoritative scoring remains:

- **20:** Intended selection with adequate recognized reasoning.
- **10:** Intended selection with weak reasoning, including merely “It has no password” or its tested Arabic equivalent.
- **0:** Either other selection, regardless of reasoning.

The existing writable explanation, 240-character cap, three-letter minimum, bilingual support, safe text rendering and saved drafts remain. Additional local English/Arabic concept groups recognize unverified networks, public/open Wi-Fi risks, impersonation, uncertainty about official identity and verifying legitimacy. The version-3 rules and every other game's rules and normalization remain unchanged. Evaluation is deterministic phrase/concept matching; unfamiliar wording, negation and keyword stuffing can still be misclassified.

Post-submission feedback explains that open does not mean malicious, password protection does not establish trust, familiar SSIDs can be copied, and real-world connections should follow verification through a trusted source. Answer keys, feedback and evaluator rules are excluded from the public scenario response.

## Compatibility

Versioning was necessary because the correct answer changed. Existing **version 3** sessions retain the original four actions, staff-verification answer, English/Arabic question and feedback, reasoning rules and drafts. Versions **1** and **2** retain their original sequences and maxima. The server validates and grades against each session's own scenario definition, including when the scenario ID is shared. Stored results are not regraded or rewritten.

No database migration is required: the existing integer version field supports 4, and registration explicitly assigns it. Deploy frontend/backend together, restart and reload the app, then **create a new participant session** to try the refined game. Resuming version 3 intentionally retains the old question.

## Executed checks

| Check | Result |
|---|---|
| Backend unit/security/scenario/version/migration tests | **PASS — 137** |
| Frontend tests | **PASS — 27** |
| Isolated database-backed API tests | **PASS — 41** |
| Production build: `npm run build` | **PASS** — both Prisma clients, frontend and backend |
| Final backend build after API validation adjustment | **PASS** |
| First-six definitions, existing reasoning rules, schema/migrations and selected shared flows | **PASS** — snapshot comparisons |
| Actual Firefox rendering, English/Arabic, 375/500/1280 CSS-pixel content widths | **PASS** — three SVG icons, three options, names, no horizontal overflow |
| Actual Firefox Arabic submission and results | **PASS** — 20 points; 140/140 result |
| Actual Firefox version-3 Arabic screen | **PASS** — original four-action contract |
| Physical phones, PostgreSQL/Docker runtime, Vercel packaging and load tests | **NOT EXECUTED** |

**205 distinct automated tests passed.** The regular test command skips the 41 API tests; those ran separately through `npm run test:db` against a fresh temporary database, including a final rerun after the API adjustment. An initial Arabic matching failure was corrected before the passing run. Browser checks used the existing TypeScript server entry point and built frontend with an isolated temporary database; the compiled server's existing local-Turso generated-client packaging issue prevented that initial browser launch and was outside this UI task. No production database was accessed.

Screenshots are in `/tmp/cyberlab-wifi-refined-{en,ar}-{375,500,1280}.png`. Firefox's ordinary window resize bottoms out at 500 here; the 375 check constrained the browser content viewport and verified its actual `innerWidth`.

## Files changed

- `backend/src/scenarios/wifiTrap.ts`: current three-choice question, answer and feedback.
- `backend/src/scenarios/legacy/wifiTrap.ts`: retained version-3 definition.
- `backend/src/scenarios/index.ts`: version-4 registration contract and version-3 sequence.
- `backend/src/app.ts`: validate/grade the session's own contract.
- `backend/src/justification.ts`: version-specific Wi-Fi reasoning extension.
- `backend/src/justification.test.ts`
- `backend/src/integration.test.ts`
- `backend/src/scenarioVersion.test.ts`
- `backend/src/scenarios/scenarios.test.ts`
- `frontend/src/components/WifiTrap.tsx`: current network cards and caution selection.
- `frontend/src/components/WifiSignal.tsx`: shared Wi-Fi strength icons.
- `frontend/src/components/legacy/WifiTrap.tsx`: original session UI with Wi-Fi icons.
- `frontend/src/pages/AwarenessMiniGame.tsx`: choose the compatible Wi-Fi presentation/feedback.
- `frontend/src/pages/AwarenessMiniGame.test.tsx`
- `frontend/src/i18n.tsx`: current and historical Arabic Wi-Fi content.
- `frontend/src/index.css`: scoped Wi-Fi SVG sizing.
- `README.md`
- `ARCHITECTURE.md`
- `CODEX_BUILD_PROMPT.md`
- `WIFI_TRAP_REPORT.md`: historical-release cross-reference.
- `WIFI_TRAP_REFINEMENT_REPORT.md`: this report.

Build output was regenerated. Package dependencies, shared decision controls, database schema, migrations and deployment settings were not edited.
