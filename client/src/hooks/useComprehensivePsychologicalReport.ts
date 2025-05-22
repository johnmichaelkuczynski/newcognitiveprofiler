import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ModelProvider } from '@/types/analysis';
import type { ComprehensivePsychologicalReport } from '@/components/ComprehensivePsychologicalReportModal';

export function useComprehensivePsychologicalReport() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for the currently displayed report
  const [currentReport, setCurrentReport] = useState<ComprehensivePsychologicalReport | null>(null);
  
  // Mutation for generating a comprehensive psychological report
  const generateReportMutation = useMutation({
    mutationFn: async ({ text, provider }: { text: string; provider: ModelProvider }) => {
      // Make API request to generate psychological report
      const response = await fetch('/api/comprehensive-psychological-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, provider }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate comprehensive psychological report');
      }
      
      return response.json() as Promise<ComprehensivePsychologicalReport>;
    },
    onSuccess: (data) => {
      // Set the report and open the modal on success
      setCurrentReport(data);
      setIsModalOpen(true);
    },
  });
  
  // Generate a comprehensive psychological report
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