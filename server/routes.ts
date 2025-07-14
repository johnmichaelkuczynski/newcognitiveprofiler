import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { requireAuth, requireCredits, loadUser, sessionConfig } from "./auth";
import { analyzeText, analyzeTextWithAllProviders, type ModelProvider } from "./ai";
import { parseDocument } from "./documentParser";
import { generateWordDocument, generatePdfDocument } from "./documentGenerator";
import { sendEmail } from "./emailService";
import { generateComprehensiveReport } from "./ai/comprehensiveReport";
import { generateComprehensivePsychologicalReport } from "./ai/psychologicalComprehensiveReport";
import { generatePreview, ANALYSIS_COSTS, getRegistrationMessage } from "./previewService";
import { createPaymentIntent, handleSuccessfulPayment, verifyWebhookSignature, PRICING_TIERS } from "./stripeService";
import { insertUserSchema, type AnalysisType } from "../shared/schema";
import multer from "multer";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const analyzeRequestSchema = z.object({
  text: z.string().min(100, "Text must be at least 100 characters long"),
  modelProvider: z.enum(["deepseek", "openai", "anthropic", "perplexity"]).default("deepseek"),
  analysisType: z.enum(["cognitive", "psychological"]).default("cognitive")
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const purchaseSchema = z.object({
  tier: z.enum(["tier1", "tier2", "tier3", "tier4"])
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session store
  const PgSession = connectPgSimple(session);
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: "user_sessions",
    createTableIfMissing: true
  });

  // Configure session middleware
  app.use(session({
    ...sessionConfig,
    store: sessionStore
  }));

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
  });

  // Authentication endpoints
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser({ username, password });
      
      // Create session
      req.session.userId = user.id;
      
      res.json({ 
        message: "Registration successful", 
        user: { id: user.id, username: user.username, credits: user.credits } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.session.userId = user.id;
      
      res.json({ 
        message: "Login successful", 
        user: { id: user.id, username: user.username, credits: user.credits } 
      });
    } catch (error) {
      console.error("Login error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", loadUser, (req, res) => {
    if (!req.user) {
      return res.json({ user: null });
    }
    
    res.json({ 
      user: { 
        id: req.user.id, 
        username: req.user.username, 
        credits: req.user.credits 
      } 
    });
  });

  // Payment endpoints
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { tier } = purchaseSchema.parse(req.body);
      
      const paymentIntent = await createPaymentIntent(req.user!.id, tier);
      
      res.json(paymentIntent);
    } catch (error) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/process-payment", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      await handleSuccessfulPayment(paymentIntentId);
      
      res.json({ message: "Credits added successfully" });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    
    try {
      const event = verifyWebhookSignature(req.body, signature);
      if (!event) {
        return res.status(400).json({ message: "Invalid signature" });
      }
      
      if (event.type === "payment_intent.succeeded") {
        await handleSuccessfulPayment(event.data.object.id);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  app.get("/api/pricing", (req, res) => {
    res.json(PRICING_TIERS);
  });

  app.get("/api/credit-history", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getCreditTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      console.error("Credit history error:", error);
      res.status(500).json({ message: "Failed to get credit history" });
    }
  });

  // Analysis endpoints - for unregistered users (preview only)
  app.post("/api/analyze-preview", loadUser, async (req, res) => {
    try {
      const { text, analysisType, modelProvider } = analyzeRequestSchema.parse(req.body);
      
      // If user is registered, redirect to full analysis
      if (req.user) {
        return res.status(400).json({ 
          message: "Registered users should use the full analysis endpoint",
          redirect: "/api/analyze"
        });
      }
      
      // Generate preview for unregistered users
      const preview = await generatePreview(text, modelProvider, analysisType);
      
      res.json({
        ...preview,
        registrationMessage: getRegistrationMessage(),
        analysisType,
        costs: ANALYSIS_COSTS
      });
    } catch (error) {
      console.error("Preview analysis error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to generate preview" });
    }
  });

  // Analysis endpoint - using all providers (for registered users)
  app.post("/api/analyze-all", loadUser, async (req, res) => {
    try {
      const { text, analysisType } = analyzeRequestSchema.omit({ modelProvider: true }).parse(req.body);
      
      // If user is not registered, provide preview
      if (!req.user) {
        const preview = await generatePreview(text, "deepseek", analysisType);
        return res.json({
          ...preview,
          registrationMessage: getRegistrationMessage(),
          analysisType,
          costs: ANALYSIS_COSTS
        });
      }
      
      // Check if user has sufficient credits
      const cost = ANALYSIS_COSTS[analysisType];
      const hasEnough = await storage.hasCredits(req.user.id, cost);
      
      if (!hasEnough) {
        // Instead of error, provide preview with purchase nudge
        const preview = await generatePreview(text, "deepseek", analysisType);
        return res.json({
          ...preview,
          registrationMessage: getRegistrationMessage(),
          analysisType,
          costs: ANALYSIS_COSTS,
          isPreview: true,
          userCredits: req.user.credits,
          requiredCredits: cost
        });
      }
      
      // Deduct credits
      await storage.deductCredits(req.user.id, cost, `${analysisType} analysis`);
      
      // Call all AI APIs and get combined results
      const analyses = await analyzeTextWithAllProviders(text, analysisType);
      
      // Store analysis request
      await storage.createAnalysisRequest({
        user_id: req.user.id,
        text,
        analysis_type: analysisType,
        is_preview: false
      });
      
      // Return all analysis results
      res.json(analyses);
    } catch (error) {
      console.error(`Error analyzing text with all providers (${req.body.analysisType || 'cognitive'}):`, error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze text. Please try again.";
      res.status(500).json({ 
        message: errorMessage 
      });
    }
  });
  
  // Analysis endpoint - single provider (for registered users)
  app.post("/api/analyze", loadUser, async (req, res) => {
    try {
      const { text, modelProvider, analysisType } = analyzeRequestSchema.parse(req.body);
      
      // If user is not registered, provide preview
      if (!req.user) {
        const preview = await generatePreview(text, modelProvider, analysisType);
        return res.json({
          ...preview,
          registrationMessage: getRegistrationMessage(),
          analysisType,
          costs: ANALYSIS_COSTS
        });
      }
      
      // Check if user has sufficient credits
      const cost = ANALYSIS_COSTS[analysisType];
      const hasEnough = await storage.hasCredits(req.user.id, cost);
      
      if (!hasEnough) {
        // Instead of error, provide preview with purchase nudge
        const preview = await generatePreview(text, modelProvider, analysisType);
        return res.json({
          ...preview,
          registrationMessage: getRegistrationMessage(),
          analysisType,
          costs: ANALYSIS_COSTS,
          isPreview: true,
          userCredits: req.user.credits,
          requiredCredits: cost
        });
      }
      
      // Deduct credits
      await storage.deductCredits(req.user.id, cost, `${analysisType} analysis with ${modelProvider}`);
      
      // Call appropriate AI API based on selected provider and analysis type
      const analysis = await analyzeText(text, modelProvider, analysisType);
      
      // Store analysis request
      await storage.createAnalysisRequest({
        user_id: req.user.id,
        text,
        analysis_type: analysisType,
        is_preview: false
      });
      
      // Return the analysis result
      res.json(analysis);
    } catch (error) {
      console.error(`Error analyzing text (${req.body.analysisType || 'cognitive'}):`, error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: fromZodError(error).message 
        });
      }
      
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze text. Please try again.";
      res.status(500).json({ 
        message: errorMessage 
      });
    }
  });

  // File upload endpoint for document analysis with all providers
  app.post("/api/upload-document-all", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get analysis type (defaults to cognitive)
      const analysisType = req.body.analysisType || 'cognitive';
      
      // Parse the document to extract text based on file type
      const extractedText = await parseDocument(req.file);
      
      // Check the text length
      if (extractedText.length < 100) {
        return res.status(400).json({ 
          message: "The extracted text is too short. Please upload a document with more content (minimum 100 characters)." 
        });
      }
      
      // Analyze the extracted text using all AI providers
      const analyses = await analyzeTextWithAllProviders(extractedText, analysisType);
      
      // Return all analysis results
      res.json(analyses);
    } catch (error) {
      console.error(`Error processing document with all providers (${req.body.analysisType || 'cognitive'}):`, error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process document. Please try again.";
      res.status(500).json({ message: errorMessage });
    }
  });

  // File upload endpoint for document analysis (single provider)
  app.post("/api/upload-document", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get model provider and analysis type
      const modelProvider = req.body.modelProvider || 'openai';
      const analysisType = req.body.analysisType || 'cognitive';
      
      // Parse the document to extract text based on file type
      const extractedText = await parseDocument(req.file);
      
      // Check the text length
      if (extractedText.length < 100) {
        return res.status(400).json({ 
          message: "The extracted text is too short. Please upload a document with more content (minimum 100 characters)." 
        });
      }
      
      // Analyze the extracted text using the selected AI provider and analysis type
      const analysis = await analyzeText(extractedText, modelProvider as ModelProvider, analysisType);
      
      // Return the analysis result
      res.json(analysis);
    } catch (error) {
      console.error(`Error processing document (${req.body.analysisType || 'cognitive'}):`, error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process document. Please try again.";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Export analysis as document (PDF or Word)
  app.post("/api/export-document", async (req, res) => {
    try {
      const { analysis, provider, analysisType, format } = req.body;
      
      if (!analysis || !provider || !analysisType || !format) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      let buffer: Buffer;
      let contentType: string;
      let fileName: string;
      
      // Generate the appropriate document format
      if (format === 'pdf') {
        buffer = await generatePdfDocument(analysis, provider, analysisType);
        contentType = 'application/pdf';
        fileName = `${analysisType}-analysis-${provider}-${Date.now()}.pdf`;
      } else if (format === 'docx') {
        buffer = await generateWordDocument(analysis, provider, analysisType);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `${analysisType}-analysis-${provider}-${Date.now()}.docx`;
      } else {
        return res.status(400).json({ message: "Invalid format specified" });
      }
      
      // Set the appropriate headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-Length', buffer.length);
      
      // Send the file
      res.send(buffer);
    } catch (error) {
      console.error('Error generating document:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate document";
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Share analysis via email
  app.post("/api/share-email", async (req, res) => {
    try {
      const { analysis, provider, analysisType, format, recipientEmail, senderName } = req.body;
      
      if (!analysis || !provider || !analysisType || !format || !recipientEmail) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // Generate the document for attachment
      let buffer: Buffer;
      let attachmentType: string;
      let fileName: string;
      
      if (format === 'pdf') {
        buffer = await generatePdfDocument(analysis, provider, analysisType);
        attachmentType = 'application/pdf';
        fileName = `${analysisType}-analysis-${provider}.pdf`;
      } else if (format === 'docx') {
        buffer = await generateWordDocument(analysis, provider, analysisType);
        attachmentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `${analysisType}-analysis-${provider}.docx`;
      } else {
        return res.status(400).json({ message: "Invalid format specified" });
      }
      
      // Convert buffer to base64 for email attachment
      const attachment = buffer.toString('base64');
      
      // Create email content
      const subject = `${senderName || 'Someone'} shared a ${analysisType} analysis with you`;
      const fromName = senderName || 'Cognitive Profile App';
      
      // Create HTML email body with more details
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a69bd;">${fromName} shared a ${analysisType} analysis with you</h2>
          <p>Hello,</p>
          <p>${fromName} has shared a ${analysisType} analysis with you, generated using the ${getProviderName(provider)} AI model.</p>
          <p>This analysis examines ${analysisType === 'cognitive' ? 'thinking patterns, reasoning style, and intellectual tendencies' : 'emotional patterns, motivational structure, and interpersonal dynamics'} based on text analysis.</p>
          <p>You can find the complete analysis in the attached document (${format.toUpperCase()} format).</p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #4a69bd;">
            <p style="margin: 0; font-style: italic;">This analysis is for informational purposes only and should not be used for clinical diagnosis or treatment decisions.</p>
          </div>
          <p>Thank you for using Cognitive Profile App!</p>
        </div>
      `;
      
      // Send a simple text email that's more likely to deliver successfully
      const plainTextContent = `
${fromName} shared a ${analysisType} analysis with you.

This analysis was generated using the ${getProviderName(provider)} AI model.

The analysis examines ${analysisType === 'cognitive' ? 'thinking patterns, reasoning style, and intellectual tendencies' : 'emotional patterns, motivational structure, and interpersonal dynamics'} based on text analysis.

Thank you for using Cognitive Profile App!
      `;

      const emailSent = await sendEmail({
        to: recipientEmail,
        subject,
        text: plainTextContent,
        html: htmlContent
      });
      
      if (emailSent) {
        res.json({ success: true, message: "Analysis shared successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error('Error sharing analysis:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to share analysis";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Combine analyses from multiple providers and export
  app.post("/api/export-combined", async (req, res) => {
    try {
      const { analyses, analysisType, format } = req.body;
      
      if (!analyses || !analysisType || !format) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      // TODO: Implement combined document generation
      res.status(501).json({ message: "Combined export not yet implemented" });
    } catch (error) {
      console.error('Error generating combined document:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate combined document";
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Generate comprehensive cognitive report
  app.post("/api/comprehensive-report", async (req, res) => {
    try {
      const { text, provider } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      if (text.length < 100) {
        return res.status(400).json({ 
          message: "Text is too short. Please provide at least 100 characters for analysis."
        });
      }
      
      // Generate the comprehensive report
      const report = await generateComprehensiveReport(text, provider as ModelProvider);
      
      res.json(report);
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate comprehensive report";
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Generate comprehensive psychological report
  app.post("/api/comprehensive-psychological-report", async (req, res) => {
    try {
      const { text, provider } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      if (text.length < 100) {
        return res.status(400).json({ 
          message: "Text is too short. Please provide at least 100 characters for analysis."
        });
      }
      
      // Generate the comprehensive psychological report
      const report = await generateComprehensivePsychologicalReport(text, provider as ModelProvider);
      
      res.json(report);
    } catch (error) {
      console.error('Error generating comprehensive psychological report:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate comprehensive psychological report";
      res.status(500).json({ message: errorMessage });
    }
  });

  /**
   * Helper to get a friendly provider name
   */
  function getProviderName(provider: ModelProvider): string {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Claude';
      case 'perplexity':
        return 'Perplexity';
      default:
        return provider;
    }
  }

  const httpServer = createServer(app);

  return httpServer;
}
