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
  Plus, 
  Users, 
  Briefcase, 
  FolderPlus, 
  UserPlus, 
  FileText, 
  Bell 
} from "lucide-react";
import { useAuth } from "@/services/auth/AuthContext";

// Simple workspace context placeholder since the actual one doesn't exist
const useWorkspace = () => ({
  getWorkspaceDisplayName: () => "Personal Workspace",
  isPersonalWorkspace: true,
  organizations: [] as any[],
  currentOrganization: null as any,
  currentProject: null as any,
  setWorkspace: (...args: any[]) => {},
});

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const workspaceContext = useWorkspace();

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
                    {workspaceContext.isPersonalWorkspace ? "Workspace" : "Organization"}
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
                  onClick={() => workspaceContext.setWorkspace('personal')}
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
                <p className="text-xs font-medium text-muted-foreground mb-1">ORGANIZATIONS</p>
                {workspaceContext.organizations && workspaceContext.organizations.length > 0 ? (
                  workspaceContext.organizations.map((org: any) => (
                    <div key={org.id}>
                      {org.projects && org.projects.map((project: any) => (
                        <DropdownMenuItem 
                          key={`${org.id}-${project.id}`}
                          onClick={() => workspaceContext.setWorkspace('organization', org.id, project.id)}
                          className={
                            workspaceContext.currentOrganization?.id === org.id && workspaceContext.currentProject?.id === project.id 
                              ? "bg-accent" : ""
                          }
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm">{org.name} / {project.name}</span>
                            <span className="text-xs text-muted-foreground">{org.role}</span>
                          </div>
                          {workspaceContext.currentOrganization?.id === org.id && workspaceContext.currentProject?.id === project.id && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
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
              <DropdownMenuItem onClick={() => router.push("/organizations/join")}>
                <Plus className="mr-2 h-4 w-4" />
                Join Organization
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
              <DropdownMenuItem onClick={() => router.push("/board?new-task=true")}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/projects?new=true")}>
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
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
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
              <DropdownMenuItem onClick={() => router.push("/settings")}>
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
            {workspaceContext.currentProject?.tasks?.map((task: any) => (
              <CommandItem
                key={task.id}
                onSelect={() => {
                  router.push(`/task/${task.id}`);
                  setSearchOpen(false);
                }}
              >
                {task.title}
              </CommandItem>
            )) || []}
          </CommandGroup>
          <CommandGroup heading="Projects">
            {workspaceContext.currentOrganization?.projects?.map((project: any) => (
              <CommandItem
                key={project.id}
                onSelect={() => {
                  router.push(`/board?projectId=${project.id}`);
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
