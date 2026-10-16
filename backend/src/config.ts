const requiredInProduction = ["ADMIN_PASSWORD", "SESSION_SECRET", "PUBLIC_BASE_URL"] as const;

export function validateEnvironment() {
  if (process.env.NODE_ENV !== "production") return;
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) missing.push("DATABASE_URL or TURSO_DATABASE_URL" as never);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  if ((process.env.SESSION_SECRET?.length ?? 0) < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  try { new URL(process.env.PUBLIC_BASE_URL!); }
  catch { throw new Error("PUBLIC_BASE_URL must be an absolute URL"); }
}

const publicBaseUrl = process.env.PUBLIC_BASE_URL;
export const config = {
  port: Number(process.env.PORT ?? 3000),
  isProduction: process.env.NODE_ENV === "production",
  adminPassword: process.env.ADMIN_PASSWORD ?? "development-only-admin-password",
  sessionSecret: process.env.SESSION_SECRET ?? "development-only-secret-32-characters",
  publicBaseUrl,
  secureCookies: process.env.NODE_ENV === "production" && publicBaseUrl?.startsWith("https://") === true,
};
