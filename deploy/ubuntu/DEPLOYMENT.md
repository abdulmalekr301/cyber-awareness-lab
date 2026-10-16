# Department Ubuntu VPS deployment guide

Prepared for Ubuntu 24.04.5 LTS, 4 vCPUs, 5.8 GiB RAM and 96 GB storage. This is a **local preparation deliverable**, not permission to deploy. No VPS connection or installation was performed. Commands below are for a later approved deployment.

## Approval boundary — resolve before installation

The department currently permits application installation but prohibits changes to existing system configuration. **Ordinary Docker installation does not fit that restriction without an explicit exception:** it installs/starts Docker and containerd services, creates bridge interfaces and routes, and can alter IP forwarding and firewall rules. Loopback port binding limits application exposure; it does not prevent Docker from making those host changes. Docker-published traffic can bypass UFW. See Docker's [Ubuntu installation instructions](https://docs.docker.com/engine/install/ubuntu/) and [firewall behavior](https://docs.docker.com/engine/network/packet-filtering-firewalls/).

Obtain department approval for the Docker Engine/Compose installation and its networking/service effects first. If that approval is unavailable, stop; ask the department to provide an approved runtime or separately review a rootless deployment. Rootless Docker also has prerequisites and user-service/identity implications and is not an automatic exception.

| Action | Scope / approval |
|---|---|
| Source, app configuration and manual backups under `/opt/cyber-awareness-lab` | Application-specific; use the department's authorized account and directory ownership |
| Docker/containerd, Compose/Buildx and any missing OS packages | **Department approval required**; package changes and new system services |
| Docker bridge/network creation, forwarding and Docker-managed firewall rules | **Department approval required**, including coexistence with UFW and Fail2Ban |
| Adding a Docker group member, enabling linger, timers or other services | **Separate approval required**; not needed by this guide |
| Changing SSH, UFW, Fail2Ban, host Nginx, daemon settings, sysctls or existing services | **Prohibited by current authorization**; not part of these commands |
| Public DNS, HTTPS, public reverse proxy, inbound 80/443 or provider firewall | **Later approval required**; not part of initial private testing |
| `/srv/restic`, `/srv/resticbak` or existing backup jobs | **Out of scope; do not touch** |

Keep SSH on its existing port 22. No UFW changes, Docker daemon overrides, host networking, Docker socket mounts, privileged containers or mounts of sensitive VPS directories are requested. Do not disable security services or set Docker's `iptables=false` to bypass the approval issue.

## Actual application and database choice

- `npm ci` followed by `npm run build` generates both Prisma clients, compiles TypeScript and builds the React frontend into `frontend/dist/`.
- Express starts with `node backend/dist/server.js` and serves the built frontend plus `/api`. The frontend calls relative `/api/...` URLs, so one origin serves everything. The Vite development server and Vercel `public/` output are not used on this VPS.
- `/api/health` checks a database `SELECT 1`; it does **not** prove migrations, registration or all scenarios work. Perform the functional checks below as well.
- Name/Telegram registration, version-4 seven-game sequence, written reasoning and maximum 140 remain unchanged. Versions 1–3 retain their historical contracts.
- Participant records and attempts are persisted in the database; session codes are also saved in browser local storage. Administrator authentication uses the configured `ADMIN_PASSWORD`, an eight-hour HTTP-only SameSite cookie and database token hashes derived with `SESSION_SECRET`. Keep that secret stable across restarts. There is no separately provisioned administrator account.

**Recommend fresh, application-owned PostgreSQL 16**, retaining the existing PostgreSQL architecture, Prisma schema and six committed migrations. A named Docker volume holds the data. No database port is published; only the app and maintenance job join the database network. The explicit maintenance job runs PostgreSQL migrations; restarting the app does not migrate or erase data.

The backend also supports remote Turso and local libSQL/SQLite through `TURSO_DATABASE_URL`, which takes precedence over PostgreSQL if present. This VPS stack explicitly empties the Turso variables and constructs `DATABASE_URL` from its own PostgreSQL credentials. The separate `prisma/turso.prisma`, `turso-init.sql` and Turso upgrade scripts remain available and unchanged. Do not run PostgreSQL migrations against Turso or use SQLite SQL/exports with `pg_restore`.

