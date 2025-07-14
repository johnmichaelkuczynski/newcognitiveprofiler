import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, HelpCircle } from "lucide-react";

interface HeaderProps {
  onShowHelp: () => void;
}

export default function Header({ onShowHelp }: HeaderProps) {
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
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHelp}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}