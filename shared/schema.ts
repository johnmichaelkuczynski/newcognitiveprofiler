import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and credits management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email"), // Optional email field
  credits: integer("credits").default(0).notNull(), // Legacy field - kept for backward compatibility
  credits_zhi1: integer("credits_zhi1").default(0).notNull(), // DeepSeek word credits
  credits_zhi2: integer("credits_zhi2").default(0).notNull(), // OpenAI word credits
  credits_zhi3: integer("credits_zhi3").default(0).notNull(), // Anthropic word credits
  credits_zhi4: integer("credits_zhi4").default(0).notNull(), // Perplexity word credits
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const analysisRequests = pgTable("analysis_requests", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  text: text("text").notNull(),
  result: text("result"),
  analysis_type: text("analysis_type").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Payment transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // Amount in cents
  credits: integer("credits").notNull(), // Number of credits purchased (legacy)
  credits_zhi1: integer("credits_zhi1").default(0).notNull(), // DeepSeek word credits purchased
  credits_zhi2: integer("credits_zhi2").default(0).notNull(), // OpenAI word credits purchased
  credits_zhi3: integer("credits_zhi3").default(0).notNull(), // Anthropic word credits purchased
  credits_zhi4: integer("credits_zhi4").default(0).notNull(), // Perplexity word credits purchased
  provider: text("provider"), // Which provider this purchase is for (zhi1, zhi2, zhi3, zhi4, or 'all')
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
  paypal_transaction_id: text("paypal_transaction_id"),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Schema for user registration
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});

// Schema for analysis requests
export const insertAnalysisRequestSchema = createInsertSchema(analysisRequests).pick({
  text: true,
  analysis_type: true
});

// Schema for transactions
export const insertTransactionSchema = createInsertSchema(transactions).pick({
  user_id: true,
  amount: true,
  credits: true,
  paypal_transaction_id: true,
  status: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
