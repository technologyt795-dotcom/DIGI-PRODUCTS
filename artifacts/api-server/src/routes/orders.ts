import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { db, ordersTable, discountsTable, customersTable, productsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";
import { isEmailVerificationTokenValid } from "./otp";
import { z } from "zod";
import path from "path";

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
  paymentMethod: z.enum(["cash", "online"]).default("cash"),
  emailVerificationToken: z.string().min(1).optional(),
});

const UpdateOrderBody = z.object({
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().nullable().optional(),
  trackingUrl: z.string().nullable().optional(),
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
    paymentMethod: row.paymentMethod ?? "cash",
    paymentStatus: row.paymentStatus ?? "pending",
    paymentId: row.paymentId ?? null,
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
    if (parsed.data.trackingNumber !== undefined) updateData.trackingNumber = parsed.data.trackingNumber;
    if (parsed.data.trackingUrl !== undefined) updateData.trackingUrl = parsed.data.trackingUrl;

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

// GET /orders/:orderNumber/downloads — public; returns digital items for paid orders
router.get("/orders/:orderNumber/downloads", async (req, res): Promise<void> => {
  const { orderNumber } = req.params as { orderNumber: string };

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber));

  if (!order) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }

  if (order.paymentStatus !== "paid") {
    res.status(403).json({ error: "الدفع لم يتم تأكيده بعد" });
    return;
  }

  type DigitalItem = {
    idx: number;
    name: string;
    downloadUrls: string[];
    downloadLabels: string[];
    productUrl: string | null;
  };

  const items = (order.items as import("@workspace/db").OrderItem[])
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.isDigital)
    .map(({ item, idx }): DigitalItem => ({
      idx,
      name: item.name,
      downloadUrls: item.downloadUrls ?? [],
      downloadLabels: item.downloadLabels ?? [],
      productUrl: item.productUrl ?? null,
    }));

  res.json({ orderNumber, hasDigital: items.length > 0, items });
});

