import { ZapIcon, PaperclipIcon, Layers, Upload, FileText } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { AnalysisType } from "@/types/analysis";

interface InputSectionProps {
  textSample: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAnalyze: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  analysisType: AnalysisType;
}

export default function InputSection({ 
  textSample,
  onTextChange, 
  onAnalyze,
  onFileUpload,
  analysisType
}: InputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = textSample.length;
  const isButtonDisabled = charCount < 100;
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Auto-resize textarea based on content, but limit maximum height
    if (textareaRef.current) {
      const maxHeight = 400; // Maximum height in pixels
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(maxHeight, Math.max(300, textareaRef.current.scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [textSample]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/rtf'
      ];
      
      if (allowedTypes.includes(file.type) || file.name.match(/\.(txt|pdf|doc|docx|rtf)$/i)) {
        // Create a synthetic event to match the expected interface
        const syntheticEvent = {
          target: {
            files: [file]
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onFileUpload(syntheticEvent);
      } else {
        alert('Please upload a valid file type: .txt, .pdf, .doc, .docx, or .rtf');
      }
    }
  };

  return (
    <section className="mb-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h2 className="font-heading font-semibold text-xl text-secondary-light">
            {analysisType === "cognitive" ? "Cognitive Profiling Analysis" : "Psychological Profiling Analysis"}
          </h2>
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 bg-secondary/5">
            <Layers className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Multi-Provider Analysis</span>
          </Badge>
        </div>
        
        <div className="mb-6">
          <div 
            className={`relative ${isDragging ? 'bg-blue-50 border-blue-300' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea 
              ref={textareaRef}
              id="text-input" 
              className={`w-full h-80 p-4 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 resize-y font-sans text-neutral-700 ${isDragging ? 'border-blue-300 bg-blue-50' : ''}`}
              placeholder={`Paste or type any text sample for ${analysisType} analysis. Or drag and drop a file (PDF, Word, TXT). Longer samples (500+ characters) provide more accurate profiling results.`}
              value={textSample}
              onChange={onTextChange}
            />
            
            {/* Drag and drop overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-100 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-700 font-medium">Drop your file here</p>
                  <p className="text-blue-600 text-sm">PDF, Word, or TXT files supported</p>
                </div>
              </div>
            )}
            
            {/* Paperclip upload button inside the textarea */}
            <div 
              className="absolute top-3 right-3 p-2 bg-white rounded-md border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
              onClick={handleFileButtonClick}
              title="Upload a document (PDF, Word, TXT)"
            >
              <PaperclipIcon className="h-5 w-5 text-neutral-600" />
              <input 
                ref={fileInputRef}
                id="file-upload" 
                type="file" 
                accept=".txt,.pdf,.doc,.docx,.rtf" 
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
            <p className="text-xs text-neutral-500">Supported formats: .txt, .pdf, .doc, .docx, .rtf • Drag and drop files directly</p>
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
