#!/usr/bin/env python3
"""Check official Cloudflare CIDRs; --write updates only the local app include."""
import argparse
import datetime
import ipaddress
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen


def parse(text, version):
    lines = text.splitlines()
    if not 1 <= len(lines) <= 1000:
        raise ValueError("Unexpected Cloudflare list size")
    result = []
    for line in lines:
        network = ipaddress.ip_network(line.strip(), strict=True)
        if network.version != version or not network.is_global or network.prefixlen < (8 if version == 4 else 16):
            raise ValueError("Unexpected or overly broad Cloudflare network")
        if str(network) in result:
            raise ValueError("Duplicate Cloudflare network")
        result.append(str(network))
    return result


def fetch(version):
    request = Request(f"https://www.cloudflare.com/ips-v{version}", headers={"User-Agent": "CyberAwarenessLab-ConfigCheck/1.0"})
    with urlopen(request, timeout=20) as response:
        if response.geturl() != f"https://www.cloudflare.com/ips-v{version}":
            raise ValueError("Unexpected IP-list redirect; review manually")
        return parse(response.read(65537).decode("ascii"), version)


def fetch_all():
    try:
        return fetch(4) + fetch(6)
    except OSError:
        # Some Cloudflare frontends block automated requests to www. The public,
        # unauthenticated official API supplies the same IPv4/IPv6 CIDR lists.
        request = Request("https://api.cloudflare.com/client/v4/ips", headers={"User-Agent": "CyberAwarenessLab-ConfigCheck/1.0"})
        with urlopen(request, timeout=20) as response:
            if response.geturl() != "https://api.cloudflare.com/client/v4/ips":
                raise ValueError("Unexpected Cloudflare API redirect")
            payload = json.loads(response.read(65537))
        if payload.get("success") is not True:
            raise ValueError("Official Cloudflare IP API returned failure")
        result = payload["result"]
        return parse("\n".join(result["ipv4_cidrs"]), 4) + parse("\n".join(result["ipv6_cidrs"]), 6)


def render(networks):
    date = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    return ("# Include INSIDE the Cyber Awareness Lab server blocks only.\n"
            f"# Verified {date} against https://www.cloudflare.com/ips-v4\n"
            "# and https://www.cloudflare.com/ips-v6. Refresh with update-cloudflare-ips.py.\n"
            "real_ip_header CF-Connecting-IP;\nreal_ip_recursive off;\n"
            + "".join(f"set_real_ip_from {network};\n" for network in networks))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    target = Path(__file__).with_name("cloudflare-realip.inc")
    try:
        networks = fetch_all()
        current = re.findall(r"^set_real_ip_from (\S+);$", target.read_text(), flags=re.M)
        if set(current) == set(networks):
            print("PASS: committed Cloudflare CIDRs match both official lists.")
        elif args.write:
            target.write_text(render(networks))
            print("Updated local include only. Review the diff, commit, then validate/reload on the VPS with approval.")
        else:
            parser.exit(1, "Cloudflare ranges differ. Review and run --write locally; no file was changed.\n")
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f"Cloudflare refresh failed; no configuration activated: {error}\n")
