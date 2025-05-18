'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ActivityIcon,
  BarChart3Icon,
  ChevronLeft,
  ChevronRight,
  CodeIcon,
  LayoutDashboardIcon,
  MenuIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogoIcon } from "@/components/icons";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

function NavItem({ href, icon, label, active, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-accent",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
        collapsed && "justify-center"
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  // Navigation items
  const navItems = [
    {
      href: "/",
      icon: <LayoutDashboardIcon className="h-4 w-4" />,
      label: "Dashboard",
    },
    {
      href: "/board",
      icon: <ActivityIcon className="h-4 w-4" />,
      label: "Board",
    },
    {
      href: "/analytics",
      icon: <BarChart3Icon className="h-4 w-4" />,
      label: "Analytics",
    },
    {
      href: "/repositories",
      icon: <CodeIcon className="h-4 w-4" />,
      label: "Repositories",
    },
    {
      href: "/team",
      icon: <UsersIcon className="h-4 w-4" />,
      label: "Team",
    },
    {
      href: "/settings",
      icon: <Settings2Icon className="h-4 w-4" />,
      label: "Settings",
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
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              collapsed={collapsed}
            />
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
          "border-r bg-card hidden md:block transition-all duration-300",
          collapsed ? "w-[70px]" : "w-[240px]"
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