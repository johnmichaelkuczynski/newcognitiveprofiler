import { Progress } from "@/components/ui/progress";
import { Check, Loader2, AlertCircle } from "lucide-react";

type StreamingProgress = {
  zhi1: 'pending' | 'loading' | 'completed' | 'error';
  zhi2: 'pending' | 'loading' | 'completed' | 'error';
  zhi3: 'pending' | 'loading' | 'completed' | 'error';
  zhi4: 'pending' | 'loading' | 'completed' | 'error';
};

const providerInfo = {
  zhi1: { name: "Zhi1", color: "bg-gray-800" },
  zhi2: { name: "Zhi2", color: "bg-emerald-600" },
  zhi3: { name: "Zhi3", color: "bg-blue-600" },
  zhi4: { name: "Zhi4", color: "bg-purple-600" }
};

interface StreamingProcessingIndicatorProps {
  progress: StreamingProgress;
}

export default function StreamingProcessingIndicator({ progress }: StreamingProcessingIndicatorProps) {
  return (
    <section className="mb-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-20 h-20 mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-lg text-secondary-light mb-2">Analyzing with All Providers</h3>
          <p className="text-neutral-600 text-center mb-6">Running analysis across multiple AI models</p>
          
          <div className="w-full max-w-md space-y-3">
            {Object.entries(providerInfo).map(([key, info]) => {
              const status = progress[key as keyof StreamingProgress];
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${info.color}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{info.name}</span>
                      <div className="flex items-center gap-1">
                        {status === 'loading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {status === 'completed' && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        {status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={status === 'completed' ? 100 : status === 'loading' ? 50 : status === 'error' ? 100 : 0} 
                      className={`h-1.5 ${status === 'error' ? '[&>div]:bg-red-600' : ''}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
