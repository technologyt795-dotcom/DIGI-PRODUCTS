import { Router } from "express";
import { db, productsTable, categoriesTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/sitemap.xml", async (req, res): Promise<void> => {
  try {
    // Detect site URL from request or settings
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host  = req.headers["x-forwarded-host"] || req.headers.host || "";
    const baseUrl = `${proto}://${host}`;

    // Fetch products and categories in parallel
    const [products, categories] = await Promise.all([
      db
        .select({ slug: productsTable.slug })
        .from(productsTable)
        .where(eq(productsTable.isHidden, false)),
      db
        .select({ slug: categoriesTable.slug })
        .from(categoriesTable)
        .where(eq(categoriesTable.isHidden, false)),
    ]);

    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
      { url: "/",            priority: "1.0", changefreq: "daily"   },
      { url: "/products",    priority: "0.9", changefreq: "daily"   },
      { url: "/cart",        priority: "0.3", changefreq: "monthly" },
      { url: "/my-orders",   priority: "0.3", changefreq: "monthly" },
    ];

    const urls: string[] = [];

    // Static pages
    for (const page of staticPages) {
      urls.push(`
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }

    // Category pages
    for (const cat of categories) {
      urls.push(`
  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    // Product pages
    for (const product of products) {
      urls.push(`
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
});

export default router;
