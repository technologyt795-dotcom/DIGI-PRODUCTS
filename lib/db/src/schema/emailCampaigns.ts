import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailCampaignsTable = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  segment: text("segment").notNull().default("all"),
  // 'all' | 'vip' | 'frequent' | 'new' | 'inactive'
  status: text("status").notNull().default("draft"),
  // 'draft' | 'sent'
  recipientCount: integer("recipient_count").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertEmailCampaignSchema = createInsertSchema(
  emailCampaignsTable,
).omit({ id: true, createdAt: true, recipientCount: true, sentAt: true, status: true });
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaignsTable.$inferSelect;
