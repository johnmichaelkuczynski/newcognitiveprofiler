import { useState } from "react";
import Header from "@/components/Header";
import IntroSection from "@/components/IntroSection";
import InputSection from "@/components/InputSection";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import ResultsSection from "@/components/ResultsSection";
import SimplePsychologicalResults from "@/components/SimplePsychologicalResults";
import ComprehensiveCognitiveProfiler from "@/components/ComprehensiveCognitiveProfiler";
import ComprehensivePsychologicalProfiler from "@/components/ComprehensivePsychologicalProfiler";
import ErrorSection from "@/components/ErrorSection";
import HelpModal from "@/components/HelpModal";
import Footer from "@/components/Footer";
import { useCognitiveAnalysis } from "@/hooks/useCognitiveAnalysis";
import { usePsychologicalAnalysis } from "@/hooks/usePsychologicalAnalysis";
import { AnalysisType } from "@/types/analysis";
import { AlertCircle, BrainCircuit, Heart, Brain, HeartPulse } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);
  const [textSample, setTextSample] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("cognitive");
  const [activeTab, setActiveTab] = useState("basic-cognitive");
  
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
    
    // Analyze with the selected analysis type
    if (analysisType === "cognitive") {
      analyzeCognitiveText({ text: textSample });
    } else {
      analyzePsychologicalText({ text: textSample });
    }
  };

  const handleReset = () => {
    // Reset all analysis types to ensure a clean state
    resetCognitive();
    resetPsychological();
    
    // Clear the text input
    setTextSample("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        analyzeCognitiveFile({ file });
      } else {
        analyzePsychologicalFile({ file });
      }
    } else {
      // For unsupported formats
      console.error("Unsupported file format");
      // You could set an error state here and show a message to the user
    }
  };

  // Determine loading, error and result states based on current analysis type
  const isLoading = analysisType === "cognitive" ? isCognitiveLoading : isPsychologicalLoading;
  const isError = analysisType === "cognitive" ? isCognitiveError : isPsychologicalError;
  const error = analysisType === "cognitive" ? cognitiveError : psychologicalError;
  
  // Check for results
  const hasResult = analysisType === "cognitive" ? !!cognitiveResult : !!psychologicalResult;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <Header onShowHelp={() => setShowHelp(true)} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic-cognitive" className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              Basic Cognitive
            </TabsTrigger>
            <TabsTrigger value="basic-psychological" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Basic Psychological
            </TabsTrigger>
            <TabsTrigger value="comprehensive-cognitive" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Comprehensive Cognitive
            </TabsTrigger>
            <TabsTrigger value="comprehensive-psychological" className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              Comprehensive Psychological
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic-cognitive" className="mt-6">
            {!isLoading && !hasResult && !isError && (
              <>
                <IntroSection 
                  analysisType="cognitive"
                  onAnalysisTypeChange={handleAnalysisTypeChange}
                />
                
                <InputSection 
                  textSample={textSample}
                  onTextChange={handleTextChange} 
                  onAnalyze={() => {
                    setAnalysisType("cognitive");
                    handleAnalyze();
                  }}
                  onFileUpload={handleFileUpload}
                  analysisType="cognitive"
                />
              </>
            )}
            
            {isLoading && analysisType === "cognitive" && (
              <ProcessingIndicator />
            )}
            
            {!isLoading && !isError && cognitiveResult && (
              <ResultsSection 
                result={cognitiveResult} 
                onNewAnalysis={handleReset}
              />
            )}
            
            {isError && analysisType === "cognitive" && (
              <ErrorSection 
                errorMessage={error?.message || "We were unable to process your text. Please check your input and try again."}
                onDismiss={handleReset}
              />
            )}
          </TabsContent>

          <TabsContent value="basic-psychological" className="mt-6">
            {!isLoading && !hasResult && !isError && (
              <>
                <IntroSection 
                  analysisType="psychological"
                  onAnalysisTypeChange={handleAnalysisTypeChange}
                />
                
                <InputSection 
                  textSample={textSample}
                  onTextChange={handleTextChange} 
                  onAnalyze={() => {
                    setAnalysisType("psychological");
                    handleAnalyze();
                  }}
                  onFileUpload={handleFileUpload}
                  analysisType="psychological"
                />
              </>
            )}
            
            {isLoading && analysisType === "psychological" && (
              <ProcessingIndicator />
            )}
            
            {!isLoading && !isError && psychologicalResult && (
              <SimplePsychologicalResults 
                result={psychologicalResult}
                onNewAnalysis={handleReset}
              />
            )}
            
            {isError && analysisType === "psychological" && (
              <ErrorSection 
                errorMessage={error?.message || "We were unable to process your text. Please check your input and try again."}
                onDismiss={handleReset}
              />
            )}
          </TabsContent>

          <TabsContent value="comprehensive-cognitive" className="mt-6">
            <ComprehensiveCognitiveProfiler />
          </TabsContent>

          <TabsContent value="comprehensive-psychological" className="mt-6">
            <ComprehensivePsychologicalProfiler />
          </TabsContent>
        </Tabs>
        
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
