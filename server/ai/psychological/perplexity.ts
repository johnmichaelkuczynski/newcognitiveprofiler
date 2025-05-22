import { PsychologicalAnalysisResult } from '@/types/analysis';
import fetch from 'node-fetch';

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

/**
 * Helper for making requests to the Perplexity API
 */
async function makePerplexityRequest(
  prompt: string,
  model: string,
  apiKey: string
): Promise<{ text: string }> {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a psychological profiler analyzing writing samples to generate insights.\n\n' + PSYCHOLOGICAL_PROFILER_INSTRUCTIONS
          },
          {
            role: 'user',
            content: `Analyze the following text:\n\n${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    // Type assertion after we've parsed the JSON
    return { text: (data as any).choices?.[0]?.message?.content || '' };
  } catch (error) {
    console.error('Error in Perplexity API request:', error);
    throw error;
  }
}

export async function analyzeWithPerplexity(text: string): Promise<PsychologicalAnalysisResult> {
  try {
    // Check if Perplexity API key is available
    if (!process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY === "missing_api_key") {
      throw new Error("Perplexity API key is missing. Please set the PERPLEXITY_API_KEY environment variable.");
    }

    // Prepare the API request
    const apiKey = process.env.PERPLEXITY_API_KEY;
    const model = "llama-3-sonar-small-128k"; // Using Perplexity's supported model for structured output
    
    // Make the API request to Perplexity - pass the text directly
    const response = await makePerplexityRequest(text, model, apiKey);
    
    if (!response.text) {
      throw new Error("No response text from Perplexity API");
    }
    
    const content = response.text;
    
    let result: PsychologicalAnalysisResult;
    
    try {
      result = JSON.parse(content) as PsychologicalAnalysisResult;
    } catch (parseError) {
      console.error("Failed to parse Perplexity response as JSON:", content);
      
      // If we can't parse the response, throw an error
      throw new Error("Failed to parse response from Perplexity API");
    }
    
    // Validate the result structure
    if (
      !result.emotionalProfile || 
      !result.motivationalStructure || 
      !result.interpersonalDynamics ||
      !Array.isArray(result.strengths) ||
      !Array.isArray(result.challenges) ||
      typeof result.overallSummary !== 'string'
    ) {
      throw new Error("Invalid response format from Perplexity API");
    }

    return result;
  } catch (error) {
    console.error("Error in Perplexity API call:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error("Failed to analyze text with Perplexity: " + errorMessage);
  }
}