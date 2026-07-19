import { Readable } from "stream";
import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
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

// GET /customer/downloads/:orderNumber/:productIndex — secure digital download
router.get(
  "/customer/downloads/:orderNumber/:productIndex",
  requireCustomer as any,
  async (req: any, res): Promise<void> => {
    const payload = req.customer as CustomerPayload;
    const { orderNumber, productIndex } = req.params as {
      orderNumber: string;
      productIndex: string;
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
    const idx = Number(productIndex);
    const item = items[idx];

    if (!item || !item.isDigital || !item.downloadUrl) {
      res.status(404).json({ error: "المنتج غير متاح للتحميل" });
      return;
    }

    const filename = encodeURIComponent(item.name || "download");

    // Local static file (e.g. /api/images/products/file.pdf)
    if (item.downloadUrl.startsWith("/api/")) {
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
      res.redirect(302, item.downloadUrl);
      return;
    }

    try {
      const file = await objectStorageService.getObjectEntityFile(item.downloadUrl);
      const response = await objectStorageService.downloadObject(file);

      // Forward the filename as Content-Disposition
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
      req.log.error({ err, downloadUrl: item.downloadUrl }, `download error: ${msg}`);
      res.status(500).json({ error: "تعذّر تحميل الملف", detail: msg });
    }
  },
);

export default router;
