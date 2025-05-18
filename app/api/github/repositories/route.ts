import { NextRequest, NextResponse } from "next/server";
import { githubServiceServer } from "@/services/github/githubServiceServer";
import { adminDb } from "@/services/admin/firebaseAdmin";
import { FirestoreQueryDocumentSnapshot } from "@/types/firestore-types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    if (!userId && !projectId) {
      return NextResponse.json(
        { error: "Either userId or projectId is required" },
        { status: 400 },
      );
    }

    // Fetch repositories based on request type
    if (projectId) {
      // Get repositories for a project
      const projectRepos = await adminDb
        .collection("repositories")
        .where("projectId", "==", projectId)
        .get();

      const repositories = projectRepos.docs.map(
        (doc: FirestoreQueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
        }),
      );

      return NextResponse.json(repositories);
    } else if (userId) {
      try {
        // Get GitHub token from Firestore using Admin SDK
        const tokenDoc = await adminDb
          .collection("githubTokens")
          .doc(userId)
          .get();

        // If no token exists, return empty array
        if (!tokenDoc.exists) {
          console.log(`No GitHub token found for user ${userId}`);
          return NextResponse.json([]);
        }

        const accessToken = tokenDoc.data()?.accessToken;

        if (!accessToken) {
          console.log(
            `Token exists but missing accessToken field for user ${userId}`,
          );
          return NextResponse.json([]);
        }

        // Use the server-side GitHub service
        const repositories =
          await githubServiceServer.getUserRepositories(userId);
        return NextResponse.json(repositories);
      } catch (error) {
        console.error("Error fetching repositories from GitHub:", error);
        return NextResponse.json(
          {
            error: "Failed to fetch repositories from GitHub",
            details: String(error),
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Error in repositories endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories", details: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, projectId, fullName } = await request.json();

    if (!userId || !projectId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const repository = await githubServiceServer.connectRepository(
      userId,
      projectId,
      fullName,
    );

    return NextResponse.json(repository);
  } catch (error) {
    console.error("Error connecting repository:", error);
    return NextResponse.json(
      { error: "Failed to connect repository", details: String(error) },
      { status: 500 },
    );
  }
}
