// components/board/board-header.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import TaskImportExport from "./task-import-export";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface FilterState {
  priority: ("low" | "medium" | "high")[];
  assignee: string[];
  tags: string[];
}

interface BoardHeaderProps {
  users: any[];
  tags: string[];
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
  onAddTask: () => void;
  projectId?: string;
  onTasksImported?: () => void;
  onColumnUpdate?: (columns: any[]) => void; // Add this prop
}

export default function BoardHeader({
  users,
  tags,
  onSearch,
  onFilter,
  onAddTask,
  projectId,
  onTasksImported,
  onColumnUpdate, // Add this prop
}: BoardHeaderProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    priority: [],
    assignee: [],
    tags: [],
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchQuery(v);
    onSearch(v);
  };

  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const vals = [...prev[type]];
      const idx = vals.indexOf(value as any);
      if (idx >= 0) vals.splice(idx, 1);
      else vals.push(value as any);
      const newF = { ...prev, [type]: vals };
      setActiveFiltersCount(
        newF.priority.length + newF.assignee.length + newF.tags.length
      );
      onFilter(newF);
      return newF;
    });
  };

  const clearFilters = () => {
    const empty = { priority: [], assignee: [], tags: [] };
    setFilters(empty);
    setActiveFiltersCount(0);
    onFilter(empty);
  };

  const handleImportComplete = () => {
    console.log("Import completed, refreshing board...");

    // Call the board refresh
    if (onTasksImported) {
      onTasksImported();
    }

    // Also refresh via window reference
    if (window.boardContentRef?.refreshTasks) {
      window.boardContentRef.refreshTasks();
    }

    toast({
      title: "Import Complete",
      description: "Tasks have been imported successfully",
    });
  };

  return (
    <div className="flex flex-col items-center space-y-2 py-4 px-6 bg-background">
      <div className="flex items-center gap-3">
        {/* Import/Export */}
        {projectId && (
          <TaskImportExport
            projectId={projectId}
            onTasksImported={onTasksImported}
          />
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            className="pl-10 w-48 h-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Priority */}
            <div className="p-2">
              <h4 className="text-xs font-medium mb-1">Priority</h4>
              <div className="space-y-1">
                {["low", "medium", "high"].map((p) => (
                  <DropdownMenuCheckboxItem
                    key={p}
                    checked={filters.priority.includes(p as any)}
                    onCheckedChange={() => toggleFilter("priority", p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Assignee */}
            <div className="p-2">
              <h4 className="text-xs font-medium mb-1">Assignee</h4>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {users.map((u) => (
                  <DropdownMenuCheckboxItem
                    key={u.id}
                    checked={filters.assignee.includes(u.id)}
                    onCheckedChange={() => toggleFilter("assignee", u.id)}
                  >
                    {u.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Tags */}
            <div className="p-2">
              <h4 className="text-xs font-medium mb-1">Tags</h4>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {tags.map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t}
                    checked={filters.tags.includes(t)}
                    onCheckedChange={() => toggleFilter("tags", t)}
                  >
                    {t}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add Task */}
        <Button onClick={onAddTask} size="sm" className="h-8 px-3">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
