import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/services/admin/mongoAdmin";

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);

  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 [${requestId}] Searching for imported repositories for user: ${userId}`);

    // Get admin database connection (same as the GitHub repositories API uses)
    const db = await getAdminDb();
    
    if (!db) {
      console.error(`❌ [${requestId}] MongoDB connection failed`);
      throw new Error("MongoDB connection failed");
    }

    console.log(`✅ [${requestId}] Database connected successfully`);
    console.log(`✅ [${requestId}] Database connected successfully`);
    
    // First, get the project repository assignments from the projectRepositories collection
    // This is where the GitHub repository selector stores imported repositories
    console.log(`🔍 [${requestId}] Querying projectRepositories collection...`);
    const projectRepoAssignments = await db.collection("projectRepositories").find({
      userId: userId
    }).toArray();
    
    console.log(`🔍 [${requestId}] Found ${projectRepoAssignments.length} repository assignments in projectRepositories collection`);
    
    if (projectRepoAssignments.length > 0) {
      console.log(`🔍 [${requestId}] Sample repository assignment:`, projectRepoAssignments[0]);
    }
    
    // Also check for projects that have repositories stored directly in the projects collection
    // (for backward compatibility or other import methods)
    console.log(`🔍 [${requestId}] Querying projects collection...`);
    const allProjects = await db.collection("projects").find({
      $or: [
        { ownerId: userId },
        { members: { $in: [userId] } }
      ]
    }).toArray();
    
    console.log(`🔍 [${requestId}] Found ${allProjects.length} total projects for user`);
    
    // Filter projects that have repositories stored directly
    const projectsWithRepos = allProjects.filter((project: any) => {
      const hasRepositories = project.repositories && project.repositories.length > 0;
      const hasGithubRepositories = project.githubRepositories && project.githubRepositories.length > 0;
      const hasConnectedRepos = project.connectedRepositories && project.connectedRepositories.length > 0;
      
      if (hasRepositories || hasGithubRepositories || hasConnectedRepos) {
        console.log(`🔍 [${requestId}] Project "${project.name || project._id}" has repositories:`, {
          repositories: project.repositories?.length || 0,
          githubRepositories: project.githubRepositories?.length || 0,
          connectedRepositories: project.connectedRepositories?.length || 0
        });
      }
      
      return hasRepositories || hasGithubRepositories || hasConnectedRepos;
    });
    
    console.log(`🔍 [${requestId}] Found ${projectsWithRepos.length} projects with repositories stored directly`);
    console.log(`🔍 [${requestId}] Found ${projectsWithRepos.length} projects with repositories stored directly`);
    
    // Create a map of project IDs to project names for lookup
    const projectMap = new Map();
    allProjects.forEach((project: any) => {
      projectMap.set(project._id.toString(), project.name || `Project ${project._id}`);
    });
    
    console.log(`🔍 [${requestId}] Created project map with ${projectMap.size} projects`);
    
    // Collect all imported repositories
    const repositoryMap = new Map();
    
    // Process project repository assignments from the projectRepositories collection
    // This is the primary source for repositories imported via the GitHub selector
    console.log(`🔍 [${requestId}] Processing repository assignments...`);
    projectRepoAssignments.forEach((assignment: any) => {
      const projectName = projectMap.get(assignment.projectId) || `Project ${assignment.projectId}`;
      const repoKey = assignment.fullName;
      
      console.log(`🔍 [${requestId}] Processing assignment: ${repoKey} -> ${projectName}`);
      
      if (!repositoryMap.has(repoKey)) {
        // Parse the fullName to get repo details
        const [owner, name] = repoKey.split('/');
        repositoryMap.set(repoKey, {
          id: assignment._id?.toString() || Math.random().toString(),
          name: name,
          fullName: repoKey,
          description: "",
          language: "Unknown",
          stars: 0,
          issues: 0,
          forks: 0,
          updatedAt: assignment.updatedAt || new Date().toISOString(),
          url: `https://github.com/${repoKey}`,
          projects: []
        });
      }
      
      // Add project name to the repository
      const repoData = repositoryMap.get(repoKey);
      if (!repoData.projects.includes(projectName)) {
        repoData.projects.push(projectName);
      }
    });
    
    console.log(`🔍 [${requestId}] Processed ${projectRepoAssignments.length} repository assignments, ${repositoryMap.size} unique repositories so far`);
    console.log(`🔍 [${requestId}] Processed ${projectRepoAssignments.length} repository assignments, ${repositoryMap.size} unique repositories so far`);
    
    // Process repositories stored directly in projects (for backward compatibility)
    console.log(`🔍 [${requestId}] Processing repositories stored directly in projects...`);
    projectsWithRepos.forEach((project: any) => {
      // Check all possible repository field names
      const allRepositories = [
        ...(project.repositories || []),
        ...(project.githubRepositories || []),
        ...(project.connectedRepositories || [])
      ];
      
      console.log(`🔍 [${requestId}] Processing ${allRepositories.length} repositories from project "${project.name || project._id}"`);
      
      allRepositories.forEach((repo: any) => {
        const repoKey = repo.fullName || repo.full_name || `${repo.owner}/${repo.name}` || repo.name;
        
        console.log(`🔍 [${requestId}] Processing repository:`, {
          repoKey,
          name: repo.name,
          fullName: repo.fullName,
          full_name: repo.full_name
        });
        
        if (!repositoryMap.has(repoKey)) {
          repositoryMap.set(repoKey, {
            id: repo.id || repo.github_id || Math.random().toString(),
            name: repo.name,
            fullName: repoKey,
            description: repo.description || "",
            language: repo.language || "Unknown",
            stars: repo.stars || repo.stargazers_count || 0,
            issues: repo.issues || repo.open_issues_count || 0,
            forks: repo.forks || repo.forks_count || 0,
            updatedAt: repo.updatedAt || repo.updated_at || new Date().toISOString(),
            url: repo.url || repo.html_url || `https://github.com/${repoKey}`,
            projects: []
          });
        }
        
        // Add project name to the repository
        const repoData = repositoryMap.get(repoKey);
        const projectName = project.name || `Project ${project._id}`;
        if (!repoData.projects.includes(projectName)) {
          repoData.projects.push(projectName);
        }
      });
    });

    // Convert to array
    const importedRepositories = Array.from(repositoryMap.values());
    
    console.log(`🔍 [${requestId}] Final result: ${importedRepositories.length} imported repositories`);
    if (importedRepositories.length > 0) {
      console.log(`🔍 [${requestId}] Sample repository:`, importedRepositories[0]);
    }

    return NextResponse.json({
      repositories: importedRepositories,
      count: importedRepositories.length
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error(`❌ [${requestId}] Error fetching imported repositories:`, err);
    return NextResponse.json(
      { error: "Failed to fetch imported repositories", details: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
