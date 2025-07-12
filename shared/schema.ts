import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and credit management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  credits: integer("credits").default(0).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

// Stored analyses for registered users
export const storedAnalyses = pgTable("stored_analyses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  analysis_result: text("analysis_result").notNull(),
  analysis_type: text("analysis_type").notNull(), // "cognitive" or "psychological"
  word_count: integer("word_count").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Credit transactions for tracking purchases and usage
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // positive for purchases, negative for usage
  type: text("type").notNull(), // "purchase", "analysis", "storage"
  description: text("description").notNull(),
  stripe_payment_id: text("stripe_payment_id"), // for tracking stripe payments
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Analysis requests for all users (registered and unregistered)
export const analysisRequests = pgTable("analysis_requests", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id), // null for unregistered users
  text: text("text").notNull(),
  result: text("result"),
  analysis_type: text("analysis_type").notNull().default("cognitive"),
  is_preview: boolean("is_preview").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertStoredAnalysisSchema = createInsertSchema(storedAnalyses).pick({
  user_id: true,
  title: true,
  text: true,
  analysis_result: true,
  analysis_type: true,
  word_count: true
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).pick({
  user_id: true,
  amount: true,
  type: true,
  description: true,
  stripe_payment_id: true
});

export const insertAnalysisRequestSchema = createInsertSchema(analysisRequests).pick({
  user_id: true,
  text: true,
  analysis_type: true,
  is_preview: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StoredAnalysis = typeof storedAnalyses.$inferSelect;
export type InsertStoredAnalysis = z.infer<typeof insertStoredAnalysisSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;

// Analysis types
export type AnalysisType = "cognitive" | "psychological";
