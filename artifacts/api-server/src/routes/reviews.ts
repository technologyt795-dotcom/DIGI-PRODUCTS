import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reviewsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";
import { z } from "zod";

const router: IRouter = Router();

const CreateReviewBody = z.object({
  productId: z.number().int(),
  customerName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().default(""),
});

const UpdateReviewBody = z.object({
  isApproved: z.boolean().optional(),
  comment: z.string().optional(),
});

function mapReview(row: typeof reviewsTable.$inferSelect) {
  return {
    ...row,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : row.createdAt,
  };
}

// POST /reviews — public
router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(reviewsTable)
    .values({
      productId: parsed.data.productId,
      customerName: parsed.data.customerName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    })
    .returning();
  res.status(201).json(mapReview(row));
});

// GET /admin/reviews
router.get(
  "/admin/reviews",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { approved } = req.query as { approved?: string };
    const rows = await db
      .select()
      .from(reviewsTable)
      .where(
        approved !== undefined
          ? eq(reviewsTable.isApproved, approved === "true")
          : undefined,
      )
      .orderBy(desc(reviewsTable.createdAt));
    res.json(rows.map(mapReview));
  },
);

// PATCH /admin/reviews/:id
router.patch(
  "/admin/reviews/:id",
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
    const parsed = UpdateReviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const updateData: Record<string, unknown> = {};
    if (parsed.data.isApproved !== undefined)
      updateData.isApproved = parsed.data.isApproved;
    if (parsed.data.comment !== undefined)
      updateData.comment = parsed.data.comment;

    const [row] = await db
      .update(reviewsTable)
      .set(updateData)
      .where(eq(reviewsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.json(mapReview(row));
  },
);

// DELETE /admin/reviews/:id
router.delete(
  "/admin/reviews/:id",
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
      .delete(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
