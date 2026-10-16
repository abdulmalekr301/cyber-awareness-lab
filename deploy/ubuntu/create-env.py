#!/usr/bin/env python3
"""Generate new VPS-only secrets without reading or overwriting developer .env."""
import datetime
import os
from pathlib import Path
import secrets
import sys

path = Path(sys.argv[1]) if len(sys.argv) == 2 else Path(__file__).with_name(".env.production")
if len(sys.argv) > 2:
    raise SystemExit("Usage: create-env.py [new-output-file]")
values = {
    "CYBERLAB_RELEASE": datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
    "POSTGRES_DB": "cyberlab",
    "POSTGRES_USER": "cyberlab",
    # Hex avoids URI-encoding and Compose interpolation ambiguity in DATABASE_URL.
    "POSTGRES_PASSWORD": secrets.token_hex(32),
    "ADMIN_PASSWORD": secrets.token_hex(32),
    "SESSION_SECRET": secrets.token_hex(32),
    "PUBLIC_BASE_URL": "http://localhost:8080",
}
try:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
except FileExistsError:
    raise SystemExit(f"Refusing to overwrite existing secrets: {path}") from None
with os.fdopen(descriptor, "w") as output:
    output.write("# Application-only production settings; keep private and backed up.\n")
    for name, value in values.items():
        output.write(f"{name}={value}\n")
print(f"Created {path} with mode 0600. Secrets were not printed.")
