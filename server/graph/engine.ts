import {
  GraphNodeName,
  GraphState,
  GraphExecutionStatus,
  GraphExecutionSummary,
  AdversarialTestConfig,
  ResearchContext,
  ResourceBudget,
  LoopDetectionState
} from '../../src/types';
import { GraphNode } from './types';
import { ResearchPlannerNode } from './nodes/plannerNode';
import { ResourceEvaluatorNode } from './nodes/resourceEvaluatorNode';
import { EvidenceCollectorNode } from './nodes/evidenceCollectorNode';
import { EvidenceValidatorNode } from './nodes/evidenceValidatorNode';
import { ConflictResolutionNode } from './nodes/conflictResolutionNode';
import { IntelligenceAnalystNode } from './nodes/intelligenceAnalystNode';
import { SelfEvaluationNode } from './nodes/selfEvaluationNode';
import { ReplannerNode } from './nodes/replannerNode';
import { CompletionNode } from './nodes/completionNode';
import { store } from '../store';
import { tracer } from '../observability/tracer';

export interface ResearchGraphOptions {
  missionId: string;
  query?: string;
  runId?: string;
  traceId?: string;
  context: ResearchContext;
  adversarialConfig?: AdversarialTestConfig;
  initialBudget?: Partial<ResourceBudget>;
}

export class ResearchGraph {
  private nodes: Map<GraphNodeName, GraphNode> = new Map();

  constructor() {
    this.registerNode(ResearchPlannerNode);
    this.registerNode(ResourceEvaluatorNode);
    this.registerNode(EvidenceCollectorNode);
    this.registerNode(EvidenceValidatorNode);
    this.registerNode(ConflictResolutionNode);
    this.registerNode(IntelligenceAnalystNode);
    this.registerNode(SelfEvaluationNode);
    this.registerNode(ReplannerNode);
    this.registerNode(CompletionNode);
  }

  public registerNode(node: GraphNode): void {
    this.nodes.set(node.name, node);
  }

