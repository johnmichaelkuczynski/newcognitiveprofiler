import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorSectionProps {
  errorMessage: string;
  onDismiss: () => void;
}

export default function ErrorSection({ errorMessage, onDismiss }: ErrorSectionProps) {
  return (
    <section className="mb-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-6 border border-error border-opacity-50">
        <div className="flex items-center gap-4 text-error mb-4">
          <AlertCircle className="h-8 w-8" />
          <h3 className="font-heading font-semibold text-lg">Analysis Error</h3>
        </div>
        <p className="text-neutral-700 mb-4">{errorMessage}</p>
        <ul className="text-sm text-neutral-600 mb-6 list-disc pl-5 space-y-1">
          <li>Ensure your text is at least 100 characters</li>
          <li>Check for any special characters that might cause issues</li>
          <li>If uploading a file, make sure it's in a supported format</li>
        </ul>
        <Button
          variant="outline"
          onClick={onDismiss}
        >
          Try Again
        </Button>
      </div>
    </section>
  );
}
