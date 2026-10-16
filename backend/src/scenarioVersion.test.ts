import { describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { currentSession } from "./progress.js";
import { scenarios, scenariosForVersion } from "./scenarios/index.js";

const script = fileURLToPath(new URL("../../scripts/apply-turso-scenario-version.mjs", import.meta.url));
describe("scenario version compatibility", () => {
  it("retains completed four-game results and resumes partial four-game progress", () => {
    const completedAt = new Date("2026-10-14T12:00:00Z");
    const attempts = scenarios.slice(0, 4).map((scenario) => ({ scenarioId: scenario.id, score: 20, createdAt: completedAt }));
    const legacy = currentSession({ scenarioVersion: 1, completedAt, attempts });
    expect(legacy).toMatchObject({ completed: true, completedAt, totalScore: 80, maximumScore: 80, totalScenarios: 4 });
    expect(currentSession({ scenarioVersion: 1, completedAt: null, attempts: attempts.slice(0, 2) })).toMatchObject({ completed: false, totalScore: 40, maximumScore: 80, totalScenarios: 4 });
    expect(currentSession({ scenarioVersion: 2, completedAt: null, attempts })).toMatchObject({ completed: false, totalScore: 80, maximumScore: 140, totalScenarios: 7 });
  });

  it("keeps completed version-2 Network Defender results separate from new Wi-Fi sessions", () => {
    const completedAt = new Date("2026-10-14T12:00:00Z");
    const attempts = scenariosForVersion(2).map((scenario) => ({ scenarioId: scenario.id, score: 20, createdAt: completedAt }));
    expect(currentSession({ scenarioVersion: 2, completedAt, attempts })).toMatchObject({ completed: true, totalScore: 140, maximumScore: 140, completedAt });
    const partial = currentSession({ scenarioVersion: 2, completedAt: null, attempts: attempts.slice(0, 6) });
    expect(partial).toMatchObject({ completed: false, totalScore: 120, totalScenarios: 7 });
    expect(scenariosForVersion(2)[partial.attempts.length].id).toBe("network-defender");
    expect(scenariosForVersion(3)[6].id).toBe("wifi-trap");
  });

  it("retains completed and in-progress version-3 Wi-Fi sessions with their old answer contract", () => {
    const completedAt = new Date("2026-10-15T12:00:00Z");
    const attempts = scenariosForVersion(3).map((scenario) => ({ scenarioId: scenario.id, score: 20, createdAt: completedAt }));
    expect(currentSession({ scenarioVersion: 3, completedAt, attempts })).toMatchObject({ completed: true, totalScore: 140, maximumScore: 140, completedAt });
    const partial = currentSession({ scenarioVersion: 3, completedAt: null, attempts: attempts.slice(0, 6) });
    expect(partial).toMatchObject({ completed: false, totalScore: 120, totalScenarios: 7 });
    const legacy = scenariosForVersion(3)[partial.attempts.length];
    expect(legacy.actions).toHaveLength(4);
    expect(legacy.correctAction).toBe("verify-with-staff");
    expect(scenariosForVersion(4)[6].actions).toHaveLength(3);
    expect(scenariosForVersion(4)[6].correctAction).toBe("caution-guest-free");
  });

  it("adds a version without changing existing participant or attempt data and safely runs twice", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "cyberlab-version-"));
    const url = `file:${path.join(directory, "legacy.db")}`;
    let db = createClient({ url });
    try {
      await db.executeMultiple(await readFile(new URL("../test-fixtures/four-scenario-schema.sql", import.meta.url), "utf8"));
      await db.execute(`INSERT INTO "ParticipantSession" ("id", "sessionCode", "displayName", "telegramUsername", "totalScore", "completed", "updatedAt") VALUES ('old', 'CA-ABCDEF01', 'Legacy Participant', '@legacy_user', 80, true, CURRENT_TIMESTAMP)`);
      for (const scenario of scenarios.slice(0, 4)) await db.execute({ sql: `INSERT INTO "ScenarioAttempt" ("id", "sessionId", "scenarioId", "selectedAction", "correct", "score") VALUES (?, 'old', ?, ?, true, 20)`, args: [scenario.id, scenario.id, scenario.correctAction] });
      const before = (await db.execute('SELECT * FROM "ParticipantSession"')).rows[0];
      const attempts = (await db.execute('SELECT * FROM "ScenarioAttempt" ORDER BY "id"')).rows;
      for (let run = 0; run < 2; run++) {
        const result = spawnSync(process.execPath, [script], { env: { ...process.env, TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: "" }, encoding: "utf8" });
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);
      }
      db.close();
      db = createClient({ url });
      const { scenarioVersion, ...after } = (await db.execute('SELECT * FROM "ParticipantSession"')).rows[0];
      expect(scenarioVersion).toBe(1);
      expect(after).toEqual(before);
      expect((await db.execute('SELECT * FROM "ScenarioAttempt" ORDER BY "id"')).rows).toEqual(attempts);
    } finally { db.close(); }
  });
});
