import { Check, Download, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CognitiveAnalysisResult } from "@/types/analysis";
import { useState } from "react";

interface ResultsSectionProps {
  result: CognitiveAnalysisResult;
  onNewAnalysis: () => void;
}

export default function ResultsSection({ result, onNewAnalysis }: ResultsSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyResults = () => {
    const score = result.intelligenceScore;
    const analysis = result.detailedAnalysis;
    
    // Create a text representation of the results
    const resultsText = `Cognitive Profile Analysis\n\nIntelligence Score: ${score}/100\n\n${analysis.trim()}`;
    
    navigator.clipboard.writeText(resultsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadResults = () => {
    const score = result.intelligenceScore;
    const analysis = result.detailedAnalysis;
    
    // Create a text representation of the results
    const resultsText = `Cognitive Profile Analysis\n\nIntelligence Score: ${score}/100\n\n${analysis.trim()}`;
    
    // Create a blob and download link
    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cognitive-profile-analysis.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mb-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden">
        <div className="bg-secondary p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-heading font-semibold text-xl text-white">Cognitive Profile Results</h2>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white"
                onClick={copyResults}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white"
                onClick={downloadResults}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-6">
                  <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Intelligence Estimate</h3>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600">Score</span>
                      <span className="text-2xl font-bold text-primary">{result.intelligenceScore}</span>
                    </div>
                    <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${result.intelligenceScore}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-neutral-500">
                      <span>1</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Cognitive Characteristics</h3>
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <ul className="space-y-2">
                    {result.characteristics.map((characteristic, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-neutral-700">{characteristic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Detailed Cognitive Analysis</h3>
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="prose prose-sm max-w-none text-neutral-700">
                {result.detailedAnalysis.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Reasoning Style</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <h4 className="font-medium text-primary mb-2">Strengths</h4>
                <ul className="space-y-1 text-neutral-700 text-sm">
                  {result.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success mt-0.5" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <h4 className="font-medium text-primary mb-2">Cognitive Tendencies</h4>
                <ul className="space-y-1 text-neutral-700 text-sm">
                  {result.tendencies.map((tendency, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{tendency}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button 
              variant="secondary"
              onClick={onNewAnalysis}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>New Analysis</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
