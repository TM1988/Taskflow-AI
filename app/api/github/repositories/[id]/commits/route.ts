// app/api/github/repositories/[id]/commits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { githubServiceServer } from "@/services/github/githubServiceServer";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  // Use environment variables or a service account
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminAuth = getAuth();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const repoId = params.id;

    // For now, simplify by not using token verification
    // We'll just get the userId from a query parameter
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get repository from database
    const repository = await githubServiceServer.getRepositoryById(repoId);
    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    // Get commits
    const commits = await githubServiceServer.getRepositoryCommits(
      userId,
      repository.fullName,
    );

    return NextResponse.json(commits);
  } catch (error) {
    console.error("Error fetching repository commits:", error);
    return NextResponse.json(
      { error: "Failed to fetch commits" },
      { status: 500 },
    );
  }
}
