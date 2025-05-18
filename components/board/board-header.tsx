// components/board/board-header.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface FilterState {
  priority: ("low" | "medium" | "high")[];
  assignee: string[];
  tags: string[];
}

interface BoardHeaderProps {
  onAddTask: () => void;
  onSearch: (query: string) => void;
  onFilter: (filters: FilterState) => void;
  users: { id: string; name: string }[];
  tags: string[];
}

export default function BoardHeader({
  onAddTask,
  onSearch,
  onFilter,
  users,
  tags,
}: BoardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priority: [],
    assignee: [],
    tags: [],
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters((prevFilters) => {
      const currentValues = [...prevFilters[type]];
      const index = currentValues.indexOf(value as any);

      if (index >= 0) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(value as any);
      }

      const newFilters = { ...prevFilters, [type]: currentValues };

      // Count active filters
      const count =
        newFilters.priority.length +
        newFilters.assignee.length +
        newFilters.tags.length;
      setActiveFiltersCount(count);

      // Update filters
      onFilter(newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      priority: [],
      assignee: [],
      tags: [],
    });
    setActiveFiltersCount(0);
    onFilter({
      priority: [],
      assignee: [],
      tags: [],
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
        <p className="text-muted-foreground">Manage and organize your tasks</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {showSearch ? (
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <Input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-auto"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
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

                <div className="p-2">
                  <h4 className="text-xs font-medium mb-1">Priority</h4>
                  <div className="space-y-1">
                    {["low", "medium", "high"].map((priority) => (
                      <DropdownMenuCheckboxItem
                        key={priority}
                        checked={filters.priority.includes(priority as any)}
                        onCheckedChange={() =>
                          toggleFilter("priority", priority)
                        }
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <h4 className="text-xs font-medium mb-1">Assignee</h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {users.map((user) => (
                      <DropdownMenuCheckboxItem
                        key={user.id}
                        checked={filters.assignee.includes(user.id)}
                        onCheckedChange={() =>
                          toggleFilter("assignee", user.id)
                        }
                      >
                        {user.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <h4 className="text-xs font-medium mb-1">Tags</h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {tags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={filters.tags.includes(tag)}
                        onCheckedChange={() => toggleFilter("tags", tag)}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                <div className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={onAddTask}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
