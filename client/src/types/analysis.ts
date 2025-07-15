export interface CognitiveAnalysisResult {
  intelligenceScore: number;
  characteristics: string[];
  detailedAnalysis: string;
  strengths: string[];
  tendencies: string[];
}

export interface PsychologicalAnalysisResult {
  emotionalProfile: {
    primaryEmotions: string[];
    emotionalStability: number;
    detailedAnalysis: string;
  };
  motivationalStructure: {
    primaryDrives: string[];
    motivationalPatterns: string[];
    detailedAnalysis: string;
  };
  interpersonalDynamics: {
    attachmentStyle: string;
    socialOrientations: string[];
    relationshipPatterns: string[];
    detailedAnalysis: string;
  };
  strengths: string[];
  challenges: string[];
  overallSummary: string;
}

export type ModelProvider = "deepseek" | "openai" | "anthropic" | "perplexity";

export type AnalysisType = "cognitive" | "psychological" | "comprehensive-cognitive" | "comprehensive-psychological";

export interface AnalysisRequest {
  text: string;
  modelProvider: ModelProvider;
  analysisType?: AnalysisType;
}

// Comprehensive Cognitive Analysis Types
export interface ComprehensiveCognitiveParameter {
  parameter: string;
  score: number;
  analysis: string;
  quotations: string[];
  reasoning: string;
  examples: string[];
}

export interface ComprehensiveCognitiveResult {
  parameters: Record<string, ComprehensiveCognitiveParameter>;
  overallSummary: string;
  generatedBy: ModelProvider;
  metadata: {
    textLength: number;
    processingTime: number;
    additionalContext?: string;
  };
}

export interface MultiProviderComprehensiveCognitiveResult {
  providers: Record<ModelProvider, ComprehensiveCognitiveResult>;
  timestamp: string;
  originalText: string;
}

// Comprehensive Psychological Analysis Types
export interface ComprehensivePsychologicalParameter {
  parameter: string;
  score: number;
  analysis: string;
  quotations: string[];
  reasoning: string;
  examples: string[];
}

export interface ComprehensivePsychologicalResult {
  parameters: Record<string, ComprehensivePsychologicalParameter>;
  overallSummary: string;
  generatedBy: ModelProvider;
  metadata: {
    textLength: number;
    processingTime: number;
    additionalContext?: string;
  };
}

export interface MultiProviderComprehensivePsychologicalResult {
  providers: Record<ModelProvider, ComprehensivePsychologicalResult>;
  timestamp: string;
  originalText: string;
}

// Dialogue and interaction types
export interface DialogueEntry {
  id: string;
  timestamp: string;
  type: "user" | "ai";
  message: string;
  context?: string;
}

export interface DialogueSession {
  id: string;
  analysisType: AnalysisType;
  entries: DialogueEntry[];
  isActive: boolean;
}
