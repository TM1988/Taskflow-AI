// components/board/kanban-task.tsx
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar } from "lucide-react";

// Define a type for the priority values
type TaskPriority = "high" | "medium" | "low";

// Define a Task interface with the necessary properties
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string | null;
  columnId: string;
  order: number;
  status: string;
}

interface KanbanTaskProps {
  task: Task;
  index: number;
  onClick?: () => void;
}

export default function KanbanTask({ task, index, onClick }: KanbanTaskProps) {
  // Format the due date if it exists
  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "MMM d")
    : null;

  // Map of priority to color - now properly typed
  const priorityColors: Record<TaskPriority, string> = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  // Use the map with the correctly typed priority
  const priorityColor = priorityColors[task.priority] || "bg-gray-500";

  return (
    <Card
      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-base">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {task.description && (
          <CardDescription className="mb-3 line-clamp-2">
            {task.description}
          </CardDescription>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {formattedDueDate && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <Calendar className="h-3 w-3" />
                {formattedDueDate}
              </Badge>
            )}
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full ${priorityColor} mr-1`}></div>
            <span className="text-xs text-muted-foreground capitalize">
              {task.priority}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
