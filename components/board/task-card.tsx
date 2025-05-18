import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
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
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const [prefetched, setPrefetched] = useState(false);

  const prefetchTaskData = () => {
    if (prefetched || !task.id) return;

    // Quietly prefetch the task data
    fetch(`/api/task-direct/${task.id}`)
      .then(() => setPrefetched(true))
      .catch(() => {});
  };

  return (
    <Card
      className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      onMouseEnter={prefetchTaskData}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {task.isBlocked && (
            <div className="flex items-center gap-1 text-destructive text-xs mb-1">
              <AlertCircle className="h-3 w-3" />
              <span>Blocked</span>
            </div>
          )}

          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[10px] py-0 px-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                />
                <AvatarFallback className="text-[10px]">
                  {task.assignee.initials}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              {task.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {formatDate(task.dueDate, "MMM d, yyyy")}
                </div>
              )}

              {task.commentCount !== undefined && task.commentCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.commentCount}</span>
                </div>
              )}

              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  task.priority === "high" && "bg-red-500",
                  task.priority === "medium" && "bg-yellow-500",
                  task.priority === "low" && "bg-green-500",
                )}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
