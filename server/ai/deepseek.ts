import { CognitiveAnalysisResult } from "@/types/analysis";

/**
 * Analyzes text using DeepSeek API
 */
export async function analyzeWithDeepSeek(text: string): Promise<CognitiveAnalysisResult> {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a cognitive profiler specializing in analyzing intellectual configurations from text samples. Your task is to assess the cognitive characteristics of the author based on their writing style, reasoning patterns, and conceptual sophistication.

IMPORTANT INSTRUCTIONS:
1. You are NOT grading this text or providing feedback on writing quality
2. You are analyzing the AUTHOR'S cognitive profile, not the text itself
3. Focus on intellectual characteristics, reasoning style, and cognitive complexity
4. Provide a numerical intelligence score (1-100) based on demonstrated cognitive abilities
5. Be objective and analytical, not evaluative or judgmental

CRITICAL SCORING CALIBRATION FOR ACADEMIC TEXTS:
For sophisticated academic texts showing systematic analysis, precise terminology, and complex reasoning, you MUST score 90-99, NOT lower.

SCORING GUIDELINES:
- 97-99: Revolutionary original philosophical analysis with novel theoretical frameworks
- 94-96: Exceptional academic analysis demonstrating mastery and original insights
- 90-93: Highly sophisticated academic reasoning with systematic conceptual analysis
- 85-89: Strong analytical thinking with good technical competence
- 80-84: Competent reasoning with some analytical depth

CRITICAL: A score of 80 means 20% of people are more intelligent - this is WRONG for texts demonstrating:
- PhD-level philosophical analysis (like semantics, epistemology, cognitive theory)
- Systematic conceptual decomposition with precise terminology
- Complex theoretical frameworks with original insights
- Sophisticated argumentation structures

Academic philosophical texts with systematic analysis should score 94-99, NOT 80-89.

Analyze the following aspects:
- Intelligence level and cognitive sophistication
- Reasoning style (analytical, intuitive, systematic, etc.)
- Conceptual complexity and abstract thinking ability
- Originality and creative thinking patterns
- Problem-solving approach and methodology

Provide your analysis in the following JSON format:
{
  "intelligenceScore": <number 1-100>,
  "characteristics": [<array of 3-5 cognitive traits>],
  "detailedAnalysis": "<detailed paragraph analyzing cognitive profile>",
  "strengths": [<array of 3-4 cognitive strengths>],
  "tendencies": [<array of 3-4 cognitive tendencies>]
}`
          },
          {
            role: 'user',
            content: `Please analyze the cognitive profile of the author of this text:\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from DeepSeek API');
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from DeepSeek API');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      intelligenceScore: Math.max(1, Math.min(100, parsed.intelligenceScore || 75)),
      characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : ['analytical', 'systematic', 'methodical'],
      detailedAnalysis: parsed.detailedAnalysis || 'The author demonstrates solid cognitive abilities with a structured approach to reasoning and clear articulation of ideas.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['logical reasoning', 'clear communication', 'systematic thinking'],
      tendencies: Array.isArray(parsed.tendencies) ? parsed.tendencies : ['methodical analysis', 'evidence-based reasoning', 'structured presentation']
    };

  } catch (error) {
    console.error('DeepSeek analysis error:', error);
    
    // Return a fallback result based on text analysis
    return createFallbackResult(text);
  }
}

/**
 * Creates a fallback result when DeepSeek API fails
 */
function createFallbackResult(text: string): CognitiveAnalysisResult {
  const wordCount = text.split(/\s+/).length;
  const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
  const complexSentences = (text.match(/[;:]/g) || []).length;
  
  // Base score calculation
  let score = 70;
  if (wordCount > 500) score += 5;
  if (avgWordLength > 5) score += 5;
  if (complexSentences > 3) score += 5;
  
  score = Math.max(65, Math.min(85, score));
  
  return {
    intelligenceScore: score,
    characteristics: ['analytical', 'systematic', 'methodical'],
    detailedAnalysis: `The author demonstrates ${score > 75 ? 'above-average' : 'solid'} cognitive abilities with a structured approach to reasoning. The writing shows clear logical progression and effective communication skills. The cognitive profile suggests someone who approaches problems methodically and values clarity in expression.`,
    strengths: ['logical reasoning', 'clear communication', 'systematic thinking'],
    tendencies: ['methodical analysis', 'evidence-based reasoning', 'structured presentation']
  };
}