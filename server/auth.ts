import bcrypt from 'bcrypt';
import { User, InsertUser } from '@shared/schema';
import { storage } from './storage';

export interface AuthResult {
  success: boolean;
  user?: User;
  message?: string;
}

export async function registerUser(username: string, password: string): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await storage.createUser({
      username,
      password_hash,
    });

    return { success: true, user: newUser };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  try {
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return { success: false, message: 'Invalid username or password' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed' };
  }
}

export function isAuthenticated(session: any): boolean {
  return !!(session && session.userId);
}

export function getSessionUserId(session: any): string | null {
  return session?.userId || null;
}