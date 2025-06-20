import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const context = searchParams.get("context") || "personal";
    const projectId = searchParams.get("projectId");
    const organizationId = searchParams.get("organizationId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const adminDb = await getAdminDb();

    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Create context-specific token identifier
    let tokenId = userId; // Default for personal context
    if (context === 'project' && projectId) {
      tokenId = `${userId}_project_${projectId}`;
    } else if (context === 'organization' && organizationId) {
      tokenId = `${userId}_org_${organizationId}`;
    }

    // Get GitHub token
    const tokenDoc = await adminDb.collection("githubTokens").findOne({ tokenId });

    if (!tokenDoc) {
      return NextResponse.json(
        { error: "GitHub not connected for this context" },
        { status: 401 },
      );
    }

    // Fetch repositories from GitHub
    const reposResponse = await fetch(
      "https://api.github.com/user/repos?per_page=100",
      {
        headers: {
          Authorization: `token ${tokenDoc.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Taskflow-App",
        },
      },
    );

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const repositories = await reposResponse.json();

    return NextResponse.json({
      repositories,
      context,
      tokenId,
      requestId,
    });
  } catch (error: unknown) {
    const err = error as Error;
    
    return NextResponse.json(
      {
        error: "Failed to fetch repositories",
        details: err?.message || 'Unknown error',
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const body = await request.json();
    const { action, userId, projectId, fullName } = body;

    // Handle different actions
    if (action === 'import_all_accessible') {
      return await handleImportAllAccessible(request, requestId, body);
    } else {
      // Default: import single repository (backward compatibility)
      return await handleImportRepository(request, requestId, body);
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Failed to process request", details: err?.message || 'Unknown error', requestId },
      { status: 500 },
    );
  }
}

// Handle importing all accessible repositories
async function handleImportAllAccessible(request: NextRequest, requestId: string, body: any) {
  const { projectId } = body;

  // Extract userId from the request (we'll need to get it from auth context)
  const { searchParams } = new URL(request.url);
  let userId = searchParams.get("userId");
  
  // If not in search params, try to get from request headers or auth
  if (!userId) {
    // For now, we'll extract from body or require it
    userId = body.userId;
  }

  if (!userId || !projectId) {
    return NextResponse.json(
      { error: "Missing required fields: userId, projectId" },
      { status: 400 },
    );
  }

  const adminDb = await getAdminDb();
  if (!adminDb) {
    throw new Error("MongoDB connection failed");
  }

  // Get GitHub token for this user
  const tokenDoc = await adminDb.collection("githubTokens").findOne({ tokenId: userId });
  
  if (!tokenDoc?.accessToken) {
    return NextResponse.json(
      { error: "GitHub not connected" },
      { status: 401 }
    );
  }

  try {
    // Fetch all accessible repositories from GitHub
    const githubResponse = await fetch('https://api.github.com/user/repos?affiliation=owner,collaborator&sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${tokenDoc.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Taskflow-App'
      }
    });

    if (!githubResponse.ok) {
      throw new Error(`GitHub API error: ${githubResponse.status} ${githubResponse.statusText}`);
    }

    const repositories = await githubResponse.json();

    // Import all repositories to the project
    const importPromises = repositories.map(async (repo: any) => {
      try {
        await adminDb.collection("projectRepositories").replaceOne(
          { userId, projectId, fullName: repo.full_name },
          {
            userId,
            projectId,
            fullName: repo.full_name,
            name: repo.name,
            description: repo.description,
            htmlUrl: repo.html_url,
            private: repo.private,
            language: repo.language,
            stargazersCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            updatedAt: new Date(repo.updated_at),
            createdAt: new Date(),
          },
          { upsert: true }
        );
        return { success: true, repository: repo.full_name };
      } catch (error) {
        return { success: false, repository: repo.full_name, error: (error as Error).message };
      }
    });

    const results = await Promise.all(importPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      action: 'import_all_accessible',
      totalRepositories: repositories.length,
      imported: successful.length,
      failed: failed.length,
      failedRepositories: failed,
      requestId
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch repositories from GitHub", details: (error as Error).message, requestId },
      { status: 500 }
    );
  }
}

// Handle importing single repository (existing functionality)
async function handleImportRepository(request: NextRequest, requestId: string, body: any) {
  const { userId, projectId, fullName } = body;

  if (!userId || !projectId || !fullName) {
    return NextResponse.json(
      { error: "Missing required fields: userId, projectId, fullName" },
      { status: 400 },
    );
  }

  const adminDb = await getAdminDb();
  if (!adminDb) {
    throw new Error("MongoDB connection failed");
  }

  // Import repository to project (upsert to avoid duplicates)
  const result = await adminDb.collection("projectRepositories").replaceOne(
    { userId, projectId, fullName },
    {
      userId,
      projectId,
      fullName,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    { upsert: true }
  );

  return NextResponse.json({ 
    success: true,
    imported: true,
    repository: fullName,
    requestId
  });
}

export async function DELETE(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const { userId, projectId, fullName } = await request.json();

    if (!userId || !projectId || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: userId, projectId, fullName" },
        { status: 400 },
      );
    }

    const adminDb = await getAdminDb();
    if (!adminDb) {
      throw new Error("MongoDB connection failed");
    }

    // Remove repository from project
    const result = await adminDb.collection("projectRepositories").deleteOne({
      userId,
      projectId,
      fullName
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Repository not found in project" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      removed: true,
      repository: fullName,
      requestId
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Failed to remove repository", details: err?.message || 'Unknown error', requestId },
      { status: 500 },
    );
  }
}
