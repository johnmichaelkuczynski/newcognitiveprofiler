import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Loader2, Check } from "lucide-react";
import { SiStripe } from "react-icons/si";

interface StripeCreditPackage {
  id: string;
  name: string;
  price: number;
  wordCredits: {
    zhi1: number;
    zhi2: number;
    zhi3: number;
    zhi4: number;
  };
  description: string;
}

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: {
    zhi1: number;
    zhi2: number;
    zhi3: number;
    zhi4: number;
  };
}

export default function StripePaymentModal({ isOpen, onClose, currentCredits }: StripePaymentModalProps) {
  const [packages, setPackages] = useState<StripeCreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      const response = await apiRequest("GET", "/api/stripe-packages");
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load credit packages",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      toast({
        title: "Please select a package",
        description: "Choose a credit package to continue",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create Stripe checkout session
      const response = await apiRequest("POST", "/api/create-checkout", {
        packageId: selectedPackage
      });
      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to create checkout session",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const totalWords = (pkg: StripeCreditPackage) => {
    return pkg.wordCredits.zhi1 + pkg.wordCredits.zhi2 + pkg.wordCredits.zhi3 + pkg.wordCredits.zhi4;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Buy Credits
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-semibold">Zhi1</p>
              <p className="text-sm font-bold text-blue-900">{currentCredits.zhi1.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-semibold">Zhi2</p>
              <p className="text-sm font-bold text-blue-900">{currentCredits.zhi2.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-semibold">Zhi3</p>
              <p className="text-sm font-bold text-blue-900">{currentCredits.zhi3.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-semibold">Zhi4</p>
              <p className="text-sm font-bold text-blue-900">{currentCredits.zhi4.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPackage === pkg.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
                data-testid={`card-package-${pkg.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">${pkg.price}</div>
                      <div className="text-sm text-gray-500">{totalWords(pkg).toLocaleString()} total words</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="text-xs text-center">
                      <p className="text-gray-500">Zhi1</p>
                      <p className="font-semibold">{pkg.wordCredits.zhi1.toLocaleString()}</p>
                    </div>
                    <div className="text-xs text-center">
                      <p className="text-gray-500">Zhi2</p>
                      <p className="font-semibold">{pkg.wordCredits.zhi2.toLocaleString()}</p>
                    </div>
                    <div className="text-xs text-center">
                      <p className="text-gray-500">Zhi3</p>
                      <p className="font-semibold">{pkg.wordCredits.zhi3.toLocaleString()}</p>
                    </div>
                    <div className="text-xs text-center">
                      <p className="text-gray-500">Zhi4</p>
                      <p className="font-semibold">{pkg.wordCredits.zhi4.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      ~${(pkg.price / totalWords(pkg) * 1000).toFixed(2)} per 1000 words
                    </div>
                    {selectedPackage === pkg.id && (
                      <Badge variant="default" className="bg-blue-600">
                        <Check className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              className="flex-1"
              disabled={!selectedPackage || isProcessing}
              data-testid="button-checkout"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <SiStripe className="mr-2 h-4 w-4" />
                  Checkout with Stripe
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
            <span>Secure payment powered by</span>
            <SiStripe className="h-4 w-4" />
            <span>Stripe</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
