import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
