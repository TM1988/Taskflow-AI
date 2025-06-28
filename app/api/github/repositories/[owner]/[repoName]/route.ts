import { NextRequest, NextResponse } from 'next/server';
import { githubServiceServer } from '@/services/github/githubServiceServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repoName: string } }
) {
  try {
    const { owner, repoName } = params;
    
    // Get the user ID from headers or use owner as fallback
    const userIdHeader = request.headers.get('x-user-id');
    const userId = userIdHeader || owner;
    
    // Get repository details using GitHub service
    const repository = await githubServiceServer.getRepositoryDetails(userId, `${owner}/${repoName}`);
    
    return NextResponse.json(repository);

  } catch (error: any) {
    console.error('Error fetching repository:', error);
    
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
      { error: 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}
