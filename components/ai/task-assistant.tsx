// components/ai/task-assistant.tsx
"use client";

import { Task } from "@/types/task";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Plus, CheckCircle, XCircle, Clock } from "lucide-react";

interface TaskAssistantProps {
  tasks: Task[];
  onSuggestionsApply: (suggestions: Suggestion[]) => void;
}

interface Suggestion {
  title: string;
  description: string;
  type: "priority" | "risk" | "dependency" | "scheduling";
  actions?: string[];
}

export default function TaskAssistant({
  tasks,
  onSuggestionsApply,
}: TaskAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("suggest");
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/ai/task-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks,
          prompt: prompt || "Analyze my tasks and suggest prioritization",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
        setActiveTab("results");
      } else {
        throw new Error("Failed to generate suggestions");
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Task Assistant
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions for your tasks
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="suggest" className="flex-1">
            Get Suggestions
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="flex-1"
            disabled={!suggestions.length}
          >
            Results
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-6">
          <TabsContent value="suggest" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                What would you like help with?
              </label>
              <Textarea
                placeholder="E.g., Prioritize my tasks for this week, or Help me organize my backlog"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none h-24"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Quick prompts</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPrompt("What tasks should I focus on today?")
                  }
                >
                  Daily focus
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPrompt(
                      "Which tasks are likely to be blocked or delayed?",
                    )
                  }
                >
                  Identify risks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPrompt(
                      "Suggest completion order for my high priority tasks",
                    )
                  }
                >
                  Plan sequence
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{suggestion.title}</div>
                      <Badge
                        variant={
                          suggestion.type === "priority"
                            ? "default"
                            : suggestion.type === "risk"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {suggestion.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>

                    {suggestion.actions && (
                      <div className="mt-2">
                        <div className="text-xs font-medium mb-1">
                          Suggested Actions:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.actions.map((action, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-accent"
                            >
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No suggestions generated yet. Try creating some first!
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="flex justify-between">
        {activeTab === "suggest" ? (
          <Button
            onClick={generateSuggestions}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Suggestions"}
          </Button>
        ) : (
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveTab("suggest")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => onSuggestionsApply(suggestions)}
              className="flex-1"
            >
              Apply Suggestions
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
