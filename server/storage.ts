import { 
  users, 
  documents, 
  token_logs,
  type User, 
  type InsertUser, 
  type Document,
  type InsertDocument,
  type TokenLog,
  type InsertTokenLog 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokenBalance(userId: string, newBalance: number): Promise<void>;
  
  // Document methods
  getUserDocuments(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string, userId: string): Promise<Document | undefined>;
  deleteDocument(id: string, userId: string): Promise<void>;
  
  // Token logging methods
  logTokenUsage(log: InsertTokenLog): Promise<void>;
  getUserTokenLogs(userId: string): Promise<TokenLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private tokenLogs: Map<string, TokenLog>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.tokenLogs = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
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

  async updateUserTokenBalance(userId: string, newBalance: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.token_balance = newBalance;
      this.users.set(userId, user);
    }
  }

  // Document methods
  async getUserDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.user_id === userId,
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = crypto.randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      uploaded_at: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string, userId: string): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    return doc && doc.user_id === userId ? doc : undefined;
  }

  async deleteDocument(id: string, userId: string): Promise<void> {
    const doc = this.documents.get(id);
    if (doc && doc.user_id === userId) {
      this.documents.delete(id);
    }
  }

  // Token logging methods
  async logTokenUsage(insertLog: InsertTokenLog): Promise<void> {
    const id = crypto.randomUUID();
    const log: TokenLog = {
      ...insertLog,
      id,
      created_at: new Date()
    };
    this.tokenLogs.set(id, log);
  }

  async getUserTokenLogs(userId: string): Promise<TokenLog[]> {
    return Array.from(this.tokenLogs.values()).filter(
      (log) => log.user_id === userId,
    );
  }
}

export const storage = new MemStorage();
