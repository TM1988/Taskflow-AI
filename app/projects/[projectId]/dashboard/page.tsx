"use client";

import { useParams } from "next/navigation";
import DashboardMetrics from "@/components/dashboard/dashboard-metrics";
import RecentActivity from "@/components/dashboard/recent-activity";
import RepositoryList from "@/components/dashboard/repository-list";
import TeamWorkload from "@/components/dashboard/team-workload";
import TeamWorkloadAI from "@/components/dashboard/team-workload-ai";
import TimeTrackingWidget from "@/components/dashboard/time-tracking-widget";
import { useAuth } from "@/services/auth/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";

interface AISuggestion {
  id: string;
  type: 'optimization' | 'risk' | 'priority';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'deadlines' | 'workload' | 'collaboration';
}

// Project AI Suggestions component - rewritten inline to avoid import issues
function ProjectAISuggestions({ projectId }: { projectId: string }) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [aiConnected, setAiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user?.uid || !projectId) return;

      try {
        const response = await fetch('/api/ai/task-suggestions', {
          headers: {
            'x-user-id': user.uid,
            'x-project-id': projectId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setAiConnected(data.aiConnected || false);
        } else {
          // API call failed - show project-specific fallback suggestions
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
              id: 'project-collaboration',
              type: 'optimization',
              title: 'Review Team Collaboration',
              description: 'Check team workload distribution and ensure tasks are assigned effectively across team members.',
              action: '',
              priority: 'medium',
              category: 'collaboration'
            },
            {
              id: 'project-deadlines',
              type: 'priority',
              title: 'Monitor Project Deadlines',
              description: 'Review upcoming project milestones and ensure critical tasks are on track.',
              action: '',
              priority: 'medium',
              category: 'deadlines'
            },
            {
              id: 'project-workload',
              type: 'optimization',
              title: 'Optimize Team Workload',
              description: 'Balance task distribution to prevent team burnout and improve project velocity.',
              action: '',
              priority: 'low',
              category: 'workload'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching project AI suggestions:', error);
        setAiConnected(false);
        setSuggestions([
          {
            id: 'ai-not-connected',
            type: 'optimization',
            title: 'AI Not Connected',
            description: 'Connect your Google AI API key in settings to get personalized project insights and team collaboration suggestions.',
            action: '',
            priority: 'medium',
            category: 'productivity'
          },
          {
            id: 'project-setup-1',
            type: 'priority',
            title: 'Setup Project Workflow',
            description: 'Organize your project with clear task assignments and deadlines for better team coordination.',
            action: '',
            priority: 'medium',
            category: 'collaboration'
          },
          {
            id: 'project-setup-2',
            type: 'optimization',
            title: 'Monitor Team Progress',
            description: 'Use team workload views to track progress and identify bottlenecks in your project workflow.',
            action: '',
            priority: 'low',
            category: 'workload'
          },
          {
            id: 'project-setup-3',
            type: 'optimization',
            title: 'Track Project Metrics',
            description: 'Monitor project completion rates and team productivity through the project dashboard.',
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
  }, [user?.uid, projectId]);

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
            <CardTitle className="text-white">Project AI Insights</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              AI-powered recommendations for team collaboration and project success
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
            <span className="ml-2 text-gray-500">Loading project insights...</span>
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

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Dashboard</h1>
          <p className="text-muted-foreground">
            Team insights and project management overview
          </p>
        </div>
      </div>

      <DashboardMetrics projectId={projectId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectAISuggestions projectId={projectId} />
        </div>
        <div>
          <TimeTrackingWidget projectId={projectId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamWorkloadAI projectId={projectId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <TeamWorkload />
        </div>
      </div>

      <RepositoryList />
    </div>
  );
}
