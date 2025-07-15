import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ComprehensiveCognitiveProfile {
  compression_tolerance: string;
  inferential_depth: string;
  semantic_curvature: string;
  cognitive_load_bandwidth: string;
  epistemic_risk_tolerance: string;
  narrative_vs_structural_bias: string;
  heuristic_anchoring_bias: string;
  self_compression_quotient: string;
  recursion_depth_on_self: string;
  reconceptualization_rate: string;
  dominance_framing_bias: string;
  validation_source_gradient: string;
  dialectical_agonism: string;
  modality_preference: string;
  schema_flexibility: string;
  proceduralism_threshold: string;
  predictive_modeling_index: string;
  social_system_complexity_model: string;
  mythology_bias: string;
  asymmetry_detection_quotient: string;
  [key: string]: string;
}

export function useComprehensiveCognitiveAnalysis() {
  const [data, setData] = useState<ComprehensiveCognitiveProfile | null>(null);

  // Mutation for analyzing text
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await apiRequest("POST", "/api/comprehensive-cognitive-analysis", { text });
      const result = await response.json();
      return result as ComprehensiveCognitiveProfile;
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  // Mutation for analyzing files
  const fileMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/comprehensive-cognitive-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process document');
      }
      
      const result = await response.json();
      return result as ComprehensiveCognitiveProfile;
    },
    onSuccess: (result) => {
      setData(result);
    },
  });

  const reset = () => {
    setData(null);
    textMutation.reset();
    fileMutation.reset();
  };

  return {
    analyzeText: ({ text }: { text: string }) => textMutation.mutate({ text }),
    analyzeFile: ({ file }: { file: File }) => fileMutation.mutate({ file }),
    data,
    isLoading: textMutation.isPending || fileMutation.isPending,
    isError: textMutation.isError || fileMutation.isError,
    error: textMutation.error || fileMutation.error,
    reset,
  };
}