import { describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../scripts/apply-turso-remove-email-migration.mjs", import.meta.url));
describe("email-removal migration", () => {
  it("requires a backup acknowledgement before opening a database", () => {
    const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Back up the database first");
  });

  it("preserves identities, participant and attempt rows while removing email/OTP data", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "cyberlab-migration-"));
    const url = `file:${path.join(directory, "legacy.db")}`;
    const db = createClient({ url });
    try {
      await db.executeMultiple(await readFile(new URL("../test-fixtures/legacy-email-schema.sql", import.meta.url), "utf8"));
      for (let participant = 0; participant < 3; participant++) {
        await db.execute({ sql: `INSERT INTO "ParticipantSession" ("id", "sessionCode", "displayName", "telegramUsername", "email", "totalScore", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, args: [`legacy-${participant}`, `CA-0000000${participant}`, "أحمد علي", "@legacy_user", "old@example.com", 100] });
        const ids = ["login-safety", "phishing", "social-engineering", "url-safety", "inbox-challenge"];
        // Complete all five, awaiting the old final scenario, and partial plus historical inbox attempt.
        const indices = participant === 0 ? [0, 1, 2, 3, 4] : participant === 1 ? [0, 1, 2, 3] : [0, 4];
        for (const index of indices) await db.execute({ sql: `INSERT INTO "ScenarioAttempt" ("id", "sessionId", "scenarioId", "selectedAction", "reason", "correct", "score") VALUES (?, ?, ?, 'legacy-answer', 'retained evidence', true, 20)`, args: [`attempt-${participant}-${index}`, `legacy-${participant}`, ids[index]] });
      }
      await db.execute(`INSERT INTO "EmailVerification" ("id", "email", "codeHash", "expiresAt", "sentAt", "windowStart") VALUES ('otp', 'old@example.com', 'old-hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
      const beforeAttempts = (await db.execute('SELECT * FROM "ScenarioAttempt" ORDER BY "id"')).rows;
      const beforeIdentity = (await db.execute('SELECT "id", "sessionCode", "displayName", "telegramUsername", "startedAt", "updatedAt" FROM "ParticipantSession" ORDER BY "id"')).rows;
      const result = spawnSync(process.execPath, [script, "--backup-confirmed"], { env: { ...process.env, TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "" }, encoding: "utf8" });
      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
      expect((await db.execute('SELECT * FROM "ScenarioAttempt" ORDER BY "id"')).rows).toEqual(beforeAttempts);
      expect((await db.execute('SELECT "id", "sessionCode", "displayName", "telegramUsername", "startedAt", "updatedAt" FROM "ParticipantSession" ORDER BY "id"')).rows).toEqual(beforeIdentity);
      const state = (await db.execute('SELECT "totalScore", "completed", "completedAt" FROM "ParticipantSession" ORDER BY "id"')).rows;
      expect(state.map((row) => [row.totalScore, row.completed])).toEqual([[80, 1], [80, 1], [20, 0]]);
      expect(state[0].completedAt).toBeTruthy();
      expect(state[1].completedAt).toBeTruthy();
      expect(state[2].completedAt).toBeNull();
      expect((await db.execute('PRAGMA table_info("ParticipantSession")')).rows.map((row) => row.name)).not.toContain("email");
      expect((await db.execute("SELECT name FROM sqlite_master WHERE name = 'EmailVerification'")).rows).toHaveLength(0);
      expect((await db.execute("PRAGMA foreign_key_check")).rows).toHaveLength(0);
    } finally { db.close(); }
  });
});
