# VPS preparation verification — 2026-10-16

Preparation is complete for review. **No connection to the VPS, installation, deployment, firewall change, DNS change or production migration occurred.** Existing participant databases were not reset or opened by the new tests. Docker Engine installation and its service/network effects still require department approval.

## Recommended plan

Use the standalone stack in `deploy/ubuntu/compose.yaml`, operated from `/opt/cyber-awareness-lab` through the `cyberlab` wrapper. Fresh PostgreSQL 16 uses a persistent application-owned named volume; it is not publicly published. Nginx publishes **only `127.0.0.1:8080`**. Access initially uses the existing SSH service/tunnel. The app runs its compiled production server and built React frontend; migrations run only as explicit maintenance.

This is a new PostgreSQL deployment, not an automatic transfer of any existing Turso/SQLite or remote PostgreSQL records. See [DEPLOYMENT.md](DEPLOYMENT.md) for the migration/approval boundaries, exact later installation and deployment commands, recovery procedures and public-access planning.

## Results actually executed

| Check | Result / scope |
|---|---|
| `npm run build` | **PASS** — both Prisma clients, frontend bundle and compiled backend |
| Existing backend suite | **PASS — 137 tests** |
| Existing frontend suite | **PASS — 29 tests**, including EN/AR and written reasoning |
| `npm run test:db` | **PASS — 42 API tests** against a new isolated libSQL/SQLite database |
| `deploy/ubuntu/test-preparation.py` | **PASS — 10 checks**, including public-port, database exposure, privilege, host-network and sensitive-directory-mount rejection |
| Actual Docker Compose configuration resolution | **PASS** — official standalone Compose **v5.6.0**, SHA-256 checked against its official release checksum; no Docker daemon required |
| Resolved-model validator | **PASS** — only loopback 8080 published; private persistent Postgres; correct image/maintenance commands and production configuration |
| Dedicated secrets | **PASS** — mode 0600, independent generated secrets, overwrite refusal, shell/Compose/remote-context overrides ignored |
| Bash helpers | **PASS** — `bash -n` |
| PostgreSQL and Turso Prisma schema validation | **PASS** — `prisma validate` using dummy/local URLs, without connecting to either database |
| Compiled production startup | **PASS** — staged compiled server, built frontend HTML/JS and an isolated temporary libSQL database |
| Seven-game progression | **PASS** — correct sequence, current Wi-Fi three-choice contract, removed staff action rejected, final 140/140 |
| Admin authentication and process restart | **PASS** — unauthenticated/bad-password rejection, authenticated stats, participant results and admin session retained across server restart |
| Source-transfer archive | **PASS** — inspected tar members exclude environment files, local databases, backups, dependency/generated directories and old deployment uploads; frontend public assets and migration lock retained |
| Existing game/application source preservation | **PASS** — snapshot comparison of all existing backend/frontend files, schemas, SQL migrations and helper/proxy files; package dependencies and root Compose files unchanged |
| Docker image build and actual container startup | **NOT EXECUTED** — no local Docker daemon or container runtime |
| Nginx runtime/config test in its container | **NOT EXECUTED** — no local Nginx/container runtime |
| PostgreSQL migration/runtime checks | **NOT EXECUTED** — no local PostgreSQL service/container runtime |
| PostgreSQL backup/restore drill and full Docker-stack restart | **NOT EXECUTED** — instructions prepared, require approved Docker host |
| VPS OS/network/UFW/Fail2Ban interaction | **NOT EXECUTED** — VPS deliberately not contacted |
| Event-scale load, physical phones, public DNS/HTTPS | **NOT EXECUTED** — later approval/testing |

**218 automated test cases passed** (137 + 29 + 42 + 10), plus the production-startup smoke check and schema/build/archive checks. API tests skipped by the default test command were executed separately by the isolated runner.

The compiled startup check copies the generated Turso client into its staged runtime exactly as the Dockerfile does; `tsc` alone does not copy those files. It runs under the local Node 20 environment using the existing adapter; it is **not** evidence for Node 22 Alpine container startup or PostgreSQL behavior. No Vite server is required for the production smoke check. The temporary staged app/database are removed afterward.

