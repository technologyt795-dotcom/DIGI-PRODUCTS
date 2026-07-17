import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, discountsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";
import { z } from "zod";

const router: IRouter = Router();

const CreateDiscountBody = z.object({
  code: z.string().min(1),
  type: z.enum(["percentage", "fixed"]).default("percentage"),
  value: z.number().min(0),
  minOrderAmount: z.number().nullable().optional(),
  maxUses: z.number().int().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

const UpdateDiscountBody = z.object({
  code: z.string().min(1).optional(),
  type: z.enum(["percentage", "fixed"]).optional(),
  value: z.number().min(0).optional(),
  minOrderAmount: z.number().nullable().optional(),
  maxUses: z.number().int().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const ValidateDiscountBody = z.object({
  code: z.string().min(1),
  orderTotal: z.number().min(0),
});

function mapDiscount(row: typeof discountsTable.$inferSelect) {
  return {
    ...row,
    value: Number(row.value),
    minOrderAmount: row.minOrderAmount != null ? Number(row.minOrderAmount) : null,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt,
    expiresAt:
      row.expiresAt instanceof Date
        ? row.expiresAt.toISOString()
        : row.expiresAt ?? null,
  };
}

// GET /admin/discounts
router.get(
  "/admin/discounts",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(discountsTable)
      .orderBy(desc(discountsTable.createdAt));
    res.json(rows.map(mapDiscount));
  },
);

// POST /admin/discounts
router.post(
  "/admin/discounts",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateDiscountBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    const [row] = await db
      .insert(discountsTable)
      .values({
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value.toFixed(2),
        minOrderAmount:
          data.minOrderAmount != null
            ? data.minOrderAmount.toFixed(2)
            : null,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      })
      .returning();
    res.status(201).json(mapDiscount(row));
  },
);

// PATCH /admin/discounts/:id
router.patch(
  "/admin/discounts/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateDiscountBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const data = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value.toFixed(2);
    if (data.minOrderAmount !== undefined)
      updateData.minOrderAmount =
        data.minOrderAmount != null
          ? data.minOrderAmount.toFixed(2)
          : null;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.expiresAt !== undefined)
      updateData.expiresAt = data.expiresAt
        ? new Date(data.expiresAt)
        : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [row] = await db
      .update(discountsTable)
      .set(updateData)
      .where(eq(discountsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Discount not found" });
      return;
    }
    res.json(mapDiscount(row));
  },
);

// DELETE /admin/discounts/:id
router.delete(
  "/admin/discounts/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .delete(discountsTable)
      .where(eq(discountsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Discount not found" });
      return;
    }
    res.sendStatus(204);
  },
);

// POST /discounts/validate — public
router.post("/discounts/validate", async (req, res): Promise<void> => {
  const parsed = ValidateDiscountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { code, orderTotal } = parsed.data;
  const [discount] = await db
    .select()
    .from(discountsTable)
    .where(eq(discountsTable.code, code.toUpperCase()));

  if (!discount || !discount.isActive) {
    res.status(400).json({ error: "كود الخصم غير صحيح أو غير نشط" });
    return;
  }
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    res.status(400).json({ error: "انتهت صلاحية كود الخصم" });
    return;
  }
  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    res.status(400).json({ error: "تم استخدام كود الخصم بالحد الأقصى" });
    return;
  }
  if (
    discount.minOrderAmount &&
    orderTotal < Number(discount.minOrderAmount)
  ) {
    res.status(400).json({
      error: `الحد الأدنى للطلب ${discount.minOrderAmount} ر.س`,
    });
    return;
  }

  const discountValue = Number(discount.value);
  const discountAmount =
    discount.type === "percentage"
      ? Math.min(orderTotal * (discountValue / 100), orderTotal)
      : Math.min(discountValue, orderTotal);

  res.json({ ...mapDiscount(discount), discountAmount: Math.round(discountAmount * 100) / 100 });
});

export default router;
