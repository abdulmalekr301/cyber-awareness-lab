PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "ParticipantSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionCode" TEXT NOT NULL,
  "displayName" TEXT,
  "email" TEXT,
  "telegramUsername" TEXT,
  "emailConsentAt" DATETIME,
  "phishingTokenHash" TEXT,
  "phishingEmailSentAt" DATETIME,
  "phishingLinkClickedAt" DATETIME,
  "safeLinkClickedAt" DATETIME,
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

CREATE TABLE IF NOT EXISTS "EmailVerification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "sentAt" DATETIME NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sendCount" INTEGER NOT NULL DEFAULT 1,
  "windowStart" DATETIME NOT NULL,
  "consumedAt" DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantSession_sessionCode_key" ON "ParticipantSession"("sessionCode");
CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantSession_phishingTokenHash_key" ON "ParticipantSession"("phishingTokenHash");
CREATE INDEX IF NOT EXISTS "ParticipantSession_sessionCode_idx" ON "ParticipantSession"("sessionCode");
CREATE INDEX IF NOT EXISTS "ParticipantSession_createdAt_idx" ON "ParticipantSession"("createdAt");
CREATE INDEX IF NOT EXISTS "ParticipantSession_completed_idx" ON "ParticipantSession"("completed");
CREATE INDEX IF NOT EXISTS "ParticipantSession_email_idx" ON "ParticipantSession"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "ScenarioAttempt_sessionId_scenarioId_key" ON "ScenarioAttempt"("sessionId", "scenarioId");
CREATE INDEX IF NOT EXISTS "ScenarioAttempt_scenarioId_idx" ON "ScenarioAttempt"("scenarioId");
CREATE INDEX IF NOT EXISTS "ScenarioAttempt_createdAt_idx" ON "ScenarioAttempt"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerification_email_key" ON "EmailVerification"("email");
CREATE INDEX IF NOT EXISTS "EmailVerification_expiresAt_idx" ON "EmailVerification"("expiresAt");
