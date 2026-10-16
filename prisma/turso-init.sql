PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "ParticipantSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionCode" TEXT NOT NULL,
  "displayName" TEXT,
  "telegramUsername" TEXT,
  "scenarioVersion" INTEGER NOT NULL DEFAULT 2,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "totalScore" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "ScenarioAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "selectedAction" TEXT NOT NULL,
  "reason" TEXT,
  "correct" BOOLEAN NOT NULL,
  "score" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScenarioAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParticipantSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AdminSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantSession_sessionCode_key" ON "ParticipantSession"("sessionCode");
CREATE INDEX IF NOT EXISTS "ParticipantSession_sessionCode_idx" ON "ParticipantSession"("sessionCode");
CREATE INDEX IF NOT EXISTS "ParticipantSession_createdAt_idx" ON "ParticipantSession"("createdAt");
CREATE INDEX IF NOT EXISTS "ParticipantSession_completed_idx" ON "ParticipantSession"("completed");
CREATE UNIQUE INDEX IF NOT EXISTS "ScenarioAttempt_sessionId_scenarioId_key" ON "ScenarioAttempt"("sessionId", "scenarioId");
CREATE INDEX IF NOT EXISTS "ScenarioAttempt_scenarioId_idx" ON "ScenarioAttempt"("scenarioId");
CREATE INDEX IF NOT EXISTS "ScenarioAttempt_createdAt_idx" ON "ScenarioAttempt"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
