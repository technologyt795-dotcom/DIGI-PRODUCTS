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
  drawerBgColor: null,
  drawerTextColor: null,
  refundPolicy: null,
  heroBgImage: null,
  footerBgColor: null,
  footerTextColor: null,
  footerPadding: null,
};

async function ensureSettings() {
  const existing = await db
    .select()
    .from(storeSettingsTable)
    .where(eq(storeSettingsTable.id, 1))
    .limit(1);
  if (existing.length === 0) {
    await db
      .insert(storeSettingsTable)
      .values({
        id: 1,
        ...DEFAULT_SETTINGS,
        flatShippingRate: "0",
        taxRate: "0",
      });
    return await db
      .select()
      .from(storeSettingsTable)
      .where(eq(storeSettingsTable.id, 1))
      .limit(1)
      .then((r) => r[0]);
  }
  return existing[0];
}

function toApiSettings(row: typeof storeSettingsTable.$inferSelect) {
  return {
    storeName: row.storeName,
    tagline: row.tagline,
    logoUrl: row.logoUrl ?? null,
    activeTheme: row.activeTheme as "classic" | "modern" | "minimal",
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    address: row.address,
    freeShippingThreshold:
      row.freeShippingThreshold != null
        ? parseFloat(row.freeShippingThreshold)
        : null,
    flatShippingRate: parseFloat(row.flatShippingRate),
    taxRate: parseFloat(row.taxRate),
    taxInclusive: row.taxInclusive,
    facebookUrl: row.facebookUrl ?? null,
    instagramUrl: row.instagramUrl ?? null,
    twitterUrl: row.twitterUrl ?? null,
    whatsappNumber: row.whatsappNumber ?? null,
    navbarBgColor: row.navbarBgColor ?? null,
    navbarTextColor: row.navbarTextColor ?? null,
    drawerBgColor: row.drawerBgColor ?? null,
    drawerTextColor: row.drawerTextColor ?? null,
    refundPolicy: row.refundPolicy ?? null,
    heroBgImage: row.heroBgImage ?? null,
    footerBgColor: row.footerBgColor ?? null,
    footerTextColor: row.footerTextColor ?? null,
    footerPadding: row.footerPadding ?? null,
    // Announcement bar (needed by store frontend + admin marketing)
    announcementBarEnabled: row.announcementBarEnabled ?? false,
    announcementBarText: row.announcementBarText ?? null,
    announcementBarColor: row.announcementBarColor ?? null,
    announcementBarLink: row.announcementBarLink ?? null,
    // Promo popup (needed by store frontend + admin marketing)
    popupEnabled: row.popupEnabled ?? false,
    popupTitle: row.popupTitle ?? null,
    popupMessage: row.popupMessage ?? null,
    popupDiscountCode: row.popupDiscountCode ?? null,
    popupDelay: row.popupDelay ?? 3,
    // Payment method badges
    paymentVisaEnabled: row.paymentVisaEnabled ?? true,
    paymentMastercardEnabled: row.paymentMastercardEnabled ?? true,
    paymentMadaEnabled: row.paymentMadaEnabled ?? true,
    paymentApplePayEnabled: row.paymentApplePayEnabled ?? false,
    paymentStcPayEnabled: row.paymentStcPayEnabled ?? false,
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
  if (data.activeTheme !== undefined)
    updateValues.activeTheme = data.activeTheme;
  if (data.contactEmail !== undefined)
    updateValues.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined)
    updateValues.contactPhone = data.contactPhone;
  if (data.address !== undefined) updateValues.address = data.address;
  if (data.freeShippingThreshold !== undefined)
    updateValues.freeShippingThreshold =
      data.freeShippingThreshold != null
        ? data.freeShippingThreshold.toString()
        : null;
  if (data.flatShippingRate !== undefined)
    updateValues.flatShippingRate = data.flatShippingRate.toString();
  if (data.taxRate !== undefined)
    updateValues.taxRate = data.taxRate.toString();
  if (data.taxInclusive !== undefined)
    updateValues.taxInclusive = data.taxInclusive;
  if (data.facebookUrl !== undefined)
    updateValues.facebookUrl = data.facebookUrl;
  if (data.instagramUrl !== undefined)
    updateValues.instagramUrl = data.instagramUrl;
  if (data.twitterUrl !== undefined) updateValues.twitterUrl = data.twitterUrl;
  if (data.whatsappNumber !== undefined)
    updateValues.whatsappNumber = data.whatsappNumber;
  if (data.navbarBgColor !== undefined)
    updateValues.navbarBgColor = data.navbarBgColor;
  if (data.navbarTextColor !== undefined)
    updateValues.navbarTextColor = data.navbarTextColor;
  if (data.drawerBgColor !== undefined)
    updateValues.drawerBgColor = data.drawerBgColor;
  if (data.drawerTextColor !== undefined)
    updateValues.drawerTextColor = data.drawerTextColor;
  if (data.refundPolicy !== undefined)
    updateValues.refundPolicy = data.refundPolicy;
  if (data.heroBgImage !== undefined)
    updateValues.heroBgImage = data.heroBgImage;
  if (data.footerBgColor !== undefined)
    updateValues.footerBgColor = data.footerBgColor;
  if (data.footerTextColor !== undefined)
    updateValues.footerTextColor = data.footerTextColor;
  if (data.footerPadding !== undefined)
    updateValues.footerPadding = data.footerPadding;
  // Announcement bar
  if ((data as any).announcementBarEnabled !== undefined)
    updateValues.announcementBarEnabled = (data as any).announcementBarEnabled;
  if ((data as any).announcementBarText !== undefined)
    updateValues.announcementBarText = (data as any).announcementBarText;
  if ((data as any).announcementBarColor !== undefined)
    updateValues.announcementBarColor = (data as any).announcementBarColor;
  if ((data as any).announcementBarLink !== undefined)
    updateValues.announcementBarLink = (data as any).announcementBarLink;
  // Promo popup
  if ((data as any).popupEnabled !== undefined)
    updateValues.popupEnabled = (data as any).popupEnabled;
  if ((data as any).popupTitle !== undefined)
    updateValues.popupTitle = (data as any).popupTitle;
  if ((data as any).popupMessage !== undefined)
    updateValues.popupMessage = (data as any).popupMessage;
  if ((data as any).popupDiscountCode !== undefined)
    updateValues.popupDiscountCode = (data as any).popupDiscountCode;
  if ((data as any).popupDelay !== undefined)
    updateValues.popupDelay = (data as any).popupDelay;
  // Payment method badges
  if ((data as any).paymentVisaEnabled !== undefined)
    updateValues.paymentVisaEnabled = (data as any).paymentVisaEnabled;
  if ((data as any).paymentMastercardEnabled !== undefined)
    updateValues.paymentMastercardEnabled = (
      data as any
    ).paymentMastercardEnabled;
  if ((data as any).paymentMadaEnabled !== undefined)
    updateValues.paymentMadaEnabled = (data as any).paymentMadaEnabled;
  if ((data as any).paymentApplePayEnabled !== undefined)
    updateValues.paymentApplePayEnabled = (data as any).paymentApplePayEnabled;
  if ((data as any).paymentStcPayEnabled !== undefined)
    updateValues.paymentStcPayEnabled = (data as any).paymentStcPayEnabled;

  try {
    // Upsert: insert if not exists, update otherwise
    await db
      .insert(storeSettingsTable)
      .values({
        id: 1,
        ...DEFAULT_SETTINGS,
        flatShippingRate: "0",
        taxRate: "0",
        ...updateValues,
      })
      .onConflictDoUpdate({ target: storeSettingsTable.id, set: updateValues });

    const row = await db
      .select()
      .from(storeSettingsTable)
      .where(eq(storeSettingsTable.id, 1))
      .limit(1);
    res.json(toApiSettings(row[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
