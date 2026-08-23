import { GoogleGenAI } from '@google/genai';
import { SourceType } from '../../src/types';
import { search_arxiv } from '../tools/arxiv';
import { search_github } from '../tools/github';
import { DynamicToolPlan, ToolExecutionRecord } from '../tools/types';
import { PlannedQueryPlan } from './queryPlanner';
import { planDynamicTools } from './toolPlanner';

export interface RawDiscoveredItem {
  title: string;
  source: SourceType;
  sourceLabel: string;
  sourceUrl: string;
  publishedAt: string;
  rawContent: string;
  evidenceSnippet?: string;
}

export interface CollectionResult {
  rawItems: RawDiscoveredItem[];
  toolRecords: ToolExecutionRecord[];
  toolPlan: DynamicToolPlan;
}

// Grounded Multi-Source Web & Patent Ingestion with Gemini (for non-arXiv, non-GitHub secondary sources)
async function fetchGroundedIntelligence(
  objective: string,
  queries: string[],
  preferredSources: string[] = []
): Promise<RawDiscoveredItem[]> {
  const items: RawDiscoveredItem[] = [];
  const apiKey = process.env.GEMINI_API_KEY;

  // Only run if patents, news, or SEC filings are explicitly part of preferred sources
  const wantsSecondary = preferredSources.some((s) => ['patent', 'news', 'sec_filing'].includes(s));
  if (!wantsSecondary || !apiKey) {
    return [];
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are an automated intelligence crawler searching for recent breakthroughs, patents, and competitor updates for the objective: "${objective}".
Key query vectors: ${queries.join(', ')}.

Return 2 to 3 distinct intelligence items specifically for patent filings or trade news.
For each item include:
1. Title
2. Source type (patent, news, or sec_filing)
3. Source name / publisher
4. Source URL
5. Content details (2-3 sentences explaining technical mechanism, yield, benchmark, or corporate move)
6. Direct evidence snippet or key data point`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const responseText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    // Extract grounded links if available
    const webLinks = (groundingChunks || [])
      .map((c: any) => c.web?.uri)
      .filter((u: string) => Boolean(u));

    const lines = responseText.split('\n\n');
    let idx = 0;
    for (const block of lines) {
      if (block.length > 50 && items.length < 3) {
        const firstLine = block.split('\n')[0].replace(/^[\d\.\-\*#]+\s*/, '').trim();
        const cleanTitle = firstLine.length > 10 ? firstLine : `Signal: ${objective.substring(0, 40)}`;

        let st: SourceType = 'news';
        const lower = block.toLowerCase();
        if (lower.includes('patent') || lower.includes('uspto')) st = 'patent';
        else if (lower.includes('sec') || lower.includes('filing')) st = 'sec_filing';

        const url = webLinks[idx] || (st === 'patent' ? 'https://patents.google.com' : 'https://www.reuters.com/technology');
        idx++;

        items.push({
          title: cleanTitle.substring(0, 120),
          source: st,
          sourceLabel: st === 'patent' ? 'USPTO / Patent Registry' : 'Industry Wire',
          sourceUrl: url,
          publishedAt: new Date().toISOString(),
          rawContent: block.replace(firstLine, '').trim().substring(0, 450),
          evidenceSnippet: block.substring(0, 160) + '...'
        });
      }
    }
  } catch (err) {
    console.warn('Grounded secondary fetch error:', err);
  }

  return items;
}

/**
 * Executes the dynamic tool calling pipeline:
 * 1. Calls Gemini to plan and select relevant tools (search_arxiv and/or search_github).
 * 2. Concurrently calls the selected real external APIs.
 * 3. Normalizes all real API responses into RawDiscoveredItem records.
 * 4. Records tool execution trace for source transparency.
 */
export async function collectMultiSourceRawItems(
  objective: string,
  plan: PlannedQueryPlan,
  missionContext?: any
): Promise<CollectionResult> {
  const allDiscovered: RawDiscoveredItem[] = [];
  const toolRecords: ToolExecutionRecord[] = [];

  // Step 1: Dynamic Tool Planning via Gemini
  const toolPlan = await planDynamicTools(objective, {
    topic: missionContext?.topic || objective,
    description: missionContext?.description || objective,
    objective: missionContext?.objective || objective,
    keywords: missionContext?.keywords || plan.focusAreas,
    companies: missionContext?.companies || plan.targetEntities.map((e) => e.name),
    competitors: missionContext?.competitors,
    researchInterests: missionContext?.researchInterests || plan.focusAreas,
    preferredSources: missionContext?.preferredSources
  });

  const selectedTools = new Set(toolPlan.selected_tools);

  // Prepare promises for selected tools
  const tasks: Promise<void>[] = [];

  // TOOL 1: arXiv API Tool Execution
  if (selectedTools.has('search_arxiv')) {
    const arxivQuery = toolPlan.tool_queries.search_arxiv || plan.queries.arxiv[0] || objective;
    tasks.push(
      (async () => {
        try {
          const papers = await search_arxiv({ query: arxivQuery, max_results: 4 });
          const count = papers.length;

          toolRecords.push({
            tool: 'search_arxiv',
            selected: true,
            status: count > 0 ? 'success' : 'no_results',
            resultCount: count,
            query: arxivQuery
          });

          for (const paper of papers) {
            allDiscovered.push({
              title: paper.title,
              source: 'arxiv',
              sourceLabel: `ArXiv #${paper.url.split('/abs/')[1] || 'Preprint'}`,
              sourceUrl: paper.url,
              publishedAt: paper.published,
              rawContent: `Authors: ${paper.authors.join(', ')}. Abstract: ${paper.summary}`,
              evidenceSnippet: `${paper.summary.slice(0, 180)}...`
            });
          }
        } catch (err: any) {
          console.error('Tool search_arxiv failed:', err);
          toolRecords.push({
            tool: 'search_arxiv',
            selected: true,
            status: 'failed',
            resultCount: 0,
            query: arxivQuery,
            error: err.message || 'Network error'
          });
        }
      })()
    );
  } else {
    toolRecords.push({
      tool: 'search_arxiv',
      selected: false,
      status: 'not_selected',
      resultCount: 0
    });
  }

  // TOOL 2: GitHub REST API Tool Execution
  if (selectedTools.has('search_github')) {
    const githubQuery = toolPlan.tool_queries.search_github || plan.queries.industry[0] || objective;
    tasks.push(
      (async () => {
        try {
          const repos = await search_github({ query: githubQuery, max_results: 4 });
          const count = repos.length;

          toolRecords.push({
            tool: 'search_github',
            selected: true,
            status: count > 0 ? 'success' : 'no_results',
            resultCount: count,
            query: githubQuery
          });

          for (const repo of repos) {
            allDiscovered.push({
              title: `${repo.full_name} (${repo.stars.toLocaleString()} ★)`,
              source: 'github',
              sourceLabel: `GitHub Repo (${repo.language})`,
              sourceUrl: repo.url,
              publishedAt: repo.updated_at,
              rawContent: `Repository: ${repo.full_name}. Stars: ${repo.stars}. Primary Language: ${repo.language}. Description: ${repo.description}. URL: ${repo.url}.`,
              evidenceSnippet: `GitHub open-source repository ${repo.full_name} with ${repo.stars} stars (${repo.language}): ${repo.description.slice(0, 140)}`
            });
          }
        } catch (err: any) {
          console.error('Tool search_github failed:', err);
          toolRecords.push({
            tool: 'search_github',
            selected: true,
            status: 'failed',
            resultCount: 0,
            query: githubQuery,
            error: err.message || 'Network error'
          });
        }
      })()
    );
  } else {
    toolRecords.push({
      tool: 'search_github',
      selected: false,
      status: 'not_selected',
      resultCount: 0
    });
  }

  // Execute all selected tools in parallel with independent failure isolation
  await Promise.allSettled(tasks);

  // Optional: Secondary grounded sources (patents / trade news) if requested
  const preferred = missionContext?.preferredSources || [];
  if (preferred.includes('patent') || preferred.includes('news') || preferred.includes('sec_filing')) {
    const combinedQueries = [
      ...plan.queries.patents.slice(0, 1),
      ...plan.queries.news.slice(0, 1)
    ];
    const secondaryItems = await fetchGroundedIntelligence(objective, combinedQueries, preferred);
    allDiscovered.push(...secondaryItems);
  }

  return {
    rawItems: allDiscovered,
    toolRecords,
    toolPlan
  };
}
