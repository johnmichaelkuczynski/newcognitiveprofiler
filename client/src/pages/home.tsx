import { useState } from "react";
import IntroSection from "@/components/IntroSection";
import InputSection from "@/components/InputSection";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import ResultsSection from "@/components/ResultsSection";
import ErrorSection from "@/components/ErrorSection";
import HelpModal from "@/components/HelpModal";
import Footer from "@/components/Footer";
import { useCognitiveAnalysis } from "@/hooks/useCognitiveAnalysis";
import { CognitiveAnalysisResult, ModelProvider } from "@/types/analysis";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);
  const [textSample, setTextSample] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelProvider>("openai");
  
  const {
    analyzeText,
    isLoading,
    isError,
    error,
    data: analysisResult,
    reset
  } = useCognitiveAnalysis();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextSample(e.target.value);
  };

  const handleAnalyze = () => {
    if (textSample.length < 100) {
      return;
    }
    analyzeText(textSample, selectedModel);
  };

  const handleModelChange = (model: ModelProvider) => {
    setSelectedModel(model);
  };

  const handleReset = () => {
    reset();
    setTextSample("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTextSample(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-secondary">Cognitive Profiler</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowHelp(true)}
              className="text-neutral-600 hover:text-primary p-2 rounded-full transition"
            >
              <AlertCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 sm:py-8 md:py-12">
        <IntroSection />
        
        {!isLoading && !analysisResult && !isError && (
          <InputSection 
            textSample={textSample}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            onTextChange={handleTextChange} 
            onAnalyze={handleAnalyze}
            onFileUpload={handleFileUpload}
          />
        )}
        
        {isLoading && (
          <ProcessingIndicator />
        )}
        
        {analysisResult && !isLoading && !isError && (
          <ResultsSection 
            result={analysisResult} 
            onNewAnalysis={handleReset}
          />
        )}
        
        {isError && (
          <ErrorSection 
            errorMessage={error?.message || "We were unable to process your text. Please check your input and try again."}
            onDismiss={reset}
          />
        )}
      </main>

      <Footer />
      
      {showHelp && (
        <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
        />
      )}
    </div>
  );
}
