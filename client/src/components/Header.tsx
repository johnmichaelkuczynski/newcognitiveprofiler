import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, HelpCircle } from "lucide-react";
import UserMenu from "./UserMenu";
import { useUser } from "@/contexts/UserContext";

interface HeaderProps {
  onShowHelp: () => void;
}

export default function Header({ onShowHelp }: HeaderProps) {
  const { user } = useUser();

  return (
    <Card className="mb-6 border-2 border-gray-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Cognitive Profiler
              </h1>
              <p className="text-sm text-gray-600">
                AI-powered cognitive and psychological analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!user && (
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                Preview Mode - Register for Full Access
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHelp}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
            
            <UserMenu />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}