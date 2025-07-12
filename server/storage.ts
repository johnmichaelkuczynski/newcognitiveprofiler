import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { users, documents, tokenTransactions, type User, type InsertUser, type Document, type InsertDocument, type TokenTransaction, type InsertTokenTransaction } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokenBalance(userId: string, balance: number): Promise<void>;
  
  // Document methods
  getUserDocuments(userId: string): Promise<Document[]>;
  saveDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(documentId: string, userId: string): Promise<void>;
  
  // Token methods
  addTokens(userId: string, amount: number, paymentIntentId: string): Promise<void>;
  deductTokens(userId: string, amount: number, description: string): Promise<boolean>;
  getUserTokenBalance(userId: string): Promise<number>;
  getTokenTransactions(userId: string): Promise<TokenTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserTokenBalance(userId: string, balance: number): Promise<void> {
    await db.update(users).set({ token_balance: balance }).where(eq(users.id, userId));
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.user_id, userId));
  }

  async saveDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, documentId));
  }

  async addTokens(userId: string, amount: number, paymentIntentId: string): Promise<void> {
    // Start transaction
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const newBalance = (user.token_balance || 0) + amount;
    
    // Update user balance
    await this.updateUserTokenBalance(userId, newBalance);
    
    // Record transaction
    await db.insert(tokenTransactions).values({
      user_id: userId,
      amount: amount,
      transaction_type: 'purchase',
      stripe_payment_intent_id: paymentIntentId,
      description: `Purchased ${amount} tokens`,
    });
  }

  async deductTokens(userId: string, amount: number, description: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || (user.token_balance || 0) < amount) {
      return false;
    }

    const newBalance = (user.token_balance || 0) - amount;
    
    // Update user balance
    await this.updateUserTokenBalance(userId, newBalance);
    
    // Record transaction
    await db.insert(tokenTransactions).values({
      user_id: userId,
      amount: -amount,
      transaction_type: 'usage',
      description: description,
    });

    return true;
  }

  async getUserTokenBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.token_balance || 0;
  }

  async getTokenTransactions(userId: string): Promise<TokenTransaction[]> {
    return await db.select().from(tokenTransactions).where(eq(tokenTransactions.user_id, userId));
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();

// Keep MemStorage for fallback
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private transactions: Map<string, TokenTransaction>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.transactions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      token_balance: 0, 
      created_at: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokenBalance(userId: string, balance: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.token_balance = balance;
      this.users.set(userId, user);
    }
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.user_id === userId);
  }

  async saveDocument(document: InsertDocument): Promise<Document> {
    const id = crypto.randomUUID();
    const doc: Document = { 
      ...document, 
      id, 
      uploaded_at: new Date() 
    };
    this.documents.set(id, doc);
    return doc;
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    this.documents.delete(documentId);
  }

  async addTokens(userId: string, amount: number, paymentIntentId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const newBalance = (user.token_balance || 0) + amount;
    await this.updateUserTokenBalance(userId, newBalance);

    const transaction: TokenTransaction = {
      id: crypto.randomUUID(),
      user_id: userId,
      amount: amount,
      transaction_type: 'purchase',
      stripe_payment_intent_id: paymentIntentId,
      description: `Purchased ${amount} tokens`,
      created_at: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
  }

  async deductTokens(userId: string, amount: number, description: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || (user.token_balance || 0) < amount) {
      return false;
    }

    const newBalance = (user.token_balance || 0) - amount;
    await this.updateUserTokenBalance(userId, newBalance);

    const transaction: TokenTransaction = {
      id: crypto.randomUUID(),
      user_id: userId,
      amount: -amount,
      transaction_type: 'usage',
      stripe_payment_intent_id: null,
      description: description,
      created_at: new Date(),
    };
    this.transactions.set(transaction.id, transaction);

    return true;
  }

  async getUserTokenBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.token_balance || 0;
  }

  async getTokenTransactions(userId: string): Promise<TokenTransaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.user_id === userId);
  }
}
