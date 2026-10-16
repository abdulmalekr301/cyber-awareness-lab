#!/usr/bin/env python3
"""Validate the actual resolved Compose model without printing its secrets."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlsplit

directory = Path(__file__).resolve().parent


class ConfigurationError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise ConfigurationError(message)


def validate(model):
    require(model["name"] == "cyber-awareness-lab", "Unexpected Compose project")
    services = model["services"]
    require(set(services) == {"postgres", "app", "nginx", "migrate"}, "Unexpected services")
    for name, service in services.items():
        require(not service.get("privileged"), f"{name}: privileged container")
        require(not service.get("network_mode"), f"{name}: unexpected network mode")
        require(not service.get("devices"), f"{name}: host devices mounted")
        require(not service.get("pid") and not service.get("ipc"), f"{name}: shared host namespaces")
        for volume in service.get("volumes", []):
            if volume["type"] == "bind":
                require(name == "nginx" and Path(volume["source"]).resolve() == directory / "nginx.conf"
                        and volume["target"] == "/etc/nginx/nginx.conf" and volume.get("read_only"),
                        f"{name}: unexpected host mount")
            else:
                require(name == "postgres" and volume["type"] == "volume"
                        and volume["source"] == "postgres_data"
                        and volume["target"] == "/var/lib/postgresql/data", f"{name}: unexpected storage")
        if name != "nginx":
            require(not service.get("ports"), f"{name}: host port must not be published")
    ports = services["nginx"].get("ports", [])
    require(len(ports) == 1, "Proxy must publish exactly one port")
    require(ports[0].get("host_ip") == "127.0.0.1" and str(ports[0]["published"]) == "8080"
            and ports[0]["target"] == 8080 and ports[0].get("protocol") == "tcp", "Proxy must bind only 127.0.0.1:8080")
    require(model["networks"]["database"].get("internal") is True, "Database network must be internal")
    require(set(services["postgres"]["networks"]) == {"database"}, "Postgres must use only its database network")
    require(set(services["nginx"]["networks"]) == {"frontend"}, "Proxy must not join database network")
    require(bool(services["postgres"].get("volumes")), "Postgres needs persistent storage")
    for name in ["app", "nginx", "migrate"]:
        service = services[name]
        require(service.get("read_only") and "ALL" in service.get("cap_drop", []), f"{name}: missing isolation")
        require("no-new-privileges:true" in service.get("security_opt", []), f"{name}: privilege escalation allowed")
        require(bool(service.get("tmpfs")), f"{name}: missing temporary filesystem")
    require(services["nginx"].get("user") == "nginx", "Proxy must run as nginx user")
    require(services["app"]["command"] == ["node", "backend/dist/server.js"], "App startup must not auto-migrate")
    require(services["migrate"].get("profiles") == ["maintenance"], "Migrations must be explicit maintenance")
    database = services["postgres"]["environment"]
    for name in ["app", "migrate"]:
        env = services[name]["environment"]
        require(env.get("NODE_ENV") == "production", f"{name}: not production")
        require(not env.get("TURSO_DATABASE_URL") and not env.get("TURSO_AUTH_TOKEN"), f"{name}: mixed database modes")
        url = urlsplit(env["DATABASE_URL"])
        require(url.scheme == "postgresql" and url.hostname == "postgres" and url.port == 5432,
                f"{name}: database must be the private Postgres service")
        require(url.username == database["POSTGRES_USER"] and url.password == database["POSTGRES_PASSWORD"]
                and url.path == "/" + database["POSTGRES_DB"], f"{name}: database credentials do not agree")
        require(re.fullmatch(r"[0-9a-f]{64}", database["POSTGRES_PASSWORD"]), "Use the generated URI-safe Postgres password")
        require(len(env["ADMIN_PASSWORD"]) >= 32 and len(env["SESSION_SECRET"]) >= 32, "Production secrets are too short")
        require(env["PUBLIC_BASE_URL"] in ["http://localhost:8080", "http://127.0.0.1:8080", "https://gameserver.ly"],
                "Use a private origin or the approved https://gameserver.ly origin")


def main():
    env_file = Path(os.environ.get("CYBERLAB_ENV_FILE", directory / ".env.production"))
    require(env_file.is_file(), "Generate the VPS environment file first")
    require(env_file.stat().st_mode & 0o077 == 0, "Environment file must have mode 0600")
    rendered = subprocess.run(["bash", str(directory / "cyberlab"), "--profile", "maintenance", "config", "--format", "json"],
                              capture_output=True, text=True)
    require(rendered.returncode == 0, "Docker Compose validation failed; use the documented config --quiet check for details")
    validate(json.loads(rendered.stdout))
    print("PASS: resolved Compose model publishes only 127.0.0.1:8080; private persistent PostgreSQL; isolated services; valid production settings.")


if __name__ == "__main__":
    try:
        main()
    except ConfigurationError as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
    except (ValueError, KeyError, OSError, json.JSONDecodeError):
        # A parse/URL/Compose exception can contain secrets. Never echo its value.
        print("FAIL: deployment configuration did not pass validation. Check the guide and run Compose config --quiet.", file=sys.stderr)
        sys.exit(1)
