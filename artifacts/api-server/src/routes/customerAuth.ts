import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import crypto from "crypto";
import {
  issueCustomerToken,
  requireCustomer,
  verifyCustomerToken,
} from "../middlewares/customerAuth";
import type { CustomerPayload } from "../middlewares/customerAuth";
import { z } from "zod";

const router: IRouter = Router();

// ── Password hashing (PBKDF2 via built-in crypto) ─────────────────────────────

function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
    .toString("hex");
}

function createPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = hashPassword(password, salt);
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"))
  );
}

// ── Validation schemas ─────────────────────────────────────────────────────────

const RegisterEmailBody = z.object({
  method: z.literal("email"),
  name: z.string().min(2, "الاسم قصير جداً"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const RegisterPhoneBody = z.object({
  method: z.literal("phone"),
  name: z.string().min(2, "الاسم قصير جداً"),
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const RegisterBody = z.discriminatedUnion("method", [
  RegisterEmailBody,
  RegisterPhoneBody,
]);

const LoginEmailBody = z.object({
  method: z.literal("email"),
  email: z.string().email(),
  password: z.string().min(1),
});

const LoginPhoneBody = z.object({
  method: z.literal("phone"),
  phone: z.string().min(9),
  password: z.string().min(1),
});

const LoginBody = z.discriminatedUnion("method", [LoginEmailBody, LoginPhoneBody]);

// ── Helper: build safe customer response ──────────────────────────────────────

function safeCustomer(c: typeof customersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    authMethod: c.authMethod,
    createdAt:
      c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

// ── POST /auth/register ────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    res.status(400).json({ error: first?.message ?? "بيانات غير صحيحة" });
    return;
  }

  const data = parsed.data;
  const passwordHash = createPasswordHash(data.password);

  if (data.method === "email") {
    // Check email uniqueness
    const existing = await db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(eq(customersTable.email, data.email.toLowerCase()));
    if (existing.length > 0) {
      res.status(409).json({ error: "البريد الإلكتروني مستخدم مسبقاً" });
      return;
    }

    const [customer] = await db
      .insert(customersTable)
      .values({
        name: data.name,
        email: data.email.toLowerCase(),
        phone: "",
        passwordHash,
        authMethod: "email",
      })
      .returning();

    const token = issueCustomerToken({ sub: customer.id, email: customer.email });
    res.status(201).json({ token, customer: safeCustomer(customer) });
    return;
  }

  // Phone registration — use a placeholder email (phone@customer.local)
  const placeholderEmail = `${data.phone.replace(/\D/g, "")}@phone.local`;
  const existing = await db
    .select({ id: customersTable.id })
    .from(customersTable)
    .where(
      or(
        eq(customersTable.phone, data.phone),
        eq(customersTable.email, placeholderEmail),
      ),
    );
  if (existing.filter((r) => r.id).length > 0) {
    res.status(409).json({ error: "رقم الهاتف مستخدم مسبقاً" });
    return;
  }

  const [customer] = await db
    .insert(customersTable)
    .values({
      name: data.name,
      email: placeholderEmail,
      phone: data.phone,
      passwordHash,
      authMethod: "phone",
    })
    .returning();

  const token = issueCustomerToken({ sub: customer.id, email: customer.email });
  res.status(201).json({ token, customer: safeCustomer(customer) });
});

// ── POST /auth/login ───────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }

  const data = parsed.data;
  let customer: (typeof customersTable.$inferSelect) | undefined;

  if (data.method === "email") {
    const [row] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, data.email.toLowerCase()));
    customer = row;
  } else {
    const [row] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.phone, data.phone));
    customer = row;
  }

  if (!customer || !customer.passwordHash) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }

  const valid = verifyPasswordHash(data.password, customer.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }

  const token = issueCustomerToken({ sub: customer.id, email: customer.email });
  res.json({ token, customer: safeCustomer(customer) });
});

// ── GET /auth/me ───────────────────────────────────────────────────────────────

router.get(
  "/auth/me",
  requireCustomer as any,
  async (req: any, res): Promise<void> => {
    const payload = req.customer as CustomerPayload;
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, payload.sub));
    if (!customer) {
      res.status(404).json({ error: "الحساب غير موجود" });
      return;
    }
    res.json(safeCustomer(customer));
  },
);

export default router;
