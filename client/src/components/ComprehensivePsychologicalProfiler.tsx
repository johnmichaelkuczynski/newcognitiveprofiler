import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Quote, Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PsychologicalParameter {
  id: number;
  name: string;
  description: string;
  analysis: string;
  quotations: string[];
  reasoning: string;
  score: number;
}

interface ComprehensivePsychologicalResult {
  parameters: PsychologicalParameter[];
  overallAssessment: string;
  keyInsights: string[];
  riskFactors: string[];
  strengths: string[];
}

interface ComprehensivePsychologicalProfilerProps {
  text: string;
  onAnalyze: (text: string, additionalInfo?: string) => Promise<ComprehensivePsychologicalResult>;
  isLoading?: boolean;
}

const PSYCHOLOGICAL_PARAMETERS = [
  { id: 1, name: "Attachment Mode", description: "Secure vs. anxious vs. avoidant vs. disorganized; predicts interpersonal stance." },
  { id: 2, name: "Drive Sublimation Quotient", description: "Ability to channel raw drives into symbolic/intellectual work." },
  { id: 3, name: "Validation Hunger Index", description: "Degree to which external affirmation is required for psychic stability." },
  { id: 4, name: "Shame-Anger Conversion Tendency", description: "Likelihood of transmuting shame into hostility or aggression." },
  { id: 5, name: "Ego Fragility", description: "Sensitivity to critique or loss of control; predicts defensiveness." },
  { id: 6, name: "Affect Labeling Proficiency", description: "Accuracy in identifying one's own emotional states." },
  { id: 7, name: "Implicit Emotion Model", description: "Degree to which one runs on internalized emotional schemas." },
  { id: 8, name: "Projection Bias", description: "Tendency to offload inner conflict onto external targets." },
  { id: 9, name: "Defensive Modality Preference", description: "Primary psychological defense type (e.g., repression, denial, rationalization)." },
  { id: 10, name: "Emotional Time Lag", description: "Delay between emotional stimulus and self-aware response." },
  { id: 11, name: "Distress Tolerance", description: "Capacity to function under high emotional strain." },
  { id: 12, name: "Impulse Channeling Index", description: "Degree to which urges are shaped into structured output." },
  { id: 13, name: "Mood Volatility", description: "Amplitude and frequency of emotional state swings." },
  { id: 14, name: "Despair Threshold", description: "Point at which one shifts from struggle to collapse or apathy." },
  { id: 15, name: "Self-Soothing Access", description: "Availability of effective mechanisms to calm emotional states." },
  { id: 16, name: "Persona-Alignment Quotient", description: "Gap between external presentation and internal self-perception." },
  { id: 17, name: "Envy Index", description: "Intensity of comparative pain from perceived inferiority." },
  { id: 18, name: "Emotional Reciprocity Capacity", description: "Ability to engage empathically without detachment or flooding." },
  { id: 19, name: "Narrative Self-Justification Tendency", description: "Compulsive construction of explanatory myths to protect ego ideal." },
  { id: 20, name: "Symbolic Reframing Ability", description: "Capacity to convert painful material into metaphor, narrative, or philosophy." }
];

export default function ComprehensivePsychologicalProfiler({ text, onAnalyze, isLoading = false }: ComprehensivePsychologicalProfilerProps) {
  const [result, setResult] = useState<ComprehensivePsychologicalResult | null>(null);
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

  const getHealthColor = (score: number) => {
    // For psychological parameters, higher scores might indicate better health
    if (score >= 7) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    if (score >= 3) return "text-orange-600";
    return "text-red-600";
  };

  if (!text || text.length < 100) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Please provide text (minimum 100 characters) to begin comprehensive psychological analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Comprehensive Psychological Analysis
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
                placeholder="Provide any additional information that might be relevant for the psychological analysis..."
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
                    <Heart className="h-4 w-4" />
                    Run Psychological Analysis
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
              <CardTitle>Overall Psychological Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{result.overallAssessment}</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Strengths:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-600">{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 text-orange-600">Areas for Attention:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.riskFactors.map((factor, index) => (
                      <li key={index} className="text-gray-600">{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Key Insights:</h4>
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
                          <Badge variant="secondary" className={getHealthColor(param.score)}>
                            {param.score}/10
                          </Badge>
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