import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  users, 
  storedAnalyses, 
  creditTransactions, 
  analysisRequests,
  type User,
  type InsertUser,
  type StoredAnalysis,
  type InsertStoredAnalysis,
  type CreditTransaction,
  type InsertCreditTransaction,
  type AnalysisRequest,
  type InsertAnalysisRequest
} from "../shared/schema";
import bcrypt from "bcrypt";

const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client);

export class Storage {
  // User management
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user || null;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUserCredits(userId: number, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        credits,
        updated_at: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Credit management
  async addCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const [result] = await db
      .insert(creditTransactions)
      .values(transaction)
      .returning();
    
    // Update user's credit balance
    const user = await this.getUserById(transaction.user_id);
    if (user) {
      await this.updateUserCredits(transaction.user_id, user.credits + transaction.amount);
    }
    
    return result;
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.user_id, userId))
      .orderBy(desc(creditTransactions.created_at));
  }

  async getUserCredits(userId: number): Promise<number> {
    const user = await this.getUserById(userId);
    return user?.credits || 0;
  }

  // Analysis storage
  async storeAnalysis(analysis: InsertStoredAnalysis): Promise<StoredAnalysis> {
    const [result] = await db
      .insert(storedAnalyses)
      .values(analysis)
      .returning();
    return result;
  }

  async getUserAnalyses(userId: number): Promise<StoredAnalysis[]> {
    return await db
      .select()
      .from(storedAnalyses)
      .where(eq(storedAnalyses.user_id, userId))
      .orderBy(desc(storedAnalyses.created_at));
  }

  async getAnalysisById(id: number, userId: number): Promise<StoredAnalysis | null> {
    const [analysis] = await db
      .select()
      .from(storedAnalyses)
      .where(and(
        eq(storedAnalyses.id, id),
        eq(storedAnalyses.user_id, userId)
      ))
      .limit(1);
    return analysis || null;
  }

  async deleteAnalysis(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(storedAnalyses)
      .where(and(
        eq(storedAnalyses.id, id),
        eq(storedAnalyses.user_id, userId)
      ));
    return result.rowCount > 0;
  }

  // Analysis request tracking
  async createAnalysisRequest(request: InsertAnalysisRequest): Promise<AnalysisRequest> {
    const [result] = await db
      .insert(analysisRequests)
      .values(request)
      .returning();
    return result;
  }

  async getAnalysisRequests(userId?: number): Promise<AnalysisRequest[]> {
    const query = db
      .select()
      .from(analysisRequests)
      .orderBy(desc(analysisRequests.created_at));
    
    if (userId) {
      return await query.where(eq(analysisRequests.user_id, userId));
    }
    
    return await query;
  }

  // Storage fee calculation
  async calculateStorageFees(userId: number): Promise<number> {
    const analyses = await this.getUserAnalyses(userId);
    const totalWords = analyses.reduce((sum, analysis) => sum + analysis.word_count, 0);
    
    // 500 tokens per month for every 50,000 words
    const monthlyFee = Math.ceil(totalWords / 50000) * 500;
    return monthlyFee;
  }

  // Charge storage fees (to be called monthly)
  async chargeStorageFees(userId: number): Promise<void> {
    const monthlyFee = await this.calculateStorageFees(userId);
    if (monthlyFee > 0) {
      await this.addCreditTransaction({
        user_id: userId,
        amount: -monthlyFee,
        type: "storage",
        description: `Monthly storage fee for stored analyses`
      });
    }
  }

  // Check if user has sufficient credits
  async hasCredits(userId: number, amount: number): Promise<boolean> {
    const credits = await this.getUserCredits(userId);
    return credits >= amount;
  }

  // Deduct credits for analysis
  async deductCredits(userId: number, amount: number, description: string): Promise<boolean> {
    const hasEnough = await this.hasCredits(userId, amount);
    if (!hasEnough) return false;
    
    await this.addCreditTransaction({
      user_id: userId,
      amount: -amount,
      type: "analysis",
      description
    });
    
    return true;
  }
}

export const storage = new Storage();