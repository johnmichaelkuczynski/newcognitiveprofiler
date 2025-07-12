import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { analyzeTextWithAllProviders } from "./ai";
import { generateComprehensiveReport } from "./ai/comprehensiveReport";
import { generateComprehensivePsychologicalReport } from "./ai/psychologicalComprehensiveReport";
import { generateWordDocument, generatePdfDocument } from "./documentGenerator";
import { parseDocument } from "./documentParser";
import { sendEmail } from "./emailService";
import { storage } from "./storage";
import { registerUser, loginUser, isAuthenticated, getSessionUserId } from "./auth";
import { createCheckoutSession, handleWebhook, calculateTokenCost, calculateDocumentTokens, TOKEN_PACKAGES } from "./stripe";
import { createPreviewMultiProviderResult, createPreviewMultiProviderPsychologicalResult } from "./preview";
import { createTables } from "./migrate";
import session from "express-session";
import express from "express";
import multer from "multer";
import { AnalysisType } from "@/types/analysis";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database tables
  if (process.env.DATABASE_URL) {
    await createTables();
  }

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication endpoints
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = await registerUser(email, password);
      
      if (result.success && result.user) {
        req.session.userId = result.user.id;
        res.json({ success: true, user: { id: result.user.id, email: result.user.email, token_balance: result.user.token_balance } });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = await loginUser(email, password);
      
      if (result.success && result.user) {
        req.session.userId = result.user.id;
        res.json({ success: true, user: { id: result.user.id, email: result.user.email, token_balance: result.user.token_balance } });
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/me", async (req, res) => {
    try {
      const userId = getSessionUserId(req.session);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user: { id: user.id, email: user.email, token_balance: user.token_balance } });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Token purchase endpoints
  app.get("/api/token-packages", (req, res) => {
    res.json(TOKEN_PACKAGES);
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const userId = getSessionUserId(req.session);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { packageIndex } = req.body;
      if (typeof packageIndex !== 'number' || packageIndex < 0 || packageIndex >= TOKEN_PACKAGES.length) {
        return res.status(400).json({ error: "Invalid package selected" });
      }

      const checkoutUrl = await createCheckoutSession(userId, packageIndex);
      res.json({ url: checkoutUrl });
    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Stripe webhook endpoint
  app.post("/api/stripe-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      await handleWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook failed" });
    }
  });

  // Analyze text endpoint for both cognitive and psychological analysis
  app.post("/api/analyze-all", async (req, res) => {
    try {
      const { text, analysisType = "cognitive" } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      if (text.length < 100) {
        return res.status(400).json({ error: "Text must be at least 100 characters long" });
      }

      const userId = getSessionUserId(req.session);
      const isLoggedIn = !!userId;

      console.log(`Starting ${analysisType} analysis...`);
      let result = await analyzeTextWithAllProviders(text, analysisType as AnalysisType);
      
      if (isLoggedIn) {
        // Calculate and deduct tokens for registered users
        const inputTokens = Math.ceil(text.length / 4); // Rough estimate: 4 chars per token
        const outputTokens = Math.ceil(JSON.stringify(result).length / 4);
        const totalTokens = await calculateTokenCost(inputTokens, outputTokens);
        
        const deductionSuccess = await storage.deductTokens(userId, totalTokens, `${analysisType} analysis`);
        
        if (!deductionSuccess) {
          return res.status(402).json({ 
            error: "Insufficient tokens", 
            tokensNeeded: totalTokens,
            message: "🔒 You've used all your credits. [Buy More Credits]" 
          });
        }
      } else {
        // Return preview for unregistered users
        if (analysisType === "cognitive") {
          result = createPreviewMultiProviderResult(result);
        } else {
          result = createPreviewMultiProviderPsychologicalResult(result);
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = getSessionUserId(req.session);
      const isLoggedIn = !!userId;

      // Parse the uploaded file
      const extractedText = await parseDocument(req.file);
      
      if (!extractedText || extractedText.length < 100) {
        return res.status(400).json({ 
          error: "Could not extract enough text from the file. Please ensure the file contains at least 100 characters of readable text." 
        });
      }

      const wordCount = extractedText.split(/\s+/).length;

      if (isLoggedIn) {
        // Calculate and deduct tokens for document processing
        const tokens = await calculateDocumentTokens(wordCount);
        const deductionSuccess = await storage.deductTokens(userId, tokens, `Document upload: ${req.file.originalname}`);
        
        if (!deductionSuccess) {
          return res.status(402).json({ 
            error: "Insufficient tokens for document processing", 
            tokensNeeded: tokens,
            message: "🔒 You've used all your credits. [Buy More Credits]" 
          });
        }

        // Save document for registered users
        await storage.saveDocument({
          user_id: userId,
          filename: req.file.originalname,
          content: extractedText,
          word_count: wordCount,
        });
      }

      res.json({ 
        text: extractedText,
        filename: req.file.originalname,
        size: req.file.size,
        wordCount: wordCount,
        isPreview: !isLoggedIn,
        message: isLoggedIn ? undefined : "🔒 Uploading for long-term storage requires registration. [Register & Unlock]"
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "File upload failed" });
    }
  });

  // User documents endpoint
  app.get("/api/my-documents", async (req, res) => {
    try {
      const userId = getSessionUserId(req.session);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Delete document endpoint
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const userId = getSessionUserId(req.session);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      await storage.deleteDocument(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Generate comprehensive cognitive report
  app.post("/api/generate-report", async (req, res) => {
    try {
      const { text, provider = "openai" } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const userId = getSessionUserId(req.session);
      
      if (!userId) {
        return res.status(401).json({ error: "Registration required for full reports" });
      }

      // Calculate tokens for comprehensive report (higher cost)
      const inputTokens = Math.ceil(text.length / 4);
      const estimatedOutputTokens = 2000; // Comprehensive reports are longer
      const totalTokens = await calculateTokenCost(inputTokens, estimatedOutputTokens);
      
      const deductionSuccess = await storage.deductTokens(userId, totalTokens, `Comprehensive report: ${provider}`);
      
      if (!deductionSuccess) {
        return res.status(402).json({ 
          error: "Insufficient tokens", 
          tokensNeeded: totalTokens,
          message: "🔒 You've used all your credits. [Buy More Credits]" 
        });
      }

      console.log(`Generating comprehensive report with ${provider}...`);
      const report = await generateComprehensiveReport(text, provider);
      
      res.json(report);
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Report generation failed" });
    }
  });

  // Generate comprehensive psychological report
  app.post("/api/generate-psychological-report", async (req, res) => {
    try {
      const { text, provider = "openai" } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const userId = getSessionUserId(req.session);
      
      if (!userId) {
        return res.status(401).json({ error: "Registration required for full reports" });
      }

      // Calculate tokens for comprehensive report (higher cost)
      const inputTokens = Math.ceil(text.length / 4);
      const estimatedOutputTokens = 2000; // Comprehensive reports are longer
      const totalTokens = await calculateTokenCost(inputTokens, estimatedOutputTokens);
      
      const deductionSuccess = await storage.deductTokens(userId, totalTokens, `Comprehensive psychological report: ${provider}`);
      
      if (!deductionSuccess) {
        return res.status(402).json({ 
          error: "Insufficient tokens", 
          tokensNeeded: totalTokens,
          message: "🔒 You've used all your credits. [Buy More Credits]" 
        });
      }

      console.log(`Generating comprehensive psychological report with ${provider}...`);
      const report = await generateComprehensivePsychologicalReport(text, provider);
      
      res.json(report);
    } catch (error) {
      console.error("Psychological report generation error:", error);
      res.status(500).json({ error: "Psychological report generation failed" });
    }
  });

  // Document generation endpoint
  app.post("/api/generate-document", async (req, res) => {
    try {
      const { analysisResult, provider, format = "pdf" } = req.body;
      
      if (!analysisResult || !provider) {
        return res.status(400).json({ error: "Analysis result and provider are required" });
      }

      const userId = getSessionUserId(req.session);
      
      if (!userId) {
        return res.status(401).json({ error: "Registration required for document generation" });
      }

      // Deduct tokens for document generation
      const tokens = 50; // Fixed cost for document generation
      const deductionSuccess = await storage.deductTokens(userId, tokens, `Document generation: ${format}`);
      
      if (!deductionSuccess) {
        return res.status(402).json({ 
          error: "Insufficient tokens", 
          tokensNeeded: tokens,
          message: "🔒 You've used all your credits. [Buy More Credits]" 
        });
      }

      let buffer: Buffer;
      let filename: string;
      let contentType: string;

      if (format === "docx") {
        buffer = await generateWordDocument(analysisResult, provider);
        filename = `cognitive-analysis-${provider}-${Date.now()}.docx`;
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        buffer = await generatePdfDocument(analysisResult, provider);
        filename = `cognitive-analysis-${provider}-${Date.now()}.pdf`;
        contentType = "application/pdf";
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error("Document generation error:", error);
      res.status(500).json({ error: "Document generation failed" });
    }
  });

  // Email sharing endpoint
  app.post("/api/share-email", async (req, res) => {
    try {
      const { 
        analysisResult, 
        provider, 
        recipientEmail, 
        senderName, 
        format = "pdf" 
      } = req.body;
      
      if (!analysisResult || !provider || !recipientEmail) {
        return res.status(400).json({ 
          error: "Analysis result, provider, and recipient email are required" 
        });
      }

      const userId = getSessionUserId(req.session);
      
      if (!userId) {
        return res.status(401).json({ error: "Registration required for email sharing" });
      }

      // Deduct tokens for email sharing
      const tokens = 100; // Fixed cost for email sharing
      const deductionSuccess = await storage.deductTokens(userId, tokens, `Email sharing: ${recipientEmail}`);
      
      if (!deductionSuccess) {
        return res.status(402).json({ 
          error: "Insufficient tokens", 
          tokensNeeded: tokens,
          message: "🔒 You've used all your credits. [Buy More Credits]" 
        });
      }

      let buffer: Buffer;
      let filename: string;
      let contentType: string;

      if (format === "docx") {
        buffer = await generateWordDocument(analysisResult, provider);
        filename = `cognitive-analysis-${provider}-${Date.now()}.docx`;
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        buffer = await generatePdfDocument(analysisResult, provider);
        filename = `cognitive-analysis-${provider}-${Date.now()}.pdf`;
        contentType = "application/pdf";
      }

      // Send email with attachment
      const emailSent = await sendEmail({
        to: recipientEmail,
        subject: `Cognitive Analysis Report - ${getProviderName(provider)}`,
        html: `
          <h2>Cognitive Analysis Report</h2>
          <p>Hello,</p>
          <p>${senderName ? `${senderName} has` : 'Someone has'} shared a cognitive analysis report with you.</p>
          <p>The report is attached to this email and contains insights about cognitive patterns and intelligence analysis.</p>
          <p>Best regards,<br>The Cognitive Profiler Team</p>
        `,
        attachments: [{
          content: buffer.toString('base64'),
          filename: filename,
          type: contentType,
          disposition: 'attachment'
        }]
      });

      if (emailSent) {
        res.json({ success: true, message: "Report shared successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }

    } catch (error) {
      console.error("Email sharing error:", error);
      res.status(500).json({ error: "Email sharing failed" });
    }
  });

  const server = createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return server;
}

/**
 * Helper to get a friendly provider name
 */
function getProviderName(provider: string): string {
  const names: Record<string, string> = {
    'openai': 'OpenAI GPT-4',
    'anthropic': 'Anthropic Claude',
    'perplexity': 'Perplexity AI',
    'deepseek': 'DeepSeek'
  };
  return names[provider] || provider;
}