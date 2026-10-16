-- Preserve existing sessions as version 1. New registrations explicitly write 2.
ALTER TABLE "ParticipantSession" ADD COLUMN "scenarioVersion" INTEGER NOT NULL DEFAULT 1;
