import React from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface CognitiveProfileCardProps {
  result: CognitiveAnalysisResult;
  providerKey: ModelProvider;
  providerInfo: Record<string, { name: string; color: string; icon: React.ComponentType<any> }>;
  onGenerateReport?: (provider: ModelProvider) => void;
}

export default function CognitiveProfileCard({
  result,
  providerKey,
  providerInfo,
  onGenerateReport
}: CognitiveProfileCardProps) {
  // Check if the providerKey exists in providerInfo before destructuring
  if (!providerInfo[providerKey]) {
    return null; // Skip rendering if provider info isn't available
  }

  const { name, color, icon: Icon } = providerInfo[providerKey];

  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
      <div className={cn("p-4 text-white flex items-center justify-between gap-2", color)}>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h3 className="font-heading font-semibold">{name} Analysis</h3>
        </div>

        {/* Add Full Report button if handler is provided */}
        {onGenerateReport && (
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={() => onGenerateReport(providerKey)}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Full Report
          </Button>
        )}
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