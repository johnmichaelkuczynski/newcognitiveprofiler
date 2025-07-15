import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, MessageCircle, Send, User, Bot, FileText, Upload, Loader2 } from 'lucide-react';
import { useComprehensiveCognitiveAnalysis } from '@/hooks/useComprehensiveCognitiveAnalysis';
import { MultiProviderComprehensiveCognitiveResult, ComprehensiveCognitiveParameter, ModelProvider, DialogueEntry } from '@/types/analysis';

interface ComprehensiveCognitiveProfilerProps {
  initialText?: string;
  onNewAnalysis: () => void;
}

export default function ComprehensiveCognitiveProfiler({ initialText = '', onNewAnalysis }: ComprehensiveCognitiveProfilerProps) {
  const [textSample, setTextSample] = useState(initialText);
  const [additionalContext, setAdditionalContext] = useState('');
  const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({});
  const [dialogueEntries, setDialogueEntries] = useState<DialogueEntry[]>([]);
  const [dialogueInput, setDialogueInput] = useState('');
  const [showDialogue, setShowDialogue] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>('openai');
  
  const {
    analyzeText,
    analyzeFile,
    isLoading,
    isError,
    error,
    data,
    reset
  } = useComprehensiveCognitiveAnalysis();

  const handleAnalyze = async () => {
    if (textSample.length < 100) {
      return;
    }
    await analyzeText(textSample, additionalContext);
    setShowDialogue(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'txt' || fileExt === 'text') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setTextSample(text);
      };
      reader.readAsText(file);
    } else if (fileExt === 'pdf' || fileExt === 'doc' || fileExt === 'docx') {
      await analyzeFile(file, additionalContext);
      setShowDialogue(true);
    }
  };

  const handleParameterToggle = (paramName: string) => {
    setExpandedParams(prev => ({
      ...prev,
      [paramName]: !prev[paramName]
    }));
  };

  const handleDialogueSubmit = async () => {
    if (!dialogueInput.trim()) return;
    
    const userEntry: DialogueEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'user',
      message: dialogueInput,
    };
    
    setDialogueEntries(prev => [...prev, userEntry]);
    setDialogueInput('');
    
    // TODO: Implement AI response generation based on user input
    // For now, add a placeholder AI response
    const aiEntry: DialogueEntry = {
      id: (Date.now() + 1).toString(),
      timestamp: new Date().toISOString(),
      type: 'ai',
      message: `I understand your point about "${dialogueInput}". Let me consider this additional context and provide more insights based on the comprehensive analysis.`,
    };
    
    setTimeout(() => {
      setDialogueEntries(prev => [...prev, aiEntry]);
    }, 1000);
  };

  const handleReset = () => {
    reset();
    setTextSample('');
    setAdditionalContext('');
    setExpandedParams({});
    setDialogueEntries([]);
    setDialogueInput('');
    setShowDialogue(false);
    onNewAnalysis();
  };

  const getProviderBadgeColor = (provider: ModelProvider) => {
    switch (provider) {
      case 'openai': return 'bg-green-100 text-green-800';
      case 'anthropic': return 'bg-purple-100 text-purple-800';
      case 'perplexity': return 'bg-blue-100 text-blue-800';
      case 'deepseek': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Analyzing comprehensive cognitive patterns...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Error</h3>
          <p className="text-red-600 mb-4">{error?.message || 'Failed to analyze text'}</p>
          <Button onClick={handleReset} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprehensive Cognitive Analysis
            </CardTitle>
            <CardDescription>
              Analyze text across 20 specific cognitive parameters with detailed quotations and reasoning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="text-input">Text to Analyze</Label>
              <Textarea
                id="text-input"
                placeholder="Enter text to analyze (minimum 100 characters)..."
                value={textSample}
                onChange={(e) => setTextSample(e.target.value)}
                className="min-h-32"
              />
            </div>
            
            <div>
              <Label htmlFor="context-input">Additional Context (Optional)</Label>
              <Textarea
                id="context-input"
                placeholder="Any additional information that might be relevant for the analysis..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="min-h-24"
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={handleAnalyze}
                disabled={textSample.length < 100}
                className="flex-1"
              >
                Analyze Cognitive Profile
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const providers = Object.keys(data.providers) as ModelProvider[];
  const currentProviderData = data.providers[selectedProvider];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Comprehensive Cognitive Profile</span>
            <Button onClick={handleReset} variant="outline" size="sm">
              New Analysis
            </Button>
          </CardTitle>
          <CardDescription>
            Analysis of {data.originalText.length} characters across 20 cognitive parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {providers.map((provider) => (
              <Button
                key={provider}
                variant={selectedProvider === provider ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProvider(provider)}
                className="flex items-center gap-2"
              >
                <Badge className={getProviderBadgeColor(provider)}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Badge>
              </Button>
            ))}
          </div>
          
          {currentProviderData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Overall Summary</h3>
                <p className="text-sm text-gray-700">{currentProviderData.overallSummary}</p>
              </div>
              
              <div className="grid gap-3">
                {Object.entries(currentProviderData.parameters).map(([paramName, paramData]) => (
                  <ParameterCard
                    key={paramName}
                    parameter={paramData}
                    isExpanded={expandedParams[paramName] || false}
                    onToggle={() => handleParameterToggle(paramName)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showDialogue && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Dialogue & Additional Analysis
            </CardTitle>
            <CardDescription>
              Discuss the analysis results and provide additional context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dialogueEntries.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-lg">
                  {dialogueEntries.map((entry) => (
                    <div key={entry.id} className={`flex gap-2 ${entry.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-xs ${entry.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="flex-shrink-0">
                          {entry.type === 'user' ? (
                            <User className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Bot className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div className={`p-2 rounded-lg ${entry.type === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          <p className="text-sm">{entry.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Textarea
                  placeholder="Share your thoughts or ask questions about the analysis..."
                  value={dialogueInput}
                  onChange={(e) => setDialogueInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleDialogueSubmit} disabled={!dialogueInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ParameterCardProps {
  parameter: ComprehensiveCognitiveParameter;
  isExpanded: boolean;
  onToggle: () => void;
}

function ParameterCard({ parameter, isExpanded, onToggle }: ParameterCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    if (score >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{parameter.parameter}</CardTitle>
                <Badge className={getScoreColor(parameter.score)}>
                  {parameter.score}/10
                </Badge>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Analysis</h4>
              <p className="text-sm text-gray-700">{parameter.analysis}</p>
            </div>
            
            {parameter.quotations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Supporting Quotations</h4>
                <div className="space-y-2">
                  {parameter.quotations.map((quote, index) => (
                    <blockquote key={index} className="border-l-4 border-blue-500 pl-4 italic text-sm">
                      "{quote}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold mb-2">Reasoning</h4>
              <p className="text-sm text-gray-700">{parameter.reasoning}</p>
            </div>
            
            {parameter.examples.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Examples</h4>
                <ul className="list-disc list-inside space-y-1">
                  {parameter.examples.map((example, index) => (
                    <li key={index} className="text-sm text-gray-700">{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}