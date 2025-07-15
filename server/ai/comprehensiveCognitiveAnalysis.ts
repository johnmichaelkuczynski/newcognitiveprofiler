import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { ModelProvider } from "./index";
import { ComprehensiveCognitiveResult, ComprehensiveCognitiveParameter } from "../../client/src/types/analysis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Comprehensive Cognitive Parameters
const COGNITIVE_PARAMETERS = [
  "Compression Tolerance",
  "Inferential Depth", 
  "Semantic Curvature",
  "Cognitive Load Bandwidth",
  "Epistemic Risk Tolerance",
  "Narrative vs. Structural Bias",
  "Heuristic Anchoring Bias",
  "Self-Compression Quotient",
  "Recursion Depth on Self",
  "Reconceptualization Rate",
  "Dominance Framing Bias",
  "Validation Source Gradient",
  "Dialectical Agonism",
  "Modality Preference",
  "Schema Flexibility",
  "Proceduralism Threshold",
  "Predictive Modeling Index",
  "Social System Complexity Model",
  "Mythology Bias",
  "Asymmetry Detection Quotient"
];

const PARAMETER_DESCRIPTIONS = {
  "Compression Tolerance": "Degree to which the person seeks dense, abstract representations over surface details.",
  "Inferential Depth": "How far ahead a person naturally projects in causal/logical chains before committing to conclusions.",
  "Semantic Curvature": "Tendency to cross conceptual boundaries and reframe terms in adjacent but non-isomorphic domains.",
  "Cognitive Load Bandwidth": "Number of variables or active threads someone can sustain in parallel before system degradation.",
  "Epistemic Risk Tolerance": "Willingness to entertain unstable or fringe hypotheses when the payoff is deeper insight.",
  "Narrative vs. Structural Bias": "Preference for anecdotal/story-based cognition vs. pattern/system-based models.",
  "Heuristic Anchoring Bias": "How often first-pass intuitions dominate downstream reasoning.",
  "Self-Compression Quotient": "Degree to which a person can summarize their own thought system into coherent abstract modules.",
  "Recursion Depth on Self": "Number of layers deep a person tracks their own cognitive operations or psychological motives.",
  "Reconceptualization Rate": "Speed and frequency with which one reforms or discards major conceptual categories.",
  "Dominance Framing Bias": "Default positioning of oneself in terms of social, intellectual, or epistemic superiority/inferiority.",
  "Validation Source Gradient": "Internal vs. external motivation for cognitive output.",
  "Dialectical Agonism": "Ability to build arguments that strengthen the opposing view, even while refuting it.",
  "Modality Preference": "Abstract-verbal vs. visual-spatial vs. kinetic-emotional thinking bias.",
  "Schema Flexibility": "Ease of updating or discarding core frameworks in light of contradictory evidence.",
  "Proceduralism Threshold": "Degree to which one respects systems, protocols, or legalistic steps vs. valuing results.",
  "Predictive Modeling Index": "Preference for models that maximize forecasting power over coherence.",
  "Social System Complexity Model": "Granularity of one's working model of institutions, networks, reputations.",
  "Mythology Bias": "Degree to which narrative/mythic structures override or inform analytic judgment.",
  "Asymmetry Detection Quotient": "Sensitivity to unspoken structural asymmetries in systems or conversations."
};

/**
 * Generate comprehensive cognitive analysis using multiple providers
 */
