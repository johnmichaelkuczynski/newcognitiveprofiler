import { CognitiveAnalysisResult } from "@/types/analysis";
import { analyzeWithOpenAI } from "./openai";
import { analyzeWithAnthropic } from "./anthropic";
import { analyzeWithPerplexity } from "./perplexity";

// Define the supported model providers
export type ModelProvider = "openai" | "anthropic" | "perplexity";

/**
 * Validates the cognitive analysis result to ensure it meets our standards:
 * 1. No grading language
 * 2. Score and analysis are aligned
 * 3. No mention of evidence, references, etc.
 */
function validateAnalysisResult(result: CognitiveAnalysisResult): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const fullText = [
    result.detailedAnalysis,
    ...result.characteristics,
    ...result.strengths,
    ...result.tendencies
  ].join(' ').toLowerCase();

  // Check for grading language
  const gradingTerms = [
    'would benefit from', 'needs more', 'could use', 'lacks', 'insufficient',
    'incomplete', 'more thorough', 'more complete', 'citations', 'references',
    'evidence', 'support', 'could improve', 'should include', 'would be better',
    'clarity', 'format', 'structure', 'organization', 'polish', 'edit'
  ];

  for (const term of gradingTerms) {
    if (fullText.includes(term)) {
      issues.push(`Contains grading language: "${term}"`);
    }
  }

  // Check for score-description alignment
  const highIntellectTerms = [
    'deep reasoning', 'abstract', 'novel', 'original', 'exceptional',
    'sophisticated', 'complex', 'profound', 'visionary', 'groundbreaking',
    'paradigm', 'innovative', 'creative', 'brilliant', 'remarkable',
    'extraordinary', 'outstanding', 'superior', 'reframing', 'reconceptualizing',
    'challenging fundamental', 'decomposes'
  ];

  const highIntellectFound = highIntellectTerms.filter(term => fullText.includes(term));
  const hasHighIntellectTerms = highIntellectFound.length > 0;
  
  if (hasHighIntellectTerms && result.intelligenceScore < 90) {
    issues.push(`Discrepancy: Uses terms indicating high intelligence (${highIntellectFound.join(', ')}) but gives score of only ${result.intelligenceScore}`);
  }

  // Check for excessive focus on writing quality
  const writingQualityTerms = [
    'writing style', 'writing quality', 'well written', 'poorly written', 'grammar',
    'syntax', 'articulate', 'articulation', 'expression', 'lacks depth', 'lacks evidence'
  ];

  for (const term of writingQualityTerms) {
    if (fullText.includes(term)) {
      issues.push(`Focuses on writing quality: "${term}"`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Analyzes text using a single provider with validation and resubmission
 */
async function analyzeTextWithProvider(text: string, provider: ModelProvider, validationFeedback: string = ""): Promise<CognitiveAnalysisResult> {
  let maxAttempts = 3;
  let attempts = 0;
  let result: CognitiveAnalysisResult | undefined;
  let validation = { valid: false, issues: ["Initial validation"] };
  
  // Create enhanced prompt with validation feedback if available
  const enhancedText = validationFeedback ? 
    `${text}\n\nIMPORTANT: Previous analysis had issues: ${validationFeedback}. Remember, DO NOT grade the writing, only profile the mind behind it. DO NOT comment on evidence, support, or completeness.` : 
    text;
  
  while (!validation.valid && attempts < maxAttempts) {
    attempts++;
    
    try {
      // Call the appropriate AI service based on the provider
      switch (provider) {
        case "openai":
          result = await analyzeWithOpenAI(enhancedText);
          break;
        case "anthropic":
          result = await analyzeWithAnthropic(enhancedText);
          break;
        case "perplexity":
          result = await analyzeWithPerplexity(enhancedText);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      
      // Validate the result
      validation = validateAnalysisResult(result);
      
      if (!validation.valid && attempts < maxAttempts) {
        console.log(`${provider} analysis attempt ${attempts} failed validation: ${validation.issues.join(', ')}`);
        // Try again with specific feedback
        return await analyzeTextWithProvider(text, provider, validation.issues.join(', '));
      }
    } catch (error: any) {
      console.error(`Error in ${provider} analysis:`, error);
      throw new Error(`Analysis with ${provider} failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  if (!validation.valid) {
    console.warn(`${provider} analysis still invalid after ${attempts} attempts: ${validation.issues.join(', ')}`);
  }
  
  // If we've reached here, we have a result (even if not perfectly valid)
  if (!result) {
    throw new Error(`Analysis with ${provider} failed to produce a result`);
  }
  
  return result;
}

/**
 * Analyzes text using the specified provider
 */
export async function analyzeText(text: string, provider: ModelProvider = "openai"): Promise<CognitiveAnalysisResult> {
  try {
    const result = await analyzeTextWithProvider(text, provider);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Analysis failed: ${errorMessage}`);
  }
}

/**
 * Analyzes text using all providers and returns all results
 */
export async function analyzeTextWithAllProviders(text: string): Promise<Record<ModelProvider, CognitiveAnalysisResult>> {
  const providers: ModelProvider[] = ["openai", "anthropic", "perplexity"];
  const results: Partial<Record<ModelProvider, CognitiveAnalysisResult>> = {};
  
  for (const provider of providers) {
    try {
      console.log(`Starting analysis with ${provider}...`);
      const result = await analyzeTextWithProvider(text, provider);
      results[provider] = result;
      console.log(`Completed analysis with ${provider}`);
    } catch (error) {
      console.error(`Error analyzing with ${provider}:`, error);
      // Continue with other providers even if one fails
    }
  }
  
  if (Object.keys(results).length === 0) {
    throw new Error("All analysis providers failed");
  }
  
  return results as Record<ModelProvider, CognitiveAnalysisResult>;
}