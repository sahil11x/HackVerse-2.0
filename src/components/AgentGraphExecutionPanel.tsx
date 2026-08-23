import React, { useState } from 'react';
import {
  GraphExecutionSummary,
  GraphNodeName,
  GraphExecutionStatus,
  AdversarialTestConfig
} from '../types';
import {
  GitBranch,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Scale,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Check,
  XCircle,
  HelpCircle,
  Play
} from 'lucide-react';

interface AgentGraphExecutionPanelProps {
  graphExecution?: GraphExecutionSummary;
  onRunAdversarialTest?: (config?: Partial<AdversarialTestConfig>) => void;
  isLoading?: boolean;
}

export const AgentGraphExecutionPanel: React.FC<AgentGraphExecutionPanelProps> = ({
  graphExecution,
  onRunAdversarialTest,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'route' | 'replanning' | 'branches' | 'conflicts' | 'checkpoints' | 'selfeval' | 'budget'>('route');
  const [showAdvModal, setShowAdvModal] = useState<boolean>(false);
  const [advFailTool, setAdvFailTool] = useState<'search_github' | 'search_arxiv'>('search_github');
  const [advInjectConflict, setAdvInjectConflict] = useState<boolean>(true);
  const [advForceReplan, setAdvForceReplan] = useState<boolean>(false);
  const [advTightBudget, setAdvTightBudget] = useState<boolean>(false);

  if (!graphExecution) {
    return (
      <div id="agent-framework-empty-container" className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <GitBranch className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Agent Framework & Autonomous Graph Orchestration</h3>
              <p className="text-xs text-slate-500">Autonomous 9-Node ResearchGraph Engine</p>
            </div>
          </div>
          {onRunAdversarialTest && (
            <button
              id="btn-trigger-adversarial-test-init"
              onClick={() => onRunAdversarialTest({ enabled: true, failTool: 'search_github', injectConflictingClaims: true })}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              Run Adversarial Test
            </button>
          )}
        </div>
      </div>
    );
  }

  const {
    framework,
    executionStatus,
    routeTaken,
    parallelBranches,
    toolFailures,
    fallbacks,
    conflicts,
    replans,
    checkpoints,
    loopDetection,
    resourceBudget,
    selfEvaluation,
    finalDecision,
    nodeExecutions,
    elapsedTotalMs,
    adversarialModeActive
  } = graphExecution;

  const getStatusBadge = (status: GraphExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            COMPLETED
          </span>
        );
      case 'RECOVERED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300 animate-pulse">
            <ShieldCheck className="h-3 w-3 text-amber-600" />
            AUTONOMOUSLY RECOVERED
          </span>
        );
      case 'HALTED_LOOP':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            LOOP HALTED
          </span>
        );
      case 'BUDGET_EXHAUSTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
            <Cpu className="h-3 w-3 text-purple-600" />
            BUDGET REACHED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <Activity className="h-3 w-3 text-blue-600" />
            {status}
          </span>
        );
    }
  };

  const getNodeColor = (name: GraphNodeName) => {
    switch (name) {
      case 'ResearchPlanner':
        return 'border-indigo-200 bg-indigo-50/80 text-indigo-900';
      case 'ResourceEvaluator':
        return 'border-cyan-200 bg-cyan-50/80 text-cyan-900';
      case 'ParallelEvidenceCollector':
        return 'border-blue-200 bg-blue-50/80 text-blue-900';
      case 'EvidenceValidator':
        return 'border-teal-200 bg-teal-50/80 text-teal-900';
      case 'ConflictResolution':
        return 'border-amber-200 bg-amber-50/80 text-amber-900';
      case 'IntelligenceAnalyst':
        return 'border-purple-200 bg-purple-50/80 text-purple-900';
      case 'SelfEvaluation':
        return 'border-emerald-200 bg-emerald-50/80 text-emerald-900';
      case 'Replanner':
        return 'border-orange-200 bg-orange-50/80 text-orange-900';
      case 'Completion':
        return 'border-slate-200 bg-slate-100 text-slate-900';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  };

  return (
    <div id="agent-framework-execution-panel" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {framework}
              </span>
              <h3 className="text-sm font-bold text-slate-900">Autonomous Graph Orchestration</h3>
              {adversarialModeActive && (
                <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800 border border-rose-200">
                  <Zap className="h-2.5 w-2.5" /> Adversarial Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Agent State Machine · {routeTaken.length} Transitions · {(elapsedTotalMs / 1000).toFixed(2)}s Total Run
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(executionStatus)}

          {onRunAdversarialTest && (
            <button
              id="btn-open-adversarial-test-modal"
              onClick={() => setShowAdvModal(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
              title="Test fault tolerance, conflict resolution & self-evaluation recovery"
            >
              <Zap className="h-3 w-3 text-amber-600" />
              Adversarial Test
            </button>
          )}

          <button
            id="btn-toggle-graph-panel"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/60 transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isExpanded && (
        <div className="p-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-center">
              <span className="text-[10px] font-medium uppercase text-slate-400">Nodes Run</span>
              <p className="text-base font-bold text-slate-800">{nodeExecutions.length}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-center">
              <span className="text-[10px] font-medium uppercase text-slate-400">Parallel Branches</span>
              <p className="text-base font-bold text-slate-800">{parallelBranches.length}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-center">
              <span className="text-[10px] font-medium uppercase text-slate-400">Tool Failures</span>
              <p className={`text-base font-bold ${toolFailures.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {toolFailures.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-center">
              <span className="text-[10px] font-medium uppercase text-slate-400">Conflicts Resolved</span>
              <p className={`text-base font-bold ${conflicts.length > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
                {conflicts.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-center">
              <span className="text-[10px] font-medium uppercase text-slate-400">Replans Used</span>
              <p className="text-base font-bold text-slate-800">{replans.length}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-center">
              <span className="text-[10px] font-medium uppercase text-slate-400">Budget Remaining</span>
              <p className="text-base font-bold text-emerald-700">{resourceBudget.remainingBudget} pts</p>
            </div>
          </div>

          {/* Tab Navigation */}
          {replans.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/80 p-3 mb-4 flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-600 text-white shadow-xs mt-0.5">
                <RefreshCw className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-900">Autonomous Replanning Cycle Active</span>
                  <span className="rounded bg-orange-200/70 px-1.5 py-0.2 text-[10px] font-bold text-orange-900">
                    {replans.length} Replan Used
                  </span>
                </div>
                <p className="text-xs font-semibold text-orange-950 mt-0.5">
                  Evidence insufficient → autonomous replan → fallback evidence collection → objective verified
                </p>
                <p className="text-[11px] text-orange-800 mt-0.5">
                  Reason: {replans[0]?.reason || 'Missing empirical validation after tool fault.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex border-b border-slate-200 mb-4 overflow-x-auto text-xs font-medium">
            <button
              id="tab-graph-route"
              onClick={() => setActiveTab('route')}
              className={`pb-2 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'route'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Route & Node Timeline ({routeTaken.length})
            </button>
            {replans.length > 0 && (
              <button
                id="tab-graph-replanning"
                onClick={() => setActiveTab('replanning')}
                className={`pb-2 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'replanning'
                    ? 'border-orange-600 text-orange-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <RefreshCw className="h-3 w-3 text-orange-600" />
                Replanning & Recovery ({replans.length})
              </button>
            )}
            <button
              id="tab-graph-branches"
              onClick={() => setActiveTab('branches')}
              className={`pb-2 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'branches'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Parallel Execution & Faults ({parallelBranches.length})
            </button>
            {conflicts.length > 0 && (
              <button
                id="tab-graph-conflicts"
                onClick={() => setActiveTab('conflicts')}
                className={`pb-2 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'conflicts'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Conflict Resolutions ({conflicts.length})
              </button>
            )}
            <button
              id="tab-graph-checkpoints"
              onClick={() => setActiveTab('checkpoints')}
              className={`pb-2 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'checkpoints'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Checkpoints ({checkpoints.length})
            </button>
            <button
              id="tab-graph-selfeval"
              onClick={() => setActiveTab('selfeval')}
              className={`pb-2 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'selfeval'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Self-Evaluation & Decision
            </button>
            <button
              id="tab-graph-budget"
              onClick={() => setActiveTab('budget')}
              className={`pb-2 px-3 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'budget'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Resource Budget & Loop Guard
            </button>
          </div>

          {/* TAB 1: Route & Node Timeline */}
          {activeTab === 'route' && (
            <div>
              {/* Route Sequence Flow */}
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Dynamic Execution Path ({routeTaken.length} Steps)
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {routeTaken.map((nodeName, idx) => (
                    <React.Fragment key={`${nodeName}-${idx}`}>
                      <div className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${getNodeColor(nodeName)} shadow-xs flex items-center gap-1`}>
                        <span>{idx + 1}.</span>
                        <span>{nodeName}</span>
                      </div>
                      {idx < routeTaken.length - 1 && (
                        <span className="text-slate-300 font-bold text-xs">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Node Execution Details */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                  Node Execution Logs ({nodeExecutions.length})
                </span>
                {nodeExecutions.map((rec, i) => (
                  <div key={i} className="flex items-start justify-between rounded-lg border border-slate-100 bg-white p-3 hover:border-slate-200 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                          {i + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{rec.nodeName}</span>
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                          {rec.status}
                        </span>
                        {rec.confidence !== undefined && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Confidence: {(rec.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {rec.outputSummary && (
                        <p className="text-xs text-slate-600 pl-7">{rec.outputSummary}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap pl-2">
                      {rec.durationMs}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Replanning & Fallbacks */}
          {activeTab === 'replanning' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-600" />
                    <h4 className="text-xs font-bold text-orange-900">
                      Autonomous Replanner State Machine ({replans.length} Replanning Event)
                    </h4>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    AUTONOMOUS RECOVERY VERIFIED
                  </span>
                </div>

                <div className="rounded bg-white p-2.5 border border-orange-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block mb-0.5">
                    Execution Transition Logic
                  </span>
                  <p className="font-semibold text-slate-800">
                    Evidence insufficient → autonomous replan → fallback evidence collection → objective verified
                  </p>
                </div>

                {replans.map((r, i) => (
                  <div key={i} className="rounded-lg bg-white p-3 border border-orange-200 space-y-2.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900">Replan #{r.replanNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.timestamp}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Trigger Reason:</span>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 text-[11px] font-medium">
                        {r.reason}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded bg-slate-50 p-2 border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 block mb-1">Previous Tool Strategy</span>
                        <div className="flex flex-wrap gap-1">
                          {r.previousTools.map((t, idx) => (
                            <span key={idx} className="rounded bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[10px] font-medium border border-rose-100">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded bg-emerald-50/60 p-2 border border-emerald-100">
                        <span className="text-[10px] font-semibold text-emerald-700 block mb-1">New Fallback Tool Selection</span>
                        <div className="flex flex-wrap gap-1">
                          {r.newTools.map((t, idx) => (
                            <span key={idx} className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold border border-emerald-200">
                              {t} (Active Fallback)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {Object.keys(r.reformulatedQueries).length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                          Reformulated Search Vectors:
                        </span>
                        <div className="space-y-1">
                          {Object.entries(r.reformulatedQueries).map(([t, q]) => (
                            <div key={t} className="rounded bg-slate-50 p-2 border border-slate-100 font-mono text-[11px] text-slate-700">
                              <span className="text-indigo-600 font-bold">{t}:</span> "{q}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Dynamic Subtasks Generated ({r.newSubtasks.length}):
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 pl-1">
                        {r.newSubtasks.map((st, sIdx) => (
                          <li key={sIdx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Parallel Execution & Faults */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Parallel Branch Execution & Latency Records
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parallelBranches.map((branch, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 ${
                        branch.status === 'completed'
                          ? 'border-slate-200 bg-white'
                          : 'border-amber-200 bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-900">{branch.tool}</span>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            branch.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {branch.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Duration:</span>
                          <span className="font-mono text-slate-700">{branch.durationMs}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Results Returned:</span>
                          <span className="font-semibold text-slate-700">{branch.resultCount} items</span>
                        </div>
                        {branch.error && (
                          <div className="mt-2 rounded bg-rose-50 p-2 text-[11px] text-rose-700 border border-rose-100">
                            <strong>Fault:</strong> {branch.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {toolFailures.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-amber-700" />
                    <h4 className="text-xs font-bold text-amber-900">
                      Fault Isolation Active ({toolFailures.length} Tool Failures Contained)
                    </h4>
                  </div>
                  <p className="text-xs text-amber-800 mb-2">
                    The graph isolated tool branch failure without terminating the entire mission run. Surviving live evidence was preserved and passed to synthesis.
                  </p>
                  <div className="space-y-1.5">
                    {toolFailures.map((fail, i) => (
                      <div key={i} className="rounded bg-white/80 p-2 text-xs text-slate-700 border border-amber-200">
                        <div className="flex items-center justify-between font-semibold text-amber-900">
                          <span>{fail.tool}</span>
                          <span className="text-[10px] uppercase font-bold text-amber-700">{fail.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{fail.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fallbacks.length > 0 && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
                  <span className="text-xs font-bold text-indigo-900 block mb-1.5">
                    Autonomous Fallback Routes ({fallbacks.length})
                  </span>
                  {fallbacks.map((fb, i) => (
                    <div key={i} className="text-xs text-indigo-800 bg-white/80 rounded p-2 border border-indigo-100">
                      <span className="font-semibold">{fb.fromTool} → {fb.toTool}:</span> {fb.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Conflict Resolutions */}
          {activeTab === 'conflicts' && (
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Evidence Reconciliation & Cross-Source Synthesis
              </span>
              {conflicts.map((c) => (
                <div key={c.id} className="rounded-lg border border-amber-200 bg-amber-50/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">Conflict [{c.id}] · {c.conflictType.toUpperCase()}</span>
                    </div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Reconciled (Conf: {(c.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-white p-2.5 border border-slate-200">
                      <span className="font-semibold text-slate-800 block mb-1">Perspective A ({c.sourcesA.join(', ')})</span>
                      <p className="text-slate-600 text-[11px]">{c.claimA}</p>
                    </div>
                    <div className="rounded bg-white p-2.5 border border-slate-200">
                      <span className="font-semibold text-slate-800 block mb-1">Perspective B ({c.sourcesB.join(', ')})</span>
                      <p className="text-slate-600 text-[11px]">{c.claimB}</p>
                    </div>
                  </div>

                  <div className="rounded bg-white p-2.5 border border-amber-200 text-xs text-slate-700">
                    <span className="font-bold text-amber-900 block mb-0.5">Synthesis:</span>
                    <p className="text-slate-700 text-[11px]">{c.resolution}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Checkpoints */}
          {activeTab === 'checkpoints' && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Immutable State Checkpoints ({checkpoints.length})
              </span>
              {checkpoints.map((chk) => (
                <div key={chk.id} className="flex items-start justify-between rounded-lg border border-slate-100 bg-white p-3 hover:border-slate-200 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold font-mono text-slate-600">
                        #{chk.checkpointNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{chk.node}</span>
                      <span className="text-[10px] text-slate-400">
                        Evidence: {chk.evidenceCount} | Findings: {chk.findingsCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{chk.summary}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 whitespace-nowrap pl-3">
                    <div>Conf: {(chk.confidence * 100).toFixed(0)}%</div>
                    <div>Uncertainty: {(chk.uncertainty * 100).toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: Self-Evaluation & Decision */}
          {activeTab === 'selfeval' && (
            <div className="space-y-3">
              {selfEvaluation && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">Self-Evaluation & Objective Verification</span>
                    </div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {selfEvaluation.objectiveSatisfied ? 'OBJECTIVE SATISFIED' : 'NEEDS ADDITIONAL RESEARCH'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{selfEvaluation.evaluationSummary}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="rounded bg-white p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Confidence</span>
                      <span className="font-bold text-slate-800">{(selfEvaluation.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="rounded bg-white p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Uncertainty</span>
                      <span className="font-bold text-slate-800">{(selfEvaluation.uncertainty * 100).toFixed(0)}%</span>
                    </div>
                    <div className="rounded bg-white p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Evidence Sufficiency</span>
                      <span className="font-bold text-emerald-700">{selfEvaluation.evidenceSufficient ? 'YES' : 'NO'}</span>
                    </div>
                    <div className="rounded bg-white p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Recommended Action</span>
                      <span className="font-bold text-indigo-700">{selfEvaluation.recommendedNextAction}</span>
                    </div>
                  </div>
                </div>
              )}

              {finalDecision && (
                <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Final Decision Engine
                  </span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">Decision Rationale</h4>
                    {getStatusBadge(finalDecision.finalStatus)}
                  </div>
                  <p className="text-xs text-slate-600">{finalDecision.decisionReason}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Resource Budget & Loop Guard */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Resource Budget Telemetry</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Remaining Budget</span>
                    <span className="text-sm font-bold text-emerald-700">{resourceBudget.remainingBudget} / 100 units</span>
                  </div>
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Tool Calls Made</span>
                    <span className="text-sm font-bold text-slate-800">{resourceBudget.toolCallsMade} / {resourceBudget.maxToolCalls}</span>
                  </div>
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Parallel Calls</span>
                    <span className="text-sm font-bold text-slate-800">{resourceBudget.parallelCallsMade}</span>
                  </div>
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Replans Used</span>
                    <span className="text-sm font-bold text-slate-800">{resourceBudget.replansUsed} / {resourceBudget.maxReplans}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Loop & Deadlock Detection Guard</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    {loopDetection.loopDetected ? 'LOOP DETECTED (HALTED)' : 'NO LOOPS DETECTED'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Tracked {loopDetection.signaturesCount} distinct state execution signatures. Threshold limit: 2 recurring transitions.
                </p>
                {loopDetection.reason && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 mt-2">
                    {loopDetection.reason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adversarial Test Modal */}
      {showAdvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Adversarial Live Test Mode</h3>
                  <p className="text-[11px] text-slate-500">Inject controlled failures to verify autonomous recovery</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdvModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Simulate Tool Failure</label>
                <select
                  value={advFailTool}
                  onChange={(e) => setAdvFailTool(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 bg-white"
                >
                  <option value="search_github">Fail GitHub API (Simulate Rate Limit / Drop)</option>
                  <option value="search_arxiv">Fail arXiv API (Simulate Service Unavailable)</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advInjectConflict}
                    onChange={(e) => setAdvInjectConflict(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Inject conflicting claims (e.g. theoretical vs memory throttling)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advForceReplan}
                    onChange={(e) => setAdvForceReplan(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Force low initial confidence (triggers autonomous replanning)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advTightBudget}
                    onChange={(e) => setAdvTightBudget(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tight budget mode (forces Resource Evaluator tool trimming)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowAdvModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-adversarial-run"
                onClick={() => {
                  setShowAdvModal(false);
                  onRunAdversarialTest?.({
                    enabled: true,
                    failTool: advFailTool,
                    injectConflictingClaims: advInjectConflict,
                    forceLowInitialConfidence: advForceReplan,
                    tightBudget: advTightBudget
                  });
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 shadow-sm disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                Launch Adversarial Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
