import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categoriesTable.id),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  images: text("images").array().notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  badge: text("badge"),
  isDigital: boolean("is_digital").notNull().default(false),
  isHidden: boolean("is_hidden").notNull().default(false),
  downloadUrls: text("download_urls").array().notNull().default([]),
  downloadLabels: text("download_labels").array().notNull().default([]),
  productUrl: text("product_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
