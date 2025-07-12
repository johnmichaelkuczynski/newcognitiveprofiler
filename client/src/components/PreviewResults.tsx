import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Eye, CreditCard, UserPlus, Sparkles } from "lucide-react";
import AuthModal from "./AuthModal";

interface PreviewResultsProps {
  preview: string;
  analysisType: string;
  registrationMessage: string;
  costs: Record<string, number>;
  onNewAnalysis: () => void;
}

export default function PreviewResults({ 
  preview, 
  analysisType, 
  registrationMessage, 
  costs, 
  onNewAnalysis 
}: PreviewResultsProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Preview Results Card */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-orange-600" />
            Preview Results
            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
              Limited View
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {preview}
            </div>
          </div>
          
          {/* Blur overlay for preview effect */}
          <div className="relative mt-4">
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent z-10 flex items-end justify-center pb-4">
              <div className="text-center space-y-2">
                <Lock className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600 font-medium">
                  Full analysis locked
                </p>
              </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg blur-sm">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Prompt */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Unlock Full Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              {registrationMessage}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">What you'll get with full access:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✓ Complete detailed analysis (not just previews)</li>
                <li>✓ Multi-provider AI analysis comparison</li>
                <li>✓ Comprehensive psychological reports</li>
                <li>✓ Document storage and management</li>
                <li>✓ Export to PDF and Word formats</li>
                <li>✓ Analysis history and tracking</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Analysis Costs:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Cognitive Analysis:</span>
                  <Badge variant="outline">{costs.cognitive} credits</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Psychological Analysis:</span>
                  <Badge variant="outline">{costs.psychological} credits</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Comprehensive Report:</span>
                  <Badge variant="outline">{costs.comprehensive_report} credits</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Psych Report:</span>
                  <Badge variant="outline">{costs.comprehensive_psychological_report} credits</Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="flex-1"
                size="lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Register Now
              </Button>
              <Button 
                variant="outline"
                onClick={onNewAnalysis}
                size="lg"
              >
                Try Another Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}