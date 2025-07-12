import { pgTable, text, serial, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  token_balance: integer("token_balance").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password_hash: true,
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  word_count: integer("word_count"),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  user_id: true,
  filename: true,
  content: true,
  word_count: true,
});

export const analysisRequests = pgTable("analysis_requests", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  result: text("result"),
  tokens_used: integer("tokens_used").default(0),
  created_at: timestamp("created_at").defaultNow()
});

export const insertAnalysisRequestSchema = createInsertSchema(analysisRequests).pick({
  text: true,
  user_id: true,
});

export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive for purchases, negative for usage
  transaction_type: text("transaction_type").notNull(), // 'purchase', 'usage', 'refund'
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).pick({
  user_id: true,
  amount: true,
  transaction_type: true,
  stripe_payment_intent_id: true,
  description: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
