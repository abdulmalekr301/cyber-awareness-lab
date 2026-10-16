import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = await mkdtemp(path.join(tmpdir(), "cyberlab-test-"));
const url = `file:${path.join(directory, "test.db")}`;
const db = createClient({ url });
try { await db.executeMultiple(await readFile(new URL("../prisma/turso-init.sql", import.meta.url), "utf8")); }
finally { db.close(); }
const result = spawnSync(process.execPath, [path.join(root, "node_modules/vitest/vitest.mjs"), "run", "src/integration.test.ts"], {
  cwd: path.join(root, "backend"), stdio: "inherit",
  env: { ...process.env, NODE_ENV: "test", RUN_DB_TESTS: "1", TEST_DATABASE_ISOLATED: "1", TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "", ADMIN_PASSWORD: "isolated-test-admin-password" },
});
process.exitCode = result.status ?? 1;
