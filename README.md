# Cyber Awareness Lab

For the already-running department VPS, see [public HTTPS preparation for gameserver.ly](deploy/ubuntu/PUBLIC_HTTPS.md) and its [verification report](deploy/ubuntu/PUBLIC_HTTPS_VERIFICATION.md). The separate host Nginx vhost preserves the maintenance defaults and proxies to the existing private Docker port. Follow the GitHub/Termius review procedure; do not rerun installation or regenerate production secrets. Certificate/key files are excluded from Git and image builds.

A seven-step cybersecurity awareness simulation designed for a one-day event. React serves the participant and administrator interfaces, Express owns scoring and session logic, and PostgreSQL is the source of truth. Nginx is the only public production service.

## Department Ubuntu VPS preparation (2026-10-16)

For the department-owned Ubuntu VPS, follow [deploy/ubuntu/DEPLOYMENT.md](deploy/ubuntu/DEPLOYMENT.md) and review [local verification results](deploy/ubuntu/LOCAL_VERIFICATION.md). Use only the standalone VPS Compose stack through `bash deploy/ubuntu/cyberlab`; it publishes **127.0.0.1:8080 only**, keeps PostgreSQL private and persistent, and makes migrations an explicit maintenance step. The root Compose configuration below is not the department deployment configuration.

**Docker installation needs department approval first:** it creates services and modifies host networking/firewall state even with loopback-only application ports. This preparation does not authorize or perform installation, SSH/UFW/Fail2Ban changes, public access, or changes to `/srv/restic` or `/srv/resticbak`. New deployment credentials are generated separately from the developer `.env`.

## Wi-Fi Trap refinement (2026-10-16)

> Latest Wi-Fi refinement (2026-10-16): New registrations use **version 4**. Wi-Fi Trap now asks which unverified network deserves the most caution, with exactly three network cards, curved Wi-Fi icons, and `Campus_Guest_Free` as the intended choice. The other names are `Campus_WiFi` and `Campus_WiFi_5G`. Written English/Arabic explanations and server-side 20/10/0 scoring remain; no-password-only reasoning receives partial credit. Version 3 sessions retain the earlier four-action staff-verification question, translations, drafts and reasoning rules. Versions 1 and 2 remain unchanged. No migration is needed. See [WIFI_TRAP_REFINEMENT_REPORT.md](WIFI_TRAP_REFINEMENT_REPORT.md). Earlier release descriptions below are historical where they conflict.

The current question is **“Which network would you be most cautious about connecting to without verification?”** / **«أي شبكة ستكون أكثر حذراً من الاتصال بها دون التحقق منها؟»**. All three cards use the same neutral styling. `Campus_WiFi` and `Campus_WiFi_5G` require passwords; `Campus_Guest_Free` does not. The open guest network deserves the most caution in this fictional situation, but it is not guaranteed malicious. Verify official network details through a trusted source before connecting in real life; password protection and familiar names do not establish trust.

Restart the app and start a **new participant session** to see the refined question. Existing version 3 session codes intentionally keep their original question and answer. The first six games, order, 140-point maximum, Name/Telegram registration, results and admin behavior are unchanged. Deploy backend and frontend together; no schema or deployment configuration changes are required.

## Wi-Fi Trap release (2026-10-15)

New registrations use **scenario version 3**: the first six games are unchanged, and game 7 is **Wi-Fi Trap: Choose Your Network** (`wifi-trap`). The active order is `login-safety`, `phishing`, `social-engineering`, `url-safety`, `permission-detective`, `ransomware`, `wifi-trap`. Maximum score remains **140**, with the same 20/10/0 scoring and written-reasoning validation.

The final game presents simulated `Campus_WiFi`, `Campus_Free_WiFi`, and `Campus_WiFi_Official` networks plus a separate action to verify the official network information with conference staff. It does not scan, connect, or request wireless passwords. No network name, lock icon, or signal strength proves trust. Feedback also explains that open networks are not automatically malicious.

