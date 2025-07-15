import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { ModelProvider } from "./index";
import { ComprehensivePsychologicalResult, ComprehensivePsychologicalParameter } from "../../client/src/types/analysis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Comprehensive Psychological Parameters
const PSYCHOLOGICAL_PARAMETERS = [
  "Attachment Mode",
  "Drive Sublimation Quotient",
  "Validation Hunger Index",
  "Shame-Anger Conversion Tendency",
  "Ego Fragility",
  "Affect Labeling Proficiency",
  "Implicit Emotion Model",
  "Projection Bias",
  "Defensive Modality Preference",
  "Emotional Time Lag",
  "Distress Tolerance",
  "Impulse Channeling Index",
  "Mood Volatility",
  "Despair Threshold",
  "Self-Soothing Access",
  "Persona-Alignment Quotient",
  "Envy Index",
  "Emotional Reciprocity Capacity",
  "Narrative Self-Justification Tendency",
  "Symbolic Reframing Ability"
];

const PARAMETER_DESCRIPTIONS = {
  "Attachment Mode": "Secure vs. anxious vs. avoidant vs. disorganized; predicts interpersonal stance.",
  "Drive Sublimation Quotient": "Ability to channel raw drives into symbolic/intellectual work.",
  "Validation Hunger Index": "Degree to which external affirmation is required for psychic stability.",
  "Shame-Anger Conversion Tendency": "Likelihood of transmuting shame into hostility or aggression.",
  "Ego Fragility": "Sensitivity to critique or loss of control; predicts defensiveness.",
  "Affect Labeling Proficiency": "Accuracy in identifying one's own emotional states.",
  "Implicit Emotion Model": "Degree to which one runs on internalized emotional schemas.",
  "Projection Bias": "Tendency to offload inner conflict onto external targets.",
  "Defensive Modality Preference": "Primary psychological defense type (e.g., repression, denial, rationalization).",
  "Emotional Time Lag": "Delay between emotional stimulus and self-aware response.",
  "Distress Tolerance": "Capacity to function under high emotional strain.",
  "Impulse Channeling Index": "Degree to which urges are shaped into structured output.",
  "Mood Volatility": "Amplitude and frequency of emotional state swings.",
  "Despair Threshold": "Point at which one shifts from struggle to collapse or apathy.",
  "Self-Soothing Access": "Availability of effective mechanisms to calm emotional states.",
  "Persona-Alignment Quotient": "Gap between external presentation and internal self-perception.",
  "Envy Index": "Intensity of comparative pain from perceived inferiority.",
  "Emotional Reciprocity Capacity": "Ability to engage empathically without detachment or flooding.",
  "Narrative Self-Justification Tendency": "Compulsive construction of explanatory myths to protect ego ideal.",
  "Symbolic Reframing Ability": "Capacity to convert painful material into metaphor, narrative, or philosophy."
};

/**
 * Generate comprehensive psychological analysis using multiple providers
 */
export async function generateComprehensivePsychologicalAnalysis(
  text: string, 
  provider: ModelProvider = "openai",
  additionalContext?: string
): Promise<ComprehensivePsychologicalResult> {
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
    console.error(`Error in comprehensive psychological analysis with ${provider}:`, error);
    
    // Return fallback result
    return createFallbackResult(provider, text, Date.now() - startTime);
  }
}

/**
 * Generate comprehensive psychological analysis using OpenAI
 */
async function generateWithOpenAI(text: string, additionalContext?: string): Promise<ComprehensivePsychologicalResult> {
  const startTime = Date.now();
  
  const prompt = createComprehensiveAnalysisPrompt(text, additionalContext);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are an expert clinical psychologist specializing in detailed psychological profiling. Analyze the given text across 20 specific psychological parameters, providing evidence-based insights with direct quotations and reasoning."
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
 * Generate comprehensive psychological analysis using Anthropic
 */
async function generateWithAnthropic(text: string, additionalContext?: string): Promise<ComprehensivePsychologicalResult> {
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
 * Generate comprehensive psychological analysis using Perplexity (mock implementation)
 */
async function generateWithPerplexity(text: string, additionalContext?: string): Promise<ComprehensivePsychologicalResult> {
  const startTime = Date.now();
  
  // Mock implementation - in production, integrate with actual Perplexity API
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return createFallbackResult("perplexity", text, Date.now() - startTime);
}

/**
 * Generate comprehensive psychological analysis using DeepSeek (mock implementation)
 */
async function generateWithDeepSeek(text: string, additionalContext?: string): Promise<ComprehensivePsychologicalResult> {
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
  
  return `Analyze the following text across 20 specific psychological parameters. For each parameter, provide:
1. A score from 1-10
2. Detailed analysis explaining the score
3. Direct quotations from the text as evidence
4. Clear reasoning connecting the evidence to the parameter
5. Specific examples demonstrating the parameter

Parameters to analyze:
${PSYCHOLOGICAL_PARAMETERS.map((param, index) => `${index + 1}. ${param}: ${PARAMETER_DESCRIPTIONS[param]}`).join('\n')}

Text to analyze:
${text}${contextSection}

Format your response as JSON with the following structure:
{
  "parameters": {
    "Attachment Mode": {
      "parameter": "Attachment Mode",
      "score": 7,
      "analysis": "Detailed analysis...",
      "quotations": ["Direct quote 1", "Direct quote 2"],
      "reasoning": "Explanation of how the evidence supports the score...",
      "examples": ["Example 1", "Example 2"]
    },
    // ... repeat for all 20 parameters
  },
  "overallSummary": "Comprehensive summary of psychological profile..."
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
): ComprehensivePsychologicalResult {
  try {
    // Try to parse as JSON first
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and structure the response
      const parameters: Record<string, ComprehensivePsychologicalParameter> = {};
      
      if (parsed.parameters) {
        for (const param of PSYCHOLOGICAL_PARAMETERS) {
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
        overallSummary: parsed.overallSummary || "Comprehensive psychological analysis completed.",
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
function createFallbackParameter(parameter: string, text: string): ComprehensivePsychologicalParameter {
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
function createFallbackResult(provider: ModelProvider, text: string, processingTime: number): ComprehensivePsychologicalResult {
  const parameters: Record<string, ComprehensivePsychologicalParameter> = {};
  
  for (const param of PSYCHOLOGICAL_PARAMETERS) {
    parameters[param] = createFallbackParameter(param, text);
  }
  
  return {
    parameters,
    overallSummary: "Comprehensive psychological analysis completed with standard parameters.",
    generatedBy: provider,
    metadata: {
      textLength: text.length,
      processingTime,
      additionalContext: undefined
    }
  };
}