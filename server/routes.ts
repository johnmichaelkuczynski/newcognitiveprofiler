import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeText, analyzeTextWithAllProviders, type ModelProvider } from "./ai";
import { parseDocument } from "./documentParser";
import { generateWordDocument, generatePdfDocument } from "./documentGenerator";
import { sendEmail } from "./emailService";
import { generateComprehensiveReport } from "./ai/comprehensiveReport";
import { generateComprehensivePsychologicalReport } from "./ai/psychologicalComprehensiveReport";
import { registerUser, loginUser, optionalAuth, requireAuth, createSession, clearSession } from "./auth";
import { 
  useTokens, 
  calculateAnalysisCost, 
  calculateUploadCost, 
  countWords, 
  generatePreview, 
  TOKEN_PACKAGES,
  hasEnoughTokens 
} from "./tokens";
import { createPaymentIntent, handleStripeWebhook } from "./payments";
import multer from "multer";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import rateLimit from "express-rate-limit";

const analyzeRequestSchema = z.object({
  text: z.string().min(100, "Text must be at least 100 characters long"),
  modelProvider: z.enum(["openai", "anthropic", "perplexity"]).default("openai"),
  analysisType: z.enum(["cognitive", "psychological"]).default("cognitive")
});

const authSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Rate limiting for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later"
});

// Rate limiting for analysis
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: "Too many analysis requests, please try again later"
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
  });

  // Authentication endpoints
  app.post("/api/register", authLimiter, async (req, res) => {
    try {
      const { email, password } = authSchema.parse(req.body);
      const result = await registerUser(email, password);
      
      if (result.success && result.user) {
        const sessionId = createSession(result.user.id);
        res.json({
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            token_balance: result.user.token_balance
          },
          sessionId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          error: fromZodError(error).message 
        });
      }
      res.status(500).json({
        success: false,
        error: "Registration failed"
      });
    }
  });

  app.post("/api/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = authSchema.parse(req.body);
      const result = await loginUser(email, password);
      
      if (result.success && result.user) {
        const sessionId = createSession(result.user.id);
        res.json({
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            token_balance: result.user.token_balance
          },
          sessionId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          error: fromZodError(error).message 
        });
      }
      res.status(500).json({
        success: false,
        error: "Login failed"
      });
    }
  });

  app.post("/api/logout", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (sessionId) {
        clearSession(sessionId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Logout failed" });
    }
  });

  // Get user info
  app.get("/api/user", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const sessionInfo = await optionalAuth(sessionId);
      if (!sessionInfo || !sessionInfo.user) {
        return res.status(401).json({ error: "Invalid session" });
      }
      
      res.json({
        user: {
          id: sessionInfo.user.id,
          email: sessionInfo.user.email,
          token_balance: sessionInfo.user.token_balance
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Token packages endpoint
  app.get("/api/token-packages", async (req, res) => {
    res.json({ packages: TOKEN_PACKAGES });
  });

  // Create payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const sessionInfo = await requireAuth(sessionId);
      const { packageIndex } = req.body;
      
      if (typeof packageIndex !== 'number' || packageIndex < 0 || packageIndex >= TOKEN_PACKAGES.length) {
        return res.status(400).json({ error: "Invalid package" });
      }
      
      const result = await createPaymentIntent(sessionInfo.userId, packageIndex);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Stripe webhook
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const success = await handleStripeWebhook(req.body, signature);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ error: "Webhook failed" });
    }
  });

  // Analysis endpoint - using all providers with freemium support
  app.post("/api/analyze-all", analysisLimiter, async (req, res) => {
    try {
      // Validate request body
      const { text, analysisType } = analyzeRequestSchema.omit({ modelProvider: true }).parse(req.body);
      
      // Check authentication
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      const sessionInfo = await optionalAuth(sessionId);
      
      // Calculate token cost
      const tokenCost = calculateAnalysisCost(text);
      
      // Handle unregistered users - provide preview
      if (!sessionInfo) {
        const analyses = await analyzeTextWithAllProviders(text, analysisType);
        
        // Generate previews for all providers
        const previewAnalyses: any = {};
        for (const [provider, analysis] of Object.entries(analyses)) {
          if (provider !== 'originalText') {
            previewAnalyses[provider] = generatePreview(analysis);
          }
        }
        previewAnalyses.originalText = analyses.originalText;
        
        return res.json(previewAnalyses);
      }
      
      // Handle registered users - check tokens
      if (!hasEnoughTokens(sessionInfo.user, tokenCost)) {
        return res.status(402).json({
          error: "Insufficient tokens",
          tokensRequired: tokenCost,
          tokensAvailable: sessionInfo.user?.token_balance || 0,
          packages: TOKEN_PACKAGES
        });
      }
      
      // Deduct tokens
      const tokenResult = await useTokens(sessionInfo, tokenCost, 'analysis');
      if (!tokenResult.success) {
        return res.status(402).json({
          error: tokenResult.error,
          tokensRequired: tokenCost,
          tokensAvailable: tokenResult.remainingBalance
        });
      }
      
      // Call all AI APIs and get combined results
      const analyses = await analyzeTextWithAllProviders(text, analysisType);
      
      // Return full analysis results with token info
      res.json({
        ...analyses,
        tokensUsed: tokenCost,
        tokensRemaining: tokenResult.remainingBalance
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
