import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Check, AlertCircle, Zap } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query to get pricing tiers
  const { data: pricingTiers } = useQuery({
    queryKey: ["/api/pricing"],
    enabled: isOpen
  });

  // Mutation to create payment intent
  const createPaymentMutation = useMutation({
    mutationFn: async (tier: string) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", { tier });
      return response.json();
    },
    onSuccess: async (data) => {
      const stripe = await stripePromise;
      if (!stripe) {
        setError("Stripe failed to load");
        return;
      }

      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: {
            // This would be replaced with actual card input elements
            number: "4242424242424242",
            exp_month: 12,
            exp_year: 2030,
            cvc: "123",
          },
        },
      });

      if (error) {
        setError(error.message || "Payment failed");
      } else {
        // Payment successful, close modal
        onClose();
        // Refresh user data
        window.location.reload();
      }
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create payment");
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handlePurchase = async (tier: string) => {
    setError(null);
    setIsProcessing(true);
    setSelectedTier(tier);
    
    try {
      await createPaymentMutation.mutateAsync(tier);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "tier1": return "bg-blue-100 border-blue-300 text-blue-800";
      case "tier2": return "bg-green-100 border-green-300 text-green-800";
      case "tier3": return "bg-purple-100 border-purple-300 text-purple-800";
      case "tier4": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "tier1": return <CreditCard className="h-5 w-5" />;
      case "tier2": return <Check className="h-5 w-5" />;
      case "tier3": return <Zap className="h-5 w-5" />;
      case "tier4": return <Zap className="h-5 w-5 text-yellow-600" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          {pricingTiers && Object.entries(pricingTiers).map(([tierKey, tierData]: [string, any]) => (
            <Card 
              key={tierKey} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTier === tierKey ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTier(tierKey)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getTierIcon(tierKey)}
                    {tierData.name}
                  </CardTitle>
                  <Badge className={getTierColor(tierKey)}>
                    Best Value
                  </Badge>
                </div>
                <CardDescription>
                  Perfect for {tierKey === "tier1" ? "trying out" : 
                             tierKey === "tier2" ? "regular use" : 
                             tierKey === "tier3" ? "heavy usage" : 
                             "professional use"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">${tierData.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {tierData.credits.toLocaleString()} credits
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(tierData.credits / tierData.price).toFixed(0)} credits per dollar
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(tierKey);
                    }}
                    disabled={isProcessing}
                    className="ml-4"
                  >
                    {isProcessing && selectedTier === tierKey ? "Processing..." : "Buy Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">What can you do with credits?</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Cognitive Analysis: 100 credits</li>
            <li>• Psychological Analysis: 150 credits</li>
            <li>• Comprehensive Reports: 250-300 credits</li>
            <li>• Long-term Storage: 500 credits/month per 50,000 words</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}