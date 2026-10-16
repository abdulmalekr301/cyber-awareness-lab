-- BACKUP REQUIRED before applying to a populated database.
-- Permanently removes stored email addresses, consent/delivery/click metadata,
-- training token hashes and all OTP challenges. No participant/attempt rows are deleted.
BEGIN;
DROP TABLE "EmailVerification";
DROP INDEX "ParticipantSession_email_idx";
DROP INDEX "ParticipantSession_phishingTokenHash_key";
ALTER TABLE "ParticipantSession" DROP COLUMN "email";
ALTER TABLE "ParticipantSession" DROP COLUMN "emailConsentAt";
ALTER TABLE "ParticipantSession" DROP COLUMN "phishingTokenHash";
ALTER TABLE "ParticipantSession" DROP COLUMN "phishingEmailSentAt";
ALTER TABLE "ParticipantSession" DROP COLUMN "phishingLinkClickedAt";
ALTER TABLE "ParticipantSession" DROP COLUMN "safeLinkClickedAt";

-- Recalculate cached game state from the four retained scenarios.
-- All participant and attempt records, including inbox-challenge attempts, remain.
UPDATE "ParticipantSession"
SET "totalScore" = COALESCE((
      SELECT SUM("score") FROM "ScenarioAttempt"
      WHERE "sessionId" = "ParticipantSession"."id"
        AND "scenarioId" IN ('login-safety', 'phishing', 'social-engineering', 'url-safety')
    ), 0),
    "completed" = (SELECT COUNT(*) FROM "ScenarioAttempt"
      WHERE "sessionId" = "ParticipantSession"."id"
        AND "scenarioId" IN ('login-safety', 'phishing', 'social-engineering', 'url-safety')) = 4,
    "completedAt" = CASE WHEN (SELECT COUNT(*) FROM "ScenarioAttempt"
      WHERE "sessionId" = "ParticipantSession"."id"
        AND "scenarioId" IN ('login-safety', 'phishing', 'social-engineering', 'url-safety')) = 4
      THEN COALESCE("completedAt", (SELECT MAX("createdAt") FROM "ScenarioAttempt"
        WHERE "sessionId" = "ParticipantSession"."id"
          AND "scenarioId" IN ('login-safety', 'phishing', 'social-engineering', 'url-safety')))
      ELSE NULL END;
COMMIT;
