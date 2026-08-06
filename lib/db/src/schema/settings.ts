import { mysqlTable, serial, text, varchar, int } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// 1. تعريف الجدول
export const storeSettingsTable = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  heroTitle: text("hero_title").notNull(),
  heroDescription: text("hero_description").notNull(),
  heroImage: text("hero_image").notNull(),
  heroTitleColor: varchar("hero_title_color", { length: 20 }).default(
    "#000000",
  ),
  heroTitleSize: int("hero_title_size").default(60),
});

// 2. إنشاء مخططات التحقق (Zod Schemas)
export const insertSettingsSchema = createInsertSchema(storeSettingsTable);
export const selectSettingsSchema = createSelectSchema(storeSettingsTable);

// 3. تعريف الأنواع (Types) بطريقة Drizzle المباشرة (لحل مشكلة الخطوط الحمراء)
export type Settings = typeof storeSettingsTable.$inferSelect;
export type InsertSettings = typeof storeSettingsTable.$inferInsert;
