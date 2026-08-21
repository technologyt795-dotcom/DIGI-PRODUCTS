import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";

const router: IRouter = Router();

const MOYASAR_API = "https://api.moyasar.com/v1";

function getMoyasarSecretKey() {
  return (process.env.MOYASAR_SECRET_KEY || "").trim();
}

function getMoyasarPublishableKey() {
  return (process.env.MOYASAR_PUBLISHABLE_KEY || "").trim();
}

// GET /payments/config — return publishable key for frontend
// Read from process.env at request time so key changes/restarts are picked up
router.get("/payments/config", (_req, res) => {
  res.json({ publishableKey: getMoyasarPublishableKey() });
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
          Buffer.from(`${getMoyasarSecretKey()}:`).toString("base64"),
      },
      body: JSON.stringify({
        publishable_api_key: getMoyasarPublishableKey(),
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
          Buffer.from(`${getMoyasarSecretKey()}:`).toString("base64"),
      },
    });

    if (!verifyRes.ok) {
      const verificationError = await verifyRes.text();
      req.log?.error(
        {
          paymentId,
          statusCode: verifyRes.status,
          response: verificationError.slice(0, 500),
        },
        "Moyasar payment verification failed",
      );
      res.status(502).json({
        status: "failed",
        orderNumber: orderNumber ?? "",
        failureMessage: "تعذر التحقق من حالة الدفع مع بوابة الدفع",
        failureCode: `moyasar_${verifyRes.status}`,
      });
      return;
    }

    const payment = (await verifyRes.json()) as {
      id: string;
      status: string;
      amount: number;
      currency: string;
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

    const [verifiedOrder] = resolvedOrderNumber
      ? await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.orderNumber, resolvedOrderNumber))
      : [];
    const expectedAmount = verifiedOrder
      ? Math.round(Number(verifiedOrder.total) * 100)
      : null;
    const metadataMatchesOrder =
      Boolean(resolvedOrderNumber) &&
      payment.metadata?.orderNumber === resolvedOrderNumber;
    const amountMatches = expectedAmount !== null && payment.amount === expectedAmount;
    const currencyMatches = payment.currency === "SAR";
    const normalizedPaymentStatus = payment.status.trim().toLowerCase();
    const isApprovedResponse =
      payment.source?.response_code?.trim().toLowerCase() === "approved" ||
      payment.source?.message?.trim().toLowerCase() === "approved";
    // Moyasar integrations may return an authorized/captured state and some
    // bank adapters capitalize the status. Treat only a gateway-approved
    // authorized payment as successful, while still requiring all integrity
    // checks below.
    const gatewayPaid =
      normalizedPaymentStatus === "paid" ||
      normalizedPaymentStatus === "captured" ||
      (normalizedPaymentStatus === "authorized" && isApprovedResponse);
    const isPaid =
      gatewayPaid &&
      metadataMatchesOrder &&
      amountMatches &&
      currencyMatches;
    const isVerificationMismatch = gatewayPaid && !isPaid;
    if (isVerificationMismatch) {
      req.log?.warn(
        {
          paymentId: payment.id,
          paymentStatus: payment.status,
          resolvedOrderNumber,
          metadataOrderNumber: payment.metadata?.orderNumber ?? null,
          expectedAmount,
          paymentAmount: payment.amount,
          paymentCurrency: payment.currency,
          metadataMatchesOrder,
          amountMatches,
          currencyMatches,
        },
        "Moyasar paid payment did not match the originating order",
      );
    }
    const isFailed = normalizedPaymentStatus === "failed" || isVerificationMismatch;
    const resultStatus = isPaid ? "paid" : isFailed ? "failed" : "pending";

    // A 3DS redirect can arrive before Moyasar finalizes the payment. Preserve
    // the order's existing status while the gateway still reports an in-progress state.
    const failureMessage = isVerificationMismatch
      ? "Payment verification mismatch"
      : payment.source?.message || payment.message || null;
    const failureCode = isVerificationMismatch
      ? "verification_mismatch"
      : payment.source?.response_code || null;

    if (resolvedOrderNumber) {
      const orderWhere = eq(ordersTable.orderNumber, resolvedOrderNumber);

      if (isPaid) {
        await db
          .update(ordersTable)
          .set({
            paymentStatus: "paid",
            paymentId: payment.id,
            status: "processing",
          })
          .where(orderWhere);
      } else if (isFailed) {
        await db
          .update(ordersTable)
          .set({
            paymentStatus: "failed",
            paymentId: payment.id,
          })
          .where(orderWhere);
      } else {
        await db
          .update(ordersTable)
          .set({ paymentId: payment.id })
          .where(orderWhere);
      }
    }

    res.json({
      status: resultStatus,
      orderNumber: resolvedOrderNumber,
      ...((isFailed && failureMessage) ? { failureMessage } : {}),
      ...((isFailed && failureCode) ? { failureCode } : {}),
    });
  } catch (err) {
    req.log?.error({ err }, "Payment callback error");
    res.status(500).json({ status: "failed", orderNumber: orderNumber ?? "" });
  }
});

export default router;
