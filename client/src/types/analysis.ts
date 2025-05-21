export interface CognitiveAnalysisResult {
  intelligenceScore: number;
  characteristics: string[];
  detailedAnalysis: string;
  strengths: string[];
  tendencies: string[];
}

export interface AnalysisRequest {
  text: string;
}
