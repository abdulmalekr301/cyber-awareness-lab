# Email removal implementation report

Implemented locally on 2026-10-15. No deployment or populated database migration was performed.

Participants now register with the existing **Name and Telegram username** and immediately enter the game. Both form fields (markup, required attributes, limits and Telegram pattern), frontend name validation, backend normalization/validation, and their database column definitions are unchanged. Administrator authentication is unchanged.

Removed the email field, consent checkbox, OTP generation/hashing/delivery/verification/expiry/resend, domain validation, email-based session lookup, runtime verification-schema creation, training-email service/templates, tracked-link routes, their result screen, provider configuration and Nodemailer dependencies. Removed inactive participant deletion to retain existing participants. Stored session codes still resume progress after refresh. Registering again creates an independent session.

Removed only **The Real Inbox Challenge** (`inbox-challenge`), formerly scenario 5, which sent two links to the participant's real inbox. The remaining **4 scenarios**, in their unchanged order, are `login-safety`, `phishing`, `social-engineering`, `url-safety` (**Unexpected MFA Approval**, the new final scenario). Their definitions/content, answers and feedback are unchanged byte for byte.

Scoring remains **20 / 10 / 0** per retained scenario, with social engineering still requiring no written justification. The new maximum is **80**. Completion and progress count only retained attempts; finishing scenario 4 opens results. The results message retains its 75% threshold relative to the maximum. Admin totals, completion, average score, per-scenario performance and incorrect decisions exclude removed attempts. Historical attempts remain in storage and stale cached totals/completion flags cannot distort the current game.

## Database changes and required action

Both Prisma schemas remove `email`, `emailConsentAt`, `phishingTokenHash`, `phishingEmailSentAt`, `phishingLinkClickedAt`, `safeLinkClickedAt` and the `EmailVerification` model. New migrations remove their database storage/indexes and recalculate cached totals/completion. They retain participant rows, Name/Telegram values, all attempt rows and original per-attempt scores. Historical migrations are unchanged.

**Before applying to a populated environment: stop writes, create a backup, and verify that it can be restored. Email addresses, OTP challenges and associated consent/delivery/click/token data are permanently removed.**

- PostgreSQL: after verifying the backup, run `npm run prisma:deploy`. Docker does this automatically on startup, so verify the backup before starting the updated image.
- Existing Turso with the previous email/Telegram schema: after verifying the backup, run `node scripts/apply-turso-remove-email-migration.mjs --backup-confirmed` once. The script requires this acknowledgement and runs transactionally.
- Fresh Turso databases: initialize using the updated `prisma/turso-init.sql`; do not run the removal migration afterward.

Regenerate both Prisma clients and deploy backend/frontend together. Full instructions are in [README.md](README.md#required-backup-and-migration-before-deployment).

## Verification results

| Check | Result | Evidence / limits |
|---|---|---|
| Backend unit/scenario/security/migration suite | PASS | 56 tests executed via `npm test` |
| Frontend registration, refresh, final transition, results and password safety | PASS | 6 tests; registration checked in English and Arabic |
| Database-backed API suite | PASS | 20 tests via `npm run test:db`, fresh temporary SQLite database with the existing Turso adapter |
| Registration and retained identity validation | PASS | Name/Telegram only, normalization, invalid values and Unicode names tested |
| Four-scenario order, mixed scores, half credit and completion | PASS | API and final frontend transition checked |
| Multi-user isolation | PASS | Eight parallel participants independently completed all four scenarios |
| Historical records and removed attempts | PASS | Legacy migration fixtures retain all identity/attempt rows; API ignores historical removed attempts and stale caches |
| Administrator authentication/statistics | PASS | Protected access, login and current aggregates tested |
| Production application build | PASS | `npm run build`: both Prisma clients, frontend and backend |
| Vercel frontend packaging | PASS | `npm run build -w frontend -- --outDir ../public --emptyOutDir` |
| Active source/bundle inspection | PASS | No registration OTP screens, removed scenario routes or delivery/tracking calls remain |
| Preservation inspection | PASS | Name/Telegram form lines, four scenario definitions, historical migrations and dependency versions checked against the pre-change copy |
| PostgreSQL migration/API execution and Docker runtime | NOT EXECUTED | PostgreSQL and Docker are not installed in this environment |
| 300-user k6 load test | NOT EXECUTED | Load script updated; no load test performed |
| Manual browser/device testing | NOT EXECUTED | Frontend checks used React Testing Library/jsdom |

The regular suite intentionally skips the 20 database API tests; all 20 were executed separately by the isolated runner. Earlier tool-installation and outdated test-selector failures were resolved before these final passing runs. No new dependencies or dependency version upgrades were introduced.

## Compatibility

Saved session codes remain valid. Email-based participant recovery is removed; a new registration creates a new session. Participants with all four retained attempts can immediately retrieve results even if the old fifth scenario was unfinished. Reload existing browser tabs after deployment: old clients calling email endpoints receive 404. Archived UI snapshots are unchanged and are not imported by the active app. PostgreSQL/Docker execution remains an environment verification gap, not a claimed pass.

## Files changed

| Area | Modified files |
|---|---|
| Backend | `backend/src/app.ts`, `backend/src/config.ts`, `backend/src/justification.ts`, `backend/src/scenarios/index.ts`, `backend/package.json` |
| Frontend | `frontend/src/pages/Landing.tsx`, `Simulation.tsx`, `Results.tsx`, `Admin.tsx`, `MicrosoftComparisonScenario.tsx`; `frontend/src/main.tsx`, `i18n.tsx`, `types.ts`, `index.css` |
| Schema | `prisma/schema.prisma`, `prisma/turso.prisma`, `prisma/turso-init.sql` |
| Existing tests | `backend/src/integration.test.ts`, `backend/src/justification.test.ts`, `backend/src/scenarios/scenarios.test.ts`, `frontend/src/pages/LoginSafetyDemo.test.tsx` |
| Configuration / load test | `.env.example`, `docker-compose.yml`, `package.json`, `package-lock.json`, `load-test/k6.js` |
| Documentation | `README.md`, `ARCHITECTURE.md`, `CODEX_BUILD_PROMPT.md` (historical specifications marked with the current contract) |

Added:

- `backend/src/progress.ts`
- `backend/src/migration.test.ts`
- `backend/test-fixtures/legacy-email-schema.sql` (test-only legacy fixture)
- `frontend/src/pages/RegistrationFlow.test.tsx`
- `prisma/migrations/20261015000000_remove_participant_email_and_inbox/migration.sql`
- `prisma/turso-remove-email.sql`
- `scripts/apply-turso-remove-email-migration.mjs`
- `scripts/test-isolated-db.mjs`
- `EMAIL_REMOVAL_REPORT.md` (this report)

Deleted obsolete code:

- `backend/src/trainingEmail.ts`
- `backend/src/ensureVerificationSchema.ts`
- `backend/src/scenarios/inboxChallenge.ts`
- `frontend/src/pages/InboxChallengeScenario.tsx`
- `frontend/src/pages/PhishingResult.tsx`
- `scripts/apply-turso-verification-migration.mjs`

Generated Prisma clients and local build outputs were refreshed; stale emitted backend files for deleted modules were removed. Historical migrations and archived UI snapshots were not modified.
