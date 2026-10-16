# Three mini-games implementation report

Implemented locally on 2026-10-15. New registrations receive seven scenarios with a maximum of **140 points**. Name/Telegram registration, validation and administrator authentication are preserved. No email, OTP, inbox challenge, tracked links, services or dependencies were added.

## New scenarios and active order

| Order | Scenario | Interaction |
|---|---|---|
| 1 | `login-safety` | Existing scenario, unchanged |
| 2 | `phishing` | Existing scenario, unchanged |
| 3 | `social-engineering` | Existing scenario, unchanged |
| 4 | `url-safety` | Existing scenario, unchanged; continues to game 5 for new sessions |
| 5 | **Permission Detective** (`permission-detective`) | Fictional QuickCalc+ screen requesting microphone, contacts and location. Choose an action and a short evidence option. Review/refusal of unnecessary access is the safe action. |
| 6 | **Ransomware: Save the Files** (`ransomware`) | Clearly labeled fictional file-lock warning. Choose an action and evidence. Network isolation and reporting are the safe response. No files, payments or device connections are affected. |
| 7 | **Network Defender: Spot the Intruder** (`network-defender`) | Simplified campus monitor with four selectable events. Investigate the burst of failed logins from an unknown source and select the supporting evidence. |

The new games use the existing backend scenario-definition pattern, existing briefing flow and a shared dedicated React page with three small visual presentations. The existing DecisionPanel accepts evidence buttons in place of its textarea for these games. All new content is available in English and Arabic. Touch targets are at least 44px high; content wraps and stacks for small screens. There are no new typed-answer tasks.

## Scoring and compatibility

The current rubric is retained: **20** for the correct action with the correct evidence, **10** for the correct action with weak evidence, **0** for an incorrect action. The server validates action IDs and that evidence is one of the scenario's listed choices; correctness remains server-side. Public scenario responses omit the answer key and feedback until submission. The original four scenarios retain their scoring and justification behavior.

New sessions complete after seven attempts and then show results out of 140. Progress and completion use the participant's scenario version. Results messaging still uses a 75% threshold relative to the participant's maximum. Admin reports include all seven scenarios. Individual participant rows display their own progress and maximum. The dashboard shows average participant percentage to compare different versions fairly; raw average points remain available in the API's `averageScore`, with `averagePercentage` added for the display.

Existing completed **and unfinished** sessions retain the original four-game version and maximum of **80**, including saved completion timestamps, attempt records, raw scores and session codes. Existing incomplete sessions can finish their original game. Register a new session to play all seven. Historical inbox-challenge attempts remain stored and excluded from active results.

The original four scenario definitions, Name/Telegram form fields, admin security module and prior migrations were compared byte for byte against the pre-change copy and are unchanged. Only the old fourth game's next-button navigation is conditional on whether that session ends at four or continues to seven.

## Schema and migration

Added `ParticipantSession.scenarioVersion` in both Prisma schemas. Existing rows receive **1**, new registrations explicitly store **2**. No participant, attempt, identity, score or completion data is deleted or rewritten by this additive migration.

- PostgreSQL: back up the database, then run `npm run prisma:deploy`. The new migration is `20261015010000_scenario_version`. Docker runs migrations on startup as before.
- Existing Turso after email removal: set `TURSO_DATABASE_URL` and optional `TURSO_AUTH_TOKEN`, then run `node scripts/apply-turso-scenario-version.mjs`. This checks the column and is safe to rerun. The added column defaults to 1 for old-table compatibility; the app explicitly writes 2 for each new registration.
- Fresh Turso: use `prisma/turso-init.sql`, whose version default is 2.
- Regenerate both Prisma clients, build and deploy frontend/backend together. Restart application processes after migration and reload old browser tabs.

The earlier email-removal migration was not rewritten. If it has not been applied to a populated deployment, its separate verified-backup requirement and permanent email/OTP data removal still apply. No production/remote database migration was performed during this task.

The local preview database was backed up under `/tmp/cyberlab-preview-D1FjhE/`, upgraded additively and kept in place. The preview was restarted at **http://localhost:3000**. Existing test sessions remain four-game sessions; select **Start another session**, or return to registration, to try all seven. The local admin password remains `local-preview-admin`.

