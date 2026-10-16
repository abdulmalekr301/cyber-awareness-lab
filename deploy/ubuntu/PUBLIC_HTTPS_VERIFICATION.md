# Public HTTPS preparation report — 2026-10-16

**Local preparation only. No VPS connection, remote command, GitHub push, certificate/key installation, Nginx reload, firewall/DNS change or database migration was performed.** No local system Nginx configuration was modified.

## Prepared result

- `cyberlab-public.conf` defines only `gameserver.ly` and `www.gameserver.ly` on IPv4 HTTP/HTTPS sockets. HTTP returns a same-host HTTPS redirect; HTTPS proxies unchanged paths/query strings to `127.0.0.1:8080`. There is no default/wildcard vhost, URI replacement or response cache.
- TLS references the **existing VPS paths** `/etc/ssl/certs/gameserver.ly.pem` and `/etc/ssl/private/gameserver.ly.key`, with TLS 1.2/1.3. Existing certificate/key matching is an activation prerequisite, not a completed VPS test.
- Cloudflare's 15 IPv4 and 7 IPv6 ranges were checked against its official sources. The real-IP include is used **inside the game server blocks only**, with `CF-Connecting-IP`; other peers cannot supply trusted visitor addresses. No global or maintenance real-IP setting is added.
- The host resets forwarding headers. The app-owned inner Docker proxy now carries that sanitized IP and HTTPS scheme through to Express instead of replacing them with its own peer and HTTP. The existing backend authentication/proxy-trust code is unchanged.
- The origin updater changes only `PUBLIC_BASE_URL`, defaults to dry run and preserves other bytes/permissions/ownership. The validator accepts the approved HTTPS origin while still enforcing loopback Docker publishing and private PostgreSQL. No real production env file or credentials were changed locally.
- The maintenance file/site, production key, other applications, Minecraft records, UFW, Fail2Ban and backup infrastructure are untouched. The repository's existing backend/frontend/schema files and Docker Compose bindings were verified unchanged against a pre-task snapshot.

## Files changed locally

New:

- `deploy/ubuntu/cyberlab-public.conf`
- `deploy/ubuntu/cloudflare-realip.inc`
- `deploy/ubuntu/set-public-origin.py`
- `deploy/ubuntu/update-cloudflare-ips.py`
- `deploy/ubuntu/test-public-preparation.py`
- `deploy/ubuntu/test-nginx-proxy.py`
- `deploy/ubuntu/PUBLIC_HTTPS.md`
- `deploy/ubuntu/PUBLIC_HTTPS_VERIFICATION.md`

Modified:

- `deploy/ubuntu/nginx.conf` — preserve the private host-proxy IP/HTTPS handoff.
- `deploy/ubuntu/validate.py` — allow only the additional approved public origin; keep binding checks.
- `deploy/ubuntu/test-preparation.py` — approved-origin and continued loopback-enforcement checks.
- `deploy/ubuntu/test-production.mjs` — optional approved-origin/Secure-cookie smoke mode.
- `deploy/ubuntu/DEPLOYMENT.md` — point existing deployments to the HTTPS extension; exclude certificates/keys from older source-archive instructions.
- `README.md` — link to the new procedure/results.
- `.gitignore`, `.dockerignore` — exclude certificate/key file extensions.

The user-supplied `gameserver.ly.pem` already existed locally. It was left untouched, not copied into a deliverable, and is now covered by ignore rules. No production private key was read or printed. Ignore rules do not remove previously tracked files; the real checkout must pass the guide's tracked-certificate audit before committing. Git metadata was unavailable here, so actual tracking status, commits and GitHub transfer remain unverified.

## Tests actually executed

