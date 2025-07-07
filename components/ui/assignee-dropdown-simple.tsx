"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

// Simple in-memory cache
const membersCache = new Map<string, { members: ProjectMember[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AssigneeDropdownSimple({
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
  const [hasOpened, setHasOpened] = useState(false);

  // Simple fetch function with basic error handling
  const fetchMembers = useCallback(async (force = false) => {
    if (!projectId || projectId === "personal") {
      setMembers([]);
      return;
    }

    // Check cache first
    if (!force) {
      const cached = membersCache.get(projectId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setMembers(cached.members);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/members`);

      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }

      const data = await response.json();
      const membersList = Array.isArray(data) ? data : [];

      // Cache the result
      membersCache.set(projectId, {
        members: membersList,
        timestamp: Date.now(),
      });

      setMembers(membersList);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(err instanceof Error ? err.message : "Failed to load members");

      // Try to use stale cache data if available
      const cached = membersCache.get(projectId);
      if (cached) {
        setMembers(cached.members);
      } else {
        setMembers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Only fetch when dropdown opens for the first time
  const handleOpenChange = useCallback((open: boolean) => {
    if (open && !hasOpened && projectId && projectId !== "personal") {
      setHasOpened(true);
      // Small delay to let dropdown render first
      setTimeout(() => {
        fetchMembers();
      }, 50);
    }
  }, [hasOpened, projectId, fetchMembers]);

  const refreshMembers = useCallback(() => {
    fetchMembers(true);
  }, [fetchMembers]);

  // Find selected member
  const selectedMember = useMemo(() => {
    return selectedAssigneeId !== "unassigned"
      ? members.find((m) => m.id === selectedAssigneeId)
      : null;
  }, [selectedAssigneeId, members]);

  // Helper to get member initials
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
                <span className="truncate">{error}</span>
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
              {members.length === 0 ? (
                <SelectItem value="no-members" disabled>
                  <div className="flex items-center gap-2 py-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      No team members found
                    </span>
                  </div>
                </SelectItem>
              ) : (
                members.map((member) => (
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
                          variant={
                            member.role === "owner" ? "default" : "outline"
                          }
                          className="text-xs ml-auto flex-shrink-0"
                        >
                          {member.role === "owner" ? "Owner" : member.role}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
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
