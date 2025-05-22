import React from "react";
import { RefreshCw, Heart, BrainCircuit, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PsychologicalAnalysisResult, ModelProvider } from "@/types/analysis";
import { MultiProviderPsychologicalResult } from "@/hooks/usePsychologicalAnalysis";
import { cn } from "@/lib/utils";

// Provider information for display
const providerInfo: Record<string, {
  name: string;
  color: string;
  icon: React.ComponentType<any>;
}> = {
  openai: {
    name: "OpenAI",
    color: "bg-emerald-600",
    icon: BrainCircuit
  },
  anthropic: {
    name: "Anthropic",
    color: "bg-purple-600",
    icon: Users
  },
  perplexity: {
    name: "Perplexity",
    color: "bg-blue-600",
    icon: Lightbulb
  }
};

interface PsychologicalResultsSectionProps {
  result: MultiProviderPsychologicalResult;
  onNewAnalysis: () => void;
}

export default function PsychologicalResultsSection({ result, onNewAnalysis }: PsychologicalResultsSectionProps) {
  const providers = Object.keys(result) as ModelProvider[];
  
  // Default to the first provider tab
  const [activeProvider, setActiveProvider] = React.useState<ModelProvider>(providers[0] || "openai");

  return (
    <div className="my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-semibold text-secondary flex items-center">
          <Heart className="mr-2 h-6 w-6 text-primary" />
          Psychological Profile
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNewAnalysis}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>New Analysis</span>
        </Button>
      </div>
      
      <Tabs 
        defaultValue={providers[0]}
        onValueChange={(value) => setActiveProvider(value as ModelProvider)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          {providers.map(provider => (
            <TabsTrigger 
              key={provider} 
              value={provider}
              className="flex items-center gap-1.5"
            >
              {React.createElement(providerInfo[provider].icon, { className: "h-4 w-4" })}
              <span>{providerInfo[provider].name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {providers.map(provider => (
          <TabsContent key={provider} value={provider} className="mt-0">
            <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
              <div className={cn("p-4 text-white flex items-center gap-2", providerInfo[provider].color)}>
                {React.createElement(providerInfo[provider].icon, { className: "h-5 w-5" })}
                <h3 className="font-heading font-semibold">{providerInfo[provider].name} Analysis</h3>
              </div>
              
              <div className="p-6">
                {/* Emotional Profile */}
                <div className="mb-6">
                  <h4 className="font-medium text-lg text-secondary-light mb-3">Emotional Profile</h4>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Emotional Stability</span>
                      <span className="text-xl font-bold text-primary">{result[provider].emotionalProfile.emotionalStability}</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${result[provider].emotionalProfile.emotionalStability}%` }}
                      ></div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-neutral-600 text-sm block mb-2">Primary Emotions</span>
                      <div className="flex flex-wrap gap-2">
                        {result[provider].emotionalProfile.primaryEmotions.map((emotion, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-neutral-600 text-sm font-medium block mb-2">Analysis</span>
                      <p className="text-neutral-700">{result[provider].emotionalProfile.detailedAnalysis}</p>
                    </div>
                  </div>
                </div>
                
                {/* Motivational Structure */}
                <div className="mb-6">
                  <h4 className="font-medium text-lg text-secondary-light mb-3">Motivational Structure</h4>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <div className="mb-4">
                      <span className="text-neutral-600 text-sm block mb-2">Primary Drives</span>
                      <div className="flex flex-wrap gap-2">
                        {result[provider].motivationalStructure.primaryDrives.map((drive, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                          >
                            {drive}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-neutral-600 text-sm block mb-2">Motivational Patterns</span>
                      <div className="flex flex-wrap gap-2">
                        {result[provider].motivationalStructure.motivationalPatterns.map((pattern, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-neutral-600 text-sm font-medium block mb-2">Analysis</span>
                      <p className="text-neutral-700">{result[provider].motivationalStructure.detailedAnalysis}</p>
                    </div>
                  </div>
                </div>
                
                {/* Interpersonal Dynamics */}
                <div className="mb-6">
                  <h4 className="font-medium text-lg text-secondary-light mb-3">Interpersonal Dynamics</h4>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <div className="mb-4">
                      <span className="text-neutral-600 text-sm block mb-2">Attachment Style</span>
                      <span 
                        className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                      >
                        {result[provider].interpersonalDynamics.attachmentStyle}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-neutral-600 text-sm block mb-2">Social Orientations</span>
                      <div className="flex flex-wrap gap-2">
                        {result[provider].interpersonalDynamics.socialOrientations.map((orientation, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                          >
                            {orientation}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-neutral-600 text-sm block mb-2">Relationship Patterns</span>
                      <div className="flex flex-wrap gap-2">
                        {result[provider].interpersonalDynamics.relationshipPatterns.map((pattern, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-neutral-600 text-sm font-medium block mb-2">Analysis</span>
                      <p className="text-neutral-700">{result[provider].interpersonalDynamics.detailedAnalysis}</p>
                    </div>
                  </div>
                </div>
                
                {/* Strengths & Challenges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-medium text-lg text-secondary-light mb-3">Psychological Strengths</h4>
                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 h-full">
                      <ul className="list-disc pl-4 space-y-1">
                        {result[provider].strengths.map((strength, index) => (
                          <li key={index} className="text-neutral-700">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-lg text-secondary-light mb-3">Growth Areas</h4>
                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 h-full">
                      <ul className="list-disc pl-4 space-y-1">
                        {result[provider].challenges.map((challenge, index) => (
                          <li key={index} className="text-neutral-700">{challenge}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Overall Summary */}
                <div>
                  <h4 className="font-medium text-lg text-secondary-light mb-3">Overall Summary</h4>
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <p className="text-neutral-700">{result[provider].overallSummary}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}