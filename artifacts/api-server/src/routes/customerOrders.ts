import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { requireCustomer } from "../middlewares/customerAuth";
import type { CustomerPayload } from "../middlewares/customerAuth";

const router: IRouter = Router();

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

// GET /customer/orders — list authenticated customer's orders
router.get(
  "/customer/orders",
  requireCustomer as any,
  async (req: any, res): Promise<void> => {
    const payload = req.customer as CustomerPayload;
    const rows = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerEmail, payload.email))
      .orderBy(desc(ordersTable.createdAt));
    res.json(rows.map(mapOrder));
  },
);

// GET /customer/orders/:orderNumber — single order belonging to customer
router.get(
  "/customer/orders/:orderNumber",
  requireCustomer as any,
  async (req: any, res): Promise<void> => {
    const payload = req.customer as CustomerPayload;
    const { orderNumber } = req.params as { orderNumber: string };

    const [row] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber));

    if (!row) {
      res.status(404).json({ error: "الطلب غير موجود" });
      return;
    }

    // Security: ensure this order belongs to the authenticated customer
    if (row.customerEmail !== payload.email) {
      res.status(404).json({ error: "الطلب غير موجود" });
      return;
    }

    res.json(mapOrder(row));
  },
);

export default router;