This plan starts a **new empty PostgreSQL database**; it does not migrate or replace any existing local or remote database. If an existing Turso/PostgreSQL deployment contains participant data that must carry over, stop before cutover, take a verified backup and approve/test the transfer separately. Preserve IDs, session codes, `scenarioVersion`, attempts, raw scores, timestamps and relationships. Switching a connection URL does not transfer data. For existing PostgreSQL, review pending migrations first: the historic email-removal migration permanently removes email/OTP columns and data, and requires a restorable pre-migration backup. No existing migration SQL was rewritten.

## Files and isolation

Use **only** `deploy/ubuntu/compose.yaml` for this VPS, through the `cyberlab` wrapper. It is a standalone stack, not an override. The root `docker-compose.yml` is the older public-port configuration and must not be combined with it.

The wrapper fixes the project directory and default local Docker context; it ignores ambient Compose selectors and remote Docker host/context variables. It uses the dedicated `.env.production`, not the developer's `.env`. The stack consists of:

| Service | Exposure / storage |
|---|---|
| `nginx` | Non-root; **only `127.0.0.1:8080`** on the host; read-only app-owned config mount |
| `app` | Non-root image user; port 3000 inside Docker only; read-only filesystem with temporary `/tmp` |
| `postgres` | No published port; internal database network; `cyber-awareness-lab_postgres_data` named volume |
| `migrate` | Explicit `maintenance` profile; same app image; exits after migrations |

App/proxy/maintenance drop capabilities and prevent privilege escalation. The PostgreSQL official entrypoint keeps its normal initialization privileges inside the container and switches to the database user; the container is not privileged. Logs rotate at 3 × 10 MB per service. Runtime memory limits total about 2.7 GiB (plus a transient 512 MiB migration job), leaving host/build headroom; these are initial limits, not capacity measurements. Builds and old images/backups also consume storage. No image cleanup or host tuning runs automatically.

The named volume and image layers live in Docker-managed storage (normally beneath `/var/lib/docker`, and containerd may use `/var/lib/containerd`), rather than in the source directory. Those new runtime storage locations are part of the Docker installation approval; they do not use the department's existing restic directories.

## Dependencies and inventory (later, on the VPS)

