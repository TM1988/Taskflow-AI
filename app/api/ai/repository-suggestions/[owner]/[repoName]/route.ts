import { NextRequest, NextResponse } from 'next/server';
import { githubServiceServer } from '@/services/github/githubServiceServer';

interface AISuggestion {
  id: string;
  type: 'workload' | 'code' | 'pr' | 'issue' | 'task';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  relatedItems?: string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { owner: string; repoName: string } }
) {
  try {
    const { owner, repoName } = params;
    const suggestions: AISuggestion[] = [];
    
    // Get the user ID from headers or use owner as fallback
    const userIdHeader = request.headers.get('x-user-id');
    const userId = userIdHeader || owner;
    
    try {
      // Get repository data
      const repository = await githubServiceServer.getRepositoryDetails(userId, `${owner}/${repoName}`);

      // Get commits
      const repoCommits = await githubServiceServer.getRepositoryCommits(userId, `${owner}/${repoName}`);
      
      // Get pull requests
      const pullRequests = await githubServiceServer.getRepositoryPullRequests(userId, `${owner}/${repoName}`);
      
      // Get issues
      const issues = await githubServiceServer.getRepositoryIssuesFiltered(userId, `${owner}/${repoName}`, 'open', 50);

      // AI Analysis

      // 1. Repository size analysis
      if (repository.size > 50000) {
        suggestions.push({
          id: 'repo-size-large',
          type: 'code',
          priority: 'medium',
          title: 'Large Repository Detected',
          description: `This repository is ${Math.round(repository.size / 1024)}MB. Consider splitting into microservices or removing unused files to improve performance.`,
          actionable: true,
          relatedItems: [`repo:${repository.full_name}`]
        });
      }

      // 2. Recent activity analysis
      const recentCommits = repoCommits.filter((commit: any) => {
        const commitDate = new Date(commit.commit.author.date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return commitDate > weekAgo;
      });

      if (recentCommits.length === 0) {
        suggestions.push({
          id: 'low-activity',
          type: 'workload',
          priority: 'medium',
          title: 'Low Recent Activity',
          description: 'No commits in the past week. Consider scheduling regular development cycles or checking if the project needs attention.',
          actionable: true,
          relatedItems: [`repo:${repository.full_name}`]
        });
      } else if (recentCommits.length > 20) {
        suggestions.push({
          id: 'high-activity',
          type: 'workload',
          priority: 'high',
          title: 'High Development Activity',
          description: `${recentCommits.length} commits this week. Team might be overloaded - consider code review capacity and work distribution.`,
          actionable: true,
          relatedItems: [`repo:${repository.full_name}`]
        });
      }

      // 3. Pull request analysis
      const openPRs = pullRequests.filter((pr: any) => pr.state === 'open');
      const stalePRs = openPRs.filter((pr: any) => {
        const prDate = new Date(pr.created_at);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return prDate < threeDaysAgo;
      });

      if (stalePRs.length > 0) {
        suggestions.push({
          id: 'stale-prs',
          type: 'pr',
          priority: 'high',
          title: 'Stale Pull Requests Detected',
          description: `${stalePRs.length} pull requests have been open for more than 3 days. Review and merge or provide feedback to keep development moving.`,
          actionable: true,
          relatedItems: stalePRs.map((pr: any) => `pr:${pr.number}`)
        });
      }

      if (openPRs.length > 10) {
        suggestions.push({
          id: 'many-open-prs',
          type: 'pr',
          priority: 'medium',
          title: 'Many Open Pull Requests',
          description: `${openPRs.length} open pull requests. Consider implementing a more aggressive review and merge strategy to prevent bottlenecks.`,
          actionable: true,
          relatedItems: [`repo:${repository.full_name}`]
        });
      }

      // 4. Issue analysis
      const openIssues = issues.filter((issue: any) => !issue.pull_request);
      const bugIssues = openIssues.filter((issue: any) => 
        issue.labels.some((label: any) => label.name.toLowerCase().includes('bug'))
      );

      if (bugIssues.length > 0) {
        suggestions.push({
          id: 'bug-issues',
          type: 'issue',
          priority: 'high',
          title: 'Bug Issues Need Attention',
          description: `${bugIssues.length} open bug reports. Prioritize fixing these to improve code quality and user experience.`,
          actionable: true,
          relatedItems: bugIssues.map((issue: any) => `issue:${issue.number}`)
        });
      }

      if (repository.open_issues_count > repository.stargazers_count * 0.1) {
        suggestions.push({
          id: 'high-issue-ratio',
          type: 'issue',
          priority: 'medium',
          title: 'High Issue-to-Star Ratio',
          description: 'Many open issues relative to repository popularity. Consider triaging and closing outdated issues or implementing better issue management.',
          actionable: true,
          relatedItems: [`repo:${repository.full_name}`]
        });
      }

      // 5. Team collaboration analysis
      if (repoCommits.length > 0) {
        const contributors = new Set(repoCommits.map((commit: any) => commit.author?.login).filter(Boolean));
        
        if (contributors.size === 1) {
          suggestions.push({
            id: 'single-contributor',
            type: 'workload',
            priority: 'medium',
            title: 'Single Contributor Detected',
            description: 'Only one active contributor. Consider onboarding team members or implementing pair programming to distribute knowledge.',
            actionable: true,
            relatedItems: [`repo:${repository.full_name}`]
          });
        } else if (contributors.size > 10) {
          suggestions.push({
            id: 'many-contributors',
            type: 'workload',
            priority: 'low',
            title: 'Large Team Collaboration',
            description: `${contributors.size} contributors active. Ensure good communication channels and code review processes are in place.`,
            actionable: true,
            relatedItems: [`repo:${repository.full_name}`]
          });
        }
      }
      
    } catch (tokenError: any) {
      // If GitHub token not found, return error
      if (tokenError.message?.includes('GitHub token not found')) {
        return NextResponse.json(
          { 
            error: 'GitHub token not found. Please connect your GitHub account to get AI suggestions.',
            suggestions: [] 
          },
          { status: 401 }
        );
      }
      throw tokenError;
    }

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions', suggestions: [] },
      { status: 500 }
    );
  }
}
