import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, ordersTable, discountsTable, customersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";
import { z } from "zod";

const router: IRouter = Router();

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${rand}`;
}

const OrderItemSchema = z.object({
  productId: z.number().int(),
  name: z.string().min(1),
  image: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
});

const CreateOrderBody = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().min(1),
  customerPhone: z.string().default(""),
  address: z.string().default(""),
  items: z.array(OrderItemSchema).min(1),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateOrderBody = z.object({
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  notes: z.string().optional(),
});

// Helper: map DB row to API shape
function mapOrder(row: typeof ordersTable.$inferSelect) {
  return {
    ...row,
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shippingCost),
    tax: Number(row.tax),
    discountAmount: Number(row.discountAmount),
    total: Number(row.total),
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt,
  };
}

// GET /admin/orders
router.get(
  "/admin/orders",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { status } = req.query as { status?: string };
    const rows = await db
      .select()
      .from(ordersTable)
      .where(
        status
          ? eq(ordersTable.status, status)
          : undefined,
      )
      .orderBy(desc(ordersTable.createdAt));
    res.json(rows.map(mapOrder));
  },
);

// GET /admin/orders/:id
router.get(
  "/admin/orders/:id",
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
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(mapOrder(row));
  },
);

// PATCH /admin/orders/:id
router.patch(
  "/admin/orders/:id",
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
    const parsed = UpdateOrderBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined)
      updateData.status = parsed.data.status;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const [row] = await db
      .update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(mapOrder(row));
  },
);

// DELETE /admin/orders/:id
router.delete(
  "/admin/orders/:id",
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
      .delete(ordersTable)
      .where(eq(ordersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.sendStatus(204);
  },
);

// POST /orders — public checkout
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Handle discount code
  let discountAmount = 0;
  let discountCode: string | null = null;
  if (data.discountCode) {
    const [discount] = await db
      .select()
      .from(discountsTable)
      .where(eq(discountsTable.code, data.discountCode.toUpperCase()));

    if (
      discount &&
      discount.isActive &&
      (!discount.maxUses || discount.usedCount < discount.maxUses) &&
      (!discount.expiresAt || new Date(discount.expiresAt) > new Date()) &&
      (!discount.minOrderAmount || subtotal >= Number(discount.minOrderAmount))
    ) {
      discountCode = discount.code;
      if (discount.type === "percentage") {
        discountAmount = (subtotal * Number(discount.value)) / 100;
      } else {
        discountAmount = Math.min(Number(discount.value), subtotal);
      }
      // Increment usedCount
      await db
        .update(discountsTable)
        .set({ usedCount: discount.usedCount + 1 })
        .where(eq(discountsTable.id, discount.id));
    }
  }

  const shippingCost = 0; // can be extended with settings later
  const tax = 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost + tax);

  // Upsert customer
  try {
    const existingCustomer = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.email, data.customerEmail));
    if (existingCustomer.length === 0) {
      await db.insert(customersTable).values({
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      });
    }
  } catch {
    // ignore duplicate key — customer already exists
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber: generateOrderNumber(),
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      address: data.address,
      status: "pending",
      items: data.items,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      tax: tax.toFixed(2),
      discountCode,
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      notes: data.notes,
    })
    .returning();

  res.status(201).json(mapOrder(order));
});

export default router;
