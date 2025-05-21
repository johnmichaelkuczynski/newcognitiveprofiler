import { BrainIcon, ClipboardIcon, CodeIcon } from "lucide-react";

export default function IntroSection() {
  return (
    <section className="mb-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-card p-6 mb-8">
        <div className="flex items-start">
          <div className="flex-grow">
            <h2 className="font-heading font-semibold text-xl text-secondary-light mb-3">Cognitive Profile Analysis</h2>
            <p className="text-neutral-600 mb-4">This tool analyzes writing samples to generate a cognitive profile of the author. It assesses intelligence, reasoning style, and cognitive patterns without evaluating the quality or completeness of the text.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start mt-2">
              <div className="bg-neutral-50 rounded-lg p-3 flex-1">
                <div className="flex items-center text-primary mb-2">
                  <BrainIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Not a Grading Tool</span>
                </div>
                <p className="text-sm text-neutral-600">We don't evaluate quality, clarity, or completeness of writing.</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 flex-1">
                <div className="flex items-center text-primary mb-2">
                  <ClipboardIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Cognitive Fingerprint</span>
                </div>
                <p className="text-sm text-neutral-600">We treat each text as evidence of the author's cognitive patterns.</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 flex-1">
                <div className="flex items-center text-primary mb-2">
                  <CodeIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">AI Analysis</span>
                </div>
                <p className="text-sm text-neutral-600">Our AI examines thought patterns, not writing quality.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
