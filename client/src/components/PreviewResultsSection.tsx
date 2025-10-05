import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, UserPlus, CreditCard, Eye, Zap } from "lucide-react";

interface PreviewResultProps {
  result: {
    preview: true;
    provider: string;
    analysis: any;
    message: string;
  };
  onRegister: () => void;
  onBuyCredits: () => void;
  onNewAnalysis: () => void;
  userStatus: 'guest' | 'registered' | 'insufficient-credits';
}

export default function PreviewResultsSection({ 
  result, 
  onRegister, 
  onBuyCredits, 
  onNewAnalysis,
  userStatus 
}: PreviewResultProps) {
  const { analysis } = result;

  return (
    <div className="space-y-6">
      {/* Preview Badge */}
      <div className="flex justify-center">
        <Badge variant="secondary" className="px-4 py-2 text-sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview Analysis
        </Badge>
      </div>

      {/* Preview Results */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analysis Preview</span>
              <Badge variant="outline">Zhi1</Badge>
            </CardTitle>
            <CardDescription>
              Limited preview of cognitive analysis results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Intelligence Score</h4>
              <div className="text-2xl font-bold text-blue-600">
                {analysis.intelligenceScore}/100
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Key Characteristics</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.characteristics?.slice(0, 3).map((char: string, index: number) => (
                  <Badge key={index} variant="secondary">{char}</Badge>
                ))}
                {analysis.characteristics?.length > 3 && (
                  <Badge variant="outline">
                    +{analysis.characteristics.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Analysis Summary</h4>
              <p className="text-sm text-gray-600 line-clamp-3">
                {analysis.detailedAnalysis?.substring(0, 200)}
                {analysis.detailedAnalysis?.length > 200 && "..."}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Detailed Analysis Locked
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Get comprehensive analysis from multiple AI providers including Zhi2, Zhi3, and Zhi4
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>• Detailed cognitive breakdown</div>
                <div>• Comprehensive reports</div>
                <div>• Multiple AI perspectives</div>
                <div>• Downloadable documents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">
              {userStatus === 'guest' 
                ? 'Unlock Full Analysis' 
                : 'Buy Credits for Full Analysis'
              }
            </CardTitle>
            <CardDescription className="text-blue-700">
              {userStatus === 'guest'
                ? 'Register to access comprehensive multi-provider analysis'
                : 'Purchase credits to unlock detailed analysis features'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {userStatus === 'guest' ? (
                <Button 
                  onClick={onRegister}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Free
                </Button>
              ) : (
                <Button 
                  onClick={onBuyCredits}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onNewAnalysis}
                className="flex-1"
              >
                <Zap className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}