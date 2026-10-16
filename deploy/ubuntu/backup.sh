#!/usr/bin/env bash
set -euo pipefail
umask 077
app_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
backup_dir="$app_root/backups"
mkdir -p -- "$backup_dir"
temporary="$(mktemp "$backup_dir/.postgres-XXXXXX.dump")"
trap 'rm -f -- "$temporary"' EXIT
bash "$app_root/deploy/ubuntu/cyberlab" exec -T postgres sh -c \
  'exec pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$temporary"
test -s "$temporary"
bash "$app_root/deploy/ubuntu/cyberlab" exec -T postgres pg_restore --list < "$temporary" > /dev/null
backup_file="$backup_dir/postgres-$(date -u +%Y%m%dT%H%M%SZ)-$$.dump"
mv -- "$temporary" "$backup_file"
trap - EXIT
printf 'Created and checked archive: %s\nA restore drill in a separate database is still required.\n' "$backup_file"
