// Rename the route from /board to /kanban-board
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KanbanBoardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main board page
    router.replace("/board");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you to the board page</p>
      </div>
    </div>
  );
}
