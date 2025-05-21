import { CloudUploadIcon, ZapIcon } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModelProvider } from "@/types/analysis";

interface InputSectionProps {
  textSample: string;
  selectedModel: ModelProvider;
  onModelChange: (value: ModelProvider) => void;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAnalyze: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputSection({ 
  textSample,
  selectedModel,
  onModelChange, 
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
      textareaRef.current.style.height = `${Math.max(164, textareaRef.current.scrollHeight)}px`;
    }
  }, [textSample]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="mb-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-6">
        <h2 className="font-heading font-semibold text-xl text-secondary-light mb-4">Submit Writing Sample</h2>
        
        <div className="mb-6">
          <div className="relative">
            <textarea 
              ref={textareaRef}
              id="text-input" 
              className="w-full h-64 p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 resize-y font-sans text-neutral-700"
              placeholder="Paste or type any text sample for cognitive analysis. This could be an essay, article, email, journal entry, or any other written content."
              value={textSample}
              onChange={onTextChange}
            />
            <div className="absolute bottom-3 right-3 text-xs text-neutral-500">
              {charCount} characters
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-2">For best results, submit at least 300 characters of authentic writing.</p>
        </div>

        <div className="mb-4">
          <label htmlFor="model-select" className="block mb-2 text-sm font-medium text-neutral-700">
            AI Model Provider
          </label>
          <Select value={selectedModel} onValueChange={(value: ModelProvider) => onModelChange(value)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select AI model provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude 3.7 Sonnet)</SelectItem>
              <SelectItem value="perplexity">Perplexity (Llama 3.1 Sonar)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-500 mt-1">Different models may produce varying analysis results.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              onClick={handleFileButtonClick}
            >
              <CloudUploadIcon className="h-5 w-5" />
              <span>Upload Document</span>
              <input 
                ref={fileInputRef}
                id="file-upload" 
                type="file" 
                accept=".txt,.doc,.docx,.pdf,.rtf" 
                className="hidden" 
                onChange={onFileUpload}
              />
            </Button>
            <p className="text-xs text-neutral-500 mt-1">Supported formats: .txt, .doc, .docx, .pdf, .rtf</p>
          </div>
          
          <Button
            className="w-full sm:w-auto"
            disabled={isButtonDisabled}
            onClick={onAnalyze}
          >
            <ZapIcon className="h-5 w-5 mr-2" />
            <span>Analyze Writing</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
