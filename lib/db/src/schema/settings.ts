import { mysqlTable, serial, text } from "drizzle-orm/mysql-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// قمنا بتغيير الاسم هنا من settings إلى storeSettingsTable ليتوافق مع السيرفر
export const storeSettingsTable = mysqlTable("settings", {
  id: serial("id").primaryKey(),
  heroTitle: text("hero_title").notNull(),
  heroDescription: text("hero_description").notNull(),
  heroImage: text("hero_image").notNull(),
});

export const insertSettingsSchema = createInsertSchema(storeSettingsTable);
export const selectSettingsSchema = createSelectSchema(storeSettingsTable);
export type Settings = z.infer<typeof selectSettingsSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
