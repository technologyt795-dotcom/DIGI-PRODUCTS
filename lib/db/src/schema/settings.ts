import { pgTable, text, numeric, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Single-row settings table (always id=1)
export const storeSettingsTable = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),
  storeName: text("store_name").notNull().default("My Store"),
  tagline: text("tagline").notNull().default(""),
  logoUrl: text("logo_url"),
  activeTheme: text("active_theme").notNull().default("classic"),
  contactEmail: text("contact_email").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  address: text("address").notNull().default(""),
  freeShippingThreshold: numeric("free_shipping_threshold", {
    precision: 10,
    scale: 2,
  }),
  flatShippingRate: numeric("flat_shipping_rate", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  taxInclusive: boolean("tax_inclusive").notNull().default(false),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  whatsappNumber: text("whatsapp_number"),
  navbarBgColor: text("navbar_bg_color"),
  navbarTextColor: text("navbar_text_color"),
});

export const insertStoreSettingsSchema = createInsertSchema(
  storeSettingsTable,
).omit({ id: true });
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type StoreSettings = typeof storeSettingsTable.$inferSelect;
