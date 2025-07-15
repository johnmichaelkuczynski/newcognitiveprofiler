export interface CognitiveAnalysisResult {
  intelligenceScore: number;
  characteristics: string[];
  detailedAnalysis: string;
  strengths: string[];
  tendencies: string[];
}

export type ModelProvider = "openai" | "anthropic" | "perplexity";

export interface AnalysisRequest {
  text: string;
  modelProvider: ModelProvider;
}
