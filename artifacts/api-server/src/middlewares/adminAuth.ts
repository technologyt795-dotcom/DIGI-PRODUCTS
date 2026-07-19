import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";

/**
 * Derive a stable, deterministic token from the admin password.
 * This survives server restarts because it's computed on-the-fly each time.
 */
function deriveToken(password: string): string {
  return crypto.createHmac("sha256", "admin-token-v1").update(password).digest("hex");
}

export function issueAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return deriveToken(password);
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Normalise both sides: trim whitespace and strip accidental surrounding quotes
  const normalise = (s: string) =>
    s.trim().replace(/^["']|["']$/g, "");
  const a = normalise(password);
  const b = normalise(expected);
  // Use hex encoding so timingSafeEqual always gets equal-length ASCII buffers
  const hashA = crypto.createHmac("sha256", "pwd-check").update(a).digest("hex");
  const hashB = crypto.createHmac("sha256", "pwd-check").update(b).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hashA), Buffer.from(hashB));
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith("Bearer ") ? header.slice(7) : undefined;

  const password = process.env.ADMIN_PASSWORD;
  if (!token || !password) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const expected = deriveToken(password);
  const isValid =
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));

  if (!isValid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
