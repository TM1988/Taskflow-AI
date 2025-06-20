"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, memo } from "react";
import {
  AlertCircle,
  Clock,
  MessageSquare,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function formatDate(dateValue: any, formatStr: string = "MMM d, yyyy"): string {
  if (!dateValue) return "";

  try {
    // Handle Firebase Timestamp objects
    if (dateValue && typeof dateValue.toDate === "function") {
      return format(dateValue.toDate(), formatStr);
    }

    // Handle date objects
    if (dateValue instanceof Date) {
      return format(dateValue, formatStr);
    }

    // Handle ISO strings
    if (typeof dateValue === "string") {
      return format(new Date(dateValue), formatStr);
    }

    return "";
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "";
  }
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    dueDate?: string;
    assignee?: {
      name: string;
      avatar: string;
      initials: string;
    };
    tags?: string[];
    commentCount?: number;
    isBlocked?: boolean;
  };
  isDragging?: boolean;
  onClick?: () => void;
}

const TaskCard = memo(function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const [prefetched, setPrefetched] = useState(false);

  const prefetchTaskData = () => {
    if (prefetched || !task.id) return;

    // Quietly prefetch the task data
    fetch(`/api/task-direct/${task.id}`)
      .then(() => setPrefetched(true))
      .catch(() => {});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card
      className={cn(
        "mb-2 cursor-pointer transition-all hover:shadow-md",
        isDragging && "opacity-50 rotate-2 shadow-lg"
      )}
      onClick={onClick}
      onMouseEnter={prefetchTaskData}
    >
      <CardContent className="p-2">
        <div className="space-y-1.5">
          {task.isBlocked && (
            <div className="flex items-center gap-1 text-destructive text-xs mb-1">
              <AlertCircle className="h-3 w-3" />
              <span>Blocked</span>
            </div>
          )}

          <h4 className="font-medium text-sm line-clamp-2 break-words">
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            {task.priority && (
              <Badge
                variant="secondary"
                className={cn("text-xs", getPriorityColor(task.priority))}
              >
                {task.priority}
              </Badge>
            )}

            {task.dueDate && (
              <span className="text-xs text-muted-foreground">
                {formatDate(task.dueDate, "MMM d, yyyy")}
              </span>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default TaskCard;
