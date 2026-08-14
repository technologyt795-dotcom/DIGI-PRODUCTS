import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";

const SECRET_VERSION = "cust-token-v1";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

export interface CustomerPayload {
  sub: number;   // customer id
  email: string;
  iat: number;
  exp: number;
}

function b64url(s: string): string {
  return Buffer.from(s).toString("base64url");
}

function fromb64url(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

export function issueCustomerToken(payload: Omit<CustomerPayload, "iat" | "exp">): string {
  const now = Math.floor(Date.now() / 1000);
  const full: CustomerPayload = { ...payload, iat: now, exp: now + 60 * 60 * 24 * 30 }; // 30 days
  const encoded = b64url(JSON.stringify(full));
  const sig = crypto
    .createHmac("sha256", SECRET_VERSION + getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyCustomerToken(token: string): CustomerPayload | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto
      .createHmac("sha256", SECRET_VERSION + getSecret())
      .update(encoded)
      .digest("base64url");
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      return null;
    const payload: CustomerPayload = JSON.parse(fromb64url(encoded));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireCustomer(
  req: Request & { customer?: CustomerPayload },
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
    return;
  }
  const payload = verifyCustomerToken(token);
  if (!payload) {
    res.status(401).json({ error: "الجلسة منتهية، يرجى تسجيل الدخول مجدداً" });
    return;
  }
  req.customer = payload;
  next();
}
