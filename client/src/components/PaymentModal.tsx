import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Loader2, Check } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (newCredits: number) => void;
  currentCredits: number;
}

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess, currentCredits }: PaymentModalProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      const response = await apiRequest("GET", "/api/credit-packages");
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
      // Create PayPal order
      const orderResponse = await apiRequest("POST", "/api/create-order", {
        packageId: selectedPackage
      });
      const { orderId } = await orderResponse.json();

      // For demo purposes, simulate PayPal payment success
      // In production, this would integrate with PayPal SDK
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture the payment
      const captureResponse = await apiRequest("POST", "/api/capture-order", {
        orderId
      });
      const result = await captureResponse.json();

      if (result.success) {
        toast({
          title: "Payment successful!",
          description: `Credits added to your account. New balance: ${result.credits} credits`
        });
        onPaymentSuccess(result.credits);
        onClose();
      } else {
        throw new Error("Payment capture failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Buy Credits
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Current Credits: <span className="font-semibold">{currentCredits}</span>
            </p>
          </div>

          <div className="space-y-3">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPackage === pkg.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">${pkg.price}</div>
                      <div className="text-sm text-gray-500">{pkg.credits} credits</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      ${(pkg.price / pkg.credits).toFixed(2)} per credit
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
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              className="flex-1"
              disabled={!selectedPackage || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay with PayPal"
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center mt-4">
            Secure payment powered by PayPal
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}