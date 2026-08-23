import { GraphNode } from '../types';
import { GraphState, ToolName } from '../../../src/types';
import { store } from '../../store';

export const ResourceEvaluatorNode: GraphNode = {
  name: 'ResourceEvaluator',
  execute: async (state: GraphState): Promise<Partial<GraphState>> => {
    const startTime = Date.now();
    store.addLog(
      'INFO',
      `[NODE 2: ResourceEvaluator] Evaluating tool capabilities & budget (Remaining: ${state.resourceBudget.remainingBudget} units)...`,
      'ResourceEvaluatorNode'
    );

    let toolsToExecute: ToolName[] = [...state.selectedTools];
    let budget = { ...state.resourceBudget };
    const available = state.availableTools || ['search_arxiv', 'search_github'];

    // Filter tools strictly to available tools
    toolsToExecute = toolsToExecute.filter((t) => available.includes(t));

    // Handle resource constraints if budget is tight or tightBudget is injected
    const isTight = budget.remainingBudget < 15 || Boolean(state.adversarialConfig?.tightBudget);

    if (isTight && toolsToExecute.length > 1) {
      // Prioritize arXiv for research/academic or single highest value tool
      store.addLog(
        'WARNING',
        `[NODE 2: ResourceEvaluator] Budget constrained (${budget.remainingBudget} remaining). Reducing tool footprint to high-priority source.`,
        'ResourceEvaluatorNode'
      );
      if (state.detectedIntent === 'opensource_only') {
        toolsToExecute = ['search_github'];
      } else {
        toolsToExecute = ['search_arxiv'];
      }
    }

    if (toolsToExecute.length === 0) {
      toolsToExecute = ['search_arxiv'];
    }

    // Deduct cost of tool evaluation
    budget.remainingBudget = Math.max(0, budget.remainingBudget - 2);

    const duration = Date.now() - startTime;
    const nodeRecord = {
      nodeName: 'ResourceEvaluator' as const,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: duration,
      status: 'SUCCESS' as const,
      inputSummary: `Planned tools: [${state.selectedTools.join(', ')}]. Budget remaining: ${budget.remainingBudget + 2}.`,
      outputSummary: `Approved execution of tools: [${toolsToExecute.join(', ')}]. Resource status: ${isTight ? 'CONSTRAINED' : 'OPTIMAL'}.`,
      confidence: 0.90,
      uncertainty: 0.10
    };

    return {
      selectedTools: toolsToExecute,
      resourceBudget: budget,
      completedNodes: [...state.completedNodes, 'ResourceEvaluator'],
      routeTaken: [...state.routeTaken, 'ResourceEvaluator'],
      nodeExecutions: [...state.nodeExecutions, nodeRecord]
    };
  }
};
