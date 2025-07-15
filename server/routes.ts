import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { analyzeText, analyzeTextWithAllProviders, type ModelProvider } from "./ai";
import { parseDocument } from "./documentParser";
import { generateWordDocument, generatePdfDocument } from "./documentGenerator";
import { sendEmail } from "./emailService";
import { generateComprehensiveReport } from "./ai/comprehensiveReport";
import { generateComprehensivePsychologicalReport } from "./ai/psychologicalComprehensiveReport";
import { type AnalysisType } from "../shared/schema";
import multer from "multer";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

const analyzeRequestSchema = z.object({
  text: z.string().min(100, "Text must be at least 100 characters long"),
  modelProvider: z.enum(["deepseek", "openai", "anthropic", "perplexity"]).default("deepseek"),
  analysisType: z.enum(["cognitive", "psychological"]).default("cognitive")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
  });

  // Analysis endpoint - open for all users
  app.post("/api/analyze", async (req, res) => {
    try {
      const { text, analysisType, modelProvider } = analyzeRequestSchema.parse(req.body);
      
      const result = await analyzeText(text, modelProvider, analysisType);
      
      res.json(result);
    } catch (error) {
      console.error("Analysis error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // Analysis with all providers - open for all users
  app.post("/api/analyze-all", async (req, res) => {
    try {
      const { text, analysisType } = analyzeRequestSchema.parse(req.body);
      
      const results = await analyzeTextWithAllProviders(text, analysisType);
      
      res.json(results);
    } catch (error) {
      console.error("Analysis error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // Document analysis endpoint - open for all users
  app.post("/api/analyze-document", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { analysisType, modelProvider } = analyzeRequestSchema.omit({ text: true }).parse(req.body);
      
      // Parse document content
      const text = await parseDocument(req.file);
      
      if (text.length < 100) {
        return res.status(400).json({ message: "Document must contain at least 100 characters of text" });
      }
      
      const result = await analyzeText(text, modelProvider, analysisType);
      
      res.json(result);
    } catch (error) {
      console.error("Document analysis error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Document analysis failed" });
    }
  });

  // Comprehensive report generation - open for all users
  app.post("/api/comprehensive-report", async (req, res) => {
    try {
      const { text, analysisType, modelProvider } = analyzeRequestSchema.parse(req.body);
      
      let report;
      if (analysisType === "cognitive") {
        report = await generateComprehensiveReport(text, modelProvider);
      } else {
        report = await generateComprehensivePsychologicalReport(text, modelProvider);
      }
      
      res.json(report);
    } catch (error) {
      console.error("Comprehensive report error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Report generation failed" });
    }
  });

  // Document generation endpoints - open for all users
  app.post("/api/generate-document", async (req, res) => {
    try {
      const { analysis, format, provider } = req.body;
      
      if (!analysis || !format || !provider) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      let buffer: Buffer;
      let mimeType: string;
      let filename: string;
      
      if (format === "pdf") {
        buffer = generatePdfDocument(analysis, provider, "cognitive");
        mimeType = "application/pdf";
        filename = "cognitive-analysis.pdf";
      } else if (format === "docx") {
        buffer = generateWordDocument(analysis, provider, "cognitive");
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        filename = "cognitive-analysis.docx";
      } else {
        return res.status(400).json({ message: "Unsupported format" });
      }
      
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Document generation error:", error);
      res.status(500).json({ message: "Document generation failed" });
    }
  });

  // Email report endpoint - open for all users
  app.post("/api/email-report", async (req, res) => {
    try {
      const { email, analysis, format, provider } = req.body;
      
      if (!email || !analysis || !format || !provider) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      let buffer: Buffer;
      let mimeType: string;
      let filename: string;
      
      if (format === "pdf") {
        buffer = generatePdfDocument(analysis, provider, "cognitive");
        mimeType = "application/pdf";
        filename = "cognitive-analysis.pdf";
      } else if (format === "docx") {
        buffer = generateWordDocument(analysis, provider, "cognitive");
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        filename = "cognitive-analysis.docx";
      } else {
        return res.status(400).json({ message: "Unsupported format" });
      }
      
      const success = await sendEmail({
        to: email,
        subject: "Your Cognitive Analysis Report",
        text: "Please find your cognitive analysis report attached.",
        html: `
          <h2>Your Cognitive Analysis Report</h2>
          <p>Thank you for using our cognitive profiling service. Please find your detailed analysis report attached.</p>
          <p>This report was generated using our ${provider} analysis engine.</p>
        `,
        attachments: [{
          content: buffer.toString("base64"),
          filename,
          type: mimeType,
          disposition: "attachment"
        }]
      });
      
      if (success) {
        res.json({ message: "Report sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send report" });
      }
    } catch (error) {
      console.error("Email report error:", error);
      res.status(500).json({ message: "Failed to send report" });
    }
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  });

  const httpServer = createServer(app);
  return httpServer;
}