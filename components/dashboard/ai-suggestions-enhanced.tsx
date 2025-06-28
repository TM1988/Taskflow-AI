"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Brain, Lightbulb, AlertTriangle, Clock, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/services/auth/AuthContext";
import Link from "next/link";

interface AISuggestion {
  id: string;
  type: 'optimization' | 'risk' | 'priority' | 'workload' | 'collaboration';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'deadlines' | 'workload' | 'collaboration';
  completed?: boolean;
  completedAt?: string;
}

interface AISuggestionsProps {
  projectId?: string;
  isPersonal?: boolean;
}

export default function EnhancedAISuggestions({ projectId, isPersonal = false }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [aiConnected, setAiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedSuggestions, setCompletedSuggestions] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  // Load completed suggestions from localStorage
  useEffect(() => {
    const storageKey = `taskflow-completed-suggestions-${user?.uid || 'guest'}-${projectId || 'personal'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSuggestions(new Set(parsed));
      } catch (error) {
        console.error('Error loading completed suggestions:', error);
      }
    }
  }, [user?.uid, projectId]);

  // Save completed suggestions to localStorage
  const saveCompletedSuggestions = (completed: Set<string>) => {
    const storageKey = `taskflow-completed-suggestions-${user?.uid || 'guest'}-${projectId || 'personal'}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(completed)));
  };

  const fetchSuggestions = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      console.log('Fetching AI suggestions for:', { userId: user.uid, projectId, isPersonal });
      
      const headers: Record<string, string> = {
        'x-user-id': user.uid,
      };
      
      if (projectId && projectId !== "personal") {
        headers['x-project-id'] = projectId;
      }

      const response = await fetch('/api/ai/task-suggestions', {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AI suggestions response:', data);
        
        const receivedSuggestions = data.suggestions || [];
        setSuggestions(receivedSuggestions);
        setAiConnected(data.aiConnected || false);
        
        toast({
          title: "Suggestions Updated",
          description: `Loaded ${receivedSuggestions.length} AI-powered suggestions`,
        });
      } else {
        console.error('Failed to fetch suggestions:', response.status, response.statusText);
        setAiConnected(false);
        setSuggestions(getFallbackSuggestions());
        
        toast({
          title: "Using Fallback Suggestions",
          description: "AI service unavailable, showing smart analysis",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setAiConnected(false);
      setSuggestions(getFallbackSuggestions());
      
      toast({
        title: "Connection Error",
        description: "Unable to fetch AI suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFallbackSuggestions = (): AISuggestion[] => {
    const fallback: AISuggestion[] = [
      {
        id: 'ai-setup',
        type: 'optimization',
        title: 'Connect AI for Smart Suggestions',
        description: 'Set up your Google AI API key in settings to get personalized, intelligent task suggestions based on your actual work patterns.',
        priority: 'high',
        category: 'productivity'
      },
      {
        id: 'task-organization',
        type: 'optimization',
        title: 'Organize Your Tasks',
        description: 'Use priorities (high/medium/low) and due dates to structure your workflow and focus on what matters most.',
        priority: 'medium',
        category: 'productivity'
      }
    ];

    if (!isPersonal && projectId) {
      fallback.push({
        id: 'team-collaboration',
        type: 'collaboration',
        title: 'Optimize Team Collaboration',
        description: 'Assign tasks to team members and track progress to improve project coordination and delivery.',
        priority: 'medium',
        category: 'collaboration'
      });
    }

    return fallback;
  };

  const markSuggestionComplete = (suggestionId: string) => {
    const newCompleted = new Set(completedSuggestions);
    newCompleted.add(suggestionId);
    setCompletedSuggestions(newCompleted);
    saveCompletedSuggestions(newCompleted);
    
    toast({
      title: "Suggestion Completed",
      description: "Great! You've marked this suggestion as done.",
    });
  };

  const removeSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    
    toast({
      title: "Suggestion Dismissed",
      description: "This suggestion won't appear again.",
    });
  };

  const resetCompletedSuggestions = () => {
    setCompletedSuggestions(new Set());
    saveCompletedSuggestions(new Set());
    fetchSuggestions(); // Refresh suggestions
    
    toast({
      title: "Suggestions Reset",
      description: "All suggestion history has been cleared.",
    });
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user?.uid, projectId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'priority': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'workload': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'collaboration': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Lightbulb className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter out completed suggestions
  const activeSuggestions = suggestions.filter(s => !completedSuggestions.has(s.id));
  const hasCompletedSuggestions = completedSuggestions.size > 0;

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
            <div className="text-muted-foreground">Loading intelligent suggestions...</div>
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
              className={aiConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
            >
              {aiConnected ? "AI Connected" : "Smart Analysis"}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSuggestions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!aiConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Connect AI for Better Suggestions</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Connect your Google AI API key to get personalized, data-driven task insights.
                </p>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="mt-2 text-blue-700 border-blue-300">
                    <Settings className="h-3 w-3 mr-1" />
                    Go to Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">All Caught Up!</h3>
            <p className="text-sm text-muted-foreground">
              {hasCompletedSuggestions 
                ? "You've completed all current suggestions. Great work!"
                : "No suggestions at the moment. Your task management looks good!"
              }
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
            {activeSuggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white truncate">
                        {suggestion.title}
                      </h4>
                      <Badge className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSuggestion(suggestion.id)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markSuggestionComplete(suggestion.id)}
                          className="text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Done
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSuggestions.length > 5 && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              {activeSuggestions.length - 5} more suggestions available
            </p>
          </div>
        )}

        {hasCompletedSuggestions && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {completedSuggestions.size} suggestion{completedSuggestions.size !== 1 ? 's' : ''} completed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