Existing **version 2** sessions keep their seven-game sequence ending in Network Defender; version 1 sessions keep four games and their 80-point maximum. Historical attempts, scores and completion dates are retained. Network Defender's definition, presentation, translations and evaluator remain only for those earlier sessions. Its backend/UI modules are now under `legacy/`. Active admin performance covers the current seven games; earlier Network Defender attempts remain visible in individual participant histories and included in historical session totals/averages.

**No database migration is required for this replacement.** The existing integer `scenarioVersion` already supports 3. Registration explicitly writes the current version, ignoring client-supplied version values. Schema defaults remain unchanged for compatibility with older inserts/clients. Do not bulk-update previous participant versions. Earlier email-removal/scenario-version migrations remain prerequisites for deployments that have not applied them.

Deploy backend/frontend together and reload existing browser tabs. Start a **new session** to try Wi-Fi Trap; resuming a version 2 session intentionally keeps Network Defender. English and Arabic are supported. The rule-based evaluator accepts tested alternative explanations about copied network names, identity verification, unreliable trust indicators or privacy risks; its documented deterministic-matching limitations still apply.

See [WIFI_TRAP_REPORT.md](WIFI_TRAP_REPORT.md) for changed files and executed checks. The earlier release notes below are historical where they refer to Network Defender as the current final game.

## Current conference game (2026-10-15)

New registrations receive **7 scenarios / 140 maximum points**: University portal, unexpected payroll attachment, social engineering, unexpected MFA approval, **Permission Detective**, **Ransomware: Save the Files**, and **Wi-Fi Trap: Choose Your Network**. The first four definitions, answers, feedback and order are unchanged. Registration still collects only Name and Telegram.

The three new games use an action or event selection followed by a short written explanation (up to 240 characters). English and Arabic are supported. Scoring remains 20 for the correct action with adequate reasoning, 10 for the correct action with inadequate reasoning, and 0 for an incorrect action. Completing Wi-Fi Trap opens results. Permission Detective now uses a fictional phone/app-permission interface; Wi-Fi Trap uses a fictional wireless-settings screen. Draft explanations are retained in session storage per session code and scenario, including across tab refresh, and cleared after feedback.

Existing sessions remain on the four-game version, including unfinished sessions, with their original maximum of 80. Saved codes still resume their own version. Start a new session to play all seven. Results and admin participant rows use each session's own maximum. The dashboard's average score is shown as the average of participant percentages, so completed four- and seven-game results are comparable; the API retains the raw `averageScore` and adds `averagePercentage`.

Before upgrading an existing database, take a backup and apply the additive scenario-version migration. It adds `ParticipantSession.scenarioVersion`: existing rows get version 1; new registrations explicitly use version 2. No participant rows, attempts, scores, identity fields or completion timestamps are rewritten.

- PostgreSQL: `npm run prisma:deploy` applies `20261015010000_scenario_version` after prior migrations. Docker applies migrations on app startup. If the earlier email-removal migration has not yet run, its backup requirement and data-removal impact below still apply.
- Existing Turso after email removal: load `TURSO_DATABASE_URL` and optional `TURSO_AUTH_TOKEN`, then run `node scripts/apply-turso-scenario-version.mjs`. The script is safe to rerun. Its existing-table column default stays 1 for compatibility; the app explicitly writes version 2. Fresh databases use the updated `prisma/turso-init.sql`, whose default is 2.
- Generate both clients with `npm run prisma:generate`, rebuild, and deploy frontend/backend together. Restart app processes after schema changes and reload old browser tabs.

The earlier four-game/email-removal notes below describe that previous release. See [WRITTEN_REASONING_REPORT.md](WRITTEN_REASONING_REPORT.md) for the current UI/evaluation changes and verification, and [MINI_GAMES_REPORT.md](MINI_GAMES_REPORT.md) for the preceding scenario-version migration.

## Written explanation evaluation

