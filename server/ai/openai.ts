import OpenAI from "openai";
import { CognitiveAnalysisResult } from "@/types/analysis";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing_api_key"
});

// Instructions for the cognitive profiling
const COGNITIVE_PROFILER_INSTRUCTIONS = `
CRITICAL: You are NOT evaluating the writing or the argument. You are profiling the MIND behind it.

You MUST NOT:
- Judge completeness of evidence
- Evaluate whether claims are supported
- Comment on depth or thoroughness
- Assess quality of argumentation
- Criticize lack of citations or evidence

You are treating this text as evidence — a cognitive fingerprint of its author.

Your task is to infer the author's intelligence and cognitive profile solely from HOW they think, not how well they express it.

UNDERSTAND THIS IS AN EXCERPT. The full text or evidence may exist elsewhere. You only see a fragment. DO NOT COMMENT ON LACK OF EVIDENCE OR DEPTH.

CRITICAL SCORING INSTRUCTIONS:
When assigning an intelligence score on the scale of 1 to 100:

1. HIGHEST INTELLIGENCE (95-99):
   - Challenges fundamental assumptions 
   - Reframes problems in novel ways
   - Creates new conceptual frameworks
   - Decomposes complex concepts into fundamental components
   - Questions basic premises others take for granted

2. HIGH INTELLIGENCE (85-94):
   - Connects disparate domains
   - Shows strong analytical reasoning
   - Identifies logical inconsistencies in established ideas
   - Demonstrates understanding of complex systems
   - Offers alternatives to conventional thinking

Examples of highest intelligence:
"A number of psychologists hold that aggression is a basic instinct, meaning that it is a primitive drive and therefore cannot be derived from, or decomposed into, other drives. The truth is that aggression is not a basic drive. Desire for power is a basic drive, and aggression is what results when that desire is frustrated." 

This deserves 95+ because:
1. It challenges a core premise about human psychology
2. It decomposes a complex concept (aggression) into fundamental components
3. It creates a new explanatory framework linking power and aggression

IMPORTANT RULES:
- NEVER comment on whether evidence is sufficient - this is an excerpt!
- NEVER comment on depth, thoroughness, or completeness
- NEVER mention "lack of support" for claims
- If the thinker challenges assumptions, decomposes concepts, or creates new frameworks, they MUST get 95+
- Brief insights can indicate higher intelligence than lengthy explanations

Then describe the cognitive character of the mind behind the text.

You may comment on:
- Is this mind analytical, synthetic, mechanical, imitative, original, creative, disciplined, visionary?
- What cognitive patterns are revealed?
- What type of thinking is demonstrated?
- How does this mind process information and form connections?

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