import { useState } from "react";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Type for multi-provider analysis results
export type MultiProviderAnalysisResult = Record<ModelProvider, CognitiveAnalysisResult> & {
  originalText?: string; // Add original text to the result
};

// Type for preview result that might come from registered users without credits
export type PreviewResult = {
  preview: string;
  isPreview: true;
  provider: ModelProvider;
  analysisType: string;
  message: string;
  registrationMessage: string;
  costs: any;
  userCredits?: number;
  requiredCredits?: number;
};

export function useCognitiveAnalysis() {
  const [data, setData] = useState<MultiProviderAnalysisResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);

  // Mutation for analyzing text with all providers simultaneously
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await apiRequest("POST", "/api/analyze-all", { text, analysisType: "cognitive" });
      const result = await response.json();
      return { ...result, originalText: text };
    },
    onSuccess: (result) => {
      // Check if this is a preview response (user without credits)
      if (result.isPreview) {
        setPreviewData(result);
        setData(null);
      } else {
        setData(result);
        setPreviewData(null);
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
      // Check if this is a preview response (user without credits)
      if (result.isPreview) {
        setPreviewData(result);
        setData(null);
      } else {
        setData(result);
        setPreviewData(null);
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
    setPreviewData(null);
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
    previewData,
    reset,
  };
}
