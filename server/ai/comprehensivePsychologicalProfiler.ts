import { analyzeWithOpenAI } from "./openai";
import { analyzeWithAnthropic } from "./anthropic";
import { analyzeWithPerplexity } from "./perplexity";
import { ModelProvider } from "./index";

export interface ComprehensivePsychologicalProfile {
  attachment_mode: string;
  drive_sublimation_quotient: string;
  validation_hunger_index: string;
  shame_anger_conversion_tendency: string;
  ego_fragility: string;
  affect_labeling_proficiency: string;
  implicit_emotion_model: string;
  projection_bias: string;
  defensive_modality_preference: string;
  emotional_time_lag: string;
  distress_tolerance: string;
  impulse_channeling_index: string;
  mood_volatility: string;
  despair_threshold: string;
  self_soothing_access: string;
  persona_alignment_quotient: string;
  envy_index: string;
  emotional_reciprocity_capacity: string;
  narrative_self_justification_tendency: string;
  symbolic_reframing_ability: string;
}

const psychologicalParameters = [
  {
    key: "attachment_mode",
    name: "Attachment Mode",
    description: "Secure vs. anxious vs. avoidant vs. disorganized; predicts interpersonal stance"
  },
  {
    key: "drive_sublimation_quotient",
    name: "Drive Sublimation Quotient",
    description: "Ability to channel raw drives into symbolic/intellectual work"
  },
  {
    key: "validation_hunger_index",
    name: "Validation Hunger Index",
    description: "Degree to which external affirmation is required for psychic stability"
  },
  {
    key: "shame_anger_conversion_tendency",
    name: "Shame-Anger Conversion Tendency",
    description: "Likelihood of transmuting shame into hostility or aggression"
  },
  {
    key: "ego_fragility",
    name: "Ego Fragility",
    description: "Sensitivity to critique or loss of control; predicts defensiveness"
  },
  {
    key: "affect_labeling_proficiency",
    name: "Affect Labeling Proficiency",
    description: "Accuracy in identifying one's own emotional states"
  },
  {
    key: "implicit_emotion_model",
    name: "Implicit Emotion Model",
    description: "Degree to which one runs on internalized emotional schemas"
  },
  {
    key: "projection_bias",
    name: "Projection Bias",
    description: "Tendency to offload inner conflict onto external targets"
  },
  {
    key: "defensive_modality_preference",
    name: "Defensive Modality Preference",
    description: "Primary psychological defense type (e.g., repression, denial, rationalization)"
  },
  {
    key: "emotional_time_lag",
    name: "Emotional Time Lag",
    description: "Delay between emotional stimulus and self-aware response"
  },
  {
    key: "distress_tolerance",
    name: "Distress Tolerance",
    description: "Capacity to function under high emotional strain"
  },
  {
    key: "impulse_channeling_index",
    name: "Impulse Channeling Index",
    description: "Degree to which urges are shaped into structured output"
  },
  {
    key: "mood_volatility",
    name: "Mood Volatility",
    description: "Amplitude and frequency of emotional state swings"
  },
  {
    key: "despair_threshold",
    name: "Despair Threshold",
    description: "Point at which one shifts from struggle to collapse or apathy"
  },
  {
    key: "self_soothing_access",
    name: "Self-Soothing Access",
    description: "Availability of effective mechanisms to calm emotional states"
  },
  {
    key: "persona_alignment_quotient",
    name: "Persona-Alignment Quotient",
    description: "Gap between external presentation and internal self-perception"
  },
  {
    key: "envy_index",
    name: "Envy Index",
    description: "Intensity of comparative pain from perceived inferiority"
  },
  {
    key: "emotional_reciprocity_capacity",
    name: "Emotional Reciprocity Capacity",
    description: "Ability to engage empathically without detachment or flooding"
  },
  {
    key: "narrative_self_justification_tendency",
    name: "Narrative Self-Justification Tendency",
    description: "Compulsive construction of explanatory myths to protect ego ideal"
  },
  {
    key: "symbolic_reframing_ability",
    name: "Symbolic Reframing Ability",
    description: "Capacity to convert painful material into metaphor, narrative, or philosophy"
  }
];

