import { Readable } from "stream";
import { Router, type IRouter } from "express";
import { eq, desc, and, ne } from "drizzle-orm";
import { db, ordersTable, productsTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { requireCustomer } from "../middlewares/customerAuth";
import type { CustomerPayload } from "../middlewares/customerAuth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const objectStorageService = new ObjectStorageService();
const DOWNLOAD_ALLOWED_STATUSES = new Set(["processing", "shipped", "delivered"]);

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

// GET /customer/orders — list authenticated customer's orders (excludes hidden ones)
router.get(
  "/customer/orders",
  requireCustomer as any,
  async (req: any, res): Promise<void> => {
    const payload = req.customer as CustomerPayload;
    const rows = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.customerEmail, payload.email),
          ne(ordersTable.hiddenByCustomer, true),
        ),
      )
      .orderBy(desc(ordersTable.createdAt));
    res.json(rows.map(mapOrder));
  },
);

// DELETE /customer/orders/:orderNumber — smart cancel/hide logic (never hard-deletes)
// pending      → convert to cancelled
// processing / shipped → blocked (403)
// delivered    → blocked (403, financial data)
// cancelled    → hide from customer view (hiddenByCustomer = true)
router.delete(
  "/customer/orders/:orderNumber",
  requireCustomer as any,
  async (req: any, res): Promise<void> => {
    const payload = req.customer as CustomerPayload;
    const { orderNumber } = req.params as { orderNumber: string };

    const [row] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber));

    if (!row || row.customerEmail !== payload.email) {
      res.status(404).json({ error: "الطلب غير موجود" });
      return;
    }

    if (row.status === "pending") {
      // Cancel the order
      await db
        .update(ordersTable)
        .set({ status: "cancelled" })
        .where(eq(ordersTable.orderNumber, orderNumber));
      res.sendStatus(204);
      return;
    }

    if (row.status === "cancelled") {
      // Hide from customer view only
      await db
        .update(ordersTable)
        .set({ hiddenByCustomer: true })
        .where(eq(ordersTable.orderNumber, orderNumber));
      res.sendStatus(204);
      return;
    }

    // processing / shipped / delivered — cannot be deleted
    res.status(403).json({
      error:
        row.status === "delivered"
          ? "لا يمكن حذف طلب مكتمل — هذه بيانات مالية محفوظة"
          : "لا يمكن حذف طلب قيد التنفيذ",
    });
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

    // Enrich digital items with current downloadUrls/downloadLabels from the product,
    // so files added after the order was placed are still accessible.
    const items = row.items as any[];
    const digitalProductIds = items
      .filter((i) => i.isDigital && i.productId)
      .map((i) => i.productId);

    let productMap = new Map<number, { downloadUrls: string[]; downloadLabels: string[]; productUrl: string | null }>();
    if (digitalProductIds.length > 0) {
      const products = await db
        .select({
          id: productsTable.id,
          downloadUrls: productsTable.downloadUrls,
          downloadLabels: productsTable.downloadLabels,
          productUrl: productsTable.productUrl,
        })
        .from(productsTable)
        .where(inArray(productsTable.id, digitalProductIds));
      products.forEach((p) => productMap.set(p.id, { downloadUrls: p.downloadUrls, downloadLabels: p.downloadLabels, productUrl: p.productUrl ?? null }));
    }

    // Returns true only when the array has at least one non-blank string
    const hasRealContent = (arr: unknown) =>
      Array.isArray(arr) && (arr as string[]).some((s) => typeof s === "string" && s.trim() !== "");

    const enrichedItems = items.map((item) => {
      if (!item.isDigital || !item.productId) return item;
      const prod = productMap.get(item.productId);
      if (!prod) return item;
      return {
        ...item,
        // Always prefer current product data so labels/files added after the order are visible
        downloadUrls: hasRealContent(prod.downloadUrls) ? prod.downloadUrls : (item.downloadUrls ?? []),
        downloadLabels: hasRealContent(prod.downloadLabels) ? prod.downloadLabels : (item.downloadLabels ?? []),
        productUrl: prod.productUrl ?? item.productUrl ?? null,
      };
    });

    res.json(mapOrder({ ...row, items: enrichedItems }));
  },
);

// GET /customer/downloads/:orderNumber/:productIndex/:fileIndex — secure digital download
// :productIndex = index of the item in the order's items array
// :fileIndex    = index of the file within that item's downloadUrls array
router.get(
  "/customer/downloads/:orderNumber/:productIndex/:fileIndex",
  requireCustomer as any,
  async (req: any, res): Promise<void> => {
    const payload = req.customer as CustomerPayload;
    const { orderNumber, productIndex, fileIndex } = req.params as {
      orderNumber: string;
      productIndex: string;
      fileIndex: string;
    };

    const [row] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber));

    if (!row || row.customerEmail !== payload.email) {
      res.status(404).json({ error: "الطلب غير موجود" });
      return;
    }

    if (!DOWNLOAD_ALLOWED_STATUSES.has(row.status)) {
      res.status(403).json({ error: "التحميل غير متاح لهذا الطلب بعد" });
      return;
    }

    const items = row.items as any[];
    const pIdx = Number(productIndex);
    const fIdx = Number(fileIndex);
    const item = items[pIdx];

    if (!item || !item.isDigital) {
      res.status(404).json({ error: "المنتج غير متاح للتحميل" });
      return;
    }

    const downloadUrls: string[] = item.downloadUrls ?? (item.downloadUrl ? [item.downloadUrl] : []);
    const fileUrl = downloadUrls[fIdx];

    if (!fileUrl) {
      res.status(404).json({ error: "الملف غير موجود" });
      return;
    }

    // Use label as filename if available, otherwise fall back to product name
    const downloadLabels: string[] = item.downloadLabels ?? [];
    const label = downloadLabels[fIdx];
    const rawName = label || item.name || "download";
    const filename = encodeURIComponent(rawName);

    // Local static file (e.g. /api/files/uploads/...)
    if (fileUrl.startsWith("/api/")) {
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.redirect(302, fileUrl);
      return;
    }

    try {
      const file = await objectStorageService.getObjectEntityFile(fileUrl);
      const response = await objectStorageService.downloadObject(file);

      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.status(response.status);
      response.headers.forEach((value: string, key: string) => {
        if (key.toLowerCase() !== "content-disposition") res.setHeader(key, value);
      });

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (err) {
      if (err instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "الملف غير موجود" });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      req.log.error({ err, fileUrl }, `download error: ${msg}`);
      res.status(500).json({ error: "تعذّر تحميل الملف", detail: msg });
    }
  },
);

export default router;
