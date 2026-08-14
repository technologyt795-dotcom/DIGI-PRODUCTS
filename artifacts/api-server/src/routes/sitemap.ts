import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/sitemap.xml", async (req, res): Promise<void> => {
  try {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "";
    const baseUrl = `${proto}://${host}`;

    // جلب البيانات مع التأكد من الربط الصحيح
    const [products, categories] = await Promise.all([
      db
        .select({ id: productsTable.id })
        .from(productsTable)
        .innerJoin(
          categoriesTable,
          eq(productsTable.categoryId, categoriesTable.id),
        )
        .where(
          and(
            eq(productsTable.isHidden, false),
            eq(categoriesTable.isHidden, false),
          ),
        ),
      db
        .select({ slug: categoriesTable.slug })
        .from(categoriesTable)
        .where(eq(categoriesTable.isHidden, false)),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const urls: string[] = [];

    // 1. الصفحات الثابتة
    const staticPages = ["/", "/products", "/refund-policy"];
    staticPages.forEach((path) => {
      urls.push(
        `<url><loc>${baseUrl}${path}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`,
      );
    });

    // 2. صفحات التصنيفات
    categories.forEach((cat) => {
      urls.push(
        `<url><loc>${baseUrl}/category/${cat.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      );
    });

    // 3. صفحات المنتجات (باستخدام ID لضمان العمل)
    products.forEach((prod) => {
      urls.push(
        `<url><loc>${baseUrl}/product/${prod.id}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      );
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  } catch (err) {
    console.error("Sitemap Error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

export default router;
