import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { MultiProviderComprehensivePsychologicalResult } from '@/types/analysis';

export interface UseComprehensivePsychologicalAnalysisReturn {
  analyzeText: (text: string, additionalContext?: string) => Promise<void>;
  analyzeFile: (file: File, additionalContext?: string) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: MultiProviderComprehensivePsychologicalResult | null;
  reset: () => void;
}

export function useComprehensivePsychologicalAnalysis(): UseComprehensivePsychologicalAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MultiProviderComprehensivePsychologicalResult | null>(null);

  const analyzeText = useCallback(async (text: string, additionalContext?: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      const response = await apiRequest('/api/analyze-comprehensive-psychological', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          additionalContext,
          analysisType: 'comprehensive-psychological'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze text');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeFile = useCallback(async (file: File, additionalContext?: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysisType', 'comprehensive-psychological');
      if (additionalContext) {
        formData.append('additionalContext', additionalContext);
      }

      const response = await apiRequest('/api/upload-document-comprehensive', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze file');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsError(false);
    setError(null);
    setData(null);
  }, []);

  return {
    analyzeText,
    analyzeFile,
    isLoading,
    isError,
    error,
    data,
    reset
  };
}