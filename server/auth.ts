import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

export interface SessionData {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.authToken || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    req.user = undefined;
    req.userId = undefined;
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    req.user = undefined;
    req.userId = undefined;
    return next();
  }

  try {
    const user = await storage.getUser(decoded.userId);
    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    req.user = undefined;
    req.userId = undefined;
    next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function getSessionId(req: AuthRequest): string {
  // Use user ID if authenticated, otherwise use session ID
  return req.userId || req.sessionID || 'anonymous';
}

export async function deductTokens(userId: string, amount: number): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user || user.token_balance < amount) {
    return false;
  }
  
  await storage.updateUserTokenBalance(userId, user.token_balance - amount);
  return true;
}

export async function addTokens(userId: string, amount: number): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const newBalance = (user.token_balance || 0) + amount;
  await storage.updateUserTokenBalance(userId, newBalance);
}

export function calculateTokenUsage(inputText: string, outputText: string): number {
  // Simple token estimation: roughly 4 characters per token
  const inputTokens = Math.ceil(inputText.length / 4);
  const outputTokens = Math.ceil(outputText.length / 4);
  return inputTokens + outputTokens;
}

export function calculateUploadTokens(wordCount: number): number {
  // 1 token per 100 words, minimum 100 tokens, maximum 10,000 tokens
  const tokens = Math.ceil(wordCount / 100);
  return Math.max(100, Math.min(10000, tokens));
}

export function truncatePreview(text: string, maxWords: number = 50): string {
  const words = text.split(' ');
  if (words.length <= maxWords) {
    return text;
  }
  
  return words.slice(0, maxWords).join(' ') + '...';
}