export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

export interface ReleaseUpdate {
  version: string;
  date: string;
  type: "feature" | "improvement" | "fix";
  title: string;
  description: string;
}

const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "Fantasy-programming";
const REPO_NAME = "nuts";

/**
 * Fetch releases from GitHub repository
 */
const fetchGitHubReleases = async (): Promise<GitHubRelease[]> => {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases`);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const releases: GitHubRelease[] = await response.json();
    
    // Filter out drafts and prereleases by default
    return releases.filter(release => !release.draft && !release.prerelease);
  } catch (error) {
    console.error("Failed to fetch GitHub releases:", error);
    throw error;
  }
};

/**
 * Transform GitHub release data to our format
 */
const transformGitHubRelease = (release: GitHubRelease): ReleaseUpdate => {
  // Extract type from tag name or release name
  const getType = (tagName: string, name: string): "feature" | "improvement" | "fix" => {
    const text = `${tagName} ${name}`.toLowerCase();
    if (text.includes("feat") || text.includes("feature") || text.includes("new")) {
      return "feature";
    }
    if (text.includes("fix") || text.includes("bug") || text.includes("patch")) {
      return "fix";
    }
    return "improvement";
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Extract description from body (first line or paragraph)
  const getDescription = (body: string): string => {
    if (!body) return "Release notes not available";
    
    // Remove markdown headers and get first meaningful line
    const lines = body.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const firstLine = lines[0]?.trim() || "Release notes not available";
    
    // Limit length
    return firstLine.length > 150 ? firstLine.substring(0, 147) + "..." : firstLine;
  };

  return {
    version: release.tag_name.replace(/^v/, ''), // Remove 'v' prefix if present
    date: formatDate(release.published_at),
    type: getType(release.tag_name, release.name || ''),
    title: release.name || release.tag_name,
    description: getDescription(release.body || ''),
  };
};

/**
 * Get formatted release updates from GitHub
 */
const getReleaseUpdates = async (): Promise<ReleaseUpdate[]> => {
  try {
    const releases = await fetchGitHubReleases();
    return releases.slice(0, 10).map(transformGitHubRelease); // Limit to 10 most recent
  } catch (error) {
    console.error("Failed to get release updates:", error);
    
    // Return fallback data in case of API failure
    return [
      {
        version: "1.2.0",
        date: "2024-03-20",
        type: "feature",
        title: "Latest Release",
        description: "Unable to fetch release notes from GitHub. Please check your connection.",
      },
    ];
  }
};

export const githubReleasesService = {
  fetchGitHubReleases,
  transformGitHubRelease,
  getReleaseUpdates,
};