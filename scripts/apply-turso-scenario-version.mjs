import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
if (!process.env.TURSO_DATABASE_URL) throw new Error("TURSO_DATABASE_URL is required");
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
try {
  const columns = await db.execute('PRAGMA table_info("ParticipantSession")');
  if (!columns.rows.some((column) => column.name === "scenarioVersion")) {
    await db.executeMultiple(await readFile(new URL("../prisma/turso-scenario-version.sql", import.meta.url), "utf8"));
  }
  console.log("Scenario version ready; existing participant records retained.");
} finally { db.close(); }