The three mini-games reuse the local deterministic concept-group matcher in `backend/src/justification.ts`. It normalizes English/Arabic text and accepts combinations of relevant concepts and paraphrases; it does not require one exact sentence. Repeating an action/event label alone does not earn full credit. Explicitly tested unrelated text and contradictions do not earn full credit. Correct choices with insufficient evidence receive 10 points.

This is not semantic understanding: unfamiliar phrasing, dialects, complicated negation, mixed claims and deliberate keyword stuffing can be misclassified. Rules can be extended from reviewed examples. Original games keep their previous evaluator behavior. No external grading service is used.

The backend rejects empty/non-string input, raw input over 240 characters, and explanations with fewer than three letters in these mini-games, normalizes whitespace, and stores the explanation as text. React renders stored text without HTML interpretation. There are no database changes or new migrations in this UI/reasoning update; previously documented migrations are still required for deployments that have not applied them.

## Architecture

```text
Phone / laptop -> Nginx :80/:443 -> Express + built React app -> PostgreSQL
```

- Participants enter their Name and Telegram username, then receive a cryptographically random session code. No email, OTP, or participant account is required.
- The backend returns scenario text and actions but keeps answer keys private.
- A database transaction records each decision. PostgreSQL also enforces one attempt per session and scenario.
- Admin authentication uses an environment password and an opaque, hashed, server-managed session stored in an HttpOnly cookie.
- The dashboard polls aggregate statistics every five seconds. There are no WebSockets, caches, or external identity providers.

## Prerequisites

- Node.js 22 and npm 10+
- Docker Engine with the Docker Compose plugin (needed for PostgreSQL and production)
- Optional: [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) for load testing

## Environment configuration

Copy the example before starting:

```powershell
Copy-Item .env.example .env
```

Generate strong values and replace every `change-me`/`replace-with` value. The required variables are:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma PostgreSQL connection URL |
| `POSTGRES_DB` | Database created by the container |
| `POSTGRES_USER` | PostgreSQL user |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `ADMIN_PASSWORD` | Server-only dashboard password |
| `SESSION_SECRET` | At least 32 random characters; hashes admin tokens |
| `PUBLIC_BASE_URL` | Exact public origin, such as `https://lab.example.org` |
| `NODE_ENV` | `production` in Docker; `development` locally |
| `PORT` | Express port, normally `3000` |

For local Node development, change the host in `DATABASE_URL` from `postgres` to `localhost` and set `PUBLIC_BASE_URL=http://localhost:5173`. For Docker production, use `postgres` as the database hostname because that is the Compose service name.

Never commit `.env`.

## Local development

Install dependencies:

```powershell
npm ci
```

Start PostgreSQL on loopback only (the development override is intentionally not used in production):

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

Load `.env` into the current PowerShell session, generate Prisma Client, and apply migrations:

```powershell
Get-Content .env | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object { $name, $value = $_ -split '=', 2; Set-Item -Path "Env:$name" -Value $value }
npm run prisma:generate
npm run prisma:deploy
```

Start the API and Vite development server:

```powershell
npm run dev
```

Open `http://localhost:5173/`. Vite proxies relative `/api` requests to Express on port 3000.

Useful development URLs:

- Participant: `http://localhost:5173/`
- Join: `http://localhost:5173/join`
- Admin: `http://localhost:5173/admin`
- Health: `http://localhost:5173/api/health`

There is no seed step: scenario definitions are typed backend source files and the database starts with no participant activity.

## Test from another device on the same Wi-Fi

Both development servers listen on `0.0.0.0`. Allow Node/Vite through the host firewall on private networks, then find the development PC's IPv4 address:

```powershell
ipconfig
```

Look for the active Wi-Fi adapter's `IPv4 Address`, for example `192.168.1.50`. On a phone or laptop connected to the same LAN, open:

```text
http://192.168.1.50:5173/join
```

