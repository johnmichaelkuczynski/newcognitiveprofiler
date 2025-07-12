import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  AuthRequest, 
  authenticateToken, 
  requireAuth 
} from './auth';
import { 
  createCheckoutSession, 
  handleWebhook, 
  PRICING_TIERS, 
  getPricingTier 
} from './payments';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const purchaseSchema = z.object({
  tokens: z.number().min(1000),
});

export function registerAuthRoutes(app: Express) {
  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Hash password and create user
      const password_hash = await hashPassword(password);
      const user = await storage.createUser({ email, password_hash });
      
      // Generate token
      const token = generateToken(user.id, user.email);
      
      // Set cookie and return user data
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          token_balance: user.token_balance || 0,
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isValid = await comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate token
      const token = generateToken(user.id, user.email);
      
      // Set cookie and return user data
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          token_balance: user.token_balance || 0,
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('authToken');
    res.json({ message: 'Logged out successfully' });
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        token_balance: req.user.token_balance || 0,
      }
    });
  });

  // Get pricing tiers
  app.get('/api/pricing', (req: Request, res: Response) => {
    res.json({ tiers: PRICING_TIERS });
  });

  // Create checkout session
  app.post('/api/purchase', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { tokens } = purchaseSchema.parse(req.body);
      
      const pricingTier = getPricingTier(tokens);
      if (!pricingTier) {
        return res.status(400).json({ error: 'Invalid token amount' });
      }
      
      const checkoutUrl = await createCheckoutSession(
        req.user!.id,
        req.user!.email,
        tokens,
        pricingTier.price
      );
      
      res.json({ checkoutUrl });
    } catch (error) {
      console.error('Purchase error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Stripe webhook
  app.post('/api/webhook/stripe', async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    
    try {
      await handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook failed' });
    }
  });
}