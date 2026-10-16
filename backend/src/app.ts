import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";
import { config } from "./config.js";
import { scenarios, scenarioMap, toPublicScenario, currentScenarioVersion, scenariosForVersion } from "./scenarios/index.js";
import { ADMIN_COOKIE, hashToken, makeToken, passwordsMatch, requireAdmin } from "./security.js";
import { justificationMatches } from "./justification.js";
import { currentSession } from "./progress.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.publicBaseUrl || true, credentials: true }));
app.use(express.json({ limit: "16kb", strict: true }));
app.use(cookieParser());
// Event traffic commonly arrives through one NAT address. Keep a generous abuse
// ceiling here; sensitive admin login attempts have a separate strict limiter.
app.use("/api", rateLimit({ windowMs: 60_000, limit: 6_000, standardHeaders: "draft-8", legacyHeaders: false }));

const sessionSelect = { sessionCode: true, displayName: true, telegramUsername: true, scenarioVersion: true, startedAt: true, completedAt: true, totalScore: true, completed: true } as const;
const codePattern = /^CA-[A-F0-9]{8}$/;
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]{1,79}$/u;
const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
function validCode(code: string) { return codePattern.test(code.toUpperCase()); }
async function getSession(code: string) {
  if (!validCode(code)) return null;
  const session = await prisma.participantSession.findUnique({ where: { sessionCode: code.toUpperCase() }, include: { attempts: { orderBy: { createdAt: "asc" } } } });
  return session ? currentSession(session) : null;
}

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "reachable" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

app.post("/api/sessions", async (req, res, next) => {
  try {
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim().replace(/\s+/g, " ") : "";
    const telegramUsername = typeof req.body?.telegramUsername === "string" ? `@${req.body.telegramUsername.trim().replace(/^@/, "")}` : "";
    if (!namePattern.test(displayName)) return res.status(400).json({ error: "Enter a valid name using 2 to 80 letters." });
    if (!telegramPattern.test(telegramUsername)) return res.status(400).json({ error: "Enter a Telegram username with 5 to 32 letters, numbers, or underscores." });
    const sessionCode = `CA-${randomBytes(4).toString("hex").toUpperCase()}`;
    const session = await prisma.participantSession.create({
      data: { sessionCode, displayName, telegramUsername, scenarioVersion: currentScenarioVersion },
      select: sessionSelect,
    });
    res.status(201).json(session);
  } catch (error) { next(error); }
});

app.get("/api/sessions/:sessionCode", async (req, res, next) => {
  try {
    const session = await getSession(req.params.sessionCode);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ ...session, progress: session.attempts.length, attempts: undefined });
  } catch (error) { next(error); }
});

app.get("/api/sessions/:sessionCode/scenario", async (req, res, next) => {
  try {
    const session = await getSession(req.params.sessionCode);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.completed || session.attempts.length >= session.totalScenarios) return res.status(409).json({ error: "Simulation already complete" });
    res.json({ scenario: toPublicScenario(scenariosForVersion(session.scenarioVersion).find((scenario) => !session.attempts.some((attempt) => attempt.scenarioId === scenario.id))!), progress: session.attempts.length, totalScenarios: session.totalScenarios, score: session.totalScore });
  } catch (error) { next(error); }
});

