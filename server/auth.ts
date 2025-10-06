import bcrypt from 'bcrypt';
import { db } from './storage';
import { users, insertUserSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  credits: number; // Legacy field
  credits_zhi1: number;
  credits_zhi2: number;
  credits_zhi3: number;
  credits_zhi4: number;
}

export interface SessionData {
  userId: number;
  username: string;
}

// Registration schema
export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email().optional().or(z.literal(''))
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export async function registerUser(data: z.infer<typeof registerSchema>): Promise<AuthUser> {
  const { username, password, email } = data;
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existingUser.length > 0) {
    throw new Error('Username already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const newUser = await db.insert(users).values({
    username,
    password: hashedPassword,
    email: email || undefined,
    credits: 0
  }).returning();

  return {
    id: newUser[0].id,
    username: newUser[0].username,
    email: newUser[0].email || undefined,
    credits: newUser[0].credits,
    credits_zhi1: newUser[0].credits_zhi1,
    credits_zhi2: newUser[0].credits_zhi2,
    credits_zhi3: newUser[0].credits_zhi3,
    credits_zhi4: newUser[0].credits_zhi4
  };
}

export async function loginUser(username: string, password: string): Promise<AuthUser> {
  // Special case for jmkuczynski - no password required, unlimited credits
  if (username.toLowerCase() === 'jmkuczynski') {
    // Try to find existing user
    let user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    // Create user if doesn't exist
    if (user.length === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10); // Dummy password
      const newUser = await db.insert(users).values({
        username: username,
        password: hashedPassword,
        credits: 999999
      }).returning();
      
      return {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email || undefined,
        credits: 999999,
        credits_zhi1: 999999,
        credits_zhi2: 999999,
        credits_zhi3: 999999,
        credits_zhi4: 999999
      };
    }
    
    // Return existing user with unlimited credits
    return {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email || undefined,
      credits: 999999,
      credits_zhi1: 999999,
      credits_zhi2: 999999,
      credits_zhi3: 999999,
      credits_zhi4: 999999
    };
  }
  
  // Normal login flow for other users
  const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (user.length === 0) {
    throw new Error('Invalid username or password');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user[0].password);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  return {
    id: user[0].id,
    username: user[0].username,
    email: user[0].email || undefined,
    credits: user[0].credits,
    credits_zhi1: user[0].credits_zhi1,
    credits_zhi2: user[0].credits_zhi2,
    credits_zhi3: user[0].credits_zhi3,
    credits_zhi4: user[0].credits_zhi4
  };
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (user.length === 0) {
    return null;
  }

  // Special case for jmkuczynski - always unlimited credits
  const isAdmin = user[0].username.toLowerCase() === 'jmkuczynski';
  const credits = isAdmin ? 999999 : user[0].credits;

  return {
    id: user[0].id,
    username: user[0].username,
    email: user[0].email || undefined,
    credits: credits,
    credits_zhi1: isAdmin ? 999999 : user[0].credits_zhi1,
    credits_zhi2: isAdmin ? 999999 : user[0].credits_zhi2,
    credits_zhi3: isAdmin ? 999999 : user[0].credits_zhi3,
    credits_zhi4: isAdmin ? 999999 : user[0].credits_zhi4
  };
}

export async function updateUserCredits(userId: number, creditsToAdd: number): Promise<void> {
  await db.update(users)
    .set({ credits: sql`${users.credits} + ${creditsToAdd}` })
    .where(eq(users.id, userId));
}

export async function deductUserCredits(userId: number, creditsToDeduct: number): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0 || user[0].credits < creditsToDeduct) {
    return false;
  }

  await db.update(users)
    .set({ credits: user[0].credits - creditsToDeduct })
    .where(eq(users.id, userId));

  return true;
}

// Calculate word count from text
export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Deduct provider-specific credits
export async function deductProviderCredits(
  userId: number, 
  provider: 'zhi1' | 'zhi2' | 'zhi3' | 'zhi4', 
  wordCount: number
): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (user.length === 0) {
    return { success: false, error: 'User not found' };
  }

  // Special case for jmkuczynski - unlimited credits
  if (user[0].username.toLowerCase() === 'jmkuczynski') {
    return { success: true, remainingCredits: 999999 };
  }

  const creditField = `credits_${provider}` as const;
  const currentCredits = user[0][creditField];

  if (currentCredits < wordCount) {
    return { 
      success: false, 
      error: `Insufficient credits for ${provider}. Need ${wordCount} words, have ${currentCredits}.` 
    };
  }

  await db.update(users)
    .set({ [creditField]: currentCredits - wordCount })
    .where(eq(users.id, userId));

  return { success: true, remainingCredits: currentCredits - wordCount };
}

// Check if user has sufficient credits for all providers
export async function checkAllProvidersCredits(
  userId: number,
  wordCount: number
): Promise<{ success: boolean; insufficientProviders?: string[]; credits?: Record<string, number> }> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (user.length === 0) {
    return { success: false };
  }

  // Special case for jmkuczynski - unlimited credits
  if (user[0].username.toLowerCase() === 'jmkuczynski') {
    return { 
      success: true, 
      credits: { 
        zhi1: 999999, 
        zhi2: 999999, 
        zhi3: 999999, 
        zhi4: 999999 
      } 
    };
  }

  const insufficientProviders: string[] = [];
  const credits = {
    zhi1: user[0].credits_zhi1,
    zhi2: user[0].credits_zhi2,
    zhi3: user[0].credits_zhi3,
    zhi4: user[0].credits_zhi4
  };

  if (credits.zhi1 < wordCount) insufficientProviders.push('Zhi1');
  if (credits.zhi2 < wordCount) insufficientProviders.push('Zhi2');
  if (credits.zhi3 < wordCount) insufficientProviders.push('Zhi3');
  if (credits.zhi4 < wordCount) insufficientProviders.push('Zhi4');

  return {
    success: insufficientProviders.length === 0,
    insufficientProviders: insufficientProviders.length > 0 ? insufficientProviders : undefined,
    credits
  };
} 
import express from 'express';
export const authRouter = express.Router();

// ...existing functions above...

// ✅ Add this near the bottom of server/auth.ts
authRouter.get('/me', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const user = await getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});
