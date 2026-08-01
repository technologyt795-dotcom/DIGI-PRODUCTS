import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  customersTable,
  storeSettingsTable,
  emailCampaignsTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";
import nodemailer from "nodemailer";

const router: IRouter = Router();

// ─── Segments ────────────────────────────────────────────────────────────────

router.get(
  "/admin/marketing/segments",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const statsResult = await db.execute(sql`
      SELECT
        c.id, c.name, c.email,
        COUNT(o.id)::int           AS order_count,
        COALESCE(SUM(o.total),0)::float AS total_spend,
        MAX(o.created_at)          AS last_order_at,
        MIN(o.created_at)          AS first_order_at
      FROM customers c
      LEFT JOIN orders o ON o.customer_email = c.email
      GROUP BY c.id, c.name, c.email
      ORDER BY total_spend DESC
    `);

    const rows = statsResult.rows as Array<{
      id: number; name: string; email: string;
      order_count: number; total_spend: number;
      last_order_at: string | null; first_order_at: string | null;
    }>;

    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400_000);
    const d60 = new Date(now.getTime() - 60 * 86400_000);

    const withOrders = rows.filter((r) => r.order_count > 0);
    const vipCut = Math.max(1, Math.ceil(withOrders.length * 0.2));
    const vipSet = new Set(withOrders.slice(0, vipCut).map((r) => r.id));

    const toSeg = (r: (typeof rows)[0]) => ({
      id: r.id, name: r.name, email: r.email,
      totalSpend: r.total_spend, orderCount: r.order_count,
    });

    const vip      = rows.filter((r) => vipSet.has(r.id));
    const frequent = rows.filter((r) => r.order_count >= 3);
    const newC     = rows.filter((r) => {
      const d = r.first_order_at ? new Date(r.first_order_at) : null;
      return d && d >= d30;
    });
    const inactive = rows.filter((r) => {
      const d = r.last_order_at ? new Date(r.last_order_at) : null;
      return !d || d < d60;
    });

    res.json({
      total: rows.length,
      segments: {
        vip:      { count: vip.length,      customers: vip.slice(0, 10).map(toSeg) },
        frequent: { count: frequent.length, customers: frequent.slice(0, 10).map(toSeg) },
        new:      { count: newC.length,     customers: newC.slice(0, 10).map(toSeg) },
        inactive: { count: inactive.length, customers: inactive.slice(0, 10).map(toSeg) },
      },
    });
  },
);

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get(
  "/admin/marketing/stats",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const [topProducts, revenueByCategory, topCustomers, repeatRow, aovRow] =
      await Promise.all([
        db.execute(sql`
          SELECT p.id, p.name,
            SUM((item->>'price')::float * (item->>'quantity')::int)::float AS revenue,
            SUM((item->>'quantity')::int)::int AS units_sold
          FROM orders o,
          jsonb_array_elements(o.items) AS item
          JOIN products p ON p.id = (item->>'productId')::int
          WHERE o.status != 'cancelled'
          GROUP BY p.id, p.name
          ORDER BY revenue DESC LIMIT 5
        `),
        db.execute(sql`
          SELECT c.name AS category,
            SUM((item->>'price')::float * (item->>'quantity')::int)::float AS revenue
          FROM orders o,
          jsonb_array_elements(o.items) AS item
          JOIN products p ON p.id = (item->>'productId')::int
          JOIN categories c ON c.id = p.category_id
          WHERE o.status != 'cancelled'
          GROUP BY c.name ORDER BY revenue DESC LIMIT 8
        `),
        db.execute(sql`
          SELECT c.id, c.name, c.email,
            COUNT(o.id)::int AS order_count,
            COALESCE(SUM(o.total),0)::float AS total_spend
          FROM customers c
          JOIN orders o ON o.customer_email = c.email
          WHERE o.status != 'cancelled'
          GROUP BY c.id, c.name, c.email
          ORDER BY total_spend DESC LIMIT 5
        `),
        db.execute(sql`
          SELECT
            COUNT(DISTINCT CASE WHEN cnt >= 2 THEN email END)::int AS repeat_c,
            COUNT(DISTINCT email)::int AS total_c
          FROM (
            SELECT customer_email AS email, COUNT(*) AS cnt
            FROM orders WHERE status != 'cancelled'
            GROUP BY customer_email
          ) sub
        `),
        db.execute(sql`
          SELECT COALESCE(AVG(total),0)::float AS aov
          FROM orders WHERE status != 'cancelled'
        `),
      ]);

    const rr = (repeatRow.rows[0] as any) ?? {};
    res.json({
      topProducts: (topProducts.rows as any[]).map((r) => ({
        id: r.id, name: r.name,
        revenue: Number(r.revenue), unitsSold: Number(r.units_sold),
      })),
      revenueByCategory: (revenueByCategory.rows as any[]).map((r) => ({
        category: r.category, revenue: Number(r.revenue),
      })),
      topCustomers: (topCustomers.rows as any[]).map((r) => ({
        id: r.id, name: r.name, email: r.email,
        orderCount: r.order_count, totalSpend: Number(r.total_spend),
      })),
      repeatPurchaseRate:
        rr.total_c > 0 ? Math.round((rr.repeat_c / rr.total_c) * 100) : 0,
      averageOrderValue: Number((aovRow.rows[0] as any)?.aov ?? 0),
    });
  },
);

// ─── Email Campaigns CRUD ─────────────────────────────────────────────────────

router.get(
  "/admin/marketing/campaigns",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(emailCampaignsTable)
      .orderBy(desc(emailCampaignsTable.createdAt));
    res.json(rows);
  },
);

