import { Octokit } from "octokit";
import { ObjectId } from "mongodb";
import { getAdminDb } from "@/services/admin/mongoAdmin";

// Collection names
const GITHUB_TOKENS_COLLECTION = "githubTokens";
const REPOSITORIES_COLLECTION = "repositories";

export interface GithubRepository {
  id: string;
  name: string;
  fullName: string;
  url: string;
  projectId: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  issues?: number;
}

export const githubServiceServer = {
  // Exchange GitHub code for access token
  async exchangeCodeForToken(code: string, context: string = "personal") {
    try {
      // Use personal GitHub app credentials (project-level or personal use both use personal app)
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          "GitHub OAuth credentials not configured: " +
            (!clientId ? "Missing client ID" : "Missing client secret"),
        );
      }

      // Use node-fetch for server-side API calls
      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        },
      );

      const data = await response.json();

      console.log("GitHub token response:", {
        status: response.status,
        hasError: !!data.error,
        errorDesc: data.error_description || null,
      });

      if (data.error) {
        throw new Error(
          `GitHub error: ${data.error_description || data.error}`,
        );
      }

      return data.access_token;
    } catch (error) {
      console.error("Error in exchangeCodeForToken:", error);
      throw error; // Re-throw to be handled by the calling code
    }
  },

  // Get authenticated Octokit instance for a user
  async getOctokit(userId: string) {
    const db = await getAdminDb();
    const tokenDoc = await db.collection(GITHUB_TOKENS_COLLECTION).findOne({ userId: userId });
    if (!tokenDoc) {
      throw new Error(
        "GitHub token not found. Please connect your GitHub account.",
      );
    }

    return new Octokit({ auth: tokenDoc.accessToken });
  },

  // Store GitHub token for user
  async storeGithubToken(userId: string, accessToken: string) {
    const db = await getAdminDb();
    return await db.collection(GITHUB_TOKENS_COLLECTION).replaceOne(
      { userId: userId },
      { userId, accessToken },
      { upsert: true }
    );
  },

  // Get user GitHub repositories
  async getUserRepositories(userId: string) {
    const octokit = await this.getOctokit(userId);
    const response = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    return response.data;
  },

  // Get repository by ID
  async getRepositoryById(repoId: string) {
    const db = await getAdminDb();
    return await db.collection(REPOSITORIES_COLLECTION).findOne({ id: repoId });
  },

  // Connect repository to project
  async connectRepository(
    userId: string,
    projectId: string,
    repoFullName: string,
  ) {
    const octokit = await this.getOctokit(userId);
    const [owner, repo] = repoFullName.split("/");

    // Get repository details from GitHub
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    // Store repository in our database
    const db = await getAdminDb();
    const repositoryData = {
      name: repoData.name,
      fullName: repoData.full_name,
      url: repoData.html_url,
      projectId,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      issues: repoData.open_issues_count,
    };
    
    const result = await db.collection(REPOSITORIES_COLLECTION).insertOne(repositoryData);
    return { ...repositoryData, _id: result.insertedId };
  },

  // Get project repositories
  async getProjectRepositories(projectId: string) {
    const db = await getAdminDb();
    return await db.collection(REPOSITORIES_COLLECTION).find({ projectId }).toArray();
  },

  // Get repository commits
  async getRepositoryCommits(userId: string, repoFullName: string) {
    const octokit = await this.getOctokit(userId);
    const [owner, repo] = repoFullName.split("/");

    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 30,
    });

    return commits;
  },

  // Get repository pull requests
  async getRepositoryPullRequests(userId: string, repoFullName: string) {
    const octokit = await this.getOctokit(userId);
    const [owner, repo] = repoFullName.split("/");

    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: 30,
    });

    return pullRequests;
  },

  // Get repository issues
  async getRepositoryIssues(userId: string, repoFullName: string) {
    const octokit = await this.getOctokit(userId);
    const [owner, repo] = repoFullName.split("/");

    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: 30,
    });

    return issues;
  },

  // Get repository details
  async getRepositoryDetails(userId: string, repoFullName: string) {
    const octokit = await this.getOctokit(userId);
    const [owner, repo] = repoFullName.split("/");

    const { data: repository } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return repository;
  },

  // Get repository issues with filters
  async getRepositoryIssuesFiltered(userId: string, repoFullName: string, state: 'open' | 'closed' | 'all' = 'all', perPage: number = 30) {
    const octokit = await this.getOctokit(userId);
    const [owner, repo] = repoFullName.split("/");

    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      sort: "updated",
      direction: "desc",
      per_page: perPage,
    });

    return issues;
  },
};