## Verification

| Check | Result | Execution |
|---|---|---|
| Backend unit/security/scenario/migration tests | PASS | 59 tests through `npm test` |
| Frontend tests | PASS | 15 tests, including all three new games in English and Arabic, no text inputs, and refresh/continuation/results from each new game |
| Isolated database-backed API tests | PASS | 24 tests through `npm run test:db`, existing Turso adapter with a fresh temporary SQLite database |
| Full seven-scenario progression and scoring | PASS | New-session API flow, mixed score, all new games' 20/10/0 outcomes and evidence validation |
| Multi-user isolation | PASS | Eight parallel participants independently complete seven scenarios |
| Historical compatibility | PASS | Existing completed/unfinished four-game sessions retain 80-point maximum; migration preserves rows and safely runs twice |
| Registration and admin | PASS | Name/Telegram-only validation, session resume, protected admin access and seven-game/mixed-version statistics |
| Existing four definitions and identity form preservation | PASS | Fixture assertion plus byte comparison against pre-change source |
| Production build | PASS | `npm run build`: both Prisma clients, frontend and backend |
| Vercel frontend packaging | PASS | `npm run build -w frontend -- --outDir ../public --emptyOutDir` |
| Refreshed local preview | PASS | `/` and `/api/health` returned HTTP 200; database reachable |
| PostgreSQL migration/API runtime and Docker runtime | NOT EXECUTED | PostgreSQL/Docker unavailable in this environment |
| 300-user k6 test | NOT EXECUTED | Script updated to seven games / 140 maximum; no load test performed |
| Manual browser/device check | NOT EXECUTED | UI interactions verified using React Testing Library/jsdom |

**98 distinct automated tests passed.** The regular suite skips the 24 API tests by default; they were all executed separately with the isolated runner. Early failures from sandbox socket restrictions and a migration-test connection's cached pre-migration column list were resolved before the passing runs. The migration test reconnects after the external migration, matching the documented deployment restart.

## Files changed

Modified:

- Backend: `backend/src/app.ts`, `backend/src/progress.ts`, `backend/src/justification.ts`, `backend/src/scenarios/index.ts`, `backend/src/scenarios/types.ts`.
- Existing tests: `backend/src/integration.test.ts`, `backend/src/scenarios/scenarios.test.ts`.
- Frontend: `frontend/src/components/DecisionPanel.tsx`, `frontend/src/pages/Simulation.tsx`, `frontend/src/pages/MicrosoftComparisonScenario.tsx`, `frontend/src/pages/Landing.tsx`, `frontend/src/pages/Results.tsx`, `frontend/src/pages/Admin.tsx`, `frontend/src/types.ts`, `frontend/src/i18n.tsx`, `frontend/src/index.css`.
- Schema: `prisma/schema.prisma`, `prisma/turso.prisma`, `prisma/turso-init.sql`.
- Load test: `load-test/k6.js`.
- Documentation: `README.md`, `ARCHITECTURE.md`, `CODEX_BUILD_PROMPT.md`.

Added:

- `backend/src/scenarios/permissionDetective.ts`
- `backend/src/scenarios/ransomware.ts`
- `backend/src/scenarios/networkDefender.ts`
- `backend/src/scenarioVersion.test.ts`
- `backend/test-fixtures/retained-scenarios.json`
- `backend/test-fixtures/four-scenario-schema.sql`
- `frontend/src/pages/AwarenessMiniGame.tsx`
- `frontend/src/pages/AwarenessMiniGame.test.tsx`
- `prisma/migrations/20261015010000_scenario_version/migration.sql`
- `prisma/turso-scenario-version.sql`
- `scripts/apply-turso-scenario-version.mjs`
- `MINI_GAMES_REPORT.md`

Generated Prisma clients and build outputs were refreshed. Dependency files, deployment configuration, prior migrations, archived UI snapshots and the historical email-removal report are unchanged. Before production release, apply the documented migrations and verify PostgreSQL/Docker and event-scale performance on the deployment host.
