import { GraphNode } from '../types';
import { GraphState, ReplanRecord, ToolName, FallbackAttemptRecord } from '../../../src/types';
import { store } from '../../store';

export const ReplannerNode: GraphNode = {
  name: 'Replanner',
  execute: async (state: GraphState): Promise<Partial<GraphState>> => {
    const startTime = Date.now();
    const currentReplanCount = state.replanCount + 1;
    const prevTools = state.selectedTools;
    const failures = state.toolFailures;
    const reason = state.selfEvaluation?.unresolvedIssues.join('; ') || 'Insufficient evidence or tool failure detected.';

    store.addLog(
      'WARNING',
      `[NODE 8: Replanner] Initiating autonomous replanning cycle #${currentReplanCount}. Reason: "${reason.slice(0, 80)}"`,
      'ReplannerNode'
    );

    // Checkpoint BEFORE replanning
    const checkpointNumber = (state.checkpoints?.length || 0) + 1;
    const preReplanCheckpoint = {
      id: `chk-pre-replan-${state.runId}-${checkpointNumber}`,
      checkpointNumber,
      node: 'Replanner' as const,
      timestamp: new Date().toISOString(),
      summary: `State snapshot before Replan #${currentReplanCount}. Previous tools: [${prevTools.join(', ')}].`,
      evidenceCount: state.evidenceBundle?.totalCollected || 0,
      findingsCount: state.findings?.length || 0,
      confidence: state.confidence,
      uncertainty: state.uncertainty,
      stateSnapshot: {
        currentObjective: state.currentObjective || state.originalObjective,
        selectedTools: prevTools,
        completedNodes: [...state.completedNodes, 'Replanner' as const],
        replanCount: currentReplanCount,
        budgetRemaining: state.resourceBudget.remainingBudget
      }
    };

    // Determine new tools & query reformulation avoiding failed tools
    const failedToolsSet = new Set(failures.map((f) => f.tool));
    let newTools: ToolName[] = [];
    const newFallbacks: FallbackAttemptRecord[] = [];

    if (failedToolsSet.has('search_github')) {
      // Fallback from GitHub to arXiv with implementation focus query
      newTools = ['search_arxiv'];
      newFallbacks.push({
        id: `fb-${Date.now()}`,
        fromTool: 'search_github',
        toTool: 'search_arxiv',
        reason: 'GitHub branch failed or was rate limited. Routing query to academic open-source papers on arXiv.',
        successful: true,
        timestamp: new Date().toISOString(),
        resultsRetrieved: 0
      });
      store.addLog(
        'INFO',
        `[NODE 8: Replanner] Fallback triggered: [search_github] -> [search_arxiv] with software benchmark focus.`,
        'ReplannerNode'
      );
    } else if (failedToolsSet.has('search_arxiv')) {
      // Fallback from arXiv to GitHub
      newTools = ['search_github'];
      newFallbacks.push({
        id: `fb-${Date.now()}`,
        fromTool: 'search_arxiv',
        toTool: 'search_github',
        reason: 'arXiv branch failed. Routing query to verified code repositories on GitHub.',
        successful: true,
        timestamp: new Date().toISOString(),
        resultsRetrieved: 0
      });
      store.addLog(
        'INFO',
        `[NODE 8: Replanner] Fallback triggered: [search_arxiv] -> [search_github] with repository code focus.`,
        'ReplannerNode'
      );
    } else {
      // Re-query with expanded vector keywords
      newTools = prevTools.length > 0 ? prevTools : ['search_arxiv', 'search_github'];
    }

    const reformulatedQueries: Record<string, string> = {};
    const baseObj = state.currentObjective || state.originalObjective;

    if (newTools.includes('search_arxiv')) {
      reformulatedQueries.search_arxiv = `${baseObj} benchmarks throughput empirical`;
    }
    if (newTools.includes('search_github')) {
      reformulatedQueries.search_github = `${baseObj} inference cuda tensorrt`;
    }

    const newSubtasks = [
      `Execute targeted secondary search on [${newTools.join(', ')}] with reformulated query vectors`,
      'Filter and cross-correlate empirical measurements against baseline theoretical claims',
      'Synthesize finalized actionable intelligence brief'
    ];

    const replanRecord: ReplanRecord = {
      replanNumber: currentReplanCount,
      timestamp: new Date().toISOString(),
      reason,
      previousTools: prevTools,
      newTools,
      newSubtasks,
      reformulatedQueries,
      hypothesesAdded: [`H${(state.hypotheses?.length || 0) + 1}: Reformulated query yields statistically significant evidence reconciliation.`]
    };

    // Update research plan
    const updatedPlan = state.researchPlan
      ? {
          ...state.researchPlan,
          selectedTools: newTools,
          toolQueries: {
            ...state.researchPlan.toolQueries,
            ...reformulatedQueries
          }
        }
      : undefined;

    // Deduct budget
    const budget = {
      ...state.resourceBudget,
      remainingBudget: Math.max(0, state.resourceBudget.remainingBudget - 8),
      replansUsed: state.resourceBudget.replansUsed + 1
    };

    const duration = Date.now() - startTime;
    const nodeRecord = {
      nodeName: 'Replanner' as const,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: duration,
      status: 'SUCCESS' as const,
      inputSummary: `Previous tools: [${prevTools.join(', ')}]. Reason: "${reason.slice(0, 60)}..."`,
      outputSummary: `Generated Replan #${currentReplanCount}. Selected tools: [${newTools.join(', ')}]. Created ${newSubtasks.length} subtasks.`,
      confidence: 0.75,
      uncertainty: 0.25
    };

    return {
      researchPlan: updatedPlan,
      selectedTools: newTools,
      replanCount: currentReplanCount,
      replans: [...state.replans, replanRecord],
      fallbackAttempts: [...state.fallbackAttempts, ...newFallbacks],
      resourceBudget: budget,
      checkpoints: [...(state.checkpoints || []), preReplanCheckpoint],
      completedNodes: [...state.completedNodes, 'Replanner'],
      routeTaken: [...state.routeTaken, 'Replanner'],
      nodeExecutions: [...state.nodeExecutions, nodeRecord]
    };
  }
};
