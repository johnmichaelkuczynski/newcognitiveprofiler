import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Brain, RotateCcw } from "lucide-react";
import { useComprehensiveCognitiveAnalysis } from "@/hooks/useComprehensiveCognitiveAnalysis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ComprehensiveCognitiveProfiler() {
  const [textInput, setTextInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const { analyzeText, analyzeFile, data, isLoading, isError, error, reset } = useComprehensiveCognitiveAnalysis();

  const handleTextAnalysis = () => {
    if (textInput.trim().length < 100) {
      return;
    }
    analyzeText({ text: textInput });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleReset = () => {
    setTextInput("");
    setFileInput(null);
    reset();
  };

  const cognitiveParameters = [
    { name: "Compression Tolerance", description: "Degree to which the person seeks dense, abstract representations over surface details" },
    { name: "Inferential Depth", description: "How far ahead a person naturally projects in causal/logical chains before committing to conclusions" },
    { name: "Semantic Curvature", description: "Tendency to cross conceptual boundaries and reframe terms in adjacent but non-isomorphic domains" },
    { name: "Cognitive Load Bandwidth", description: "Number of variables or active threads someone can sustain in parallel before system degradation" },
    { name: "Epistemic Risk Tolerance", description: "Willingness to entertain unstable or fringe hypotheses when the payoff is deeper insight" },
    { name: "Narrative vs. Structural Bias", description: "Preference for anecdotal/story-based cognition vs. pattern/system-based models" },
    { name: "Heuristic Anchoring Bias", description: "How often first-pass intuitions dominate downstream reasoning" },
    { name: "Self-Compression Quotient", description: "Degree to which a person can summarize their own thought system into coherent abstract modules" },
    { name: "Recursion Depth on Self", description: "Number of layers deep a person tracks their own cognitive operations or psychological motives" },
    { name: "Reconceptualization Rate", description: "Speed and frequency with which one reforms or discards major conceptual categories" },
    { name: "Dominance Framing Bias", description: "Default positioning of oneself in terms of social, intellectual, or epistemic superiority/inferiority" },
    { name: "Validation Source Gradient", description: "Internal vs. external motivation for cognitive output" },
    { name: "Dialectical Agonism", description: "Ability to build arguments that strengthen the opposing view, even while refuting it" },
    { name: "Modality Preference", description: "Abstract-verbal vs. visual-spatial vs. kinetic-emotional thinking bias" },
    { name: "Schema Flexibility", description: "Ease of updating or discarding core frameworks in light of contradictory evidence" },
    { name: "Proceduralism Threshold", description: "Degree to which one respects systems, protocols, or legalistic steps vs. valuing results" },
    { name: "Predictive Modeling Index", description: "Preference for models that maximize forecasting power over coherence" },
    { name: "Social System Complexity Model", description: "Granularity of one's working model of institutions, networks, reputations" },
    { name: "Mythology Bias", description: "Degree to which narrative/mythic structures override or inform analytic judgment" },
    { name: "Asymmetry Detection Quotient", description: "Sensitivity to unspoken structural asymmetries in systems or conversations" }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Brain className="h-12 w-12 text-blue-600 animate-pulse" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Analyzing Comprehensive Cognitive Profile</h3>
          <p className="text-sm text-gray-600">Processing all 20 cognitive parameters...</p>
          <Progress value={45} className="w-64" />
        </div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Comprehensive Cognitive Profile</h2>
          <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cognitiveParameters.map((param, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{param.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{param.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Analysis:</p>
                  <p className="text-sm mt-1">{data[param.name.toLowerCase().replace(/\s+/g, '_')] || "Analysis pending..."}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Comprehensive Cognitive Profiling</h2>
        <p className="text-gray-600">Deep analysis using 20 specialized cognitive parameters</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
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
              {textInput.length}/100 characters minimum
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="file-input">Or Upload Document</Label>
              <Input
                id="file-input"
                type="file"
                accept=".txt,.doc,.docx,.pdf"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            {fileInput && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                {fileInput.name}
              </div>
            )}
          </div>

          <Button 
            onClick={handleTextAnalysis}
            disabled={textInput.length < 100 && !fileInput}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Analyze Cognitive Profile
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
          <CardTitle>Cognitive Parameters Analyzed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cognitiveParameters.map((param, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
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