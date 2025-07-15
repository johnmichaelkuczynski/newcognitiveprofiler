import { analyzeWithOpenAI } from "./openai";
import { analyzeWithAnthropic } from "./anthropic";
import { analyzeWithPerplexity } from "./perplexity";
import { ModelProvider } from "./index";

export interface ComprehensiveCognitiveProfile {
  compression_tolerance: string;
  inferential_depth: string;
  semantic_curvature: string;
  cognitive_load_bandwidth: string;
  epistemic_risk_tolerance: string;
  narrative_vs_structural_bias: string;
  heuristic_anchoring_bias: string;
  self_compression_quotient: string;
  recursion_depth_on_self: string;
  reconceptualization_rate: string;
  dominance_framing_bias: string;
  validation_source_gradient: string;
  dialectical_agonism: string;
  modality_preference: string;
  schema_flexibility: string;
  proceduralism_threshold: string;
  predictive_modeling_index: string;
  social_system_complexity_model: string;
  mythology_bias: string;
  asymmetry_detection_quotient: string;
}

const cognitiveParameters = [
  {
    key: "compression_tolerance",
    name: "Compression Tolerance",
    description: "Degree to which the person seeks dense, abstract representations over surface details"
  },
  {
    key: "inferential_depth",
    name: "Inferential Depth", 
    description: "How far ahead a person naturally projects in causal/logical chains before committing to conclusions"
  },
  {
    key: "semantic_curvature",
    name: "Semantic Curvature",
    description: "Tendency to cross conceptual boundaries and reframe terms in adjacent but non-isomorphic domains"
  },
  {
    key: "cognitive_load_bandwidth",
    name: "Cognitive Load Bandwidth",
    description: "Number of variables or active threads someone can sustain in parallel before system degradation"
  },
  {
    key: "epistemic_risk_tolerance",
    name: "Epistemic Risk Tolerance",
    description: "Willingness to entertain unstable or fringe hypotheses when the payoff is deeper insight"
  },
  {
    key: "narrative_vs_structural_bias",
    name: "Narrative vs. Structural Bias",
    description: "Preference for anecdotal/story-based cognition vs. pattern/system-based models"
  },
  {
    key: "heuristic_anchoring_bias",
    name: "Heuristic Anchoring Bias",
    description: "How often first-pass intuitions dominate downstream reasoning"
  },
  {
    key: "self_compression_quotient",
    name: "Self-Compression Quotient",
    description: "Degree to which a person can summarize their own thought system into coherent abstract modules"
  },
  {
    key: "recursion_depth_on_self",
    name: "Recursion Depth on Self",
    description: "Number of layers deep a person tracks their own cognitive operations or psychological motives"
  },
  {
    key: "reconceptualization_rate",
    name: "Reconceptualization Rate",
    description: "Speed and frequency with which one reforms or discards major conceptual categories"
  },
  {
    key: "dominance_framing_bias",
    name: "Dominance Framing Bias",
    description: "Default positioning of oneself in terms of social, intellectual, or epistemic superiority/inferiority"
  },
  {
    key: "validation_source_gradient",
    name: "Validation Source Gradient",
    description: "Internal vs. external motivation for cognitive output"
  },
  {
    key: "dialectical_agonism",
    name: "Dialectical Agonism",
    description: "Ability to build arguments that strengthen the opposing view, even while refuting it"
  },
  {
    key: "modality_preference",
    name: "Modality Preference",
    description: "Abstract-verbal vs. visual-spatial vs. kinetic-emotional thinking bias"
  },
  {
    key: "schema_flexibility",
    name: "Schema Flexibility",
    description: "Ease of updating or discarding core frameworks in light of contradictory evidence"
  },
  {
    key: "proceduralism_threshold",
    name: "Proceduralism Threshold",
    description: "Degree to which one respects systems, protocols, or legalistic steps vs. valuing results"
  },
  {
    key: "predictive_modeling_index",
    name: "Predictive Modeling Index",
    description: "Preference for models that maximize forecasting power over coherence"
  },
  {
    key: "social_system_complexity_model",
    name: "Social System Complexity Model",
    description: "Granularity of one's working model of institutions, networks, reputations"
  },
  {
    key: "mythology_bias",
    name: "Mythology Bias",
    description: "Degree to which narrative/mythic structures override or inform analytic judgment"
  },
  {
    key: "asymmetry_detection_quotient",
    name: "Asymmetry Detection Quotient",
    description: "Sensitivity to unspoken structural asymmetries in systems or conversations"
  }
];

