import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Quote, Brain, MessageCircle, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CognitiveParameter {
  id: number;
  name: string;
  description: string;
  analysis: string;
  quotations: string[];
  reasoning: string;
  score: number;
}

interface ComprehensiveCognitiveResult {
  parameters: CognitiveParameter[];
  overallAssessment: string;
  keyInsights: string[];
}

interface ComprehensiveCognitiveProfilerProps {
  text: string;
  onAnalyze: (text: string, additionalInfo?: string) => Promise<ComprehensiveCognitiveResult>;
  isLoading?: boolean;
}

const COGNITIVE_PARAMETERS = [
  { id: 1, name: "Compression Tolerance", description: "Degree to which the person seeks dense, abstract representations over surface details." },
  { id: 2, name: "Inferential Depth", description: "How far ahead a person naturally projects in causal/logical chains before committing to conclusions." },
  { id: 3, name: "Semantic Curvature", description: "Tendency to cross conceptual boundaries and reframe terms in adjacent but non-isomorphic domains." },
  { id: 4, name: "Cognitive Load Bandwidth", description: "Number of variables or active threads someone can sustain in parallel before system degradation." },
  { id: 5, name: "Epistemic Risk Tolerance", description: "Willingness to entertain unstable or fringe hypotheses when the payoff is deeper insight." },
  { id: 6, name: "Narrative vs. Structural Bias", description: "Preference for anecdotal/story-based cognition vs. pattern/system-based models." },
  { id: 7, name: "Heuristic Anchoring Bias", description: "How often first-pass intuitions dominate downstream reasoning." },
  { id: 8, name: "Self-Compression Quotient", description: "Degree to which a person can summarize their own thought system into coherent abstract modules." },
  { id: 9, name: "Recursion Depth on Self", description: "Number of layers deep a person tracks their own cognitive operations or psychological motives." },
  { id: 10, name: "Reconceptualization Rate", description: "Speed and frequency with which one reforms or discards major conceptual categories." },
  { id: 11, name: "Dominance Framing Bias", description: "Default positioning of oneself in terms of social, intellectual, or epistemic superiority/inferiority." },
  { id: 12, name: "Validation Source Gradient", description: "Internal vs. external motivation for cognitive output." },
  { id: 13, name: "Dialectical Agonism", description: "Ability to build arguments that strengthen the opposing view, even while refuting it." },
  { id: 14, name: "Modality Preference", description: "Abstract-verbal vs. visual-spatial vs. kinetic-emotional thinking bias." },
  { id: 15, name: "Schema Flexibility", description: "Ease of updating or discarding core frameworks in light of contradictory evidence." },
  { id: 16, name: "Proceduralism Threshold", description: "Degree to which one respects systems, protocols, or legalistic steps vs. valuing results." },
  { id: 17, name: "Predictive Modeling Index", description: "Preference for models that maximize forecasting power over coherence." },
  { id: 18, name: "Social System Complexity Model", description: "Granularity of one's working model of institutions, networks, reputations." },
  { id: 19, name: "Mythology Bias", description: "Degree to which narrative/mythic structures override or inform analytic judgment." },
  { id: 20, name: "Asymmetry Detection Quotient", description: "Sensitivity to unspoken structural asymmetries in systems or conversations." }
];

export default function ComprehensiveCognitiveProfiler({ text, onAnalyze, isLoading = false }: ComprehensiveCognitiveProfilerProps) {
  const [result, setResult] = useState<ComprehensiveCognitiveResult | null>(null);
  const [expandedParameters, setExpandedParameters] = useState<Set<number>>(new Set());
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userFeedback, setUserFeedback] = useState("");
  const [isDialogueMode, setIsDialogueMode] = useState(false);

  const handleAnalyze = async () => {
    try {
      const analysisResult = await onAnalyze(text, additionalInfo);
      setResult(analysisResult);
      setDialogOpen(false);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const toggleParameter = (parameterId: number) => {
    const newExpanded = new Set(expandedParameters);
    if (newExpanded.has(parameterId)) {
      newExpanded.delete(parameterId);
    } else {
      newExpanded.add(parameterId);
    }
    setExpandedParameters(newExpanded);
  };

  const handleDialogue = async () => {
    if (!userFeedback.trim()) return;
    
    setIsDialogueMode(true);
    try {
      const updatedResult = await onAnalyze(text, `User feedback: ${userFeedback}\n\nOriginal additional info: ${additionalInfo}`);
      setResult(updatedResult);
      setUserFeedback("");
    } catch (error) {
      console.error('Dialogue update failed:', error);
    } finally {
      setIsDialogueMode(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  if (!text || text.length < 100) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Please provide text (minimum 100 characters) to begin comprehensive cognitive analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Comprehensive Cognitive Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Context (Optional)
              </label>
              <Textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Provide any additional information that might be relevant for the cognitive analysis..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Run Cognitive Analysis
                  </>
                )}
              </Button>
              
              {result && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Dialogue & Refine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Dialogue with Analysis</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        value={userFeedback}
                        onChange={(e) => setUserFeedback(e.target.value)}
                        placeholder="Share your thoughts, corrections, or additional context to refine the analysis..."
                        className="min-h-[120px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleDialogue} 
                          disabled={isDialogueMode || !userFeedback.trim()}
                          className="flex items-center gap-2"
                        >
                          {isDialogueMode ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Update Analysis
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <div className="space-y-4">
          {/* Overall Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Cognitive Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{result.overallAssessment}</p>
              <div className="space-y-2">
                <h4 className="font-medium">Key Insights:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {result.keyInsights.map((insight, index) => (
                    <li key={index} className="text-gray-600">{insight}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Parameter Analysis */}
          <div className="grid gap-4">
            {result.parameters.map((param) => (
              <Card key={param.id}>
                <Collapsible>
                  <CollapsibleTrigger
                    className="w-full"
                    onClick={() => toggleParameter(param.id)}
                  >
                    <CardHeader className="hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getScoreColor(param.score)}`} />
                          <div className="text-left">
                            <CardTitle className="text-lg">{param.name}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{param.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{param.score}/10</Badge>
                          {expandedParameters.has(param.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Analysis:</h4>
                          <p className="text-gray-700">{param.analysis}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Supporting Evidence:</h4>
                          <div className="space-y-2">
                            {param.quotations.map((quote, index) => (
                              <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                                <Quote className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-700 italic">"{quote}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Reasoning:</h4>
                          <p className="text-gray-700">{param.reasoning}</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}