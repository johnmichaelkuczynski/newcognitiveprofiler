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

export function useCognitiveAnalysis(onCreditsUpdated?: (credits: { zhi1: number; zhi2: number; zhi3: number; zhi4: number }) => void) {
  const [data, setData] = useState<MultiProviderAnalysisResult | null>(null);
  const [streamingProgress, setStreamingProgress] = useState<Record<string, 'loading' | 'completed' | 'error'>>({
    zhi1: 'loading',
    zhi2: 'loading',
    zhi3: 'loading',
    zhi4: 'loading'
  });

  // Mutation for analyzing text with all providers using streaming
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      return new Promise<MultiProviderAnalysisResult>((resolve, reject) => {
        const results: Partial<Record<ModelProvider, CognitiveAnalysisResult>> = {};
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
          body: JSON.stringify({ text, analysisType: 'cognitive' }),
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
                    setData({ ...results, originalText: text } as MultiProviderAnalysisResult);
                  } else if (data.status === 'error' && data.provider) {
                    console.error(`Error from ${data.provider}:`, data.error);
                    setStreamingProgress(prev => ({ ...prev, [data.provider]: 'error' }));
                  } else if (data.status === 'done') {
                    updatedCredits = data.updatedCredits;
                    resolve({ ...results, originalText: text, remainingCredits: updatedCredits } as MultiProviderAnalysisResult);
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
    streamingProgress,
  };
}
