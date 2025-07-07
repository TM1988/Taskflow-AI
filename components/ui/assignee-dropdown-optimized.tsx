"use client";

import { useState, useEffect, useCallback, useMemo, startTransition, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Users, RefreshCw, Loader2, AlertCircle } from "lucide-react";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: string;
}

interface AssigneeDropdownProps {
  projectId: string;
  selectedAssigneeId?: string;
  onAssigneeSelect: (assigneeId: string) => void;
  disabled?: boolean;
  className?: string;
  showRefreshButton?: boolean;
}

// Global cache with memory management
const membersCache = new Map<
  string,
  {
    members: ProjectMember[];
    timestamp: number;
    isLoading: boolean;
  }
>();

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const MAX_CACHE_SIZE = 20;
const MAX_RETRIES = 2;

// Cleanup cache to prevent memory leaks
const cleanupCache = () => {
  const now = Date.now();
  const entries = Array.from(membersCache.entries());

  // Remove expired entries
  entries.forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_DURATION) {
      membersCache.delete(key);
    }
  });

  // Limit cache size
  if (membersCache.size > MAX_CACHE_SIZE) {
    const oldest = entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, membersCache.size - MAX_CACHE_SIZE);
    oldest.forEach(([key]) => membersCache.delete(key));
  }
};

