import { useState } from "react";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Type for multi-provider analysis results
export type MultiProviderAnalysisResult = Record<ModelProvider, CognitiveAnalysisResult> & {
  originalText?: string;
  creditsUsed?: number;
  remainingCredits?: {
    zhi1: number;
    zhi2: number;
    zhi3: number;
    zhi4: number;
  };
};

type StreamingProgress = {
  zhi1: 'pending' | 'loading' | 'completed' | 'error';
  zhi2: 'pending' | 'loading' | 'completed' | 'error';
  zhi3: 'pending' | 'loading' | 'completed' | 'error';
  zhi4: 'pending' | 'loading' | 'completed' | 'error';
};

export function useCognitiveAnalysis(onCreditsUpdated?: (credits: { zhi1: number; zhi2: number; zhi3: number; zhi4: number }) => void) {
  const [data, setData] = useState<MultiProviderAnalysisResult | null>(null);
  const [streamingProgress, setStreamingProgress] = useState<StreamingProgress>({
    zhi1: 'pending',
    zhi2: 'pending',
    zhi3: 'pending',
    zhi4: 'pending'
  });

  // Mutation for analyzing text with all providers simultaneously
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await apiRequest("POST", "/api/analyze-all", { 
        text, 
        analysisType: "cognitive" 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }
      
      const result = await response.json();
      return { ...result, originalText: text };
    },
    onSuccess: (result) => {
      setData(result);
      // Update credits if provided
      if (result.remainingCredits && onCreditsUpdated) {
        onCreditsUpdated(result.remainingCredits);
      }
    },
  });

  // Mutation for analyzing files with all providers simultaneously
  const fileMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysisType', 'cognitive');
      
      const response = await fetch('/api/upload-document-all', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process document');
      }
      
      const result = await response.json();
      return result as MultiProviderAnalysisResult;
    },
    onSuccess: (result) => {
      setData(result);
      // Update credits if provided
      if (result.remainingCredits && onCreditsUpdated) {
        onCreditsUpdated(result.remainingCredits);
      }
    },
  });

  // Analyze text with all providers
  const analyzeText = (text: string) => {
    textMutation.mutate({ text });
  };

  // Analyze file with all providers
  const analyzeFile = (file: File) => {
    fileMutation.mutate({ file });
  };

  const reset = () => {
    setData(null);
    textMutation.reset();
    fileMutation.reset();
  };

  return {
    analyzeText,
    analyzeFile,
    isLoading: textMutation.isPending || fileMutation.isPending,
    isError: textMutation.isError || fileMutation.isError,
    error: textMutation.error || fileMutation.error,
    data,
    reset,
  };
}
