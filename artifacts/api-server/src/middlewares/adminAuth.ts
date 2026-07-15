import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";

// In-memory session token store. Tokens are issued on successful admin
// login and are valid until the server restarts. This is sufficient for a
// single-admin internal dashboard and avoids adding a full auth system.
const activeTokens = new Set<string>();

export function issueAdminToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  activeTokens.add(token);
  return token;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }
  return password === expected;
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token || !activeTokens.has(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
