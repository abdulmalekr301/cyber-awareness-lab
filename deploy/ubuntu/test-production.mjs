// Local-only startup check: stages the compiled application and a NEW temporary
// libSQL database. It never loads a configured event database or runs migrations.
import assert from "node:assert/strict";
import { once } from "node:events";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

const root = fileURLToPath(new URL("../../", import.meta.url));
const stage = await mkdtemp(path.join(tmpdir(), "cyberlab-production-smoke-"));
const dbUrl = `file:${path.join(stage, "isolated.db")}`;
let server;
try {
  await writeFile(path.join(stage, "package.json"), '{"type":"module"}\n');
  await symlink(path.join(root, "node_modules"), path.join(stage, "node_modules"), "dir");
  await cp(path.join(root, "backend/dist"), path.join(stage, "backend/dist"), { recursive: true });
  // Match the Dockerfile's generated-client COPY, which plain tsc does not do.
  await cp(path.join(root, "backend/src/generated/turso"), path.join(stage, "backend/dist/generated/turso"), { recursive: true });
  await cp(path.join(root, "frontend/dist"), path.join(stage, "frontend/dist"), { recursive: true });
  const db = createClient({ url: dbUrl });
  try { await db.executeMultiple(await readFile(path.join(root, "prisma/turso-init.sql"), "utf8")); }
  finally { db.close(); }
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  const base = `http://127.0.0.1:${port}`;
  const env = { ...process.env, NODE_ENV: "production", PORT: String(port), DATABASE_URL: "", TURSO_DATABASE_URL: dbUrl,
    TURSO_AUTH_TOKEN: "", PUBLIC_BASE_URL: base, ADMIN_PASSWORD: "isolated-production-smoke-admin-password",
    SESSION_SECRET: "isolated-production-smoke-secret-at-least-32-characters" };
  async function start() {
    server = spawn(process.execPath, [path.join(stage, "backend/dist/server.js")], { cwd: stage, env, stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    server.stdout.on("data", chunk => { log += chunk; });
    server.stderr.on("data", chunk => { log += chunk; });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(`Compiled server exited: ${log.slice(-2000)}`);
      try { const response = await fetch(`${base}/api/health`); if (response.ok) return; } catch { /* startup */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Compiled server did not become healthy");
  }
  async function stop() {
    if (!server || server.exitCode !== null) return;
    const exiting = once(server, "exit");
    server.kill("SIGTERM");
    const timer = setTimeout(() => server.kill("SIGKILL"), 5000);
    try { await exiting; } finally { clearTimeout(timer); }
  }
  async function request(url, { status = 200, method = "GET", body, cookie } = {}) {
    const response = await fetch(`${base}${url}`, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.status, status, `${method} ${url}: ${response.status}`);
    return { data: await response.json(), response };
  }
  const { scenarios } = await import(pathToFileURL(path.join(root, "backend/dist/scenarios/index.js")));
  const reasons = ["The URL uses the wrong domain", "An unexpected attachment requests macros", "",
    "I did not initiate this sign in request", "A calculator does not need microphone access",
    "Disconnecting can limit spread while IT handles the incident", "The open network needs a check before connecting"];
  await start();
  const page = await fetch(base);
  assert.equal(page.status, 200);
  const html = await page.text();
  const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
  assert.ok(asset, "Built HTML must reference a JavaScript asset");
  const javascript = await fetch(base + asset);
  assert.equal(javascript.status, 200);
  assert.ok((await javascript.text()).includes("Campus_Guest_Free"));
  const registration = (await request("/api/sessions", { status: 201, method: "POST",
    body: { displayName: "Isolated Startup Check", telegramUsername: "@isolated_startup" } })).data;
  assert.equal(registration.scenarioVersion, 4);
  assert.equal(scenarios.length, 7);
  for (const [index, scenario] of scenarios.entries()) {
    const next = (await request(`/api/sessions/${registration.sessionCode}/scenario`)).data;
    assert.equal(next.scenario.id, scenario.id);
    assert.equal(next.totalScenarios, 7);
    assert.ok(!Object.hasOwn(next.scenario, "correctAction"));
    if (scenario.id === "wifi-trap") {
      assert.equal(next.scenario.actions.length, 3);
      await request(`/api/sessions/${registration.sessionCode}/attempts`, { method: "POST", status: 400,
        body: { scenarioId: scenario.id, selectedAction: "verify-with-staff", reason: reasons[index] } });
    }
    const answer = (await request(`/api/sessions/${registration.sessionCode}/attempts`, { method: "POST",
      body: { scenarioId: scenario.id, selectedAction: scenario.correctAction, reason: reasons[index] } })).data;
    assert.equal(answer.scoreAwarded, 20);
    assert.equal(answer.totalScore, (index + 1) * 20);
  }
  const results = (await request(`/api/sessions/${registration.sessionCode}/results`)).data;
  assert.equal(results.totalScore, 140);
  assert.equal(results.maximumScore, 140);
  await request("/api/admin/stats", { status: 401 });
  await request("/api/admin/login", { method: "POST", status: 401, body: { password: "wrong" } });
  const login = await request("/api/admin/login", { method: "POST", body: { password: env.ADMIN_PASSWORD } });
  const cookie = login.response.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);
  assert.match(login.response.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(login.response.headers.get("set-cookie"), /SameSite=Strict/i);
  assert.equal((await request("/api/admin/stats", { cookie })).data.completedSessions, 1);
  await stop();
  await start();
  assert.deepEqual((await request(`/api/sessions/${registration.sessionCode}/results`)).data, results);
  assert.equal((await request("/api/admin/stats", { cookie })).data.completedSessions, 1);
  await stop();
  console.log("PASS: compiled production startup, built frontend/assets, isolated database, all seven games/140 points, removed action rejected, admin authentication and participant/admin persistence across restart.");
} finally {
  if (server && server.exitCode === null) {
    const exiting = once(server, "exit");
    server.kill("SIGKILL");
    await exiting;
  }
  await rm(stage, { recursive: true, force: true });
}
