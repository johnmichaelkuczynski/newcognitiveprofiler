import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ComprehensivePsychologicalProfile {
  attachment_mode: string;
  drive_sublimation_quotient: string;
  validation_hunger_index: string;
  shame_anger_conversion_tendency: string;
  ego_fragility: string;
  affect_labeling_proficiency: string;
  implicit_emotion_model: string;
  projection_bias: string;
  defensive_modality_preference: string;
  emotional_time_lag: string;
  distress_tolerance: string;
  impulse_channeling_index: string;
  mood_volatility: string;
  despair_threshold: string;
  self_soothing_access: string;
  persona_alignment_quotient: string;
  envy_index: string;
  emotional_reciprocity_capacity: string;
  narrative_self_justification_tendency: string;
  symbolic_reframing_ability: string;
  [key: string]: string;
}

export function useComprehensivePsychologicalAnalysis() {
  const [data, setData] = useState<ComprehensivePsychologicalProfile | null>(null);

  // Mutation for analyzing text
  const textMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const response = await apiRequest("POST", "/api/comprehensive-psychological-analysis", { text });
      const result = await response.json();
      return result as ComprehensivePsychologicalProfile;
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
      
      const response = await fetch('/api/comprehensive-psychological-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process document');
      }
      
      const result = await response.json();
      return result as ComprehensivePsychologicalProfile;
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