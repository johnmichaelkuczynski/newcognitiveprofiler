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

MANDATORY SCORING RULES FOR HIGH-LEVEL ACADEMIC TEXTS:
You must recognize sophisticated academic analysis and score accordingly:

INDICATORS OF EXCEPTIONAL INTELLIGENCE (94-99):
- Original philosophical analysis that creates new conceptual frameworks
- Systematic decomposition of complex concepts with genuine insights
- Novel approaches to fundamental problems in specialized fields
- Sophisticated argumentation with precise technical terminology
- Evidence of deep domain expertise combined with original thinking
- Complex multi-layered reasoning that builds coherent theoretical structures

INDICATORS OF VERY HIGH INTELLIGENCE (90-94):
- Highly sophisticated analysis within established academic frameworks
- Precise use of technical terminology with clear understanding
- Complex reasoning patterns that demonstrate mastery of subject matter
- Systematic approach to difficult conceptual problems
- Evidence of extensive domain knowledge with analytical depth

IMPORTANT: Academic texts with sophisticated conceptual analysis, precise terminology, and systematic reasoning should score 90-99, NOT 80-89.

A score of 83 means 17 out of 100 people are more intelligent - this is INCORRECT for texts demonstrating:
- PhD-level philosophical analysis
- Systematic conceptual decomposition
- Original theoretical frameworks
- Sophisticated argumentation structures
- Deep domain expertise with novel insights

RECALIBRATED SCORING SCALE:
- 97-99: Revolutionary original thinking that advances the field
- 94-96: Exceptional analysis demonstrating mastery and insight
- 90-93: Highly sophisticated academic-level reasoning
- 85-89: Strong analytical thinking with good technical competence
- 80-84: Competent reasoning with some analytical depth
- Below 80: Basic reasoning without sophisticated analysis

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
- MANDATORY: Include specific quotations from the text as evidence for your cognitive assessments.
- Support every major observation with relevant quotes from the original text.

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