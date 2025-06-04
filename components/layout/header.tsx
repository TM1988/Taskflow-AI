"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Search, ChevronDown, Plus, FolderPlus, UserPlus, FileText, Settings, Building, User, Users, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/services/auth/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Add fallback to prevent context errors
  let workspaceData;
  try {
    workspaceData = useWorkspace();
  } catch (error) {
    // Fallback when context is not available
    workspaceData = {
      currentWorkspace: 'personal' as const,
      organizations: [],
      setWorkspace: () => {},
      getWorkspaceDisplayName: () => 'Personal',
      isPersonalWorkspace: true,
      currentOrganization: null,
      currentProject: null
    };
  }

  const {
    currentWorkspace,
    organizations,
    setWorkspace,
    getWorkspaceDisplayName,
    isPersonalWorkspace,
    currentOrganization,
    currentProject
  } = workspaceData;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
                  <span className="text-sm font-medium">{getWorkspaceDisplayName()}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {isPersonalWorkspace ? "Workspace" : "Organization"}
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
                  onClick={() => setWorkspace('personal')}
                  className={isPersonalWorkspace ? "bg-accent" : ""}
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">Personal Board</span>
                    <span className="text-xs text-muted-foreground">Your private workspace</span>
                  </div>
                  {isPersonalWorkspace && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Organizations Section */}
              <div className="px-2 py-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">ORGANIZATIONS</p>
                {organizations && organizations.length > 0 ? (
                  organizations.map((org) => (
                    <div key={org.id}>
                      {org.projects && org.projects.map((project) => (
                        <DropdownMenuItem 
                          key={`${org.id}-${project.id}`}
                          onClick={() => setWorkspace('organization', org.id, project.id)}
                          className={
                            currentOrganization?.id === org.id && currentProject?.id === project.id 
                              ? "bg-accent" : ""
                          }
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <div className="flex flex-col flex-1">
                            <span className="text-sm">{org.name} / {project.name}</span>
                            <span className="text-xs text-muted-foreground">{org.role}</span>
                          </div>
                          {currentOrganization?.id === org.id && currentProject?.id === project.id && (
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

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive"></span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://i.pravatar.cc/150?img=${i}`} />
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm">New comment on your task</p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

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
    </header>
  );
}
