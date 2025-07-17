"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/services/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RealtimeCollaborationOptions {
  projectId: string;
  organizationId?: string;
  onTaskUpdate?: (task: any) => void;
  onTaskCreate?: (task: any) => void;
  onTaskDelete?: (taskId: string) => void;
  onColumnUpdate?: (column: any) => void;
  onUserJoined?: (user: any) => void;
  onUserLeft?: (userId: string) => void;
  onCursorMove?: (cursor: { userId: string; x: number; y: number; userInfo: any }) => void;
}

interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

export function useRealtimeCollaboration(options: RealtimeCollaborationOptions) {
  const {
    projectId,
    organizationId,
    onTaskUpdate,
    onTaskCreate,
    onTaskDelete,
    onColumnUpdate,
    onUserJoined,
    onUserLeft,
    onCursorMove,
  } = options;

  const { user } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const activeUsersRef = useRef<Map<string, ActiveUser>>(new Map());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const getActiveUsers = useCallback(() => {
    return Array.from(activeUsersRef.current.values());
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const handleCursorMove = useCallback((event: MouseEvent) => {
    if (!user) return;

    const message = {
      type: 'cursor_move',
      projectId,
      organizationId,
      userId: user.uid,
      userInfo: {
        name: user.displayName || user.email || 'Anonymous',
        avatar: user.photoURL,
      },
      cursor: {
        x: event.clientX,
        y: event.clientY,
      },
      timestamp: Date.now(),
    };

    sendMessage(message);
  }, [user, projectId, organizationId, sendMessage]);

  const throttledCursorMove = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      return (event: MouseEvent) => {
        if (timeoutId) return;
        timeoutId = setTimeout(() => {
          handleCursorMove(event);
          timeoutId = null;
        }, 50); // Throttle to 20 FPS
      };
    })(),
    [handleCursorMove]
  );

  const connect = useCallback(() => {
    if (!user || !projectId) return;

    try {
      // Try WebSocket first, fall back to polling
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws/collaboration?projectId=${projectId}&userId=${user.uid}${organizationId ? `&organizationId=${organizationId}` : ''}`;
      
      // For now, we'll simulate real-time collaboration with a polling fallback
      // since Next.js API routes don't support WebSocket easily
      console.log('[Realtime] Using polling fallback for collaboration');
      
      // Simulate connection success
      reconnectAttempts.current = 0;
      
      // Send join notification
      if (onUserJoined) {
        // Simulate other users for demo purposes
        setTimeout(() => {
          onUserJoined({
            id: 'demo-user-1',
            name: 'Demo Collaborator',
            lastSeen: Date.now(),
          });
        }, 2000);
      }

      // Start polling for changes (simplified version)
      heartbeatIntervalRef.current = setInterval(() => {
        // In a real implementation, this would poll for changes
        console.log('[Realtime] Polling for collaboration updates...');
      }, 10000);

      // Add cursor tracking for demo
      document.addEventListener('mousemove', throttledCursorMove);
      
    } catch (error) {
      console.error('[Realtime] Failed to connect:', error);
    }
  }, [
    user,
    projectId,
    organizationId,
    throttledCursorMove,
    onUserJoined,
  ]);

  const disconnect = useCallback(() => {
    // Clean up polling/demo timers
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    document.removeEventListener('mousemove', throttledCursorMove);
    activeUsersRef.current.clear();
  }, [throttledCursorMove]);

  // Broadcast task updates (for demo, these will just log)
  const broadcastTaskUpdate = useCallback((task: any) => {
    console.log('[Realtime] Broadcasting task update:', task.title);
    // In a real implementation, this would send to server
  }, []);

  const broadcastTaskCreate = useCallback((task: any) => {
    console.log('[Realtime] Broadcasting task create:', task.title);
    // In a real implementation, this would send to server
  }, []);

  const broadcastTaskDelete = useCallback((taskId: string) => {
    console.log('[Realtime] Broadcasting task delete:', taskId);
    // In a real implementation, this would send to server
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    getActiveUsers,
    broadcastTaskUpdate,
    broadcastTaskCreate,
    broadcastTaskDelete,
    isConnected: true, // Simulated as connected for demo
  };
}
