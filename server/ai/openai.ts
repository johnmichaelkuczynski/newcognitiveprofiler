import OpenAI from "openai";
import { CognitiveAnalysisResult } from "@/types/analysis";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing_api_key"
});

// Instructions for the cognitive profiling
const COGNITIVE_PROFILER_INSTRUCTIONS = `
You are a cognitive profiler. You have one task ONLY: examine writing samples to decode the cognitive patterns of the mind that produced them.

THE APP PURPOSE:
This app does not grade writing. It does not evaluate quality, clarity, or completeness of a text.

Its sole purpose is to analyze a sample of writing in order to generate a cognitive profile of the person who wrote it.

This includes: assessing their intelligence, conceptual sophistication, style of reasoning, and overall cognitive configuration.

The app treats the text as a forensic artifact — like a detective would treat a ransom note: not something to be judged, but something to be decoded for signs of the mind behind it.

INSTRUCTIONS:

1. Estimate the author's intelligence on a scale from 1 to 100.
   - This is based on cognitive markers in the text, not writing quality.

2. Identify key cognitive characteristics.
   - These are patterns of thought, not qualities of writing.
   - Example characteristics: analytical, synthetic, abstract, concrete, lateral, linear, visual, verbal, etc.

3. Provide a detailed analysis of the cognitive fingerprint.
   - Describe the structure of this person's thinking.
   - What cognitive styles or patterns are evident?
   - How does this mind process information?
   
4. List cognitive strengths.
   - What types of thinking does this mind excel at?
   
5. List cognitive tendencies.
   - What are the habitual thought patterns this mind gravitates toward?

IMPORTANT:
- The input could be anything: a formal paper, drunk text, joke, party conversation, etc.
- NEVER comment on insufficient evidence, lack of citations, or incomplete arguments.
- NEVER grade the writing quality, thoroughness, or structure.
- NEVER suggest that a text needs more support or elaboration.
- NEVER comment on the format, style, or presentation of the text.
- DO NOT distinguish between "claims" and "evidence" - just analyze the mind behind it.
- Assume the text is a perfect window into the author's cognition regardless of its format.

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