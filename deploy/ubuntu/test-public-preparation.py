#!/usr/bin/env python3
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

directory = Path(__file__).resolve().parent


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, directory / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


origin = module("public_origin", "set-public-origin.py")
ranges = module("cloudflare_ranges", "update-cloudflare-ips.py")


class PublicPreparation(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="cyberlab-public-preparation-")
        self.path = Path(self.temporary.name) / "production.env"
        self.original = b"# keep this comment\nPOSTGRES_PASSWORD=unchanged-db\nADMIN_PASSWORD=unchanged-admin\nSESSION_SECRET=unchanged-secret\nPUBLIC_BASE_URL=http://localhost:8080\nCYBERLAB_RELEASE=unchanged-release\n"
        self.path.write_bytes(self.original)
        self.path.chmod(0o600)

    def tearDown(self):
        self.temporary.cleanup()

    def test_dry_run_does_not_change_environment(self):
        self.assertTrue(origin.update(self.path, "https://gameserver.ly"))
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_apply_changes_only_origin_and_preserves_mode_owner(self):
        before = self.path.stat()
        origin.update(self.path, "https://gameserver.ly", True)
        self.assertEqual(self.path.read_bytes(), self.original.replace(b"http://localhost:8080", b"https://gameserver.ly"))
        after = self.path.stat()
        self.assertEqual(after.st_mode & 0o777, 0o600)
        self.assertEqual((after.st_uid, after.st_gid), (before.st_uid, before.st_gid))

    def test_rollback_changes_only_origin(self):
        origin.update(self.path, "https://gameserver.ly", True)
        origin.update(self.path, "http://localhost:8080", True)
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_duplicate_origin_is_rejected(self):
        self.path.write_bytes(self.original + b"PUBLIC_BASE_URL=http://127.0.0.1:8080\n")
        before = self.path.read_bytes()
        with self.assertRaises(ValueError):
            origin.update(self.path, "https://gameserver.ly", True)
        self.assertEqual(self.path.read_bytes(), before)

    def test_missing_origin_is_rejected(self):
        self.path.write_bytes(b"ADMIN_PASSWORD=keep\n")
        with self.assertRaises(ValueError):
            origin.update(self.path, "https://gameserver.ly", True)

    def test_spaced_exported_duplicate_is_rejected(self):
        self.path.write_bytes(self.original + b" export PUBLIC_BASE_URL = https://unapproved.invalid\n")
        before = self.path.read_bytes()
        with self.assertRaises(ValueError):
            origin.update(self.path, "https://gameserver.ly", True)
        self.assertEqual(self.path.read_bytes(), before)

    def test_unapproved_origin_is_rejected(self):
        with self.assertRaises(ValueError):
            origin.update(self.path, "https://unapproved.invalid", True)
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_symlink_is_rejected(self):
        link = self.path.with_name("link.env")
        link.symlink_to(self.path)
        with self.assertRaises(ValueError):
            origin.update(link, "https://gameserver.ly", True)
        self.assertEqual(self.path.read_bytes(), self.original)

    def test_shared_secret_file_is_rejected(self):
        self.path.chmod(0o644)
        with self.assertRaises(ValueError):
            origin.update(self.path, "https://gameserver.ly", True)

    def test_current_cloudflare_include_has_global_v4_and_v6_only(self):
        import re
        import ipaddress
        text = (directory / "cloudflare-realip.inc").read_text()
        cidrs = re.findall(r"^set_real_ip_from (\S+);$", text, re.M)
        self.assertEqual(len(cidrs), len(set(cidrs)))
        self.assertEqual({ipaddress.ip_network(cidr).version for cidr in cidrs}, {4, 6})
        for cidr in cidrs:
            version = ipaddress.ip_network(cidr).version
            self.assertEqual(ranges.parse(cidr, version), [cidr])

    def test_bad_or_broad_cloudflare_ranges_are_rejected(self):
        for value in ["", "0.0.0.0/0", "127.0.0.1/32", "10.0.0.0/8", "<html>error</html>", "2606:4700::/32"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                ranges.parse(value, 4)

    def test_vhost_has_exact_names_without_default_or_wildcards(self):
        import re
        text = (directory / "cyberlab-public.conf").read_text()
        directives = re.sub(r"#.*", "", text)
        self.assertNotIn("default_server", directives)
        self.assertEqual(re.findall(r"server_name\s+([^;]+);", directives), ["gameserver.ly www.gameserver.ly"] * 2)
        self.assertEqual(directives.count("include /etc/nginx/cyberlab/cloudflare-realip.inc;"), 2)
        self.assertIn("proxy_pass http://127.0.0.1:8080;", directives)
        self.assertNotIn("$proxy_add_x_forwarded_for", directives)

    def test_certificate_and_key_names_are_ignored_by_git(self):
        scratch = Path(self.temporary.name) / "git-check"
        scratch.mkdir()
        shutil.copyfile(directory.parent.parent / ".gitignore", scratch / ".gitignore")
        subprocess.run(["git", "init", "--quiet", str(scratch)], check=True, capture_output=True)
        for name in ["gameserver.ly.pem", "gameserver.ly.key", "nested/private.key", "nested/cert.crt", "archive.pfx"]:
            result = subprocess.run(["git", "-C", str(scratch), "check-ignore", "--no-index", name], capture_output=True)
            self.assertEqual(result.returncode, 0, name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
