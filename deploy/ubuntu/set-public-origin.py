#!/usr/bin/env python3
"""Change only PUBLIC_BASE_URL; dry-run unless --apply is explicitly supplied."""
import argparse
import os
from pathlib import Path
import re
import stat
import tempfile


def update(path, origin, apply=False):
    if origin not in {"https://gameserver.ly", "http://localhost:8080", "http://127.0.0.1:8080"}:
        raise ValueError("Unapproved application origin")
    if path.is_symlink() or not path.is_file():
        raise ValueError("Use an existing regular application environment file")
    metadata = path.stat()
    if stat.S_IMODE(metadata.st_mode) & 0o077:
        raise ValueError("Environment file must be private (0600)")
    original = path.read_bytes()
    if len(re.findall(rb"(?m)^[ \t]*(?:export[ \t]+)?PUBLIC_BASE_URL[ \t]*=", original)) != 1:
        raise ValueError("Ambiguous PUBLIC_BASE_URL entries; nothing changed")
    pattern = rb"(?m)^PUBLIC_BASE_URL=[^\r\n]*"
    if len(re.findall(pattern, original)) != 1:
        raise ValueError("Expected exactly one PUBLIC_BASE_URL= line; nothing changed")
    replacement = b"PUBLIC_BASE_URL=" + origin.encode("ascii")
    updated = re.sub(pattern, lambda _: replacement, original)
    if not apply or updated == original:
        return updated != original
    descriptor, name = tempfile.mkstemp(prefix=".origin-update-", dir=path.parent)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "wb") as output:
            os.fchmod(output.fileno(), stat.S_IMODE(metadata.st_mode))
            if (os.getuid(), os.getgid()) != (metadata.st_uid, metadata.st_gid):
                os.fchown(output.fileno(), metadata.st_uid, metadata.st_gid)
            output.write(updated)
            output.flush()
            os.fsync(output.fileno())
        if path.read_bytes() != original:
            raise ValueError("Environment file changed concurrently; nothing replaced")
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", type=Path, default=Path(__file__).with_name(".env.production"))
    parser.add_argument("--origin", choices=["https://gameserver.ly", "http://localhost:8080", "http://127.0.0.1:8080"], default="https://gameserver.ly")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        changed = update(args.env_file, args.origin, args.apply)
    except (ValueError, OSError) as error:
        parser.exit(1, f"Origin update refused: {error}\n")
    print(("Updated only PUBLIC_BASE_URL." if changed else "PUBLIC_BASE_URL already matches.") if args.apply
          else "Dry run only; use --apply after backing up the application environment file.")
