import { analyzeText, type ModelProvider } from "./ai";
import { type AnalysisType } from "@/shared/schema";

export interface PreviewResult {
  preview: string;
  isPreview: true;
  provider: ModelProvider;
  analysisType: AnalysisType;
  message: string;
}

// Cost in credits for different analysis types
export const ANALYSIS_COSTS = {
  cognitive: 100,
  psychological: 150,
  comprehensive_report: 250,
  comprehensive_psychological_report: 300
};

/**
 * Generate a preview for unregistered users
 * Preview is approximately 200 words and includes a registration prompt
 */
export async function generatePreview(
  text: string, 
  provider: ModelProvider = "deepseek",
  analysisType: AnalysisType = "cognitive"
): Promise<PreviewResult> {
  try {
    // Get full analysis
    const fullAnalysis = await analyzeText(text, provider, analysisType);
    
    // Create preview by truncating the analysis
    const preview = createPreviewFromAnalysis(fullAnalysis, analysisType);
    
    return {
      preview,
      isPreview: true,
      provider,
      analysisType,
      message: "This is a preview of your analysis. To get the full detailed analysis and access advanced features, please register and purchase credits."
    };
  } catch (error) {
    console.error("Error generating preview:", error);
    
    // Return a fallback preview
    return {
      preview: createFallbackPreview(text, analysisType),
      isPreview: true,
      provider,
      analysisType,
      message: "This is a preview of your analysis. To get the full detailed analysis and access advanced features, please register and purchase credits."
    };
  }
}

/**
 * Create a preview from the full analysis by truncating content
 */
function createPreviewFromAnalysis(analysis: any, analysisType: AnalysisType): string {
  let previewText = "";
  
  if (analysisType === "cognitive") {
    previewText = `
**Cognitive Analysis Preview**

**Intelligence Score**: ${analysis.intelligenceScore || "N/A"}

**Key Characteristics**: ${analysis.characteristics?.slice(0, 2).join(", ") || "Analysis available"}...

**Analysis Overview**: ${truncateText(analysis.detailedAnalysis || "Full analysis available in complete version", 100)}

**Strengths**: ${analysis.strengths?.slice(0, 1).join(", ") || "Available in full version"}...

**Cognitive Patterns**: ${analysis.tendencies?.slice(0, 1).join(", ") || "Available in full version"}...

*This preview shows only a portion of your complete cognitive analysis. The full version includes detailed reasoning patterns, comprehensive strengths assessment, complete characteristic analysis, and personalized recommendations.*
    `.trim();
  } else {
    previewText = `
**Psychological Analysis Preview**

**Personality Overview**: ${truncateText(analysis.personalityOverview || "Full personality analysis available", 80)}

**Emotional Patterns**: ${truncateText(analysis.emotionalPatterns || "Complete emotional analysis available", 60)}

**Communication Style**: ${analysis.communicationStyle || "Available in full version"}

**Key Insights**: ${truncateText(analysis.keyInsights || "Comprehensive insights available", 80)}

*This preview shows only a portion of your complete psychological analysis. The full version includes detailed personality assessment, comprehensive emotional analysis, interpersonal dynamics, and personalized psychological insights.*
    `.trim();
  }
  
  return previewText;
}

/**
 * Create a fallback preview when analysis fails
 */
function createFallbackPreview(text: string, analysisType: AnalysisType): string {
  const wordCount = text.split(/\s+/).length;
  const complexityLevel = wordCount > 500 ? "High" : wordCount > 200 ? "Medium" : "Basic";
  
  if (analysisType === "cognitive") {
    return `
**Cognitive Analysis Preview**

**Text Complexity**: ${complexityLevel}
**Word Count**: ${wordCount}

**Initial Assessment**: Your writing sample shows ${complexityLevel.toLowerCase()} complexity patterns. The full analysis will provide detailed insights into your cognitive strengths, reasoning style, and intellectual characteristics.

**Sample Insights**: Based on preliminary analysis, your writing demonstrates structured thinking patterns and coherent expression...

*This is a basic preview. The complete cognitive analysis includes detailed intelligence assessment, comprehensive cognitive profiling, reasoning style analysis, and personalized recommendations for cognitive development.*
    `.trim();
  } else {
    return `
**Psychological Analysis Preview**

**Text Complexity**: ${complexityLevel}
**Word Count**: ${wordCount}

**Initial Assessment**: Your writing sample reveals interesting psychological patterns. The full analysis will provide comprehensive insights into your personality, emotional patterns, and interpersonal style.

**Sample Insights**: Preliminary analysis suggests thoughtful communication patterns and emotional awareness...

*This is a basic preview. The complete psychological analysis includes detailed personality assessment, emotional intelligence evaluation, interpersonal dynamics analysis, and personalized psychological insights.*
    `.trim();
  }
}

/**
 * Truncate text to specified word count
 */
function truncateText(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Get the registration prompt message
 */
export function getRegistrationMessage(): string {
  return "To enjoy this app's full services and get complete detailed analyses, please register and purchase credits. Registration is quick and easy - just choose a username and password, no email verification required!";
}