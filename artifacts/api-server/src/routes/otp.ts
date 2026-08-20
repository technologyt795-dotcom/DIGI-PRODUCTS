import { Router, type IRouter } from "express";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { db, storeSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const emailOtps = new Map<string, { hash: string; expiresAt: number; attempts: number; lastSentAt: number }>();
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_SECRET = process.env.SESSION_SECRET || "email-otp-secret";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashCode(email: string, code: string) {
  return crypto.createHmac("sha256", OTP_SECRET).update(`${email}:${code}`).digest("hex");
}

function issueVerificationToken(email: string) {
  const normalized = normalizeEmail(email);
  const payload = Buffer.from(JSON.stringify({ email: normalized, exp: Date.now() + 30 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function isEmailVerificationTokenValid(token: string | undefined, email: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email?: string; exp?: number };
    return data.email === normalizeEmail(email) && Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!;
const BASE_URL = `https://verify.twilio.com/v2/Services/${SERVICE_SID}`;
const authHeader = "Basic " + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");

/** Normalize Saudi phone numbers to E.164 format (+966XXXXXXXXX) */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (digits.startsWith("+966")) return digits;
  if (digits.startsWith("00966")) return "+" + digits.slice(2);
  if (digits.startsWith("966")) return "+" + digits;
  if (digits.startsWith("05")) return "+966" + digits.slice(1);
  if (digits.startsWith("5")) return "+966" + digits;
  return digits; // return as-is for other formats
}

const SendOtpBody = z.object({
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
});

const VerifyOtpBody = z.object({
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  code: z.string().length(6, "الكود يجب أن يكون 6 أرقام"),
});

const SendEmailOtpBody = z.object({ email: z.string().email("البريد الإلكتروني غير صحيح") });
const VerifyEmailOtpBody = SendEmailOtpBody.extend({ code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام") });

router.post("/auth/email-otp/send", async (req, res): Promise<void> => {
  const parsed = SendEmailOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }); return; }
  const email = normalizeEmail(parsed.data.email);
  const existing = emailOtps.get(email);
  if (existing && Date.now() - existing.lastSentAt < 60_000) {
    res.status(429).json({ error: "انتظر دقيقة قبل إعادة إرسال الرمز" }); return;
  }
  const [settings] = await db.select().from(storeSettingsTable).where(eq(storeSettingsTable.id, 1));
  if (!settings?.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    res.status(503).json({ error: "لم يتم إعداد البريد الإلكتروني من لوحة التحكم" }); return;
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const storeName = settings.storeName || "المتجر";
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost, port: settings.smtpPort ?? 587, secure: settings.smtpSecure ?? false,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
    tls: { rejectUnauthorized: false },
  });
  try {
    await transporter.sendMail({
      from: settings.smtpFrom ?? settings.smtpUser, to: email,
      subject: `رمز التحقق من ${storeName}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>${storeName}</h2><p>رمز التحقق لإتمام طلبك هو:</p><div style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;padding:18px;background:#f4f4f5;border-radius:12px">${code}</div><p>الرمز صالح لمدة 10 دقائق. لا تشاركه مع أي شخص.</p></div>`,
    });
    emailOtps.set(email, { hash: hashCode(email, code), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0, lastSentAt: Date.now() });
    res.json({ sent: true });
  } catch {
    res.status(502).json({ error: "تعذر إرسال رمز التحقق إلى البريد الإلكتروني" });
  }
});

router.post("/auth/email-otp/verify", (req, res): void => {
  const parsed = VerifyEmailOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }); return; }
  const email = normalizeEmail(parsed.data.email);
  const entry = emailOtps.get(email);
  if (!entry || entry.expiresAt < Date.now()) { emailOtps.delete(email); res.status(400).json({ error: "انتهت صلاحية الرمز، اطلب رمزًا جديدًا" }); return; }
  entry.attempts += 1;
  if (entry.attempts > 5) { emailOtps.delete(email); res.status(429).json({ error: "تجاوزت عدد المحاولات المسموح بها" }); return; }
  if (hashCode(email, parsed.data.code) !== entry.hash) { res.status(400).json({ error: "رمز التحقق غير صحيح" }); return; }
  emailOtps.delete(email);
  res.json({ verified: true, verificationToken: issueVerificationToken(email) });
});

// POST /api/auth/otp/send
router.post("/auth/otp/send", async (req, res): Promise<void> => {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !SERVICE_SID) {
    res.status(503).json({ error: "خدمة OTP غير مفعّلة" });
    return;
  }

  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
    return;
  }

  const to = normalizePhone(parsed.data.phone);

  try {
    const response = await fetch(`${BASE_URL}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, Channel: "sms" }).toString(),
    });

    const data = await response.json() as { status?: string; message?: string; code?: number };

    if (!response.ok) {
      const msg = data.message || "فشل إرسال الكود";
      res.status(400).json({ error: msg });
      return;
    }

    res.json({ status: data.status, phone: to });
  } catch {
    res.status(500).json({ error: "حدث خطأ أثناء إرسال الكود" });
  }
});

// POST /api/auth/otp/verify
router.post("/auth/otp/verify", async (req, res): Promise<void> => {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !SERVICE_SID) {
    res.status(503).json({ error: "خدمة OTP غير مفعّلة" });
    return;
  }

  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
    return;
  }

  const to = normalizePhone(parsed.data.phone);

  try {
    const response = await fetch(`${BASE_URL}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, Code: parsed.data.code }).toString(),
    });

    const data = await response.json() as { status?: string; valid?: boolean; message?: string };

    if (!response.ok || data.status !== "approved") {
      res.status(400).json({ error: "الكود غير صحيح أو منتهي الصلاحية" });
      return;
    }

    res.json({ verified: true });
  } catch {
    res.status(500).json({ error: "حدث خطأ أثناء التحقق من الكود" });
  }
});

export default router;
