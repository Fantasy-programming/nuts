import { useQuery } from "@tanstack/react-query";
import { githubReleasesService } from "./github-releases.service";

const GITHUB_RELEASES_QUERY_KEY = ["github", "releases"] as const;

/**
 * Hook to fetch and format release updates from GitHub
 */
export const useGitHubReleasesQuery = () => {
  return useQuery({
    queryKey: GITHUB_RELEASES_QUERY_KEY,
    queryFn: githubReleasesService.getReleaseUpdates,
    staleTime: 1000 * 60 * 15, // 15 minutes - GitHub releases don't change frequently
    gcTime: 1000 * 60 * 60, // 1 hour cache
    retry: 2, // Retry twice in case of network issues
    refetchOnWindowFocus: false, // Don't refetch on window focus for this data
  });
};

export { type ReleaseUpdate } from "./github-releases.service";