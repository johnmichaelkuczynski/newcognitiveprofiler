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

Estimate the author's intelligence on a scale from 1 to 100.
Then describe the cognitive character of the mind behind the text.

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