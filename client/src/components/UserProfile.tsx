import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Coins, CreditCard, LogOut, ShoppingCart } from 'lucide-react';
import { TokenPurchaseModal } from './TokenPurchaseModal';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [showTokenModal, setShowTokenModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Account ID:</span>
                  <span className="text-sm text-muted-foreground font-mono">{user.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Token Balance
                </CardTitle>
                <CardDescription>Your available analysis tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Available Tokens:</span>
                  <Badge variant={user.token_balance > 10 ? "default" : "destructive"} className="text-base px-3 py-1">
                    {user.token_balance}
                  </Badge>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p>• Each analysis uses 5-15 tokens</p>
                  <p>• Document upload uses 3-8 tokens</p>
                  <p>• Storage uses 1-3 tokens per month</p>
                </div>
                <Button 
                  onClick={() => setShowTokenModal(true)} 
                  className="w-full"
                  variant="outline"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase More Tokens
                </Button>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleLogout} variant="outline" className="flex-1">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button onClick={onClose} variant="default" className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <TokenPurchaseModal 
        isOpen={showTokenModal} 
        onClose={() => setShowTokenModal(false)} 
      />
    </>
  );
}

// Standalone UserProfile trigger component
export function UserProfileTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="relative">
        <User className="mr-2 h-4 w-4" />
        {user.email}
        <Badge variant="secondary" className="ml-2">
          {user.token_balance}
        </Badge>
      </Button>
      <UserProfile isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}