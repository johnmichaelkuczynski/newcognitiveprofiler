import { useState } from "react";
import { PsychologicalAnalysisResult, ModelProvider } from "@/types/analysis";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Type for multi-provider analysis results
export type MultiProviderPsychologicalResult = Record<ModelProvider, PsychologicalAnalysisResult> & {
  originalText?: string;
  creditsUsed?: number;
  remainingCredits?: {
    zhi1: number;
    zhi2: number;
    zhi3: number;
    zhi4: number;
  };
};

export function usePsychologicalAnalysis(onCreditsUpdated?: (credits: { zhi1: number; zhi2: number; zhi3: number; zhi4: number }) => void) {
  const [data, setData] = useState<MultiProviderPsychologicalResult | null>(null);
  const [streamingProgress, setStreamingProgress] = useState<Record<string, 'loading' | 'completed' | 'error'>>({
    zhi1: 'loading',
    zhi2: 'loading',
    zhi3: 'loading',
    zhi4: 'loading'
  });

  // Mutation for analyzing text with all providers using streaming
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      return new Promise<MultiProviderPsychologicalResult>((resolve, reject) => {
        const results: Partial<Record<ModelProvider, PsychologicalAnalysisResult>> = {};
        let updatedCredits: any = null;
        
        // Reset streaming progress
        setStreamingProgress({
          zhi1: 'loading',
          zhi2: 'loading',
          zhi3: 'loading',
          zhi4: 'loading'
        });
        
        // Create a fetch request for SSE
        fetch('/api/analyze-all-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, analysisType: 'psychological' }),
          credentials: 'include',
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            reject(new Error(errorData.message || 'Analysis failed'));
            return;
          }
          
          if (!response.body) {
            reject(new Error('No response body'));
            return;
          }
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          
          const processText = async () => {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.status === 'completed' && data.provider && data.result) {
                    // Map provider names back to API names
                    const providerMap: Record<string, ModelProvider> = {
                      'zhi1': 'deepseek',
                      'zhi2': 'openai',
                      'zhi3': 'anthropic',
                      'zhi4': 'perplexity'
                    };
                    const providerKey = providerMap[data.provider];
                    results[providerKey] = data.result;
                    
                    // Update progress
                    setStreamingProgress(prev => ({ ...prev, [data.provider]: 'completed' }));
                    
                    // Update data incrementally
                    setData({ ...results, originalText: text } as MultiProviderPsychologicalResult);
                  } else if (data.status === 'error' && data.provider) {
                    console.error(`Error from ${data.provider}:`, data.error);
                    setStreamingProgress(prev => ({ ...prev, [data.provider]: 'error' }));
                  } else if (data.status === 'done') {
                    updatedCredits = data.updatedCredits;
                    resolve({ ...results, originalText: text, remainingCredits: updatedCredits } as MultiProviderPsychologicalResult);
                  }
                }
              }
            }
          };
          
          await processText();
        }).catch(reject);
      });
    },
    onSuccess: (result) => {
      setData(result);
      // Update credits if provided
      if (result.remainingCredits && onCreditsUpdated) {
        onCreditsUpdated(result.remainingCredits);
      }
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
      // Update credits if provided
      if (result.remainingCredits && onCreditsUpdated) {
        onCreditsUpdated(result.remainingCredits);
      }
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
    streamingProgress,
  };
}