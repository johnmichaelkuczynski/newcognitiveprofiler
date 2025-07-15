import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeText, analyzeTextWithAllProviders, type ModelProvider } from "./ai";
import { parseDocument } from "./documentParser";
import multer from "multer";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const analyzeRequestSchema = z.object({
  text: z.string().min(100, "Text must be at least 100 characters long"),
  modelProvider: z.enum(["openai", "anthropic", "perplexity"]).default("openai")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
  });

  // Cognitive analysis endpoint - using all providers
  app.post("/api/analyze-all", async (req, res) => {
    try {
      // Validate request body
      const { text } = analyzeRequestSchema.omit({ modelProvider: true }).parse(req.body);
      
      // Call all AI APIs and get combined results
      const analyses = await analyzeTextWithAllProviders(text);
      
      // Return all analysis results
      res.json(analyses);
    } catch (error) {
      console.error("Error analyzing text with all providers:", error);
      
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
  
  // Cognitive analysis endpoint - single provider (legacy)
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request body
      const { text, modelProvider } = analyzeRequestSchema.parse(req.body);
      
      // Call appropriate AI API based on selected provider
      const analysis = await analyzeText(text, modelProvider);
      
      // Return the analysis result
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing text:", error);
      
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
      
      // Parse the document to extract text based on file type
      const extractedText = await parseDocument(req.file);
      
      // Check the text length
      if (extractedText.length < 100) {
        return res.status(400).json({ 
          message: "The extracted text is too short. Please upload a document with more content (minimum 100 characters)." 
        });
      }
      
      // Analyze the extracted text using all AI providers
      const analyses = await analyzeTextWithAllProviders(extractedText);
      
      // Return all analysis results
      res.json(analyses);
    } catch (error) {
      console.error("Error processing document with all providers:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process document. Please try again.";
      res.status(500).json({ message: errorMessage });
    }
  });

  // File upload endpoint for document analysis (legacy single provider)
  app.post("/api/upload-document", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get model provider
      const modelProvider = req.body.modelProvider || 'openai';
      
      // Parse the document to extract text based on file type
      const extractedText = await parseDocument(req.file);
      
      // Check the text length
      if (extractedText.length < 100) {
        return res.status(400).json({ 
          message: "The extracted text is too short. Please upload a document with more content (minimum 100 characters)." 
        });
      }
      
      // Analyze the extracted text using the selected AI provider
      const analysis = await analyzeText(extractedText, modelProvider as ModelProvider);
      
      // Return the analysis result
      res.json(analysis);
    } catch (error) {
      console.error("Error processing document:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process document. Please try again.";
      res.status(500).json({ message: errorMessage });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
