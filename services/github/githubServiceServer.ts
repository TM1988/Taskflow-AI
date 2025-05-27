import { Octokit } from "octokit";
import {
  addDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  setDocument,
} from "@/services/db/mongodb";

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
  async exchangeCodeForToken(code: string) {
    try {
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      console.log(
        "Exchanging code for token with client ID:",
        clientId?.slice(0, 5) + "...",
      );
      console.log("Client secret available:", !!clientSecret);

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
    const tokenDoc = await getDocument(GITHUB_TOKENS_COLLECTION, userId);
    if (!tokenDoc) {
      throw new Error(
        "GitHub token not found. Please connect your GitHub account.",
      );
    }

    return new Octokit({ auth: tokenDoc.accessToken });
  },

  // Store GitHub token for user
  async storeGithubToken(userId: string, accessToken: string) {
    return await setDocument(GITHUB_TOKENS_COLLECTION, userId, {
      accessToken,
    });
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
    return await getDocument(REPOSITORIES_COLLECTION, repoId);
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
    const repository = await addDocument(REPOSITORIES_COLLECTION, {
      name: repoData.name,
      fullName: repoData.full_name,
      url: repoData.html_url,
      projectId,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      issues: repoData.open_issues_count,
    });

    return repository;
  },

  // Get project repositories
  async getProjectRepositories(projectId: string) {
    return await getDocuments(REPOSITORIES_COLLECTION, [
      ["projectId", "==", projectId],
    ]);
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
};
