import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "./db.js";
import { config } from "./config.js";

export const ADMIN_COOKIE = "cyberlab_admin";
export const hashToken = (value: string) => createHash("sha256").update(`${config.sessionSecret}:${value}`).digest("hex");
export const makeToken = () => randomBytes(32).toString("base64url");
export function passwordsMatch(candidate: string) {
  const expected = Buffer.from(config.adminPassword);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (typeof token !== "string") return res.status(401).json({ error: "Administrator authentication required" });
  const session = await prisma.adminSession.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.expiresAt <= new Date()) return res.status(401).json({ error: "Administrator session expired" });
  next();
}
