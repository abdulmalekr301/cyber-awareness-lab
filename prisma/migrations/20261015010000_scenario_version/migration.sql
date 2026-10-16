-- Existing participants keep their four-scenario results and progress (version 1).
-- New participants use seven scenarios (version 2). No rows or scores are changed.
BEGIN;
ALTER TABLE "ParticipantSession" ADD COLUMN "scenarioVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ParticipantSession" ALTER COLUMN "scenarioVersion" SET DEFAULT 2;
COMMIT;
