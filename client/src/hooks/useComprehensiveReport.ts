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
      // Make API request to generate report
      const response = await fetch('/api/comprehensive-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, provider }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate comprehensive report');
      }
      
      return response.json();
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