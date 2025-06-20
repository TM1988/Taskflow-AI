"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  Search, 
  Settings, 
  LogOut, 
  User, 
  Building, 
  ChevronDown, 
  ChevronRight,
  Plus, 
  Users, 
  Briefcase, 
  FolderPlus, 
  UserPlus, 
  FileText,
  Bell 
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext"; // Import the real context

// Remove the placeholder and use the real context
export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const workspaceContext = useWorkspace(); // Use the real context

  // Auto-expand organization if it has the current project
  React.useEffect(() => {
    if (workspaceContext.currentOrganization && workspaceContext.currentProject) {
      setExpandedOrgs(prev => {
        const newSet = new Set(prev);
        newSet.add(workspaceContext.currentOrganization!.id);
        return newSet;
      });
    }
  }, [workspaceContext.currentOrganization, workspaceContext.currentProject]);

  const toggleOrgExpansion = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="w-9 h-9 md:hidden"></div>
          
          {/* Workspace Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-left">
                <Building className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{workspaceContext.getWorkspaceDisplayName()}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {workspaceContext.isPersonalWorkspace ? "Workspace" : workspaceContext.currentProject ? "Project" : "Organization"}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Personal Section */}
              <div className="px-2 py-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">PERSONAL</p>
                <DropdownMenuItem 
                  onClick={() => {
                    router.push('/dashboard');
                  }}
                  className={workspaceContext.isPersonalWorkspace ? "bg-accent" : ""}
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">Personal Board</span>
                    <span className="text-xs text-muted-foreground">Your private workspace</span>
                  </div>
                  {workspaceContext.isPersonalWorkspace && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Organizations Section */}
              <div className="px-2 py-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">WORKSPACES</p>
                {workspaceContext.organizations && workspaceContext.organizations.length > 0 ? (
                  workspaceContext.organizations.map((org: any) => (
                    <div key={org.id}>
                      <div className="flex items-center">
                        <DropdownMenuItem 
                          onClick={() => router.push(`/organizations/${org.id}`)}
                          className={`flex-1 ${
                            workspaceContext.currentOrganization?.id === org.id && !workspaceContext.currentProject
                              ? "bg-accent" : ""
                          }`}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm">{org.name}</span>
                            <span className="text-xs text-muted-foreground">{org.role}</span>
                          </div>
                          {workspaceContext.currentOrganization?.id === org.id && !workspaceContext.currentProject && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                          )}
                        </DropdownMenuItem>
                        
                        {/* Collapsible toggle for projects */}
                        {org.projects && org.projects.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOrgExpansion(org.id);
                            }}
                          >
                            {expandedOrgs.has(org.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {/* Show projects under organization when expanded */}
                      {org.projects && org.projects.length > 0 && expandedOrgs.has(org.id) && (
                        <div className="ml-4 space-y-1 mt-1">
                          {org.projects.map((project: any) => (
                            <DropdownMenuItem 
                              key={project.id}
                              onClick={() => {
                                router.push(`/projects/${project.id}/dashboard`);
                              }}
                              className={
                                workspaceContext.currentProject?.id === project.id 
                                  ? "bg-accent text-accent-foreground" : ""
                              }
                            >
                              <div className="ml-2 mr-2 h-4 w-4 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                              </div>
                              <div className="flex flex-col flex-1">
                                <span className="text-sm">{project.name}</span>
                                <span className="text-xs text-muted-foreground">Project</span>
                              </div>
                              {workspaceContext.currentProject?.id === project.id && (
                                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-3 text-center">
                    <p className="text-xs text-muted-foreground">No organizations yet</p>
                  </div>
                )}
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Organization Management */}
              <DropdownMenuItem onClick={() => router.push("/organizations")}>
                <Briefcase className="mr-2 h-4 w-4" />
                Manage Organizations
              </DropdownMenuItem>
              
              {/* Debug: Refresh Organizations */}
              <DropdownMenuItem onClick={() => workspaceContext.refreshOrganizations()}>
                <Building className="mr-2 h-4 w-4" />
                Refresh Organizations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={`flex items-center transition-all ${searchOpen ? "flex-1 mx-4" : "w-auto"}`}
        >
          {searchOpen ? (
            <div className="relative w-full max-w-md mx-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects, tasks..."
                className="w-full pl-9 bg-muted/50"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="mr-2"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* New Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Add</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const basePath = workspaceContext.isPersonalWorkspace 
                  ? "/board" 
                  : `/projects/${workspaceContext.currentProject?.id}/board`;
                router.push(`${basePath}?new-task=true`);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/organizations")}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/team?invite=true")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/repositories")}>
                <FileText className="mr-2 h-4 w-4" />
                Connect Repository
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="relative h-8 w-8 p-0"
            onClick={() => router.push("/notifications")}
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.photoURL || ""}
                    alt={user?.displayName || "User"}
                  />
                  <AvatarFallback>
                    {user?.displayName
                      ? user.displayName.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Command Menu for Search and Navigation */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search tasks, projects, boards..."
          className="border-0 bg-muted/50 focus:ring-0"
        />
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandList>
          <CommandGroup heading="Tasks">
            {/* Tasks would be loaded separately from the current project */}
          </CommandGroup>
          <CommandGroup heading="Projects">
            {workspaceContext.currentOrganization?.projects?.map((project: any) => (
              <CommandItem
                key={project.id}
                onSelect={() => {
                  router.push(`/projects/${project.id}/dashboard`);
                  setSearchOpen(false);
                }}
              >
                {project.name}
              </CommandItem>
            )) || []}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
