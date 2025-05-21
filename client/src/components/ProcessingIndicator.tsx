import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export default function ProcessingIndicator() {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Simulates progress for visual feedback
    // Real progress would be determined by the API response
    const simulateProgress = () => {
      interval = setInterval(() => {
        setProgress((prev) => {
          // Move quickly to 90%, then slow down
          if (prev < 30) return prev + 15;
          if (prev < 60) return prev + 8;
          if (prev < 85) return prev + 3;
          if (prev < 95) return prev + 0.5;
          return prev;
        });
      }, 300);
    };

    simulateProgress();

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="mb-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-lg text-secondary-light mb-2">Analyzing Cognitive Patterns</h3>
          <p className="text-neutral-600 text-center mb-4">Our AI is examining the text to identify cognitive fingerprints and reasoning patterns.</p>
          <div className="w-64 mb-2">
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-neutral-500 text-sm">This may take a few moments</p>
        </div>
      </div>
    </section>
  );
}
