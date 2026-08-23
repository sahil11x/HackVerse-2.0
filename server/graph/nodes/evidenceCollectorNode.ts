import { GraphNode } from '../types';
import {
  GraphState,
  RawDiscoveredItem,
  ToolExecutionRecord,
  ParallelBranchRecord,
  ToolFailureRecord,
  ToolName,
  EvidenceBundle
} from '../../../src/types';
import { search_arxiv } from '../../tools/arxiv';
import { search_github } from '../../tools/github';
import { store } from '../../store';
import { tracer } from '../../observability/tracer';

export const EvidenceCollectorNode: GraphNode = {
  name: 'ParallelEvidenceCollector',
  execute: async (state: GraphState): Promise<Partial<GraphState>> => {
    const startTime = Date.now();
    const plan = state.researchPlan;
    const tools = state.selectedTools;
    const adv = state.adversarialConfig;

    store.addLog(
      'INFO',
      `[NODE 3: ParallelEvidenceCollector] Executing ${tools.length} live tool branches concurrently: [${tools.join(', ')}]...`,
      'EvidenceCollectorNode'
    );

    const evidenceItems: RawDiscoveredItem[] = [];
    const toolExecutionRecords: ToolExecutionRecord[] = [];
    const parallelBranches: ParallelBranchRecord[] = [];
    const newToolFailures: ToolFailureRecord[] = [];
    const sourceBreakdown: Record<string, number> = {
      arxiv: 0,
      github: 0
    };

    let toolCallsCount = 0;
    let parallelCallsCount = tools.length > 1 ? 1 : 0;

    const executeArxivBranch = async () => {
      const branchId = `branch-arxiv-${Date.now()}`;
      const branchStart = Date.now();
      const query = plan?.toolQueries.search_arxiv || state.currentObjective || state.originalObjective;
      toolCallsCount++;

      store.addLog('INFO', `[TOOL: search_arxiv] Running concurrent query: "${query}"`, 'EvidenceCollectorNode');

      if (adv?.enabled && adv.failTool === 'search_arxiv') {
        const dur = Date.now() - branchStart;
        const err = 'Injected Adversarial Error: Simulated arXiv upstream connection reset (503 Service Unavailable)';
        store.addLog('CRITICAL', `[TOOL: search_arxiv] FAILED (Controlled Adversarial Injection): ${err}`, 'EvidenceCollectorNode');
        newToolFailures.push({
          tool: 'search_arxiv',
          query,
          error: err,
          category: 'INJECTED_ADVERSARIAL',
          timestamp: new Date().toISOString(),
          durationMs: dur
        });
        toolExecutionRecords.push({
          tool: 'search_arxiv',
          selected: true,
          status: 'failed',
          resultCount: 0,
          query,
          error: err
        });
        parallelBranches.push({
          branchId,
          tool: 'search_arxiv',
          startedAt: new Date(branchStart).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: dur,
          resultCount: 0,
          status: 'failed',
          errorCategory: 'INJECTED_ADVERSARIAL',
          error: err
        });
        return;
      }

      try {
        if (adv?.delayToolMs) {
          await new Promise((r) => setTimeout(r, adv.delayToolMs));
        }

        const results = await search_arxiv({
          query,
          max_results: 8
        });

        const dur = Date.now() - branchStart;

        if (results.length > 0) {
          store.addLog('SUCCESS', `[TOOL: search_arxiv] arXiv branch completed in ${dur}ms with ${results.length} papers.`, 'EvidenceCollectorNode');
          if (state.traceId) {
            tracer.recordToolCall(
              state.traceId,
              'search_arxiv',
              'arXiv Export API',
              branchStart,
              Date.now(),
              true,
              query,
              results.length
            );
          }
          toolExecutionRecords.push({
            tool: 'search_arxiv',
            selected: true,
            status: 'success',
            resultCount: results.length,
            query
          });
          parallelBranches.push({
            branchId,
            tool: 'search_arxiv',
            startedAt: new Date(branchStart).toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: dur,
            resultCount: results.length,
            status: 'completed'
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
          store.addLog('WARNING', `[TOOL: search_arxiv] Zero papers returned for query "${query}".`, 'EvidenceCollectorNode');
          if (state.traceId) {
            tracer.recordToolCall(
              state.traceId,
              'search_arxiv',
              'arXiv Export API',
              branchStart,
              Date.now(),
              true,
              query,
              0
            );
          }
          toolExecutionRecords.push({
            tool: 'search_arxiv',
            selected: true,
            status: 'no_results',
            resultCount: 0,
            query
          });
          parallelBranches.push({
            branchId,
            tool: 'search_arxiv',
            startedAt: new Date(branchStart).toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: dur,
            resultCount: 0,
            status: 'completed'
          });
        }
      } catch (err: any) {
        const dur = Date.now() - branchStart;
        const msg = err.message || 'arXiv search failed';
        store.addLog('WARNING', `[TOOL: search_arxiv] Live tool error (${msg}) — fault isolation active.`, 'EvidenceCollectorNode');
        if (state.traceId) {
          tracer.recordToolCall(
            state.traceId,
            'search_arxiv',
            'arXiv Export API',
            branchStart,
            Date.now(),
            false,
            query,
            0,
            msg
          );
        }
        newToolFailures.push({
          tool: 'search_arxiv',
          query,
          error: msg,
          category: 'NETWORK',
          timestamp: new Date().toISOString(),
          durationMs: dur
        });
        toolExecutionRecords.push({
          tool: 'search_arxiv',
          selected: true,
          status: 'failed',
          resultCount: 0,
          query,
          error: msg
        });
        parallelBranches.push({
          branchId,
          tool: 'search_arxiv',
          startedAt: new Date(branchStart).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: dur,
          resultCount: 0,
          status: 'failed',
          errorCategory: 'NETWORK',
          error: msg
        });
      }
    };

    const executeGithubBranch = async () => {
      const branchId = `branch-github-${Date.now()}`;
      const branchStart = Date.now();
      const query = plan?.toolQueries.search_github || state.currentObjective || state.originalObjective;
      toolCallsCount++;

      store.addLog('INFO', `[TOOL: search_github] Running concurrent query: "${query}"`, 'EvidenceCollectorNode');

      if (adv?.enabled && adv.failTool === 'search_github') {
        const dur = Date.now() - branchStart;
        const err = 'Injected Adversarial Error: Simulated GitHub API rate limit / 403 Forbidden';
        store.addLog('CRITICAL', `[TOOL: search_github] FAILED (Controlled Adversarial Injection): ${err}`, 'EvidenceCollectorNode');
        newToolFailures.push({
          tool: 'search_github',
          query,
          error: err,
          category: 'INJECTED_ADVERSARIAL',
          timestamp: new Date().toISOString(),
          durationMs: dur
        });
        toolExecutionRecords.push({
          tool: 'search_github',
          selected: true,
          status: 'failed',
          resultCount: 0,
          query,
          error: err
        });
        parallelBranches.push({
          branchId,
          tool: 'search_github',
          startedAt: new Date(branchStart).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: dur,
          resultCount: 0,
          status: 'failed',
          errorCategory: 'INJECTED_ADVERSARIAL',
          error: err
        });
        return;
      }

      try {
        if (adv?.delayToolMs) {
          await new Promise((r) => setTimeout(r, adv.delayToolMs));
        }

        const results = await search_github({
          query,
          max_results: 8
        });

        const dur = Date.now() - branchStart;

        if (results.length > 0) {
          store.addLog('SUCCESS', `[TOOL: search_github] GitHub branch completed in ${dur}ms with ${results.length} repositories.`, 'EvidenceCollectorNode');
          if (state.traceId) {
            tracer.recordToolCall(
              state.traceId,
              'search_github',
              'GitHub REST API',
              branchStart,
              Date.now(),
              true,
              query,
              results.length
            );
          }
          toolExecutionRecords.push({
            tool: 'search_github',
            selected: true,
            status: 'success',
            resultCount: results.length,
            query
          });
          parallelBranches.push({
            branchId,
            tool: 'search_github',
            startedAt: new Date(branchStart).toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: dur,
            resultCount: results.length,
            status: 'completed'
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
          store.addLog('WARNING', `[TOOL: search_github] Zero repositories returned for query "${query}".`, 'EvidenceCollectorNode');
          if (state.traceId) {
            tracer.recordToolCall(
              state.traceId,
              'search_github',
              'GitHub REST API',
              branchStart,
              Date.now(),
              true,
              query,
              0
            );
          }
          toolExecutionRecords.push({
            tool: 'search_github',
            selected: true,
            status: 'no_results',
            resultCount: 0,
            query
          });
          parallelBranches.push({
            branchId,
            tool: 'search_github',
            startedAt: new Date(branchStart).toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: dur,
            resultCount: 0,
            status: 'completed'
          });
        }
      } catch (err: any) {
        const dur = Date.now() - branchStart;
        const msg = err.message || 'GitHub search failed';
        store.addLog('WARNING', `[TOOL: search_github] Live tool error (${msg}) — fault isolation active.`, 'EvidenceCollectorNode');
        if (state.traceId) {
          tracer.recordToolCall(
            state.traceId,
            'search_github',
            'GitHub REST API',
            branchStart,
            Date.now(),
            false,
            query,
            0,
            msg
          );
        }
        newToolFailures.push({
          tool: 'search_github',
          query,
          error: msg,
          category: 'NETWORK',
          timestamp: new Date().toISOString(),
          durationMs: dur
        });
        toolExecutionRecords.push({
          tool: 'search_github',
          selected: true,
          status: 'failed',
          resultCount: 0,
          query,
          error: msg
        });
        parallelBranches.push({
          branchId,
          tool: 'search_github',
          startedAt: new Date(branchStart).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: dur,
          resultCount: 0,
          status: 'failed',
          errorCategory: 'NETWORK',
          error: msg
        });
      }
    };

    // Execute planned tools concurrently in parallel
    const branchPromises: Promise<void>[] = [];
    if (tools.includes('search_arxiv')) {
      branchPromises.push(executeArxivBranch());
    } else {
      toolExecutionRecords.push({
        tool: 'search_arxiv',
        selected: false,
        status: 'not_selected',
        resultCount: 0
      });
    }

    if (tools.includes('search_github')) {
      branchPromises.push(executeGithubBranch());
    } else {
      toolExecutionRecords.push({
        tool: 'search_github',
        selected: false,
        status: 'not_selected',
        resultCount: 0
      });
    }

    await Promise.allSettled(branchPromises);

    // If adversarial mode requested injecting conflicting evidence, inject a controlled contradictory claim on first pass
    if (adv?.enabled && adv.injectConflictingClaims && state.replanCount === 0) {
      evidenceItems.push({
        title: 'Microbenchmark Profile: GPU Memory Bandwidth Throttling Limits Real-World Speedup to 1.15x',
        source: 'github',
        sourceLabel: 'GitHub (Kernel Profiler Benchmark Suite)',
        sourceUrl: 'https://github.com/vllm-project/vllm/discussions/benchmarks',
        publishedAt: new Date().toISOString(),
        rawContent: 'Empirical hardware profiling shows that while theoretical kernel FLOPs increase 2.5x, memory bandwidth saturation under batch size >= 64 restricts end-to-end inference speedup to 1.15x.',
        evidenceSnippet: 'Empirical profiling shows memory throttling restricts practical throughput gains to 1.15x compared to 2.5x theoretical claims.'
      });
      sourceBreakdown.github = (sourceBreakdown.github || 0) + 1;
    }

    // Merge with any previously collected evidence from prior plan passes
    const priorEvidence = state.evidenceBundle?.evidenceItems || [];
    const combinedEvidenceItems = [...priorEvidence, ...evidenceItems];

    // Deduct budget
    const budget = {
      ...state.resourceBudget,
      remainingBudget: Math.max(0, state.resourceBudget.remainingBudget - tools.length * 10),
      toolCallsMade: state.resourceBudget.toolCallsMade + toolCallsCount,
      parallelCallsMade: state.resourceBudget.parallelCallsMade + parallelCallsCount
    };

    const bundle: EvidenceBundle = {
      bundleId: `BND-${state.runId}-${Date.now().toString(36).toUpperCase()}`,
      planId: plan?.planId || 'PLAN-DEFAULT',
      handoffId: state.handoff?.handoffId || 'HANDOFF-DEFAULT',
      collectedAt: new Date().toISOString(),
      totalCollected: combinedEvidenceItems.length,
      toolExecutionRecords: [...(state.evidenceBundle?.toolExecutionRecords || []), ...toolExecutionRecords],
      evidenceItems: combinedEvidenceItems,
      sourceBreakdown: {
        arxiv: (state.evidenceBundle?.sourceBreakdown?.arxiv || 0) + (sourceBreakdown.arxiv || 0),
        github: (state.evidenceBundle?.sourceBreakdown?.github || 0) + (sourceBreakdown.github || 0)
      },
      collectionErrors: newToolFailures.map((f) => `${f.tool}: ${f.error}`)
    };

    // Checkpoint after tool execution
    const checkpointNumber = (state.checkpoints?.length || 0) + 1;
    const toolCheckpoint = {
      id: `chk-tools-${state.runId}-${checkpointNumber}`,
      checkpointNumber,
      node: 'ParallelEvidenceCollector' as const,
      timestamp: new Date().toISOString(),
      summary: state.replanCount > 0
        ? `Fallback tool [${tools.join(', ')}] completed. Retrieved ${evidenceItems.length} new items (Total verified items: ${combinedEvidenceItems.length}).`
        : `Collected ${evidenceItems.length} items across ${tools.length} tool branches (${newToolFailures.length} failures).`,
      evidenceCount: combinedEvidenceItems.length,
      findingsCount: 0,
      confidence: combinedEvidenceItems.length > 0 ? 0.80 : 0.35,
      uncertainty: combinedEvidenceItems.length > 0 ? 0.20 : 0.65,
      stateSnapshot: {
        currentObjective: state.currentObjective || state.originalObjective,
        selectedTools: tools,
        completedNodes: [...state.completedNodes, 'ParallelEvidenceCollector' as const],
        replanCount: state.replanCount,
        budgetRemaining: budget.remainingBudget
      }
    };

    const duration = Date.now() - startTime;
    const nodeRecord = {
      nodeName: 'ParallelEvidenceCollector' as const,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: duration,
      status: (newToolFailures.length > 0 && evidenceItems.length === 0 ? 'FAILED' : 'SUCCESS') as 'SUCCESS' | 'FAILED',
      inputSummary: `Executed tools: [${tools.join(', ')}].`,
      outputSummary: `Retrieved ${evidenceItems.length} items across ${parallelBranches.length} branches. Failures: ${newToolFailures.length}.`,
      confidence: evidenceItems.length > 0 ? 0.80 : 0.35,
      uncertainty: evidenceItems.length > 0 ? 0.20 : 0.65
    };

    return {
      evidenceBundle: bundle,
      toolFailures: [...state.toolFailures, ...newToolFailures],
      parallelBranches: [...state.parallelBranches, ...parallelBranches],
      resourceBudget: budget,
      checkpoints: [...(state.checkpoints || []), toolCheckpoint],
      completedNodes: [...state.completedNodes, 'ParallelEvidenceCollector'],
      routeTaken: [...state.routeTaken, 'ParallelEvidenceCollector'],
      nodeExecutions: [...state.nodeExecutions, nodeRecord]
    };
  }
};
