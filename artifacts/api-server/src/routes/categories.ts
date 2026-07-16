import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import {
  GetCategoryParams,
  GetCategoryResponse,
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

const categorySelection = {
  id: categoriesTable.id,
  slug: categoriesTable.slug,
  name: categoriesTable.name,
  description: categoriesTable.description,
  image: categoriesTable.image,
  isHidden: categoriesTable.isHidden,
  productCount: sql<number>`count(${productsTable.id})`.mapWith(Number),
};

// Public: only visible categories
router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select(categorySelection)
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.isHidden, false))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.id);

  res.json(rows);
});

// Admin: all categories including hidden
router.get("/admin/categories", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select(categorySelection)
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.id);

  res.json(rows);
});

router.post("/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, parsed.data.slug));
  if (existing) {
    res.status(400).json({ error: "A category with this slug already exists" });
    return;
  }

  const [created] = await db
    .insert(categoriesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({ ...created, productCount: 0 });
});

router.get("/categories/:slug", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select(categorySelection)
    .from(categoriesTable)
    .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(categoriesTable.slug, params.data.slug))
    .groupBy(categoriesTable.id);

  if (!row) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(GetCategoryResponse.parse(row));
});

router.patch(
  "/categories/id/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (parsed.data.slug) {
      const [existing] = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(eq(categoriesTable.slug, parsed.data.slug));
      if (existing && existing.id !== params.data.id) {
        res
          .status(400)
          .json({ error: "A category with this slug already exists" });
        return;
      }
    }

    const [updated] = await db
      .update(categoriesTable)
      .set(parsed.data)
      .where(eq(categoriesTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const [row] = await db
      .select(categorySelection)
      .from(categoriesTable)
      .leftJoin(
        productsTable,
        eq(productsTable.categoryId, categoriesTable.id),
      )
      .where(eq(categoriesTable.id, updated.id))
      .groupBy(categoriesTable.id);

    res.json(row);
  },
);

router.delete(
  "/categories/id/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const withProducts = req.query.withProducts === "true";

    if (withProducts) {
      // Delete all products in the category first, then the category
      await db
        .delete(productsTable)
        .where(eq(productsTable.categoryId, params.data.id));
    } else {
      const [productInCategory] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.categoryId, params.data.id))
        .limit(1);

      if (productInCategory) {
        res.status(409).json({
          error: "Cannot delete a category that still has products",
        });
        return;
      }
    }

    const [deleted] = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
