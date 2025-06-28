import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/services/admin/mongoAdmin';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getAdminDb();
    const reposCollection = db.collection('github_repositories');
    
    // Get user's repositories
    const repositories = await reposCollection.find({
      userId: session.user.email,
      imported: true
    }).toArray();

    if (repositories.length === 0) {
      return NextResponse.json({
        success: true,
        commits: []
      });
    }

    // Fetch recent commits from GitHub for all repositories
    const allCommits = [];
    
    for (const repo of repositories.slice(0, 5)) { // Limit to 5 repos for performance
      try {
        const owner = repo.repositoryData?.owner?.login;
        const name = repo.repositoryData?.name;
        
        if (!owner || !name) continue;

        const commitsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/github/repositories/${owner}/${name}/commits`
        );
        
        if (commitsResponse.ok) {
          const commitsData = await commitsResponse.json();
          if (commitsData.success && commitsData.commits) {
            // Add repository info to each commit
            const commitsWithRepo = commitsData.commits.slice(0, 10).map((commit: any) => ({
              ...commit,
              repository: {
                name: name,
                owner: owner,
                fullName: `${owner}/${name}`
              }
            }));
            allCommits.push(...commitsWithRepo);
          }
        }
      } catch (error) {
        console.error(`Error fetching commits for ${repo.repositoryData?.name}:`, error);
      }
    }

    // Sort commits by date (most recent first) and limit to 20
    allCommits.sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime());
    const recentCommits = allCommits.slice(0, 20);

    // Transform commits to a simpler format
    const simplifiedCommits = recentCommits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message.split('\n')[0], // First line only
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        avatar_url: commit.author?.avatar_url || null
      },
      date: commit.commit.author.date,
      url: commit.html_url,
      repository: commit.repository
    }));

    return NextResponse.json({
      success: true,
      commits: simplifiedCommits
    });
  } catch (error) {
    console.error('Error fetching recent commits:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recent commits'
    }, { status: 500 });
  }
}
