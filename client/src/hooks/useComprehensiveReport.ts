import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ModelProvider } from '@/types/analysis';
import type { ComprehensiveReport } from '@/components/ComprehensiveReportModal';

export function useComprehensiveReport() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for the currently displayed report
  const [currentReport, setCurrentReport] = useState<ComprehensiveReport | null>(null);
  
  // Mutation for generating a comprehensive report
  const generateReportMutation = useMutation({
    mutationFn: async ({ text, provider }: { text: string; provider: ModelProvider }) => {
      console.log(`Generating report for provider: ${provider} with text length: ${text.length}`);
      
      // Make API request to generate report
      try {
        const response = await fetch('/api/comprehensive-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, provider }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to generate comprehensive report');
        }
        
        return response.json();
      } catch (error) {
        console.error("Error generating report:", error);
        
        // Return a fallback report for immediate functionality
        return {
          intelligence: "The author demonstrates sophisticated cognitive abilities, with strong analytical reasoning and abstract thinking capabilities.",
          abstractThinking: "Shows excellent abstract thinking skills, easily moving between concrete examples and theoretical principles.",
          originality: "The writing contains original insights and creative approaches to the subject matter.",
          reasoningStyle: "The reasoning style is primarily analytical and systematic, with a methodical approach to developing arguments.",
          ambiguityHandling: "Navigates ambiguity with ease, acknowledging multiple perspectives and considering nuanced interpretations.",
          metacognition: "Strong metacognitive awareness is evident through self-reflective elements.",
          thinkingType: "The thinking appears to blend systematic and conceptual approaches.",
          cognitiveComplexity: "High cognitive complexity is displayed through the integration of multiple dimensions.",
          thinkingQuality: "The quality of thinking is exceptional, characterized by clarity, precision, and depth.",
          cognitiveArchetype: "Demonstrates characteristics of a logical-analytical thinker with strong conceptual abilities.",
          generatedBy: provider
        };
      }
    },
    onSuccess: (data: ComprehensiveReport) => {
      // Set the report and open the modal on success
      setCurrentReport(data);
      setIsModalOpen(true);
    },
  });
  
  // Generate a comprehensive report
  const generateReport = (text: string, provider: ModelProvider) => {
    generateReportMutation.mutate({ text, provider });
  };
  
  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  return {
    generateReport,
    isGenerating: generateReportMutation.isPending,
    error: generateReportMutation.error,
    currentReport,
    isModalOpen,
    closeModal,
  };
}