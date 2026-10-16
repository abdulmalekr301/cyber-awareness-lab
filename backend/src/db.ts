import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as unknown as { cyberlabPrisma?: PrismaClient };

async function createDatabaseClient() {
  if (process.env.TURSO_DATABASE_URL) {
    const [{ PrismaLibSQL }, { PrismaClient: TursoPrismaClient }] = await Promise.all([
      import("@prisma/adapter-libsql"),
      import("./generated/turso/index.js"),
    ]);
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new TursoPrismaClient({ adapter }) as unknown as PrismaClient;
  }
  return new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });
}

export const prisma = globalDatabase.cyberlabPrisma ?? await createDatabaseClient();
if (process.env.NODE_ENV !== "production") globalDatabase.cyberlabPrisma = prisma;
