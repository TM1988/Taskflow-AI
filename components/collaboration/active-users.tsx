"use client";

import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users } from 'lucide-react';

interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

interface ActiveUsersProps {
  getActiveUsers: () => ActiveUser[];
  className?: string;
}

export default function ActiveUsers({ getActiveUsers, className = '' }: ActiveUsersProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const users = getActiveUsers();
      setActiveUsers(users);
    };

    // Update immediately
    updateUsers();

    // Update every 2 seconds to refresh user status
    const interval = setInterval(updateUsers, 2000);

    return () => clearInterval(interval);
  }, [getActiveUsers]);

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Live:</span>
        </div>
        
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-green-500">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.name} is actively editing</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {activeUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center ring-2 ring-green-500">
                  <span className="text-xs font-medium">+{activeUsers.length - 5}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {activeUsers.slice(5).map((user) => (
                    <p key={user.id}>{user.name}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          {activeUsers.length} online
        </Badge>
      </div>
    </TooltipProvider>
  );
}
