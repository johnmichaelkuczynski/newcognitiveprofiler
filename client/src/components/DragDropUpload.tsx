import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, File, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DragDropUploadProps {
  onFileUpload: (file: File) => void;
  onTextChange: (text: string) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

const SUPPORTED_FORMATS = [
  { ext: 'pdf', name: 'PDF Documents', icon: FileText },
  { ext: 'doc', name: 'Word Documents', icon: FileText },
  { ext: 'docx', name: 'Word Documents', icon: FileText },
  { ext: 'txt', name: 'Text Files', icon: File },
  { ext: 'rtf', name: 'Rich Text Format', icon: FileText }
];

export default function DragDropUpload({ 
  onFileUpload, 
  onTextChange, 
  isUploading = false, 
  disabled = false 
}: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    return SUPPORTED_FORMATS.some(format => format.ext === fileExt);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        handleFileSelection(file);
      }
    }
  }, [disabled]);

  const handleFileSelection = async (file: File) => {
    setSelectedFile(file);
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt === 'txt') {
      // Handle text files client-side
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onTextChange(text);
        setSelectedFile(null);
      };
      reader.readAsText(file);
    } else {
      // Handle PDF, Word documents server-side
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      try {
        await onFileUpload(file);
        setUploadProgress(100);
        setTimeout(() => {
          setSelectedFile(null);
          setUploadProgress(0);
        }, 1000);
      } catch (error) {
        console.error('Upload failed:', error);
        setSelectedFile(null);
        setUploadProgress(0);
      } finally {
        clearInterval(progressInterval);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      handleFileSelection(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const format = SUPPORTED_FORMATS.find(f => f.ext === ext);
    return format?.icon || File;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-2 border-dashed transition-all duration-200 hover:border-primary/50">
        <CardContent className="p-8">
          <div
            className={`relative transition-all duration-200 ${
              isDragOver ? 'scale-105' : 'scale-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Upload Area */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className={`h-8 w-8 ${isDragOver ? 'text-primary animate-bounce' : 'text-primary/60'}`} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isDragOver ? 'Drop your file here' : 'Upload Document'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop your document or click to browse
              </p>

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="mb-6"
              >
                Browse Files
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled}
              />
            </div>

            {/* Supported Formats */}
            <div className="mt-6 border-t pt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Supported Formats:</h4>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_FORMATS.map((format) => (
                  <Badge key={format.ext} variant="secondary" className="flex items-center gap-1">
                    <format.icon className="h-3 w-3" />
                    <span className="uppercase">{format.ext}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* File Selected */}
            {selectedFile && (
              <div className="mt-6 border-t pt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {React.createElement(getFileIcon(selectedFile.name), { className: "h-8 w-8 text-primary" })}
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-24">
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                    {uploadProgress === 100 && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Drag overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-primary/5 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-primary mx-auto mb-2 animate-bounce" />
                  <p className="text-primary font-medium">Drop your file here</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}