If it does not load, confirm both devices are on the same non-isolated Wi-Fi and check the Windows firewall. A private `192.168.x.x`, `10.x.x.x`, or `172.16-31.x.x` address is not reachable from a different network. Use the public VPS deployment below for participants on mobile data or separate Wi-Fi networks.

## Automated tests and build

Run source-level tests:

```powershell
npm test
```

Run database-backed API tests in a fresh temporary SQLite database using the existing Turso adapter:

```powershell
npm run test:db
```

This runner sets its own isolated database URL and never opens the configured event database. The regular backend suite also tests the Turso migration against a temporary legacy database. To run API tests against PostgreSQL, provision a disposable migrated database, set `DATABASE_URL` to it, unset `TURSO_DATABASE_URL`, and set both `RUN_DB_TESTS=1` and `TEST_DATABASE_ISOLATED=1`. Never use event data as a test fixture.


Build both applications:

```powershell
npm run build
```

## Production with Docker Compose

Set the Docker form of `DATABASE_URL` in `.env`, for example:

```text
DATABASE_URL=postgresql://cyberlab:STRONG_PASSWORD@postgres:5432/cyberlab?schema=public&connection_limit=20&pool_timeout=10
```

Then build and start the stack:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f app nginx postgres
```

The app container applies committed migrations before starting. Only Nginx publishes a host port; PostgreSQL stays on the internal Compose network.

Production URLs on the server are:

- Participant: `http://SERVER/`
- Join: `http://SERVER/join`
- Admin: `http://SERVER/admin`
- Health: `http://SERVER/api/health`

## Ubuntu 24.04 VPS deployment

The department VPS uses the dedicated [deployment guide](deploy/ubuntu/DEPLOYMENT.md), with private SSH-tunnel access and PostgreSQL in an application-owned named volume. Do not run the generic public-port Compose stack or its reset instructions on that VPS. Installation and Docker-managed host networking require department approval; public DNS, HTTPS, inbound ports 80/443 and certificate management are later approval items. Existing host security services and backup infrastructure stay under department control.

## Backups and event-data reset

Create a compressed PostgreSQL backup:

```powershell
docker compose exec -T postgres pg_dump -U cyberlab -d cyberlab -Fc > cyberlab-backup.dump
```

Use the actual values of `POSTGRES_USER` and `POSTGRES_DB` if they differ. Keep the backup outside the repository and test restoration before event day.

Reset all participant and admin-session data while preserving the schema:

```powershell
docker compose exec -T postgres psql -U cyberlab -d cyberlab -c 'TRUNCATE TABLE "ScenarioAttempt", "ParticipantSession", "AdminSession" RESTART IDENTITY CASCADE;'
```

This is destructive. Take a backup first and verify the target database/container.

## Load test

Run only against a test deployment that you control:

```powershell
k6 run -e BASE_URL=http://localhost load-test/k6.js
```

The script runs 300 virtual users, completes realistic seven-scenario flows, and requires an HTTP failure rate below 1% and p95 response time below 500 ms. Results depend on the VPS, database, network, and whether TLS terminates on the same host.

## Troubleshooting

- `database: unreachable`: verify `DATABASE_URL`, `docker compose ps`, and PostgreSQL logs.
- Browser works locally but not on a phone: use the LAN IPv4 address, confirm Wi-Fi client isolation is disabled, and allow the Vite port through the private-network firewall.
- Admin login loops in production: confirm HTTPS is active, `PUBLIC_BASE_URL` exactly matches the browser origin, and system clocks are correct.
- Migration fails in Docker: inspect `docker compose logs app postgres`; verify the database credentials agree with `POSTGRES_*`.
- A participant refreshes mid-session: the anonymous code in local storage resumes progress. `Restart` intentionally creates a new session.

## Event Day Checklist

