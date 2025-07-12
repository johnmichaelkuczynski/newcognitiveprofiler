import { users, documents, analysisRequests, type User, type InsertUser, type Document, type InsertDocument, type InsertAnalysisRequest, type AnalysisRequest } from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokenBalance(userId: string, tokenBalance: number): Promise<void>;
  
  // Document management
  createDocument(document: InsertDocument): Promise<Document>;
  getUserDocuments(userId: string): Promise<Document[]>;
  getDocument(id: string, userId: string): Promise<Document | undefined>;
  deleteDocument(id: string, userId: string): Promise<void>;
  
  // Analysis requests
  createAnalysisRequest(request: InsertAnalysisRequest): Promise<AnalysisRequest>;
  getUserAnalysisRequests(userId: string): Promise<AnalysisRequest[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private analysisRequests: Map<string, AnalysisRequest>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.analysisRequests = new Map();
    this.currentId = 1;
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = `user_${this.currentId++}`;
    const user: User = { 
      ...insertUser, 
      id,
      token_balance: 0,
      created_at: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokenBalance(userId: string, tokenBalance: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.token_balance = tokenBalance;
      this.users.set(userId, user);
    }
  }

  // Document management
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = `doc_${this.currentId++}`;
    const document: Document = {
      ...insertDocument,
      id,
      uploaded_at: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.user_id === userId
    );
  }

  async getDocument(id: string, userId: string): Promise<Document | undefined> {
    const document = this.documents.get(id);
    return document?.user_id === userId ? document : undefined;
  }

  async deleteDocument(id: string, userId: string): Promise<void> {
    const document = this.documents.get(id);
    if (document?.user_id === userId) {
      this.documents.delete(id);
    }
  }

  // Analysis requests
  async createAnalysisRequest(insertRequest: InsertAnalysisRequest): Promise<AnalysisRequest> {
    const id = `req_${this.currentId++}`;
    const request: AnalysisRequest = {
      ...insertRequest,
      id,
      result: null,
      created_at: new Date()
    };
    this.analysisRequests.set(id, request);
    return request;
  }

  async getUserAnalysisRequests(userId: string): Promise<AnalysisRequest[]> {
    return Array.from(this.analysisRequests.values()).filter(
      (req) => req.user_id === userId
    );
  }
}

export const storage = new MemStorage();
