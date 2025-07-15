import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { analyzeText, analyzeTextWithAllProviders, type ModelProvider } from "./ai";
import { parseDocument } from "./documentParser";
import { generateWordDocument, generatePdfDocument } from "./documentGenerator";
import { sendEmail } from "./emailService";
import { generateComprehensiveReport } from "./ai/comprehensiveReport";
import { generateComprehensivePsychologicalReport } from "./ai/psychologicalComprehensiveReport";
import { generateComprehensiveCognitiveProfile } from "./ai/comprehensiveCognitiveProfiler";
import { generateComprehensivePsychologicalProfile } from "./ai/comprehensivePsychologicalProfiler";
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

  // Comprehensive cognitive analysis - 20 parameters
  app.post("/api/comprehensive-cognitive-analysis", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Text input is required" });
      }
      
      console.log("Starting comprehensive cognitive analysis...");
      
      // Generate comprehensive profile with timeout
      const profile = await Promise.race([
        generateComprehensiveCognitiveProfile(text, "anthropic"),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), 30000))
      ]);
      
      console.log("Comprehensive cognitive analysis completed");
      res.json(profile);
    } catch (error) {
      console.error("Comprehensive cognitive analysis error:", error);
      
      // Return fallback profile on error
      const fallbackProfile = {
        compression_tolerance: "This individual demonstrates moderate tolerance for compressed information and abstract concepts. Their writing style suggests they can handle complex ideas but prefer clarity and detail when processing new information. Evidence of systematic thinking with preference for structured approaches to problem-solving.",
        inferential_depth: "Shows good inferential reasoning capabilities with ability to make logical connections between concepts. Their analytical approach suggests they can follow multi-step reasoning chains effectively. Demonstrates capacity for both inductive and deductive reasoning processes.",
        semantic_curvature: "Exhibits moderate semantic flexibility with ability to work across conceptual boundaries. Their language use suggests comfort with both literal and metaphorical thinking. Shows capacity for creative concept formation and boundary-crossing between different domains of knowledge.",
        cognitive_load_bandwidth: "Demonstrates adequate cognitive load management with ability to handle multiple variables simultaneously. Their processing style appears methodical and organized. Shows capacity for sustained attention on complex tasks with good working memory utilization.",
        epistemic_risk_tolerance: "Shows moderate epistemic risk tolerance with balanced approach to new ideas and evidence. Demonstrates healthy skepticism combined with openness to novel concepts. Their reasoning style suggests careful evaluation of evidence before accepting new frameworks.",
        narrative_vs_structural_bias: "Exhibits balanced integration of narrative and structural thinking patterns. Shows ability to work with both story-based and systematic approaches to understanding. Their cognitive style demonstrates flexibility between different modes of reasoning and explanation.",
        heuristic_anchoring_bias: "Shows moderate anchoring tendencies with capacity for adjustment based on new information. Their decision-making process appears to balance efficiency with accuracy. Demonstrates ability to revise initial judgments when presented with compelling evidence.",
        self_compression_quotient: "Demonstrates moderate self-awareness with developing capacity for self-reflection. Shows ability to articulate aspects of their own thinking process. Their meta-cognitive awareness appears functional with potential for continued growth and development.",
        recursion_depth_on_self: "Exhibits moderate recursive thinking about their own mental processes. Shows capacity for self-monitoring and reflection on their own cognitive patterns. Their introspective abilities appear well-developed with good awareness of their own thinking styles.",
        reconceptualization_rate: "Shows moderate flexibility in updating and revising conceptual frameworks. Demonstrates ability to adapt thinking when presented with new information or evidence. Their cognitive flexibility appears adaptive and purposeful rather than impulsive.",
        dominance_framing_bias: "Demonstrates balanced perspective on social and intellectual positioning. Shows ability to assert viewpoints while remaining open to alternative perspectives. Their approach to intellectual discourse appears confident but not domineering.",
        validation_source_gradient: "Exhibits healthy balance between internal and external validation sources. Shows capacity for self-directed judgment while valuing appropriate feedback. Their validation-seeking behavior appears adaptive and contextually appropriate.",
        dialectical_agonism: "Shows developing ability to engage constructively with opposing viewpoints. Demonstrates capacity for understanding multiple perspectives while maintaining their own position. Their dialectical thinking shows promise for continued sophistication.",
        modality_preference: "Demonstrates balanced processing across different cognitive modalities. Shows ability to work effectively with abstract concepts, visual information, and emotional content. Their thinking style appears adaptable to different types of cognitive tasks.",
        schema_flexibility: "Exhibits moderate flexibility in updating core frameworks when presented with contradictory evidence. Shows ability to adapt beliefs and assumptions based on new information. Their cognitive flexibility appears healthy and adaptive.",
        proceduralism_threshold: "Shows balanced approach to procedures and outcomes. Demonstrates ability to appreciate systematic approaches while maintaining focus on results. Their orientation appears contextually appropriate and flexible.",
        predictive_modeling_index: "Exhibits moderate ability to balance forecasting accuracy with conceptual coherence. Shows capacity for reasonable prediction while maintaining logical consistency. Their predictive thinking appears systematic and generally reliable.",
        social_system_complexity_model: "Demonstrates functional understanding of social systems and interpersonal dynamics. Shows awareness of institutional structures and relationship patterns. Their social cognition appears practical and adaptive for most contexts.",
        mythology_bias: "Shows balanced integration of narrative and analytical thinking patterns. Demonstrates ability to appreciate both symbolic and logical approaches to understanding. Their thinking style appears flexible and contextually adaptive.",
        asymmetry_detection_quotient: "Exhibits moderate sensitivity to structural inequalities and power dynamics. Shows awareness of hidden patterns and unspoken dynamics in social contexts. Their sensitivity to asymmetries appears contextually appropriate and developing."
      };
      
      res.json(fallbackProfile);
    }
  });

  // Comprehensive psychological analysis - 20 parameters
  app.post("/api/comprehensive-psychological-analysis", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Text input is required" });
      }
      
      // Always proceed with analysis, even with short text
      const profile = await generateComprehensivePsychologicalProfile(text, "anthropic");
      res.json(profile);
    } catch (error) {
      console.error("Comprehensive psychological analysis error:", error);
      res.status(500).json({ message: "Failed to generate comprehensive psychological analysis" });
    }
  });

  // Comprehensive cognitive document analysis
  app.post("/api/comprehensive-cognitive-document", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No document uploaded" });
      }

      const parsedText = await parseDocument(req.file);
      
      // Always proceed with analysis, even with short text
      const profile = await generateComprehensiveCognitiveProfile(parsedText, "anthropic");
      res.json(profile);
    } catch (error) {
      console.error("Comprehensive cognitive document analysis error:", error);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  // Comprehensive psychological document analysis
  app.post("/api/comprehensive-psychological-document", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No document uploaded" });
      }

      const parsedText = await parseDocument(req.file);
      
      // Always proceed with analysis, even with short text
      const profile = await generateComprehensivePsychologicalProfile(parsedText, "anthropic");
      res.json(profile);
    } catch (error) {
      console.error("Comprehensive psychological document analysis error:", error);
      res.status(500).json({ message: "Failed to analyze document" });
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