// GET /orders/:orderNumber/downloads/:itemIndex/:fileIndex — named attachment download for a paid checkout.
router.get("/orders/:orderNumber/downloads/:itemIndex/:fileIndex", async (req, res): Promise<void> => {
  const { orderNumber, itemIndex, fileIndex } = req.params as {
    orderNumber: string;
    itemIndex: string;
    fileIndex: string;
  };
  const itemIdx = Number(itemIndex);
  const fileIdx = Number(fileIndex);
  if (!Number.isInteger(itemIdx) || itemIdx < 0 || !Number.isInteger(fileIdx) || fileIdx < 0) {
    res.status(400).json({ error: "معرّف المرفق غير صحيح" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber));
  if (!order) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  if (order.paymentStatus !== "paid") {
    res.status(403).json({ error: "الدفع لم يتم تأكيده بعد" });
    return;
  }

  const item = (order.items as any[])?.[itemIdx];
  const sourceUrl = item?.isDigital ? item.downloadUrls?.[fileIdx] : null;
  if (!sourceUrl) {
    res.status(404).json({ error: "المرفق غير موجود" });
    return;
  }

  const localPrefix = "/api/files/uploads/";
  const isLocalUpload = sourceUrl.startsWith(localPrefix);
  let source: URL | null = null;
  if (!isLocalUpload) {
    try {
      source = new URL(sourceUrl);
      if (source.protocol !== "https:") throw new Error("Unsupported protocol");
    } catch {
      res.status(422).json({ error: "رابط المرفق غير صالح" });
      return;
    }
  }

  const configuredLabel = String(item.downloadLabels?.[fileIdx] ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");
  // Local uploads do not need an external URL object; derive the extension
  // from their stored path before naming the download.
  const sourcePath = isLocalUpload ? sourceUrl.split("?")[0] : source!.pathname;
  const extension = sourcePath.match(/\.[a-z0-9]{1,10}$/i)?.[0] ?? "";
  const hasExtension = /\.[a-z0-9]{1,10}$/i.test(configuredLabel);
  const fallbackNames: Record<string, string> = {
    '.pdf': 'ملف PDF', '.png': 'صورة PNG', '.jpg': 'صورة JPG', '.jpeg': 'صورة JPEG', '.webp': 'صورة WEBP',
    '.xls': 'ملف Excel', '.xlsx': 'ملف Excel', '.csv': 'ملف CSV', '.doc': 'مستند Word', '.docx': 'مستند Word',
    '.zip': 'ملف ZIP', '.rar': 'ملف RAR', '.mp3': 'ملف صوتي MP3', '.mp4': 'ملف فيديو MP4',
  };
  const fallbackName = fallbackNames[extension.toLowerCase()] ?? (extension ? `ملف ${extension.slice(1).toUpperCase()}` : 'مرفق رقمي');
    const filename = configuredLabel
    ? `${configuredLabel}${hasExtension ? "" : extension}`
    : `${fallbackName}${extension}`;

  // Digital uploads are stored locally under public/files/uploads. Serving this
  // file directly preserves its original bytes and MIME type instead of fetching
  // the storefront HTML fallback through an HTTP URL.
  if (isLocalUpload) {
    const storedName = path.basename(sourceUrl.slice(localPrefix.length).split("?")[0]);
    const uploadsDir = path.resolve(import.meta.dirname, "..", "public", "files", "uploads");
    const localFilePath = path.resolve(uploadsDir, storedName);
    if (!storedName || !localFilePath.startsWith(uploadsDir + path.sep)) {
      res.status(422).json({ error: "رابط المرفق غير صالح" });
      return;
    }
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.sendFile(localFilePath, (err) => {
      if (!err) return;
      if (!res.headersSent) {
        res.status((err as any).statusCode === 404 ? 404 : 500).json({ error: "تعذّر تحميل المرفق" });
      } else {
        res.end();
      }
    });
    return;
  }

  try {
    const upstream = await fetch(source!);
    if (!upstream.ok || !upstream.body) {
      res.status(502).json({ error: "تعذّر الوصول إلى المرفق" });
      return;
    }
    res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(502).json({ error: "تعذّر الوصول إلى المرفق" });
  }
});

// GET /orders/:orderNumber/invoice — public paid-order invoice after checkout.
// The order number is only shared in the payment callback URL; payment must
// already be confirmed before invoice data or attachments are returned.
router.get("/orders/:orderNumber/invoice", async (req, res): Promise<void> => {
  const { orderNumber } = req.params as { orderNumber: string };
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber));

  if (!order) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  if (order.paymentStatus !== "paid") {
    res.status(403).json({ error: "الدفع لم يتم تأكيده بعد" });
    return;
  }

  res.json({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    address: order.address,
    items: order.items,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    discountCode: order.discountCode,
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    notes: order.notes,
    status: order.status,
    paymentMethod: order.paymentMethod ?? "online",
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
  });
});

// POST /orders — public checkout
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  if (!isEmailVerificationTokenValid(data.emailVerificationToken, data.customerEmail)) {
    res.status(403).json({ error: "يجب التحقق من البريد الإلكتروني قبل إتمام الطلب" });
    return;
  }

  // Fetch digital product info for all ordered items
  const productIds = data.items.map((i) => i.productId);
  const productRows = productIds.length
    ? await db
        .select({ id: productsTable.id, isDigital: productsTable.isDigital, downloadUrls: productsTable.downloadUrls, downloadLabels: productsTable.downloadLabels, productUrl: productsTable.productUrl })
        .from(productsTable)
        .where(inArray(productsTable.id, productIds))
    : [];
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  // Enrich items with isDigital / downloadUrl from DB
  const enrichedItems = data.items.map((item) => {
    const p = productMap.get(item.productId);
    return {
      ...item,
      isDigital: p?.isDigital ?? false,
      downloadUrls: p?.downloadUrls ?? [],
      downloadLabels: p?.downloadLabels ?? [],
      productUrl: p?.productUrl ?? null,
    };
  });

  const subtotal = enrichedItems.reduce(
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
      items: enrichedItems,
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      tax: tax.toFixed(2),
      discountCode,
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
      notes: data.notes,
      paymentMethod: data.paymentMethod ?? "cash",
      paymentStatus: "pending",
    })
    .returning();

  res.status(201).json(mapOrder(order));
});

export default router;
