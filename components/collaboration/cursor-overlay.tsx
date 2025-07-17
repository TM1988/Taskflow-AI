"use client";

import { useState, useEffect } from 'react';

interface CursorData {
  userId: string;
  x: number;
  y: number;
  userInfo: {
    name: string;
    avatar?: string;
  };
}

interface CursorOverlayProps {
  cursors: Map<string, CursorData>;
}

const CursorPointer = ({ cursor }: { cursor: CursorData }) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  // Generate consistent color based on userId
  const colorIndex = cursor.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-all duration-75 ease-out"
      style={{
        left: cursor.x,
        top: cursor.y,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor pointer */}
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="drop-shadow-md"
        >
          <path
            d="M3 3L17 9L10 10L9 17L3 3Z"
            className={`${bgColor.replace('bg-', 'fill-')}`}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
        
        {/* User name label */}
        <div
          className={`absolute left-5 top-2 ${bgColor} text-white text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-lg border border-white/20`}
        >
          {cursor.userInfo.name}
        </div>
      </div>
    </div>
  );
};

export default function CursorOverlay({ cursors }: CursorOverlayProps) {
  const [visibleCursors, setVisibleCursors] = useState<Map<string, CursorData>>(new Map());

  useEffect(() => {
    // Filter out stale cursors (older than 5 seconds)
    const now = Date.now();
    const activeCursors = new Map();
    
    cursors.forEach((cursor, userId) => {
      // We'll add timestamp tracking in the hook if needed
      activeCursors.set(userId, cursor);
    });
    
    setVisibleCursors(activeCursors);
  }, [cursors]);

  return (
    <>
      {Array.from(visibleCursors.values()).map((cursor) => (
        <CursorPointer key={cursor.userId} cursor={cursor} />
      ))}
    </>
  );
}
