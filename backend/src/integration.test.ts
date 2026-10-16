import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "./app.js";
import { prisma } from "./db.js";
import { scenarios, scenariosForVersion } from "./scenarios/index.js";

const run = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;
const registration = { displayName: "Test Participant", telegramUsername: "@test_participant" };
const register = (overrides: Record<string, unknown> = {}) => request(app).post("/api/sessions").send({ ...registration, ...overrides });
const reasons: Record<string, string> = {
  "login-safety": "The URL uses the wrong domain",
  phishing: "An unexpected attachment requests macros",
  "social-engineering": "",
  "url-safety": "I did not initiate this sign in request",
  "permission-detective": "A calculator does not need microphone, contacts, or location access",
  ransomware: "Disconnecting can limit spread while IT handles the incident",
  "wifi-trap": "An attacker can copy a network name, so I cannot trust the name alone",
};
const payload = (index: number) => ({ scenarioId: scenarios[index].id, selectedAction: scenarios[index].correctAction, reason: reasons[scenarios[index].id] });

run("database-backed participant and admin API", () => {
  beforeAll(() => {
    if (process.env.TEST_DATABASE_ISOLATED !== "1") throw new Error("Use the isolated database test runner; never run integration fixtures against participant data.");
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it("reports database health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.database).toBe("reachable");
  });

  it("registers immediately using only Name and Telegram", async () => {
    const created = await register({ scenarioVersion: 2 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...registration, completed: false, totalScore: 0, scenarioVersion: 4 });
    expect(created.body).not.toHaveProperty("email");
    expect(created.body.sessionCode).toMatch(/^CA-[A-F0-9]{8}$/);
  });

  it.each([
    [{ displayName: "A" }, "name"], [{ displayName: "12345" }, "name"], [{ displayName: "A".repeat(81) }, "name"],
    [{ displayName: "" }, "name"], [{ telegramUsername: "abcd" }, "Telegram"],
    [{ telegramUsername: "a".repeat(33) }, "Telegram"], [{ telegramUsername: "has space" }, "Telegram"],
    [{ telegramUsername: "" }, "Telegram"],
  ])("retains identity validation for %j", async (overrides, field) => {
    const response = await register(overrides);
    expect(response.status).toBe(400);
    expect(response.body.error).toContain(field);
  });

  it("retains name and Telegram normalization and Unicode names", async () => {
    const created = await register({ displayName: "  أحمد   علي  ", telegramUsername: " test_user " });
    expect(created.status).toBe(201);
    expect(created.body.displayName).toBe("أحمد علي");
    expect(created.body.telegramUsername).toBe("@test_user");
  });

  it("removes OTP, delivery and training link endpoints", async () => {
    const created = await register();
    expect((await request(app).post("/api/email-verifications").send({ email: "example@example.com" })).status).toBe(404);
    expect((await request(app).post(`/api/sessions/${created.body.sessionCode}/training-email`)).status).toBe(404);
    expect((await request(app).get(`/api/training-link/${"a".repeat(48)}/safe`)).status).toBe(404);
    expect((await request(app).post(`/api/sessions/${created.body.sessionCode}/attempts`).send({ scenarioId: "inbox-challenge", selectedAction: "urgent-access-link" })).status).toBe(400);
  });

  it("creates unique parallel sessions even for identical identity fields", async () => {
    const created = await Promise.all(Array.from({ length: 8 }, () => register()));
    expect(created.every((response) => response.status === 201)).toBe(true);
    const codes = created.map((response) => response.body.sessionCode);
    expect(new Set(codes).size).toBe(8);
    for (let index = 0; index < scenarios.length; index++) {
      const answered = await Promise.all(codes.map((code) => request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))));
      expect(answered.every((response) => response.status === 200 && response.body.totalScore === (index + 1) * 20)).toBe(true);
    }
    for (const code of codes) expect((await request(app).get(`/api/sessions/${code}/results`)).body.totalScore).toBe(140);
  });

  it("resumes using the saved session code and keeps other participants isolated", async () => {
    const first = await register();
    const second = await register();
    const code = first.body.sessionCode;
    expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(0))).status).toBe(200);
    expect((await request(app).get(`/api/sessions/${code.toLowerCase()}`)).body).toMatchObject({ progress: 1, totalScore: 20 });
    const next = await request(app).get(`/api/sessions/${code}/scenario`);
    expect(next.body).toMatchObject({ progress: 1, totalScenarios: 7, scenario: { id: "phishing" } });
    expect((await request(app).get(`/api/sessions/${second.body.sessionCode}`)).body).toMatchObject({ progress: 0, totalScore: 0 });
    expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(0))).status).toBe(409);
  });

  it("preserves inactive participant records", async () => {
    const created = await register();
    await prisma.participantSession.update({ where: { sessionCode: created.body.sessionCode }, data: { updatedAt: new Date(Date.now() - 61 * 60_000) } });
    await register();
    expect((await request(app).get(`/api/sessions/${created.body.sessionCode}`)).status).toBe(200);
  });

  it("completes all seven scenarios in order with correct mixed scoring", async () => {
    const created = await register();
    const code = created.body.sessionCode;
    expect((await request(app).get(`/api/sessions/${code}/results`)).status).toBe(409);
    expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(1))).status).toBe(409);
    for (let index = 0; index < scenarios.length; index++) {
      const next = await request(app).get(`/api/sessions/${code}/scenario`);
      expect(next.body.scenario.id).toBe(scenarios[index].id);
      expect(next.body.scenario).not.toHaveProperty("correctAction");
      const answer = payload(index);
      if (index === 1) answer.selectedAction = scenarios[index].actions.find((action) => action.id !== answer.selectedAction)!.id;
      const saved = await request(app).post(`/api/sessions/${code}/attempts`).send(answer);
      expect(saved.status).toBe(200);
      expect(saved.body).toMatchObject({ progress: index + 1, totalScenarios: 7, completed: index === 6 });
    }
    const results = await request(app).get(`/api/sessions/${code}/results`);
    expect(results.status).toBe(200);
    expect(results.body).toMatchObject({ totalScore: 120, maximumScore: 140 });
    expect(results.body.answers).toHaveLength(7);
    expect((await request(app).get(`/api/sessions/${code}/scenario`)).status).toBe(409);
  });

  it("retains half-credit justification scoring", async () => {
    const created = await register();
    const weak = await request(app).post(`/api/sessions/${created.body.sessionCode}/attempts`).send({ ...payload(0), reason: "It looks strange" });
    expect(weak.status).toBe(200);
    expect(weak.body).toMatchObject({ correct: false, choiceCorrect: true, scoreAwarded: 10, totalScore: 10 });
  });

  it("ignores historical removed attempts and stale completion/score caches", async () => {
    const created = await register();
    const code = created.body.sessionCode;
    const session = await prisma.participantSession.update({ where: { sessionCode: code }, data: { scenarioVersion: 1, completed: true, totalScore: 40 } });
    await prisma.scenarioAttempt.create({ data: { sessionId: session.id, scenarioId: "inbox-challenge", selectedAction: "urgent-access-link", correct: true, score: 20 } });
    expect((await request(app).get(`/api/sessions/${code}`)).body).toMatchObject({ completed: false, totalScore: 0, progress: 0 });
    for (let index = 0; index < 4; index++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    // Legacy participant reached the former last scenario, but was never marked complete.
    await prisma.participantSession.update({ where: { id: session.id }, data: { completed: false, completedAt: null, totalScore: 100 } });
    const results = await request(app).get(`/api/sessions/${code}/results`);
    expect(results.status).toBe(200);
    expect(results.body).toMatchObject({ totalScore: 80, maximumScore: 80, completedAt: expect.any(String) });
    expect(results.body.answers).toHaveLength(4);
    expect(await prisma.scenarioAttempt.count({ where: { sessionId: session.id } })).toBe(5);
  });

  it.each([4, 5, 6])("keeps 20/10/0 scoring with written reasoning for new scenario %i", async (index) => {
    const scenario = scenarios[index];
    for (const expectedScore of [20, 10, 0]) {
      const created = await register();
      const code = created.body.sessionCode;
      for (let previous = 0; previous < index; previous++) {
        expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(previous))).status).toBe(200);
      }
      const before = await request(app).get(`/api/sessions/${code}/scenario`);
      expect(before.body).toMatchObject({ progress: index, totalScenarios: 7, scenario: { id: scenario.id } });
      for (const reason of ["", "   ", "123", "!!!", "a".repeat(241)]) {
        expect((await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(index), reason })).status).toBe(400);
      }
      const answer = payload(index);
      if (expectedScore === 10) answer.reason = "I chose this because the screen looks nice";
      if (expectedScore === 0) answer.selectedAction = scenario.actions.find((action) => action.id !== answer.selectedAction)!.id;
      const saved = await request(app).post(`/api/sessions/${code}/attempts`).send(answer);
      expect(saved.status).toBe(200);
      expect(saved.body).toMatchObject({ scoreAwarded: expectedScore, totalScore: index * 20 + expectedScore, progress: index + 1, completed: index === 6 });
      const resumed = await request(app).get(`/api/sessions/${code}`);
      expect(resumed.body).toMatchObject({ progress: index + 1, totalScore: index * 20 + expectedScore, maximumScore: 140 });
      if (index < 6) expect((await request(app).get(`/api/sessions/${code}/scenario`)).body.scenario.id).toBe(scenarios[index + 1].id);
    }
  });

  it.each([
    [4, "الحاسبة ما تحتاجش جهات الاتصال للحساب"],
    [5, "نفصل الشبكة لمنع انتشار البرمجية لباقي الاجهزة"],
    [6, "اسم الشبكة ممكن يتقلد من مهاجم"],
  ])("accepts natural Arabic reasoning for scenario %i", async (index, reason) => {
    const created = await register();
    const code = created.body.sessionCode;
    for (let previous = 0; previous < Number(index); previous++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(previous))).status).toBe(200);
    const before = await request(app).get(`/api/sessions/${code}/scenario`);
    for (const field of ["correctAction", "feedback", "reasonChoices", "evidenceRules", "concepts"]) expect(before.body.scenario).not.toHaveProperty(field);
    const saved = await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(Number(index)), reason: `  ${reason} \n ` });
    expect(saved.status).toBe(200);
    expect(saved.body.scoreAwarded).toBe(20);
    const session = await prisma.participantSession.findUniqueOrThrow({ where: { sessionCode: code } });
    const stored = await prisma.scenarioAttempt.findUniqueOrThrow({ where: { sessionId_scenarioId: { sessionId: session.id, scenarioId: scenarios[Number(index)].id } } });
    expect(stored.reason).toBe(reason);
  });

  it("does not regrade historical scores when written reasoning rules change", async () => {
    const created = await register();
    const code = created.body.sessionCode;
    for (let index = 0; index < 7; index++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    const session = await prisma.participantSession.findUniqueOrThrow({ where: { sessionCode: code } });
    await prisma.scenarioAttempt.updateMany({ where: { sessionId: session.id, scenarioId: "permission-detective" }, data: { reason: "Historical evidence selected before this release" } });
    expect((await request(app).get(`/api/sessions/${code}/results`)).body).toMatchObject({ totalScore: 140, maximumScore: 140 });
  });

  it("bounds untrusted written input without interpreting markup", async () => {
    const created = await register();
    const code = created.body.sessionCode;
    for (let index = 0; index < 4; index++) await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index));
    for (const reason of [null, {}, ["a reason"], 42]) expect((await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(4), reason })).status).toBe(400);
    const text = "<img src=x onerror=alert(1)> A calculator does not need microphone access";
    const saved = await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(4), reason: text });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ scoreAwarded: 10, choiceCorrect: true, justificationAccepted: false });
    expect(saved.body.feedback).not.toContain(text);
  });

  it("allows an existing unfinished four-game participant to finish without changing their maximum", async () => {
    const created = await register();
    const code = created.body.sessionCode;
    await prisma.participantSession.update({ where: { sessionCode: code }, data: { scenarioVersion: 1 } });
    for (let index = 0; index < 4; index++) {
      const next = await request(app).get(`/api/sessions/${code}/scenario`);
      expect(next.body).toMatchObject({ totalScenarios: 4, progress: index });
      expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    }
    expect((await request(app).get(`/api/sessions/${code}/results`)).body).toMatchObject({ maximumScore: 80, totalScore: 80 });
    expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(4))).status).toBe(409);
  });

  it("preserves unfinished version-2 sessions, including Network Defender completion and scores", async () => {
    const created = await register();
    const code = created.body.sessionCode;
    await prisma.participantSession.update({ where: { sessionCode: code }, data: { scenarioVersion: 2 } });
    for (let index = 0; index < 6; index++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    const next = await request(app).get(`/api/sessions/${code}/scenario`);
    expect(next.body).toMatchObject({ progress: 6, score: 120, totalScenarios: 7, scenario: { id: "network-defender" } });
    expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(6))).status).toBe(409);
    const legacy = scenariosForVersion(2)[6];
    const saved = await request(app).post(`/api/sessions/${code}/attempts`).send({ scenarioId: legacy.id, selectedAction: legacy.correctAction, reason: "Repeated failed logins may indicate an intrusion" });
    expect(saved.body).toMatchObject({ scoreAwarded: 20, completed: true, totalScore: 140 });
    const results = await request(app).get(`/api/sessions/${code}/results`);
    expect(results.body).toMatchObject({ totalScore: 140, maximumScore: 140 });
    expect(results.body.answers.map((answer: { scenarioId: string }) => answer.scenarioId)).toContain("network-defender");
    expect(results.body.answers.map((answer: { scenarioId: string }) => answer.scenarioId)).not.toContain("wifi-trap");
    const again = await request(app).get(`/api/sessions/${code}/results`);
    expect(again.body).toEqual(results.body);
    const session = await prisma.participantSession.findUniqueOrThrow({ where: { sessionCode: code } });
    expect(await prisma.scenarioAttempt.count({ where: { sessionId: session.id } })).toBe(7);
  });

  it.each(["caution-campus", "caution-campus-5g"])("scores %s as an incorrect most-caution selection even with strong reasoning", async (selectedAction) => {
    const created = await register();
    const code = created.body.sessionCode;
    for (let index = 0; index < 6; index++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    const deniedLegacy = await request(app).post(`/api/sessions/${code}/attempts`).send({ scenarioId: "network-defender", selectedAction: "failed-login-burst", reason: "Repeated failed logins may indicate an intrusion" });
    expect(deniedLegacy.status).toBe(409);
    const saved = await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(6), selectedAction });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ choiceCorrect: false, scoreAwarded: 0, totalScore: 120, completed: true });
  });

  it("rejects the removed fourth Wi-Fi action without changing active-session progress or scores", async () => {
    const created = await register({ scenarioVersion: 3 });
    expect(created.body.scenarioVersion).toBe(4);
    const code = created.body.sessionCode;
    for (let index = 0; index < 6; index++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    const before = await request(app).get(`/api/sessions/${code}/scenario`);
    expect(before.body.scenario.actions.map((action: { id: string }) => action.id)).toEqual(["caution-campus", "caution-guest-free", "caution-campus-5g"]);
    expect(JSON.stringify(before.body.scenario)).not.toMatch(/verify-with-staff|Verify the official network information/);
    const storedBefore = await prisma.participantSession.findUniqueOrThrow({ where: { sessionCode: code }, include: { attempts: { orderBy: { createdAt: "asc" } } } });
    const rejected = await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(6), selectedAction: "verify-with-staff", score: 20 });
    expect(rejected.status).toBe(400);
    expect(rejected.body).toEqual({ error: "Invalid scenario response" });
    expect((await request(app).get(`/api/sessions/${code}/scenario`)).body).toEqual(before.body);
    const storedAfter = await prisma.participantSession.findUniqueOrThrow({ where: { sessionCode: code }, include: { attempts: { orderBy: { createdAt: "asc" } } } });
    expect(storedAfter).toEqual(storedBefore);
    const saved = await request(app).post(`/api/sessions/${code}/attempts`).send(payload(6));
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ choiceCorrect: true, justificationAccepted: true, scoreAwarded: 20, completed: true, totalScore: 140 });
    expect(await prisma.scenarioAttempt.count({ where: { sessionId: storedAfter.id, selectedAction: "verify-with-staff" } })).toBe(0);
  });

  it.each([
    ["It has no password", 10],
    ["لانها بدون كلمة مرور", 10],
    ["The open network needs a check before connecting", 20],
    ["هذه شبكة غير مؤكدة لذلك أتعامل معها بحذر", 20],
  ])("scores the intended guest network with reasoning %s as %i", async (reason, score) => {
    const created = await register();
    const code = created.body.sessionCode;
    for (let index = 0; index < 6; index++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    for (const selectedAction of ["verify-with-staff", "connect-free", "unknown-network"]) {
      expect((await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(6), selectedAction })).status).toBe(400);
    }
    expect((await request(app).get(`/api/sessions/${code}/scenario`)).body.scenario.actions).toHaveLength(3);
    const saved = await request(app).post(`/api/sessions/${code}/attempts`).send({ ...payload(6), reason, score: 999, correct: true });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ choiceCorrect: true, scoreAwarded: score, totalScore: 120 + Number(score), completed: true });
    expect(saved.body.feedback).toContain("not automatically");
    expect((await request(app).get(`/api/sessions/${code}/results`)).body).toMatchObject({ totalScore: 120 + Number(score), maximumScore: 140 });
  });

  it.each([
    ["verify-with-staff", "An attacker can copy a network name", 20],
    ["verify-with-staff", "I like the colors", 10],
    ["connect-campus", "An attacker can copy a network name", 0],
    ["connect-free", "An attacker can copy a network name", 0],
    ["connect-official", "An attacker can copy a network name", 0],
  ])("preserves version-3 answer %s and reasoning %s at %i points", async (selectedAction, reason, score) => {
    const created = await register();
    const code = created.body.sessionCode;
    await prisma.participantSession.update({ where: { sessionCode: code }, data: { scenarioVersion: 3 } });
    for (let index = 0; index < 6; index++) expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(index))).status).toBe(200);
    const before = await request(app).get(`/api/sessions/${code}/scenario`);
    expect(before.body.scenario.actions).toHaveLength(4);
    expect(before.body.scenario.prompt).toBe("What is the safest action before connecting?");
    expect((await request(app).post(`/api/sessions/${code}/attempts`).send(payload(6))).status).toBe(400);
    const saved = await request(app).post(`/api/sessions/${code}/attempts`).send({ scenarioId: "wifi-trap", selectedAction, reason });
    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ scoreAwarded: score, completed: true, totalScore: 120 + Number(score) });
    const results = await request(app).get(`/api/sessions/${code}/results`);
    expect(results.body).toMatchObject({ totalScore: 120 + Number(score), maximumScore: 140, completedAt: expect.any(String) });
    expect((await request(app).get(`/api/sessions/${code}/results`)).body).toEqual(results.body);
    const stored = await prisma.participantSession.findUniqueOrThrow({ where: { sessionCode: code }, include: { attempts: true } });
    expect(stored.scenarioVersion).toBe(3);
    expect(stored.attempts).toHaveLength(7);
    expect(stored.attempts.find((attempt) => attempt.scenarioId === "wifi-trap")).toMatchObject({ selectedAction, reason, score });
  });

  it("rejects password-bearing payloads without storing them", async () => {
    const marker = "THIS-MUST-NEVER-LEAVE-THE-BROWSER-93741";
    const created = await register();
    expect((await request(app).post(`/api/sessions/${created.body.sessionCode}/attempts`).send({ ...payload(0), password: marker })).status).toBe(400);
    expect(await prisma.scenarioAttempt.findFirst({ where: { selectedAction: { contains: marker } } })).toBeNull();
  });

  it("preserves admin authentication and reports current scores and statistics", async () => {
    expect((await request(app).get("/api/admin/stats")).status).toBe(401);
    const agent = request.agent(app);
    expect((await agent.post("/api/admin/login").send({ password: "wrong" })).status).toBe(401);
    expect((await agent.post("/api/admin/login").send({ password: process.env.ADMIN_PASSWORD ?? "development-only-admin-password" })).status).toBe(200);
    const stats = await agent.get("/api/admin/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.scenarios).toHaveLength(7);
    expect(stats.body.scenarios.map((row: { id: string }) => row.id)).toContain("wifi-trap");
    expect(stats.body.scenarios.map((row: { id: string }) => row.id)).not.toContain("network-defender");
    expect(stats.body.maximumScore).toBe(140);
    const wifiStats = stats.body.scenarios.find((row: { id: string }) => row.id === "wifi-trap");
    expect(wifiStats.attempts).toBe(await prisma.scenarioAttempt.count({ where: { scenarioId: "wifi-trap" } }));
    expect(await prisma.scenarioAttempt.count({ where: { scenarioId: "network-defender" } })).toBeGreaterThan(0);
    expect(stats.body.commonIncorrectActions.every((row: { scenarioId: string }) => row.scenarioId !== "inbox-challenge")).toBe(true);
    const sessions = await agent.get("/api/admin/sessions");
    expect(sessions.status).toBe(200);
    const completed = sessions.body.filter((session: { completed: boolean }) => session.completed);
    expect(stats.body.completedSessions).toBe(completed.length);
    expect(stats.body.averagePercentage).toBe(Math.round(completed.reduce((sum: number, session: { totalScore: number; maximumScore: number }) => sum + session.totalScore / session.maximumScore * 100, 0) / completed.length * 10) / 10);
    expect(stats.body.averageScore).toBe(Math.round(completed.reduce((sum: number, session: { totalScore: number }) => sum + session.totalScore, 0) / completed.length * 10) / 10);
    expect(sessions.body.every((session: { totalScore: number; attempts: unknown[] }) => session.totalScore <= 140 && session.attempts.length <= 7)).toBe(true);
    expect(sessions.body[0]).toMatchObject({ ...registration, sessionCode: expect.any(String) });
    expect(sessions.body[0]).not.toHaveProperty("email");
  });
});
