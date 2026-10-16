# Public HTTPS for gameserver.ly — local preparation

This extends the already-running private Docker deployment at `127.0.0.1:8080`. It does not reinstall Docker, initialize a database, run migrations, generate certificates, rotate secrets or configure DNS/firewalls. **No VPS connection or activation has been performed.** Run the VPS commands later in Termius, with the department administrator's coordination.

## What will change

- Install `cyberlab-public.conf` as **`/etc/nginx/conf.d/cyberlab.conf`**. Two explicit server blocks match only `gameserver.ly` and `www.gameserver.ly`; HTTP redirects to the same hostname over HTTPS. HTTPS proxies all paths to the existing loopback application. There is no `default_server`, wildcard host, public Docker binding or cache introduced by this file.
- Install the application-owned Cloudflare trust include at **`/etc/nginx/cyberlab/cloudflare-realip.inc`**. It is included inside the two game server blocks only. It is not a global Nginx include and does not apply to maintenance logging.
- Update the existing app env file's **`PUBLIC_BASE_URL=https://gameserver.ly`** line only. PostgreSQL settings, `ADMIN_PASSWORD`, `SESSION_SECRET` and the release image tag stay byte-for-byte unchanged.
- Recreate only this Compose project's `app` and `nginx` services to apply the origin and the updated app-owned Docker proxy configuration. Database storage and host bindings remain unchanged.

**Never edit, remove, disable or replace `/etc/nginx/conf.d/maint.conf`, `/srv/maintenance`, its certificate/key paths, SSH, UFW, Fail2Ban, other applications, Minecraft DNS records or existing backup infrastructure.** Host Nginx reloads operate on a shared service; installing/activating the new vhost and any reload require administrator coordination even though maintenance's file stays unchanged.

## TLS, listener and Cloudflare prerequisites

The vhost references only the existing VPS files:

```text
/etc/ssl/certs/gameserver.ly.pem
/etc/ssl/private/gameserver.ly.key
```

Cloudflare must keep both web hostnames proxied with **Full (strict)**, and its edge certificate must cover both. Origin CA certificates are trusted by Cloudflare, not ordinary browsers connecting directly to the origin. Do not pause proxying or switch to Flexible to work around TLS failures. See [Cloudflare Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/).

Before installing anything, confirm all of these:

1. `maint.conf` remains the explicit default for the same IPv4 port-80/443 listening sockets used by the new file. If it uses explicit IP binds rather than these wildcard sockets, stop and have the administrator review the new file's listen addresses. Do not create a new implicit default on another socket.
2. No other loaded vhost explicitly claims either game hostname on those sockets. A conflicting name can be ignored by Nginx with only a warning, so a zero exit code alone is insufficient. If maintenance already explicitly claims these names, stop; this task does not authorize editing it to resolve the conflict.
3. Nginx has HTTP SSL and real-IP modules. The existing default TLS context supports TLS 1.2/1.3. Nginx can take `ssl_protocols` from the default server during early handshake processing; the new vhost cannot safely fix an incompatible default by itself. See [Nginx SSL documentation](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_protocols).
4. Cloudflare's origin destination reaches the IPv4 listener. **No new IPv6 listener is added blindly:** if Cloudflare uses an existing origin AAAA address, first confirm maintenance already owns the matching `[::]:80` and `[::]:443` defaults. With administrator review, add `listen [::]:80;` and `listen [::]:443 ssl;` only to the respective new game blocks, then repeat all validation. Do not change IPv6 networking or Minecraft DNS records to make this template work.
5. The existing host/provider firewall permits the necessary Cloudflare connections. If it does not, stop for separate department approval. No firewall commands are part of this procedure.

## Why the app-owned Docker proxy also changes

The full chain is `Cloudflare → host Nginx TLS vhost → 127.0.0.1:8080 Docker Nginx → Express`.

The original inner proxy replaced visitor IPs with its own peer and HTTPS with HTTP. The prepared inner proxy now preserves the host's **single, sanitized `X-Real-IP`** and exact `http`/`https` scheme, with private-request fallbacks. It ignores inbound `X-Forwarded-For` as an authority. The host vhost overwrites client forwarding headers after Cloudflare peer verification, and removes raw `CF-Connecting-IP` and `Forwarded` before proxying. Express's existing one-hop trust setting continues to receive a single authoritative client address; no authentication/game code changes are needed.

