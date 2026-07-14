import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, ne, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
  ListRelatedProductsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
  createdAt: productsTable.createdAt,
};

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { categorySlug, search, sort } = params.data;

  const conditions = [];
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
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderBy);

  res.json(rows);
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select(productSelection)
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id),
    )
    .where(eq(productsTable.isFeatured, true))
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
    .where(eq(productsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(row);
});

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
