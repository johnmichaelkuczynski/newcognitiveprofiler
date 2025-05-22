import React from "react";
import { Check, Download, Copy, RefreshCw, BrainCircuit, Heart, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PsychologicalAnalysisResult, ModelProvider } from "@/types/analysis";
import { MultiProviderPsychologicalResult } from "@/hooks/usePsychologicalAnalysis";
import { cn } from "@/lib/utils";

// Provider information for display
const providerInfo = {
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

function PsychologicalProfileCard({ 
  result, 
  providerKey 
}: { 
  result: PsychologicalAnalysisResult; 
  providerKey: ModelProvider;
}) {
  const { name, color, icon: Icon } = providerInfo[providerKey];
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
      <div className={cn("p-4 text-white flex items-center gap-2", color)}>
        <Icon className="h-5 w-5" />
        <h3 className="font-heading font-semibold">{name} Analysis</h3>
      </div>
      
      <div className="p-4">
        {/* Emotional Profile */}
        <div className="mb-6">
          <h4 className="font-medium text-sm text-secondary-light mb-2">Emotional Profile</h4>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-600 text-sm">Emotional Stability</span>
              <span className="text-xl font-bold text-primary">{result.emotionalProfile.emotionalStability}</span>
            </div>
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${result.emotionalProfile.emotionalStability}%` }}
              ></div>
            </div>
            
            <div className="mb-3">
              <span className="text-neutral-600 text-sm block mb-2">Primary Emotions</span>
              <div className="flex flex-wrap gap-2">
                {result.emotionalProfile.primaryEmotions.map((emotion, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-neutral-600 text-sm block mb-2">Emotional Analysis</span>
              <p className="text-neutral-700 text-sm">{result.emotionalProfile.detailedAnalysis}</p>
            </div>
          </div>
        </div>
        
        {/* Motivational Structure */}
        <div className="mb-6">
          <h4 className="font-medium text-sm text-secondary-light mb-2">Motivational Structure</h4>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="mb-3">
              <span className="text-neutral-600 text-sm block mb-2">Primary Drives</span>
              <div className="flex flex-wrap gap-2">
                {result.motivationalStructure.primaryDrives.map((drive, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs"
                  >
                    {drive}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-3">
              <span className="text-neutral-600 text-sm block mb-2">Motivational Patterns</span>
              <div className="flex flex-wrap gap-2">
                {result.motivationalStructure.motivationalPatterns.map((pattern, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-neutral-600 text-sm block mb-2">Motivational Analysis</span>
              <p className="text-neutral-700 text-sm">{result.motivationalStructure.detailedAnalysis}</p>
            </div>
          </div>
        </div>
        
        {/* Interpersonal Dynamics */}
        <div className="mb-6">
          <h4 className="font-medium text-sm text-secondary-light mb-2">Interpersonal Dynamics</h4>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="mb-3">
              <span className="text-neutral-600 text-sm block mb-2">Attachment Style</span>
              <span 
                className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs"
              >
                {result.interpersonalDynamics.attachmentStyle}
              </span>
            </div>
            
            <div className="mb-3">
              <span className="text-neutral-600 text-sm block mb-2">Social Orientations</span>
              <div className="flex flex-wrap gap-2">
                {result.interpersonalDynamics.socialOrientations.map((orientation, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs"
                  >
                    {orientation}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mb-3">
              <span className="text-neutral-600 text-sm block mb-2">Relationship Patterns</span>
              <div className="flex flex-wrap gap-2">
                {result.interpersonalDynamics.relationshipPatterns.map((pattern, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-neutral-600 text-sm block mb-2">Interpersonal Analysis</span>
              <p className="text-neutral-700 text-sm">{result.interpersonalDynamics.detailedAnalysis}</p>
            </div>
          </div>
        </div>
        
        {/* Strengths & Challenges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-medium text-sm text-secondary-light mb-2">Psychological Strengths</h4>
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 h-full">
              <ul className="list-disc pl-4 space-y-1">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="text-neutral-700 text-sm">{strength}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-secondary-light mb-2">Growth Areas</h4>
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 h-full">
              <ul className="list-disc pl-4 space-y-1">
                {result.challenges.map((challenge, index) => (
                  <li key={index} className="text-neutral-700 text-sm">{challenge}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Overall Summary */}
        <div>
          <h4 className="font-medium text-sm text-secondary-light mb-2">Overall Summary</h4>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <p className="text-neutral-700 text-sm">{result.overallSummary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PsychologicalResultsSection({ result, onNewAnalysis }: PsychologicalResultsSectionProps) {
  const providers = Object.keys(result) as ModelProvider[];
  
  // Default to the first provider tab
  const [activeProvider, setActiveProvider] = React.useState<ModelProvider>(providers[0]);

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
        defaultValue={activeProvider}
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
              {providerInfo[provider].icon && <providerInfo[provider].icon className="h-4 w-4" />}
              <span>{providerInfo[provider].name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {providers.map(provider => (
          <TabsContent key={provider} value={provider} className="mt-0">
            <PsychologicalProfileCard 
              providerKey={provider} 
              result={result[provider]} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}