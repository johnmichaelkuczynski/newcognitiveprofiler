import React from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { cn } from "@/lib/utils";

// Provider information for display
const providerInfo: Record<string, {
  name: string;
  color: string;
  icon: React.ComponentType<any>;
}> = {
  openai: { name: "OpenAI", color: "bg-emerald-600", icon: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg> },
  anthropic: { name: "Anthropic", color: "bg-blue-600", icon: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg> },
  perplexity: { name: "Perplexity", color: "bg-purple-600", icon: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg> }
};

interface ProviderCardProps {
  result: CognitiveAnalysisResult;
  providerKey: ModelProvider;
  onGenerateReport: (provider: ModelProvider) => void;
}

export default function ProviderCard({
  result,
  providerKey,
  onGenerateReport
}: ProviderCardProps) {
  // Check if the providerKey exists in providerInfo before destructuring
  if (!providerInfo[providerKey]) {
    return null; // Skip rendering if provider info isn't available
  }

  const { name, color, icon: Icon } = providerInfo[providerKey];

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
      <div className={cn("p-4 text-white flex items-center justify-between gap-2", color)}>
        <div className="flex items-center gap-2">
          <Icon />
          <h3 className="font-heading font-semibold">{name} Analysis</h3>
        </div>

        {/* Full Report button */}
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => onGenerateReport(providerKey)}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Full Report
        </Button>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Intelligence Score</span>
            <span className="text-primary font-semibold">{result.intelligenceScore}/100</span>
          </div>
          <Progress value={result.intelligenceScore} className="h-2" />
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-secondary-light mb-2">Cognitive Characteristics</h4>
          <div className="flex flex-wrap gap-2">
            {result.characteristics.map((characteristic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-secondary/10 rounded-full text-secondary-dark text-sm"
              >
                {characteristic}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-secondary-light mb-2">Analysis</h4>
          <p className="text-neutral-700">{result.detailedAnalysis}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-secondary-light mb-2">Cognitive Strengths</h4>
            <ul className="list-disc pl-4 space-y-1">
              {result.strengths.map((strength, index) => (
                <li key={index} className="text-neutral-700">{strength}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-secondary-light mb-2">Cognitive Tendencies</h4>
            <ul className="list-disc pl-4 space-y-1">
              {result.tendencies.map((tendency, index) => (
                <li key={index} className="text-neutral-700">{tendency}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}