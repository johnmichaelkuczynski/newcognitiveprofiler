import { useState } from "react";
import { PsychologicalAnalysisResult, ModelProvider } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Type for multi-provider analysis results
export type MultiProviderPsychologicalResult = Record<ModelProvider, PsychologicalAnalysisResult> & {
  originalText?: string; // Add original text to the result
};

export function usePsychologicalAnalysis() {
  const [data, setData] = useState<MultiProviderPsychologicalResult | null>(null);

  // Mutation for analyzing text with all providers simultaneously
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await apiRequest("POST", "/api/analyze-all", { 
        text, 
        analysisType: "psychological" 
      });
      const result = await response.json();
      return { ...result, originalText: text };
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  // Mutation for analyzing files
  const fileMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysisType", "psychological");

      const response = await fetch("/api/upload-document-all", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze document");
      }

      const result = await response.json();
      return result as MultiProviderPsychologicalResult;
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  // Function to analyze a text sample
  const analyzeText = (text: string) => {
    textMutation.mutate({ text });
  };

  // Function to analyze a file
  const analyzeFile = (file: File) => {
    fileMutation.mutate({ file });
  };

  // Function to reset the state
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