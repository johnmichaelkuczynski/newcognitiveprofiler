import { useState } from "react";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Type for multi-provider analysis results
export type MultiProviderAnalysisResult = Record<ModelProvider, CognitiveAnalysisResult> & {
  originalText?: string; // Add original text to the result
};

export function useCognitiveAnalysis() {
  const [data, setData] = useState<MultiProviderAnalysisResult | null>(null);

  // Mutation for analyzing text with all providers simultaneously
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await apiRequest("POST", "/api/analyze-all", { text });
      const result = await response.json();
      return { ...result, originalText: text };
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  // Mutation for analyzing files with all providers simultaneously
  const fileMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
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
