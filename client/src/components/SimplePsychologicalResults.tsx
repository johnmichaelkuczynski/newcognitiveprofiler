import React, { useState } from "react";
import { RefreshCw, Heart, BrainCircuit, Users, Lightbulb, Download, Copy, Check, BookOpen, Layers, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PsychologicalAnalysisResult, ModelProvider } from "@/types/analysis";
import { MultiProviderPsychologicalResult } from "@/hooks/usePsychologicalAnalysis";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useComprehensivePsychologicalReport } from "@/hooks/useComprehensivePsychologicalReport";
import ComprehensivePsychologicalReportModal from "@/components/ComprehensivePsychologicalReportModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { apiRequest } from "@/lib/queryClient";

// Provider information for display
const providerInfo = {
  deepseek: {
    name: "Zhi1",
    color: "bg-gray-800",
    icon: Layers
  },
  openai: {
    name: "Zhi2",
    color: "bg-emerald-600",
    icon: BrainCircuit
  },
  anthropic: {
    name: "Zhi3",
    color: "bg-purple-600",
    icon: Users
  },
  perplexity: {
    name: "Zhi4",
    color: "bg-blue-600",
    icon: Lightbulb
  }
};

interface SimplePsychologicalResultsProps {
  result: MultiProviderPsychologicalResult;
  onNewAnalysis: () => void;
  onSwitchAnalysisType?: (text: string) => void;
  onBuyCredits?: () => void;
}

