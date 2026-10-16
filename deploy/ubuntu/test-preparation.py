#!/usr/bin/env python3
"""Exercise exposure/secret guards against Docker Compose's resolved model."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

directory = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("deployment_validation", directory / "validate.py")
validation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation)


class DeploymentPreparation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="cyberlab-deployment-check-")
        cls.env_file = Path(cls.temporary.name) / "production.env"
        subprocess.run(["python3", str(directory / "create-env.py"), str(cls.env_file)], check=True, capture_output=True)
        cls.env = {**os.environ, "CYBERLAB_ENV_FILE": str(cls.env_file),
                   "COMPOSE_FILE": "/this-must-not-be-used.yaml", "COMPOSE_PROJECT_NAME": "unrelated-project",
                   "DOCKER_HOST": "tcp://this-must-not-be-contacted.invalid:2375", "DOCKER_CONTEXT": "unrelated-context",
                   "POSTGRES_USER": "unrelated_database_user", "PUBLIC_BASE_URL": "https://unrelated.invalid",
                   "ADMIN_PASSWORD": "must-not-override-the-private-env-file"}
        output = subprocess.run(["bash", str(directory / "cyberlab"), "--profile", "maintenance", "config", "--format", "json"],
                                env=cls.env, capture_output=True, text=True)
        if output.returncode:
            raise RuntimeError("Compose rendering failed; no output printed because it may contain secrets")
        cls.model = json.loads(output.stdout)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def test_valid_private_model_and_ambient_context_isolation(self):
        validation.validate(self.model)
        self.assertEqual(self.model["services"]["postgres"]["environment"]["POSTGRES_USER"], "cyberlab")
        self.assertEqual(self.model["services"]["app"]["environment"]["PUBLIC_BASE_URL"], "http://localhost:8080")
        self.assertNotEqual(self.model["services"]["app"]["environment"]["ADMIN_PASSWORD"], self.env["ADMIN_PASSWORD"])

    def test_secret_file_is_private_and_cannot_be_overwritten(self):
        self.assertEqual(self.env_file.stat().st_mode & 0o777, 0o600)
        before = self.env_file.read_bytes()
        result = subprocess.run(["python3", str(directory / "create-env.py"), str(self.env_file)], capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(before, self.env_file.read_bytes())

    def test_public_proxy_binding_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["nginx"]["ports"][0]["host_ip"] = "0.0.0.0"
        with self.assertRaises(ValueError):
            validation.validate(model)

    def test_published_database_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["postgres"]["ports"] = [{"target": 5432, "published": "5432", "host_ip": "127.0.0.1"}]
        with self.assertRaises(ValueError):
            validation.validate(model)

    def test_privileged_app_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["app"]["privileged"] = True
        with self.assertRaises(ValueError):
            validation.validate(model)

    def test_host_network_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["app"]["network_mode"] = "host"
        with self.assertRaises(ValueError):
            validation.validate(model)

    def test_existing_backup_directory_mount_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["app"]["volumes"] = [{"type": "bind", "source": "/srv/restic", "target": "/data", "read_only": True}]
        with self.assertRaises(ValueError):
            validation.validate(model)

    def test_ambient_turso_mode_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["app"]["environment"]["TURSO_DATABASE_URL"] = "file:/tmp/unwanted.db"
        with self.assertRaises(ValueError):
            validation.validate(model)

    def test_automatic_startup_migration_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["app"]["command"] = ["sh", "-c", "npx prisma migrate deploy && node backend/dist/server.js"]
        with self.assertRaises(ValueError):
            validation.validate(model)

    def test_ephemeral_database_is_rejected(self):
        model = copy.deepcopy(self.model)
        model["services"]["postgres"]["volumes"] = []
        with self.assertRaises(ValueError):
            validation.validate(model)


if __name__ == "__main__":
    unittest.main(verbosity=2)
