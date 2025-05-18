// app/api/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/firebase";

export async function apiAuthMiddleware(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify Firebase token
    await auth.verifyIdToken(token);
    return null; // Continue to handler
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
