import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, storeSettingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

const DEFAULT_SETTINGS = {
  storeName: "My Store",
  tagline: "تسوق بسهولة وثقة",
  logoUrl: null,
  activeTheme: "classic" as const,
  contactEmail: "",
  contactPhone: "",
  address: "",
  freeShippingThreshold: null,
  flatShippingRate: 0,
  taxRate: 0,
  taxInclusive: false,
  facebookUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  whatsappNumber: null,
  navbarBgColor: null,
  navbarTextColor: null,
};

async function ensureSettings() {
  const existing = await db
    .select()
    .from(storeSettingsTable)
    .where(eq(storeSettingsTable.id, 1))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(storeSettingsTable).values({ id: 1, ...DEFAULT_SETTINGS, flatShippingRate: "0", taxRate: "0" });
    return await db.select().from(storeSettingsTable).where(eq(storeSettingsTable.id, 1)).limit(1).then(r => r[0]);
  }
  return existing[0];
}

function toApiSettings(row: typeof storeSettingsTable.$inferSelect) {
  return {
    storeName: row.storeName,
    tagline: row.tagline,
    logoUrl: row.logoUrl ?? null,
    activeTheme: (row.activeTheme as "classic" | "modern" | "minimal"),
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    address: row.address,
    freeShippingThreshold: row.freeShippingThreshold != null ? parseFloat(row.freeShippingThreshold) : null,
    flatShippingRate: parseFloat(row.flatShippingRate),
    taxRate: parseFloat(row.taxRate),
    taxInclusive: row.taxInclusive,
    facebookUrl: row.facebookUrl ?? null,
    instagramUrl: row.instagramUrl ?? null,
    twitterUrl: row.twitterUrl ?? null,
    whatsappNumber: row.whatsappNumber ?? null,
    navbarBgColor: row.navbarBgColor ?? null,
    navbarTextColor: row.navbarTextColor ?? null,
  };
}

router.get("/settings", async (_req, res): Promise<void> => {
  try {
    const row = await ensureSettings();
    res.set("Cache-Control", "no-store");
    res.json(toApiSettings(row!));
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateValues: Partial<typeof storeSettingsTable.$inferInsert> = {};
  if (data.storeName !== undefined) updateValues.storeName = data.storeName;
  if (data.tagline !== undefined) updateValues.tagline = data.tagline;
  if (data.logoUrl !== undefined) updateValues.logoUrl = data.logoUrl;
  if (data.activeTheme !== undefined) updateValues.activeTheme = data.activeTheme;
  if (data.contactEmail !== undefined) updateValues.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updateValues.contactPhone = data.contactPhone;
  if (data.address !== undefined) updateValues.address = data.address;
  if (data.freeShippingThreshold !== undefined)
    updateValues.freeShippingThreshold = data.freeShippingThreshold != null ? data.freeShippingThreshold.toString() : null;
  if (data.flatShippingRate !== undefined)
    updateValues.flatShippingRate = data.flatShippingRate.toString();
  if (data.taxRate !== undefined)
    updateValues.taxRate = data.taxRate.toString();
  if (data.taxInclusive !== undefined) updateValues.taxInclusive = data.taxInclusive;
  if (data.facebookUrl !== undefined) updateValues.facebookUrl = data.facebookUrl;
  if (data.instagramUrl !== undefined) updateValues.instagramUrl = data.instagramUrl;
  if (data.twitterUrl !== undefined) updateValues.twitterUrl = data.twitterUrl;
  if (data.whatsappNumber !== undefined) updateValues.whatsappNumber = data.whatsappNumber;
  if (data.navbarBgColor !== undefined) updateValues.navbarBgColor = data.navbarBgColor;
  if (data.navbarTextColor !== undefined) updateValues.navbarTextColor = data.navbarTextColor;

  try {
    // Upsert: insert if not exists, update otherwise
    await db
      .insert(storeSettingsTable)
      .values({ id: 1, ...DEFAULT_SETTINGS, flatShippingRate: "0", taxRate: "0", ...updateValues })
      .onConflictDoUpdate({ target: storeSettingsTable.id, set: updateValues });

    const row = await db.select().from(storeSettingsTable).where(eq(storeSettingsTable.id, 1)).limit(1);
    res.json(toApiSettings(row[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
