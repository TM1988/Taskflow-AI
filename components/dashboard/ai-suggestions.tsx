'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuggestionItemProps {
  title: string;
  description: string;
  type: 'optimization' | 'risk' | 'priority';
  action?: string;
}

function SuggestionItem({ title, description, type, action }: SuggestionItemProps) {
  return (
    <div className="space-y-2 p-3 rounded-lg bg-accent/50 mb-3">
      <div className="flex items-start gap-3">
        {type === 'optimization' && (
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
        )}
        {type === 'risk' && (
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
        )}
        {type === 'priority' && (
          <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
        )}
        <div className="space-y-1 flex-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {action && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
              {action} <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AISuggestions() {
  const [activeTab, setActiveTab] = useState('all');
  
  const suggestions = {
    optimization: [
      {
        title: "Consider splitting the authentication component",
        description: "The component has grown to 320 lines. Splitting it could improve maintainability.",
        action: "See code analysis",
      },
      {
        title: "Opportunity to improve API response time",
        description: "User data requests could be optimized with caching.",
        action: "View details",
      },
    ],
    risk: [
      {
        title: "Deadline risk: User Profile Feature",
        description: "Based on current velocity, this feature may not meet the sprint deadline.",
        action: "View sprint forecast",
      },
      {
        title: "Increasing test failures in CI pipeline",
        description: "5 failing tests in the last build, up from 2 yesterday.",
        action: "See test report",
      },
    ],
    priority: [
      {
        title: "Prioritize reviewing Alice's PR",
        description: "This PR addresses a critical bug and has been waiting for 2 days.",
        action: "View pull request",
      },
      {
        title: "Schedule refinement for payment features",
        description: "These tickets need clarification before the next sprint planning.",
        action: "Schedule meeting",
      },
    ],
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>AI Suggestions</CardTitle>
            <CardDescription>
              Smart recommendations for your project
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="optimization" className="text-xs">Optimizations</TabsTrigger>
            <TabsTrigger value="risk" className="text-xs">Risks</TabsTrigger>
            <TabsTrigger value="priority" className="text-xs">Priorities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {activeTab === 'all' && (
              <>
                {suggestions.priority[0] && (
                  <SuggestionItem
                    title={suggestions.priority[0].title}
                    description={suggestions.priority[0].description}
                    type="priority"
                    action={suggestions.priority[0].action}
                  />
                )}
                {suggestions.risk[0] && (
                  <SuggestionItem
                    title={suggestions.risk[0].title}
                    description={suggestions.risk[0].description}
                    type="risk"
                    action={suggestions.risk[0].action}
                  />
                )}
                {suggestions.optimization[0] && (
                  <SuggestionItem
                    title={suggestions.optimization[0].title}
                    description={suggestions.optimization[0].description}
                    type="optimization"
                    action={suggestions.optimization[0].action}
                  />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="optimization">
            {suggestions.optimization.map((suggestion, i) => (
              <SuggestionItem
                key={i}
                title={suggestion.title}
                description={suggestion.description}
                type="optimization"
                action={suggestion.action}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="risk">
            {suggestions.risk.map((suggestion, i) => (
              <SuggestionItem
                key={i}
                title={suggestion.title}
                description={suggestion.description}
                type="risk"
                action={suggestion.action}
              />
            ))}
          </TabsContent>
          
          <TabsContent value="priority">
            {suggestions.priority.map((suggestion, i) => (
              <SuggestionItem
                key={i}
                title={suggestion.title}
                description={suggestion.description}
                type="priority"
                action={suggestion.action}
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}