import { GithubSearchInput, GithubSearchResult } from './types';

/**
 * Real GitHub REST API Search Tool
 * Uses public GitHub REST API: https://api.github.com/search/repositories
 * Optional authentication via GITHUB_TOKEN environment variable.
 * Normalizes results into GithubSearchResult structure without fabricating any repositories.
 */
export async function search_github(params: GithubSearchInput): Promise<GithubSearchResult[]> {
  const { query, max_results = 5 } = params;
  if (!query || !query.trim()) {
    return [];
  }

  const cleanQuery = query.trim();
  const limit = Math.min(Math.max(1, max_results), 15);
  const items: GithubSearchResult[] = [];

  // GitHub Search API Query
  const encodedQuery = encodeURIComponent(cleanQuery);
  const url = `https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=${limit}`;

  const headers: Record<string, string> = {
    'User-Agent': 'HackVerse-Intel-App/1.0',
    Accept: 'application/vnd.github.v3+json'
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken && githubToken.trim()) {
    headers['Authorization'] = `Bearer ${githubToken.trim()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status === 403 || res.status === 429) {
      console.warn('GitHub API rate limit exceeded or access forbidden');
      return [];
    }

    if (!res.ok) {
      console.warn(`GitHub API returned status ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    if (data && Array.isArray(data.items)) {
      for (const repo of data.items) {
        items.push({
          source: 'GitHub',
          name: repo.name || 'repository',
          full_name: repo.full_name || repo.name || 'unknown/repo',
          description: repo.description ? repo.description.trim() : 'No repository description provided.',
          stars: Number(repo.stargazers_count) || 0,
          language: repo.language || 'Code / Multi-language',
          updated_at: repo.updated_at || repo.pushed_at || new Date().toISOString(),
          url: repo.html_url || `https://github.com/${repo.full_name || repo.name}`,
          tool: 'search_github'
        });
      }
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('GitHub API request timed out after 8s');
    } else {
      console.warn('GitHub API fetch error:', err.message || err);
    }
  }

  return items;
}
