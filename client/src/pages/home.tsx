import { useState } from "react";
import IntroSection from "@/components/IntroSection";
import InputSection from "@/components/InputSection";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import ResultsSection from "@/components/ResultsSection";
import SimplePsychologicalResults from "@/components/SimplePsychologicalResults";
import ErrorSection from "@/components/ErrorSection";
import HelpModal from "@/components/HelpModal";
import AuthModal from "@/components/AuthModal";
import CreditsDisplay from "@/components/CreditsDisplay";
import StripePaymentModal from "@/components/StripePaymentModal";
import Footer from "@/components/Footer";
import { useCognitiveAnalysis } from "@/hooks/useCognitiveAnalysis";
import { usePsychologicalAnalysis } from "@/hooks/usePsychologicalAnalysis";
import { useAuth } from "@/hooks/useAuth";
import { AnalysisType } from "@/types/analysis";
import { AlertCircle, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [showHelp, setShowHelp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [textSample, setTextSample] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("cognitive");
  
  // Auth hook
  const { user, isAuthenticated, login, logout, updateAllCredits } = useAuth();
  const { toast } = useToast();
  
  // Credit update handler
  const handleCreditsUpdate = (credits: { zhi1: number; zhi2: number; zhi3: number; zhi4: number }) => {
    updateAllCredits(credits);
  };
  
  // Cognitive analysis hook
  const {
    analyzeText: analyzeCognitiveText,
    analyzeFile: analyzeCognitiveFile,
    isLoading: isCognitiveLoading,
    isError: isCognitiveError,
    error: cognitiveError,
    data: cognitiveResult,
    reset: resetCognitive
  } = useCognitiveAnalysis(handleCreditsUpdate);
  
  // Psychological analysis hook
  const {
    analyzeText: analyzePsychologicalText,
    analyzeFile: analyzePsychologicalFile,
    isLoading: isPsychologicalLoading,
    isError: isPsychologicalError,
    error: psychologicalError,
    data: psychologicalResult,
    reset: resetPsychological
  } = usePsychologicalAnalysis(handleCreditsUpdate);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextSample(e.target.value);
  };

  const handleAnalysisTypeChange = (value: string) => {
    setAnalysisType(value as AnalysisType);
  };

  const handleAnalyze = async () => {
    if (textSample.length < 100) {
      return;
    }
    
    // Run full analysis for everyone - no authentication required
    if (analysisType === "cognitive") {
      analyzeCognitiveText(textSample);
    } else {
      analyzePsychologicalText(textSample);
    }
  };

  const handleReset = () => {
    // Reset both analysis types to ensure a clean state
    resetCognitive();
    resetPsychological();
    
    // Clear the text input
    setTextSample("");
  };

  const handleSwitchAnalysisType = (text: string, newType: AnalysisType) => {
    // Switch to the new analysis type
    setAnalysisType(newType);
    
    // Store the text
    setTextSample(text);
    
    // Run analysis with the new type - no authentication required
    if (newType === "cognitive") {
      analyzeCognitiveText(text);
    } else {
      analyzePsychologicalText(text);
    }
  };

  const handleRegister = () => {
    setAuthTab("register");
    setShowAuth(true);
  };

  const handleLogin = () => {
    setAuthTab("login");
    setShowAuth(true);
  };

  const handleAuthSuccess = (userData: any) => {
    login(userData);
    toast({
      title: "Welcome!",
      description: `You're now logged in as ${userData.username}`
    });
  };

  const handleLogout = async () => {
    await logout();
    handleReset();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
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
      // For PDF, Word documents - send directly to server for processing - no auth required
      if (analysisType === "cognitive") {
        analyzeCognitiveFile(file);
      } else {
        analyzePsychologicalFile(file);
      }
    } else {
      // For unsupported formats
      toast({
        title: "Unsupported File",
        description: "Please upload a .txt, .pdf, .doc, or .docx file.",
        variant: "destructive"
      });
    }
  };

  // Determine loading, error and result states based on the current analysis type
  const isLoading = analysisType === "cognitive" ? isCognitiveLoading : isPsychologicalLoading;
  const isError = analysisType === "cognitive" ? isCognitiveError : isPsychologicalError;
  const error = analysisType === "cognitive" ? cognitiveError : psychologicalError;
  const hasResult = analysisType === "cognitive" ? !!cognitiveResult : !!psychologicalResult;

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
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-secondary">Mind Profiler</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <Badge variant="outline" className="px-3 py-1">
                  <User className="h-4 w-4 mr-1" />
                  {user.username}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-neutral-600 hover:text-primary"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogin}
                >
                  Login
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleRegister}
                >
                  Register
                </Button>
              </div>
            )}
            
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
        {/* Credits Display */}
        {isAuthenticated && user && (
          <CreditsDisplay 
            credits={{
              zhi1: user.credits_zhi1,
              zhi2: user.credits_zhi2,
              zhi3: user.credits_zhi3,
              zhi4: user.credits_zhi4
            }}
            onPurchaseClick={() => setShowPayment(true)}
            className="mb-6"
          />
        )}
        
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
            {cognitiveResult && analysisType === "cognitive" && (
              <ResultsSection 
                result={cognitiveResult} 
                onNewAnalysis={handleReset}
                onSwitchAnalysisType={(text) => handleSwitchAnalysisType(text, "psychological")}
              />
            )}
            
            {psychologicalResult && analysisType === "psychological" && (
              <SimplePsychologicalResults 
                result={psychologicalResult}
                onNewAnalysis={handleReset}
                onSwitchAnalysisType={(text) => handleSwitchAnalysisType(text, "cognitive")}
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
      </main>

      <Footer />
      
      {/* Modals */}
      {showHelp && (
        <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
        />
      )}
      
      {showAuth && (
        <AuthModal 
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleAuthSuccess}
          defaultTab={authTab}
        />
      )}

      {showPayment && isAuthenticated && user && (
        <StripePaymentModal 
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          currentCredits={{
            zhi1: user.credits_zhi1,
            zhi2: user.credits_zhi2,
            zhi3: user.credits_zhi3,
            zhi4: user.credits_zhi4
          }}
        />
      )}
    </div>
  );
}
