import { useState } from "react";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";

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

export function useCognitiveAnalysis(onCreditsUpdated?: (credits: { zhi1: number; zhi2: number; zhi3: number; zhi4: number }) => void) {
  const [data, setData] = useState<MultiProviderAnalysisResult | null>(null);

  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await fetch('/api/analyze-all-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          text, 
          analysisType: "cognitive" 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const results: Partial<Record<ModelProvider, CognitiveAnalysisResult>> = {};
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              
              if (data.status === 'completed' && data.provider) {
                const providerMap: Record<string, ModelProvider> = {
                  'zhi1': 'deepseek',
                  'zhi2': 'openai',
                  'zhi3': 'anthropic',
                  'zhi4': 'perplexity'
                };
                const provider = providerMap[data.provider];
                results[provider] = data.result;
                
                setData({ ...results, originalText: text } as MultiProviderAnalysisResult);
              } else if (data.status === 'done') {
                if (data.updatedCredits && onCreditsUpdated) {
                  onCreditsUpdated(data.updatedCredits);
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
      return { ...results, originalText: text } as MultiProviderAnalysisResult;
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

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
      if (result.remainingCredits && onCreditsUpdated) {
        onCreditsUpdated(result.remainingCredits);
      }
    },
  });

  const analyzeText = (text: string) => {
    textMutation.mutate({ text });
  };

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