Compose was downloaded only into `/tmp`, not installed on the VPS or as a host daemon. The first download approval timed out; a retry succeeded. An initial source archive included a nested workspace dependency directory; the exclusion was corrected to cover every `node_modules`, then rebuilt and verified. Neither preliminary attempt is counted as a passing check.

## Reproduce local checks

From the project root, with Node/npm dependencies already available:

```bash
npm test
npm run test:db
npm run build
node deploy/ubuntu/test-production.mjs
bash -n deploy/ubuntu/cyberlab deploy/ubuntu/backup.sh
```

With an approved local Docker/Compose installation, use a temporary env file rather than production credentials for configuration checks:

```bash
temporary_dir=$(mktemp -d)
python3 deploy/ubuntu/create-env.py "$temporary_dir/production.env"
CYBERLAB_ENV_FILE="$temporary_dir/production.env" python3 deploy/ubuntu/validate.py
python3 deploy/ubuntu/test-preparation.py
# Remove only this temporary file/directory when finished.
```

Here, actual Compose parsing used a local `/tmp` Docker-CLI adapter that forwarded the wrapper's `docker --context default compose` command to the checksum-verified standalone binary. It made no daemon requests and retained the same resolved project paths/interpolation. YAML-only parsing was an additional check, not a substitute claimed as Docker Compose validation.

## Deployment-specific changes

- **`Dockerfile`**: install OpenSSL in both Alpine stages for Prisma; use build-only placeholder datasource URLs; run the runtime as `node`. Existing generated-client packaging is retained. The new Compose stack overrides the older default auto-migration command with a plain server command.
- **`.dockerignore`**: exclude secrets, local databases/dumps, backups, generated clients, nested dependencies, old uploads and local tooling/snapshots from build context.
- **`.gitignore`**: protect the VPS environment, app backups and Python bytecode.
- **`prisma/migrations/migration_lock.toml`**: identify the existing migration provider as PostgreSQL; no migration SQL changed.
- **`deploy/ubuntu/compose.yaml`**: standalone private stack, durable volume, service health checks, explicit maintenance job, bounded logs/resources and container isolation.
- **`deploy/ubuntu/nginx.conf`**: non-root port-8080 proxy, temporary paths and consistent trusted forwarding headers.
- **`deploy/ubuntu/cyberlab`**: fixed local context/project/config and dedicated environment selection.
- **`deploy/ubuntu/create-env.py`**: private, non-overwriting secret generation.
- **`deploy/ubuntu/validate.py`**: inspect the real resolved Compose model without printing credentials.
- **`deploy/ubuntu/backup.sh`**: manual consistent PostgreSQL archive, format check and atomic final file creation.
- **`deploy/ubuntu/test-preparation.py`** and **`test-production.mjs`**: deployment guard tests and temporary-database compiled startup verification.
- **`deploy/ubuntu/DEPLOYMENT.md`**, **this file**, and **`README.md`**: approved-scope instructions, exact later commands and review findings.

## Remaining limitations and required review

1. **Approval prerequisite:** ordinary Docker networking changes host state even with loopback publishing. The department's current prohibition cannot be bypassed by this application configuration. Do not install/start it until that issue is resolved.
2. **Runtime remains unproven:** execute container build/start, PostgreSQL migrations, Nginx checks, restart persistence and an actual restore drill on an approved disposable Docker environment before handling event data. The read-only/non-root runtime restrictions must be confirmed there as well.
3. **Image supply and compatibility:** base images use maintained major/stable tags. Record/pin the tested platform-specific digests before deployment and retain old images/source/env for rollback. No image vulnerability scan or image pull/build was possible here.
4. **No data transfer performed:** existing records require their own verified migration plan before selecting the new PostgreSQL deployment. Historic email-removal migrations have irreversible effects without a backup.
5. **Private testing only:** public access, certificate renewal, trusted TLS forwarding and provider/host firewall approval remain separate work. Existing SSH policy may prohibit forwarding; do not alter it without department authorization.
6. **Operations/capacity:** backup schedule, off-host retention, restore readiness and event-scale resource limits need department review and testing. No existing restic infrastructure is modified or reused automatically.
