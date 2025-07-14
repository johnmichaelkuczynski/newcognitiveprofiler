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
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

// Payment form component using Stripe Elements
function PaymentForm({ 
  selectedTier, 
  onSuccess, 
  onError, 
  onProcessing 
}: {
  selectedTier: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onProcessing: (processing: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    onProcessing(true);

    try {
      // Create payment intent
      const response = await apiRequest("POST", "/api/create-payment-intent", { tier: selectedTier });
      const { clientSecret } = await response.json();

      // Confirm payment with card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onError("Card element not found");
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, now manually update the user's credits
        try {
          await apiRequest("POST", "/api/process-payment", { 
            paymentIntentId: paymentIntent.id 
          });
          onSuccess();
        } catch (processError: any) {
          onError("Payment processed but failed to update credits. Please contact support.");
        }
      } else {
        onError("Payment status unclear. Please check your account or contact support.");
      }
    } catch (error: any) {
      onError(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
      onProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
}

export default function PurchaseCreditsModal({ isOpen, onClose }: PurchaseCreditsModalProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Query to get pricing tiers
  const { data: pricingTiers } = useQuery({
    queryKey: ["/api/pricing"],
    enabled: isOpen
  });

  const handlePurchase = (tier: string) => {
    setSelectedTier(tier);
    setError(null);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    onClose();
    window.location.reload(); // Refresh to update user credits
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setShowPaymentForm(false);
  };

  const handleBack = () => {
    setShowPaymentForm(false);
    setSelectedTier(null);
    setError(null);
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

  if (showPaymentForm && selectedTier) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="py-4">
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">{pricingTiers?.[selectedTier]?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {pricingTiers?.[selectedTier]?.credits.toLocaleString()} credits for ${pricingTiers?.[selectedTier]?.price}
              </p>
            </div>

            <Elements stripe={stripePromise}>
              <PaymentForm
                selectedTier={selectedTier}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onProcessing={setIsProcessing}
              />
            </Elements>

            <Button 
              variant="outline" 
              onClick={handleBack}
              className="w-full mt-4"
              disabled={isProcessing}
            >
              Back to Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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