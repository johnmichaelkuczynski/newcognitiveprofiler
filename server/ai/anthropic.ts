import Anthropic from '@anthropic-ai/sdk';
import { CognitiveAnalysisResult } from '@/types/analysis';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "missing_api_key",
});

// Instructions for the cognitive profiling
const COGNITIVE_PROFILER_INSTRUCTIONS = `
You are not grading this text.
You are not evaluating its style, quality, clarity, or completeness.

You are treating this text as evidence — a cognitive fingerprint of its author.

Your task is to infer the author's intelligence and cognitive profile solely from the structure and content of the text.

This may be a full paper, abstract, fragment, or rough sketch. That does not matter. Treat it as evidence, not an argument.

Estimate the author's intelligence on a scale from 1 to 100.
Then describe the cognitive character of the mind behind the text.

CRITICAL SCORING CALIBRATION:
For sophisticated academic texts showing systematic analysis, precise terminology, and complex reasoning:
- Score 94-99: Exceptional philosophical/academic analysis with original insights
- Score 90-94: Highly sophisticated academic reasoning within established frameworks
- Score 85-89: Strong analytical thinking with good technical competence

Remember: A score of 83 means 17% of people are more intelligent - this is WRONG for texts demonstrating PhD-level analysis, systematic conceptual work, or sophisticated theoretical frameworks.

You may comment on:
- Is this mind analytical, synthetic, mechanical, imitative, original, confused, creative, disciplined, superficial, visionary?
- Does it show evidence of deep reasoning, abstraction, novelty, inferential control, or originality?
- What kind of thought is being performed? What kind of thinker is revealed?

DO NOT penalize for:
- Incompleteness
- Lack of clarity or polish
- Informality or lack of structure
- Absence of citations or full arguments

Your job is to evaluate intelligence, not to give feedback.

This is a cognitive profiling task. Be precise. Be bold. Be honest.

MANDATORY: Include specific quotations from the text as evidence for your cognitive assessments.
Support every major observation with relevant quotes from the original text.

Respond with a JSON object with the following structure (and nothing else):
{
  "intelligenceScore": number between 1-100,
  "characteristics": [array of 4-5 key cognitive characteristics],
  "detailedAnalysis": a 3-4 paragraph detailed explanation,
  "strengths": [array of 4-5 cognitive strengths],
  "tendencies": [array of 4-5 cognitive tendencies or patterns]
}
`;

export async function analyzeWithAnthropic(text: string): Promise<CognitiveAnalysisResult> {
  try {
    // Check if Anthropic API key is available
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "missing_api_key") {
      throw new Error("Anthropic API key is missing. Please set the ANTHROPIC_API_KEY environment variable.");
    }

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1500,
      system: COGNITIVE_PROFILER_INSTRUCTIONS,
      messages: [
        { 
          role: "user", 
          content: text 
        }
      ],
    });

    // Extract text content from response
    let content = '';
    if (response.content && response.content.length > 0 && 'text' in response.content[0]) {
      content = response.content[0].text;
    }
    
    if (!content) {
      throw new Error("No response from Anthropic API");
    }

    const result = JSON.parse(content) as CognitiveAnalysisResult;
    
    // Validate the result structure
    if (
      typeof result.intelligenceScore !== 'number' ||
      !Array.isArray(result.characteristics) ||
      typeof result.detailedAnalysis !== 'string' ||
      !Array.isArray(result.strengths) ||
      !Array.isArray(result.tendencies)
    ) {
      throw new Error("Invalid response format from Anthropic API");
    }

    return result;
  } catch (error) {
    console.error("Error in Anthropic API call:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to analyze text with Anthropic: " + errorMessage);
  }
}