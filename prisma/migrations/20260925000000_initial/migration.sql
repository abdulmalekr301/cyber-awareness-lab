CREATE TABLE "ParticipantSession" (
  "id" TEXT NOT NULL,
  "sessionCode" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "totalScore" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParticipantSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ScenarioAttempt" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "selectedAction" TEXT NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "score" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScenarioAttempt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ParticipantSession_sessionCode_key" ON "ParticipantSession"("sessionCode");
CREATE INDEX "ParticipantSession_sessionCode_idx" ON "ParticipantSession"("sessionCode");
CREATE INDEX "ParticipantSession_createdAt_idx" ON "ParticipantSession"("createdAt");
CREATE INDEX "ParticipantSession_completed_idx" ON "ParticipantSession"("completed");
CREATE UNIQUE INDEX "ScenarioAttempt_sessionId_scenarioId_key" ON "ScenarioAttempt"("sessionId", "scenarioId");
CREATE INDEX "ScenarioAttempt_scenarioId_idx" ON "ScenarioAttempt"("scenarioId");
CREATE INDEX "ScenarioAttempt_createdAt_idx" ON "ScenarioAttempt"("createdAt");
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParticipantSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
