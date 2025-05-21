import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeText, type ModelProvider } from "./ai";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const analyzeRequestSchema = z.object({
  text: z.string().min(100, "Text must be at least 100 characters long"),
  modelProvider: z.enum(["openai", "anthropic", "perplexity"]).default("openai")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Cognitive analysis endpoint
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

  const httpServer = createServer(app);

  return httpServer;
}
