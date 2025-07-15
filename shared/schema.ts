import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table removed - no authentication needed

export const analysisRequests = pgTable("analysis_requests", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  result: text("result"),
  created_at: text("created_at").notNull()
});

export const insertAnalysisRequestSchema = createInsertSchema(analysisRequests).pick({
  text: true
});

// User types removed - no authentication needed
export type InsertAnalysisRequest = z.infer<typeof insertAnalysisRequestSchema>;
export type AnalysisRequest = typeof analysisRequests.$inferSelect;
