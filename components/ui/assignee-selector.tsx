"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { X, User, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: string;
}

interface AssigneeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  selectedAssigneeId?: string;
  onAssigneeSelect: (assigneeId: string) => void;
  className?: string;
}

export function AssigneeSelector({
  open,
  onOpenChange,
  projectId,
  selectedAssigneeId = "unassigned",
  onAssigneeSelect,
  className
}: AssigneeSelectorProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members when popup opens
  useEffect(() => {
    if (open && projectId && projectId !== "personal") {
      fetchTeamMembers();
    }
  }, [open, projectId]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 AssigneeSelector: Starting to fetch Firebase members for projectId:', projectId);
      
      // Always use Firebase for members since organizations/projects are stored there
      let apiUrl = `/api/projects/${projectId}/members?t=${Date.now()}&source=firebase`;
      
      console.log('🌐 AssigneeSelector: Fetching from URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('🌐 AssigneeSelector: API response status:', response.status);
      
      if (response.ok) {
        const teamMembers = await response.json();
        console.log('✅ AssigneeSelector: Fetched Firebase team members:', teamMembers);
        console.log('📊 AssigneeSelector: Members count:', teamMembers?.length || 0);
        setMembers(teamMembers || []);
      } else {
        const errorText = await response.text();
        console.error('❌ AssigneeSelector: API error response:', errorText);
        throw new Error(`Failed to fetch team members: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.error('❌ AssigneeSelector: Error fetching team members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeSelect = (assigneeId: string) => {
    console.log('🎯 AssigneeSelector: Selected assignee:', assigneeId);
    onAssigneeSelect(assigneeId);
    onOpenChange(false);
  };

  const handleClose = () => {
    console.log('❌ AssigneeSelector: Closing popup');
    onOpenChange(false);
  };

  const getSelectedMember = () => {
    if (selectedAssigneeId === "unassigned") return null;
    return members.find(m => m.id === selectedAssigneeId);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Popup */}
      <div 
        className={cn(
          "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "bg-background border border-border rounded-lg shadow-2xl z-[99999]",
          "w-[75vw] max-w-xs max-h-[55vh] overflow-hidden",
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{ 
          pointerEvents: 'auto',
          isolation: 'isolate'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Select Assignee</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="h-6 w-6 p-0 hover:bg-muted"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[45vh]">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-sm text-muted-foreground">Loading team members...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <div className="text-destructive text-sm">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchTeamMembers();
                }}
                className="mt-2"
                style={{ pointerEvents: 'auto' }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="p-2">
              {/* Unassigned Option */}
              <Card 
                className={cn(
                  "p-2 mb-2 cursor-pointer transition-all hover:bg-muted/50",
                  selectedAssigneeId === "unassigned" && "ring-2 ring-primary bg-muted"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAssigneeSelect("unassigned");
                }}
                style={{ pointerEvents: 'auto' }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Unassigned</div>
                    <div className="text-xs text-muted-foreground">No one assigned</div>
                  </div>
                  {selectedAssigneeId === "unassigned" && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </Card>

              {/* Team Members */}
              {members.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm">No team members found</p>
                  <p className="text-xs mt-1">Add members via the Team page</p>
                </div>
              ) : (
                members.map((member) => (
                  <Card 
                    key={member.id}
                    className={cn(
                      "p-2 mb-2 cursor-pointer transition-all hover:bg-muted/50",
                      selectedAssigneeId === member.id && "ring-2 ring-primary bg-muted"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAssigneeSelect(member.id);
                    }}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.photoURL} alt={member.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{member.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {member.role && (
                          <Badge 
                            variant={member.role === "owner" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {member.role === "owner" ? "Owner" : member.role}
                          </Badge>
                        )}
                        {selectedAssigneeId === member.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-muted/20">
          <div className="text-xs text-muted-foreground text-center">
            {members.length > 0 
              ? `${members.length} team member${members.length === 1 ? '' : 's'} available`
              : 'Manage team members via Project → Team page'
            }
          </div>
        </div>
      </div>
    </>
  );
}

interface AssigneeButtonProps {
  selectedAssigneeId?: string;
  members: ProjectMember[];
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function AssigneeButton({
  selectedAssigneeId = "unassigned",
  members,
  onClick,
  disabled = false,
  className
}: AssigneeButtonProps) {
  const selectedMember = selectedAssigneeId !== "unassigned" 
    ? members.find(m => m.id === selectedAssigneeId)
    : null;

  return (
    <Button
      variant="outline"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        "w-full justify-start text-left h-auto p-3",
        className
      )}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex items-center gap-3 w-full">
        {selectedMember ? (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedMember.photoURL} alt={selectedMember.name} />
              <AvatarFallback className="bg-blue-500 text-white text-sm">
                {selectedMember.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{selectedMember.name}</div>
              <div className="text-xs text-muted-foreground truncate">{selectedMember.email}</div>
            </div>
            {selectedMember.role && (
              <Badge 
                variant={selectedMember.role === "owner" ? "default" : "outline"}
                className="text-xs"
              >
                {selectedMember.role === "owner" ? "Owner" : selectedMember.role}
              </Badge>
            )}
          </>
        ) : (
          <>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm text-gray-700">Unassigned</div>
              <div className="text-xs text-muted-foreground">Click to assign someone</div>
            </div>
          </>
        )}
        <Users className="h-4 w-4 text-gray-400" />
      </div>
    </Button>
  );
}
