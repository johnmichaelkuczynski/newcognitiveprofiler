import { ModelProvider } from './index';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

// Define types for the comprehensive psychological report
export interface ComprehensivePsychologicalReport {
  personalityTraits: string;
  authorityRelationship: string;
  psychologicalSigns: string;
  emotionalUndertone: string;
  motivation: string;
  interpersonalStance: string;
  emotionalAwareness: string;
  implicitValues: string;
  communicationStyle: string;
  generatedBy: ModelProvider;
}

/**
 * Generate a comprehensive psychological report with detailed answers to specific questions
 */
export async function generateComprehensivePsychologicalReport(text: string, provider: ModelProvider = "openai"): Promise<ComprehensivePsychologicalReport> {
  switch (provider) {
    case "openai":
      return generateWithOpenAI(text);
    case "anthropic":
      return generateWithAnthropic(text);
    case "perplexity":
      return generateWithPerplexity(text);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Generate comprehensive psychological report using OpenAI
 */
async function generateWithOpenAI(text: string): Promise<ComprehensivePsychologicalReport> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a prompt for the comprehensive analysis
    const prompt = createAnalysisPrompt(text);

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert psychological profiler specializing in text analysis. Provide detailed answers to questions about the author's psychological traits based on their writing."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
    });

    // Extract and parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return parseReportResponse(content, "openai");
  } catch (error) {
    console.error("Error generating comprehensive psychological report with OpenAI:", error);
    return createFallbackReport("openai");
  }
}

/**
 * Generate comprehensive psychological report using Anthropic/Claude
 */
async function generateWithAnthropic(text: string): Promise<ComprehensivePsychologicalReport> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Anthropic API key is not configured");
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create a prompt for the comprehensive analysis
    const prompt = createAnalysisPrompt(text);

    // Call the Anthropic/Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      system: "You are an expert psychological profiler specializing in text analysis. Provide detailed answers to questions about the author's psychological traits based on their writing."
    });

    // Extract and parse the response
    const content = response.content.map(item => {
      if (item.type === 'text') {
        return item.text;
      }
      return '';
    }).join('');
    
    if (!content) {
      throw new Error("Empty response from Anthropic");
    }

    return parseReportResponse(content, "anthropic");
  } catch (error) {
    console.error("Error generating comprehensive psychological report with Anthropic:", error);
    return createFallbackReport("anthropic");
  }
}

/**
 * Generate comprehensive psychological report using Perplexity
 */
async function generateWithPerplexity(text: string): Promise<ComprehensivePsychologicalReport> {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("Perplexity API key is not configured");
    }

    // Create a prompt for the comprehensive analysis
    const prompt = createAnalysisPrompt(text);

    // Prepare API request
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are an expert psychological profiler specializing in text analysis. Provide detailed answers to questions about the author's psychological traits based on their writing."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from Perplexity");
    }

    return parseReportResponse(content, "perplexity");
  } catch (error) {
    console.error("Error generating comprehensive psychological report with Perplexity:", error);
    return createFallbackReport("perplexity");
  }
}

/**
 * Create the analysis prompt
 */
function createAnalysisPrompt(text: string): string {
  return `
Below is a sample of writing. Please analyze it in detail and provide at least one paragraph for each of the following questions:

1. What personality traits are evident from the text (e.g., confidence, defensiveness, grandiosity, openness)?
2. How does the author relate to authority, institutions, or the establishment?
3. Does the author display any signs of insecurity, ego inflation, paranoia, or emotional repression?
4. What emotional undertone or affective valence characterizes the writing (e.g., angry, measured, smug, defiant)?
5. What motivates the author: curiosity, grievance, status, truth-seeking, ideology, something else?
6. How does the author frame themselves in relation to others—isolated, combative, persuasive, collaborative?
7. Does the author seem emotionally self-aware, or are there signs of repression or distortion?
8. What implicit values (e.g., freedom, rationality, loyalty, transcendence) animate the author's focus?
9. Is the author more self-expressive, argumentative, confessional, or performative in their intent?

Please be specific and cite evidence from the text in your responses. Format your answers with headings for each question.

TEXT FOR ANALYSIS:
${text}
`;
}

/**
 * Parse the AI response into a structured report
 */
