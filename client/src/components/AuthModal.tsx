import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, CreditCard, User, LogOut } from "lucide-react";

interface User {
  id: string;
  email: string;
  token_balance: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenPackage {
  priceId: string;
  amount: number;
  tokens: number;
  name: string;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // Get current user
  const { data: userData } = useQuery<{ user: User } | null>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401) return null;
      return res.json();
    },
    retry: false,
  });

  // Get token packages
  const { data: tokenPackages } = useQuery<TokenPackage[]>({
    queryKey: ["/api/token-packages"],
    enabled: !!userData?.user,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Successfully logged in!" });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Successfully registered!" });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Successfully logged out!" });
      onClose();
    },
  });

  // Create checkout session mutation
  const checkoutMutation = useMutation({
    mutationFn: async (packageIndex: number) => {
      const res = await apiRequest("POST", "/api/create-checkout-session", { packageIndex });
      return res.json();
    },
    onSuccess: (data: { url: string }) => {
      window.open(data.url, "_blank");
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent, isLogin: boolean) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ email, password });
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleBuyTokens = (packageIndex: number) => {
    checkoutMutation.mutate(packageIndex);
  };

  // If user is logged in, show account info
  if (userData?.user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {userData.user.email}</p>
                  <p><strong>Token Balance:</strong> {userData.user.token_balance?.toLocaleString() || 0} tokens</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Buy More Tokens
                </CardTitle>
                <CardDescription>
                  Purchase additional tokens for unlimited analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tokenPackages?.map((pkg, index) => (
                    <div key={pkg.priceId} className="border rounded-lg p-4">
                      <h3 className="font-semibold">{pkg.name}</h3>
                      <p className="text-sm text-gray-600">{pkg.tokens.toLocaleString()} tokens</p>
                      <p className="text-lg font-bold">${(pkg.amount / 100).toFixed(2)}</p>
                      <Button
                        onClick={() => handleBuyTokens(index)}
                        disabled={checkoutMutation.isPending}
                        className="w-full mt-2"
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Buy Now"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If user is not logged in, show login/register form
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Sign In or Register</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}