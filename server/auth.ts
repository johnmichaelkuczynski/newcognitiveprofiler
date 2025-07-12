import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { type User } from "@/shared/schema";

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      req.session.destroy((err) => {
        if (err) console.error("Session destruction error:", err);
      });
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Middleware to check if user has sufficient credits
export const requireCredits = (amount: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const hasEnough = await storage.hasCredits(req.user.id, amount);
    if (!hasEnough) {
      return res.status(402).json({ 
        message: "Insufficient credits. Please purchase more credits to continue.",
        credits: req.user.credits,
        required: amount
      });
    }
    
    next();
  };
};

// Middleware to load user info if authenticated (optional auth)
export const loadUser = async (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error("Load user error:", error);
    }
  }
  next();
};

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  store: undefined as any, // Will be set in routes.ts
};