function parseReportResponse(content: string, provider: ModelProvider): ComprehensivePsychologicalReport {
  try {
    // Initialize report with default values
    const report: ComprehensivePsychologicalReport = {
      personalityTraits: "Unable to extract personality traits analysis.",
      authorityRelationship: "Unable to extract authority relationship analysis.",
      psychologicalSigns: "Unable to extract psychological signs analysis.",
      emotionalUndertone: "Unable to extract emotional undertone analysis.",
      motivation: "Unable to extract motivation analysis.",
      interpersonalStance: "Unable to extract interpersonal stance analysis.",
      emotionalAwareness: "Unable to extract emotional awareness analysis.",
      implicitValues: "Unable to extract implicit values analysis.",
      communicationStyle: "Unable to extract communication style analysis.",
      generatedBy: provider
    };

    // Split by headings or numbered sections
    const lines = content.split('\n');
    
    let currentQuestion = 0;
    let currentContent = "";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for question number patterns like "1." or "1:" or "Question 1:" etc.
      const questionMatch = line.match(/^(?:Question\s*)?(\d+)[.:]\s*(.*)$/i);
      
      if (questionMatch) {
        // If we were collecting content, save it to the previous question
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        
        // Start collecting for new question
        currentQuestion = parseInt(questionMatch[1]);
        currentContent = questionMatch[2] ? questionMatch[2] + "\n" : "";
      } 
      // Alternative heading pattern detection
      else if (/^personality\s*traits|personality/i.test(line) && currentQuestion === 0) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 1;
        currentContent = "";
      }
      else if (/^authority|institutions|establishment|relate\s*to\s*authority/i.test(line) && (currentQuestion === 0 || currentQuestion === 1)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 2;
        currentContent = "";
      }
      else if (/^insecurity|ego\s*inflation|paranoia|emotional\s*repression/i.test(line) && (currentQuestion <= 2)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 3;
        currentContent = "";
      }
      else if (/^emotional\s*undertone|affective\s*valence/i.test(line) && (currentQuestion <= 3)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 4;
        currentContent = "";
      }
      else if (/^motivation|motivates|what\s*motivates/i.test(line) && (currentQuestion <= 4)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 5;
        currentContent = "";
      }
      else if (/^interpersonal|relation\s*to\s*others|frame\s*themselves/i.test(line) && (currentQuestion <= 5)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 6;
        currentContent = "";
      }
      else if (/^emotional\s*self-aware|self\s*aware|emotional\s*awareness/i.test(line) && (currentQuestion <= 6)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 7;
        currentContent = "";
      }
      else if (/^implicit\s*values|values/i.test(line) && (currentQuestion <= 7)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 8;
        currentContent = "";
      }
      else if (/^communication\s*style|self-expressive|argumentative|confessional|performative/i.test(line) && (currentQuestion <= 8)) {
        if (currentQuestion > 0 && currentContent.trim()) {
          updateReportWithAnswer(report, currentQuestion, currentContent.trim());
        }
        currentQuestion = 9;
        currentContent = "";
      }
      else if (currentQuestion > 0) {
        // Add this line to the current content
        currentContent += line + "\n";
      }
    }
    
    // Don't forget to save the last section
    if (currentQuestion > 0 && currentContent.trim()) {
      updateReportWithAnswer(report, currentQuestion, currentContent.trim());
    }
    
    return report;
  } catch (error) {
    console.error("Error parsing comprehensive psychological report:", error);
    return createFallbackReport(provider);
  }
}

/**
 * Update the report with an answer for a specific question
 */
function updateReportWithAnswer(report: ComprehensivePsychologicalReport, questionNumber: number, content: string): void {
  switch (questionNumber) {
    case 1:
      report.personalityTraits = content;
      break;
    case 2:
      report.authorityRelationship = content;
      break;
    case 3:
      report.psychologicalSigns = content;
      break;
    case 4:
      report.emotionalUndertone = content;
      break;
    case 5:
      report.motivation = content;
      break;
    case 6:
      report.interpersonalStance = content;
      break;
    case 7:
      report.emotionalAwareness = content;
      break;
    case 8:
      report.implicitValues = content;
      break;
    case 9:
      report.communicationStyle = content;
      break;
  }
}

/**
 * Create a fallback report when a provider fails
 */
function createFallbackReport(provider: ModelProvider): ComprehensivePsychologicalReport {
  return {
    personalityTraits: "The personality traits could not be accurately assessed due to technical limitations.",
    authorityRelationship: "The relationship to authority could not be accurately assessed due to technical limitations.",
    psychologicalSigns: "The psychological signs could not be accurately assessed due to technical limitations.",
    emotionalUndertone: "The emotional undertone could not be accurately assessed due to technical limitations.",
    motivation: "The motivations could not be accurately assessed due to technical limitations.",
    interpersonalStance: "The interpersonal stance could not be accurately assessed due to technical limitations.",
    emotionalAwareness: "The emotional awareness could not be accurately assessed due to technical limitations.",
    implicitValues: "The implicit values could not be accurately assessed due to technical limitations.",
    communicationStyle: "The communication style could not be accurately assessed due to technical limitations.",
    generatedBy: provider
  };
}