This relies on keeping port 8080 private: local host processes, authorized SSH-tunnel operators and members of this app's Docker frontend network are inside the handoff trust boundary. Do not publish that port, attach unrelated containers, or use the inner proxy as a public edge. Real-IP restoration does **not** restrict origin ingress to Cloudflare; direct origin clients that can already reach Nginx keep their actual peer address, and their forged Cloudflare headers are ignored. Origin lockdown or authenticated origin pulls would be separately approved work.

The inner proxy's existing generous aggregate limiter is preserved; its transport peer remains a Docker/host address. Express's limits receive the restored visitor address. Custom Cloudflare Workers/Pseudo IPv4/header-transform rules can affect `CF-Connecting-IP`; have the administrator confirm standard trusted-header behavior for this zone. Check that any existing Cloudflare cache rules do not cache admin/API/session responses. No zone-wide settings or DNS records are changed here.

## 1. Local GitHub preparation — personal computer

The certificate already present in the local workspace is ignored by Git and Docker. It is not needed in the repository. Ignore rules do not untrack an already committed file, so check before staging. Never display or paste private-key contents.

```bash
cd "/home/alucard_00/web security app/web security app"
git status --short
git remote -v
git ls-files -- '*.pem' '*.key' '*.crt' '*.cer' '*.p12' '*.pfx'
```

The last command must show no production certificate/key files. If this particular certificate was tracked, `git rm --cached -- gameserver.ly.pem` removes it from the index while leaving the local file. Resolve any other tracked production key/certificate before proceeding. Do not use a blanket `git add .` or commit environment files/backups. Actual Git metadata was not available in this preparation environment; no commit or push was executed.

In the real local checkout, create a review branch and stage only these files:

```bash
git switch -c deploy/gameserver-https
git add -- .gitignore .dockerignore README.md \
  deploy/ubuntu/cyberlab-public.conf deploy/ubuntu/cloudflare-realip.inc \
  deploy/ubuntu/nginx.conf deploy/ubuntu/validate.py \
  deploy/ubuntu/set-public-origin.py deploy/ubuntu/update-cloudflare-ips.py \
  deploy/ubuntu/test-preparation.py deploy/ubuntu/test-public-preparation.py \
  deploy/ubuntu/test-nginx-proxy.py deploy/ubuntu/test-production.mjs \
  deploy/ubuntu/PUBLIC_HTTPS.md deploy/ubuntu/PUBLIC_HTTPS_VERIFICATION.md \
  deploy/ubuntu/DEPLOYMENT.md
git diff --cached --name-only
git diff --cached --check
git diff --cached
# Review: only the listed application-owned changes, no secrets/certificates.
git commit -m "Prepare isolated Cloudflare HTTPS virtual host for gameserver.ly"
git push -u origin deploy/gameserver-https
```

Open a GitHub pull request and merge the reviewed commit into the VPS's existing deployment branch. Do not force-push or change the VPS branch blindly. Use your normal GitHub authentication; do not put tokens in remote URLs or shell history.

## 2. Termius — baseline and backup BEFORE git pull

Use the authorized VPS account and the existing `/opt/cyber-awareness-lab` checkout. Do not execute these commands on the personal computer. Coordinate a short app maintenance window and prevent concurrent configuration/reload operations.

```bash
set -euo pipefail
cd /opt/cyber-awareness-lab
git status --short
git branch --show-current
# Stop if there are unreviewed tracked changes, or the branch/upstream is wrong.
umask 077
rollback_dir="$PWD/backups/public-https-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 0700 "$rollback_dir"
sudo cp -p deploy/ubuntu/.env.production "$rollback_dir/env.before"
sudo cp -p deploy/ubuntu/nginx.conf "$rollback_dir/docker-nginx.conf.before"
git rev-parse HEAD > "$rollback_dir/source.before.txt"
sudo sha256sum /etc/nginx/conf.d/maint.conf > "$rollback_dir/maint.sha256"
sudo nginx -t
sudo nginx -V 2>&1 | grep -E 'nginx version|http_ssl_module|http_realip_module'
sudo nginx -T 2>&1 | awk '/^# configuration file|^[[:space:]]*(listen|server_name|ssl_protocols|include)[[:space:]]/ {print}' > "$rollback_dir/vhosts.before.txt"
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
sudo bash deploy/ubuntu/cyberlab port nginx 8080
```

