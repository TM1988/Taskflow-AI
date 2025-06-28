// components/board/board-header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
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

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface BoardHeaderProps {
  users: any[]; // Keep for backward compatibility but will be replaced
  tags: string[]; // Keep for backward compatibility but will be replaced
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
  onAddTask: () => void;
  projectId?: string;
  onTasksImported?: () => void;
  onColumnUpdate?: (columns: any[]) => void;
  hasUnsavedChanges?: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
}

export default function BoardHeader({
  users,
  tags,
  onSearch,
  onFilter,
  onAddTask,
  projectId,
  onTasksImported,
  onColumnUpdate,
  hasUnsavedChanges = false,
  onSync,
  isSyncing = false,
}: BoardHeaderProps) {
  const [filters, setFilters] = useState<FilterState>({
    priority: [],
    assignee: [],
    tags: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Real data state
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch real data when projectId changes
  useEffect(() => {
    if (projectId && projectId !== "personal") {
      fetchProjectData();
    } else if (projectId === "personal") {
      fetchPersonalData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      // Fetch project members and tags in parallel
      const [membersResponse, tagsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/members`),
        fetch(`/api/projects/${projectId}/tags`)
      ]);

      if (membersResponse.ok) {
        const members = await membersResponse.json();
        setProjectMembers(members);
      }

      if (tagsResponse.ok) {
        const projectTags = await tagsResponse.json();
        setAvailableTags(projectTags);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      // Fallback to provided data
      setProjectMembers(users || []);
      setAvailableTags(tags || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalData = async () => {
    setLoading(true);
    try {
      // For personal workspace, only fetch tags (no members)
      const response = await fetch(`/api/user-tags/${projectId === "personal" ? "current" : "fallback"}`);
      if (response.ok) {
        const personalTags = await response.json();
        setAvailableTags(personalTags);
      }
      setProjectMembers([]); // No members for personal workspace
    } catch (error) {
      console.error('Error fetching personal data:', error);
      setAvailableTags(tags || []);
      setProjectMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterType: keyof FilterState, value: string) => {
    const newFilters = { ...filters };
    const currentValues = newFilters[filterType] as string[];
    
    if (currentValues.includes(value)) {
      newFilters[filterType] = currentValues.filter((v) => v !== value) as any;
    } else {
      newFilters[filterType] = [...currentValues, value] as any;
    }
    
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      priority: [],
      assignee: [],
      tags: [],
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchQuery("");
      onSearch("");
      searchInputRef.current?.blur();
    }
  };

  const getActiveFilterCount = () => {
    return filters.priority.length + filters.assignee.length + filters.tags.length;
  };

  const isPersonalWorkspace = projectId === "personal" || !projectId;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks..."
            className="pl-10 w-64"
          />
        </div>

        {/* Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {getActiveFilterCount() > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {getActiveFilterCount()}
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

            {/* Assignee (only for project workspaces) */}
            {!isPersonalWorkspace && (
              <>
                <div className="p-2">
                  <h4 className="text-xs font-medium mb-1">Assignee</h4>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    <DropdownMenuCheckboxItem
                      checked={filters.assignee.includes("unassigned")}
                      onCheckedChange={() => toggleFilter("assignee", "unassigned")}
                    >
                      Unassigned
                    </DropdownMenuCheckboxItem>
                    {projectMembers.map((member) => (
                      <DropdownMenuCheckboxItem
                        key={member.id}
                        checked={filters.assignee.includes(member.id)}
                        onCheckedChange={() => toggleFilter("assignee", member.id)}
                      >
                        {member.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Tags */}
            <div className="p-2">
              <h4 className="text-xs font-medium mb-1">Tags</h4>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {availableTags.length > 0 ? (
                  availableTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={filters.tags.includes(tag)}
                      onCheckedChange={() => toggleFilter("tags", tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground p-2">
                    {loading ? "Loading tags..." : "No tags available"}
                  </div>
                )}
              </div>
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="w-full text-xs"
                disabled={getActiveFilterCount() === 0}
              >
                Clear All Filters
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active filters display */}
        {getActiveFilterCount() > 0 && (
          <div className="flex items-center gap-1">
            {filters.priority.map((priority) => (
              <Badge key={priority} variant="secondary" className="text-xs">
                {priority}
              </Badge>
            ))}
            {filters.assignee.map((assigneeId) => {
              const member = projectMembers.find(m => m.id === assigneeId);
              return (
                <Badge key={assigneeId} variant="secondary" className="text-xs">
                  {assigneeId === "unassigned" ? "Unassigned" : member?.name || assigneeId}
                </Badge>
              );
            })}
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Sync indicator for unsaved changes */}
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-amber-600">
            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs">Unsaved changes</span>
            {onSync && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
                className="text-xs"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  "Sync"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Import/Export */}
        <TaskImportExport
          projectId={projectId}
          onTasksImported={onTasksImported}
        />

        {/* Add Task */}
        <Button onClick={onAddTask} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
