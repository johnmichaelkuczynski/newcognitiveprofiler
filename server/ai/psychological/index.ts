import { PsychologicalAnalysisResult } from "@/types/analysis";
import { analyzeWithOpenAI } from "./openai";
import { analyzeWithAnthropic } from "./anthropic";
import { analyzeWithPerplexity } from "./perplexity";

// Define the supported model providers
export type ModelProvider = "openai" | "anthropic" | "perplexity";

/**
 * Validates the psychological analysis result to ensure it meets our standards
 */
function validateAnalysisResult(result: PsychologicalAnalysisResult): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Basic structure validation
  if (!result.emotionalProfile) {
    issues.push("Missing emotional profile");
  } else {
    if (!Array.isArray(result.emotionalProfile.primaryEmotions) || result.emotionalProfile.primaryEmotions.length < 2) {
      issues.push("Invalid primary emotions array");
    }
    if (typeof result.emotionalProfile.emotionalStability !== 'number' || 
        result.emotionalProfile.emotionalStability < 1 || 
        result.emotionalProfile.emotionalStability > 100) {
      issues.push("Invalid emotional stability score");
    }
    if (!result.emotionalProfile.detailedAnalysis || typeof result.emotionalProfile.detailedAnalysis !== 'string') {
      issues.push("Missing emotional profile detailed analysis");
    }
  }

  if (!result.motivationalStructure) {
    issues.push("Missing motivational structure");
  } else {
    if (!Array.isArray(result.motivationalStructure.primaryDrives) || result.motivationalStructure.primaryDrives.length < 2) {
      issues.push("Invalid primary drives array");
    }
    if (!Array.isArray(result.motivationalStructure.motivationalPatterns) || result.motivationalStructure.motivationalPatterns.length < 2) {
      issues.push("Invalid motivational patterns array");
    }
    if (!result.motivationalStructure.detailedAnalysis || typeof result.motivationalStructure.detailedAnalysis !== 'string') {
      issues.push("Missing motivational structure detailed analysis");
    }
  }

  if (!result.interpersonalDynamics) {
    issues.push("Missing interpersonal dynamics");
  } else {
    if (!result.interpersonalDynamics.attachmentStyle || typeof result.interpersonalDynamics.attachmentStyle !== 'string') {
      issues.push("Invalid attachment style");
    }
    if (!Array.isArray(result.interpersonalDynamics.socialOrientations) || result.interpersonalDynamics.socialOrientations.length < 2) {
      issues.push("Invalid social orientations array");
    }
    if (!Array.isArray(result.interpersonalDynamics.relationshipPatterns) || result.interpersonalDynamics.relationshipPatterns.length < 2) {
      issues.push("Invalid relationship patterns array");
    }
    if (!result.interpersonalDynamics.detailedAnalysis || typeof result.interpersonalDynamics.detailedAnalysis !== 'string') {
      issues.push("Missing interpersonal dynamics detailed analysis");
    }
  }

  if (!Array.isArray(result.strengths) || result.strengths.length < 2) {
    issues.push("Invalid strengths array");
  }
  if (!Array.isArray(result.challenges) || result.challenges.length < 2) {
    issues.push("Invalid challenges array");
  }
  if (!result.overallSummary || typeof result.overallSummary !== 'string') {
    issues.push("Missing overall summary");
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Analyzes text using a single provider with validation and resubmission
 */
async function analyzeTextWithProvider(text: string, provider: ModelProvider, validationFeedback: string = ""): Promise<PsychologicalAnalysisResult> {
  try {
    let result: PsychologicalAnalysisResult;
    
    // Select the appropriate provider function
    switch (provider) {
      case "openai":
        result = await analyzeWithOpenAI(text);
        break;
      case "anthropic":
        result = await analyzeWithAnthropic(text);
        break;
      case "perplexity":
        result = await analyzeWithPerplexity(text);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    // Validate the result
    const validation = validateAnalysisResult(result);
    
    // If the result is invalid and we haven't provided feedback yet, retry with feedback
    if (!validation.valid && !validationFeedback) {
      console.log(`Invalid result from ${provider}, retrying with feedback: ${validation.issues.join(", ")}`);
      return analyzeTextWithProvider(text, provider, validation.issues.join(", "));
    }
    
    return result;
  } catch (error) {
    console.error(`Error in ${provider} analysis:`, error);
    throw error;
  }
}

/**
 * Analyzes text using the specified provider
 */
export async function analyzeText(text: string, provider: ModelProvider = "openai"): Promise<PsychologicalAnalysisResult> {
  return analyzeTextWithProvider(text, provider);
}

/**
 * Analyzes text using all providers and returns all results
 */
export async function analyzeTextWithAllProviders(text: string): Promise<Record<ModelProvider, PsychologicalAnalysisResult>> {
  // Array of provider requests
  const providers: ModelProvider[] = ["openai", "anthropic", "perplexity"];
  
  // Execute all provider requests concurrently
  const results = await Promise.allSettled(
    providers.map(provider => analyzeTextWithProvider(text, provider))
  );
  
  // Initialize result object
  const analysisResults: Partial<Record<ModelProvider, PsychologicalAnalysisResult>> = {};
  
  // Process results
  results.forEach((result, index) => {
    const provider = providers[index];
    
    if (result.status === 'fulfilled') {
      analysisResults[provider] = result.value;
    } else {
      console.error(`Error in ${provider} analysis:`, result.reason);
      
      // Provide a fallback result for this provider
      analysisResults[provider] = createFallbackResult(provider);
    }
  });
  
  return analysisResults as Record<ModelProvider, PsychologicalAnalysisResult>;
}

/**
 * Creates a fallback result when a provider fails
 */
function createFallbackResult(provider: string): PsychologicalAnalysisResult {
  return {
    emotionalProfile: {
      primaryEmotions: ["unavailable", "service error"],
      emotionalStability: 50,
      detailedAnalysis: `Unable to generate emotional profile analysis due to ${provider} API error.`
    },
    motivationalStructure: {
      primaryDrives: ["unavailable", "service error"],
      motivationalPatterns: ["unavailable", "service error"],
      detailedAnalysis: `Unable to generate motivational structure analysis due to ${provider} API error.`
    },
    interpersonalDynamics: {
      attachmentStyle: "unavailable due to service error",
      socialOrientations: ["unavailable", "service error"],
      relationshipPatterns: ["unavailable", "service error"],
      detailedAnalysis: `Unable to generate interpersonal dynamics analysis due to ${provider} API error.`
    },
    strengths: ["unavailable due to service error"],
    challenges: ["unavailable due to service error"],
    overallSummary: `Analysis unavailable due to ${provider} API error. Please try again later or use a different provider.`
  };
}