import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

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