- [ ] VPS, DNS, and HTTPS are healthy.
- [ ] `docker compose ps` shows PostgreSQL and the app healthy.
- [ ] `/api/health` reports `database: reachable`.
- [ ] Participant `/` and `/join` open on a phone.
- [ ] `/admin` accepts the configured password.
- [ ] A full seven-scenario run reaches results and updates statistics.
- [ ] Test from another device and, for a public event, another network.
- [ ] Confirm the browser sends no typed dummy password in DevTools Network.
- [ ] Check CPU, RAM, disk space, and container logs.
- [ ] Keep a recent PostgreSQL backup.
- [ ] Keep `.env` and the administrator password private.

## Known MVP limitations

- Scenarios are intentionally fixed placeholder content.
- Anonymous session codes are bearer-style identifiers; there are no participant accounts.
- Admin sessions are stored in PostgreSQL and expire after eight hours; expired rows are not automatically purged yet.
- The included Nginx file is HTTP-only until certificates are configured for the deployment domain.
- Capacity depends on the deployment environment; the 300-user target must be verified on the actual event-like host with k6.

## Conference flow and email removal (2026-10-15)

Registration collects the existing Name and Telegram username with unchanged normalization and validation. It immediately creates a session. The code in `localStorage.cyberlab_session` resumes the same participant after refresh; submitting registration again creates a separate session, including when two people enter the same identity. Email-based session lookup is removed. Inactive participants are no longer automatically deleted.

The active scenario order is `login-safety`, `phishing`, `social-engineering`, `url-safety`. Only **The Real Inbox Challenge** (`inbox-challenge`, the real email with two links) is removed. The other scenarios retain their content, actions, feedback, and scoring: 20 points for a correct choice with accepted evidence, 10 for a correct choice with weak evidence, and 0 for an incorrect choice. Social engineering still needs no written justification. Maximum score is **80**; completion occurs after four retained attempts. The results message keeps its 75% threshold relative to the maximum.

Historical attempts remain stored, including inbox-challenge attempts. Current participant results and admin statistics count only retained scenarios. Existing participants awaiting the former fifth scenario can view their results immediately. API responses also derive current totals and completion from attempts, so old cached scores/flags do not affect progress. Admin authentication is unchanged.

Email verification, resend, training-email delivery, tracked-link endpoints, and the phishing-result screen are removed. Email provider variables (`RESEND_API_KEY`, `TRAINING_EMAIL_FROM`, `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, `TRAINING_PHISHING_BASE_URL`) can be removed from deployment configuration. Archived UI snapshots and historical migrations remain archival material, not active application code.

### Required backup and migration before deployment

**Stop participant writes and create and verify a restorable database backup before applying this migration to a populated environment.** The migration permanently deletes participant email addresses, email consent/delivery/click timestamps, training token hashes, and all `EmailVerification` rows. A rollback cannot restore these fields without the backup. Name and Telegram storage, participant records, all attempt rows and their original scores are retained. Cached session totals/completion are recalculated for the four retained scenarios.

For PostgreSQL, use the backup command above, then apply `prisma/migrations/20261015000000_remove_participant_email_and_inbox/migration.sql` using:

```powershell
npm run prisma:deploy
```

Docker runs `prisma migrate deploy` on startup, so complete and verify the backup **before** starting the updated app image. Do not reset the database or rewrite previous migrations. Deploy backend and frontend together after the migration; old browser tabs should reload to use the new flow. Old clients still calling removed email endpoints will receive 404.

For an existing Turso database that already has the Telegram/email schema, export and verify a restorable backup, then run:

```powershell
node scripts/apply-turso-remove-email-migration.mjs --backup-confirmed
```

The script uses `TURSO_DATABASE_URL` and optional `TURSO_AUTH_TOKEN` from the process environment. It refuses to run without the backup acknowledgement and applies the SQL in a single transaction. Run it once. It replaces the old verification-schema script and runtime schema creation. New Turso databases use `prisma/turso-init.sql`; do not apply the removal migration to a database initialized with that new schema.

Regenerate both Prisma clients (`npm run prisma:generate`) and build before release. No populated database migration is applied by the test or build commands.
