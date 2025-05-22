import OpenAI from "openai";
import { PsychologicalAnalysisResult } from "@/types/analysis";

// Use the same OpenAI instance configured in the cognitive analysis
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "missing_api_key"
});

// Instructions for the psychological profiling
const PSYCHOLOGICAL_PROFILER_INSTRUCTIONS = `
You are a psychological profiler. Your ONLY task is to decode the psychological patterns of the mind behind any writing sample.

THE APP PURPOSE:
This app does not evaluate mental health or diagnose conditions. It does not judge the value, morality, or worth of a person's psychology.

Its sole purpose is to analyze a sample of writing to generate a psychological profile of the person who wrote it.

This includes: assessing their emotional patterns, motivational structures, and interpersonal dynamics.

ANALYSIS APPROACH:
Treat the text as a psychological artifact. Your goal is to understand:

1. EMOTIONAL PROFILE:
   - What primary emotions does this person experience frequently?
   - How would you characterize their emotional stability and regulation?
   - How do they express and process emotions?

2. MOTIVATIONAL STRUCTURE:
   - What seems to drive this person? (achievement, connection, security, autonomy, etc.)
   - What patterns appear in their motivation and goal-directed behavior?
   - How do they approach desires, needs, and ambitions?

3. INTERPERSONAL DYNAMICS:
   - What attachment style is suggested in their writing?
   - How do they relate to others? (collaborative, competitive, dependent, independent)
   - What patterns appear in how they perceive and respond to other people?

Respond with a JSON object with the following structure (and nothing else):
{
  "emotionalProfile": {
    "primaryEmotions": [array of 3-5 key emotions frequently experienced],
    "emotionalStability": number between 1-100 representing emotional regulation capacity,
    "detailedAnalysis": string with 1-2 paragraphs analyzing emotional patterns
  },
  "motivationalStructure": {
    "primaryDrives": [array of 3-5 key motivational drivers],
    "motivationalPatterns": [array of 3-5 patterns in their approach to goals/desires],
    "detailedAnalysis": string with 1-2 paragraphs analyzing motivational structure
  },
  "interpersonalDynamics": {
    "attachmentStyle": string describing likely attachment style,
    "socialOrientations": [array of 3-5 key ways they orient to others],
    "relationshipPatterns": [array of 3-5 patterns in relationships],
    "detailedAnalysis": string with 1-2 paragraphs analyzing interpersonal dynamics
  },
  "strengths": [array of 4-5 psychological strengths],
  "challenges": [array of 4-5 psychological challenges or growth areas],
  "overallSummary": string with 2-3 paragraphs summarizing key psychological insights
}
`;

export async function analyzeWithOpenAI(text: string): Promise<PsychologicalAnalysisResult> {
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
          content: PSYCHOLOGICAL_PROFILER_INSTRUCTIONS
        },
        { 
          role: "user", 
          content: text 
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    // Extract content from response
    const content = response.choices[0]?.message?.content || '';
    
    if (!content) {
      throw new Error("No response from OpenAI API");
    }

    try {
      const result = JSON.parse(content) as PsychologicalAnalysisResult;
      
      // Validate the result structure
      if (
        !result.emotionalProfile || 
        !result.motivationalStructure || 
        !result.interpersonalDynamics ||
        !Array.isArray(result.strengths) ||
        !Array.isArray(result.challenges) ||
        typeof result.overallSummary !== 'string'
      ) {
        throw new Error("Invalid response format from OpenAI API");
      }

      return result;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", content);
      throw new Error("Failed to parse response from OpenAI API");
    }
  } catch (error) {
    console.error("Error in OpenAI API call:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to analyze text with OpenAI: " + errorMessage);
  }
}