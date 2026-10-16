ALTER TABLE "ParticipantSession" ADD COLUMN "telegramUsername" TEXT;

CREATE TABLE "EmailVerification" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sendCount" INTEGER NOT NULL DEFAULT 1,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerification_email_key" ON "EmailVerification"("email");
CREATE INDEX "EmailVerification_expiresAt_idx" ON "EmailVerification"("expiresAt");
