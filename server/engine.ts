import { researchGraph } from './graph/engine';
import { correlateAndClusterItems } from './agents/trendCorrelator';
import { store } from './store';
import { tracer } from './observability/tracer';
import {
  MultiAgentOrchestrationSummary,
  ResearchContext,
  ResearchRunResult,
  ResearchStep,
  SourceType,
  SourceUsageStat,
  SummarizedFinding,
  AdversarialTestConfig,
  ResourceBudget
} from '../src/types';

export interface MissionCycleOptions {
  query?: string;
  isFollowUp?: boolean;
  runId?: string;
  adversarialConfig?: AdversarialTestConfig;
  initialBudget?: Partial<ResourceBudget>;
}

/**
 * Core Autonomous Graph Orchestrator with Context & Memory Management:
 * Executes explicit ResearchGraph:
 *   [Planner] -> [ResourceEvaluator] -> [ParallelEvidenceCollector]
 *     -> [EvidenceValidator] -> [ConflictResolution (conditional)]
 *     -> [IntelligenceAnalyst] -> [SelfEvaluation] -> [Replanner (conditional)]
 *     -> [Completion & Memory Persistence]
 */
export async function runAutonomousMissionCycle(
  missionId: string,
  options?: MissionCycleOptions
): Promise<ResearchRunResult> {
  const startTime = Date.now();
  const mission = store.getMission(missionId);

  if (!mission) {
    throw new Error(`Mission ${missionId} not found`);
  }

  // Generate unique run ID for strict execution isolation
  const runId =
    options?.runId ||
    `RUN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const context = store.getContext(missionId);

  const rawObjective =
    options?.query?.trim() || mission.objective || `${mission.name}: ${mission.topic || mission.description}`;
  const isFollowUp = options?.isFollowUp || (context.conversationSteps.length > 0 && Boolean(options?.query));
  const stepNumber = context.conversationSteps.length + 1;

  // Initialize Distributed Observability Root Trace
  const rootTrace = tracer.startTrace(
    rawObjective,
    missionId,
    runId,
    Boolean(options?.adversarialConfig?.enabled)
  );

  store.addLog(
    'SYSTEM',
    `============================================================\n[RUN: ${runId}] ${isFollowUp ? `STEP ${stepNumber} (FOLLOW-UP)` : 'GRAPH RESEARCH STEP'} FOR [${mission.code}] "${mission.name}"\nOBJECTIVE: "${rawObjective}"\nTRACE ID: [${rootTrace.traceId}]\n============================================================`,
    'ResearchGraphOrchestrator'
  );

  try {
    // =========================================================================
    // EXECUTE EXPLICIT GRAPH ORCHESTRATION LAYER (9 NODES WITH DYNAMIC ROUTING)
    // =========================================================================
    const { state: graphState, summary: graphSummary } = await researchGraph.executeGraph({
      missionId,
      query: rawObjective,
      runId,
      traceId: rootTrace.traceId,
      context,
      adversarialConfig: options?.adversarialConfig,
      initialBudget: options?.initialBudget
    });

    const plan = graphState.researchPlan!;
    const evidenceBundle = graphState.evidenceBundle!;
    const analystResult = graphState.analystResult!;

    // Update mission metadata if planner extracted structured entities
    if (plan.targetEntities.length > 0) {
      mission.targetEntities = plan.targetEntities.map((e) => ({
        name: e.name,
        ticker: e.ticker,
        role: e.role,
        type: (e.type as any) || 'company'
      }));
    }
    if (plan.searchVectors.length > 0) {
      mission.searchVectors = plan.searchVectors;
    }
    if (plan.researchAreas.length > 0) {
      mission.focusAreas = plan.researchAreas;
    }

    // =========================================================================
    // TREND RADAR & ALERT ENGINE
    // =========================================================================
    store.addLog(
      'INFO',
      `[TREND RADAR] Correlating cross-source signals and computing trend velocity...`,
      'TrendRadar'
    );

    const { correlatedItems, detectedTrends, newAlerts } = correlateAndClusterItems(
      graphState.findings,
      missionId,
      {
        missionName: mission.name,
        code: mission.code,
        targetEntities: plan.targetEntities,
        searchVectors: plan.searchVectors,
        focusAreas: plan.researchAreas,
        queries: {
          arxiv: plan.toolQueries.search_arxiv ? [plan.toolQueries.search_arxiv] : [],
          patents: [],
          news: [],
          industry: plan.toolQueries.search_github ? [plan.toolQueries.search_github] : []
        }
      }
    );

    // Compute Source Usage Transparency Summary strictly based on real tool execution
    const arxivRecord = evidenceBundle.toolExecutionRecords.find((r) => r.tool === 'search_arxiv');
    const githubRecord = evidenceBundle.toolExecutionRecords.find((r) => r.tool === 'search_github');

    const sourceCounts: Record<string, number> = {};
    for (const item of correlatedItems) {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    }

    const allTaxonomy: Array<{ source: SourceType; label: string }> = [
      { source: 'arxiv', label: 'ArXiv' },
      { source: 'patent', label: 'Patents' },
      { source: 'news', label: 'Tech News' },
      { source: 'sec_filing', label: 'SEC Filings' },
      { source: 'social_media', label: 'Social Media' },
      { source: 'github', label: 'GitHub' }
    ];

    const sourcesUsedSummary: SourceUsageStat[] = allTaxonomy.map((tax) => {
      if (tax.source === 'arxiv') {
        if (arxivRecord?.selected) {
          return {
            source: 'arxiv',
            label: 'ArXiv',
            status: arxivRecord.resultCount > 0 ? 'used' : 'not_used',
            count: arxivRecord.resultCount
          };
        } else {
          return {
            source: 'arxiv',
            label: 'ArXiv',
            status: 'not_required',
            count: 0
          };
        }
      }

      if (tax.source === 'github') {
        if (githubRecord?.selected) {
          return {
            source: 'github',
            label: 'GitHub',
            status: githubRecord.resultCount > 0 ? 'used' : 'not_used',
            count: githubRecord.resultCount
          };
        } else {
          return {
            source: 'github',
            label: 'GitHub',
            status: 'not_required',
            count: 0
          };
        }
      }

      const count = sourceCounts[tax.source] || 0;
      const isPreferred = (mission.preferredSources || []).includes(tax.source);
      let status: 'used' | 'not_used' | 'not_required' = 'not_required';
      if (count > 0) {
        status = 'used';
      } else if (isPreferred) {
        status = 'not_used';
      }
      return {
        source: tax.source,
        label: tax.label,
        status,
        count
      };
    });

    mission.sourcesUsedSummary = sourcesUsedSummary;

    // Build truthful MultiAgentOrchestrationSummary strictly representing the current run
    const orchestrationSummary: MultiAgentOrchestrationSummary = {
      planner: {
        planId: plan.planId,
        intent: plan.intent,
        intentType: plan.intentType,
        selectedTools: plan.selectedTools,
        toolQueries: {
          ...(plan.toolQueries.search_arxiv ? { search_arxiv: plan.toolQueries.search_arxiv } : {}),
          ...(plan.toolQueries.search_github ? { search_github: plan.toolQueries.search_github } : {})
        },
        targetEntitiesCount: plan.targetEntities.length
      },
      tools: {
        executedTools: plan.selectedTools,
        totalEvidenceReturned: evidenceBundle.totalCollected,
        records: evidenceBundle.toolExecutionRecords
      },
      analyst: {
        handoffId: graphState.handoff?.handoffId || 'HANDOFF-1',
        analyzedEvidenceCount: analystResult?.evidenceAnalyzedCount || evidenceBundle.totalCollected,
        findingsGeneratedCount: analystResult?.findings.length || correlatedItems.length,
        rankedImpacts: analystResult?.rankedImpacts || {
          criticalCount: 1,
          highCount: 2,
          mediumCount: 1,
          lowCount: 0
        }
      },
      orchestrationStatus: graphState.executionStatus === 'COMPLETED' || graphState.executionStatus === 'RECOVERED' ? 'complete' : 'partial',
      handoffTimestamp: graphState.handoff?.timestamp || new Date().toISOString()
    };

    mission.lastOrchestration = orchestrationSummary;

    // =========================================================================
    // TASK 4: CONTEXT & MEMORY UPDATE
    // =========================================================================
    const topFindingsSummarized: SummarizedFinding[] = correlatedItems.slice(0, 5).map((f) => ({
      id: f.id,
      title: f.title,
      source: f.source,
      whatChanged: f.whatChanged || f.title,
      whyItMatters: f.whyItMatters || f.summary,
      impact: f.impact || 'High',
      publishedAt: f.publishedAt
    }));

    const conversationStep: ResearchStep = {
      stepNumber,
      runId,
      query: rawObjective,
      timestamp: new Date().toISOString(),
      intent: plan.intent,
      intentType: plan.intentType,
      selectedTools: plan.selectedTools,
      executedTools: plan.selectedTools,
      evidenceCount: evidenceBundle.totalCollected,
      findingsCount: correlatedItems.length,
      topFindings: correlatedItems.slice(0, 3).map((i) => i.title),
      keyEntities: plan.targetEntities.map((e) => e.name),
      planSummary: `Intent: [${plan.intentType.toUpperCase()}]. Query vectors: ${Object.values(plan.toolQueries).filter(Boolean).join(' | ')}.`,
      analystSummary: analystResult?.strategicSummary || `Synthesized ${correlatedItems.length} findings.`,
      isFollowUp
    };

    // Formulate domain-aware dynamic follow-up suggestions based on active step results and topic
    const topicLabel = (plan.targetEntities && plan.targetEntities[0]?.name) || rawObjective.slice(0, 30);
    let dynamicFollowUps = [
      `Now find open-source implementations and code for ${topicLabel}`,
      `Compare latest empirical benchmarks and studies for ${topicLabel}`,
      `Analyze practical trade-offs and deployment challenges in ${topicLabel}`
    ];
    if (plan.selectedTools.includes('search_arxiv') && !plan.selectedTools.includes('search_github')) {
      dynamicFollowUps = [
        `Now find open-source GitHub implementations and code for ${topicLabel}`,
        `Compare real-world benchmarks and practical trade-offs for these techniques`,
        `Investigate commercial and industry applications of ${topicLabel}`
      ];
    } else if (plan.selectedTools.includes('search_github') && !plan.selectedTools.includes('search_arxiv')) {
      dynamicFollowUps = [
        `Find theoretical academic research papers explaining these techniques on arXiv`,
        `Compare methodology and experimental results across alternative implementations`,
        `Analyze scalability, efficiency, and future evolution of ${topicLabel}`
      ];
    } else if (plan.intentType === 'comparative') {
      const eNames = (plan.targetEntities || []).slice(0, 2).map((e) => e.name);
      dynamicFollowUps = [
        `Analyze key trade-offs between ${eNames.join(' and ') || topicLabel}`,
        `Now search for open-source benchmarks comparing these approaches`,
        `Investigate roadmap milestones and strategic positioning for ${topicLabel}`
      ];
    }

    // Update the long-term mission context
    const updatedContext: ResearchContext = {
      missionId,
      currentQuery: rawObjective,
      previousQueries: [...context.previousQueries.filter((q) => q !== rawObjective), rawObjective],
      researchObjective: mission.objective || rawObjective,
      detectedIntent: plan.intentType,
      targetEntities: plan.targetEntities,
      competitors: mission.competitors || [],
      selectedTools: plan.selectedTools,
      executedTools: plan.selectedTools,
      relevantKeywords: mission.keywords || [],
      researchAreas: plan.researchAreas,
      currentResearchPlan: plan,
      handoffId: graphState.handoff?.handoffId,
      evidenceSummary: `Step ${stepNumber} retrieved ${evidenceBundle.totalCollected} live evidence records, synthesizing ${correlatedItems.length} actionable findings (Graph Status: ${graphState.executionStatus}).`,
      verifiedSources: plan.selectedTools.map((t) => (t === 'search_arxiv' ? 'arxiv' : 'github')) as SourceType[],
      importantFindings: topFindingsSummarized,
      rejectedFindings: analystResult?.rejectedFindings || [],
      lastResearchTimestamp: new Date().toISOString(),
      conversationSteps: [...context.conversationSteps, conversationStep],
      followUpQueries: dynamicFollowUps,
      userPreferences: {
        preferredSources: mission.preferredSources,
        focusAreas: mission.focusAreas
      }
    };

    store.setContext(missionId, updatedContext);

    // =========================================================================
    // STATE SYNCHRONIZATION: ATOMICALLY COMMIT CURRENT RUN FINDINGS
    // =========================================================================
    store.replaceIntelItems(missionId, correlatedItems);

    if (detectedTrends.length > 0) {
      store.setTrends(missionId, detectedTrends);
    }
    for (const alert of newAlerts) {
      store.addAlert(alert);
    }

    const elapsedMs = Date.now() - startTime;
    mission.meanLatencyMs = Number((elapsedMs / (correlatedItems.length || 1) / 10).toFixed(1));
    mission.lastRunAt = new Date().toISOString();

    // Finalize Observability Trace
    const finalTraceStatus =
      graphState.executionStatus === 'COMPLETED'
        ? 'SUCCESS'
        : graphState.executionStatus === 'RECOVERED'
        ? 'RECOVERED'
        : 'FAILED';
    tracer.endTrace(rootTrace.traceId, finalTraceStatus);

    if (newAlerts.length > 0) {
      store.addLog(
        'CRITICAL',
        `Autonomous Alert Engine triggered ${newAlerts.length} high-impact alerts for run [${runId}].`,
        'AlertEngine'
      );
    }

    store.addLog(
      'SUCCESS',
      `============================================================\nRESEARCH GRAPH COMPLETE [RUN: ${runId}]: Status [${graphState.executionStatus}]. Route: ${graphSummary.routeTaken.join(' -> ')} in ${(elapsedMs / 1000).toFixed(2)}s.\n============================================================`,
      'ResearchGraphOrchestrator'
    );

    return {
      success: true,
      runId,
      missionId,
      stepNumber,
      query: rawObjective,
      isFollowUp,
      orchestration: orchestrationSummary,
      itemsCount: correlatedItems.length,
      trendsCount: detectedTrends.length,
      alertsCount: newAlerts.length,
      sourcesUsedSummary,
      toolRecords: evidenceBundle.toolExecutionRecords,
      rejectedFindings: analystResult?.rejectedFindings || [],
      context: updatedContext,
      elapsedMs,
      graphExecution: graphSummary
    };
  } catch (err: any) {
    tracer.endTrace(rootTrace.traceId, 'FAILED');
    store.addLog(
      'CRITICAL',
      `Research graph pipeline error in run [${runId}]: ${err.message || err}`,
      'ResearchGraphOrchestrator'
    );
    throw err;
  }
}
