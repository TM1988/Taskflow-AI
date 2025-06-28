"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar,
  Flag,
  X,
  Check
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";

export default function QuickAddTask() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        personal: true,
        userId: user.uid,
        status: "todo",
        columnId: "todo",
        priority,
        ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        setTitle("");
        setDueDate("");
        setPriority("medium");
        setIsExpanded(false);
        // Trigger refresh of dashboard components
        window.dispatchEvent(new CustomEvent('taskCreated'));
      } else {
        console.error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setIsExpanded(false);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (p: string) => {
    switch (p) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (!isExpanded) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsExpanded(true)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Plus className="h-5 w-5" />
            <span>Quick add task...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Add Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Due Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-auto"
                disabled={isLoading}
              />
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setPriority(p)}
                    disabled={isLoading}
                  >
                    <span className="mr-1">{getPriorityIcon(p)}</span>
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || isLoading}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? "Adding..." : "Add Task"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
