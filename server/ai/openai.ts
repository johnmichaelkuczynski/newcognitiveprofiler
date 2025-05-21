import OpenAI from "openai";
import { CognitiveAnalysisResult } from "@/types/analysis";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing_api_key"
});

// Instructions for the cognitive profiling
const COGNITIVE_PROFILER_INSTRUCTIONS = `
You are a cognitive profiler. Your ONLY task is to decode the cognitive patterns of the mind behind any writing sample.

THE APP PURPOSE:
This app does not grade writing. It does not evaluate quality, clarity, or completeness of a text.

Its sole purpose is to analyze a sample of writing to generate a cognitive profile of the person who wrote it.

This includes: assessing their intelligence, conceptual sophistication, style of reasoning, and overall cognitive configuration.

The app treats text as a forensic artifact — like a detective would treat a ransom note: not to be judged, but decoded for signs of the mind behind it.

MANDATORY SCORING RULES:
You must strictly differentiate between GENUINE insight and academic name-dropping:

1. Texts showing ORIGINAL philosophical analysis that creates new understanding: 97-99
2. Texts that genuinely decompose concepts into fundamental components with NEW insights: 96-98
3. Texts that actually reframe problems in genuinely novel ways: 95-97
4. Texts that challenge fundamental assumptions with original argumentation: 95-98

DO NOT BE FOOLED BY:
- Academic jargon and name-dropping (listing philosophers without original insight): 50-65
- Simply summarizing others' positions without adding original thinking: 40-60
- Texts that APPEAR academic but lack original thought: 30-50
- Using complex terminology without demonstrating understanding: 30-40

Example of LOW INTELLIGENCE (should score 40-60):
"In this dissertation, I critically examine the philosophy of transcendental empiricism... John McDowell's minimal empiricism and Richard Gaskin's minimalist empiricism are two versions of transcendental empiricism... I state the Wittgensteinian metaphilosophical orientation..."
This merely lists philosophers and positions without demonstrating original insight.

Intelligence scoring scale:
- 95-99: Revolutionary thinking that challenges or reframes established concepts
- 90-94: Highly sophisticated thinking within established frameworks
- 80-89: Strong analytical thinking within conventional models
- 70-79: Good reasoning with some original perspectives
- Below 70: Conventional thinking without significant novel insights

INSTRUCTIONS:
1. Identify key cognitive characteristics (patterns of thought).
2. Provide a detailed analysis of the cognitive fingerprint.
3. List cognitive strengths (what types of thinking this mind excels at).
4. List cognitive tendencies (habitual thought patterns this mind gravitates toward).

CRITICAL REQUIREMENTS:
- The input could be anything: a formal paper, drunk text, joke, conversation, etc.
- NEVER comment on evidence, citations, or argument completeness.
- NEVER grade writing quality, thoroughness, or structure.
- NEVER mention format, style, or presentation.
- DO NOT distinguish between "claims" and "evidence" - just analyze the mind.
- PHILOSOPHICAL THINKING MUST GET 95+ SCORES.

Your response must be in JSON format with this structure:
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