import {
  GraphNodeName,
  GraphState,
  GraphExecutionStatus,
  ResearchPlan,
  AgentHandoff,
  EvidenceBundle,
  AnalystResult,
  SelfEvaluationResult,
  ReplanRecord,
  GraphCheckpoint,
  ConflictingEvidenceItem,
  HypothesisItem,
  ResourceBudget,
  ToolFailureRecord,
  FallbackAttemptRecord,
  LoopDetectionState,
  GraphFinalDecision,
  ParallelBranchRecord,
  GraphNodeExecutionRecord,
  GraphExecutionSummary,
  AdversarialTestConfig,
  ToolName
} from '../../src/types';

export interface GraphNode<TInput = GraphState, TOutput = Partial<GraphState>> {
  name: GraphNodeName;
  execute: (state: TInput) => Promise<TOutput>;
}

export type ConditionalEdgeRouter = (state: GraphState) => GraphNodeName;