function createComprehensivePsychologicalPrompt(text: string): string {
  return `
You are an advanced psychological profiling system. Analyze the following text and provide detailed assessments for each of the 20 psychological parameters listed below. For each parameter, provide a 2-3 sentence analysis that demonstrates how the text reveals this specific psychological dimension.

TEXT TO ANALYZE:
${text}

PSYCHOLOGICAL PARAMETERS TO ANALYZE:

${psychologicalParameters.map((param, index) => `
${index + 1}. ${param.name}: ${param.description}
`).join('')}

INSTRUCTIONS:
- Analyze each parameter independently and thoroughly
- Provide detailed analysis with DIRECT QUOTATIONS from the text as evidence
- Use psychological and clinical terminology appropriately
- Each analysis should be at least 3-4 sentences with specific quotes and evidence
- Include actual quotes in quotation marks to support your analysis
- Be specific about what the text reveals about each psychological dimension
- ALWAYS provide analysis regardless of text length - never say "not enough information"
- Avoid generic responses - each analysis should be unique to the parameter

RESPOND IN JSON FORMAT:
{
  "attachment_mode": "Your detailed analysis here",
  "drive_sublimation_quotient": "Your detailed analysis here",
  "validation_hunger_index": "Your detailed analysis here",
  "shame_anger_conversion_tendency": "Your detailed analysis here",
  "ego_fragility": "Your detailed analysis here",
  "affect_labeling_proficiency": "Your detailed analysis here",
  "implicit_emotion_model": "Your detailed analysis here",
  "projection_bias": "Your detailed analysis here",
  "defensive_modality_preference": "Your detailed analysis here",
  "emotional_time_lag": "Your detailed analysis here",
  "distress_tolerance": "Your detailed analysis here",
  "impulse_channeling_index": "Your detailed analysis here",
  "mood_volatility": "Your detailed analysis here",
  "despair_threshold": "Your detailed analysis here",
  "self_soothing_access": "Your detailed analysis here",
  "persona_alignment_quotient": "Your detailed analysis here",
  "envy_index": "Your detailed analysis here",
  "emotional_reciprocity_capacity": "Your detailed analysis here",
  "narrative_self_justification_tendency": "Your detailed analysis here",
  "symbolic_reframing_ability": "Your detailed analysis here"
}`;
}

export async function generateComprehensivePsychologicalProfile(text: string, provider: ModelProvider = "openai"): Promise<ComprehensivePsychologicalProfile> {
  const prompt = createComprehensivePsychologicalPrompt(text);
  
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
    return parsedResponse as ComprehensivePsychologicalProfile;
    
  } catch (error) {
    console.error(`Error generating comprehensive psychological profile with ${provider}:`, error);
    return createFallbackProfile();
  }
}

async function callOpenAI(prompt: string): Promise<string> {
  const OpenAI = await import("openai");
  const openai = new OpenAI.default({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert psychological profiling system. Respond only with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 4000
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
    system: "You are an expert psychological profiling system. Respond only with valid JSON.",
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

function createFallbackProfile(): ComprehensivePsychologicalProfile {
  return {
    attachment_mode: "Analysis pending - comprehensive psychological profiling requires processing.",
    drive_sublimation_quotient: "Analysis pending - comprehensive psychological profiling requires processing.",
    validation_hunger_index: "Analysis pending - comprehensive psychological profiling requires processing.",
    shame_anger_conversion_tendency: "Analysis pending - comprehensive psychological profiling requires processing.",
    ego_fragility: "Analysis pending - comprehensive psychological profiling requires processing.",
    affect_labeling_proficiency: "Analysis pending - comprehensive psychological profiling requires processing.",
    implicit_emotion_model: "Analysis pending - comprehensive psychological profiling requires processing.",
    projection_bias: "Analysis pending - comprehensive psychological profiling requires processing.",
    defensive_modality_preference: "Analysis pending - comprehensive psychological profiling requires processing.",
    emotional_time_lag: "Analysis pending - comprehensive psychological profiling requires processing.",
    distress_tolerance: "Analysis pending - comprehensive psychological profiling requires processing.",
    impulse_channeling_index: "Analysis pending - comprehensive psychological profiling requires processing.",
    mood_volatility: "Analysis pending - comprehensive psychological profiling requires processing.",
    despair_threshold: "Analysis pending - comprehensive psychological profiling requires processing.",
    self_soothing_access: "Analysis pending - comprehensive psychological profiling requires processing.",
    persona_alignment_quotient: "Analysis pending - comprehensive psychological profiling requires processing.",
    envy_index: "Analysis pending - comprehensive psychological profiling requires processing.",
    emotional_reciprocity_capacity: "Analysis pending - comprehensive psychological profiling requires processing.",
    narrative_self_justification_tendency: "Analysis pending - comprehensive psychological profiling requires processing.",
    symbolic_reframing_ability: "Analysis pending - comprehensive psychological profiling requires processing."
  };
}