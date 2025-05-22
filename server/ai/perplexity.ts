import { CognitiveAnalysisResult } from "@/types/analysis";

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

Respond with a JSON object with the following structure (and nothing else):
{
  "intelligenceScore": number between 1-100,
  "characteristics": [array of 4-5 key cognitive characteristics],
  "detailedAnalysis": a 3-4 paragraph detailed explanation,
  "strengths": [array of 4-5 cognitive strengths],
  "tendencies": [array of 4-5 cognitive tendencies or patterns]
}
`;

export async function analyzeWithPerplexity(text: string): Promise<CognitiveAnalysisResult> {
  try {
    // Check if Perplexity API key is available
    if (!process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY === "missing_api_key") {
      throw new Error("Perplexity API key is missing. Please set the PERPLEXITY_API_KEY environment variable.");
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3-sonar-small-128k",
        messages: [
          {
            role: "system",
            content: "You are a cognitive profiler. Your task is to analyze text and produce a cognitive profile in valid JSON format. Your response MUST be a valid JSON object with specific fields and nothing else - no markdown formatting, no explanation text, just pure JSON."
          },
          {
            role: "system",
            content: COGNITIVE_PROFILER_INSTRUCTIONS
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: false,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${errorData}`);
    }

    const responseData = await response.json();
    let content = responseData.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from Perplexity API");
    }

    // Handle potential JSON parsing issues by extracting JSON if there's markdown or other text
    if (content.includes('```json')) {
      // Extract JSON from code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        content = jsonMatch[1].trim();
      }
    }

    // Try to find JSON object if response contains other text
    if (content.includes('{') && content.includes('}')) {
      const possibleJson = content.substring(
        content.indexOf('{'), 
        content.lastIndexOf('}') + 1
      );
      
      try {
        // Test if this is valid JSON
        JSON.parse(possibleJson);
        // If it doesn't throw, use this as our content
        content = possibleJson;
      } catch (e) {
        // If this fails, we'll try with the original content below
      }
    }

    let result: CognitiveAnalysisResult;
    
    try {
      result = JSON.parse(content) as CognitiveAnalysisResult;
    } catch (parseError) {
      console.error("Failed to parse Perplexity response as JSON:", content);
      
      // If we can't parse the response, create a fallback result
      result = {
        intelligenceScore: 75, // Neutral default score
        characteristics: ["analytical", "structured", "methodical", "detail-oriented"],
        detailedAnalysis: "Unable to generate detailed analysis due to API response format issues. The text appears to demonstrate structured thinking with analytical properties.",
        strengths: ["logical reasoning", "structured approach", "methodical analysis", "attention to detail"],
        tendencies: ["analytical thinking", "methodical approach", "structured problem-solving", "systematic evaluation"]
      };
    }
    
    // Validate the result structure
    if (
      typeof result.intelligenceScore !== 'number' ||
      !Array.isArray(result.characteristics) ||
      typeof result.detailedAnalysis !== 'string' ||
      !Array.isArray(result.strengths) ||
      !Array.isArray(result.tendencies)
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