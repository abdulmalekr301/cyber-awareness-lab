ALTER TABLE "ParticipantSession"
ADD COLUMN "displayName" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "emailConsentAt" TIMESTAMP(3),
ADD COLUMN "phishingTokenHash" TEXT,
ADD COLUMN "phishingEmailSentAt" TIMESTAMP(3),
ADD COLUMN "phishingLinkClickedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ParticipantSession_phishingTokenHash_key"
ON "ParticipantSession"("phishingTokenHash");

CREATE INDEX "ParticipantSession_email_idx"
ON "ParticipantSession"("email");
