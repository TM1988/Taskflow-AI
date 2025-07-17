import { NextRequest } from 'next/server';

// Simple in-memory storage for active connections and rooms
// In production, you'd want to use Redis or another persistent store
const rooms = new Map<string, Set<any>>();
const connections = new Map<string, { ws: any; userId: string; projectId: string; userInfo: any }>();

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const userId = url.searchParams.get('userId');
  const organizationId = url.searchParams.get('organizationId');

  if (!projectId || !userId) {
    return new Response('Missing projectId or userId', { status: 400 });
  }

  // Check if this is a WebSocket upgrade request
  if (request.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  try {
    // For Next.js API routes, WebSocket handling is limited
    // This is a placeholder that would work with a custom server
    // In production, you'd want to use a service like Pusher, Ably, or Socket.IO
    
    return new Response(JSON.stringify({
      error: 'WebSocket endpoint not fully implemented',
      message: 'Real-time collaboration requires a WebSocket server. Consider using Pusher, Ably, or Socket.IO for production.',
      fallback: 'Polling mode will be used instead'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('WebSocket error:', error);
    return new Response('WebSocket connection failed', { status: 500 });
  }
}

// Helper functions for when using a proper WebSocket implementation
export function addUserToRoom(projectId: string, userId: string, connection: any) {
  const roomKey = `project:${projectId}`;
  
  if (!rooms.has(roomKey)) {
    rooms.set(roomKey, new Set());
  }
  
  const room = rooms.get(roomKey)!;
  room.add(userId);
  
  connections.set(userId, connection);
}

export function removeUserFromRoom(projectId: string, userId: string) {
  const roomKey = `project:${projectId}`;
  const room = rooms.get(roomKey);
  
  if (room) {
    room.delete(userId);
    if (room.size === 0) {
      rooms.delete(roomKey);
    }
  }
  
  connections.delete(userId);
}

export function broadcastToRoom(projectId: string, message: any, excludeUserId?: string) {
  const roomKey = `project:${projectId}`;
  const room = rooms.get(roomKey);
  
  if (!room) return;
  
  room.forEach(userId => {
    if (userId !== excludeUserId) {
      const connection = connections.get(userId);
      if (connection?.ws?.readyState === 1) { // WebSocket.OPEN
        connection.ws.send(JSON.stringify(message));
      }
    }
  });
}

export function getRoomUsers(projectId: string) {
  const roomKey = `project:${projectId}`;
  const room = rooms.get(roomKey);
  
  if (!room) return [];
  
  return Array.from(room).map(userId => {
    const connection = connections.get(userId);
    return connection ? {
      userId,
      userInfo: connection.userInfo,
    } : null;
  }).filter(Boolean);
}
