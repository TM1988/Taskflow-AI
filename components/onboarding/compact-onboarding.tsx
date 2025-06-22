"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle,
  Circle,
  Building,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Github,
  Sparkles,
  Database,
  Minimize2,
  Maximize2,
  RefreshCw,
  GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { onboardingService } from "@/services/onboarding/onboardingService";
import { OnboardingStep, OnboardingProgress, DEFAULT_ONBOARDING_STEPS } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface CompactOnboardingProps {
  userId: string;
  onComplete?: () => void;
}

export default function CompactOnboarding({ 
  userId, 
  onComplete 
}: CompactOnboardingProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [completingStep, setCompletingStep] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 16, y: 16 }); // Default top-4 right-4 (16px)
  const cardRef = useRef<HTMLDivElement>(null);

  // Load saved position on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('onboarding-position');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (error) {
        console.error('Failed to parse saved onboarding position:', error);
      }
    }
  }, []);
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      fetchProgress();
      // Remove auto-refresh to avoid API spam and progress conflicts
    }
  }, [userId]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    
    const touch = e.touches[0];
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 320);
      const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 400);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 320);
      const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 400);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      saveCurrentPosition();
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      saveCurrentPosition();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  // Prevent scrolling on mobile when dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDragging]);

  // Save current position exactly where user drops it
  const saveCurrentPosition = () => {
    // Save the exact current position to localStorage
    localStorage.setItem('onboarding-position', JSON.stringify(position));
  };

  const fetchProgress = async () => {
    console.log("🔄 Fetching onboarding progress for user:", userId);
    setLoading(true);
    try {
      // Get current progress (manual completion only, no auto-detection)
      const progressData = await onboardingService.getProgress(userId);
      console.log("📊 Progress data received:", {
        completedSteps: progressData.completedSteps,
        completedStepsCount: progressData.completedStepsCount,
        progressPercentage: progressData.progressPercentage
      });
      setProgress(progressData);
      
      // Auto-complete if all steps are done
      if (progressData && progressData.completedSteps.length === onboardingSteps.length) {
        console.log("🎉 All steps completed! Triggering onComplete...");
        console.log("🎉 Progress data:", {
          completedSteps: progressData.completedSteps,
          completedAt: progressData.completedAt,
          totalSteps: onboardingSteps.length
        });
        setTimeout(() => {
          console.log("🎉 Calling onComplete callback");
          onComplete?.();
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Error fetching onboarding progress:", error);
      // If everything fails, still show onboarding with empty progress
      console.log("⚠️ Using fallback progress data");
      setProgress({
        userId,
        currentStep: onboardingSteps[0]?.id || 'setup-profile',
        completedSteps: [],
        skippedSteps: [],
        startedAt: new Date(),
        completed: false,
        steps: onboardingSteps,
        totalSteps: onboardingSteps.length,
        completedStepsCount: 0,
        progressPercentage: 0,
        estimatedTimeRemaining: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    const isCurrentlyCompleted = progress?.completedSteps.includes(stepId);
    const allStepsCompleted = progress?.completedSteps.length === onboardingSteps.length;
    
    // If all steps are completed, don't allow uncompleting any step
    if (isCurrentlyCompleted && allStepsCompleted) {
      console.log(`🚫 Cannot uncomplete step ${stepId} - all steps are completed`);
      toast({
        title: "Onboarding Complete",
        description: "All steps are completed! You cannot modify them now.",
      });
      return;
    }
    
    console.log(`🎯 ${isCurrentlyCompleted ? 'Uncompleting' : 'Completing'} step:`, stepId);
    setCompletingStep(stepId);
    
    // Store previous state for potential revert
    const previousProgress = progress;
    
    // Immediately update UI optimistically
    if (progress) {
      let newCompletedSteps;
      if (isCurrentlyCompleted) {
        // Remove step from completed steps
        newCompletedSteps = progress.completedSteps.filter(step => step !== stepId);
      } else {
        // Add step to completed steps
        newCompletedSteps = [...progress.completedSteps, stepId];
      }
      
      const newCompletedCount = newCompletedSteps.length;
      const newProgressPercentage = (newCompletedCount / onboardingSteps.length) * 100;
      
      // Update UI immediately
      setProgress({
        ...progress,
        completedSteps: newCompletedSteps,
        completedStepsCount: newCompletedCount,
        progressPercentage: newProgressPercentage,
        completed: newCompletedCount === onboardingSteps.length
      });
    }
    
    try {
      if (isCurrentlyCompleted) {
        // Uncomplete step
        console.log("📝 Marking step as uncompleted via API...");
        await onboardingService.uncompleteStep(userId, stepId);
        console.log("✅ Step marked as uncompleted");
        
        toast({
          title: "Step uncompleted!",
          description: "Step removed from progress.",
        });
      } else {
        // Complete step
        console.log("📝 Marking step as completed via API...");
        await onboardingService.markStepCompleted(userId, stepId);
        console.log("✅ Step marked as completed");
        
        toast({
          title: "Step completed!",
          description: "Great progress! Keep going.",
        });
      }
      
      // Show brief syncing indicator for user feedback
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
      }, 800); // Brief visual feedback
      
    } catch (error) {
      console.error("❌ Error updating step:", error);
      
      // Revert optimistic update on error
      if (previousProgress) {
        setProgress(previousProgress);
      }
      
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompletingStep(null);
    }
  };

  const handleCompleteAllSteps = async () => {
    const previousProgress = progress; // Store before try block
    
    try {
      console.log("🎯 Completing all steps...");
      
      const allStepIds = onboardingSteps.map(step => step.id);
      
      // Immediately update UI to show all steps completed
      if (progress) {
        setProgress({
          ...progress,
          completedSteps: allStepIds,
          completedStepsCount: allStepIds.length,
          progressPercentage: 100,
          completed: true
        });
      }
      
      // Complete only the steps that aren't already completed
      const stepsToComplete = onboardingSteps.filter(step => 
        !progress?.completedSteps.includes(step.id)
      );
      
      for (const step of stepsToComplete) {
        await onboardingService.markStepCompleted(userId, step.id);
      }
      
      toast({
        title: "All Steps Completed",
        description: "Onboarding marked as complete!",
      });
      
    } catch (error) {
      console.error("❌ Error completing all steps:", error);
      toast({
        title: "Error",
        description: "Failed to complete all steps.",
        variant: "destructive",
      });
      
      // Revert on error
      if (previousProgress) {
        setProgress(previousProgress);
      }
    }
  };

  const handleShowOnboarding = () => {
    // Force the onboarding to appear by setting a fresh progress
    setProgress({
      userId,
      currentStep: onboardingSteps[0]?.id || 'setup-profile',
      completedSteps: progress?.completedSteps || [],
      skippedSteps: [],
      startedAt: new Date(),
      completed: false,
      steps: onboardingSteps,
      totalSteps: onboardingSteps.length,
      completedStepsCount: progress?.completedSteps.length || 0,
      progressPercentage: ((progress?.completedSteps.length || 0) / onboardingSteps.length) * 100,
      estimatedTimeRemaining: 0
    });
    toast({
      title: "Onboarding Shown",
      description: "Onboarding interface is now visible.",
    });
  };

  const handleNavigateToStep = async (stepId: string) => {
    // Navigate to the appropriate page for the step
    switch (stepId) {
      case 'setup-profile':
        router.push('/settings?tab=profile');
        break;
      case 'configure-database':
        router.push('/settings?tab=database');
        break;
      case 'create-organization':
        router.push('/organizations');
        break;
      case 'connect-github':
        router.push('/repositories');
        break;
      case 'enable-ai-suggestions':
        router.push('/settings?tab=ai');
        break;
      default:
        break;
    }
  };

  // Use the default onboarding steps from types instead of defining our own
  const onboardingSteps = DEFAULT_ONBOARDING_STEPS;

  // Icon mapping for the steps
  const getIconForStep = (stepId: string) => {
    switch (stepId) {
      case 'setup-profile':
        return User;
      case 'configure-database':
        return Database;
      case 'create-organization':
        return Building;
      case 'connect-github':
        return Github;
      case 'enable-ai-suggestions':
        return Sparkles;
      default:
        return Settings;
    }
  };

  if (loading || !progress) {
    return null;
  }

  const completedCount = progress.completedSteps.length;
  const totalCount = onboardingSteps.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  if (isComplete) {
    return null; // Hide when all steps are complete
  }

  return (
    <div 
      ref={cardRef}
      className={cn(
        "fixed z-50 w-80 transition-all duration-300 select-none",
        isMinimized && "w-60",
        isDragging && "cursor-grabbing",
        !isDragging && "cursor-grab"
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      <Card className={cn(
        "shadow-lg border-2 border-primary/20",
        isDragging && "shadow-2xl border-primary/40"
      )}>
        <CardHeader 
          className="pb-3"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          title="Drag to move this onboarding panel"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-60" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-sm font-medium">
                Getting Started
              </CardTitle>
              <Badge variant="outline" className="text-xs px-2 py-0">
                {completedCount}/{totalCount}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              <Progress value={progressPercentage} className="h-2" />
              <CardDescription className="text-xs flex items-center gap-2">
                {progressPercentage.toFixed(0)}% complete
                {isSyncing && (
                  <span className="text-blue-500 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    syncing...
                  </span>
                )}
                {isDragging && (
                  <span className="text-amber-500 flex items-center gap-1">
                    <GripVertical className="h-3 w-3" />
                    dragging...
                  </span>
                )}
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!isMinimized && (
          <CardContent 
            className="pt-0"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {/* Show steps based on expand state */}
              {onboardingSteps
                .slice(0, isExpanded ? onboardingSteps.length : 5) // Show all if expanded, otherwise first 5
                .map((step) => {
                  const isCompleted = progress.completedSteps.includes(step.id);
                  const isCompleting = completingStep === step.id;
                  const IconComponent = getIconForStep(step.id);

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "group flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-muted/50",
                        isCompleted && "opacity-50"
                      )}
                    >
                      <div 
                        className={cn(
                          "flex-shrink-0",
                          isComplete ? "cursor-default" : "cursor-pointer"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          const allCompleted = progress?.completedSteps.length === onboardingSteps.length;
                          console.log(`🎯 User clicked step: ${step.id}, isCompleting: ${isCompleting}, isCompleted: ${isCompleted}, allCompleted: ${allCompleted}`);
                          if (!isCompleting && !allCompleted) {
                            handleCompleteStep(step.id);
                          } else if (allCompleted) {
                            console.log(`🚫 Ignoring click - all steps completed`);
                          }
                        }}
                      >
                        {isCompleting ? (
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        )}
                      </div>
                      
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => !isCompleting && handleNavigateToStep(step.id)}
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">
                            {step.title}
                          </span>
                          {step.required && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {step.description}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {isCompleting ? (
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              
              {/* Show expand button if there are more than 5 steps */}
              {onboardingSteps.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-xs h-6"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show All ({onboardingSteps.length - 5} more)
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
