"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import TaskCard from "@/components/board/task-card";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: any[];
  color?: string;
  onTaskClick?: (taskId: string) => void;
}

export default function KanbanColumn({
  id,
  title,
  tasks,
  color,
  onTaskClick,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-w-[280px]">
      <Card className="flex flex-col h-full">
        <CardHeader
          className={cn(
            "py-2 px-4 flex-row justify-between items-center",
            color && `bg-${color}-100 dark:bg-${color}-900/20`,
          )}
        >
          <div className="flex items-center gap-2">
            {color && (
              <div className={`h-3 w-3 rounded-full bg-${color}-500`}></div>
            )}
            <h3 className="font-medium text-sm">{title}</h3>
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs">
              {tasks.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-hidden flex-1">
          <Droppable droppableId={id}>
            {(provided) => (
              <div
                className="h-full overflow-y-auto space-y-2 p-1"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TaskCard
                          task={task}
                          onClick={() => onTaskClick && onTaskClick(task.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </div>
  );
}
