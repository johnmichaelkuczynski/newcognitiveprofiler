import React, { useState } from "react";
import { Check, Download, Copy, RefreshCw, BrainCircuit, Sparkles, Lightbulb, Layers, FileText, Mail, FileType, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { MultiProviderAnalysisResult } from "@/hooks/useCognitiveAnalysis";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useComprehensiveReport } from "@/hooks/useComprehensiveReport";
import ComprehensiveReportModal from "@/components/ComprehensiveReportModal";

interface ResultsSectionProps {
  result: MultiProviderAnalysisResult;
  onNewAnalysis: () => void;
}

// Map of provider names to friendly display names and icons
const providerInfo: Record<ModelProvider, { name: string; color: string; icon: any }> = {
  openai: { name: "OpenAI", color: "bg-emerald-600", icon: Sparkles },
  anthropic: { name: "Anthropic", color: "bg-blue-600", icon: BrainCircuit },
  perplexity: { name: "Perplexity", color: "bg-purple-600", icon: Lightbulb }
};

// Single profile card component
function CognitiveProfileCard({ 
  result, 
  providerKey 
}: { 
  result: CognitiveAnalysisResult; 
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
        {/* Intelligence Score */}
        <div className="mb-4">
          <h4 className="font-medium text-sm text-secondary-light mb-2">Intelligence Estimate</h4>
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-600 text-sm">Score</span>
              <span className="text-xl font-bold text-primary">{result.intelligenceScore}</span>
            </div>
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${result.intelligenceScore}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Characteristics */}
        <div className="mb-4">
          <h4 className="font-medium text-sm text-secondary-light mb-2">Cognitive Characteristics</h4>
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 max-h-24 overflow-y-auto">
            <ul className="space-y-1">
              {result.characteristics.map((characteristic, idx) => (
                <li key={idx} className="flex items-center gap-1 text-xs">
                  <Check className="h-3 w-3 text-primary" />
                  <span className="text-neutral-700">{characteristic}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Detailed Analysis */}
        <div className="mb-4">
          <h4 className="font-medium text-sm text-secondary-light mb-2">Detailed Analysis</h4>
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 max-h-48 overflow-y-auto">
            <div className="prose prose-sm max-w-none text-neutral-700 text-xs">
              {result.detailedAnalysis.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
        
        {/* Strengths & Tendencies */}
        <div>
          <h4 className="font-medium text-sm text-secondary-light mb-2">Reasoning Style</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 max-h-32 overflow-y-auto">
              <h5 className="font-medium text-primary text-xs mb-1">Strengths</h5>
              <ul className="space-y-1 text-neutral-700 text-xs">
                {result.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 max-h-32 overflow-y-auto">
              <h5 className="font-medium text-primary text-xs mb-1">Tendencies</h5>
              <ul className="space-y-1 text-neutral-700 text-xs">
                {result.tendencies.map((tendency, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-neutral-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{tendency}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsSection({ result, onNewAnalysis }: ResultsSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all-profiles");
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>("openai");
  const [documentFormat, setDocumentFormat] = useState<"pdf" | "docx">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const { toast } = useToast();
  
  // Use the comprehensive report hook
  const { 
    generateReport, 
    isGenerating, 
    currentReport, 
    isModalOpen, 
    closeModal 
  } = useComprehensiveReport();

  // Calculate average intelligence score across all providers
  const averageScore = Math.round(
    Object.values(result).reduce((sum, profile) => sum + profile.intelligenceScore, 0) / 
    Object.keys(result).length
  );

  const copyResults = () => {
    // Create a combined text representation of all results
    let resultsText = `COGNITIVE PROFILE ANALYSIS\n\n`;
    
    // Add summary of all models
    resultsText += `SUMMARY OF ALL ANALYSES:\n`;
    resultsText += `Average Intelligence Score: ${averageScore}/100\n\n`;
    
    // Add individual model results
    Object.entries(result).forEach(([provider, analysis]) => {
      resultsText += `${providerInfo[provider as ModelProvider].name} ANALYSIS:\n`;
      resultsText += `Intelligence Score: ${analysis.intelligenceScore}/100\n`;
      resultsText += `Characteristics: ${analysis.characteristics.join(', ')}\n`;
      resultsText += `Detailed Analysis: ${analysis.detailedAnalysis}\n`;
      resultsText += `Strengths: ${analysis.strengths.join(', ')}\n`;
      resultsText += `Tendencies: ${analysis.tendencies.join(', ')}\n\n`;
    });
    
    navigator.clipboard.writeText(resultsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadResults = () => {
    // Create a combined text representation of all results
    let resultsText = `COGNITIVE PROFILE ANALYSIS\n\n`;
    
    // Add summary of all models
    resultsText += `SUMMARY OF ALL ANALYSES:\n`;
    resultsText += `Average Intelligence Score: ${averageScore}/100\n\n`;
    
    // Add individual model results
    Object.entries(result).forEach(([provider, analysis]) => {
      resultsText += `${providerInfo[provider as ModelProvider].name} ANALYSIS:\n`;
      resultsText += `Intelligence Score: ${analysis.intelligenceScore}/100\n`;
      resultsText += `Characteristics: ${analysis.characteristics.join(', ')}\n`;
      resultsText += `Detailed Analysis: ${analysis.detailedAnalysis}\n`;
      resultsText += `Strengths: ${analysis.strengths.join(', ')}\n`;
      resultsText += `Tendencies: ${analysis.tendencies.join(', ')}\n\n`;
    });
    
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
  
  const exportDocument = async () => {
    try {
      setIsExporting(true);
      
      // Get the result for the selected provider
      const providerResult = result[selectedProvider];
      
      // Create form data for the export request
      const exportData = {
        analysis: providerResult,
        provider: selectedProvider,
        analysisType: 'cognitive',
        format: documentFormat
      };
      
      // Make API request to generate document
      const response = await fetch('/api/export-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export document');
      }
      
      // Get the document as a blob
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cognitive-analysis-${selectedProvider}-${Date.now()}.${documentFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Document exported successfully",
        description: `Your analysis has been exported as a ${documentFormat.toUpperCase()} file.`,
      });
    } catch (error) {
      console.error('Error exporting document:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export document. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const shareViaEmail = async () => {
    try {
      if (!recipientEmail) {
        toast({
          variant: "destructive",
          title: "Email required",
          description: "Please enter a recipient email address.",
        });
        return;
      }
      
      setIsSharing(true);
      
      // Get the result for the selected provider
      const providerResult = result[selectedProvider];
      
      // Create data for the email sharing request
      const shareData = {
        analysis: providerResult,
        provider: selectedProvider,
        analysisType: 'cognitive',
        format: documentFormat,
        recipientEmail,
        senderName
      };
      
      // Make API request to share via email
      const response = await fetch('/api/share-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to share via email');
      }
      
      toast({
        title: "Analysis shared successfully",
        description: `Your analysis has been sent to ${recipientEmail}.`,
      });
      
      // Reset form
      setRecipientEmail("");
      setSenderName("");
    } catch (error) {
      console.error('Error sharing via email:', error);
      toast({
        variant: "destructive",
        title: "Sharing failed",
        description: error instanceof Error ? error.message : "Failed to share via email. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section className="mb-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden">
        <div className="bg-secondary p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-heading font-semibold text-xl text-white">Multi-Provider Cognitive Profile</h2>
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
                Text
              </Button>
              
              {/* Comprehensive report button */}
              <Button
                variant="secondary" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white"
                onClick={() => {
                  const textToAnalyze = Object.values(result)[0].detailedAnalysis;
                  generateReport(textToAnalyze, activeTab === "all-profiles" ? selectedProvider : activeTab as ModelProvider);
                }}
                disabled={isGenerating}
              >
                <BookOpen className="h-4 w-4 mr-1" />
                {isGenerating ? "Generating..." : "Full Report"}
              </Button>
              
              {/* Export document dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Export Analysis</DialogTitle>
                    <DialogDescription>
                      Export your analysis as a PDF or Word document.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="provider" className="text-right">
                        Provider
                      </Label>
                      <Select 
                        value={selectedProvider} 
                        onValueChange={(value) => setSelectedProvider(value as ModelProvider)}
                        name="provider"
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(result).map(([provider, _]) => (
                            <SelectItem key={provider} value={provider}>
                              {providerInfo[provider as ModelProvider].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="format" className="text-right">
                        Format
                      </Label>
                      <Select 
                        value={documentFormat} 
                        onValueChange={(value) => setDocumentFormat(value as "pdf" | "docx")}
                        name="format"
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="docx">Word Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={exportDocument} disabled={isExporting}>
                      {isExporting ? "Exporting..." : "Export"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Share via email dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Share Analysis</DialogTitle>
                    <DialogDescription>
                      Share your analysis with others via email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Your Name
                      </Label>
                      <Input
                        id="name"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Optional"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="provider" className="text-right">
                        Provider
                      </Label>
                      <Select 
                        value={selectedProvider} 
                        onValueChange={(value) => setSelectedProvider(value as ModelProvider)}
                        name="provider"
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(result).map(([provider, _]) => (
                            <SelectItem key={provider} value={provider}>
                              {providerInfo[provider as ModelProvider].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="format" className="text-right">
                        Format
                      </Label>
                      <Select 
                        value={documentFormat} 
                        onValueChange={(value) => setDocumentFormat(value as "pdf" | "docx")}
                        name="format"
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="docx">Word Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={shareViaEmail} disabled={isSharing}>
                      {isSharing ? "Sending..." : "Send"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Tab navigation between views */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all-profiles" className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                <span>All Profiles</span>
              </TabsTrigger>
              {Object.entries(result).map(([provider, _]) => {
                const { name, icon: Icon } = providerInfo[provider as ModelProvider];
                return (
                  <TabsTrigger key={provider} value={provider} className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    <span>{name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* All profiles view */}
            <TabsContent value="all-profiles">
              <div className="mb-6">
                <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Combined Intelligence Estimate</h3>
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-600">Average Score</span>
                    <span className="text-3xl font-bold text-primary">{averageScore}</span>
                  </div>
                  <div className="w-full h-6 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${averageScore}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-neutral-500">
                    <span>1</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Provider Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(result).map(([provider, analysis]) => {
                    const { name, icon: Icon } = providerInfo[provider as ModelProvider];
                    return (
                      <div key={provider} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-medium">{name}</span>
                        </div>
                        <div className="text-3xl font-bold text-primary mb-1">{analysis.intelligenceScore}</div>
                        <div className="text-sm text-neutral-600 text-center">Intelligence Score</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Individual Provider Analyses</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(result).map(([provider, analysis]) => (
                    <CognitiveProfileCard 
                      key={provider} 
                      result={analysis} 
                      providerKey={provider as ModelProvider} 
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Individual provider views */}
            {Object.entries(result).map(([provider, analysis]) => (
              <TabsContent key={provider} value={provider}>
                <div className="p-4 border border-neutral-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-4">
                    {(() => {
                      const { name, icon: Icon } = providerInfo[provider as ModelProvider];
                      return (
                        <>
                          <Icon className="h-6 w-6 text-primary" />
                          <h3 className="font-heading font-medium text-lg">{name} Analysis</h3>
                        </>
                      );
                    })()}
                  </div>

                  <div className="mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="mb-6">
                          <h3 className="font-heading font-medium text-lg text-secondary-light mb-3">Intelligence Estimate</h3>
                          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-neutral-600">Score</span>
                              <span className="text-2xl font-bold text-primary">{analysis.intelligenceScore}</span>
                            </div>
                            <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${analysis.intelligenceScore}%` }}></div>
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
                            {analysis.characteristics.map((characteristic, idx) => (
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
                        {analysis.detailedAnalysis.split('\n').map((paragraph, idx) => (
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
                          {analysis.strengths.map((strength, idx) => (
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
                          {analysis.tendencies.map((tendency, idx) => (
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
                </div>
              </TabsContent>
            ))}
          </Tabs>

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
      
      {/* Comprehensive Report Modal */}
      <ComprehensiveReportModal
        isOpen={isModalOpen}
        onClose={closeModal}
        report={currentReport}
      />
    </section>
  );
}