Verify the port is still `127.0.0.1:8080`. Save the rollback directory path in your private operator notes. These backups are application-specific and ignored by Git; do not use either restic directory. If the production env file has a different path, stop and select that actual file explicitly with the helper's `--env-file` and wrapper's `CYBERLAB_ENV_FILE`; do not generate new secrets or substitute the developer `.env`.

Inspect the filtered vhost listing for socket ownership and hostname conflicts:

```bash
cat "$rollback_dir/vhosts.before.txt"
grep -nE 'gameserver\.ly|default_server|listen' "$rollback_dir/vhosts.before.txt" || true
```

Record a maintenance baseline with the department's actual maintenance hostname and its approved trust file, without changing either. Replace placeholders before running:

```bash
maintenance_host=REPLACE_WITH_EXISTING_MAINTENANCE_HOSTNAME
maintenance_ca=REPLACE_WITH_EXISTING_APPROVED_MAINTENANCE_CA_FILE
curl --silent --show-error --resolve "$maintenance_host:80:127.0.0.1" \
  -D "$rollback_dir/maint-http.before.headers" -o "$rollback_dir/maint-http.before.body" "http://$maintenance_host/"
curl --silent --show-error --cacert "$maintenance_ca" --resolve "$maintenance_host:443:127.0.0.1" \
  -D "$rollback_dir/maint-https.before.headers" -o "$rollback_dir/maint-https.before.body" "https://$maintenance_host/"
```

Also record the department's expected maintenance status/Location/body. If the maintenance page is dynamic, compare its routing and certificate/status rather than expecting byte-identical bodies. Do not disable certificate verification to call this a trust test. Stop if the baseline itself fails.

Pull only after the reviewed change has merged into the branch already deployed:

```bash
git pull --ff-only
git log -1 --oneline
git diff --stat "$(cat "$rollback_dir/source.before.txt")" HEAD
sed -n '1,220p' deploy/ubuntu/cyberlab-public.conf
cat deploy/ubuntu/cloudflare-realip.inc
```

Review the diff and confirm `compose.yaml`, database settings and game logic have not changed as part of this HTTPS deployment. Do not build/pull arbitrary new images or run migration services for this configuration-only change.

## 3. Termius — verify the EXISTING certificate/key

These commands read the existing files, emit only metadata/public-key digests internally, and do not generate certificates or overwrite key material:

```bash
set -euo pipefail
sudo test -r /etc/ssl/certs/gameserver.ly.pem
sudo test -r /etc/ssl/private/gameserver.ly.key
sudo stat -c '%a %U:%G %n' /etc/ssl/certs/gameserver.ly.pem /etc/ssl/private/gameserver.ly.key
sudo openssl x509 -in /etc/ssl/certs/gameserver.ly.pem -noout -dates -ext subjectAltName
sudo openssl x509 -in /etc/ssl/certs/gameserver.ly.pem -noout -checkend 0
cert_public_hash=$(sudo openssl x509 -in /etc/ssl/certs/gameserver.ly.pem -pubkey -noout | openssl pkey -pubin -outform DER | sha256sum | awk '{print $1}')
key_public_hash=$(sudo openssl pkey -in /etc/ssl/private/gameserver.ly.key -pubout -outform DER | sha256sum | awk '{print $1}')
test "$cert_public_hash" = "$key_public_hash"
printf 'Certificate/private-key public components match.\n'
```

The private key must not be world-readable; ask the administrator to resolve unsuitable permissions rather than printing or replacing the key. Compare `notBefore` with current UTC as well as checking expiry. The provided local certificate's public metadata covers `gameserver.ly` and `*.gameserver.ly` and runs from 2026-10-16 18:03 UTC to 2041-10-12 18:03 UTC; this is not verification of the VPS's files or matching key.