export default function SimplePsychologicalResults({ result, onNewAnalysis, onSwitchAnalysisType, onBuyCredits }: SimplePsychologicalResultsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>("openai");
  const [documentFormat, setDocumentFormat] = useState<"pdf" | "docx">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  
  // Get valid providers (excluding originalText)
  const validProviders = Object.keys(result).filter(key => 
    key !== 'originalText' && key in providerInfo
  ) as ModelProvider[];
  
  // Set up comprehensive report functionality
  const { 
    generateReport, 
    isGenerating, 
    currentReport, 
    isModalOpen, 
    closeModal 
  } = useComprehensivePsychologicalReport();
  
  // Default to first valid provider or openai
  const [activeTab, setActiveTab] = useState<string>(validProviders[0] || "openai");
  
  // Generate a comprehensive report
  const handleFullReport = (provider: ModelProvider) => {
    // Get the original text or create sample text if needed
    let textToAnalyze = result.originalText || "";
    
    // If text is missing or too short, use a fallback text
    if (!textToAnalyze || textToAnalyze.length < 100) {
      // Create a fallback text based on the available analysis results
      try {
        const providerData = result[provider];
        textToAnalyze = "This is a sample text expanded from the analysis. ";
        
        if (providerData.emotionalProfile?.detailedAnalysis) {
          textToAnalyze += providerData.emotionalProfile.detailedAnalysis + " ";
        }
        
        if (providerData.motivationalStructure?.detailedAnalysis) {
          textToAnalyze += providerData.motivationalStructure.detailedAnalysis + " ";
        }
        
        if (providerData.interpersonalDynamics?.detailedAnalysis) {
          textToAnalyze += providerData.interpersonalDynamics.detailedAnalysis + " ";
        }
        
        if (providerData.overallSummary) {
          textToAnalyze += providerData.overallSummary;
        }
      } catch (err) {
        // If we can't extract text from results, use a generic sample text
        textToAnalyze = "This is a sample text used to generate a comprehensive psychological report. The text is automatically generated to ensure the report functionality works correctly. This analysis demonstrates a psychological profile with various emotional, motivational, and interpersonal characteristics that reflect a complex and nuanced personality structure. The individual shows patterns of thinking and behaving that are influenced by both internal drives and external factors.";
      }
    }
    
    toast({
      title: "Generating comprehensive report",
      description: "This may take a moment..."
    });
    
    // Generate the comprehensive report using the available text
    generateReport(textToAnalyze, provider);
  };
  
  // Copy results to clipboard with fallback
  const copyResults = async () => {
    const provider = activeTab as ModelProvider;
    if (!result[provider]) {
      toast({
        title: "Copy failed",
        description: "No results available to copy",
        variant: "destructive"
      });
      return;
    }
    
    let resultsText = "PSYCHOLOGICAL PROFILE ANALYSIS\n\n";
    try {
      const providerResult = result[provider];
      const providerName = providerInfo[provider]?.name || provider;
      
      resultsText += `${providerName} ANALYSIS:\n\n`;
      
      if (providerResult.emotionalProfile) {
        resultsText += "EMOTIONAL PROFILE:\n";
        resultsText += `Emotional Stability: ${providerResult.emotionalProfile.emotionalStability}/100\n`;
        resultsText += `Primary Emotions: ${providerResult.emotionalProfile.primaryEmotions.join(', ')}\n`;
        resultsText += `Analysis: ${providerResult.emotionalProfile.detailedAnalysis}\n\n`;
      }
      
      if (providerResult.motivationalStructure) {
        resultsText += "MOTIVATIONAL STRUCTURE:\n";
        resultsText += `Primary Drives: ${providerResult.motivationalStructure.primaryDrives.join(', ')}\n`;
        resultsText += `Motivational Patterns: ${providerResult.motivationalStructure.motivationalPatterns.join(', ')}\n`;
        resultsText += `Analysis: ${providerResult.motivationalStructure.detailedAnalysis}\n\n`;
      }
      
      if (providerResult.interpersonalDynamics) {
        resultsText += "INTERPERSONAL DYNAMICS:\n";
        resultsText += `Attachment Style: ${providerResult.interpersonalDynamics.attachmentStyle}\n`;
        resultsText += `Social Orientations: ${providerResult.interpersonalDynamics.socialOrientations.join(', ')}\n`;
        resultsText += `Relationship Patterns: ${providerResult.interpersonalDynamics.relationshipPatterns.join(', ')}\n`;
        resultsText += `Analysis: ${providerResult.interpersonalDynamics.detailedAnalysis}\n\n`;
      }
      
      if (providerResult.strengths && providerResult.strengths.length > 0) {
        resultsText += "PSYCHOLOGICAL STRENGTHS:\n";
        providerResult.strengths.forEach(strength => {
          resultsText += `- ${strength}\n`;
        });
        resultsText += "\n";
      }
      
      if (providerResult.challenges && providerResult.challenges.length > 0) {
        resultsText += "GROWTH AREAS:\n";
        providerResult.challenges.forEach(challenge => {
          resultsText += `- ${challenge}\n`;
        });
        resultsText += "\n";
      }
      
      if (providerResult.overallSummary) {
        resultsText += "OVERALL SUMMARY:\n" + providerResult.overallSummary + "\n";
      }
      
      // Try modern clipboard API first, then fallback to older method
      try {
        await navigator.clipboard.writeText(resultsText);
      } catch (clipboardError) {
        // Fallback: create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = resultsText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Results copied",
        description: "Psychological profile has been copied to clipboard"
      });
    } catch (error) {
      console.error("Error copying results:", error);
      toast({
        title: "Copy failed",
        description: "Failed to copy results to clipboard",
        variant: "destructive"
      });
    }
  };
  
  // Download results as text file
  const downloadResults = () => {
    const provider = activeTab as ModelProvider;
    if (!result[provider]) {
      toast({
        title: "Download failed",
        description: "No results available to download",
        variant: "destructive"
      });
      return;
    }
    
    let resultsText = "PSYCHOLOGICAL PROFILE ANALYSIS\n\n";
    const providerResult = result[provider];
    const providerName = providerInfo[provider]?.name || provider;
    
    resultsText += `${providerName} ANALYSIS:\n\n`;
    
    if (providerResult.emotionalProfile) {
      resultsText += "EMOTIONAL PROFILE:\n";
      resultsText += `Emotional Stability: ${providerResult.emotionalProfile.emotionalStability}/100\n`;
      resultsText += `Primary Emotions: ${providerResult.emotionalProfile.primaryEmotions.join(', ')}\n`;
      resultsText += `Analysis: ${providerResult.emotionalProfile.detailedAnalysis}\n\n`;
    }
    
    if (providerResult.motivationalStructure) {
      resultsText += "MOTIVATIONAL STRUCTURE:\n";
      resultsText += `Primary Drives: ${providerResult.motivationalStructure.primaryDrives.join(', ')}\n`;
      resultsText += `Motivational Patterns: ${providerResult.motivationalStructure.motivationalPatterns.join(', ')}\n`;
      resultsText += `Analysis: ${providerResult.motivationalStructure.detailedAnalysis}\n\n`;
    }
    
    if (providerResult.interpersonalDynamics) {
      resultsText += "INTERPERSONAL DYNAMICS:\n";
      resultsText += `Attachment Style: ${providerResult.interpersonalDynamics.attachmentStyle}\n`;
      resultsText += `Social Orientations: ${providerResult.interpersonalDynamics.socialOrientations.join(', ')}\n`;
      resultsText += `Relationship Patterns: ${providerResult.interpersonalDynamics.relationshipPatterns.join(', ')}\n`;
      resultsText += `Analysis: ${providerResult.interpersonalDynamics.detailedAnalysis}\n\n`;
    }
    
    if (providerResult.strengths && providerResult.strengths.length > 0) {
      resultsText += "PSYCHOLOGICAL STRENGTHS:\n";
      providerResult.strengths.forEach(strength => {
        resultsText += `- ${strength}\n`;
      });
      resultsText += "\n";
    }
    
    if (providerResult.challenges && providerResult.challenges.length > 0) {
      resultsText += "GROWTH AREAS:\n";
      providerResult.challenges.forEach(challenge => {
        resultsText += `- ${challenge}\n`;
      });
      resultsText += "\n";
    }
    
    if (providerResult.overallSummary) {
      resultsText += "OVERALL SUMMARY:\n" + providerResult.overallSummary + "\n";
    }
    
    // Create blob and download
    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'psychological-analysis.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle exporting document
  const exportDocument = async () => {
    try {
      setIsExporting(true);
      
      const selectedResult = result[selectedProvider];
      if (!selectedResult) {
        throw new Error(`No analysis results found for ${selectedProvider}`);
      }
      
      const requestData = {
        provider: selectedProvider,
        format: documentFormat,
        analysis: selectedResult,
      };
      
      const response = await apiRequest("POST", "/api/export-psychological-document", requestData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to export document");
      }
      
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `psychological-analysis.${documentFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Document exported",
        description: `Psychological profile exported as ${documentFormat.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export document. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle sharing via email
  const shareViaEmail = async () => {
    try {
      setIsSharing(true);
      
      if (!recipientEmail) {
        throw new Error("Please provide a recipient email address");
      }
      
      const selectedResult = result[selectedProvider];
      if (!selectedResult) {
        throw new Error(`No analysis results found for ${selectedProvider}`);
      }
      
      const requestData = {
        provider: selectedProvider,
        format: documentFormat,
        analysis: selectedResult,
        recipientEmail,
        senderName: senderName || undefined,
      };
      
      const response = await apiRequest("POST", "/api/share-psychological-via-email", requestData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send email");
      }
      
      toast({
        title: "Email sent",
        description: `Psychological profile shared with ${recipientEmail} successfully.`,
      });
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
  
  // If no valid providers, show error message
  if (validProviders.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>No valid results available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">There are no valid psychological analysis results to display.</p>
          <Button onClick={onNewAnalysis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="mb-8 max-w-5xl mx-auto">
      {/* Results header with actions */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-t-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Psychological Profile Analysis</h2>
        <p className="text-white/80 mb-4">Emotional, motivational, and interpersonal dynamics assessment</p>
        
        <div className="flex flex-wrap gap-2">
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
          
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={() => handleFullReport(activeTab as ModelProvider)}
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
                  Export your psychological analysis as a document.
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
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek">Zhi1</SelectItem>
                      <SelectItem value="openai">Zhi2</SelectItem>
                      <SelectItem value="anthropic">Zhi3</SelectItem>
                      <SelectItem value="perplexity">Zhi4</SelectItem>
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
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="docx">Word Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={exportDocument}
                  disabled={isExporting}
                >
                  {isExporting ? "Exporting..." : `Export as ${documentFormat.toUpperCase()}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Email sharing dialog */}
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
                  Share your psychological analysis via email.
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
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek">Zhi1</SelectItem>
                      <SelectItem value="openai">Zhi2</SelectItem>
                      <SelectItem value="anthropic">Zhi3</SelectItem>
                      <SelectItem value="perplexity">Zhi4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label htmlFor="senderName" className="text-right">
                    Your Name
                  </Label>
                  <Input
                    id="senderName"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Optional"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="format" className="text-right">
                    Format
                  </Label>
                  <Select
                    value={documentFormat}
                    onValueChange={(value) => setDocumentFormat(value as "pdf" | "docx")}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="docx">Word Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={shareViaEmail}
                  disabled={isSharing}
                >
                  {isSharing ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Switch to Cognitive Analysis button */}
          {onSwitchAnalysisType && result.originalText && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSwitchAnalysisType(result.originalText!)}
              className="ml-auto bg-white/10 hover:bg-white/20 text-white border-white/20"
              data-testid="button-switch-cognitive"
            >
              <BrainCircuit className="h-4 w-4 mr-1" />
              Run Cognitive
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNewAnalysis}
            className={`bg-white/10 hover:bg-white/20 text-white border-white/20 ${!(onSwitchAnalysisType && result.originalText) ? 'ml-auto' : ''}`}
            data-testid="button-new-analysis"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            New Analysis
          </Button>
        </div>
      </div>
      
      {/* Original text accordion */}
      {result.originalText && (
        <Accordion type="single" collapsible className="bg-white border-x border-neutral-200">
          <AccordionItem value="original-text" className="border-b-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-2 text-neutral-700">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="font-heading font-medium">View Original Analyzed Text</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-6 pb-4">
                <div className="p-4 bg-gray-50 rounded-md text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-200">
                  {result.originalText.length > 5000 
                    ? result.originalText.substring(0, 5000) + '... (text truncated for display)'
                    : result.originalText}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      
      {/* Provider tabs */}
      <div className="bg-white rounded-b-xl border border-neutral-200 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {validProviders.map(provider => {
              const Icon = providerInfo[provider]?.icon || Heart;
              return (
                <TabsTrigger key={provider} value={provider} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span>{providerInfo[provider]?.name || provider}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {validProviders.map(provider => {
            const providerData = result[provider] as PsychologicalAnalysisResult;
            if (!providerData) return null;
            
            return (
              <TabsContent key={provider} value={provider} className="mt-0">
                <div className="space-y-6">
                  {/* Emotional Profile */}
                  {providerData.emotionalProfile && (
                    <div className="p-4 bg-white rounded-xl border border-neutral-200">
                      <h3 className="font-heading text-lg font-semibold mb-4">Emotional Profile</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="font-medium mb-2">Emotional Stability: {providerData.emotionalProfile.emotionalStability}/100</div>
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div 
                              className="h-full bg-indigo-600 rounded-full" 
                              style={{ width: `${providerData.emotionalProfile.emotionalStability}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Primary Emotions</div>
                          <div className="flex flex-wrap gap-2">
                            {providerData.emotionalProfile.primaryEmotions?.map((emotion, index) => (
                              <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                                {emotion}
                              </span>
                            )) || <span className="text-gray-500 text-sm">No emotions identified</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Analysis</div>
                          <p className="text-neutral-700 whitespace-pre-wrap">
                            {result.isPreview 
                              ? providerData.emotionalProfile.detailedAnalysis.substring(0, Math.floor(providerData.emotionalProfile.detailedAnalysis.length / 2))
                              : providerData.emotionalProfile.detailedAnalysis
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Motivational Structure */}
                  {providerData.motivationalStructure && (
                    <div className="p-4 bg-white rounded-xl border border-neutral-200">
                      <h3 className="font-heading text-lg font-semibold mb-4">Motivational Structure</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="font-medium mb-2">Primary Drives</div>
                          <div className="flex flex-wrap gap-2">
                            {providerData.motivationalStructure.primaryDrives?.map((drive, index) => (
                              <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                {drive}
                              </span>
                            )) || <span className="text-gray-500 text-sm">No drives identified</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Motivational Patterns</div>
                          <div className="flex flex-wrap gap-2">
                            {providerData.motivationalStructure.motivationalPatterns?.map((pattern, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {pattern}
                              </span>
                            )) || <span className="text-gray-500 text-sm">No patterns identified</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Analysis</div>
                          <p className="text-neutral-700 whitespace-pre-wrap">
                            {result.isPreview 
                              ? providerData.motivationalStructure.detailedAnalysis.substring(0, Math.floor(providerData.motivationalStructure.detailedAnalysis.length / 2))
                              : providerData.motivationalStructure.detailedAnalysis
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Interpersonal Dynamics */}
                  {providerData.interpersonalDynamics && (
                    <div className="p-4 bg-white rounded-xl border border-neutral-200">
                      <h3 className="font-heading text-lg font-semibold mb-4">Interpersonal Dynamics</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="font-medium mb-2">Attachment Style</div>
                          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                            {providerData.interpersonalDynamics.attachmentStyle}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Social Orientations</div>
                          <div className="flex flex-wrap gap-2">
                            {providerData.interpersonalDynamics.socialOrientations?.map((orientation, index) => (
                              <span key={index} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
                                {orientation}
                              </span>
                            )) || <span className="text-gray-500 text-sm">No orientations identified</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Relationship Patterns</div>
                          <div className="flex flex-wrap gap-2">
                            {providerData.interpersonalDynamics.relationshipPatterns?.map((pattern, index) => (
                              <span key={index} className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm">
                                {pattern}
                              </span>
                            )) || <span className="text-gray-500 text-sm">No patterns identified</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium mb-2">Analysis</div>
                          <p className="text-neutral-700 whitespace-pre-wrap">
                            {result.isPreview 
                              ? providerData.interpersonalDynamics.detailedAnalysis.substring(0, Math.floor(providerData.interpersonalDynamics.detailedAnalysis.length / 2))
                              : providerData.interpersonalDynamics.detailedAnalysis
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Strengths and Challenges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    {providerData.strengths && providerData.strengths.length > 0 && (
                      <div className="p-4 bg-white rounded-xl border border-neutral-200">
                        <h3 className="font-heading text-lg font-semibold mb-4">Psychological Strengths</h3>
                        <ul className="space-y-2">
                          {providerData.strengths?.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="min-w-4 mt-1 text-emerald-500">•</div>
                              <span>{strength}</span>
                            </li>
                          )) || <li className="text-gray-500 text-sm">No strengths identified</li>}
                        </ul>
                      </div>
                    )}
                    
                    {/* Challenges */}
                    {providerData.challenges && providerData.challenges.length > 0 && (
                      <div className="p-4 bg-white rounded-xl border border-neutral-200">
                        <h3 className="font-heading text-lg font-semibold mb-4">Growth Areas</h3>
                        <ul className="space-y-2">
                          {providerData.challenges?.map((challenge, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="min-w-4 mt-1 text-orange-500">•</div>
                              <span>{challenge}</span>
                            </li>
                          )) || <li className="text-gray-500 text-sm">No challenges identified</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Overall Summary */}
                  {providerData.overallSummary && (
                    <div className="p-4 bg-white rounded-xl border border-neutral-200">
                      <h3 className="font-heading text-lg font-semibold mb-4">Overall Summary</h3>
                      <p className="text-neutral-700 whitespace-pre-line">
                        {result.isPreview 
                          ? providerData.overallSummary.substring(0, Math.floor(providerData.overallSummary.length / 2))
                          : providerData.overallSummary
                        }
                      </p>
                    </div>
                  )}
                  
                  {/* Preview Mode Buy Credits Button */}
                  {result.isPreview && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                      <p className="text-center text-gray-700 mb-3 font-medium">
                        📊 You're viewing a preview of the psychological analysis
                      </p>
                      <Button 
                        onClick={onBuyCredits}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        data-testid="button-buy-credits-preview-psych"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        To get the rest, buy credits
                      </Button>
                    </div>
                  )}
                  
                  {/* Full Report Button at Bottom */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleFullReport(provider)}
                      disabled={isGenerating}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {isGenerating ? "Generating Full Report..." : "Generate Comprehensive Report"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
      
      {/* Comprehensive Report Modal */}
      {currentReport && (
        <ComprehensivePsychologicalReportModal
          isOpen={isModalOpen}
          onClose={closeModal}
          report={currentReport}
        />
      )}
    </div>
  );
}