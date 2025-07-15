import { ZapIcon, Layers, Type, FileText } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DragDropUpload from "./DragDropUpload";

interface InputSectionProps {
  textSample: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAnalyze: () => void;
  onFileUpload: (file: File) => void;
  isUploading?: boolean;
}

export default function InputSection({ 
  textSample,
  onTextChange, 
  onAnalyze,
  onFileUpload,
  isUploading = false
}: InputSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState("text");
  const charCount = textSample.length;
  const isButtonDisabled = charCount < 100;

  useEffect(() => {
    // Auto-resize textarea based on content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(300, textareaRef.current.scrollHeight)}px`;
    }
  }, [textSample]);

  const handleTextUpdate = (text: string) => {
    // Create a synthetic event for consistency
    const syntheticEvent = {
      target: { value: text }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onTextChange(syntheticEvent);
    setActiveTab("text"); // Switch to text tab when file is processed
  };

  const handleFileUploadWrapper = async (file: File) => {
    await onFileUpload(file);
  };

  return (
    <section className="mb-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h2 className="font-heading font-semibold text-xl text-secondary-light">Cognitive Profiling Analysis</h2>
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-secondary/5">
            <Layers className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Multi-Provider Analysis</span>
          </Badge>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <div className="relative">
              <textarea 
                ref={textareaRef}
                id="text-input" 
                className="w-full h-80 p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 resize-y font-sans text-neutral-700"
                placeholder="Paste or type any text sample for cognitive analysis. Longer samples (500+ characters) provide more accurate profiling results."
                value={textSample}
                onChange={onTextChange}
              />
              
              {/* Character count */}
              <div className="absolute bottom-3 right-3 text-xs text-neutral-500 bg-white px-2 py-1 rounded">
                {charCount} characters {charCount < 100 ? "(minimum 100)" : ""}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-neutral-500">
                Enter text directly or switch to document upload
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700">
                  Analysis using: OpenAI, Anthropic & Perplexity
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-4">
            <DragDropUpload
              onFileUpload={handleFileUploadWrapper}
              onTextChange={handleTextUpdate}
              isUploading={isUploading}
              disabled={isUploading}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto"
            disabled={isButtonDisabled || isUploading}
            onClick={onAnalyze}
            size="lg"
          >
            <ZapIcon className="h-5 w-5 mr-2" />
            <span>
              {isUploading ? "Processing..." : "Analyze with All Providers"}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
