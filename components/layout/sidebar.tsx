"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ActivityIcon,
  BarChart3Icon,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CodeIcon,
  Home,
  LayoutDashboardIcon,
  MenuIcon,
  PanelLeftClose,
  Settings,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogoIcon } from "@/components/icons";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Sidebar() {
  const { isExpanded, toggle } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { 
    isPersonalWorkspace, 
    getWorkspaceDisplayName, 
    currentProject
  } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  // Determine if we're on a project page by checking the URL pattern
  const isOnProjectPage = pathname.startsWith('/projects/');
  const projectIdFromUrl = isOnProjectPage ? pathname.split('/')[2] : null;

  // Generate base path for navigation - use URL to determine context, not workspace context
  const getBasePath = () => {
    if (isOnProjectPage && projectIdFromUrl) {
      return `/projects/${projectIdFromUrl}`;
    }
    return '';
  };

  // Context‐aware navigation items - based on URL, not workspace context
  const navigationItems = [
    {
      name: "Dashboard",
      href: isOnProjectPage ? `${getBasePath()}/dashboard` : "/dashboard",
      icon: <LayoutDashboardIcon className="h-4 w-4" />,
      description: isOnProjectPage ? "Project overview" : "Personal overview",
    },
    {
      name: "Board",
      href: isOnProjectPage ? `${getBasePath()}/board` : "/board",
      icon: <ActivityIcon className="h-4 w-4" />,
      description: isOnProjectPage ? "Project task board" : "Personal task board",
    },
    {
      name: "Analytics",
      href: isOnProjectPage ? `${getBasePath()}/analytics` : "/analytics",
      icon: <BarChart3Icon className="h-4 w-4" />,
      description: isOnProjectPage ? "Project analytics" : "Personal analytics",
    },
    {
      name: isOnProjectPage ? "Repositories" : "Personal Repos",
      href: isOnProjectPage ? `${getBasePath()}/repositories` : "/repositories",
      icon: <CodeIcon className="h-4 w-4" />,
      description: isOnProjectPage ? "Project repositories" : "Your repositories",
    },
    {
      name: isOnProjectPage ? "Team" : "Contacts",
      href: isOnProjectPage ? `${getBasePath()}/team` : "/team",
      icon: <UsersIcon className="h-4 w-4" />,
      description: isOnProjectPage ? "Project team" : "Personal contacts",
    },
    {
      name: "Settings",
      href: isOnProjectPage ? `${getBasePath()}/settings` : "/settings",
      icon: <Settings2Icon className="h-4 w-4" />,
      description: isOnProjectPage ? "Project settings" : "Personal settings",
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-6">
        {!collapsed && (
          <div className="flex items-center gap-2 font-semibold">
            <LogoIcon className="h-6 w-6 text-primary" />
            <span className="text-lg">TaskFlow-AI</span>
          </div>
        )}
        {collapsed && <LogoIcon className="h-6 w-6 text-primary mx-auto" />}
      </div>
      <div className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navigationItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              onClick={() => router.replace(item.href)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent justify-start h-auto",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                collapsed && "justify-center"
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </Button>
          ))}
        </nav>
      </div>
      <Separator />
      <div className="p-3">
        {!collapsed ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            <span>Collapse</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            className="w-full"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "bg-background border-r flex flex-col h-full transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}