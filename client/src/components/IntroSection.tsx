import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisType } from "@/types/analysis";
import { BrainCircuit, Heart } from "lucide-react";

interface IntroSectionProps {
  analysisType: AnalysisType;
  onAnalysisTypeChange: (type: AnalysisType) => void;
}

export default function IntroSection({ analysisType, onAnalysisTypeChange }: IntroSectionProps) {
  const handleValueChange = (value: string) => {
    onAnalysisTypeChange(value as AnalysisType);
  };

  return (
    <section className="mb-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="font-heading font-bold text-2xl text-secondary-light mb-4">
          Mind Profiler
        </h1>
        
        <p className="text-neutral-700 mb-6">
          Analyze writing samples to generate insights about the author's cognitive and psychological patterns. 
          Choose the type of analysis you want to perform below.
        </p>
        
        <Tabs 
          value={analysisType}
          onValueChange={handleValueChange}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="cognitive" className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              <span>Cognitive</span>
            </TabsTrigger>
            <TabsTrigger value="psychological" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>Psychological</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cognitive" className="mt-0">
            <div className="border-l-4 border-primary pl-4 py-1">
              <h2 className="text-lg font-heading font-semibold text-secondary mb-2 flex items-center">
                <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
                Cognitive Analysis
              </h2>
              <p className="text-neutral-600">
                Analyzes your writing to profile your cognitive patterns, reasoning style, and intellectual characteristics.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="psychological" className="mt-0">
            <div className="border-l-4 border-primary pl-4 py-1">
              <h2 className="text-lg font-heading font-semibold text-secondary mb-2 flex items-center">
                <Heart className="mr-2 h-5 w-5 text-primary" />
                Psychological Analysis
              </h2>
              <p className="text-neutral-600">
                Analyzes your writing to profile your emotional patterns, motivational structure, and interpersonal dynamics.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
