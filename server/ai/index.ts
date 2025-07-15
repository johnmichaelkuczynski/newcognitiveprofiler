import { CognitiveAnalysisResult } from "@/types/analysis";
import { analyzeWithOpenAI } from "./openai";
import { analyzeWithAnthropic } from "./anthropic";
import { analyzeWithPerplexity } from "./perplexity";

// Define the supported model providers
export type ModelProvider = "openai" | "anthropic" | "perplexity";

/**
 * Validates the cognitive analysis result to ensure it meets our standards:
 * 1. No grading language
 * 2. Score and analysis are aligned
 * 3. No mention of evidence, references, etc.
 */
function validateAnalysisResult(result: CognitiveAnalysisResult): { valid: boolean; issues: string[] } {
  // Only look for the most serious issues that defeat the purpose of the app
  const issues: string[] = [];
  const fullText = result.detailedAnalysis.toLowerCase();

  // Check for explicit grading language
  const criticalGradingPhrases = [
    'would benefit from more references',
    'needs more evidence',
    'lacks supporting evidence',
    'lacks citations',
    'needs citations',
    'more research',
    'the paper would be better if',
    'the writing needs',
    'incomplete argument',
    'insufficient evidence',
    'lacks academic rigor'
  ];

  for (const phrase of criticalGradingPhrases) {
    if (fullText.includes(phrase)) {
      issues.push(`Contains paper grading language: "${phrase}"`);
    }
  }

  // Check for severe score-description mismatch
  if (
    (fullText.includes('groundbreaking') || 
     fullText.includes('exceptional original') || 
     fullText.includes('revolutionary') ||
     fullText.includes('extraordinary intelligence')) && 
    result.intelligenceScore < 85
  ) {
    issues.push(`Major score discrepancy: Describes exceptional intelligence but score is ${result.intelligenceScore}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Analyzes text using a single provider with validation and resubmission
 */
async function analyzeTextWithProvider(text: string, provider: ModelProvider, validationFeedback: string = ""): Promise<CognitiveAnalysisResult> {
  let maxAttempts = 3;
  let attempts = 0;
  let result: CognitiveAnalysisResult | undefined;
  let validation = { valid: false, issues: ["Initial validation"] };
  
  // Create enhanced prompt with validation feedback if available
  const enhancedText = validationFeedback ? 
    `${text}\n\nIMPORTANT: Previous analysis had issues: ${validationFeedback}. Remember, DO NOT grade the writing, only profile the mind behind it. DO NOT comment on evidence, support, or completeness.` : 
    text;
  
  while (!validation.valid && attempts < maxAttempts) {
    attempts++;
    
    try {
      // Call the appropriate AI service based on the provider
      switch (provider) {
        case "openai":
          result = await analyzeWithOpenAI(enhancedText);
          break;
        case "anthropic":
          result = await analyzeWithAnthropic(enhancedText);
          break;
        case "perplexity":
          result = await analyzeWithPerplexity(enhancedText);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
      
      // Validate the result
      validation = validateAnalysisResult(result);
      
      if (!validation.valid && attempts < maxAttempts) {
        console.log(`${provider} analysis attempt ${attempts} failed validation: ${validation.issues.join(', ')}`);
        // Try again with specific feedback
        return await analyzeTextWithProvider(text, provider, validation.issues.join(', '));
      }
    } catch (error: any) {
      console.error(`Error in ${provider} analysis:`, error);
      throw new Error(`Analysis with ${provider} failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  if (!validation.valid) {
    console.warn(`${provider} analysis still invalid after ${attempts} attempts: ${validation.issues.join(', ')}`);
  }
  
  // If we've reached here, we have a result (even if not perfectly valid)
  if (!result) {
    throw new Error(`Analysis with ${provider} failed to produce a result`);
  }
  
  return result;
}

/**
 * Analyzes text using the specified provider
 */
export async function analyzeText(text: string, provider: ModelProvider = "openai"): Promise<CognitiveAnalysisResult> {
  try {
    const result = await analyzeTextWithProvider(text, provider);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Analysis failed: ${errorMessage}`);
  }
}

/**
 * Analyzes text using all providers and returns all results
 */
export async function analyzeTextWithAllProviders(text: string): Promise<Record<ModelProvider, CognitiveAnalysisResult>> {
  const providers: ModelProvider[] = ["openai", "anthropic", "perplexity"];
  const results: Partial<Record<ModelProvider, CognitiveAnalysisResult>> = {};
  
  for (const provider of providers) {
    try {
      console.log(`Starting analysis with ${provider}...`);
      const result = await analyzeTextWithProvider(text, provider);
      results[provider] = result;
      console.log(`Completed analysis with ${provider}`);
    } catch (error) {
      console.error(`Error analyzing with ${provider}:`, error);
      // Continue with other providers even if one fails
    }
  }
  
  if (Object.keys(results).length === 0) {
    throw new Error("All analysis providers failed");
  }
  
  return results as Record<ModelProvider, CognitiveAnalysisResult>;
}

/**
 * Comprehensive cognitive analysis using all 20 cognitive parameters
 */
export async function analyzeCognitiveParameters(text: string, additionalInfo: string = ""): Promise<any> {
  const cognitiveParameters = [
    { id: 1, name: "Compression Tolerance", description: "Degree to which the person seeks dense, abstract representations over surface details." },
    { id: 2, name: "Inferential Depth", description: "How far ahead a person naturally projects in causal/logical chains before committing to conclusions." },
    { id: 3, name: "Semantic Curvature", description: "Tendency to cross conceptual boundaries and reframe terms in adjacent but non-isomorphic domains." },
    { id: 4, name: "Cognitive Load Bandwidth", description: "Number of variables or active threads someone can sustain in parallel before system degradation." },
    { id: 5, name: "Epistemic Risk Tolerance", description: "Willingness to entertain unstable or fringe hypotheses when the payoff is deeper insight." },
    { id: 6, name: "Narrative vs. Structural Bias", description: "Preference for anecdotal/story-based cognition vs. pattern/system-based models." },
    { id: 7, name: "Heuristic Anchoring Bias", description: "How often first-pass intuitions dominate downstream reasoning." },
    { id: 8, name: "Self-Compression Quotient", description: "Degree to which a person can summarize their own thought system into coherent abstract modules." },
    { id: 9, name: "Recursion Depth on Self", description: "Number of layers deep a person tracks their own cognitive operations or psychological motives." },
    { id: 10, name: "Reconceptualization Rate", description: "Speed and frequency with which one reforms or discards major conceptual categories." },
    { id: 11, name: "Dominance Framing Bias", description: "Default positioning of oneself in terms of social, intellectual, or epistemic superiority/inferiority." },
    { id: 12, name: "Validation Source Gradient", description: "Internal vs. external motivation for cognitive output." },
    { id: 13, name: "Dialectical Agonism", description: "Ability to build arguments that strengthen the opposing view, even while refuting it." },
    { id: 14, name: "Modality Preference", description: "Abstract-verbal vs. visual-spatial vs. kinetic-emotional thinking bias." },
    { id: 15, name: "Schema Flexibility", description: "Ease of updating or discarding core frameworks in light of contradictory evidence." },
    { id: 16, name: "Proceduralism Threshold", description: "Degree to which one respects systems, protocols, or legalistic steps vs. valuing results." },
    { id: 17, name: "Predictive Modeling Index", description: "Preference for models that maximize forecasting power over coherence." },
    { id: 18, name: "Social System Complexity Model", description: "Granularity of one's working model of institutions, networks, reputations." },
    { id: 19, name: "Mythology Bias", description: "Degree to which narrative/mythic structures override or inform analytic judgment." },
    { id: 20, name: "Asymmetry Detection Quotient", description: "Sensitivity to unspoken structural asymmetries in systems or conversations." }
  ];

  const prompt = `
COMPREHENSIVE COGNITIVE ANALYSIS SYSTEM

You are an expert cognitive analyst conducting a detailed assessment using 20 specific cognitive parameters. This is NOT a writing evaluation - you are treating the text as forensic evidence to understand the author's cognitive patterns.

TEXT TO ANALYZE:
${text}

${additionalInfo ? `ADDITIONAL CONTEXT: ${additionalInfo}` : ''}

COGNITIVE PARAMETERS TO EVALUATE:
${cognitiveParameters.map(p => `${p.id}. ${p.name}: ${p.description}`).join('\n')}

ANALYSIS REQUIREMENTS:
1. For each parameter, provide:
   - A detailed analysis of how the author demonstrates this trait
   - 2-3 specific quotations from the text as supporting evidence
   - Clear reasoning connecting the evidence to the parameter
   - A score from 1-10 (1 = extremely low, 10 = extremely high)

2. Provide an overall assessment summarizing the cognitive profile
3. Identify 3-5 key insights about the author's thinking patterns
4. Focus on genuine cognitive markers, not writing quality

RESPONSE FORMAT (JSON):
{
  "parameters": [
    {
      "id": 1,
      "name": "Compression Tolerance",
      "description": "Degree to which the person seeks dense, abstract representations over surface details.",
      "analysis": "Detailed analysis of this parameter in the text",
      "quotations": ["Quote 1", "Quote 2", "Quote 3"],
      "reasoning": "Clear reasoning connecting evidence to parameter",
      "score": 7
    }
  ],
  "overallAssessment": "Comprehensive summary of cognitive profile",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"]
}

Analyze the cognitive patterns evidenced in this text using these parameters.
`;

  try {
    const result = await analyzeWithOpenAI(prompt);
    return JSON.parse(result.detailedAnalysis);
  } catch (error) {
    console.error('Cognitive analysis error:', error);
    throw error;
  }
}

/**
 * Comprehensive psychological analysis using all 20 psychological parameters
 */
export async function analyzePsychologicalParameters(text: string, additionalInfo: string = ""): Promise<any> {
  const psychologicalParameters = [
    { id: 1, name: "Attachment Mode", description: "Secure vs. anxious vs. avoidant vs. disorganized; predicts interpersonal stance." },
    { id: 2, name: "Drive Sublimation Quotient", description: "Ability to channel raw drives into symbolic/intellectual work." },
    { id: 3, name: "Validation Hunger Index", description: "Degree to which external affirmation is required for psychic stability." },
    { id: 4, name: "Shame-Anger Conversion Tendency", description: "Likelihood of transmuting shame into hostility or aggression." },
    { id: 5, name: "Ego Fragility", description: "Sensitivity to critique or loss of control; predicts defensiveness." },
    { id: 6, name: "Affect Labeling Proficiency", description: "Accuracy in identifying one's own emotional states." },
    { id: 7, name: "Implicit Emotion Model", description: "Degree to which one runs on internalized emotional schemas." },
    { id: 8, name: "Projection Bias", description: "Tendency to offload inner conflict onto external targets." },
    { id: 9, name: "Defensive Modality Preference", description: "Primary psychological defense type (e.g., repression, denial, rationalization)." },
    { id: 10, name: "Emotional Time Lag", description: "Delay between emotional stimulus and self-aware response." },
    { id: 11, name: "Distress Tolerance", description: "Capacity to function under high emotional strain." },
    { id: 12, name: "Impulse Channeling Index", description: "Degree to which urges are shaped into structured output." },
    { id: 13, name: "Mood Volatility", description: "Amplitude and frequency of emotional state swings." },
    { id: 14, name: "Despair Threshold", description: "Point at which one shifts from struggle to collapse or apathy." },
    { id: 15, name: "Self-Soothing Access", description: "Availability of effective mechanisms to calm emotional states." },
    { id: 16, name: "Persona-Alignment Quotient", description: "Gap between external presentation and internal self-perception." },
    { id: 17, name: "Envy Index", description: "Intensity of comparative pain from perceived inferiority." },
    { id: 18, name: "Emotional Reciprocity Capacity", description: "Ability to engage empathically without detachment or flooding." },
    { id: 19, name: "Narrative Self-Justification Tendency", description: "Compulsive construction of explanatory myths to protect ego ideal." },
    { id: 20, name: "Symbolic Reframing Ability", description: "Capacity to convert painful material into metaphor, narrative, or philosophy." }
  ];

  const prompt = `
COMPREHENSIVE PSYCHOLOGICAL ANALYSIS SYSTEM

You are an expert psychological analyst conducting a detailed assessment using 20 specific psychological parameters. This is NOT a writing evaluation - you are treating the text as forensic evidence to understand the author's psychological patterns.

TEXT TO ANALYZE:
${text}

${additionalInfo ? `ADDITIONAL CONTEXT: ${additionalInfo}` : ''}

PSYCHOLOGICAL PARAMETERS TO EVALUATE:
${psychologicalParameters.map(p => `${p.id}. ${p.name}: ${p.description}`).join('\n')}

ANALYSIS REQUIREMENTS:
1. For each parameter, provide:
   - A detailed analysis of how the author demonstrates this trait
   - 2-3 specific quotations from the text as supporting evidence
   - Clear reasoning connecting the evidence to the parameter
   - A score from 1-10 (1 = concerning/unhealthy, 10 = optimal/healthy)

2. Provide an overall psychological assessment
3. Identify key insights about psychological patterns
4. List psychological strengths and areas for attention
5. Focus on genuine psychological markers, not writing quality

RESPONSE FORMAT (JSON):
{
  "parameters": [
    {
      "id": 1,
      "name": "Attachment Mode",
      "description": "Secure vs. anxious vs. avoidant vs. disorganized; predicts interpersonal stance.",
      "analysis": "Detailed analysis of this parameter in the text",
      "quotations": ["Quote 1", "Quote 2", "Quote 3"],
      "reasoning": "Clear reasoning connecting evidence to parameter",
      "score": 7
    }
  ],
  "overallAssessment": "Comprehensive summary of psychological profile",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "riskFactors": ["Risk factor 1", "Risk factor 2", "Risk factor 3"]
}

Analyze the psychological patterns evidenced in this text using these parameters.
`;

  try {
    const result = await analyzeWithOpenAI(prompt);
    return JSON.parse(result.detailedAnalysis);
  } catch (error) {
    console.error('Psychological analysis error:', error);
    throw error;
  }
}