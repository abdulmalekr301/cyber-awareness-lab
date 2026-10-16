ALTER TABLE "ParticipantSession"
ADD COLUMN "safeLinkClickedAt" TIMESTAMP(3);

ALTER TABLE "ScenarioAttempt"
ADD COLUMN "reason" TEXT;
