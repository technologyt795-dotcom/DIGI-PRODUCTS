import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";

const router: IRouter = Router();

const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET_KEY!;
const MOYASAR_PUBLISHABLE_KEY = process.env.MOYASAR_PUBLISHABLE_KEY || "";
const MOYASAR_API = "https://api.moyasar.com/v1";

// GET /payments/config — return publishable key for frontend
router.get("/payments/config", (_req, res) => {
  res.json({ publishableKey: MOYASAR_PUBLISHABLE_KEY });
});

// POST /payments/moyasar — create a Moyasar payment for an existing order
router.post("/payments/moyasar", async (req, res): Promise<void> => {
  const { orderNumber, callbackUrl } = req.body as {
    orderNumber?: string;
    callbackUrl?: string;
  };

  if (!orderNumber || !callbackUrl) {
    res.status(400).json({ error: "orderNumber and callbackUrl are required" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.paymentStatus === "paid") {
    res.status(400).json({ error: "Order already paid" });
    return;
  }

  // Amount in halalas (SAR × 100)
  const amountHalalas = Math.round(Number(order.total) * 100);

  try {
    const moyasarRes = await fetch(`${MOYASAR_API}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${MOYASAR_SECRET_KEY}:`).toString("base64"),
      },
      body: JSON.stringify({
        publishable_api_key: process.env.MOYASAR_PUBLISHABLE_KEY,
        amount: amountHalalas,
        currency: "SAR",
        description: `طلب رقم ${orderNumber}`,
        callback_url: callbackUrl,
        source: { type: "creditcard" },
        metadata: { orderNumber },
      }),
    });

    if (!moyasarRes.ok) {
      const errText = await moyasarRes.text();
      req.log?.error({ errText }, "Moyasar payment creation failed");
      res.status(502).json({ error: "فشل إنشاء الدفع مع بوابة الدفع" });
      return;
    }

    const payment = (await moyasarRes.json()) as {
      id: string;
      url?: string;
      source?: { transaction_url?: string };
    };

    const paymentUrl =
      payment.url || payment.source?.transaction_url || "";

    // Store paymentId on the order
    await db
      .update(ordersTable)
      .set({ paymentId: payment.id })
      .where(eq(ordersTable.orderNumber, orderNumber));

    res.json({ paymentUrl, paymentId: payment.id });
  } catch (err) {
    req.log?.error({ err }, "Moyasar fetch error");
    res.status(502).json({ error: "تعذر الاتصال ببوابة الدفع" });
  }
});

// GET /payments/callback — Moyasar redirects here after payment
router.get("/payments/callback", async (req, res): Promise<void> => {
  const { id: paymentId, status, orderNumber } = req.query as {
    id?: string;
    status?: string;
    orderNumber?: string;
  };

  if (!paymentId) {
    res.status(400).json({ error: "Missing payment id" });
    return;
  }

  try {
    // Verify payment with Moyasar
    const verifyRes = await fetch(`${MOYASAR_API}/payments/${paymentId}`, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${MOYASAR_SECRET_KEY}:`).toString("base64"),
      },
    });

    if (!verifyRes.ok) {
      req.log?.error({ paymentId }, "Moyasar payment verification failed");
      const base = req.headers["x-forwarded-proto"]
        ? `${req.headers["x-forwarded-proto"]}://${req.headers.host}`
        : "";
      res.redirect(
        `${base}/?payment=failed&orderNumber=${orderNumber ?? ""}`,
      );
      return;
    }

    const payment = (await verifyRes.json()) as {
      id: string;
      status: string;
      message?: string;
      metadata?: { orderNumber?: string };
      source?: {
        message?: string;
        response_code?: string;
        company?: string;
        name?: string;
        number?: string;
      };
    };

    const resolvedOrderNumber =
      orderNumber ||
      payment.metadata?.orderNumber ||
      "";

    const isPaid = payment.status === "paid";

    // Extract the best failure message available
    const failureMessage = payment.source?.message || payment.message || null;
    const failureCode = payment.source?.response_code || null;

    if (resolvedOrderNumber) {
      await db
        .update(ordersTable)
        .set({
          paymentStatus: isPaid ? "paid" : "failed",
          paymentId: payment.id,
          ...(isPaid ? { status: "processing" } : {}),
        })
        .where(eq(ordersTable.orderNumber, resolvedOrderNumber));
    }

    res.json({
      status: isPaid ? "paid" : "failed",
      orderNumber: resolvedOrderNumber,
      ...((!isPaid && failureMessage) ? { failureMessage } : {}),
      ...((!isPaid && failureCode) ? { failureCode } : {}),
    });
  } catch (err) {
    req.log?.error({ err }, "Payment callback error");
    res.status(500).json({ status: "failed", orderNumber: orderNumber ?? "" });
  }
});

export default router;
