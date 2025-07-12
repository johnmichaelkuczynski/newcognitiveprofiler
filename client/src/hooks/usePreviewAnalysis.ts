import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AnalysisType } from "@/types/analysis";

interface PreviewAnalysisResult {
  preview: string;
  isPreview: boolean;
  provider: string;
  analysisType: AnalysisType;
  message: string;
  registrationMessage: string;
  costs: Record<string, number>;
}

export function usePreviewAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PreviewAnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeText = async (text: string, analysisType: AnalysisType = "cognitive") => {
    if (text.length < 100) {
      setError("Text must be at least 100 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await apiRequest("POST", "/api/analyze-preview", {
        text,
        analysisType,
        modelProvider: "deepseek"
      });

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to analyze text";
      setError(errorMessage);
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeFile = async (file: File, analysisType: AnalysisType = "cognitive") => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysisType", analysisType);

      const response = await fetch("/api/upload-document-preview", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to analyze document";
      setError(errorMessage);
      toast({
        title: "Document Analysis Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setData(null);
  };

  return {
    analyzeText,
    analyzeFile,
    isLoading,
    error,
    data,
    reset,
    isError: !!error
  };
}