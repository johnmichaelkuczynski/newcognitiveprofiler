import { CognitiveAnalysisResult } from "@/types/analysis";
import { analyzeWithOpenAI } from "./openai";
import { analyzeWithAnthropic } from "./anthropic";
import { analyzeWithPerplexity } from "./perplexity";

// Define the supported model providers
export type ModelProvider = "openai" | "anthropic" | "perplexity";

// Main function to analyze text with the selected provider
export async function analyzeText(text: string, provider: ModelProvider = "openai"): Promise<CognitiveAnalysisResult> {
  try {
    switch (provider) {
      case "openai":
        return await analyzeWithOpenAI(text);
      case "anthropic":
        return await analyzeWithAnthropic(text);
      case "perplexity":
        return await analyzeWithPerplexity(text);
      default:
        throw new Error(`Unsupported model provider: ${provider}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Analysis failed: ${errorMessage}`);
  }
}