| Check | Result |
|---|---|
| `npm run build` | **PASS** — frontend, backend and both Prisma clients |
| Existing backend tests | **PASS — 137** |
| Existing frontend tests | **PASS — 29**, including EN/AR and written explanations |
| Isolated database-backed API suite | **PASS — 42** |
| Deployment configuration tests | **PASS — 12** |
| Public-origin/CIDR/ignore/preparation tests | **PASS — 13** |
| Actual Compose resolution with a temporary env changed to the public origin | **PASS** — standalone Compose v5.6.0; only `127.0.0.1:8080` published |
| Local Nginx 1.24 syntax and runtime | **PASS** — extracted Ubuntu 1.24.0 package, no installation/service changes |
| Both names and HTTP redirects | **PASS** — exact hosts and preserved path/query; unrelated hosts retain fixture maintenance routing |
| TLS 1.2/1.3 | **PASS** in the local fixture for both game hostnames |
| Two-proxy forwarding | **PASS** — path/query, Host, HTTPS, Cookie and Secure/HttpOnly/SameSite Set-Cookie retained |
| Visitor-IP trust | **PASS** — forged Cloudflare/XFF/Forwarded headers from an untrusted local peer rejected; trusted-edge simulation forwarded the restored IP |
| Real-IP scope/default routing | **PASS** — separate maintenance fixture retains its peer address, body and defaults; no conflicting-name warning |
| Compiled production smoke with `CYBERLAB_TEST_PUBLIC=1` | **PASS** — seven games/140 points, current Wi-Fi answer, Secure admin cookies, successful admin auth, participant/admin persistence across restart |
| Official Cloudflare range check | **PASS** — read-only updater agrees with the official IPv4/IPv6 sources |
| Public certificate metadata | **PASS** — supplied local certificate SAN covers apex/wildcard; dates inspected; no matching private key available locally |
| Guide command syntax | **PASS** — Bash blocks and embedded Python parsed, not executed against the VPS |
| Source preservation | **PASS** — 63 existing backend/frontend/schema files unchanged; Compose, credentials generator, wrapper, Dockerfile and package manifests unchanged |
| Actual VPS certificate/key match and chain validation | **NOT EXECUTED** |
| Full VPS `nginx -t`, live host-conflict/default/maintenance checks | **NOT EXECUTED** |
| Actual public Cloudflare routing, browser admin cookies and external-network access | **NOT EXECUTED** |
| GitHub push/pull, app-container recreation and host Nginx activation/rollback | **NOT EXECUTED** |

**233 automated cases passed** (137 + 29 + 42 + 12 + 13), plus the Nginx integration and production-startup smoke checks. Default skipped API tests ran separately against a fresh temporary database. No existing participant data was used or reset.

The Nginx check used temporary high ports and fixture configuration paths with an existing **public Node.js test certificate/key**, not a new certificate or the production key. All test traffic connected to loopback, even when its SNI/Host was a game hostname. An extra loopback trust address existed only in the temporary fixture to simulate a trusted Cloudflare edge; it is absent from the deployment include. A separate default maintenance fixture tests isolation; it is not the real VPS maintenance configuration. The first fixture run needed additional temporary-path overrides and was corrected before the passing run.

The compiled smoke check stages the generated Turso client as the Dockerfile does and uses a new temporary libSQL database under local Node 20; it is not a Docker/PostgreSQL runtime test or a public browser test. No application image rebuild is required by the VPS procedure because runtime application code did not change.

## Transfer, installation, activation and rollback

[PUBLIC_HTTPS.md](PUBLIC_HTTPS.md) contains the complete ordered procedure:

1. Local certificate tracking audit, explicit `git add` allowlist, commit, `git push -u origin deploy/gameserver-https`, and reviewed merge.
2. Termius baseline/private backups **before** `git pull --ff-only` in `/opt/cyber-awareness-lab`.
3. VPS certificate/key public-component match and Origin CA hostname/chain verification.
4. Install only the new game vhost and its scoped trust include, then full Nginx syntax/warning/default/conflict checks. Maintenance is neither overwritten nor disabled.
5. Update only the app origin, prove all other env bytes unchanged, validate, and force-recreate only this app/proxy without dependencies, migrations or pulls.
6. Coordinated graceful host Nginx reload, direct-origin and public checks, and maintenance comparison.
7. Rollback by moving only the new game vhost outside the loaded glob, validating and coordinating a reload, then restoring only the previous origin and app-owned Docker proxy file. Current secrets/data and maintenance remain intact.

No activation script automatically performs those steps. Only the human-reviewed Termius commands reload the shared Nginx service.

## Prerequisites and unresolved risks

- **Administrator coordination is required** for installing/activating this vhost, app-only recreation/downtime, and either activation or rollback reload of shared Nginx. No SSH/security-service/firewall changes are authorized or proposed.
- The actual `maint.conf`, active listener addresses, other vhost names, SSL defaults and IPv6 origin route must be reviewed on the VPS. The template intentionally avoids introducing a new IPv6 implicit default. Incompatible default TLS policy or hostname ownership cannot be repaired by modifying maintenance under this task.
- Confirm existing Cloudflare Full (strict)/proxied web records, edge hostname coverage, origin reachability, cache rules and standard visitor-IP header behavior. No Minecraft/DNS records are changed. Origin CA is not public browser trust for direct origin access.
- Cloudflare CIDRs must be reviewed periodically. The checker can prepare a local change but never auto-deploys, reloads or adds global trust.
- The inner header handoff relies on the existing private 8080 binding and trusted local operators/app network. The prepared configuration is not a Cloudflare-only ingress restriction or a request to expose Docker directly.
- Actual certificate/key matching, full live Nginx validation, maintenance routing, PostgreSQL health and public browser/API tests remain VPS-side gates. Local test success does not satisfy them.

Reference documentation: [Cloudflare IP ranges](https://www.cloudflare.com/ips/), [Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/), [Nginx real-IP scope](https://nginx.org/en/docs/http/ngx_http_realip_module.html), [Nginx SSL/default-context behavior](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_protocols), and [proxy URI forwarding](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass).
