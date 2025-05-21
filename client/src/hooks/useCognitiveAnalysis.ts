import { useState } from "react";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCognitiveAnalysis() {
  const [data, setData] = useState<CognitiveAnalysisResult | null>(null);

  const textMutation = useMutation({
    mutationFn: async ({ text, modelProvider }: { text: string; modelProvider: ModelProvider }) => {
      const response = await apiRequest("POST", "/api/analyze", { text, modelProvider });
      const result = await response.json();
      return result as CognitiveAnalysisResult;
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  const fileMutation = useMutation({
    mutationFn: async ({ file, modelProvider }: { file: File; modelProvider: ModelProvider }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelProvider', modelProvider);
      
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process document');
      }
      
      const result = await response.json();
      return result as CognitiveAnalysisResult;
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  const analyzeText = (text: string, modelProvider: ModelProvider = "openai") => {
    textMutation.mutate({ text, modelProvider });
  };

  const analyzeFile = (file: File, modelProvider: ModelProvider = "openai") => {
    fileMutation.mutate({ file, modelProvider });
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
