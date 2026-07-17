import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type OrderItem = {
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  isDigital?: boolean;
  downloadUrl?: string | null;
};

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull().default(""),
  address: text("address").notNull().default(""),
  status: text("status").notNull().default("pending"),
  // pending | processing | shipped | delivered | cancelled
  items: jsonb("items").notNull().$type<OrderItem[]>(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discountCode: text("discount_code"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
