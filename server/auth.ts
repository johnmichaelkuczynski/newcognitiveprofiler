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
  credits: number;
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
    credits: newUser[0].credits
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
        credits: 999999
      };
    }
    
    // Return existing user with unlimited credits
    return {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email || undefined,
      credits: 999999
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
    credits: user[0].credits
  };
}

export async function getUserById(id: number): Promise<AuthUser | null> {
  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (user.length === 0) {
    return null;
  }

  // Special case for jmkuczynski - always unlimited credits
  const credits = user[0].username.toLowerCase() === 'jmkuczynski' ? 999999 : user[0].credits;

  return {
    id: user[0].id,
    username: user[0].username,
    email: user[0].email || undefined,
    credits: credits
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