app.post("/api/sessions/:sessionCode/attempts", async (req, res, next) => {
  try {
    const { scenarioId, selectedAction, reason } = req.body ?? {};
    if (typeof scenarioId !== "string" || typeof selectedAction !== "string") return res.status(400).json({ error: "scenarioId and selectedAction are required" });
    if (Object.keys(req.body).some((key) => /password|credential|token/i.test(key))) return res.status(400).json({ error: "Sensitive values must never be submitted" });
    const knownScenario = scenarioMap.get(scenarioId);
    if (!knownScenario || (scenarioId !== "wifi-trap" && !knownScenario.actions.some((action) => action.id === selectedAction))) return res.status(400).json({ error: "Invalid scenario response" });
    const requiresReason = scenarioId !== "social-engineering";
    const writtenMiniGame = ["permission-detective", "ransomware", "network-defender", "wifi-trap"].includes(scenarioId);
    const normalizedReason = typeof reason === "string"
      ? writtenMiniGame ? reason.normalize("NFC").replace(/\s+/gu, " ").trim() : reason.trim()
      : "";
    if (writtenMiniGame && (typeof reason !== "string" || reason.length > 240 || (normalizedReason.match(/\p{L}/gu)?.length ?? 0) < 3)) return res.status(400).json({ error: "Write a short explanation using 3 to 240 characters and at least three letters" });
    if ((requiresReason && normalizedReason.length < 3) || normalizedReason.length > 240) return res.status(400).json({ error: "A brief reason is required" });
    const code = req.params.sessionCode.toUpperCase();
    if (!validCode(code)) return res.status(404).json({ error: "Session not found" });

    const result = await prisma.$transaction(async (tx) => {
      const storedSession = await tx.participantSession.findUnique({ where: { sessionCode: code }, include: { attempts: true } });
      if (!storedSession) return { status: 404 as const, body: { error: "Session not found" } };
      const session = currentSession(storedSession);
      if (session.completed) return { status: 409 as const, body: { error: "Simulation already complete" } };
      const expected = scenariosForVersion(session.scenarioVersion).find((scenario) => !session.attempts.some((attempt) => attempt.scenarioId === scenario.id))!;
      if (!expected || expected.id !== scenarioId) return { status: 409 as const, body: { error: "This is not the current scenario" } };
      // The same Wi-Fi scenario ID has different answer contracts in versions 3 and 4.
      const scenario = expected;
      if (!scenario.actions.some((action) => action.id === selectedAction)) return { status: 400 as const, body: { error: "Invalid scenario response" } };
      const choiceCorrect = scenario.correctAction === selectedAction;
      const justificationAccepted = requiresReason ? justificationMatches(scenarioId, normalizedReason, session.scenarioVersion) : true;
      const correct = choiceCorrect && justificationAccepted;
      const score = choiceCorrect ? (justificationAccepted ? 20 : 10) : 0;
      await tx.scenarioAttempt.create({ data: { sessionId: session.id, scenarioId, selectedAction, reason: normalizedReason || null, correct, score } });
      const progress = session.attempts.length + 1;
      const totalScore = session.totalScore + score;
      const completed = progress === session.totalScenarios;
      await tx.participantSession.update({ where: { id: session.id }, data: { totalScore, completed, completedAt: completed ? new Date() : null } });
      const feedback = choiceCorrect && !justificationAccepted
        ? writtenMiniGame ? `Your action is correct, but the explanation does not identify the key security clue. Half credit was awarded. ${scenario.feedback.correct.replace(/^Correct\. /, "")}` : "Your choice is correct, but the justification does not identify the key security clue. Half credit was awarded. Explain the evidence that supports the decision."
        : correct ? scenario.feedback.correct : scenario.feedback.incorrect;
      return { status: 200 as const, body: { correct, choiceCorrect, justificationAccepted, scoreAwarded: score, feedback, progress, totalScenarios: session.totalScenarios, totalScore, completed } };
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return res.status(409).json({ error: "Attempt already recorded; refresh to continue" });
    next(error);
  }
});

app.get("/api/sessions/:sessionCode/results", async (req, res, next) => {
  try {
    const session = await getSession(req.params.sessionCode);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.completed) return res.status(409).json({ error: "Simulation is not complete" });
    res.json({ sessionCode: session.sessionCode, totalScore: session.totalScore, maximumScore: session.maximumScore, completedAt: session.completedAt, answers: session.attempts.map((a) => ({ scenarioId: a.scenarioId, correct: a.correct, score: a.score })) });
  } catch (error) { next(error); }
});

const adminLoginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
app.post("/api/admin/login", adminLoginLimiter, async (req, res, next) => {
  try {
    const password = req.body?.password;
    if (typeof password !== "string" || !passwordsMatch(password)) return res.status(401).json({ error: "Invalid password" });
    const token = makeToken();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60_000);
    await prisma.adminSession.create({ data: { tokenHash: hashToken(token), expiresAt } });
    res.cookie(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "strict", secure: config.secureCookies, maxAge: 8 * 60 * 60_000, path: "/" });
    res.json({ authenticated: true });
  } catch (error) { next(error); }
});

app.post("/api/admin/logout", requireAdmin, async (req, res, next) => {
  try {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (typeof token === "string") await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
    res.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/admin/stats", requireAdmin, async (_req, res, next) => {
  try {
    const sessions = (await prisma.participantSession.findMany({ include: { attempts: true } })).map(currentSession);
    const total = sessions.length;
    const completedSessions = sessions.filter((session) => session.completed);
    const completed = completedSessions.length;
    const attempts = sessions.flatMap((session) => session.attempts);
    const incorrect = new Map<string, { scenarioId: string; selectedAction: string; count: number }>();
    for (const attempt of attempts.filter((attempt) => !attempt.correct)) {
      const key = JSON.stringify([attempt.scenarioId, attempt.selectedAction]);
      const row = incorrect.get(key) ?? { scenarioId: attempt.scenarioId, selectedAction: attempt.selectedAction, count: 0 };
      row.count += 1;
      incorrect.set(key, row);
    }
    res.json({
      totalSessions: total, activeSessions: total - completed, completedSessions: completed,
      completionPercentage: total ? Math.round((completed / total) * 1000) / 10 : 0,
      averageScore: completed ? Math.round(completedSessions.reduce((sum, session) => sum + session.totalScore, 0) / completed * 10) / 10 : 0,
      averagePercentage: completed ? Math.round(completedSessions.reduce((sum, session) => sum + session.totalScore / session.maximumScore * 100, 0) / completed * 10) / 10 : 0,
      maximumScore: scenarios.length * 20,
      scenarios: scenarios.map((scenario) => {
        const rows = attempts.filter((item) => item.scenarioId === scenario.id);
        const count = rows.length;
        return { id: scenario.id, title: scenario.title, attempts: count, accuracy: count ? Math.round((rows.reduce((sum, row) => sum + row.score, 0) / (count * 20)) * 1000) / 10 : 0 };
      }),
      commonIncorrectActions: [...incorrect.values()].sort((a, b) => b.count - a.count).slice(0, 12)
    });
  } catch (error) { next(error); }
});

app.get("/api/admin/sessions", requireAdmin, async (_req, res, next) => {
  try {
    const sessions = await prisma.participantSession.findMany({
      orderBy: { startedAt: "desc" },
      take: 1000,
      select: {
        sessionCode: true,
        displayName: true,
        telegramUsername: true,
        scenarioVersion: true,
        startedAt: true,
        completedAt: true,
        totalScore: true,
        completed: true,
        attempts: {
          orderBy: { createdAt: "asc" },
          select: { scenarioId: true, selectedAction: true, reason: true, correct: true, score: true, createdAt: true }
        }
      }
    });
    res.json(sessions.map(currentSession));
  } catch (error) { next(error); }
});

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(currentDir, "../../frontend/dist");
app.use(express.static(frontendDist, { maxAge: config.isProduction ? "1h" : 0 }));
app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (!config.isProduction) console.error(error instanceof Error ? error.message : "Unknown error");
  res.status(500).json({ error: "An unexpected error occurred" });
};
app.use(errorHandler);

export default app;
