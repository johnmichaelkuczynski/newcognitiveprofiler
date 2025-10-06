import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust proxy for Replit HTTPS
app.set("trust proxy", 1);

// CORS configuration
const allowedOrigins = [
  "https://3-cognitive-profiler-johnmichaelkucz.replit.app",
  "https://cognitiveprofiler.xyz",
  "http://localhost:5000",
  process.env.REPLIT_DEV_DOMAIN
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : allowedOrigins,
  credentials: true,
}));

// Stripe webhook needs raw body - must be defined BEFORE express.json()
// This will be the actual handler, moved from routes.ts
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // Import handleWebhook dynamically to avoid circular dependencies
  const { handleWebhook } = await import('./stripe');
  
  console.log('🎯 Webhook received!');
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_NEWCOGNITIVEPROFILER;
    
    if (!webhookSecret) {
      console.error('❌ No webhook secret configured');
      return res.status(500).json({ error: 'No webhook secret configured' });
    }

    console.log('✅ Webhook secret found, processing...');
    const result = await handleWebhook(req.body, signature, webhookSecret);
    console.log('✅ Webhook processed successfully:', result);
    
    res.json({ received: true, ...result });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Webhook failed' });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
