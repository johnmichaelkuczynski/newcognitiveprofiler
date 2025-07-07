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

export type AnalysisType = "cognitive" | "psychological";

export interface AnalysisRequest {
  text: string;
  modelProvider: ModelProvider;
  analysisType?: AnalysisType;
}
