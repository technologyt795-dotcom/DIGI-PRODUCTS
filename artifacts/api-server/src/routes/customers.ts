import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, customersTable, ordersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";
import { z } from "zod";

const router: IRouter = Router();

const UpdateCustomerBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  phone: z.string().optional(),
});

async function getCustomerWithStats(id: number) {
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, id));
  if (!customer) return null;

  const [stats] = await db
    .select({
      totalOrders: count(ordersTable.id),
      totalSpent: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
    })
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, customer.email));

  return {
    ...customer,
    createdAt:
      customer.createdAt instanceof Date
        ? customer.createdAt.toISOString()
        : customer.createdAt,
    totalOrders: stats?.totalOrders ?? 0,
    totalSpent: Number(stats?.totalSpent ?? 0),
  };
}

// GET /admin/customers
router.get(
  "/admin/customers",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const customers = await db
      .select()
      .from(customersTable)
      .orderBy(desc(customersTable.createdAt));

    const result = await Promise.all(
      customers.map(async (c) => {
        const [stats] = await db
          .select({
            totalOrders: count(ordersTable.id),
            totalSpent: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
          })
          .from(ordersTable)
          .where(eq(ordersTable.customerEmail, c.email));
        return {
          ...c,
          createdAt:
            c.createdAt instanceof Date
              ? c.createdAt.toISOString()
              : c.createdAt,
          totalOrders: stats?.totalOrders ?? 0,
          totalSpent: Number(stats?.totalSpent ?? 0),
        };
      }),
    );

    res.json(result);
  },
);

// GET /admin/customers/:id
router.get(
  "/admin/customers/:id",
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
    const result = await getCustomerWithStats(id);
    if (!result) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json(result);
  },
);

// PATCH /admin/customers/:id
router.patch(
  "/admin/customers/:id",
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
    const parsed = UpdateCustomerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [updated] = await db
      .update(customersTable)
      .set(parsed.data)
      .where(eq(customersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    const result = await getCustomerWithStats(id);
    res.json(result);
  },
);

// DELETE /admin/customers/:id
router.delete(
  "/admin/customers/:id",
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
      .delete(customersTable)
      .where(eq(customersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
