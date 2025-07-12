import { CognitiveAnalysisResult, PsychologicalAnalysisResult, MultiProviderAnalysisResult, MultiProviderPsychologicalResult } from "@/types/analysis";

export const PREVIEW_SUFFIX = "\n\nThis is a real preview. Register to unlock full access.";

export function truncateForPreview(text: string, maxWords: number = 200): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}

export function createPreviewCognitiveResult(result: CognitiveAnalysisResult): CognitiveAnalysisResult {
  return {
    ...result,
    detailedAnalysis: truncateForPreview(result.detailedAnalysis) + PREVIEW_SUFFIX,
    characteristics: result.characteristics.slice(0, 2), // Limit to 2 characteristics
    strengths: result.strengths.slice(0, 2), // Limit to 2 strengths
    tendencies: result.tendencies.slice(0, 2), // Limit to 2 tendencies
  };
}

export function createPreviewPsychologicalResult(result: PsychologicalAnalysisResult): PsychologicalAnalysisResult {
  return {
    ...result,
    emotionalProfile: result.emotionalProfile ? {
      ...result.emotionalProfile,
      detailedAnalysis: truncateForPreview(result.emotionalProfile.detailedAnalysis) + PREVIEW_SUFFIX,
      primaryEmotions: result.emotionalProfile.primaryEmotions?.slice(0, 2) || [],
    } : undefined,
    motivationalStructure: result.motivationalStructure ? {
      ...result.motivationalStructure,
      detailedAnalysis: truncateForPreview(result.motivationalStructure.detailedAnalysis) + PREVIEW_SUFFIX,
      primaryDrives: result.motivationalStructure.primaryDrives?.slice(0, 2) || [],
      motivationalPatterns: result.motivationalStructure.motivationalPatterns?.slice(0, 2) || [],
    } : undefined,
    interpersonalDynamics: result.interpersonalDynamics ? {
      ...result.interpersonalDynamics,
      detailedAnalysis: truncateForPreview(result.interpersonalDynamics.detailedAnalysis) + PREVIEW_SUFFIX,
      socialOrientations: result.interpersonalDynamics.socialOrientations?.slice(0, 2) || [],
      relationshipPatterns: result.interpersonalDynamics.relationshipPatterns?.slice(0, 2) || [],
    } : undefined,
    strengths: result.strengths?.slice(0, 2) || [],
    challenges: result.challenges?.slice(0, 2) || [],
    overallSummary: result.overallSummary ? truncateForPreview(result.overallSummary) + PREVIEW_SUFFIX : undefined,
  };
}

export function createPreviewMultiProviderResult(result: MultiProviderAnalysisResult): MultiProviderAnalysisResult {
  const previewResult: MultiProviderAnalysisResult = {
    originalText: result.originalText,
  };

  // Create previews for each provider
  Object.keys(result).forEach(key => {
    if (key !== 'originalText') {
      const providerResult = result[key as keyof MultiProviderAnalysisResult];
      if (providerResult && typeof providerResult === 'object') {
        previewResult[key as keyof MultiProviderAnalysisResult] = createPreviewCognitiveResult(providerResult as CognitiveAnalysisResult);
      }
    }
  });

  return previewResult;
}

export function createPreviewMultiProviderPsychologicalResult(result: MultiProviderPsychologicalResult): MultiProviderPsychologicalResult {
  const previewResult: MultiProviderPsychologicalResult = {
    originalText: result.originalText,
  };

  // Create previews for each provider
  Object.keys(result).forEach(key => {
    if (key !== 'originalText') {
      const providerResult = result[key as keyof MultiProviderPsychologicalResult];
      if (providerResult && typeof providerResult === 'object') {
        previewResult[key as keyof MultiProviderPsychologicalResult] = createPreviewPsychologicalResult(providerResult as PsychologicalAnalysisResult);
      }
    }
  });

  return previewResult;
}