import { readFile } from "node:fs/promises";
import { createClient } from "@libsql/client";

if (!process.argv.includes("--backup-confirmed")) {
  throw new Error("Back up the database first. This migration permanently removes email/OTP data. Pass --backup-confirmed after verifying the backup.");
}
if (!process.env.TURSO_DATABASE_URL) throw new Error("TURSO_DATABASE_URL is required");
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
try {
  const sql = await readFile(new URL("../prisma/turso-remove-email.sql", import.meta.url), "utf8");
  const tx = await db.transaction("write");
  try {
    await tx.executeMultiple(sql);
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
  console.log("Turso email removal migration applied. Participant and attempt records retained.");
} finally {
  db.close();
}