Download only the **public RSA Origin CA root** to a temporary location outside Git for trust/hostname checks, using the link from [Cloudflare's official Origin CA page](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/#cloudflare-origin-ca-root-certificate):

```bash
origin_ca=$(mktemp /tmp/cyberlab-origin-ca.XXXXXX)
curl --fail --silent --show-error --proto '=https' \
  https://developers.cloudflare.com/ssl/static/origin_ca_rsa_root.pem -o "$origin_ca"
sudo openssl verify -CAfile "$origin_ca" -verify_hostname gameserver.ly /etc/ssl/certs/gameserver.ly.pem
sudo openssl verify -CAfile "$origin_ca" -verify_hostname www.gameserver.ly /etc/ssl/certs/gameserver.ly.pem
```

Both must pass before activation. Keep `origin_ca` for the direct-origin checks below; it is not a replacement server certificate or private key.

## 4. Termius — stage only the game files; validate, do NOT reload yet

Stop if the target vhost or include already exists; have the administrator review ownership and save a separate versioned backup instead of overwriting an unknown file.

```bash
sudo test ! -e /etc/nginx/conf.d/cyberlab.conf
sudo test ! -e /etc/nginx/cyberlab/cloudflare-realip.inc
sudo install -d -m 0755 /etc/nginx/cyberlab
sudo install -m 0644 deploy/ubuntu/cloudflare-realip.inc /etc/nginx/cyberlab/cloudflare-realip.inc
sudo install -m 0644 deploy/ubuntu/cyberlab-public.conf /etc/nginx/conf.d/cyberlab.conf
sudo nginx -t 2>&1 | tee "$rollback_dir/nginx-test.after.txt"
sudo nginx -T 2>&1 | awk '/^# configuration file|^[[:space:]]*(listen|server_name|ssl_protocols|include)[[:space:]]/ {print}' > "$rollback_dir/vhosts.after.txt"
test "$(grep -c default_server "$rollback_dir/vhosts.before.txt")" = "$(grep -c default_server "$rollback_dir/vhosts.after.txt")"
sudo sha256sum -c "$rollback_dir/maint.sha256"
diff -u "$rollback_dir/vhosts.before.txt" "$rollback_dir/vhosts.after.txt" || true
```

Review all syntax diagnostics and the diff. Any conflicting/duplicate server-name or listen-option warning is a stop condition, even if `nginx -t` returns success. Confirm the exact two hostnames are associated with the new file, existing default servers/listen sockets remain maintenance-owned, and the Cloudflare include occurs only inside the game blocks. Do not add it to the `http` block, `nginx.conf`, `maint.conf` or a globally loaded `conf.d/*.conf` trust file.

If validation fails, move **only** `/etc/nginx/conf.d/cyberlab.conf` to `/etc/nginx/cyberlab/cyberlab.conf.disabled`, then run `sudo nginx -t` again. Do not reload a failing configuration. The already-running maintenance workers continue using their existing configuration until an authorized reload.

## 5. Termius — update the origin and app-owned proxy only

The helper defaults to a dry run and validates the environment file; the `--apply` command replaces just its one `PUBLIC_BASE_URL` line. Do not run `create-env.py`, change database credentials or replace the entire env file.

```bash
sudo python3 deploy/ubuntu/set-public-origin.py
sudo python3 deploy/ubuntu/set-public-origin.py --apply
sudo python3 deploy/ubuntu/validate.py
sudo bash deploy/ubuntu/cyberlab config --quiet
```

Verify that nothing except the origin changed, without printing secrets:

```bash
sudo python3 - "$rollback_dir/env.before" deploy/ubuntu/.env.production <<'PY'
from pathlib import Path
import re,sys
old,new=(Path(p).read_bytes() for p in sys.argv[1:])
remove=lambda data: re.sub(rb'(?m)^PUBLIC_BASE_URL=[^\r\n]*', b'', data)
assert remove(old)==remove(new), 'Unexpected non-origin change: STOP'
assert re.findall(rb'(?m)^PUBLIC_BASE_URL=([^\r\n]*)',new)==[b'https://gameserver.ly']
print('PASS: only PUBLIC_BASE_URL changed; credentials and release preserved.')
PY
sudo bash deploy/ubuntu/cyberlab up -d --wait --no-deps --force-recreate --pull never app nginx
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
sudo bash deploy/ubuntu/cyberlab port nginx 8080
```

Recreation is required: `restart` does not load changed environment variables, and a bind-mounted config can still reference the pre-`git pull` inode. These commands affect only this project's app/proxy, not PostgreSQL, other Docker projects or host Nginx. They do not run migrations. A brief app-only interruption requires coordination. Host Nginx is still not activated here.

## 6. Termius — coordinated activation and direct-origin verification

Only after certificate matching, conflict/default checks, app health and administrator approval:

```bash
sudo nginx -t
# Run only at the administrator-approved activation time:
sudo systemctl reload nginx
sudo systemctl is-active nginx
sudo sha256sum -c "$rollback_dir/maint.sha256"
```

Use a graceful reload, never stop/restart/disable the shared Nginx service. If a test or reload fails, inspect its diagnostics and follow rollback; do not edit maintenance or security services.

Run both hostname checks against the local origin with certificate verification enabled. These intentionally bypass Cloudflare routing while preserving TLS SNI and Host:

```bash
for game_host in gameserver.ly www.gameserver.ly; do
  curl --fail --silent --show-error --cacert "$origin_ca" --resolve "$game_host:443:127.0.0.1" "https://$game_host/api/health"
  curl --silent --show-error --resolve "$game_host:80:127.0.0.1" -o /dev/null -D - "http://$game_host/simulation/wifi/networks?lang=ar"
  openssl s_client -connect 127.0.0.1:443 -servername "$game_host" -CAfile "$origin_ca" -verify_hostname "$game_host" -verify_return_error -tls1_2 </dev/null
  openssl s_client -connect 127.0.0.1:443 -servername "$game_host" -CAfile "$origin_ca" -verify_hostname "$game_host" -verify_return_error -tls1_3 </dev/null
done
```

Expect health 200/reachable, a 308 HTTP redirect to the same game hostname/path/query, valid certificate/hostname verification and successful TLS 1.2/1.3 handshakes. An unrelated Host must not redirect to the game:

```bash
curl --silent --show-error -H 'Host: unrelated-routing-check.invalid' -o /dev/null -D - http://127.0.0.1/
```

Repeat the maintenance baseline commands using `.after` output filenames. Confirm its expected status/Location/body and certificate/routing remain unchanged. Recheck defaults and `maint.conf` checksum. If the inherited default TLS context prevents the required versions, stop and ask the administrator to review the conflict; do not change maintenance yourself.

## 7. Public verification — after activation only

From a computer outside the VPS and from another network, with Cloudflare proxying enabled:

```bash
for game_host in gameserver.ly www.gameserver.ly; do
  curl --fail --silent --show-error "https://$game_host/api/health"
  curl --fail --silent --show-error -o /dev/null -w '%{http_code}\n' "https://$game_host/simulation/wifi/networks?lang=ar"
  curl --silent --show-error -o /dev/null -D - "http://$game_host/simulation/wifi/networks?lang=ar"
done
```

Cloudflare may apply an existing edge HTTP redirect before the origin; verify that it reaches HTTPS without a loop. Open both HTTPS hostnames in a browser. Register a clearly marked test participant, complete the seven games, confirm reasoning/scoring and results out of 140, refresh/resume, and test Arabic. Use relative same-origin API requests on each alias. Login cookies are host-only; signing into one alias does not automatically sign into the other. Do not delete real participants or reset the database as a test.

For an administrator cookie test that keeps passwords/tokens out of shell history and console output:

```bash
set -euo pipefail
umask 077
admin_check_dir=$(mktemp -d /tmp/cyberlab-admin-check.XXXXXX)
trap 'rm -f "$admin_check_dir/login.json" "$admin_check_dir/cookies.txt" "$admin_check_dir/headers.txt"; rmdir "$admin_check_dir"' EXIT
python3 - "$admin_check_dir/login.json" <<'PY'
import getpass,json,sys
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({'password':getpass.getpass('Existing administrator password: ')}))
PY
test "$(curl --silent --show-error -o /dev/null -w '%{http_code}' https://gameserver.ly/api/admin/stats)" = 401
curl --fail --silent --show-error -H 'Content-Type: application/json' \
  --data-binary "@$admin_check_dir/login.json" -c "$admin_check_dir/cookies.txt" \
  -D "$admin_check_dir/headers.txt" -o /dev/null https://gameserver.ly/api/admin/login
python3 - "$admin_check_dir/headers.txt" <<'PY'
from pathlib import Path
import sys
cookies=[line.lower() for line in Path(sys.argv[1]).read_text().splitlines() if line.lower().startswith('set-cookie: cyberlab_admin=')]
assert len(cookies)==1 and all(flag in cookies[0] for flag in ['; secure','; httponly','samesite=strict'])
print('PASS: admin cookie has Secure, HttpOnly and SameSite=Strict. Token not printed.')
PY
curl --fail --silent --show-error -b "$admin_check_dir/cookies.txt" -o /dev/null https://gameserver.ly/api/admin/stats
curl --fail --silent --show-error -X POST -b "$admin_check_dir/cookies.txt" -o /dev/null https://gameserver.ly/api/admin/logout
rm -f "$admin_check_dir/login.json" "$admin_check_dir/cookies.txt" "$admin_check_dir/headers.txt"
rmdir "$admin_check_dir"
trap - EXIT
```

Repeat using `www.gameserver.ly` if administrators will use that alias. In browser DevTools, confirm successful same-origin registration/attempt APIs and Secure/HttpOnly/SameSite cookies over HTTPS. Check host/app logs locally for restored visitor addresses; do not paste session cookies/passwords/logs into public issues.

## Cloudflare IP-list maintenance

The committed list contains only the current official IPv4/IPv6 CIDRs from [Cloudflare IPv4](https://www.cloudflare.com/ips-v4), [IPv6](https://www.cloudflare.com/ips-v6) and their [IP ranges reference](https://www.cloudflare.com/ips/). `set_real_ip_from` plus `real_ip_header CF-Connecting-IP` is supported at server scope, allowing isolation from maintenance; see [Nginx real-IP module](https://nginx.org/en/docs/http/ngx_http_realip_module.html).

Before activation and periodically afterward, run **locally**, review changes, and transfer them through the same GitHub workflow:

```bash
python3 deploy/ubuntu/update-cloudflare-ips.py
# If the official lists changed, review the change and then:
python3 deploy/ubuntu/update-cloudflare-ips.py --write
git diff -- deploy/ubuntu/cloudflare-realip.inc
```

The checker uses verified HTTPS and validates CIDRs, version, global addresses and breadth. If text endpoints block automated requests it uses Cloudflare's official public IP API. It never reloads Nginx or edits a VPS. Invalid/empty lists fail closed. Do not replace the trust list with `0.0.0.0/0`, `::/0`, arbitrary forwarded headers, a downloaded shell script or a global trust setting. Changed includes require review, a backup of the existing **game-owned** include, installation, full `nginx -t`, and a coordinated reload. No background refresh job is installed.

## Rollback — game files and origin only

Use the exact rollback directory saved before `git pull`; do not remove unrelated vhosts, roll back the whole repository blindly, or stop maintenance.

```bash
set -euo pipefail
cd /opt/cyber-awareness-lab
rollback_dir=/opt/cyber-awareness-lab/backups/REPLACE_WITH_SAVED_PUBLIC_HTTPS_DIRECTORY
sudo test -s "$rollback_dir/env.before"
sudo test -s "$rollback_dir/docker-nginx.conf.before"
# Disable ONLY the newly introduced game vhost, outside conf.d's *.conf glob:
sudo mv /etc/nginx/conf.d/cyberlab.conf /etc/nginx/cyberlab/cyberlab.conf.disabled
sudo nginx -t
# Coordinate this reload with the administrator as well:
sudo systemctl reload nginx
previous_origin=$(sudo python3 - "$rollback_dir/env.before" <<'PY'
from pathlib import Path
import re,sys
values=re.findall(rb'(?m)^PUBLIC_BASE_URL=([^\r\n]*)',Path(sys.argv[1]).read_bytes())
assert len(values)==1
print(values[0].decode().strip('\"\''))
PY
)
sudo python3 deploy/ubuntu/set-public-origin.py --origin "$previous_origin" --apply
sudo cp -p "$rollback_dir/docker-nginx.conf.before" deploy/ubuntu/nginx.conf
sudo python3 deploy/ubuntu/validate.py
sudo bash deploy/ubuntu/cyberlab up -d --wait --no-deps --force-recreate --pull never app nginx
curl --fail --silent --show-error http://127.0.0.1:8080/api/health
sudo bash deploy/ubuntu/cyberlab port nginx 8080
sudo sha256sum -c "$rollback_dir/maint.sha256"
```

This restores only the former public-origin value and the app's proxy file, preserving **current** database/admin credentials, session secret and data. It does not restore the entire env file over possibly newer credentials. Retain the disabled game file, Cloudflare include and backups for review; no global include references them. Recheck maintenance routing and use the original SSH tunnel for private application access. Do not remove or modify either production TLS file. No DNS, UFW, Fail2Ban, Minecraft or restic rollback is needed because none was changed by this procedure.

## Review results

See [PUBLIC_HTTPS_VERIFICATION.md](PUBLIC_HTTPS_VERIFICATION.md) for files changed, locally executed tests and outstanding VPS checks. Local fixture success is not a claim that the actual VPS's complete Nginx configuration, certificate/key match, firewall reachability or public Cloudflare routing has been verified.