router.post(
  "/admin/marketing/campaigns",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { title, subject, body, segment } = req.body as {
      title?: string; subject?: string; body?: string; segment?: string;
    };
    if (!title || !subject || !body) {
      res.status(400).json({ error: "title و subject و body مطلوبة" });
      return;
    }
    const [row] = await db
      .insert(emailCampaignsTable)
      .values({ title, subject, body, segment: segment ?? "all" })
      .returning();
    res.status(201).json(row);
  },
);

router.patch(
  "/admin/marketing/campaigns/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    const { title, subject, body, segment } = req.body as Partial<{
      title: string; subject: string; body: string; segment: string;
    }>;
    const update: Record<string, unknown> = {};
    if (title   !== undefined) update.title   = title;
    if (subject !== undefined) update.subject = subject;
    if (body    !== undefined) update.body    = body;
    if (segment !== undefined) update.segment = segment;

    const [row] = await db
      .update(emailCampaignsTable)
      .set(update)
      .where(eq(emailCampaignsTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Campaign not found" }); return; }
    res.json(row);
  },
);

router.delete(
  "/admin/marketing/campaigns/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    await db.delete(emailCampaignsTable).where(eq(emailCampaignsTable.id, id));
    res.sendStatus(204);
  },
);

// ─── Send Campaign ────────────────────────────────────────────────────────────

router.post(
  "/admin/marketing/campaigns/:id/send",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);

    const [campaign] = await db
      .select()
      .from(emailCampaignsTable)
      .where(eq(emailCampaignsTable.id, id));
    if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
    if (campaign.status === "sent") {
      res.status(400).json({ error: "تم إرسال الحملة بالفعل" });
      return;
    }

    const [settings] = await db
      .select()
      .from(storeSettingsTable)
      .where(eq(storeSettingsTable.id, 1));

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
      res.status(400).json({ error: "لم يتم تكوين إعدادات SMTP في إعدادات التسويق" });
      return;
    }

    // Determine recipients
    const allCustomers = await db
      .select({ name: customersTable.name, email: customersTable.email })
      .from(customersTable);

    let recipients = allCustomers;

    if (campaign.segment !== "all") {
      const sr = await db.execute(sql`
        SELECT c.email,
          COUNT(o.id)::int AS order_count,
          COALESCE(SUM(o.total),0)::float AS total_spend,
          MAX(o.created_at) AS last_order_at,
          MIN(o.created_at) AS first_order_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_email = c.email
        GROUP BY c.email
      `);
      const smap = new Map((sr.rows as any[]).map((r) => [r.email, r]));
      const now = new Date();
      const d30 = new Date(now.getTime() - 30 * 86400_000);
      const d60 = new Date(now.getTime() - 60 * 86400_000);

      if (campaign.segment === "vip") {
        const sorted = allCustomers
          .map((c) => ({ ...c, sp: Number((smap.get(c.email) as any)?.total_spend ?? 0) }))
          .filter((c) => c.sp > 0)
          .sort((a, b) => b.sp - a.sp);
        recipients = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.2)));
      } else if (campaign.segment === "frequent") {
        recipients = allCustomers.filter(
          (c) => Number((smap.get(c.email) as any)?.order_count ?? 0) >= 3,
        );
      } else if (campaign.segment === "new") {
        recipients = allCustomers.filter((c) => {
          const d = (smap.get(c.email) as any)?.first_order_at;
          return d && new Date(d) >= d30;
        });
      } else if (campaign.segment === "inactive") {
        recipients = allCustomers.filter((c) => {
          const d = (smap.get(c.email) as any)?.last_order_at;
          return !d || new Date(d) < d60;
        });
      }
    }

    if (recipients.length === 0) {
      res.status(400).json({ error: "لا يوجد مستلمون في هذه الشريحة" });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      secure: settings.smtpSecure ?? false,
      auth: { user: settings.smtpUser!, pass: settings.smtpPass! },
      tls: { rejectUnauthorized: false },
    });

    let sent = 0;
    const failed: string[] = [];

    for (const cust of recipients) {
      const html = campaign.body
        .replace(/\{\{customerName\}\}/g, cust.name)
        .replace(/\{\{storeName\}\}/g, settings.storeName);
      try {
        await transporter.sendMail({
          from: settings.smtpFrom ?? settings.smtpUser ?? "",
          to: cust.email,
          subject: campaign.subject,
          html,
        });
        sent++;
      } catch {
        failed.push(cust.email);
      }
    }

    const [updated] = await db
      .update(emailCampaignsTable)
      .set({ status: "sent", sentAt: new Date(), recipientCount: sent })
      .where(eq(emailCampaignsTable.id, id))
      .returning();

    res.json({ success: true, sent, failed: failed.length, campaign: updated });
  },
);

// ─── SMTP Test ────────────────────────────────────────────────────────────────

router.post(
  "/admin/marketing/smtp/test",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFrom, testEmail } =
      req.body as {
        smtpHost: string; smtpPort: number; smtpSecure: boolean;
        smtpUser: string; smtpPass: string; smtpFrom?: string; testEmail: string;
      };

    if (!smtpHost || !smtpUser || !smtpPass || !testEmail) {
      res.status(400).json({ error: "جميع الحقول مطلوبة" });
      return;
    }

    try {
      const t = nodemailer.createTransport({
        host: smtpHost, port: smtpPort ?? 587,
        secure: smtpSecure ?? false,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
      });
      await t.sendMail({
        from: smtpFrom ?? smtpUser,
        to: testEmail,
        subject: "✅ اختبار إعدادات البريد",
        html: "<div dir='rtl'><h2>✅ تم التكوين بنجاح!</h2><p>إعدادات SMTP تعمل بشكل صحيح.</p></div>",
      });
      res.json({ success: true });
    } catch (err: unknown) {
      res.status(400).json({ error: (err as Error).message ?? "فشل الاتصال" });
    }
  },
);

export default router;
