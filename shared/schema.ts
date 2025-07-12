import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default("gen_random_uuid()"),
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
  id: uuid("id").primaryKey().default("gen_random_uuid()"),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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

export const token_logs = pgTable("token_logs", {
  id: uuid("id").primaryKey().default("gen_random_uuid()"),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  session_id: text("session_id"),
  tokens_used: integer("tokens_used").notNull(),
  remaining_balance: integer("remaining_balance").notNull(),
  action: text("action").notNull(), // "analysis", "upload", "storage", "purchase"
  created_at: timestamp("created_at").defaultNow(),
});

export const insertTokenLogSchema = createInsertSchema(token_logs).pick({
  user_id: true,
  session_id: true,
  tokens_used: true,
  remaining_balance: true,
  action: true,
});

export const analysisRequests = pgTable("analysis_requests", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  result: text("result"),
  created_at: text("created_at").notNull()
});

export const insertAnalysisRequestSchema = createInsertSchema(analysisRequests).pick({
  text: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertTokenLog = z.infer<typeof insertTokenLogSchema>;
export type TokenLog = typeof token_logs.$inferSelect;
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