export function AssigneeDropdownOptimized({
  projectId,
  selectedAssigneeId = "unassigned",
  onAssigneeSelect,
  disabled = false,
  className,
  showRefreshButton = false,
}: AssigneeDropdownProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Optimized member fetching with deferred execution
  const fetchTeamMembers = useCallback(
    async (forceRefresh = false) => {
      if (!projectId || projectId === "personal") {
        startTransition(() => {
          setMembers([]);
          setLoading(false);
        });
        return;
      }

      // Abort any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Defer heavy operations to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 0));

      const now = Date.now();
      cleanupCache();
      const cached = membersCache.get(projectId);

      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION) {
        if (!cached.isLoading) {
          startTransition(() => {
            setMembers(cached.members);
            setError(null);
          });
          return;
        }

        // Wait for ongoing request
        if (cached.isLoading) {
          const checkInterval = setInterval(() => {
            const updatedCache = membersCache.get(projectId);
            if (updatedCache && !updatedCache.isLoading) {
              clearInterval(checkInterval);
              startTransition(() => {
                setMembers(updatedCache.members);
                setError(null);
              });
            }
          }, 200);

          setTimeout(() => clearInterval(checkInterval), 3000);
          return;
        }
      }

      // Prevent multiple simultaneous requests
      if (cached?.isLoading && !forceRefresh) {
        return;
      }

      try {
        startTransition(() => {
          setLoading(true);
          setError(null);
        });

        // Mark as loading in cache
        membersCache.set(projectId, {
          members: cached?.members || [],
          timestamp: now,
          isLoading: true,
        });

        console.log(
          `🔍 AssigneeDropdown: Fetching members for project ${projectId} (attempt ${retryCount + 1})`,
        );

        // Small delay to prevent immediate blocking
        await new Promise(resolve => setTimeout(resolve, 10));

        const response = await fetch(`/api/projects/${projectId}/members`, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Project not found");
          } else if (response.status === 403) {
            throw new Error("Access denied to project");
          } else {
            throw new Error(`Failed to fetch members (${response.status})`);
          }
        }

        const teamMembers = await response.json();

        if (!Array.isArray(teamMembers)) {
          throw new Error("Invalid response format");
        }

        console.log(
          `✅ AssigneeDropdown: Successfully fetched ${teamMembers.length} members`,
        );

        // Update cache with successful result
        membersCache.set(projectId, {
          members: teamMembers,
          timestamp: now,
          isLoading: false,
        });

        // Use startTransition for non-urgent updates
        startTransition(() => {
          setMembers(teamMembers);
          setRetryCount(0);
        });
      } catch (err) {
        console.error(
          `❌ AssigneeDropdown: Error fetching members:`,
          err,
        );

        // Update cache to mark as not loading
        if (cached) {
          membersCache.set(projectId, {
            ...cached,
            isLoading: false,
          });
        }

        // Handle abort errors silently
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load team members";

        // Implement retry logic for network errors
        if (
          retryCount < MAX_RETRIES &&
          err instanceof Error &&
          (err.name === "AbortError" ||
            err.message.includes("fetch") ||
            err.message.includes("network"))
        ) {
          console.log(
            `🔄 AssigneeDropdown: Retrying fetch (${retryCount + 1}/${MAX_RETRIES})`,
          );

          startTransition(() => {
            setRetryCount((prev) => prev + 1);
          });

          // Exponential backoff
          setTimeout(
            () => {
              fetchTeamMembers(forceRefresh);
            },
            Math.pow(2, retryCount) * 1000,
          );

          return;
        }

        startTransition(() => {
          setError(errorMessage);
        });

        // Use cached members if available
        if (cached?.members && cached.members.length > 0) {
          console.log(`📦 AssigneeDropdown: Using stale cached data`);
          startTransition(() => {
            setMembers(cached.members);
          });
        } else {
          startTransition(() => {
            setMembers([]);
          });
        }
      } finally {
        startTransition(() => {
          setLoading(false);
        });
      }
    },
    [projectId, retryCount],
  );

  // Debounced fetch on dropdown open with deferred execution
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && projectId && projectId !== "personal") {
        if (!isInitialized) {
          // Defer initialization to prevent blocking
          setTimeout(() => {
            setIsInitialized(true);
            const cached = membersCache.get(projectId);
            const now = Date.now();

            if (
              !cached ||
              now - cached.timestamp > CACHE_DURATION ||
              (cached.members.length === 0 && !cached.isLoading)
            ) {
              fetchTeamMembers();
            } else if (cached && !cached.isLoading) {
              startTransition(() => {
                setMembers(cached.members);
                setError(null);
              });
            }
          }, 100); // Delay to let dropdown render first
        }
      }
    },
    [projectId, fetchTeamMembers, isInitialized],
  );

  // Manual refresh function
  const refreshMembers = useCallback(() => {
    console.log("🔄 AssigneeDropdown: Manual refresh triggered");
    startTransition(() => {
      setRetryCount(0);
      setIsInitialized(true);
    });
    fetchTeamMembers(true);
  }, [fetchTeamMembers]);

  // Initialize with cached data if available
  useEffect(() => {
    if (projectId && projectId !== "personal") {
      const cached = membersCache.get(projectId);
      if (cached && cached.members.length > 0 && !cached.isLoading) {
        startTransition(() => {
          setMembers(cached.members);
          setError(null);
        });
      }
    }
  }, [projectId]);

  // Memoized selected member
  const selectedMember = useMemo(() => {
    return selectedAssigneeId !== "unassigned"
      ? members.find((m) => m.id === selectedAssigneeId)
      : null;
  }, [selectedAssigneeId, members]);

  // Memoized member initials calculation
  const getMemberInitials = useCallback((member: ProjectMember) => {
    if (member.name) {
      return member.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    }
    return member.email?.substring(0, 2).toUpperCase() || "??";
  }, []);

  // Virtualized member list for large teams
  const renderMemberItems = useMemo(() => {
    if (members.length === 0) {
      return (
        <SelectItem value="no-members" disabled>
          <div className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              No team members found
            </span>
          </div>
        </SelectItem>
      );
    }

    // For large teams, only render first 50 members to prevent performance issues
    const visibleMembers = members.slice(0, 50);
    const hasMore = members.length > 50;

    return (
      <>
        {visibleMembers.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            <div className="flex items-center gap-2 w-full">
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.photoURL} alt={member.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getMemberInitials(member)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {member.name || "Unknown User"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {member.email}
                </div>
              </div>
              {member.role && (
                <Badge
                  variant={member.role === "owner" ? "default" : "outline"}
                  className="text-xs ml-auto flex-shrink-0"
                >
                  {member.role === "owner" ? "Owner" : member.role}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
        {hasMore && (
          <SelectItem value="show-more" disabled>
            <div className="text-xs text-muted-foreground text-center py-1">
              ... and {members.length - 50} more members
            </div>
          </SelectItem>
        )}
      </>
    );
  }, [members, getMemberInitials]);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedAssigneeId}
        onValueChange={onAssigneeSelect}
        onOpenChange={handleOpenChange}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue>
            {selectedMember ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={selectedMember.photoURL}
                    alt={selectedMember.name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getMemberInitials(selectedMember)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {selectedMember.name || "Unknown User"}
                </span>
                {selectedMember.role && (
                  <Badge
                    variant={
                      selectedMember.role === "owner" ? "default" : "outline"
                    }
                    className="text-xs"
                  >
                    {selectedMember.role === "owner"
                      ? "Owner"
                      : selectedMember.role}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">Unassigned</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading members...</span>
              </div>
            </SelectItem>
          ) : error ? (
            <div className="p-2">
              <div className="flex items-center gap-2 text-destructive text-sm mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMembers}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              {/* Unassigned Option */}
              <SelectItem value="unassigned">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span>Unassigned</span>
                </div>
              </SelectItem>

              {/* Team Members */}
              {renderMemberItems}
            </>
          )}
        </SelectContent>
      </Select>

      {showRefreshButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={refreshMembers}
          disabled={loading}
          className="h-9 w-9 p-0"
          title="Refresh team members"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  );
}
