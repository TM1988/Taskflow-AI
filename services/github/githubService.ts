// Import the server service only on the server side
import { githubServiceServer } from "./githubServiceServer";
import { githubServiceClient } from "./githubServiceClient";

// Determine if we're on server or client
const isServer = typeof window === "undefined";

// Export the appropriate service based on environment
export const githubService = isServer
  ? githubServiceServer
  : githubServiceClient;

// Re-export the GithubRepository interface
export type { GithubRepository } from "./githubServiceServer";
