import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-heading font-semibold text-secondary-light">
              About Cognitive Profiler
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          <div className="w-full h-40 bg-neutral-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-70">
              <circle cx="50" cy="50" r="30" fill="#4A56E2" opacity="0.2" />
              <path d="M50 20c16.569 0 30 13.431 30 30 0 16.569-13.431 30-30 30-16.569 0-30-13.431-30-30 0-16.569 13.431-30 30-30zm0 5c-13.807 0-25 11.193-25 25s11.193 25 25 25 25-11.193 25-25-11.193-25-25-25z" fill="#4A56E2" />
              <path d="M50 35v10M50 55v5" stroke="#4A56E2" strokeWidth="3" strokeLinecap="round" />
              <path d="M35 35L65 65M35 65L65 35" stroke="#4A56E2" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            </svg>
          </div>
          
          <h4 className="font-heading font-medium text-lg text-secondary-light mb-3">What This Tool Does</h4>
          <p className="text-neutral-700 mb-4">The Cognitive Profiler analyzes writing samples to generate insights about the author's cognitive patterns, reasoning style, and estimated intelligence level. Unlike traditional writing assessment tools, we don't evaluate the quality, completeness, or clarity of the writing itself.</p>
          
          <h4 className="font-heading font-medium text-lg text-secondary-light mb-3">How It Works</h4>
          <ol className="list-decimal pl-5 text-neutral-700 space-y-2 mb-4">
            <li>You submit a writing sample (at least 300 characters for best results)</li>
            <li>Our AI analyzes the cognitive patterns and reasoning styles evident in the text</li>
            <li>The system generates a comprehensive profile including an intelligence estimate on a 1-100 scale</li>
            <li>You receive detailed insights about the cognitive characteristics revealed in the writing</li>
          </ol>
          
          <h4 className="font-heading font-medium text-lg text-secondary-light mb-3">Important Notes</h4>
          <ul className="list-disc pl-5 text-neutral-700 space-y-2">
            <li>This tool analyzes cognitive patterns, not writing quality or grammar</li>
            <li>The analysis is based solely on the submitted text and doesn't consider external factors</li>
            <li>For most accurate results, submit authentic writing samples</li>
            <li>The system doesn't store your text after analysis is complete</li>
            <li>Results are for informational purposes only and should be interpreted as one data point among many</li>
          </ul>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose}>
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
