import { ZapIcon, PaperclipIcon, Layers } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InputSectionProps {
  textSample: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAnalyze: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputSection({ 
  textSample,
  onTextChange, 
  onAnalyze,
  onFileUpload
}: InputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = textSample.length;
  const isButtonDisabled = charCount < 100;

  useEffect(() => {
    // Auto-resize textarea based on content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(300, textareaRef.current.scrollHeight)}px`;
    }
  }, [textSample]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
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
        
        <div className="mb-6">
          <div className="relative">
            <textarea 
              ref={textareaRef}
              id="text-input" 
              className="w-full h-80 p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 resize-y font-sans text-neutral-700"
              placeholder="Paste or type any text sample for cognitive analysis. Longer samples (500+ characters) provide more accurate profiling results."
              value={textSample}
              onChange={onTextChange}
            />
            
            {/* Paperclip upload button inside the textarea */}
            <div 
              className="absolute top-3 right-3 p-2 bg-white rounded-md border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
              onClick={handleFileButtonClick}
              title="Upload a document"
            >
              <PaperclipIcon className="h-5 w-5 text-neutral-600" />
              <input 
                ref={fileInputRef}
                id="file-upload" 
                type="file" 
                accept=".txt,.doc,.docx,.pdf,.rtf" 
                className="hidden" 
                onChange={onFileUpload}
              />
            </div>
            
            {/* Character count */}
            <div className="absolute bottom-3 right-3 text-xs text-neutral-500 bg-white px-2 py-1 rounded">
              {charCount} characters {charCount < 100 ? "(minimum 100)" : ""}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-neutral-500">Supported formats: .txt, .doc, .docx, .pdf, .rtf</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700">
                Analysis using: OpenAI, Anthropic & Perplexity
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto"
            disabled={isButtonDisabled}
            onClick={onAnalyze}
            size="lg"
          >
            <ZapIcon className="h-5 w-5 mr-2" />
            <span>Analyze with All Providers</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
