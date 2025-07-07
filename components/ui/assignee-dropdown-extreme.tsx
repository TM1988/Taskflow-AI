"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { resolveRoleName } from "@/utils/role-name-resolver";
import { ChevronDown, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: string;
  workload?: {
    assignedTasks: number;
    taskLimit: number;
    workloadPercentage: number;
    isAtLimit: boolean;
  };
}

interface AssigneeDropdownExtremeProps {
  projectId: string;
  selectedAssigneeId?: string;
  onAssigneeSelect: (assigneeId: string) => void;
  disabled?: boolean;
  className?: string;
  organizationId?: string;
  showRefreshButton?: boolean;
}

// Improved cache with timestamps
const membersCache = new Map<
  string,
  {
    members: ProjectMember[];
    timestamp: number;
  }
>();

// Cache duration - 5 seconds for immediate updates
const CACHE_DURATION = 5 * 1000;

export function AssigneeDropdownExtreme({
  projectId,
  selectedAssigneeId = "unassigned",
  onAssigneeSelect,
  disabled = false,
  className = "",
  organizationId,
  showRefreshButton = false,
}: AssigneeDropdownExtremeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workloadData, setWorkloadData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Debug the selectedAssigneeId prop
  console.log("🔽 [ASSIGNEE DROPDOWN] Component rendered with props:", {
    projectId,
    selectedAssigneeId,
    selectedAssigneeIdType: typeof selectedAssigneeId,
    disabled,
    organizationId,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load members once
  useEffect(() => {
    if (!projectId || projectId === "personal") return;

    const fetchMembers = async () => {
      const cached = membersCache.get(projectId);
      const now = Date.now();

      // Use cache if it exists and is not expired
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setMembers(cached.members);
        return;
      }

      // Clear expired cache
      if (cached && now - cached.timestamp >= CACHE_DURATION) {
        membersCache.delete(projectId);
      }

      // Set loading state and fetch members
      setIsLoading(true);
      const apiUrl = organizationId
        ? `/api/projects/${projectId}/members?organizationId=${organizationId}&t=${Date.now()}`
        : `/api/projects/${projectId}/members?t=${Date.now()}`;
      fetch(apiUrl)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(async (data) => {
          const membersList = Array.isArray(data) ? data : [];

          // Fetch workload data for each member
          const workloadPromises = membersList.map(
            async (member: ProjectMember) => {
              try {
                const workloadResponse = await fetch(
                  `/api/analytics/member-workload?projectId=${projectId}&memberId=${member.id}${organizationId ? `&organizationId=${organizationId}` : ""}`,
                );
                if (workloadResponse.ok) {
                  const workloadData = await workloadResponse.json();
                  return {
                    ...member,
                    workload: {
                      assignedTasks: workloadData.assignedTasks || 0,
                      taskLimit: workloadData.taskLimit || 10,
                      workloadPercentage: workloadData.workloadPercentage || 0,
                      isAtLimit:
                        (workloadData.assignedTasks || 0) >=
                        (workloadData.taskLimit || 10),
                    },
                  };
                }
                return member;
              } catch (error) {
                console.error(
                  `Error fetching workload for member ${member.id}:`,
                  error,
                );
                return member;
              }
            },
          );

          const membersWithWorkload = await Promise.all(workloadPromises);

          // Update cache with timestamp
          membersCache.set(projectId, {
            members: membersWithWorkload,
            timestamp: Date.now(),
          });
          setMembers(membersWithWorkload);
        })
        .catch((error) => {
          console.error("Error fetching members:", error);
          membersCache.set(projectId, { members: [], timestamp: Date.now() });
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchMembers();

    // Listen for workload changes
    const handleWorkloadChange = (event: CustomEvent) => {
      if (event.detail?.projectId === projectId) {
        console.log(
          "🔄 [ASSIGNEE DROPDOWN] Workload changed - refreshing members",
        );
        // Clear cache and refetch
        membersCache.delete(projectId);
        fetchMembers();
      }
    };

    window.addEventListener(
      "workloadChanged",
      handleWorkloadChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "workloadChanged",
        handleWorkloadChange as EventListener,
      );
    };
  }, [projectId, organizationId]);

  // Pre-compute current assignee info
  const currentAssignee = useMemo(() => {
    console.log("🔍 [ASSIGNEE DROPDOWN] Computing currentAssignee:", {
      selectedAssigneeId,
      membersCount: members.length,
      memberIds: members.map((m) => m.id),
      isUnassigned: selectedAssigneeId === "unassigned",
      hasSelectedId: !!selectedAssigneeId,
    });

    if (selectedAssigneeId === "unassigned" || !selectedAssigneeId) {
      console.log("🔽 [ASSIGNEE DROPDOWN] Returning unassigned");
      return {
        id: "unassigned",
        name: "Unassigned",
        email: "",
        photoURL: undefined,
      };
    }

    const foundMember = members.find((m) => m.id === selectedAssigneeId);
    console.log("🔍 [ASSIGNEE DROPDOWN] Member lookup:", {
      searchingFor: selectedAssigneeId,
      foundMember: foundMember
        ? { id: foundMember.id, name: foundMember.name }
        : null,
      allMembers: members.map((m) => ({ id: m.id, name: m.name })),
    });

    return (
      foundMember || {
        id: selectedAssigneeId,
        name: "Unknown User",
        email: "",
        photoURL: undefined,
      }
    );
  }, [members, selectedAssigneeId]);

  // Simple change handler with workload checking
  const handleAssigneeChange = useCallback(
    (assigneeId: string) => {
      console.log("🔄 [ASSIGNEE DROPDOWN] Assignee change triggered:", {
        newAssigneeId: assigneeId,
        currentSelectedId: selectedAssigneeId,
        willChange: assigneeId !== selectedAssigneeId && !disabled,
        disabled,
      });

      // Check if member is at limit (but allow unassigning or changing to current assignee)
      if (assigneeId !== "unassigned" && assigneeId !== selectedAssigneeId) {
        const member = members.find((m) => m.id === assigneeId);
        if (member?.workload?.isAtLimit) {
          // Show toast notification
          toast({
            title: "Assignment Failed",
            description: `${member.name} is at their task limit (${member.workload.assignedTasks}/${member.workload.taskLimit}). Please free up their workload to assign more tasks.`,
            variant: "destructive",
          });
          // Don't change assignment, just close dropdown
          setIsOpen(false);
          return;
        }
      }

      if (assigneeId !== selectedAssigneeId && !disabled) {
        onAssigneeSelect(assigneeId);
      }
      setIsOpen(false);
    },
    [selectedAssigneeId, disabled, onAssigneeSelect, members],
  );

  // Optimized click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Optimized avatar rendering - minimal DOM
  const renderAssigneeInfo = useCallback((assignee: ProjectMember) => {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
          {assignee.photoURL ? (
            <img
              src={assignee.photoURL}
              alt={assignee.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        <span className="text-sm font-medium truncate">{assignee.name}</span>
      </div>
    );
  }, []);

  // Add refresh function to manually reload members
  const refreshMembers = useCallback(() => {
    if (!projectId || projectId === "personal" || isLoading) return;

    // Clear cache for this project
    membersCache.delete(projectId);

    // Set loading state and fetch members
    setIsLoading(true);
    const apiUrl = organizationId
      ? `/api/projects/${projectId}/members?organizationId=${organizationId}&t=${Date.now()}`
      : `/api/projects/${projectId}/members?t=${Date.now()}`;
    fetch(apiUrl)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(async (data) => {
        const membersList = Array.isArray(data) ? data : [];

        // Fetch workload data for each member
        const workloadPromises = membersList.map(
          async (member: ProjectMember) => {
            try {
              const workloadResponse = await fetch(
                `/api/analytics/member-workload?projectId=${projectId}&memberId=${member.id}${organizationId ? `&organizationId=${organizationId}` : ""}`,
              );
              if (workloadResponse.ok) {
                const workloadData = await workloadResponse.json();
                return {
                  ...member,
                  workload: {
                    assignedTasks: workloadData.assignedTasks || 0,
                    taskLimit: workloadData.taskLimit || 10,
                    workloadPercentage: workloadData.workloadPercentage || 0,
                    isAtLimit:
                      (workloadData.assignedTasks || 0) >=
                      (workloadData.taskLimit || 10),
                  },
                };
              }
              return member;
            } catch (error) {
              console.error(
                `Error fetching workload for member ${member.id}:`,
                error,
              );
              return member;
            }
          },
        );

        const membersWithWorkload = await Promise.all(workloadPromises);

        console.log(
          `🔄 Refreshed members for project ${projectId}:`,
          membersWithWorkload.length,
        );
        // Update cache with timestamp
        membersCache.set(projectId, {
          members: membersWithWorkload,
          timestamp: Date.now(),
        });
        setMembers(membersWithWorkload);
      })
      .catch((error) => {
        console.error("Error refreshing members:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId, isLoading]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button with optional refresh */}
      <div className="flex">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={`
            ${showRefreshButton ? "flex-1" : "w-full"} px-3 py-2 text-left bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md
            ${showRefreshButton ? "rounded-r-none" : ""}
            shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed
            text-gray-900 dark:text-gray-100 transition-none
          `}
          style={{ minHeight: "38px" }}
        >
          <div className="flex items-center justify-between">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              renderAssigneeInfo(currentAssignee)
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-75 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Refresh button */}
        {showRefreshButton && (
          <button
            type="button"
            onClick={refreshMembers}
            disabled={disabled || isLoading}
            title="Refresh members list"
            className={`
            px-2 py-2 bg-white dark:bg-black border border-gray-300 dark:border-gray-700
            border-l-0 rounded-r-md shadow-sm focus:outline-none focus:ring-2
            focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
            text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
          `}
            style={{ minHeight: "38px" }}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-refresh-cw"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Dropdown Menu - only render when open */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
          style={{
            minWidth:
              (buttonRef.current?.offsetWidth || 200) +
              (showRefreshButton ? 40 : 0),
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {/* Unassigned Option */}
          <button
            type="button"
            onClick={() => handleAssigneeChange("unassigned")}
            disabled={selectedAssigneeId === "unassigned"}
            className={`
              w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900
              focus:outline-none transition-colors duration-75
              disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
              border-none bg-transparent text-gray-900 dark:text-gray-100
            `}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
              </div>
              <span className="text-sm font-medium">Unassigned</span>
            </div>
          </button>

          {/* Team Members */}
          {members.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                Team Members
              </div>
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleAssigneeChange(member.id)}
                  disabled={
                    member.id === selectedAssigneeId ||
                    member.workload?.isAtLimit
                  }
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900
                    focus:outline-none transition-colors duration-75
                    disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                    border-none bg-transparent text-gray-900 dark:text-gray-100
                    ${member.workload?.isAtLimit ? "opacity-60" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    {renderAssigneeInfo(member)}
                    <div className="flex items-center gap-2">
                      {member.workload?.isAtLimit && (
                        <div
                          className="flex items-center gap-1 text-red-500"
                          title="This member is at their limit, free up their workload to assign more tasks"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 max-w-32 truncate">
                        {member.workload
                          ? `${member.workload.assignedTasks}/${member.workload.taskLimit}`
                          : resolveRoleName(member.role || "member")}
                      </span>
                    </div>
                  </div>
                  {member.workload?.isAtLimit && (
                    <div className="text-xs text-red-500 mt-1">
                      This member is at their limit, free up their workload to
                      assign more tasks
                    </div>
                  )}
                </button>
              ))}
            </>
          )}

          {/* No members state */}
          {members.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No team members found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Clear cache function - more aggressive clearing
export function clearAssigneeCache(projectId?: string) {
  if (projectId) {
    console.log(`🧹 Clearing assignee cache for project: ${projectId}`);
    membersCache.delete(projectId);

    // Also clear any related cache entries
    const keysToDelete = [];
    for (const [key] of Array.from(membersCache.entries())) {
      if (key.includes(projectId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => membersCache.delete(key));
  } else {
    console.log("🧹 Clearing all assignee cache");
    membersCache.clear();
  }
}

// Global function to be called when a member is added to a project
export function invalidateProjectMembersCache(projectId: string) {
  if (projectId) {
    console.log(`🔄 Invalidating assignee cache for project: ${projectId}`);
    membersCache.delete(projectId);

    // Force immediate refresh for any mounted components
    window.dispatchEvent(
      new CustomEvent("assignee-cache-invalidated", {
        detail: { projectId },
      }),
    );
  }
}
