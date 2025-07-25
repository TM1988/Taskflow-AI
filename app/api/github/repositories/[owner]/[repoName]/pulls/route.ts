import { NextRequest, NextResponse } from 'next/server';
import { githubServiceServer } from '@/services/github/githubServiceServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repoName: string } }
) {
  try {
    const { owner, repoName } = params;
    const repoFullName = `${owner}/${repoName}`;
    
    // Get the user ID from headers or use owner as fallback
    const userIdHeader = request.headers.get('x-user-id');
    const userId = userIdHeader || owner;
    
    // Use existing method from githubServiceServer
    const pullRequests = await githubServiceServer.getRepositoryPullRequests(userId, repoFullName);
    return NextResponse.json(pullRequests);
    
  } catch (error: any) {
    console.error('Error fetching pull requests:', error);
    
    if (error.message?.includes('GitHub token not found')) {
      return NextResponse.json(
        { error: 'GitHub token not found. Please connect your GitHub account.' },
        { status: 401 }
      );
    }
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch pull requests' },
      { status: 500 }
    );
  }
}
