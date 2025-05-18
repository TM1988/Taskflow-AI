export const githubServiceClient = {
  async connectRepositoryToProject(
    userId: string,
    projectId: string,
    fullName: string,
  ) {
    const response = await fetch("/api/github/repositories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        projectId,
        fullName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to connect repository to project");
    }

    return await response.json();
  },

  async getUserRepositories(userId: string) {
    const response = await fetch(`/api/github/repositories?userId=${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    return await response.json();
  },

  async getProjectRepositories(projectId: string) {
    const response = await fetch(
      `/api/github/repositories?projectId=${projectId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch project repositories");
    }

    return await response.json();
  },

  async getRepositoryCommits(repositoryId: string, userId: string) {
    const response = await fetch(
      `/api/github/repositories/${repositoryId}/commits?userId=${userId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repository commits");
    }

    return await response.json();
  },

  async disconnectGitHub(userId: string) {
    const response = await fetch("/api/github/auth", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error("Failed to disconnect GitHub account");
    }

    return await response.json();
  },
};
