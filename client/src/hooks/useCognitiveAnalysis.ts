import { useState } from "react";
import { CognitiveAnalysisResult } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useCognitiveAnalysis() {
  const [data, setData] = useState<CognitiveAnalysisResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/analyze", { text });
      const result = await response.json();
      return result as CognitiveAnalysisResult;
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  const analyzeText = (text: string) => {
    mutation.mutate(text);
  };

  const reset = () => {
    setData(null);
    mutation.reset();
  };

  return {
    analyzeText,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data,
    reset,
  };
}
