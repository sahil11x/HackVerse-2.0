import { GraphNode } from '../types';
import { GraphState, HypothesisItem } from '../../../src/types';
import { executeResearchPlannerAgent } from '../../agents/researchPlanner';
import { store } from '../../store';

export const ResearchPlannerNode: GraphNode = {
  name: 'ResearchPlanner',
  execute: async (state: GraphState): Promise<Partial<GraphState>> => {
    const startTime = Date.now();
    store.addLog(
      'INFO',
      `[NODE 1: ResearchPlanner] Decomposing objective and analyzing intent for mission [${state.missionId}]...`,
      'ResearchPlannerNode'
    );

    const mission = store.getMission(state.missionId);
    const objectiveText = state.currentObjective || state.originalObjective;

    const { plan, handoff } = await executeResearchPlannerAgent({
      name: mission?.name || 'Autonomous Investigation',
      topic: mission?.topic || objectiveText,
      description: mission?.description || objectiveText,
      companies: mission?.companies,
      competitors: mission?.competitors,
      keywords: mission?.keywords,
      researchInterests: mission?.researchInterests,
      preferredSources: mission?.preferredSources,
      objective: objectiveText,
      context: state.researchContext
    });

    // Generate dynamic hypotheses based on objective
    const hypotheses: HypothesisItem[] = (plan.hypotheses || []).map((hypText, idx) => ({
      id: `H${idx + 1}-${Date.now().toString(36)}`,
      hypothesis: hypText,
      supportingEvidence: [],
      contradictingEvidence: [],
      verificationStatus: 'UNVERIFIED',
      confidence: 0.5,
      rationale: 'Hypothesis formulated by Research Planner based on objective decomposition.'
    }));

    if (hypotheses.length === 0) {
      hypotheses.push({
        id: `H1-${Date.now().toString(36)}`,
        hypothesis: `Recent innovations in ${plan.researchAreas[0] || 'target architecture'} yield measurable performance and throughput gains over baseline designs.`,
        supportingEvidence: [],
        contradictingEvidence: [],
        verificationStatus: 'UNVERIFIED',
        confidence: 0.5,
        rationale: 'Baseline hypothesis created for verification against retrieved literature and open-source benchmarks.'
      });
    }

    // Estimate initial resource cost
    const estimatedCost = plan.selectedTools.length * 10 + 15;

    // Checkpoint after planning
    const checkpointNumber = (state.checkpoints?.length || 0) + 1;
    const planningCheckpoint = {
      id: `chk-plan-${state.runId}-${checkpointNumber}`,
      checkpointNumber,
      node: 'ResearchPlanner' as const,
      timestamp: new Date().toISOString(),
      summary: `Planned ${plan.selectedTools.length} tools (${plan.selectedTools.join(', ')}) with ${hypotheses.length} verification hypotheses. Intent: [${plan.intentType}].`,
      evidenceCount: 0,
      findingsCount: 0,
      confidence: 0.75,
      uncertainty: 0.25,
      stateSnapshot: {
        currentObjective: objectiveText,
        selectedTools: plan.selectedTools,
        completedNodes: [...state.completedNodes, 'ResearchPlanner' as const],
        replanCount: state.replanCount,
        budgetRemaining: state.resourceBudget.remainingBudget - 5
      }
    };

    const duration = Date.now() - startTime;
    const nodeRecord = {
      nodeName: 'ResearchPlanner' as const,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: duration,
      status: 'SUCCESS' as const,
      inputSummary: `Objective: "${objectiveText.slice(0, 70)}..."`,
      outputSummary: `Plan [${plan.planId}] formulated. Selected tools: [${plan.selectedTools.join(', ')}]. Formulated ${hypotheses.length} hypotheses.`,
      confidence: 0.85,
      uncertainty: 0.15
    };

    return {
      researchPlan: plan,
      handoff,
      detectedIntent: plan.intentType,
      targetEntities: plan.targetEntities,
      selectedTools: plan.selectedTools,
      hypotheses,
      resourceBudget: {
        ...state.resourceBudget,
        estimatedCost,
        remainingBudget: Math.max(0, state.resourceBudget.remainingBudget - 5)
      },
      checkpoints: [...(state.checkpoints || []), planningCheckpoint],
      completedNodes: [...state.completedNodes, 'ResearchPlanner'],
      routeTaken: [...state.routeTaken, 'ResearchPlanner'],
      nodeExecutions: [...state.nodeExecutions, nodeRecord]
    };
  }
};
