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
    <div className="flex flex-col h-full bg-muted/50 rounded-lg shadow">
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
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "p-2 space-y-2 transition-all ease-in-out duration-200 rounded-md",
                  // Empty state - very small
                  tasks.length === 0 && !snapshot.isDraggingOver && "min-h-[2rem]",
                  // Has tasks but not dragging - comfortable size
                  tasks.length > 0 && !snapshot.isDraggingOver && "min-h-[6rem]",
                  // Dragging over - expanded to welcome the task
                  snapshot.isDraggingOver && "bg-primary/10 min-h-[8rem] border-2 border-primary/20 border-dashed"
                )}
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(providedDrag, snapshotDrag) => (
                      <div
                        ref={providedDrag.innerRef}
                        {...providedDrag.draggableProps}
                        {...providedDrag.dragHandleProps}
                      >
                        <TaskCard
                          key={`${task.id}-${task.updatedAt || task.title}-${task.priority}`}
                          task={task}
                          isDragging={snapshotDrag.isDragging}
                          onClick={() => onTaskClick && onTaskClick(task.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {/* Show a helpful message when empty and not dragging */}
                {tasks.length === 0 && !snapshot.isDraggingOver && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    Drop tasks here
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </div>
  );
}
