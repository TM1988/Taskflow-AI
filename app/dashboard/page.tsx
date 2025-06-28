"use client";

import DashboardMetrics from "@/components/dashboard/dashboard-metrics";
import RepositoryList from "@/components/dashboard/repository-list";
import RecentActivity from "@/components/dashboard/recent-activity";
import TimeTrackingWidget from "@/components/dashboard/time-tracking-widget";
import { useAuth } from "@/services/auth/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, Clock, TrendingUp, RefreshCw } from "lucide-react";

interface AISuggestion {
  id: string;
  type: 'optimization' | 'risk' | 'priority';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'deadlines' | 'workload' | 'collaboration';
}

// ONLY rewrite the AI Suggestions component - keep everything else original
function RewrittenAISuggestions() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [aiConnected, setAiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch('/api/ai/task-suggestions', {
          headers: {
            'x-user-id': user.uid,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setAiConnected(data.aiConnected || false);
        } else {
          // API call failed - show fallback suggestions
          setAiConnected(false);
          setSuggestions([
            {
              id: 'ai-connection-issue',
              type: 'risk',
              title: 'AI Connection Issue',
              description: 'Unable to connect to Google AI. Check your API key in settings or verify your internet connection.',
              action: '',
              priority: 'high',
              category: 'productivity'
            },
            {
              id: 'basic-suggestion-1',
              type: 'optimization',
              title: 'Review Your Task Priorities',
              description: 'Ensure your most important tasks are marked with high priority to focus your efforts effectively.',
              action: '',
              priority: 'medium',
              category: 'productivity'
            },
            {
              id: 'basic-suggestion-2',
              type: 'priority',
              title: 'Check for Overdue Tasks',
              description: 'Review any tasks that may have passed their due dates and reschedule or complete them.',
              action: '',
              priority: 'medium',
              category: 'deadlines'
            },
            {
              id: 'basic-suggestion-3',
              type: 'optimization',
              title: 'Set Due Dates',
              description: 'Add due dates to your tasks to better manage deadlines and maintain accountability.',
              action: '',
              priority: 'low',
              category: 'productivity'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        setAiConnected(false);
        setSuggestions([
          {
            id: 'ai-not-connected',
            type: 'optimization',
            title: 'AI Not Connected',
            description: 'Connect your Google AI API key in settings to get personalized AI-powered task suggestions and insights.',
            action: '',
            priority: 'medium',
            category: 'productivity'
          },
          {
            id: 'welcome-suggestion-1',
            type: 'priority',
            title: 'Welcome to Taskflow AI',
            description: 'Start organizing your tasks with priorities and due dates for better productivity tracking.',
            action: '',
            priority: 'medium',
            category: 'productivity'
          },
          {
            id: 'welcome-suggestion-2',
            type: 'optimization',
            title: 'Set Up Your Projects',
            description: 'Create projects to organize your workflow and track progress more effectively.',
            action: '',
            priority: 'low',
            category: 'productivity'
          },
          {
            id: 'welcome-suggestion-3',
            type: 'optimization',
            title: 'Monitor Your Progress',
            description: 'Use the dashboard metrics to track your productivity and task completion patterns.',
            action: '',
            priority: 'low',
            category: 'productivity'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user?.uid]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'priority': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      default: return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">AI Suggestions</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Intelligent insights to boost your productivity
            </CardDescription>
          </div>
          <Badge variant={aiConnected ? "default" : "secondary"}>
            {aiConnected ? 'AI Connected' : 'AI Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading suggestions...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.slice(0, 4).map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{suggestion.title}</h4>
                      <Badge className={getPriorityColor(suggestion.priority)} variant="secondary">
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your AI-powered project insights and management overview
          </p>
        </div>
      </div>

      <DashboardMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RewrittenAISuggestions />
        </div>
        <div className="space-y-6">
          <TimeTrackingWidget />
        </div>
      </div>

      <RecentActivity />

      <RepositoryList />
    </div>
  );
}
