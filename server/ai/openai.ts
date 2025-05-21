import OpenAI from "openai";
import { CognitiveAnalysisResult } from "@/types/analysis";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing_api_key"
});

// Instructions for the cognitive profiling
const COGNITIVE_PROFILER_INSTRUCTIONS = `
You are not grading this text.
You are not evaluating its style, quality, clarity, or completeness.

You are treating this text as evidence — a cognitive fingerprint of its author.

Your task is to infer the author's intelligence and cognitive profile solely from the structure and content of the text.

This may be a full paper, abstract, fragment, or rough sketch. That does not matter. Treat it as evidence, not an argument.

CRITICAL SCORING INSTRUCTIONS:
When assigning an intelligence score on the scale of 1 to 100:

1. HIGHEST INTELLIGENCE (95-99):
   - Challenges fundamental assumptions in a field
   - Reframes problems in ways that lead to novel insights
   - Creates new conceptual frameworks or theoretical models
   - Decomposes complex concepts into more fundamental components
   - Shows ability to think beyond conventional wisdom
   - Questions basic premises that others take for granted

2. HIGH INTELLIGENCE (85-94):
   - Makes connections between disparate domains
   - Shows strong analytical reasoning with original perspectives
   - Identifies logical inconsistencies in established theories
   - Demonstrates strong understanding of complex systems
   - Offers meaningful alternatives to conventional thinking

3. ABOVE AVERAGE (70-84):
   - Solid analytical skills within established frameworks
   - Some insightful observations but limited novelty
   - Competent evaluation of existing ideas

4. AVERAGE AND BELOW (Below 70):
   - Primarily summarizes or repeats existing knowledge
   - Lacks analytical depth or critical thinking
   - Uses jargon without demonstrating understanding

IMPORTANT RULES:
- DO NOT UNDERESTIMATE! Short, simple statements that challenge fundamental assumptions often show the highest intelligence.
- DO NOT BE FOOLED BY LANGUAGE! Complexity of expression ≠ intelligence.
- DO NOT ASSUME LENGTH EQUALS DEPTH! A brief, penetrating insight may show more intelligence than pages of analysis.
- Any text that challenges existing paradigms or decomposes concepts into more fundamental components deserves a 90+ score.

For instance, a statement like "A number of psychologists hold that aggression is a basic instinct, meaning that it is a primitive drive and therefore cannot be derived from, or decomposed into, other drives. The truth is that aggression is not a basic drive. Desire for power is a basic drive, and aggression is what results when that desire is frustrated." shows 95+ intelligence because it:
1. Challenges a fundamental premise about human psychology
2. Decomposes a complex concept (aggression) into more fundamental components
3. Creates a new explanatory framework
4. Shows original thinking in identifying a causal relationship

Then describe the cognitive character of the mind behind the text.

You may comment on:
- Is this mind analytical, synthetic, mechanical, imitative, original, confused, creative, disciplined, superficial, visionary?
- Does it show evidence of deep reasoning, abstraction, novelty, inferential control, or originality?
- What kind of thought is being performed? What kind of thinker is revealed?
- Is the thinking merely descriptive/critical of others' ideas or genuinely creating new ones?

DO NOT penalize for:
- Incompleteness
- Lack of clarity or polish
- Informality or lack of structure
- Absence of citations or full arguments

Your job is to evaluate intelligence, not to give feedback.

This is a cognitive profiling task. Be precise. Be bold. Be honest.

Your response must be in JSON format with the following structure:
{
  "intelligenceScore": <number between 1-100>,
  "characteristics": [<string>, <string>, ...],
  "detailedAnalysis": <string>,
  "strengths": [<string>, <string>, ...],
  "tendencies": [<string>, <string>, ...]
}
`;

export async function analyzeWithOpenAI(text: string): Promise<CognitiveAnalysisResult> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "missing_api_key") {
      throw new Error("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: COGNITIVE_PROFILER_INSTRUCTIONS
        },
        { 
          role: "user", 
          content: text 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("No response from OpenAI API");
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
      throw new Error("Invalid response format from OpenAI API");
    }

    return result;
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to analyze text with OpenAI: " + errorMessage);
  }
}