Require a department-approved **currently patched Docker Engine, at least major 28**, with Compose plugin supporting `--wait` (2.20+), Buildx/BuildKit, plus Bash, Python 3, curl, tar and OpenSSH client tools. Earlier Docker versions have known localhost publishing limitations; see [Docker's port-publishing documentation](https://docs.docker.com/engine/network/port-publishing/). Use current patched versions, not an old 28.0.0 build. Pin/record the tested image digests before the actual event. The prepared PostgreSQL image stays on major 16; upgrading a database major requires its own plan.

Inventory without editing configuration:

```bash
cat /etc/os-release
uname -m
df -h / /opt
free -h
sudo ss -lntp
sudo ufw status verbose
sudo systemctl is-active fail2ban
ip route
docker --version
docker compose version
```

Confirm host port 8080 and the Compose project/volume names are unused. Have the department review Docker's chosen network ranges against existing routes and confirm its firewall/network integration is permitted. A conflict or a blocked health check is a reason to stop and investigate with the department, not to disable UFW/Fail2Ban or change host routes.

### Docker installation — approved administrator only

Do not execute this block until the department has approved the system/network effects above. First inventory existing `containerd`, `runc`, Docker/Podman packages; do not automatically uninstall them or disturb an existing service. Review the proposed apt transaction and stop for unapproved removals. These commands add an apt source/key and install packages whose services can start automatically:

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
docker_arch=$(dpkg --print-architecture)
printf 'Types: deb\nURIs: https://download.docker.com/linux/ubuntu\nSuites: noble\nComponents: stable\nArchitectures: %s\nSigned-By: /etc/apt/keyrings/docker.asc\n' "$docker_arch" | sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo docker --context default version
sudo docker --context default compose version
```

Do not add yourself to the root-equivalent Docker group as a convenience; the later commands use the existing authorized sudo access. This guide does not enable or reconfigure system services separately.

## Transfer the source (later)

On the development computer, from the project root, package source without developer secrets, participant databases, backups or generated output:

```bash
tar --exclude='node_modules' --exclude='./.git' --exclude='.env*' \
  --exclude='./backend/dist' --exclude='./backend/src/generated' \
  --exclude='./frontend/dist' --exclude='./public' --exclude='./backups' \
  --exclude='./.tmp*' --exclude='*.db' --exclude='*.db-*' --exclude='*.dump' \
  --exclude='./.vercel*' --exclude='./.phishing*' --exclude='./.sites-runtime' \
  --exclude='./.aws' --exclude='./.codex' --exclude='./.agents' \
  --exclude='./ui-snapshots' --exclude='./live-user-page*.png' --exclude='__pycache__' \
  -czf /tmp/cyber-awareness-lab-src.tgz .
sha256sum /tmp/cyber-awareness-lab-src.tgz
scp /tmp/cyber-awareness-lab-src.tgz department_user@VPS_ADDRESS:~/cyber-awareness-lab-src.tgz
```

On the VPS, using the authorized application owner (replace the example login/address before connecting):

```bash
sudo install -d -m 0750 -o "$USER" -g "$(id -gn)" /opt/cyber-awareness-lab
sha256sum ~/cyber-awareness-lab-src.tgz
# Compare with the development computer's checksum before extraction.
tar -xzf ~/cyber-awareness-lab-src.tgz -C /opt/cyber-awareness-lab
cd /opt/cyber-awareness-lab
```

For an upgrade, retain the previous source archive, image and environment file first. Never extract a developer `.env` or overwrite VPS secrets. Nothing is installed beneath either restic directory.

## Configure and start privately (later)

Generate unique production credentials directly in the application directory. The generator refuses to overwrite an existing file and sets mode 0600. It does not read the developer `.env` or print secrets:

```bash
cd /opt/cyber-awareness-lab
python3 deploy/ubuntu/create-env.py
chmod 600 deploy/ubuntu/.env.production
```

The generated values are `POSTGRES_DB=cyberlab`, `POSTGRES_USER=cyberlab`, independent 64-hex-character PostgreSQL/admin/session secrets, a timestamped `CYBERLAB_RELEASE` image tag, and `PUBLIC_BASE_URL=http://localhost:8080`. Hex credentials are URL-safe; `DATABASE_URL`, `NODE_ENV=production` and `PORT=3000` are supplied by Compose. Keep the generated Postgres password format unless you also review URL escaping and validation. Do not change Postgres credentials after initializing the volume without a database password-rotation procedure; changing an environment file alone does not rotate an existing database role.

Read `ADMIN_PASSWORD` privately from the generated file for login. Do not put the file or a full `docker compose config` output in version control, screenshots or shared logs. The environment file and database backups need separate secure off-host copies.

```bash
sudo bash deploy/ubuntu/cyberlab config --quiet
sudo python3 deploy/ubuntu/validate.py
sudo bash deploy/ubuntu/cyberlab pull postgres nginx
sudo bash deploy/ubuntu/cyberlab build --pull app
# Check the non-root runtime identity and container-packaged generated client:
sudo bash deploy/ubuntu/cyberlab run --rm --no-deps app id
sudo bash deploy/ubuntu/cyberlab run --rm --no-deps app sh -c 'test -r backend/dist/generated/turso/index.js'
sudo bash deploy/ubuntu/cyberlab up -d --wait postgres
# Fresh DB only, or after the reviewed backup/upgrade procedure:
sudo bash deploy/ubuntu/cyberlab run --rm migrate
sudo bash deploy/ubuntu/cyberlab run --rm migrate ./node_modules/.bin/prisma migrate status --schema=prisma/schema.prisma
sudo bash deploy/ubuntu/cyberlab up -d --wait app nginx
sudo bash deploy/ubuntu/cyberlab ps
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
sudo bash deploy/ubuntu/cyberlab port nginx 8080
sudo ss -lntp
```

The port command must report **`127.0.0.1:8080`**, with no app/Postgres host mapping and no new public listener. Failure of any build/migration/health step stops the procedure; inspect logs before continuing. Do not compensate with firewall, SSH or Docker daemon edits. The Dockerfile builds the app and both generated clients; the runtime contains the Turso generated files as well as the PostgreSQL client. The VPS Compose overrides the older Dockerfile default startup with a plain server command, keeping migration execution explicit.

Resource limits do not replace load testing. Confirm space/RAM before building while a prior release is running. Do not run destructive reset commands, `prisma migrate reset`, `docker compose down -v`, volume pruning or system-wide Docker cleanup.

## Private access and functional verification

From your own computer, through the already allowed SSH port 22:

```bash
ssh -o ExitOnForwardFailure=yes -N -L 127.0.0.1:8080:127.0.0.1:8080 department_user@VPS_ADDRESS
```

Keep it running and open `http://localhost:8080/` and `http://localhost:8080/admin`. No public DNS or new inbound port is required. If existing SSH policy prohibits forwarding, ask the department for an approved access method; do not edit `sshd_config`. Use a free local port if needed, and update the private origin deliberately rather than adding public access.

Verify home/asset loading in English and Arabic, register with a new test name/Telegram, complete all seven scenarios and confirm maximum 140. Check that Wi-Fi Trap has only the three current network cards and the written explanation. Verify 20/10/0 scoring, refresh/resume and results. Sign in as administrator with the generated password; confirm unauthenticated requests are denied and authenticated stats show the test participant. Restart the app and confirm the same session/results remain. Use clearly marked test data and remove it only through a separately authorized targeted cleanup; do not reset a populated database.

The private HTTP origin intentionally uses non-Secure cookies inside the encrypted SSH tunnel, consistent with the existing app configuration. Do not expose this HTTP endpoint publicly.

Logs and restart commands:

```bash
sudo bash deploy/ubuntu/cyberlab logs --tail=100 app nginx postgres
sudo bash deploy/ubuntu/cyberlab logs -f --tail=50 app
sudo bash deploy/ubuntu/cyberlab restart app nginx
sudo bash deploy/ubuntu/cyberlab ps
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
```

`restart` preserves environment, image and the database volume. After changing app environment/image, use `up -d --wait app nginx` to recreate containers. Normal `down` retains named volumes but causes downtime; `down -v` destroys the database and is not a restart operation.

## Back up, restore-test and restore

Application backups stay under `/opt/cyber-awareness-lab/backups`, never either restic directory. There are no new cron/systemd/restic jobs. The helper produces a consistent custom-format PostgreSQL archive, checks that `pg_restore --list` can read it and renames it atomically. This is an archive check, **not** proof of restore.

```bash
cd /opt/cyber-awareness-lab
sudo bash deploy/ubuntu/backup.sh
```

Retain the matching release image, source archive and a protected environment copy. For a migration/upgrade, stop writes **before** the backup and keep them stopped until verification:

```bash
sudo bash deploy/ubuntu/cyberlab stop nginx app
sudo bash deploy/ubuntu/backup.sh
sudo install -d -m 0700 backups
sudo cp -p deploy/ubuntu/.env.production backups/env-before-upgrade
sudo chmod 600 backups/env-before-upgrade
sudo bash deploy/ubuntu/cyberlab images
```

Choose the exact dump and create a **separate new database** for a restore drill. These commands fail if that database already exists; they never overwrite the live database:

```bash
set -euo pipefail
backup_file=/opt/cyber-awareness-lab/backups/REPLACE_WITH_EXACT_ARCHIVE.dump
sudo test -s "$backup_file"
sudo bash deploy/ubuntu/cyberlab exec -T postgres sh -c \
  'exec createdb -U "$POSTGRES_USER" cyberlab_restorecheck'
sudo cat "$backup_file" | sudo bash deploy/ubuntu/cyberlab exec -T postgres sh -c \
  'exec pg_restore -U "$POSTGRES_USER" -d cyberlab_restorecheck --no-owner --no-acl --exit-on-error'
sudo bash deploy/ubuntu/cyberlab exec -T postgres sh -c \
  'exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d cyberlab_restorecheck' <<'SQL'
SELECT COUNT(*) AS participants FROM "ParticipantSession";
SELECT COUNT(*) AS attempts FROM "ScenarioAttempt";
SELECT "scenarioVersion",COUNT(*) FROM "ParticipantSession" GROUP BY "scenarioVersion";
SELECT COUNT(*) AS migrations FROM "_prisma_migrations";
SQL
```

Use Bash `set -o pipefail` for restore pipelines so a failed archive read cannot be mistaken for success. Compare counts against the stopped source and test session/result retrieval in an isolated instance before trusting the backup. Only after review, remove the disposable restore-check database with `dropdb` targeting that exact check name; no live database reset is required. Keep verified backups securely off-host using approved SSH transfer/storage. These archives contain identities, explanations and authentication hashes; grant only the necessary application operators access. Set retention with the department; this guide does not alter its backup infrastructure.

For real recovery, stop `nginx app`, take a backup of the failing state if possible, and restore the chosen archive into another **new** database (for example `cyberlab_recovered_20261016`) using the same `createdb`/`pg_restore` procedure with that database name. Update only `POSTGRES_DB` in the application environment file to that restored name, keeping `POSTGRES_USER`/password/session secret stable, validate, and recreate the stack after selecting the matching application release. The original database remains available for investigation. Creating the restored database explicitly is necessary: changing `POSTGRES_DB` does not initialize it on an existing volume.

For example, after selecting a matching image/release and the exact archive:

```bash
set -euo pipefail
restored_db="cyberlab_recovered_$(date -u +%Y%m%d%H%M%S)"
sudo bash deploy/ubuntu/cyberlab stop nginx app
sudo bash deploy/ubuntu/cyberlab exec -T postgres sh -c \
  'exec createdb -U "$POSTGRES_USER" "$1"' sh "$restored_db"
sudo cat "$backup_file" | sudo bash deploy/ubuntu/cyberlab exec -T postgres sh -c \
  'exec pg_restore -U "$POSTGRES_USER" -d "$1" --no-owner --no-acl --exit-on-error' sh "$restored_db"
# Only point the app at the restored database after restore checks pass.
sudo sed -i "s/^POSTGRES_DB=.*/POSTGRES_DB=$restored_db/" deploy/ubuntu/.env.production
sudo python3 deploy/ubuntu/validate.py
sudo bash deploy/ubuntu/cyberlab up -d --wait --pull never postgres app nginx
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
```

Keep the old database name and environment copy for rollback. This changes only the application's selected database; it does not reset the original one or rerun migrations automatically.

## Upgrade and rollback

Before an upgrade, verify a restorable pre-upgrade backup and save the old source archive and `.env.production` (including `CYBERLAB_RELEASE`). Record image IDs and retain the old app image locally; do not overwrite its release tag or prune it. Extract the new source without secrets, assign a new release tag in the app env file, validate, and build that new tag **before** downtime if host resources allow. Pulling/building does not migrate the database.

After saving the previous environment file, assign the new app tag explicitly:

```bash
new_release="$(date -u +%Y%m%dT%H%M%SZ)"
sudo sed -i "s/^CYBERLAB_RELEASE=.*/CYBERLAB_RELEASE=$new_release/" deploy/ubuntu/.env.production
```

```bash
sudo bash deploy/ubuntu/cyberlab config --quiet
sudo python3 deploy/ubuntu/validate.py
sudo bash deploy/ubuntu/cyberlab build --pull app
sudo bash deploy/ubuntu/cyberlab stop nginx app
sudo bash deploy/ubuntu/backup.sh
# Review pending migrations and their backup/data implications first:
sudo bash deploy/ubuntu/cyberlab run --rm migrate ./node_modules/.bin/prisma migrate status --schema=prisma/schema.prisma
sudo bash deploy/ubuntu/cyberlab run --rm migrate
sudo bash deploy/ubuntu/cyberlab up -d --wait app nginx
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
```

If startup fails **without a schema change**, stop the app/proxy, restore the previous source archive and saved environment file (so the previous image tag is selected), then:

```bash
sudo bash deploy/ubuntu/cyberlab config --quiet
sudo python3 deploy/ubuntu/validate.py
sudo bash deploy/ubuntu/cyberlab up -d --wait --pull never app nginx
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
```

If a migration changed the schema, do not run an older app against it or delete Prisma migration history. Restore the pre-upgrade dump into a new database as above, set `POSTGRES_DB` to that database in the **previous** environment/release, validate, and recreate `postgres app nginx` with `up -d --wait --pull never`. No automatic down-migration or live-database reset is provided. Recovery to a backup loses writes after the backup; stopping participant traffic before upgrades limits this window. Reload browser tabs after either deployment or rollback.

## Future public access — planning only

Public participants on different networks cannot reach the loopback endpoint. Later approval must cover the domain/DNS A and any AAAA records, a department-approved public reverse proxy, TLS certificates/renewal ownership, inbound 80/443 at host/provider firewalls, and any changes to existing proxy/services. Confirm IPv6 policy separately. DNS alone does not provide connectivity or TLS.

A future approved TLS proxy could forward to this private endpoint; its forwarded-header trust, origin and cookie behavior must be tested. Set `PUBLIC_BASE_URL=https://APPROVED_DOMAIN` so the existing app uses Secure admin cookies, update the private-only validator deliberately, arrange certificate management without taking over existing services, and test participant/admin flows over HTTPS. No certificates are issued, ports opened, public proxy configured or renewal jobs installed here.

## Verification status

See [LOCAL_VERIFICATION.md](LOCAL_VERIFICATION.md) for the exact checks executed locally and the checks still required on an approved Docker host. Source/test/build success does not establish that containers, migrations, backup restoration or event-scale capacity have been verified on this VPS.
