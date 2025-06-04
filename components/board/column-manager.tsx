"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Column {
  id: string;
  name: string;
  order: number;
  isRequired?: boolean;
}

interface ColumnManagerProps {
  projectId?: string;
}

export default function ColumnManager({ projectId }: ColumnManagerProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", name: "To Do", order: 0, isRequired: true },
    { id: "in-progress", name: "In Progress", order: 1 },
    { id: "review", name: "Review", order: 2 },
    { id: "done", name: "Done", order: 3, isRequired: true },
  ]);
  const [todoColumnId, setTodoColumnId] = useState("todo");
  const [doneColumnId, setDoneColumnId] = useState("done");
  const [newColumnName, setNewColumnName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load columns for the project
  useEffect(() => {
    const fetchColumns = async () => {
      if (!projectId) return;
      
      try {
        const response = await fetch(`/api/columns?projectId=${projectId}`);
        if (response.ok) {
          const columnsData = await response.json();
          if (columnsData.length > 0) {
            const sortedColumns = columnsData.sort((a: any, b: any) => a.order - b.order);
            setColumns(sortedColumns);
            
            // Set role assignments from saved data
            const todoCol = sortedColumns.find((c: any) => c.role === 'todo');
            const doneCol = sortedColumns.find((c: any) => c.role === 'done');
            if (todoCol) setTodoColumnId(todoCol.id);
            if (doneCol) setDoneColumnId(doneCol.id);
          }
        }
      } catch (error) {
        console.error('Error fetching columns:', error);
      }
    };

    fetchColumns();
  }, [projectId]);

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    if (columns.length >= 8) {
      toast({
        title: "Maximum columns reached",
        description: "You can have a maximum of 8 columns",
        variant: "destructive",
      });
      return;
    }

    const newColumn: Column = {
      id: `column-${Date.now()}`,
      name: newColumnName.trim(),
      order: columns.length,
    };

    setColumns([...columns, newColumn]);
    setNewColumnName("");
  };

  const handleDeleteColumn = (columnId: string) => {
    if (columns.length <= 2) {
      toast({
        title: "Minimum columns required",
        description: "You must have at least 2 columns",
        variant: "destructive",
      });
      return;
    }

    const column = columns.find(c => c.id === columnId);
    if (column?.isRequired) {
      toast({
        title: "Cannot delete required column",
        description: "To Do and Done columns cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    setColumns(columns.filter(c => c.id !== columnId));
    
    // Reset role assignments if deleted column was assigned a role
    if (todoColumnId === columnId) setTodoColumnId(columns[0]?.id || "");
    if (doneColumnId === columnId) setDoneColumnId(columns[columns.length - 1]?.id || "");
  };

  const handleRenameColumn = (columnId: string, newName: string) => {
    setColumns(columns.map(c => 
      c.id === columnId ? { ...c, name: newName } : c
    ));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
    const reorderedColumns = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setColumns(reorderedColumns);
  };

  const handleSave = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      // First, delete existing columns for this project
      const existingResponse = await fetch(`/api/columns?projectId=${projectId}`);
      if (existingResponse.ok) {
        const existingColumns = await existingResponse.json();
        
        // Delete each existing column
        for (const col of existingColumns) {
          await fetch(`/api/columns/${col.id}`, {
            method: 'DELETE'
          });
        }
      }

      // Create new columns with roles
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const columnData = {
          projectId,
          name: col.name,
          order: i,
          role: col.id === todoColumnId ? 'todo' : col.id === doneColumnId ? 'done' : null
        };

        await fetch('/api/columns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(columnData)
        });
      }

      toast({
        title: "Success",
        description: "Column configuration saved successfully",
      });
      
      // Notify board to refresh
      if (window.boardContentRef?.refreshTasks) {
        window.boardContentRef.refreshTasks();
      }
    } catch (error) {
      console.error('Error saving columns:', error);
      toast({
        title: "Error",
        description: "Failed to save column configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Column Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Column Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>To Do Column</Label>
              <Select value={todoColumnId} onValueChange={setTodoColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select To Do column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Done Column</Label>
              <Select value={doneColumnId} onValueChange={setDoneColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Done column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Specify which columns serve as "To Do" (new tasks) and "Done" (completed tasks) even if you rename them.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Column Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manage Columns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new column */}
          <div className="flex gap-2">
            <Input
              placeholder="New column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
              disabled={columns.length >= 8}
            />
            <Button 
              onClick={handleAddColumn} 
              disabled={!newColumnName.trim() || columns.length >= 8}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Column list */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {columns.map((column, index) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-2 p-3 border rounded-md bg-background ${
                            snapshot.isDragging ? "shadow-lg" : ""
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <Input
                            value={column.name}
                            onChange={(e) => handleRenameColumn(column.id, e.target.value)}
                            className="flex-1"
                          />
                          
                          <div className="flex items-center gap-2">
                            {column.id === todoColumnId && (
                              <Badge variant="secondary">To Do</Badge>
                            )}
                            {column.id === doneColumnId && (
                              <Badge variant="secondary">Done</Badge>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteColumn(column.id)}
                              disabled={columns.length <= 2 || column.isRequired}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="text-sm text-muted-foreground">
            <p>• Drag columns to reorder them</p>
            <p>• Minimum: 2 columns, Maximum: 8 columns</p>
            <p>• You must always have To Do and Done roles assigned</p>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : "Save Column Configuration"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
