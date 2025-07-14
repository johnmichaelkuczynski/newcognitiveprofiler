import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Analysis requests for all users (no authentication required)
export const analysisRequests = pgTable("analysis_requests", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  result: text("result"),
  analysis_type: text("analysis_type").notNull().default("cognitive"),
  created_at: timestamp("created_at").defaultNow().notNull()
});

// Insert schemas
export const insertAnalysisRequestSchema = createInsertSchema(analysisRequests).pick({
  text: true,
  analysis_type: true,
  result: true
});

// Types
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;

// Analysis types
export type AnalysisType = "cognitive" | "psychological";