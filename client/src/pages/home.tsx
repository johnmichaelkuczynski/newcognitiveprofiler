import { useState } from "react";
import Header from "@/components/Header";
import IntroSection from "@/components/IntroSection";
import InputSection from "@/components/InputSection";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import ResultsSection from "@/components/ResultsSection";
import SimplePsychologicalResults from "@/components/SimplePsychologicalResults";
import PreviewResults from "@/components/PreviewResults";
import ErrorSection from "@/components/ErrorSection";
import HelpModal from "@/components/HelpModal";
import Footer from "@/components/Footer";
import { useCognitiveAnalysis } from "@/hooks/useCognitiveAnalysis";
import { usePsychologicalAnalysis } from "@/hooks/usePsychologicalAnalysis";
import { usePreviewAnalysis } from "@/hooks/usePreviewAnalysis";
import { useUser } from "@/contexts/UserContext";
import { AnalysisType } from "@/types/analysis";
import { AlertCircle, BrainCircuit, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);
  const [textSample, setTextSample] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("cognitive");
  const [previewResult, setPreviewResult] = useState<any>(null);
  const { user } = useUser();
  
  // Cognitive analysis hook
  const {
    analyzeText: analyzeCognitiveText,
    analyzeFile: analyzeCognitiveFile,
    isLoading: isCognitiveLoading,
    isError: isCognitiveError,
    error: cognitiveError,
    data: cognitiveResult,
    reset: resetCognitive
  } = useCognitiveAnalysis();
  
  // Psychological analysis hook
  const {
    analyzeText: analyzePsychologicalText,
    analyzeFile: analyzePsychologicalFile,
    isLoading: isPsychologicalLoading,
    isError: isPsychologicalError,
    error: psychologicalError,
    data: psychologicalResult,
    reset: resetPsychological
  } = usePsychologicalAnalysis();
  
  // Preview analysis hook (for unregistered users)
  const {
    analyzeText: analyzePreviewText,
    analyzeFile: analyzePreviewFile,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
    data: previewAnalysisResult,
    reset: resetPreview
  } = usePreviewAnalysis();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextSample(e.target.value);
  };

  const handleAnalysisTypeChange = (value: string) => {
    setAnalysisType(value as AnalysisType);
  };

  const handleAnalyze = () => {
    if (textSample.length < 100) {
      return;
    }
    
    // If user is not registered, use preview analysis
    if (!user) {
      analyzePreviewText(textSample, analysisType);
      return;
    }
    
    // Analyze with the selected analysis type for registered users
    if (analysisType === "cognitive") {
      analyzeCognitiveText(textSample);
    } else {
      analyzePsychologicalText(textSample);
    }
  };

  const handleReset = () => {
    // Reset all analysis types to ensure a clean state
    resetCognitive();
    resetPsychological();
    resetPreview();
    
    // Clear the text input
    setTextSample("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // If user is not registered, use preview analysis
    if (!user) {
      analyzePreviewFile(file, analysisType);
      return;
    }

    // Check if this is a text file (for simple reading) or a document (for server processing)
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'txt' || fileExt === 'text') {
      // For text files, use client-side reading
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setTextSample(text);
      };
      reader.readAsText(file);
    } else if (fileExt === 'pdf' || fileExt === 'doc' || fileExt === 'docx') {
      // For PDF, Word documents - send directly to server for processing
      if (analysisType === "cognitive") {
        analyzeCognitiveFile(file);
      } else {
        analyzePsychologicalFile(file);
      }
    } else {
      // For unsupported formats
      console.error("Unsupported file format");
      // You could set an error state here and show a message to the user
    }
  };

  // Determine loading, error and result states based on current analysis type and user status
  const isLoading = user 
    ? (analysisType === "cognitive" ? isCognitiveLoading : isPsychologicalLoading)
    : isPreviewLoading;
  
  const isError = user 
    ? (analysisType === "cognitive" ? isCognitiveError : isPsychologicalError)
    : isPreviewError;
  
  const error = user 
    ? (analysisType === "cognitive" ? cognitiveError : psychologicalError)
    : previewError;
  
  const hasResult = user 
    ? (analysisType === "cognitive" ? !!cognitiveResult : !!psychologicalResult)
    : !!previewAnalysisResult;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <Header onShowHelp={() => setShowHelp(true)} />

        {!isLoading && !hasResult && !isError && (
          <>
            <IntroSection 
              analysisType={analysisType}
              onAnalysisTypeChange={handleAnalysisTypeChange}
            />
            
            <InputSection 
              textSample={textSample}
              onTextChange={handleTextChange} 
              onAnalyze={handleAnalyze}
              onFileUpload={handleFileUpload}
              analysisType={analysisType}
            />
          </>
        )}
        
        {isLoading && (
          <ProcessingIndicator />
        )}
        
        {!isLoading && !isError && (
          <>
            {/* Show preview results for unregistered users */}
            {!user && previewAnalysisResult && (
              <PreviewResults 
                preview={previewAnalysisResult.preview}
                analysisType={previewAnalysisResult.analysisType}
                registrationMessage={previewAnalysisResult.registrationMessage}
                costs={previewAnalysisResult.costs}
                onNewAnalysis={handleReset}
              />
            )}
            
            {/* Show full results for registered users */}
            {user && cognitiveResult && analysisType === "cognitive" && (
              <ResultsSection 
                result={cognitiveResult} 
                onNewAnalysis={handleReset}
              />
            )}
            
            {user && psychologicalResult && analysisType === "psychological" && (
              <SimplePsychologicalResults 
                result={psychologicalResult}
                onNewAnalysis={handleReset}
              />
            )}
          </>
        )}
        
        {isError && (
          <ErrorSection 
            errorMessage={error?.message || "We were unable to process your text. Please check your input and try again."}
            onDismiss={handleReset}
          />
        )}
        
        <Footer />
        
        {showHelp && (
          <HelpModal 
            isOpen={showHelp} 
            onClose={() => setShowHelp(false)} 
          />
        )}
      </div>
    </div>
  );
}
