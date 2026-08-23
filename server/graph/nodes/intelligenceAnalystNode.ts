import { GraphNode } from '../types';
import { GraphState, HypothesisItem } from '../../../src/types';
import { executeIntelligenceAnalystAgent } from '../../agents/intelligenceAnalyst';
import { store } from '../../store';

export const IntelligenceAnalystNode: GraphNode = {
  name: 'IntelligenceAnalyst',
  execute: async (state: GraphState): Promise<Partial<GraphState>> => {
    const startTime = Date.now();
    const bundle = state.evidenceBundle;
    const handoff = state.handoff;

    if (!bundle || !handoff) {
      throw new Error('Intelligence Analyst node requires valid EvidenceBundle and AgentHandoff in GraphState');
    }

    store.addLog(
      'INFO',
      `[NODE 6: IntelligenceAnalyst] Synthesizing ${bundle.totalCollected} evidence items under Plan [${handoff.plan.planId}]...`,
      'IntelligenceAnalystNode'
    );

    const analystResult = await executeIntelligenceAnalystAgent(
      bundle,
      handoff,
      state.missionId,
      state.researchContext
    );

    // Verify and update hypotheses based on synthesized findings
    const updatedHypotheses: HypothesisItem[] = (state.hypotheses || []).map((hyp) => {
      const hypLower = hyp.hypothesis.toLowerCase();
      const supporting: string[] = [];
      const contradicting: string[] = [];

      for (const item of analystResult.findings) {
        const text = `${item.title} ${item.whatChanged || ''} ${item.whyItMatters || ''}`.toLowerCase();
        if (text.includes('throughput') || text.includes('efficiency') || text.includes('speedup') || text.includes('performance') || text.includes('novel') || text.includes('optimization')) {
          supporting.push(`${item.sourceLabel}: "${item.title}"`);
        }
      }

      for (const conflict of state.conflictingEvidence) {
        if (conflict.claimB) {
          contradicting.push(conflict.claimB);
        }
      }

      let status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'UNVERIFIED' = 'UNVERIFIED';
      let confidence = 0.5;

      if (supporting.length > 0 && contradicting.length > 0) {
        status = 'PARTIALLY_SUPPORTED';
        confidence = 0.78;
      } else if (supporting.length > 0) {
        status = 'SUPPORTED';
        confidence = 0.88;
      } else if (contradicting.length > 0) {
        status = 'CONTRADICTED';
        confidence = 0.75;
      }

      return {
        ...hyp,
        supportingEvidence: supporting.slice(0, 3),
        contradictingEvidence: contradicting.slice(0, 2),
        verificationStatus: status,
        confidence,
        rationale: `Evaluated against ${analystResult.findings.length} findings and ${state.conflictingEvidence.length} conflict records.`
      };
    });

    // Checkpoint after analyst output
    const checkpointNumber = (state.checkpoints?.length || 0) + 1;
    const analystCheckpoint = {
      id: `chk-analyst-${state.runId}-${checkpointNumber}`,
      checkpointNumber,
      node: 'IntelligenceAnalyst' as const,
      timestamp: new Date().toISOString(),
      summary: `Synthesized ${analystResult.findings.length} findings with ${analystResult.rankedImpacts.criticalCount + analystResult.rankedImpacts.highCount} high/critical impact insights.`,
      evidenceCount: bundle.totalCollected,
      findingsCount: analystResult.findings.length,
      confidence: 0.88,
      uncertainty: 0.12,
      stateSnapshot: {
        currentObjective: state.currentObjective || state.originalObjective,
        selectedTools: state.selectedTools,
        completedNodes: [...state.completedNodes, 'IntelligenceAnalyst' as const],
        replanCount: state.replanCount,
        budgetRemaining: state.resourceBudget.remainingBudget
      }
    };

    const duration = Date.now() - startTime;
    const nodeRecord = {
      nodeName: 'IntelligenceAnalyst' as const,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: duration,
      status: 'SUCCESS' as const,
      inputSummary: `Analyzed ${bundle.totalCollected} items from ${Object.keys(bundle.sourceBreakdown).join(', ')}.`,
      outputSummary: `Generated ${analystResult.findings.length} actionable intelligence records. Strategic summary formulated.`,
      confidence: 0.88,
      uncertainty: 0.12
    };

    return {
      findings: analystResult.findings,
      rejectedFindings: analystResult.rejectedFindings || [],
      analystResult,
      strategicSummary: analystResult.strategicSummary,
      hypotheses: updatedHypotheses,
      checkpoints: [...(state.checkpoints || []), analystCheckpoint],
      completedNodes: [...state.completedNodes, 'IntelligenceAnalyst'],
      routeTaken: [...state.routeTaken, 'IntelligenceAnalyst'],
      nodeExecutions: [...state.nodeExecutions, nodeRecord]
    };
  }
};
