// app/api/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/services/admin/firebaseAdmin";

export async function apiAuthMiddleware(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify Firebase token
    await adminAuth.verifyIdToken(token);
    return null; // Continue to handler
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