  /**
   * Initializes state machine for an autonomous research run
   */
  public initializeState(options: ResearchGraphOptions): GraphState {
    const rawObjective = options.query?.trim() || options.context.researchObjective || 'Autonomous Investigation';
    const runId =
      options.runId ||
      `RUN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const defaultBudget: ResourceBudget = {
      maxToolCalls: 6,
      maxParallelCalls: 3,
      maxRetries: 2,
      maxReplans: 2,
      estimatedCost: 35,
      remainingBudget: 100,
      toolCallsMade: 0,
      parallelCallsMade: 0,
      retriesUsed: 0,
      replansUsed: 0,
      ...options.initialBudget
    };

    const loopDetectionState: LoopDetectionState = {
      executionSignatures: [],
      loopDetected: false,
      haltedEarly: false,
      maxThreshold: 2
    };

    return {
      runId,
      traceId: options.traceId,
      missionId: options.missionId,
      originalObjective: rawObjective,
      currentObjective: rawObjective,
      researchContext: options.context,
      detectedIntent: 'comparative',
      targetEntities: [],
      hypotheses: [],
      selectedTools: ['search_arxiv', 'search_github'],
      availableTools: ['search_arxiv', 'search_github'],
      findings: [],
      conflictingEvidence: [],
      rejectedFindings: [],
      uncertainty: 0.25,
      confidence: 0.75,
      resourceBudget: defaultBudget,
      toolFailures: [],
      fallbackAttempts: [],
      checkpoints: [],
      completedNodes: [],
      failedNodes: [],
      retryCount: 0,
      replanCount: 0,
      replans: [],
      loopDetectionState,
      executionStatus: 'RUNNING',
      routeTaken: [],
      parallelBranches: [],
      nodeExecutions: [],
      adversarialConfig: options.adversarialConfig
    };
  }

  /**
   * Explicit Conditional Routing Functions
   */
  public route(currentNode: GraphNodeName, state: GraphState): GraphNodeName {
    switch (currentNode) {
      case 'ResearchPlanner':
        return 'ResourceEvaluator';

      case 'ResourceEvaluator':
        if (state.resourceBudget.remainingBudget <= 0) {
          return 'Completion';
        }
        return 'ParallelEvidenceCollector';

      case 'ParallelEvidenceCollector':
        return 'EvidenceValidator';

      case 'EvidenceValidator':
        // If un-reconciled conflicts exist between sources, route to ConflictResolution
        if (state.conflictingEvidence.some((c) => c.unresolved)) {
          return 'ConflictResolution';
        }
        // If tool failures occurred on pass 1 (replanCount === 0), route to SelfEvaluation to assess evidence sufficiency
        if (state.toolFailures.length > 0 && state.replanCount === 0) {
          return 'SelfEvaluation';
        }
        return 'IntelligenceAnalyst';

      case 'ConflictResolution':
        // If tool failures occurred on pass 1 (replanCount === 0), route to SelfEvaluation to evaluate if Replanner is needed
        if (state.toolFailures.length > 0 && state.replanCount === 0) {
          return 'SelfEvaluation';
        }
        return 'IntelligenceAnalyst';

      case 'IntelligenceAnalyst':
        return 'SelfEvaluation';

      case 'SelfEvaluation': {
        const selfEval = state.selfEvaluation;
        const budgetRemaining = state.resourceBudget.remainingBudget > 0;
        const withinReplanLimit = state.replanCount < state.resourceBudget.maxReplans;

        if (state.adversarialConfig?.forceReplanningLoopTest && state.replanCount < 3) {
          // Used strictly to test loop detection trigger
          return 'Replanner';
        }

        if (selfEval && !selfEval.objectiveSatisfied && budgetRemaining && withinReplanLimit) {
          return 'Replanner';
        }
        return 'Completion';
      }

      case 'Replanner':
        return 'ResourceEvaluator';

      case 'Completion':
      default:
        return 'Completion';
    }
  }

  /**
   * Executes the full graph lifecycle with cycle & loop detection
   */
  public async executeGraph(options: ResearchGraphOptions): Promise<{ state: GraphState; summary: GraphExecutionSummary }> {
    const graphStartTime = Date.now();
    let state = this.initializeState(options);

    store.addLog(
      'SYSTEM',
      `[RESEARCH GRAPH] Initializing autonomous execution graph for run [${state.runId}] on mission [${state.missionId}]`,
      'ResearchGraph'
    );

    let currentNode: GraphNodeName = 'ResearchPlanner';
    const maxSteps = 16;
    let stepCount = 0;

    while (stepCount < maxSteps) {
      stepCount++;

      // Check loop / deadlock signatures
      const signature = `${currentNode}:${state.selectedTools.slice().sort().join('+')}:replan=${state.replanCount}`;
      const sigCounts = state.loopDetectionState.executionSignatures.filter((s) => s === signature).length;

      if (sigCounts >= state.loopDetectionState.maxThreshold) {
        store.addLog(
          'CRITICAL',
          `[RESEARCH GRAPH] Loop / Deadlock protection triggered for signature: "${signature}". Halting circular transitions.`,
          'ResearchGraph'
        );
        state.loopDetectionState.loopDetected = true;
        state.loopDetectionState.loopReason = `Circular transition detected on node [${currentNode}] with repeated signature.`;
        state.loopDetectionState.haltedEarly = true;
        currentNode = 'Completion';
      }

      state.loopDetectionState.executionSignatures.push(signature);

      const nodeObj = this.nodes.get(currentNode);
      if (!nodeObj) {
        throw new Error(`Graph node "${currentNode}" is not registered.`);
      }

      store.addLog(
        'INFO',
        `[RESEARCH GRAPH -> STEP ${stepCount}] Invoking Node: [${currentNode}]...`,
        'ResearchGraph'
      );

      const span = state.traceId
        ? tracer.startSpan(
            state.traceId,
            `ExecuteNode:${currentNode}`,
            currentNode,
            `Step ${stepCount} execution for objective "${state.currentObjective.slice(0, 60)}..."`,
            null,
            { stepCount, replanCount: state.replanCount, budgetRemaining: state.resourceBudget.remainingBudget }
          )
        : null;

      try {
        const partialUpdate = await nodeObj.execute(state);
        state = {
          ...state,
          ...partialUpdate
        };

        if (span && state.traceId) {
          const outSummary =
            currentNode === 'ResearchPlanner'
              ? `Planned ${state.selectedTools.length} tools (${state.selectedTools.join(', ')}) with ${state.hypotheses.length} hypotheses`
              : currentNode === 'ParallelEvidenceCollector'
              ? `Collected ${state.evidenceBundle?.totalCollected || 0} items from ${state.selectedTools.join(', ')}`
              : currentNode === 'EvidenceValidator'
              ? `Validated ${state.findings.length} findings (${state.conflictingEvidence.length} conflicts detected)`
              : currentNode === 'IntelligenceAnalyst'
              ? `Synthesized ${state.findings.length} prioritized intelligence findings`
              : currentNode === 'SelfEvaluation'
              ? `Objective satisfied: ${state.selfEvaluation?.objectiveSatisfied ? 'YES' : 'NO'}, confidence: ${Math.round((state.confidence || 0.75) * 100)}%`
              : `Completed ${currentNode} with status ${state.executionStatus}`;

          tracer.endSpan(state.traceId, span.spanId, outSummary, 'SUCCESS');
        }
      } catch (err: any) {
        store.addLog(
          'CRITICAL',
          `[RESEARCH GRAPH] Node [${currentNode}] execution failed: ${err.message || err}`,
          'ResearchGraph'
        );
        if (span && state.traceId) {
          tracer.endSpan(state.traceId, span.spanId, `Node failed: ${err.message}`, 'FAILED', {
            message: err.message || 'Node execution failed',
            code: 'NODE_EXECUTION_ERROR'
          });
        }
        state.failedNodes.push(currentNode);
        // Fault isolation in graph: route to completion safely
        currentNode = 'Completion';
        continue;
      }

      if (currentNode === 'Completion') {
        break;
      }

      // Determine next node using conditional router
      const routerStartMs = Date.now();
      const nextNode = this.route(currentNode, state);
      const routerDuration = Date.now() - routerStartMs;

      if (state.traceId) {
        tracer.recordDecision(
          state.traceId,
          `Graph transition: [${currentNode}] -> [${nextNode}]`,
          'GraphRouter',
          `Completed [${currentNode}], evaluating next state`,
          nextNode,
          `Routing decision based on: budgetRemaining=${state.resourceBudget.remainingBudget}, conflicts=${state.conflictingEvidence.length}, replanCount=${state.replanCount}`,
          routerDuration,
          ['Completion', 'SelfEvaluation', 'Replanner', 'ResourceEvaluator'].filter((n) => n !== nextNode)
        );
      }

      currentNode = nextNode;
    }

    const elapsedTotalMs = Date.now() - graphStartTime;

    const summary: GraphExecutionSummary = {
      framework: 'ResearchGraph',
      runId: state.runId,
      missionId: state.missionId,
      executionStatus: state.executionStatus,
      routeTaken: state.routeTaken,
      currentNode: state.routeTaken[state.routeTaken.length - 1],
      parallelBranches: state.parallelBranches,
      toolFailures: state.toolFailures,
      fallbacks: state.fallbackAttempts,
      conflicts: state.conflictingEvidence,
      replans: state.replans,
      checkpoints: state.checkpoints,
      loopDetection: {
        loopDetected: state.loopDetectionState.loopDetected,
        signaturesCount: state.loopDetectionState.executionSignatures.length,
        haltedEarly: state.loopDetectionState.haltedEarly,
        reason: state.loopDetectionState.loopReason
      },
      resourceBudget: state.resourceBudget,
      selfEvaluation: state.selfEvaluation,
      finalDecision: state.finalDecision,
      nodeExecutions: state.nodeExecutions,
      elapsedTotalMs,
      adversarialModeActive: Boolean(options.adversarialConfig?.enabled)
    };

    store.addLog(
      'SUCCESS',
      `[RESEARCH GRAPH] Autonomous execution graph completed in ${(elapsedTotalMs / 1000).toFixed(2)}s with status [${state.executionStatus}]. Total nodes executed: ${state.nodeExecutions.length}.`,
      'ResearchGraph'
    );

    return { state, summary };
  }
}

export const researchGraph = new ResearchGraph();
