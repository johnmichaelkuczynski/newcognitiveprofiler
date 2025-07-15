import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, Heart, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useComprehensivePsychologicalAnalysis } from "@/hooks/useComprehensivePsychologicalAnalysis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import DragDropUpload from "./DragDropUpload";

interface PsychologicalParameterCardProps {
  param: { name: string; description: string };
  analysis: string;
}

function PsychologicalParameterCard({ param, analysis }: PsychologicalParameterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{param.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{param.description}</p>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
              <span className="text-sm font-medium">Analysis</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{analysis}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default function ComprehensivePsychologicalProfiler() {
  const [textInput, setTextInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const { analyzeText, analyzeFile, data, isLoading, isError, error, reset } = useComprehensivePsychologicalAnalysis();

  const handleTextAnalysis = () => {
    analyzeText({ text: textInput });
  };

  const handleFileSelect = (file: File) => {
    setFileInput(file);
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'txt' || fileExt === 'text') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setTextInput(text);
      };
      reader.readAsText(file);
    } else if (fileExt === 'pdf' || fileExt === 'doc' || fileExt === 'docx') {
      analyzeFile({ file });
    }
  };

  const handleFileRemove = () => {
    setFileInput(null);
    setTextInput("");
  };

  const handleReset = () => {
    setTextInput("");
    setFileInput(null);
    reset();
  };

  const psychologicalParameters = [
    { name: "Attachment Mode", description: "Secure vs. anxious vs. avoidant vs. disorganized; predicts interpersonal stance" },
    { name: "Drive Sublimation Quotient", description: "Ability to channel raw drives into symbolic/intellectual work" },
    { name: "Validation Hunger Index", description: "Degree to which external affirmation is required for psychic stability" },
    { name: "Shame-Anger Conversion Tendency", description: "Likelihood of transmuting shame into hostility or aggression" },
    { name: "Ego Fragility", description: "Sensitivity to critique or loss of control; predicts defensiveness" },
    { name: "Affect Labeling Proficiency", description: "Accuracy in identifying one's own emotional states" },
    { name: "Implicit Emotion Model", description: "Degree to which one runs on internalized emotional schemas" },
    { name: "Projection Bias", description: "Tendency to offload inner conflict onto external targets" },
    { name: "Defensive Modality Preference", description: "Primary psychological defense type (e.g., repression, denial, rationalization)" },
    { name: "Emotional Time Lag", description: "Delay between emotional stimulus and self-aware response" },
    { name: "Distress Tolerance", description: "Capacity to function under high emotional strain" },
    { name: "Impulse Channeling Index", description: "Degree to which urges are shaped into structured output" },
    { name: "Mood Volatility", description: "Amplitude and frequency of emotional state swings" },
    { name: "Despair Threshold", description: "Point at which one shifts from struggle to collapse or apathy" },
    { name: "Self-Soothing Access", description: "Availability of effective mechanisms to calm emotional states" },
    { name: "Persona-Alignment Quotient", description: "Gap between external presentation and internal self-perception" },
    { name: "Envy Index", description: "Intensity of comparative pain from perceived inferiority" },
    { name: "Emotional Reciprocity Capacity", description: "Ability to engage empathically without detachment or flooding" },
    { name: "Narrative Self-Justification Tendency", description: "Compulsive construction of explanatory myths to protect ego ideal" },
    { name: "Symbolic Reframing Ability", description: "Capacity to convert painful material into metaphor, narrative, or philosophy" }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Heart className="h-12 w-12 text-red-600 animate-pulse" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Analyzing Comprehensive Psychological Profile</h3>
          <p className="text-sm text-gray-600">Processing all 20 psychological parameters...</p>
          <Progress value={45} className="w-64" />
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Comprehensive Psychological Profile</h2>
          <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {psychologicalParameters.map((param, index) => (
            <PsychologicalParameterCard 
              key={index} 
              param={param} 
              analysis={data[param.name.toLowerCase().replace(/\s+/g, '_')] || "Analysis pending..."}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Comprehensive Psychological Profiling</h2>
        <p className="text-gray-600">Deep analysis using 20 specialized psychological parameters</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Input Your Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text Input</Label>
            <Textarea
              id="text-input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your text here (minimum 100 characters)..."
              rows={8}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              {textInput.length} characters
            </p>
          </div>

          <DragDropUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={fileInput}
            label="Or Upload Document"
          />

          <Button 
            onClick={handleTextAnalysis}
            disabled={!textInput.trim() && !fileInput}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Analyze Psychological Profile
          </Button>
        </CardContent>
      </Card>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || "Analysis failed. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Psychological Parameters Analyzed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {psychologicalParameters.map((param, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-sm">{param.name}</p>
                  <p className="text-xs text-gray-600">{param.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}