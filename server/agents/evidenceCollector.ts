import { AgentHandoff, EvidenceBundle, RawDiscoveredItem, ToolExecutionRecord } from '../../src/types';
import { store } from '../store';
import { search_arxiv } from '../tools/arxiv';
import { search_github } from '../tools/github';

/**
 * LIVE RESEARCH TOOLS / EVIDENCE COLLECTION LAYER
 * Executes live research tools (search_arxiv and/or search_github) as specified
 * in the Agent 1 ResearchPlan. Handles failures with full fault isolation.
 */
export async function executeEvidenceCollection(
  handoff: AgentHandoff
): Promise<EvidenceBundle> {
  const plan = handoff.plan;
  const bundleId = `BND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  store.addLog(
    'INFO',
    `LIVE RESEARCH TOOLS: Initiating live evidence collection for Plan [${plan.planId}] across tools: [${plan.selectedTools.join(', ')}]`,
    'EvidenceCollector'
  );

  const evidenceItems: RawDiscoveredItem[] = [];
  const toolExecutionRecords: ToolExecutionRecord[] = [];
  const collectionErrors: string[] = [];
  const sourceBreakdown: Record<string, number> = {
    arxiv: 0,
    github: 0
  };

  const tasks: Promise<void>[] = [];

  // 1. Execute arXiv Tool if selected by Planner
  if (plan.selectedTools.includes('search_arxiv')) {
    const arxivQuery = plan.toolQueries.search_arxiv || plan.objective;
    tasks.push(
      (async () => {
        store.addLog('INFO', `Tool [search_arxiv]: Executing live query: "${arxivQuery}"`, 'EvidenceCollector');
        try {
          const results = await search_arxiv({
            query: arxivQuery,
            max_results: 8
          });

          if (results.length > 0) {
            store.addLog('SUCCESS', `LIVE RESEARCH TOOLS: arXiv returned ${results.length} verified academic papers.`, 'EvidenceCollector');
            toolExecutionRecords.push({
              tool: 'search_arxiv',
              selected: true,
              status: 'success',
              resultCount: results.length,
              query: arxivQuery
            });

            for (const p of results) {
              evidenceItems.push({
                title: p.title,
                source: 'arxiv',
                sourceLabel: `ArXiv (${p.authors.slice(0, 2).join(', ')})`,
                sourceUrl: p.url,
                publishedAt: p.published || new Date().toISOString(),
                rawContent: `Academic Paper: ${p.title}\nAuthors: ${p.authors.join(', ')}\nPublished: ${p.published}\nURL: ${p.url}\n\nAbstract: ${p.summary}`,
                evidenceSnippet: p.summary.slice(0, 300)
              });
              sourceBreakdown.arxiv = (sourceBreakdown.arxiv || 0) + 1;
            }
          } else {
            store.addLog('WARNING', `Tool [search_arxiv]: No matching papers found on arXiv for query "${arxivQuery}".`, 'EvidenceCollector');
            toolExecutionRecords.push({
              tool: 'search_arxiv',
              selected: true,
              status: 'no_results',
              resultCount: 0,
              query: arxivQuery
            });
          }
        } catch (err: any) {
          const errMsg = err.message || 'arXiv search failed';
          store.addLog('WARNING', `LIVE RESEARCH TOOLS: arXiv tool error (${errMsg}) — continuing with other tools.`, 'EvidenceCollector');
          collectionErrors.push(`arXiv error: ${errMsg}`);
          toolExecutionRecords.push({
            tool: 'search_arxiv',
            selected: true,
            status: 'failed',
            resultCount: 0,
            query: arxivQuery,
            error: errMsg
          });
        }
      })()
    );
  } else {
    store.addLog('INFO', 'Tool [search_arxiv]: Not selected by Research Planner for this objective.', 'EvidenceCollector');
    toolExecutionRecords.push({
      tool: 'search_arxiv',
      selected: false,
      status: 'not_selected',
      resultCount: 0
    });
  }

  // 2. Execute GitHub Tool if selected by Planner
  if (plan.selectedTools.includes('search_github')) {
    const githubQuery = plan.toolQueries.search_github || plan.objective;
    tasks.push(
      (async () => {
        store.addLog('INFO', `Tool [search_github]: Executing live query: "${githubQuery}"`, 'EvidenceCollector');
        try {
          const results = await search_github({
            query: githubQuery,
            max_results: 8
          });

          if (results.length > 0) {
            store.addLog('SUCCESS', `LIVE RESEARCH TOOLS: GitHub returned ${results.length} verified open-source repositories.`, 'EvidenceCollector');
            toolExecutionRecords.push({
              tool: 'search_github',
              selected: true,
              status: 'success',
              resultCount: results.length,
              query: githubQuery
            });

            for (const r of results) {
              evidenceItems.push({
                title: `${r.full_name} (${r.language || 'Code'}, ★${r.stars.toLocaleString()})`,
                source: 'github',
                sourceLabel: `GitHub (${r.name})`,
                sourceUrl: r.url,
                publishedAt: r.updated_at || new Date().toISOString(),
                rawContent: `GitHub Repository: ${r.full_name}\nStars: ${r.stars}\nLanguage: ${r.language}\nURL: ${r.url}\n\nDescription: ${r.description}`,
                evidenceSnippet: `${r.description} (Primary Language: ${r.language}, ${r.stars} Stars)`
              });
              sourceBreakdown.github = (sourceBreakdown.github || 0) + 1;
            }
          } else {
            store.addLog('WARNING', `Tool [search_github]: No repositories found on GitHub for query "${githubQuery}".`, 'EvidenceCollector');
            toolExecutionRecords.push({
              tool: 'search_github',
              selected: true,
              status: 'no_results',
              resultCount: 0,
              query: githubQuery
            });
          }
        } catch (err: any) {
          const errMsg = err.message || 'GitHub search failed';
          store.addLog('WARNING', `LIVE RESEARCH TOOLS: GitHub tool error (${errMsg}) — continuing with other tools.`, 'EvidenceCollector');
          collectionErrors.push(`GitHub error: ${errMsg}`);
          toolExecutionRecords.push({
            tool: 'search_github',
            selected: true,
            status: 'failed',
            resultCount: 0,
            query: githubQuery,
            error: errMsg
          });
        }
      })()
    );
  } else {
    store.addLog('INFO', 'Tool [search_github]: Not selected by Research Planner for this objective.', 'EvidenceCollector');
    toolExecutionRecords.push({
      tool: 'search_github',
      selected: false,
      status: 'not_selected',
      resultCount: 0
    });
  }

  // Wait for all tool executions to finish concurrently
  await Promise.allSettled(tasks);

  const bundle: EvidenceBundle = {
    bundleId,
    planId: plan.planId,
    handoffId: handoff.handoffId,
    collectedAt: new Date().toISOString(),
    totalCollected: evidenceItems.length,
    toolExecutionRecords,
    evidenceItems,
    sourceBreakdown,
    collectionErrors: collectionErrors.length > 0 ? collectionErrors : undefined
  };

  store.addLog(
    'SYSTEM',
    `LIVE RESEARCH TOOLS: Bundled ${evidenceItems.length} total live evidence records [Bundle: ${bundleId}] for Agent 2.`,
    'EvidenceCollector'
  );

  return bundle;
}
