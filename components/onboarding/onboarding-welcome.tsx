"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Rocket, 
  CheckCircle,
  Circle,
  Building,
  Settings,
  AlertCircle,
  ChevronRight,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { onboardingService } from "@/services/onboarding/onboardingService";
import { OnboardingStep, OnboardingProgress } from "@/types/onboarding";

interface OnboardingWelcomeProps {
  userId: string;
  onDismiss?: () => void;
  onStepComplete?: (stepId: string) => void;
}

export default function OnboardingWelcome({ 
  userId, 
  onDismiss,
  onStepComplete 
}: OnboardingWelcomeProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingStep, setCompletingStep] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProgress();
  }, [userId]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const progressData = await onboardingService.getProgress(userId);
      setProgress(progressData);
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    setCompletingStep(stepId);
    try {
      await onboardingService.completeStep(userId, stepId);
      await fetchProgress();
      
      onStepComplete?.(stepId);
      
      toast({
        title: "Step Completed! 🎉",
        description: "Great progress on getting started with TaskFlow",
      });
    } catch (error) {
      console.error("Error completing step:", error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    } finally {
      setCompletingStep(null);
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      await onboardingService.skipOnboarding(userId);
      onDismiss?.();
      
      toast({
        title: "Onboarding Skipped",
        description: "You can always access the getting started guide from settings",
      });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  const getStepIcon = (step: OnboardingStep) => {
    const IconComponent = {
      'setup-profile': Settings,
      'create-organization': Building
    }[step.id] || Circle;

    return step.completed ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <IconComponent className="h-5 w-5 text-muted-foreground" />
    );
  };

  const getStepActionButton = (step: OnboardingStep) => {
    if (step.completed) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Complete
        </Badge>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleCompleteStep(step.id)}
        disabled={completingStep === step.id}
        className="flex items-center gap-1"
      >
        {completingStep === step.id ? (
          <div className="h-3 w-3 animate-spin border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {step.actionText || "Start"}
      </Button>
    );
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress || progress.completed) {
    return null;
  }

  const completedSteps = progress.steps.filter(step => step.completed).length;
  const totalSteps = progress.steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Welcome to TaskFlow! 🚀</CardTitle>
              <CardDescription className="mt-1">
                Let's get you set up with everything you need to manage your projects effectively
              </CardDescription>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipOnboarding}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Setup Progress</span>
            <span className="text-muted-foreground">
              {completedSteps} of {totalSteps} completed
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-muted/50 [&>div]:bg-primary"
          />
          
          {progressPercentage === 100 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">All done! You're ready to go!</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Onboarding Steps */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Getting Started Checklist
          </h3>
          
          <div className="space-y-3">
            {progress.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    {step.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {step.estimatedTime && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      <span>Estimated time: {step.estimatedTime}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {getStepActionButton(step)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features Highlight */}
        <Separator />
        
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Key Features You'll Discover
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Unlimited personal projects</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Unlimited tasks per project</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>24-hour recovery for deleted organizations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>In-app notifications (email only for org invites)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Up to 2 organizations per user</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Personal board collaboration</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button 
            size="sm"
            onClick={() => {
              if (progress.steps.length > 0) {
                const nextStep = progress.steps.find(step => !step.completed);
                if (nextStep) {
                  handleCompleteStep(nextStep.id);
                }
              }
            }}
            disabled={progressPercentage === 100}
            className="flex items-center gap-2"
          >
            <Rocket className="h-4 w-4" />
            {progressPercentage === 100 ? "All Done!" : "Continue Setup"}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSkipOnboarding}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
