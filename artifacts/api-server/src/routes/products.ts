import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, ne, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
  ListRelatedProductsParams,
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

function toInsertValues(data: {
  slug: string;
  name: string;
  categoryId: number;
  price: number;
  compareAtPrice?: number | null;
  description: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  stock: number;
  isFeatured?: boolean;
  isNew?: boolean;
  badge?: string | null;
  isDigital?: boolean;
  isHidden?: boolean;
  downloadUrls?: string[];
  downloadLabels?: string[];
  productUrl?: string | null;
}) {
  return {
    slug: data.slug,
    name: data.name,
    categoryId: data.categoryId,
    price: data.price.toString(),
    compareAtPrice:
      data.compareAtPrice == null ? null : data.compareAtPrice.toString(),
    description: data.description,
    images: data.images,
    ...(data.rating != null ? { rating: data.rating.toString() } : {}),
    ...(data.reviewCount != null ? { reviewCount: data.reviewCount } : {}),
    stock: data.stock,
    ...(data.isFeatured != null ? { isFeatured: data.isFeatured } : {}),
    ...(data.isNew != null ? { isNew: data.isNew } : {}),
    ...(data.badge !== undefined ? { badge: data.badge } : {}),
    ...(data.isDigital != null ? { isDigital: data.isDigital } : {}),
    ...(data.isHidden != null ? { isHidden: data.isHidden } : {}),
    ...(data.downloadUrls !== undefined ? { downloadUrls: data.downloadUrls } : {}),
    ...(data.downloadLabels !== undefined ? { downloadLabels: data.downloadLabels } : {}),
    ...(data.productUrl !== undefined ? { productUrl: data.productUrl } : {}),
  };
}

function toUpdateValues(data: {
  slug?: string;
  name?: string;
  categoryId?: number;
  price?: number;
  compareAtPrice?: number | null;
  description?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  stock?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  badge?: string | null;
  isDigital?: boolean;
  isHidden?: boolean;
  downloadUrls?: string[];
  downloadLabels?: string[];
  productUrl?: string | null;
}) {
  const values: Record<string, unknown> = { ...data };
  if (data.price != null) values.price = data.price.toString();
  if (data.compareAtPrice !== undefined) {
    values.compareAtPrice =
      data.compareAtPrice == null ? null : data.compareAtPrice.toString();
  }
  if (data.rating != null) values.rating = data.rating.toString();
  return values;
}

const productSelection = {
  id: productsTable.id,
  slug: productsTable.slug,
  name: productsTable.name,
  categoryId: productsTable.categoryId,
  categorySlug: categoriesTable.slug,
  categoryName: categoriesTable.name,
  price: sql<number>`${productsTable.price}::float8`.mapWith(Number),
  compareAtPrice:
    sql<number | null>`${productsTable.compareAtPrice}::float8`.mapWith(
      Number,
    ),
  description: productsTable.description,
  images: productsTable.images,
  rating: sql<number>`${productsTable.rating}::float8`.mapWith(Number),
  reviewCount: productsTable.reviewCount,
  stock: productsTable.stock,
  isFeatured: productsTable.isFeatured,
  isNew: productsTable.isNew,
  badge: productsTable.badge,
  isDigital: productsTable.isDigital,
  isHidden: productsTable.isHidden,
  downloadUrls: productsTable.downloadUrls,
  downloadLabels: productsTable.downloadLabels,
  productUrl: productsTable.productUrl,
  createdAt: productsTable.createdAt,
};

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { categorySlug, search, sort } = params.data;

  const conditions = [
    eq(categoriesTable.isHidden, false),
    eq(productsTable.isHidden, false),
  ];
  if (categorySlug) {
    conditions.push(eq(categoriesTable.slug, categorySlug));
  }
  if (search) {
    conditions.push(ilike(productsTable.name, `%${search}%`));
  }

  let orderBy = desc(productsTable.createdAt);
  if (sort === "price_asc") orderBy = asc(productsTable.price);
  else if (sort === "price_desc") orderBy = desc(productsTable.price);
  else if (sort === "rating") orderBy = desc(productsTable.rating);

  const rows = await db
    .select(productSelection)
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id),
    )
    .where(and(...conditions))
    .orderBy(orderBy);

  res.json(rows);
});

// GET /admin/products — returns products whose category is visible (admin only)
router.get("/admin/products", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select(productSelection)
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id),
    )
    .where(eq(categoriesTable.isHidden, false))
    .orderBy(desc(productsTable.createdAt));

  res.json(rows);
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [category] = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, parsed.data.categoryId));
  if (!category) {
    res.status(400).json({ error: "Category does not exist" });
    return;
  }

  const [existing] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.slug, parsed.data.slug));
  if (existing) {
    res.status(400).json({ error: "A product with this slug already exists" });
    return;
  }

  const [created] = await db
    .insert(productsTable)
    .values(toInsertValues(parsed.data))
    .returning();

  const [row] = await db
    .select(productSelection)
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id),
    )
    .where(eq(productsTable.id, created.id));

  res.status(201).json(row);
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select(productSelection)
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id),
    )
    .where(and(eq(productsTable.isFeatured, true), eq(categoriesTable.isHidden, false), eq(productsTable.isHidden, false)))
    .orderBy(desc(productsTable.createdAt));

  res.json(rows);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select(productSelection)
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id),
    )
    .where(and(eq(productsTable.id, params.data.id), eq(categoriesTable.isHidden, false)));

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(row);
});

router.patch(
  "/products/id/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (parsed.data.categoryId != null) {
      const [category] = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(eq(categoriesTable.id, parsed.data.categoryId));
      if (!category) {
        res.status(400).json({ error: "Category does not exist" });
        return;
      }
    }

    if (parsed.data.slug) {
      const [existing] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.slug, parsed.data.slug));
      if (existing && existing.id !== params.data.id) {
        res
          .status(400)
          .json({ error: "A product with this slug already exists" });
        return;
      }
    }

    const [updated] = await db
      .update(productsTable)
      .set(toUpdateValues(parsed.data))
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [row] = await db
      .select(productSelection)
      .from(productsTable)
      .innerJoin(
        categoriesTable,
        eq(productsTable.categoryId, categoriesTable.id),
      )
      .where(eq(productsTable.id, updated.id));

    res.json(row);
  },
);

router.delete(
  "/products/id/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [deleted] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.sendStatus(204);
  },
);

router.get("/products/:id/related", async (req, res): Promise<void> => {
  const params = ListRelatedProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select({ categoryId: productsTable.categoryId })
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const rows = await db
    .select(productSelection)
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id),
    )
    .where(
      and(
        eq(productsTable.categoryId, product.categoryId),
        ne(productsTable.id, params.data.id),
      ),
    )
    .limit(4);

  res.json(rows);
});

export default router;
