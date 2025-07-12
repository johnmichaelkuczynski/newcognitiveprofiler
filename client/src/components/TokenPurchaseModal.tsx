import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Coins, CreditCard, Check, Loader2, Star, Zap } from 'lucide-react';

interface TokenPackage {
  tokens: number;
  price: number;
  name: string;
  description: string;
  popular?: boolean;
}

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TokenPurchaseModal({ isOpen, onClose }: TokenPurchaseModalProps) {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { sessionId, refreshUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      setIsInitialLoading(true);
      const response = await apiRequest('/api/token-packages');
      setPackages(response.packages || []);
    } catch (error) {
      console.error('Failed to fetch token packages:', error);
      toast({
        title: "Error",
        description: "Failed to load token packages",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (selectedPackage === null) {
      toast({
        title: "No package selected",
        description: "Please select a token package first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ packageIndex: selectedPackage }),
        headers: {
          'Authorization': `Bearer ${sessionId}`
        }
      });

      if (response.success) {
        // In a real app, we'd integrate with Stripe Elements here
        // For now, we'll show a success message
        toast({
          title: "Payment processing",
          description: "Your purchase is being processed. This is a demo - tokens will be added automatically.",
        });
        
        // Simulate successful payment by refreshing user data
        setTimeout(async () => {
          await refreshUser();
          toast({
            title: "Tokens added!",
            description: `${packages[selectedPackage].tokens} tokens have been added to your account.`,
          });
          onClose();
        }, 2000);
      } else {
        toast({
          title: "Payment failed",
          description: response.error || "Unable to process payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPackageIcon = (index: number) => {
    switch (index) {
      case 0: return <Coins className="h-5 w-5 text-yellow-500" />;
      case 1: return <Zap className="h-5 w-5 text-blue-500" />;
      case 2: return <Star className="h-5 w-5 text-purple-500" />;
      default: return <Coins className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isInitialLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Purchase Tokens</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Analysis Tokens
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Choose a token package to continue using advanced analysis features:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedPackage === index 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'border-border'
                } ${pkg.popular ? 'border-purple-500' : ''}`}
                onClick={() => setSelectedPackage(index)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getPackageIcon(index)}
                      {pkg.name}
                    </CardTitle>
                    {pkg.popular && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{pkg.tokens}</div>
                    <div className="text-sm text-muted-foreground">tokens</div>
                  </div>
                  <Separator />
                  <div className="text-center">
                    <div className="text-xl font-semibold">${pkg.price}</div>
                    <div className="text-sm text-muted-foreground">
                      ${(pkg.price / pkg.tokens).toFixed(3)} per token
                    </div>
                  </div>
                  {selectedPackage === index && (
                    <div className="flex justify-center">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What can you do with tokens?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Full cognitive analysis: 10-15 tokens</li>
              <li>• Psychological analysis: 8-12 tokens</li>
              <li>• Document upload & analysis: 5-10 tokens</li>
              <li>• Export reports (PDF/DOCX): 2-3 tokens</li>
              <li>• Email reports: 1-2 tokens</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase} 
              disabled={selectedPackage === null || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Purchase {selectedPackage !== null ? packages[selectedPackage]?.name : 'Tokens'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}