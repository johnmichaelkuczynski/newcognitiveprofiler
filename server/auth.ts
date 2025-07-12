import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema, type User } from '@shared/schema';
import { z } from 'zod';

// Session management
const sessions = new Map<string, { userId: string; createdAt: Date; expiresAt: Date }>();

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface SessionInfo {
  userId: string;
  user?: User;
  sessionId: string;
}

// Generate secure session ID
export function generateSessionId(): string {
  return crypto.randomUUID();
}

// Create session for user
export function createSession(userId: string): string {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  sessions.set(sessionId, {
    userId,
    createdAt: new Date(),
    expiresAt
  });
  
  return sessionId;
}

// Get session info
export async function getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  // Check if session is expired
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    return null;
  }
  
  const user = await storage.getUser(session.userId);
  return {
    userId: session.userId,
    user,
    sessionId
  };
}

// Clear session
export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

// Register new user
export async function registerUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Validate input
    const validatedData = insertUserSchema.extend({
      email: z.string().email(),
      password: z.string().min(6)
    }).parse({
      email: email.toLowerCase().trim(),
      password: password
    });
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists'
      };
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(validatedData.password, saltRounds);
    
    // Create user
    const user = await storage.createUser({
      email: validatedData.email,
      password_hash
    });
    
    return {
      success: true,
      user
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Find user
    const user = await storage.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
    
    return {
      success: true,
      user
    };
  } catch (error) {
    return {
      success: false,
      error: 'Login failed'
    };
  }
}

// Clean up expired sessions (should be called periodically)
export function cleanupExpiredSessions(): void {
  const now = new Date();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}

// Middleware to check authentication
export async function requireAuth(sessionId: string): Promise<SessionInfo> {
  const sessionInfo = await getSessionInfo(sessionId);
  if (!sessionInfo) {
    throw new Error('Authentication required');
  }
  return sessionInfo;
}

// Middleware to get optional authentication
export async function optionalAuth(sessionId?: string): Promise<SessionInfo | null> {
  if (!sessionId) return null;
  return await getSessionInfo(sessionId);
}