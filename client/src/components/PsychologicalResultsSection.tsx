import React, { useState, useEffect } from "react";
import { RefreshCw, Heart, BrainCircuit, Users, Lightbulb, Download, FileText, Mail, Copy, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PsychologicalAnalysisResult, ModelProvider } from "@/types/analysis";
import { MultiProviderPsychologicalResult } from "@/hooks/usePsychologicalAnalysis";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useComprehensivePsychologicalReport } from "@/hooks/useComprehensivePsychologicalReport";
import ComprehensivePsychologicalReportModal from "@/components/ComprehensivePsychologicalReportModal";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Provider information for display
const providerInfo: Record<string, {
  name: string;
  color: string;
  icon: React.ComponentType<any>;
}> = {
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

interface PsychologicalResultsSectionProps {
  result: MultiProviderPsychologicalResult;
  onNewAnalysis: () => void;
}

export default function PsychologicalResultsSection({ result, onNewAnalysis }: PsychologicalResultsSectionProps) {
  // Get valid providers - filter out non-provider keys like originalText
  // Make sure we only include keys that exist in providerInfo AND are in result
  const validProviderKeys = Object.keys(result)
    .filter(key => 
      key !== 'originalText' && 
      Object.prototype.hasOwnProperty.call(providerInfo, key)
    )
    .filter(key => Object.prototype.hasOwnProperty.call(result, key)) as ModelProvider[];
  
  // Default to openai if available in result, otherwise first available
  let defaultProvider = "openai" as ModelProvider;
  if (!validProviderKeys.includes("openai" as ModelProvider) && validProviderKeys.length > 0) {
    defaultProvider = validProviderKeys[0];
  }
  
  // Define state with proper defaults
  const [activeProvider, setActiveProvider] = useState<ModelProvider>(defaultProvider);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(defaultProvider);
  const [documentFormat, setDocumentFormat] = useState<"pdf" | "docx">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Use the comprehensive psychological report hook
  const { 
    generateReport, 
    isGenerating, 
    currentReport, 
    isModalOpen, 
    closeModal 
  } = useComprehensivePsychologicalReport();
  
  const copyResults = () => {
    // Create a text representation of the current provider's results
    const providerResult = result[activeProvider];
    let resultsText = `PSYCHOLOGICAL PROFILE ANALYSIS\n\n`;
    
    resultsText += `${providerInfo[activeProvider].name} ANALYSIS:\n\n`;
    
    // Emotional profile
    resultsText += `EMOTIONAL PROFILE:\n`;
    resultsText += `Emotional Stability: ${providerResult.emotionalProfile.emotionalStability}/100\n`;
    resultsText += `Primary Emotions: ${providerResult.emotionalProfile.primaryEmotions.join(', ')}\n`;
    resultsText += `Analysis: ${providerResult.emotionalProfile.detailedAnalysis}\n\n`;
    
    // Motivational structure
    resultsText += `MOTIVATIONAL STRUCTURE:\n`;
    resultsText += `Primary Drives: ${providerResult.motivationalStructure.primaryDrives.join(', ')}\n`;
    resultsText += `Motivational Patterns: ${providerResult.motivationalStructure.motivationalPatterns.join(', ')}\n`;
    resultsText += `Analysis: ${providerResult.motivationalStructure.detailedAnalysis}\n\n`;
    
    // Interpersonal dynamics
    resultsText += `INTERPERSONAL DYNAMICS:\n`;
    resultsText += `Attachment Style: ${providerResult.interpersonalDynamics.attachmentStyle}\n`;
    resultsText += `Social Orientations: ${providerResult.interpersonalDynamics.socialOrientations.join(', ')}\n`;
    resultsText += `Relationship Patterns: ${providerResult.interpersonalDynamics.relationshipPatterns.join(', ')}\n`;
    resultsText += `Analysis: ${providerResult.interpersonalDynamics.detailedAnalysis}\n\n`;
    
    // Strengths and challenges
    resultsText += `PSYCHOLOGICAL STRENGTHS:\n`;
    providerResult.strengths.forEach(strength => {
      resultsText += `- ${strength}\n`;
    });
    resultsText += `\nGROWTH AREAS:\n`;
    providerResult.challenges.forEach(challenge => {
      resultsText += `- ${challenge}\n`;
    });
    
    // Overall summary
    resultsText += `\nOVERALL SUMMARY:\n${providerResult.overallSummary}\n`;
    
    navigator.clipboard.writeText(resultsText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const downloadResults = () => {
    // Create a text representation of the current provider's results
    const providerResult = result[activeProvider];
    let resultsText = `PSYCHOLOGICAL PROFILE ANALYSIS\n\n`;
    
    resultsText += `${providerInfo[activeProvider].name} ANALYSIS:\n\n`;
    
    // Emotional profile
    resultsText += `EMOTIONAL PROFILE:\n`;
    resultsText += `Emotional Stability: ${providerResult.emotionalProfile.emotionalStability}/100\n`;
    resultsText += `Primary Emotions: ${providerResult.emotionalProfile.primaryEmotions.join(', ')}\n`;
    resultsText += `Analysis: ${providerResult.emotionalProfile.detailedAnalysis}\n\n`;
    
    // Motivational structure
    resultsText += `MOTIVATIONAL STRUCTURE:\n`;
    resultsText += `Primary Drives: ${providerResult.motivationalStructure.primaryDrives.join(', ')}\n`;
    resultsText += `Motivational Patterns: ${providerResult.motivationalStructure.motivationalPatterns.join(', ')}\n`;
    resultsText += `Analysis: ${providerResult.motivationalStructure.detailedAnalysis}\n\n`;
    
    // Interpersonal dynamics
    resultsText += `INTERPERSONAL DYNAMICS:\n`;
    resultsText += `Attachment Style: ${providerResult.interpersonalDynamics.attachmentStyle}\n`;
    resultsText += `Social Orientations: ${providerResult.interpersonalDynamics.socialOrientations.join(', ')}\n`;
    resultsText += `Relationship Patterns: ${providerResult.interpersonalDynamics.relationshipPatterns.join(', ')}\n`;
    resultsText += `Analysis: ${providerResult.interpersonalDynamics.detailedAnalysis}\n\n`;
    
    // Strengths and challenges
    resultsText += `PSYCHOLOGICAL STRENGTHS:\n`;
    providerResult.strengths.forEach(strength => {
      resultsText += `- ${strength}\n`;
    });
    resultsText += `\nGROWTH AREAS:\n`;
    providerResult.challenges.forEach(challenge => {
      resultsText += `- ${challenge}\n`;
    });
    
    // Overall summary
    resultsText += `\nOVERALL SUMMARY:\n${providerResult.overallSummary}\n`;
    
    // Create a blob and download link
    const blob = new Blob([resultsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `psychological-analysis-${activeProvider}.txt`;
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
        analysisType: 'psychological',
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
      a.download = `psychological-analysis-${selectedProvider}-${Date.now()}.${documentFormat}`;
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
        analysisType: 'psychological',
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
    <div className="my-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-heading font-semibold text-secondary flex items-center">
          <Heart className="mr-2 h-6 w-6 text-primary" />
          Psychological Profile
        </h2>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyResults}
            className="flex items-center gap-1"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadResults}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Text</span>
          </Button>
          
          {/* Full Report button */}
          <Button
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              // Create a more detailed request for analysis that includes all available text
              // This ensures we have enough content for a thorough analysis
              let textToAnalyze = "";
              const analysis = result[activeProvider];
              
              // Combine all text fields from the psychological analysis for a better report
              textToAnalyze += analysis.emotionalProfile.detailedAnalysis + "\n\n";
              textToAnalyze += analysis.motivationalStructure.detailedAnalysis + "\n\n";
              textToAnalyze += analysis.interpersonalDynamics.detailedAnalysis + "\n\n";
              textToAnalyze += analysis.overallSummary;
              
              // Generate the comprehensive report
              generateReport(textToAnalyze, activeProvider);
            }}
            disabled={isGenerating}
          >
            <BookOpen className="h-4 w-4" />
            <span>{isGenerating ? "Generating..." : "Full Report"}</span>
          </Button>
          
          {/* Export document dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Export Analysis</DialogTitle>
                <DialogDescription>
                  Export your psychological analysis as a PDF or Word document.
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
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share Analysis</DialogTitle>
                <DialogDescription>
                  Share your psychological analysis with others via email.
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
      </div>
      
      <Tabs 
        defaultValue={validProviderKeys.length > 0 ? validProviderKeys[0] : "openai"}
        onValueChange={(value) => setActiveProvider(value as ModelProvider)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          {validProviderKeys.map(provider => (
            <TabsTrigger 
              key={provider} 
              value={provider}
              className="flex items-center gap-1.5"
            >
              {providerInfo[provider]?.icon && React.createElement(providerInfo[provider].icon, { className: "h-4 w-4" })}
              <span>{providerInfo[provider]?.name || provider}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {validProviderKeys.map(provider => (
          <TabsContent key={provider} value={provider} className="mt-0">
            <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
              <div className={cn("p-4 text-white flex items-center gap-2", providerInfo[provider]?.color || "bg-gray-600")}>
                {providerInfo[provider]?.icon && React.createElement(providerInfo[provider].icon, { className: "h-5 w-5" })}
                <h3 className="font-heading font-semibold">{providerInfo[provider]?.name || provider} Analysis</h3>
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
      
      {/* Original Analyzed Text */}
      {result.originalText && (
        <div className="mt-6 mb-4 bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden">
          <Accordion type="single" collapsible>
            <AccordionItem value="analyzed-text" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-secondary" />
                  <span className="font-heading font-medium">View Original Analyzed Text</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-6 pb-4">
                  <div className="p-4 bg-gray-50 rounded-md text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-200">
                    {result.originalText && result.originalText.length > 5000 
                      ? result.originalText.substring(0, 5000) + '... (text truncated for display)'
                      : result.originalText}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      
      {/* Comprehensive Psychological Report Modal */}
      <ComprehensivePsychologicalReportModal
        isOpen={isModalOpen}
        onClose={closeModal}
        report={currentReport}
      />
    </div>
  );
}