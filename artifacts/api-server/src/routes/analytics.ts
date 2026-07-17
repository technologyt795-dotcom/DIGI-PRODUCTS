import { Router, type IRouter } from "express";
import { count, sql, desc } from "drizzle-orm";
import { db, ordersTable, customersTable, productsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

// GET /admin/analytics
router.get(
  "/admin/analytics",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const [orderStats] = await db
      .select({
        totalOrders: count(ordersTable.id),
        totalRevenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
      })
      .from(ordersTable);

    const [{ totalCustomers }] = await db
      .select({ totalCustomers: count(customersTable.id) })
      .from(customersTable);

    const [{ totalProducts }] = await db
      .select({ totalProducts: count(productsTable.id) })
      .from(productsTable);

    const [{ pendingOrders }] = await db
      .select({ pendingOrders: count(ordersTable.id) })
      .from(ordersTable)
      .where(sql`${ordersTable.status} = 'pending'`);

    // Revenue by day (last 30 days)
    const revenueByDay = await db.execute(sql`
      SELECT
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
        COALESCE(SUM(total), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    // Orders by status
    const ordersByStatus = await db.execute(sql`
      SELECT status, COUNT(*)::int AS count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    res.json({
      totalOrders: orderStats?.totalOrders ?? 0,
      totalRevenue: Number(orderStats?.totalRevenue ?? 0),
      totalCustomers: totalCustomers ?? 0,
      pendingOrders: pendingOrders ?? 0,
      totalProducts: totalProducts ?? 0,
      revenueByDay: (revenueByDay.rows as Array<{ date: string; revenue: number; orders: number }>).map((r) => ({
        date: r.date,
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
      ordersByStatus: (ordersByStatus.rows as Array<{ status: string; count: number }>).map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
    });
  },
);

// GET /admin/finance
router.get(
  "/admin/finance",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const [totals] = await db
      .select({
        totalOrders: count(ordersTable.id),
        totalRevenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
      })
      .from(ordersTable);

    const [thisMonth] = await db
      .select({
        revenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
      })
      .from(ordersTable)
      .where(
        sql`date_trunc('month', ${ordersTable.createdAt}) = date_trunc('month', NOW())`,
      );

    const [lastMonth] = await db
      .select({
        revenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)`,
      })
      .from(ordersTable)
      .where(
        sql`date_trunc('month', ${ordersTable.createdAt}) = date_trunc('month', NOW() - INTERVAL '1 month')`,
      );

    const revenueByMonth = await db.execute(sql`
      SELECT
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month,
        COALESCE(SUM(total), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `);

    const totalOrders = totals?.totalOrders ?? 0;
    const totalRevenue = Number(totals?.totalRevenue ?? 0);

    res.json({
      totalRevenue,
      thisMonthRevenue: Number(thisMonth?.revenue ?? 0),
      lastMonthRevenue: Number(lastMonth?.revenue ?? 0),
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalOrders,
      revenueByMonth: (revenueByMonth.rows as Array<{ month: string; revenue: number; orders: number }>).map((r) => ({
        month: r.month,
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      })),
    });
  },
);

export default router;
