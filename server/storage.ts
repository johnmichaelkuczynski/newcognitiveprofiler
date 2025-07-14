import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { desc } from "drizzle-orm";
import { 
  analysisRequests,
  type AnalysisRequest,
  type InsertAnalysisRequest
} from "../shared/schema";

const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client);

export class Storage {
  // Analysis request management
  async createAnalysisRequest(request: InsertAnalysisRequest): Promise<AnalysisRequest> {
    const [result] = await db
      .insert(analysisRequests)
      .values(request)
      .returning();
    return result;
  }

  async getAnalysisRequests(): Promise<AnalysisRequest[]> {
    return await db
      .select()
      .from(analysisRequests)
      .orderBy(desc(analysisRequests.created_at));
  }
}

export const storage = new Storage();