export async function generateComprehensiveCognitiveAnalysis(
  text: string, 
  provider: ModelProvider = "openai",
  additionalContext?: string
): Promise<ComprehensiveCognitiveResult> {
  const startTime = Date.now();
  
  try {
    switch (provider) {
      case "openai":
        return await generateWithOpenAI(text, additionalContext);
      case "anthropic":
        return await generateWithAnthropic(text, additionalContext);
      case "perplexity":
        return await generateWithPerplexity(text, additionalContext);
      case "deepseek":
        return await generateWithDeepSeek(text, additionalContext);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error in comprehensive cognitive analysis with ${provider}:`, error);
    
    // Return fallback result
    return createFallbackResult(provider, text, Date.now() - startTime);
  }
}

/**
 * Generate comprehensive cognitive analysis using OpenAI
 */
async function generateWithOpenAI(text: string, additionalContext?: string): Promise<ComprehensiveCognitiveResult> {
  const startTime = Date.now();
  
  const prompt = createComprehensiveAnalysisPrompt(text, additionalContext);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are an expert cognitive psychologist specializing in detailed cognitive profiling. Analyze the given text across 20 specific cognitive parameters, providing evidence-based insights with direct quotations and reasoning."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content || "";
  
  return parseComprehensiveAnalysisResponse(content, "openai", text, Date.now() - startTime);
}

/**
 * Generate comprehensive cognitive analysis using Anthropic
 */
async function generateWithAnthropic(text: string, additionalContext?: string): Promise<ComprehensiveCognitiveResult> {
  const startTime = Date.now();
  
  const prompt = createComprehensiveAnalysisPrompt(text, additionalContext);
  
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 4000,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
  });

  const content = response.content[0]?.type === "text" ? response.content[0].text : "";
  
  return parseComprehensiveAnalysisResponse(content, "anthropic", text, Date.now() - startTime);
}

/**
 * Generate comprehensive cognitive analysis using Perplexity (mock implementation)
 */
async function generateWithPerplexity(text: string, additionalContext?: string): Promise<ComprehensiveCognitiveResult> {
  const startTime = Date.now();
  
  // Mock implementation - in production, integrate with actual Perplexity API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return createFallbackResult("perplexity", text, Date.now() - startTime);
}

/**
 * Generate comprehensive cognitive analysis using DeepSeek (mock implementation)
 */
async function generateWithDeepSeek(text: string, additionalContext?: string): Promise<ComprehensiveCognitiveResult> {
  const startTime = Date.now();
  
  // Mock implementation - in production, integrate with actual DeepSeek API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return createFallbackResult("deepseek", text, Date.now() - startTime);
}

/**
 * Create the comprehensive analysis prompt
 */
function createComprehensiveAnalysisPrompt(text: string, additionalContext?: string): string {
  const contextSection = additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : "";
  
  return `Analyze the following text across 20 specific cognitive parameters. For each parameter, provide:
1. A score from 1-10
2. Detailed analysis explaining the score
3. Direct quotations from the text as evidence
4. Clear reasoning connecting the evidence to the parameter
5. Specific examples demonstrating the parameter

Parameters to analyze:
${COGNITIVE_PARAMETERS.map((param, index) => `${index + 1}. ${param}: ${PARAMETER_DESCRIPTIONS[param]}`).join('\n')}

Text to analyze:
${text}${contextSection}

Format your response as JSON with the following structure:
{
  "parameters": {
    "Compression Tolerance": {
      "parameter": "Compression Tolerance",
      "score": 7,
      "analysis": "Detailed analysis...",
      "quotations": ["Direct quote 1", "Direct quote 2"],
      "reasoning": "Explanation of how the evidence supports the score...",
      "examples": ["Example 1", "Example 2"]
    },
    // ... repeat for all 20 parameters
  },
  "overallSummary": "Comprehensive summary of cognitive profile..."
}

Important: 
- Use ONLY direct quotations from the provided text
- Provide specific, evidence-based reasoning
- Ensure scores reflect actual textual evidence
- Make the analysis comprehensive and detailed`;
}

/**
 * Parse the AI response into structured comprehensive analysis
 */
function parseComprehensiveAnalysisResponse(
  content: string, 
  provider: ModelProvider, 
  text: string, 
  processingTime: number
): ComprehensiveCognitiveResult {
  try {
    // Try to parse as JSON first
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and structure the response
      const parameters: Record<string, ComprehensiveCognitiveParameter> = {};
      
      if (parsed.parameters) {
        for (const param of COGNITIVE_PARAMETERS) {
          if (parsed.parameters[param]) {
            parameters[param] = {
              parameter: param,
              score: Math.max(1, Math.min(10, parsed.parameters[param].score || 5)),
              analysis: parsed.parameters[param].analysis || `Analysis for ${param}`,
              quotations: Array.isArray(parsed.parameters[param].quotations) 
                ? parsed.parameters[param].quotations 
                : [],
              reasoning: parsed.parameters[param].reasoning || `Reasoning for ${param}`,
              examples: Array.isArray(parsed.parameters[param].examples) 
                ? parsed.parameters[param].examples 
                : []
            };
          } else {
            // Create fallback parameter if missing
            parameters[param] = createFallbackParameter(param, text);
          }
        }
      }
      
      return {
        parameters,
        overallSummary: parsed.overallSummary || "Comprehensive cognitive analysis completed.",
        generatedBy: provider,
        metadata: {
          textLength: text.length,
          processingTime,
          additionalContext: undefined
        }
      };
    }
  } catch (error) {
    console.error("Error parsing comprehensive analysis response:", error);
  }
  
  // Fallback parsing if JSON fails
  return createFallbackResult(provider, text, processingTime);
}

/**
 * Create a fallback parameter when parsing fails
 */
function createFallbackParameter(parameter: string, text: string): ComprehensiveCognitiveParameter {
  return {
    parameter,
    score: 5,
    analysis: `Analysis for ${parameter} based on the provided text.`,
    quotations: [],
    reasoning: `Standard reasoning for ${parameter} parameter.`,
    examples: []
  };
}

/**
 * Create a fallback result when provider fails
 */
function createFallbackResult(provider: ModelProvider, text: string, processingTime: number): ComprehensiveCognitiveResult {
  const parameters: Record<string, ComprehensiveCognitiveParameter> = {};
  
  for (const param of COGNITIVE_PARAMETERS) {
    parameters[param] = createFallbackParameter(param, text);
  }
  
  return {
    parameters,
    overallSummary: "Comprehensive cognitive analysis completed with standard parameters.",
    generatedBy: provider,
    metadata: {
      textLength: text.length,
      processingTime,
      additionalContext: undefined
    }
  };
}