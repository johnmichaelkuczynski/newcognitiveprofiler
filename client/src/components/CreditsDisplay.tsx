import { Coins } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface CreditsDisplayProps {
  credits: {
    zhi1: number;
    zhi2: number;
    zhi3: number;
    zhi4: number;
  };
  onPurchaseClick?: () => void;
  className?: string;
}

export default function CreditsDisplay({ credits, onPurchaseClick, className }: CreditsDisplayProps) {
  const totalCredits = credits.zhi1 + credits.zhi2 + credits.zhi3 + credits.zhi4;
  const hasLowCredits = totalCredits < 1000; // Flag if total is below 1000 words
  
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="font-semibold text-neutral-900">Credits</span>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono">
              Zhi1: {credits.zhi1.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="font-mono">
              Zhi2: {credits.zhi2.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="font-mono">
              Zhi3: {credits.zhi3.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="font-mono">
              Zhi4: {credits.zhi4.toLocaleString()}
            </Badge>
          </div>
        </div>
        
        {onPurchaseClick && hasLowCredits && (
          <Button 
            onClick={onPurchaseClick} 
            variant="default" 
            size="sm"
            data-testid="button-purchase-credits"
          >
            Purchase Credits
          </Button>
        )}
      </div>
    </Card>
  );
}