function createComprehensiveCognitivePrompt(text: string): string {
  return `
You are an advanced cognitive profiling system. Analyze the following text and provide detailed assessments for each of the 20 cognitive parameters listed below. For each parameter, provide a 2-3 sentence analysis that demonstrates how the text reveals this specific cognitive dimension.

TEXT TO ANALYZE:
${text}

COGNITIVE PARAMETERS TO ANALYZE:

${cognitiveParameters.map((param, index) => `
${index + 1}. ${param.name}: ${param.description}
`).join('')}

INSTRUCTIONS:
- Analyze each parameter independently and thoroughly
- Provide specific evidence from the text for each assessment
- Use psychological and cognitive science terminology appropriately
- Each analysis should be 2-3 sentences that directly address the parameter
- Be specific about what the text reveals about each cognitive dimension
- Avoid generic responses - each analysis should be unique to the parameter

RESPOND IN JSON FORMAT:
{
  "compression_tolerance": "Your detailed analysis here",
  "inferential_depth": "Your detailed analysis here",
  "semantic_curvature": "Your detailed analysis here",
  "cognitive_load_bandwidth": "Your detailed analysis here",
  "epistemic_risk_tolerance": "Your detailed analysis here",
  "narrative_vs_structural_bias": "Your detailed analysis here",
  "heuristic_anchoring_bias": "Your detailed analysis here",
  "self_compression_quotient": "Your detailed analysis here",
  "recursion_depth_on_self": "Your detailed analysis here",
  "reconceptualization_rate": "Your detailed analysis here",
  "dominance_framing_bias": "Your detailed analysis here",
  "validation_source_gradient": "Your detailed analysis here",
  "dialectical_agonism": "Your detailed analysis here",
  "modality_preference": "Your detailed analysis here",
  "schema_flexibility": "Your detailed analysis here",
  "proceduralism_threshold": "Your detailed analysis here",
  "predictive_modeling_index": "Your detailed analysis here",
  "social_system_complexity_model": "Your detailed analysis here",
  "mythology_bias": "Your detailed analysis here",
  "asymmetry_detection_quotient": "Your detailed analysis here"
}`;
}

export async function generateComprehensiveCognitiveProfile(text: string, provider: ModelProvider = "openai"): Promise<ComprehensiveCognitiveProfile> {
  const prompt = createComprehensiveCognitivePrompt(text);
  
  try {
    let response: string;
    
    switch (provider) {
      case "openai":
        response = await callOpenAI(prompt);
        break;
      case "anthropic":
        response = await callAnthropic(prompt);
        break;
      case "perplexity":
        response = await callPerplexity(prompt);
        break;
      default:
        response = await callOpenAI(prompt);
    }
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(response);
    return parsedResponse as ComprehensiveCognitiveProfile;
    
  } catch (error) {
    console.error(`Error generating comprehensive cognitive profile with ${provider}:`, error);
    return createFallbackProfile();
  }
}

async function callOpenAI(prompt: string): Promise<string> {
  const OpenAI = await import("openai");
  const openai = new OpenAI.default({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert cognitive profiling system. Respond only with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000
  });
  
  return response.choices[0].message.content || "";
}

async function callAnthropic(prompt: string): Promise<string> {
  const Anthropic = await import("@anthropic-ai/sdk");
  const anthropic = new Anthropic.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 2000,
    temperature: 0.3,
    system: "You are an expert cognitive profiling system. Respond only with valid JSON.",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });
  
  return response.content[0].type === 'text' ? response.content[0].text : "";
}

async function callPerplexity(prompt: string): Promise<string> {
  // Implement Perplexity API call or use fallback
  return JSON.stringify(createFallbackProfile());
}

function createFallbackProfile(): ComprehensiveCognitiveProfile {
  return {
    compression_tolerance: "Analysis pending - comprehensive cognitive profiling requires processing.",
    inferential_depth: "Analysis pending - comprehensive cognitive profiling requires processing.",
    semantic_curvature: "Analysis pending - comprehensive cognitive profiling requires processing.",
    cognitive_load_bandwidth: "Analysis pending - comprehensive cognitive profiling requires processing.",
    epistemic_risk_tolerance: "Analysis pending - comprehensive cognitive profiling requires processing.",
    narrative_vs_structural_bias: "Analysis pending - comprehensive cognitive profiling requires processing.",
    heuristic_anchoring_bias: "Analysis pending - comprehensive cognitive profiling requires processing.",
    self_compression_quotient: "Analysis pending - comprehensive cognitive profiling requires processing.",
    recursion_depth_on_self: "Analysis pending - comprehensive cognitive profiling requires processing.",
    reconceptualization_rate: "Analysis pending - comprehensive cognitive profiling requires processing.",
    dominance_framing_bias: "Analysis pending - comprehensive cognitive profiling requires processing.",
    validation_source_gradient: "Analysis pending - comprehensive cognitive profiling requires processing.",
    dialectical_agonism: "Analysis pending - comprehensive cognitive profiling requires processing.",
    modality_preference: "Analysis pending - comprehensive cognitive profiling requires processing.",
    schema_flexibility: "Analysis pending - comprehensive cognitive profiling requires processing.",
    proceduralism_threshold: "Analysis pending - comprehensive cognitive profiling requires processing.",
    predictive_modeling_index: "Analysis pending - comprehensive cognitive profiling requires processing.",
    social_system_complexity_model: "Analysis pending - comprehensive cognitive profiling requires processing.",
    mythology_bias: "Analysis pending - comprehensive cognitive profiling requires processing.",
    asymmetry_detection_quotient: "Analysis pending - comprehensive cognitive profiling requires processing."
  };
}