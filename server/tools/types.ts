export interface ArxivSearchInput {
  query: string;
  max_results?: number;
}

export interface ArxivSearchResult {
  source: 'arXiv';
  title: string;
  authors: string[];
  published: string;
  summary: string;
  url: string;
  tool: 'search_arxiv';
}

export interface GithubSearchInput {
  query: string;
  max_results?: number;
}

export interface GithubSearchResult {
  source: 'GitHub';
  name: string;
  full_name: string;
  description: string;
  stars: number;
  language: string;
  updated_at: string;
  url: string;
  tool: 'search_github';
}

export type ToolName = 'search_arxiv' | 'search_github';

export interface ToolExecutionRecord {
  tool: ToolName;
  selected: boolean;
  status: 'success' | 'no_results' | 'failed' | 'not_selected';
  resultCount: number;
  query?: string;
  error?: string;
}

export interface DynamicToolPlan {
  research_intent: string;
  selected_tools: ToolName[];
  tool_queries: {
    search_arxiv?: string;
    search_github?: string;
  };
}
