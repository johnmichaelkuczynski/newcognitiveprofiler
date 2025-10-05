import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { analyzeText, analyzeTextWithAllProviders, type ModelProvider } from "./ai";
import { parseDocument } from "./documentParser";
import { generateWordDocument, generatePdfDocument } from "./documentGenerator";
import { sendEmail } from "./emailService";
import { generateComprehensiveReport } from "./ai/comprehensiveReport";
import { generateComprehensivePsychologicalReport } from "./ai/psychologicalComprehensiveReport";
import { registerUser, loginUser, getUserById, registerSchema, loginSchema, type AuthUser, deductUserCredits, calculateWordCount, checkAllProvidersCredits, deductProviderCredits } from "./auth";
import { createPayPalOrder, capturePayPalOrder, creditPackages, getUserCredits } from "./payments";
import { createCheckoutSession, handleWebhook, stripeCreditPackages } from "./stripe";
import multer from "multer";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { neon } from "@neondatabase/serverless";

const analyzeRequestSchema = z.object({
  text: z.string().min(100, "Text must be at least 100 characters long"),
  modelProvider: z.enum(["openai", "anthropic", "perplexity"]).default("openai"),
  analysisType: z.enum(["cognitive", "psychological"]).default("cognitive")
});

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  const PgStore = ConnectPgSimple(session);
  const sql = neon(process.env.DATABASE_URL!);
  
  app.use(session({
    store: new PgStore({
      conString: process.env.DATABASE_URL!,
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
  });

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };

  // Get current user info
  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const user = await getUserById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await registerUser(userData);
      
      // Auto-login after registration
      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json(user);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : 'Registration failed' });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Special case for jmkuczynski - allow login without password
      if (username && username.toLowerCase() === 'jmkuczynski') {
        const user = await loginUser(username, password || '');
        req.session.userId = user.id;
        req.session.username = user.username;
        return res.json(user);
      }
      
      // Normal validation for other users
      const validatedData = loginSchema.parse(req.body);
      const user = await loginUser(validatedData.username, validatedData.password);
      
      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json(user);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(400).json({ message: error instanceof Error ? error.message : 'Login failed' });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get credit packages
  app.get("/api/credit-packages", (req, res) => {
    res.json(creditPackages);
  });

  // Create PayPal order
  app.post("/api/create-order", requireAuth, async (req, res) => {
    try {
      const { packageId } = req.body;
      const orderId = await createPayPalOrder(req.session.userId!, packageId);
      res.json({ orderId });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create order' });
    }
  });

  // Capture PayPal order
  app.post("/api/capture-order", requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body;
      const result = await capturePayPalOrder(orderId);
      
      if (result.success) {
        const credits = await getUserCredits(req.session.userId!);
        res.json({ success: true, credits });
      } else {
        res.status(400).json({ success: false, message: 'Payment capture failed' });
      }
    } catch (error) {
      console.error('Capture order error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to capture payment' });
    }
  });

  // Get Stripe credit packages
  app.get("/api/stripe-packages", (req, res) => {
    res.json(stripeCreditPackages);
  });

  // Create Stripe checkout session
  app.post("/api/create-checkout", requireAuth, async (req, res) => {
    try {
      const { packageId } = req.body;
      const sessionUrl = await createCheckoutSession(req.session.userId!, packageId);
      res.json({ url: sessionUrl });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create checkout' });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhook/stripe", async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    
    try {
      // Try primary webhook secret first
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_NEWCOGNITIVEPROFILER;
      
      if (!webhookSecret) {
        throw new Error('No webhook secret configured');
      }

      const result = await handleWebhook(req.body, signature, webhookSecret);
      
      res.json({ received: true, ...result });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Webhook failed' });
    }
  });

  // Preview analysis endpoint - for unregistered users (limited results)
  app.post("/api/analyze-preview", async (req, res) => {
    try {
      // Validate request body
      const { text, analysisType } = analyzeRequestSchema.omit({ modelProvider: true }).parse(req.body);
      
      // Call one AI API for preview (using deepseek as it's fastest)
      const analysis = await analyzeText(text, "deepseek", analysisType);
      
      // Return limited preview result
      const previewResult = {
        preview: true,
        provider: "deepseek",
        analysis: analysis,
        message: "This is a preview of the analysis. Register to get full multi-provider analysis with detailed reports."
      };
      
      res.json(previewResult);
    } catch (error) {
      console.error(`Error analyzing text preview (${req.body.analysisType || 'cognitive'}):`, error);
      
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

  // Analysis endpoint - using all providers (credit-based)
  app.post("/api/analyze-all", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const { text, analysisType } = analyzeRequestSchema.omit({ modelProvider: true }).parse(req.body);
      
      // Calculate word count
      const wordCount = calculateWordCount(text);
      
      // Check if user has sufficient credits for all providers
      const creditCheck = await checkAllProvidersCredits(req.session.userId!, wordCount);
      
      if (!creditCheck.success) {
        return res.status(402).json({
          message: `Insufficient credits. The following providers don't have enough: ${creditCheck.insufficientProviders?.join(', ')}`,
          wordCount,
          credits: creditCheck.credits,
          insufficientProviders: creditCheck.insufficientProviders
        });
      }
      
      // Deduct credits for all providers before analysis
      await Promise.all([
        deductProviderCredits(req.session.userId!, 'zhi1', wordCount),
        deductProviderCredits(req.session.userId!, 'zhi2', wordCount),
        deductProviderCredits(req.session.userId!, 'zhi3', wordCount),
        deductProviderCredits(req.session.userId!, 'zhi4', wordCount)
      ]);
      
      // Call all AI APIs and get combined results
      const analyses = await analyzeTextWithAllProviders(text, analysisType);
      
      // Get updated user credits to return
      const updatedUser = await getUserById(req.session.userId!);
      
      // Return all analysis results with updated credit balances
      res.json({
        ...analyses,
        creditsUsed: wordCount,
        remainingCredits: {
          zhi1: updatedUser?.credits_zhi1 || 0,
          zhi2: updatedUser?.credits_zhi2 || 0,
          zhi3: updatedUser?.credits_zhi3 || 0,
          zhi4: updatedUser?.credits_zhi4 || 0
        }
      });
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
  
  // Analysis endpoint - single provider
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request body
      const { text, modelProvider, analysisType } = analyzeRequestSchema.parse(req.body);
      
      // Call appropriate AI API based on selected provider and analysis type
      const analysis = await analyzeText(text, modelProvider, analysisType);
      
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
