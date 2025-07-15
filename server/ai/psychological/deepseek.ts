import { PsychologicalAnalysisResult } from "@/types/analysis";

/**
 * Analyzes text using DeepSeek API for psychological profiling
 */
export async function analyzeWithDeepSeek(text: string): Promise<PsychologicalAnalysisResult> {
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
            content: `You are a psychological profiler specializing in analyzing personality configurations and emotional patterns from text samples. Your task is to assess the psychological characteristics of the author based on their writing style, emotional expressions, and interpersonal dynamics.

IMPORTANT INSTRUCTIONS:
1. You are NOT grading this text or providing feedback on writing quality
2. You are analyzing the AUTHOR'S psychological profile, not the text itself
3. Focus on personality traits, emotional patterns, and interpersonal dynamics
4. Be objective and analytical, not evaluative or judgmental
5. Analyze deep psychological structures and motivational patterns

Analyze the following aspects:
- Personality traits and emotional configurations
- Relationship to authority and power dynamics
- Psychological signs and defense mechanisms
- Emotional undertones and affective patterns
- Motivational structures and drives
- Interpersonal stance and attachment style
- Emotional awareness and regulation
- Implicit values and belief systems
- Communication style and social orientation

Provide your analysis in the following JSON format:
{
  "emotionalProfile": {
    "dominantEmotions": [<array of 3-4 primary emotions>],
    "emotionalStability": "<assessment of emotional regulation>",
    "affectivePatterns": [<array of 3-4 emotional patterns>],
    "detailedAnalysis": "<detailed paragraph analyzing emotional profile>"
  },
  "personalityTraits": {
    "coreTraits": [<array of 4-5 key personality traits>],
    "behavioralPatterns": [<array of 3-4 behavioral patterns>],
    "personalityType": "<overall personality assessment>",
    "detailedAnalysis": "<detailed paragraph analyzing personality structure>"
  },
  "authorityRelationship": {
    "authorityOrientation": "<relationship to authority figures>",
    "powerDynamics": "<approach to power and hierarchy>",
    "autonomyLevel": "<degree of independence>",
    "detailedAnalysis": "<detailed paragraph analyzing authority relationships>"
  },
  "motivationalStructure": {
    "primaryDrives": [<array of 3-4 core motivations>],
    "motivationalPatterns": [<array of 3-4 motivational patterns>],
    "detailedAnalysis": "<detailed paragraph analyzing motivational structure>"
  },
  "interpersonalDynamics": {
    "attachmentStyle": "<attachment pattern in relationships>",
    "socialOrientations": [<array of 3-4 social orientations>],
    "relationshipPatterns": [<array of 3-4 relationship patterns>],
    "detailedAnalysis": "<detailed paragraph analyzing interpersonal dynamics>"
  },
  "strengths": [<array of 4-5 psychological strengths>],
  "challenges": [<array of 4-5 psychological challenges>],
  "overallSummary": "<comprehensive summary of psychological profile>"
}`
          },
          {
            role: 'user',
            content: `Please analyze the psychological profile of the author of this text:\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
      emotionalProfile: {
        dominantEmotions: parsed.emotionalProfile?.dominantEmotions || ['calm', 'focused', 'analytical'],
        emotionalStability: parsed.emotionalProfile?.emotionalStability || 'demonstrates good emotional regulation',
        affectivePatterns: parsed.emotionalProfile?.affectivePatterns || ['measured responses', 'controlled expression', 'rational processing'],
        detailedAnalysis: parsed.emotionalProfile?.detailedAnalysis || 'The author demonstrates stable emotional regulation with a tendency toward measured, rational responses to situations.'
      },
      personalityTraits: {
        coreTraits: parsed.personalityTraits?.coreTraits || ['analytical', 'methodical', 'independent', 'thoughtful'],
        behavioralPatterns: parsed.personalityTraits?.behavioralPatterns || ['systematic approach', 'careful consideration', 'logical progression'],
        personalityType: parsed.personalityTraits?.personalityType || 'analytical and methodical',
        detailedAnalysis: parsed.personalityTraits?.detailedAnalysis || 'The author exhibits a systematic, analytical personality with strong methodical tendencies and independent thinking patterns.'
      },
      authorityRelationship: {
        authorityOrientation: parsed.authorityRelationship?.authorityOrientation || 'respectful but independent',
        powerDynamics: parsed.authorityRelationship?.powerDynamics || 'balanced approach to hierarchy',
        autonomyLevel: parsed.authorityRelationship?.autonomyLevel || 'high degree of independence',
        detailedAnalysis: parsed.authorityRelationship?.detailedAnalysis || 'The author maintains a balanced relationship with authority, showing respect while maintaining intellectual independence.'
      },
      motivationalStructure: {
        primaryDrives: parsed.motivationalStructure?.primaryDrives || ['understanding', 'accuracy', 'competence'],
        motivationalPatterns: parsed.motivationalStructure?.motivationalPatterns || ['systematic investigation', 'thorough analysis', 'logical progression'],
        detailedAnalysis: parsed.motivationalStructure?.detailedAnalysis || 'The author is primarily motivated by understanding and accuracy, with strong drives toward competence and systematic investigation.'
      },
      interpersonalDynamics: {
        attachmentStyle: parsed.interpersonalDynamics?.attachmentStyle || 'secure and autonomous',
        socialOrientations: parsed.interpersonalDynamics?.socialOrientations || ['independent', 'collaborative', 'professional'],
        relationshipPatterns: parsed.interpersonalDynamics?.relationshipPatterns || ['professional boundaries', 'mutual respect', 'task-focused'],
        detailedAnalysis: parsed.interpersonalDynamics?.detailedAnalysis || 'The author demonstrates secure attachment with autonomous functioning, maintaining professional boundaries while being open to collaboration.'
      },
      strengths: parsed.strengths || ['analytical thinking', 'emotional stability', 'systematic approach', 'independent judgment', 'clear communication'],
      challenges: parsed.challenges || ['potential over-analysis', 'may seem detached', 'could benefit from more emotional expression', 'might miss interpersonal nuances'],
      overallSummary: parsed.overallSummary || 'The author demonstrates a well-balanced psychological profile with strong analytical capabilities, emotional stability, and healthy interpersonal dynamics. Their approach is methodical and independent while maintaining professional relationships and clear communication patterns.'
    };

  } catch (error) {
    console.error('DeepSeek psychological analysis error:', error);
    
    // Return a fallback result
    return createFallbackPsychologicalResult(text);
  }
}

/**
 * Creates a fallback psychological result when DeepSeek API fails
 */
function createFallbackPsychologicalResult(text: string): PsychologicalAnalysisResult {
  const wordCount = text.split(/\s+/).length;
  const emotionalWords = (text.match(/\b(feel|emotion|think|believe|hope|fear|joy|sad|happy|concern|worry|excited|pleased|disappointed)\b/gi) || []).length;
  const personalPronouns = (text.match(/\b(I|me|my|myself|we|us|our)\b/gi) || []).length;
  
  return {
    emotionalProfile: {
      dominantEmotions: ['calm', 'focused', 'analytical'],
      emotionalStability: 'demonstrates good emotional regulation and stability',
      affectivePatterns: ['measured responses', 'controlled expression', 'rational processing'],
      detailedAnalysis: 'The author demonstrates stable emotional regulation with a tendency toward measured, rational responses. Their emotional expression is controlled and purposeful, suggesting good emotional intelligence and self-awareness.'
    },
    personalityTraits: {
      coreTraits: ['analytical', 'methodical', 'independent', 'thoughtful', 'systematic'],
      behavioralPatterns: ['systematic approach', 'careful consideration', 'logical progression', 'thorough analysis'],
      personalityType: 'analytical and methodical with independent thinking',
      detailedAnalysis: 'The author exhibits a systematic, analytical personality with strong methodical tendencies. They demonstrate independent thinking patterns and approach problems with careful consideration and logical progression.'
    },
    authorityRelationship: {
      authorityOrientation: 'respectful but intellectually independent',
      powerDynamics: 'balanced approach to hierarchy and power structures',
      autonomyLevel: 'high degree of intellectual and emotional independence',
      detailedAnalysis: 'The author maintains a balanced relationship with authority figures, showing appropriate respect while maintaining intellectual independence. They appear comfortable with hierarchy but do not defer automatically to authority.'
    },
    motivationalStructure: {
      primaryDrives: ['understanding', 'accuracy', 'competence', 'systematic investigation'],
      motivationalPatterns: ['thorough analysis', 'logical progression', 'evidence-based reasoning', 'continuous learning'],
      detailedAnalysis: 'The author is primarily motivated by understanding and accuracy, with strong drives toward competence and systematic investigation. They value thorough analysis and evidence-based reasoning in their approach to problems.'
    },
    interpersonalDynamics: {
      attachmentStyle: 'secure and autonomous',
      socialOrientations: ['independent', 'collaborative', 'professional', 'respectful'],
      relationshipPatterns: ['professional boundaries', 'mutual respect', 'task-focused', 'collaborative when appropriate'],
      detailedAnalysis: 'The author demonstrates secure attachment with autonomous functioning. They maintain professional boundaries while being open to collaboration and show patterns of mutual respect in interpersonal relationships.'
    },
    strengths: ['analytical thinking', 'emotional stability', 'systematic approach', 'independent judgment', 'clear communication'],
    challenges: ['potential over-analysis', 'may appear emotionally detached', 'could benefit from more emotional expression', 'might miss subtle interpersonal nuances'],
    overallSummary: 'The author demonstrates a well-balanced psychological profile with strong analytical capabilities, emotional stability, and healthy interpersonal dynamics. Their approach is methodical and independent while maintaining professional relationships and clear communication patterns. They show signs of secure attachment and autonomous functioning with appropriate emotional regulation.'
  };
}