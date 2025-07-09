"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  X,
  Brain,
  Lightbulb,
  AlertTriangle,
  Clock,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import Link from "next/link";

interface AISuggestion {
  id: string;
  type: "optimization" | "risk" | "priority" | "workload" | "collaboration";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "productivity" | "deadlines" | "workload" | "collaboration";
  completed?: boolean;
  completedAt?: string;
}

interface AISuggestionsProps {
  projectId?: string;
  isPersonal?: boolean;
}

export default function EnhancedAISuggestions({
  projectId,
  isPersonal = false,
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [aiConnected, setAiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedSuggestions, setCompletedSuggestions] = useState<Set<string>>(
    new Set(),
  );
  const { user } = useAuth();
  const { toast } = useToast();

  // Load completed suggestions from localStorage
  useEffect(() => {
    const storageKey = `taskflow-completed-suggestions-${user?.uid || "guest"}-${projectId || "personal"}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSuggestions(new Set(parsed));
      } catch (error) {
        console.error("Error loading completed suggestions:", error);
      }
    }
  }, [user?.uid, projectId]);

  // Save completed suggestions to localStorage
  const saveCompletedSuggestions = (completed: Set<string>) => {
    const storageKey = `taskflow-completed-suggestions-${user?.uid || "guest"}-${projectId || "personal"}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(completed)));
  };

  const fetchSuggestions = useCallback(async (forceRefresh = false) => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "x-user-id": user.uid,
      };

      if (projectId && projectId !== "personal") {
        headers["x-project-id"] = projectId;
      }

      // Add cache-busting parameter when forcing refresh
      const url = forceRefresh 
        ? `/api/ai/task-suggestions?refresh=${Date.now()}`
        : "/api/ai/task-suggestions";

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();

        const receivedSuggestions = data.suggestions || [];
        setSuggestions(receivedSuggestions);
        setAiConnected(data.aiConnected || false);
      } else {
        setAiConnected(false);
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      setAiConnected(false);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, projectId]);

  // New function to fetch just one additional suggestion
  const fetchOneSuggestion = useCallback(async () => {
    if (!user?.uid || !aiConnected) return;

    try {
      const headers: Record<string, string> = {
        "x-user-id": user.uid,
      };

      if (projectId && projectId !== "personal") {
        headers["x-project-id"] = projectId;
      }

      // Request just one new suggestion
      const response = await fetch(`/api/ai/task-suggestions?single=true&refresh=${Date.now()}`, {
        method: "GET", 
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const newSuggestions = data.suggestions || [];
        
        if (newSuggestions.length > 0) {
          // Add only the first new suggestion to existing ones
          setSuggestions(prev => [...prev, newSuggestions[0]]);
        }
      }
    } catch (error) {
      console.error("Error fetching single suggestion:", error);
    }
  }, [user?.uid, projectId, aiConnected]);

  const getFallbackSuggestions = useMemo((): AISuggestion[] => {
    const fallback: AISuggestion[] = [
      {
        id: "ai-setup",
        type: "optimization",
        title: "Connect AI for Smart Suggestions",
        description:
          "Set up your Google AI API key in settings to get personalized, intelligent task suggestions based on your actual work patterns.",
        priority: "high",
        category: "productivity",
      },
      {
        id: "task-organization",
        type: "optimization",
        title: "Organize Your Tasks",
        description:
          "Use priorities (high/medium/low) and due dates to structure your workflow and focus on what matters most.",
        priority: "medium",
        category: "productivity",
      },
    ];

    if (!isPersonal && projectId) {
      fallback.push({
        id: "team-collaboration",
        type: "collaboration",
        title: "Optimize Team Collaboration",
        description:
          "Assign tasks to team members and track progress to improve project coordination and delivery.",
        priority: "medium",
        category: "collaboration",
      });
    }

    return fallback;
  }, [isPersonal, projectId]);

  const markSuggestionComplete = async (suggestionId: string) => {
    const newCompleted = new Set(completedSuggestions);
    newCompleted.add(suggestionId);
    setCompletedSuggestions(newCompleted);
    saveCompletedSuggestions(newCompleted);

    // Immediately remove the completed suggestion from the UI
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

    // Only fetch one new suggestion if AI is connected and we have less than 3 suggestions
    if (aiConnected) {
      setTimeout(() => {
        fetchOneSuggestion();
      }, 1000); // Small delay to let the completion process finish, then add one new suggestion
    }

    toast({
      title: "Suggestion Completed",
      description: aiConnected ? "Great! Adding a new suggestion for you." : "Great! You've marked this suggestion as done.",
    });
  };

  const removeSuggestion = (suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));

    toast({
      title: "Suggestion Dismissed",
      description: "This suggestion won't appear again.",
    });
  };

  const resetCompletedSuggestions = () => {
    setCompletedSuggestions(new Set());
    saveCompletedSuggestions(new Set());
    
    // Clear the suggestions cache to force regeneration
    setSuggestions([]);
    fetchSuggestions(true);

    toast({
      title: "Suggestions Reset",
      description: "All suggestion history has been cleared and new suggestions are being generated.",
    });
  };

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "risk":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "priority":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "workload":
        return <Brain className="h-4 w-4 text-purple-500" />;
      case "collaboration":
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800";
      case "low":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800";
    }
  };

  // Memoize expensive computations
  const activeSuggestions = useMemo(() => 
    suggestions.filter((s) => !completedSuggestions.has(s.id)),
    [suggestions, completedSuggestions]
  );
  
  const hasCompletedSuggestions = useMemo(() => 
    completedSuggestions.size > 0, 
    [completedSuggestions]
  );

  // Show fallback suggestions when AI is disabled
  const displaySuggestions = useMemo(() => {
    if (!aiConnected && activeSuggestions.length === 0) {
      return getFallbackSuggestions;
    }
    return activeSuggestions;
  }, [aiConnected, activeSuggestions, getFallbackSuggestions]);

  // Only show disabled state if absolutely no suggestions and not loading
  if (!loading && !aiConnected && displaySuggestions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-gray-400" />
              AI Suggestions
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                AI Disabled
              </Badge>
            </CardTitle>
            <Link href={isPersonal ? "/settings?tab=ai" : `/projects/${projectId}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Enable AI
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
            <div className="text-muted-foreground mb-2">
              AI suggestions are currently disabled
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enable AI features to get intelligent task suggestions and insights
            </p>
            <Link href={isPersonal ? "/settings?tab=ai" : `/projects/${projectId}/settings`}>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Configure AI Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              AI Suggestions
            </CardTitle>
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Loading intelligent suggestions...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Suggestions
            <Badge
              variant={aiConnected ? "default" : "secondary"}
              className={
                aiConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }
            >
              {aiConnected ? "AI Connected" : "AI Disabled"}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchSuggestions(true)}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {hasCompletedSuggestions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetCompletedSuggestions}
                className="text-xs"
              >
                Reset History
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displaySuggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1 dark:text-gray-100">
              All Caught Up!
            </h3>
            <p className="text-sm text-muted-foreground">
              {hasCompletedSuggestions
                ? "You've completed all current suggestions. Great work!"
                : "No suggestions at the moment. Your task management looks good!"}
            </p>
            {hasCompletedSuggestions && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetCompletedSuggestions}
                className="mt-3"
              >
                View All Suggestions Again
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!aiConnected && displaySuggestions.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-800">
                  AI is disabled. These are cached suggestions. 
                  <Link href={isPersonal ? "/settings?tab=ai" : `/projects/${projectId}/settings`} className="underline ml-1">
                    Enable AI for fresh suggestions
                  </Link>
                </div>
              </div>
            )}
            
            {displaySuggestions.slice(0, 3).map((suggestion) => (
              <div
                key={suggestion.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors dark:border-gray-700 dark:hover:border-gray-600"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {suggestion.title}
                      </h4>
                      <Badge
                        className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed dark:text-gray-300 mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSuggestion(suggestion.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-7 px-2"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markSuggestionComplete(suggestion.id)}
                          className="text-xs h-7 px-2"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {aiConnected && displaySuggestions.length > 3 && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              {displaySuggestions.length - 3} more suggestions available
            </p>
          </div>
        )}

        {aiConnected && hasCompletedSuggestions && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {completedSuggestions.size} suggestion
              {completedSuggestions.size !== 1 ? "s" : ""} completed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
