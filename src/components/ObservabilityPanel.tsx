import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Flame,
  Layers,
  Play,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';
import {
  Trace,
  TraceSpan,
  ToolCallTrace,
  DecisionTrace,
  DiagnosisResult,
  ControlledFailureBenchmark
} from '../types';
import { api } from '../services/api';

interface ObservabilityPanelProps {
  activeMissionId?: string;
}

export const ObservabilityPanel: React.FC<ObservabilityPanelProps> = ({ activeMissionId }) => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [expandedSpanIds, setExpandedSpanIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'DECISIONS' | 'TOOLS' | 'DIAGNOSIS' | 'BENCHMARK'>('TIMELINE');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [benchmarkData, setBenchmarkData] = useState<ControlledFailureBenchmark | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const loadTraces = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTraces();
      setTraces(res.traces || []);
      if (res.traces && res.traces.length > 0) {
        if (!selectedTrace || !res.traces.some((t) => t.traceId === selectedTrace.traceId)) {
          setSelectedTrace(res.traces[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load traces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBenchmark = async () => {
    try {
      const data = await api.getLatestBenchmark();
      setBenchmarkData(data);
    } catch (err) {
      // Normal if not run yet
    }
  };

  useEffect(() => {
    loadTraces();
    loadBenchmark();
  }, [activeMissionId]);

  const handleSelectTrace = (trace: Trace) => {
    setSelectedTrace(trace);
    setDiagnosis(null);
    if (trace.spans && trace.spans.length > 0) {
      setExpandedSpanIds(new Set([trace.spans[0].spanId, trace.spans[1]?.spanId].filter(Boolean)));
    }
  };

  const toggleSpanExpand = (spanId: string) => {
    setExpandedSpanIds((prev) => {
      const next = new Set(prev);
      if (next.has(spanId)) {
        next.delete(spanId);
      } else {
        next.add(spanId);
      }
      return next;
    });
  };

  const handleRunDiagnosis = async () => {
    if (!selectedTrace) return;
    setIsDiagnosing(true);
    try {
      const res = await api.diagnoseTrace(selectedTrace.traceId);
      setDiagnosis(res);
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleRunControlledBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const result = await api.runControlledFailureBenchmark(activeMissionId);
      setBenchmarkData(result);
      setActiveTab('BENCHMARK');
      await loadTraces();
    } catch (err) {
      console.error('Benchmark run failed:', err);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const filteredTraces = traces.filter((t) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      t.traceId.toLowerCase().includes(q) ||
      t.researchObjective.toLowerCase().includes(q) ||
      t.finalStatus.toLowerCase().includes(q)
    );
  });

  const maxTraceDuration = selectedTrace?.spans.length
    ? Math.max(...selectedTrace.spans.map((s) => s.durationMs || 10), 100)
    : 1000;

  return (
    <div id="observability-subsystem" className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#27272A] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-sky-400" />
                DISTRIBUTED TELEMETRY & OBSERVABILITY
              </span>
              <span className="text-xs text-[#71717A] font-mono hidden sm:inline">
                OpenTelemetry / Structured Execution Graph
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Agent Execution Traces & Fault Remediation
            </h1>
            <p className="text-xs text-[#A1A1AA] max-w-2xl">
              End-to-end distributed tracing across multi-node research graph, live tool calls, LLM token metrics, latency waterfalls, and automated root-cause failure recovery.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="refresh-traces-btn"
              onClick={loadTraces}
              disabled={isLoading}
              className="bg-[#18181B] hover:bg-[#222226] border border-[#27272A] text-[#E4E4E7] text-xs px-3 py-2 font-mono rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              id="run-controlled-failure-benchmark-btn"
              onClick={handleRunControlledBenchmark}
              disabled={isRunningBenchmark || isLoading}
              className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs px-4 py-2 font-mono font-semibold rounded-lg shadow-md shadow-rose-950/40 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isRunningBenchmark ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Failure Test...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Failure & Remediation Benchmark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Trace Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-400" />
              Total Traces Indexed
            </div>
            <div className="text-lg font-bold text-white font-mono mt-1">
              {traces.length}
            </div>
          </div>

          <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              Active Spans / Nodes
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {selectedTrace ? selectedTrace.spans.length : 0} Spans
            </div>
          </div>

          <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Trace Duration
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-1">
              {selectedTrace?.totalDurationMs ? `${selectedTrace.totalDurationMs} ms` : '—'}
            </div>
          </div>

          <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              Tokens / Status
            </div>
            <div className="text-lg font-bold text-purple-400 font-mono mt-1">
              {selectedTrace?.totalTokens !== 'Unavailable' ? `${selectedTrace?.totalTokens} Tok` : 'N/A'}{' '}
              <span className="text-xs text-slate-400">({selectedTrace?.finalStatus || 'IDLE'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TRACE SELECTOR & INNER TAB NAVIGATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Trace List Selector */}
        <div className="lg:col-span-4 bg-[#121214] border border-[#27272A] rounded-xl p-4 space-y-3 h-[600px] flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Recorded Executions
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredTraces.length} / {traces.length}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search trace ID, objective..."
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Trace List Items */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredTraces.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No traces recorded yet. Run an autonomous research cycle to record distributed spans.
              </div>
            ) : (
              filteredTraces.map((trace) => {
                const isSelected = selectedTrace?.traceId === trace.traceId;
                const statusColor =
                  trace.finalStatus === 'SUCCESS'
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : trace.finalStatus === 'RECOVERED'
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

                return (
                  <button
                    key={trace.traceId}
                    onClick={() => handleSelectTrace(trace)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500/40 shadow-sm'
                        : 'bg-[#161618] border-[#27272A] hover:bg-[#1C1C1F] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] font-semibold text-slate-300 truncate">
                        {trace.traceId}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${statusColor}`}
                      >
                        {trace.finalStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-2">
                      {trace.researchObjective}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                      <span>{trace.spans.length} spans • {trace.toolCalls.length} tools</span>
                      <span>{trace.totalDurationMs}ms</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Trace Inspector & Tabs */}
        <div className="lg:col-span-8 bg-[#121214] border border-[#27272A] rounded-xl p-4 sm:p-5 flex flex-col h-[600px] overflow-hidden">
          {/* Inner Tab Bar */}
          <div className="flex items-center gap-2 border-b border-[#27272A] pb-3 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'TIMELINE'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Waterfall Timeline ({selectedTrace?.spans.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('DECISIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'DECISIONS'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Decisions & Routing ({selectedTrace?.decisions.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('TOOLS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'TOOLS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Tool Calls ({selectedTrace?.toolCalls.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('DIAGNOSIS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'DIAGNOSIS'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Root Cause Diagnosis
            </button>

            <button
              onClick={() => setActiveTab('BENCHMARK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'BENCHMARK'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#18181B]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Before vs After Benchmark
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 custom-scrollbar space-y-4">
            {!selectedTrace ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                Select a trace from the left panel to inspect telemetry details.
              </div>
            ) : (
              <>
                {/* ========================================================================= */}
                {/* 1. TIMELINE & WATERFALL SPANS */}
                {/* ========================================================================= */}
                {activeTab === 'TIMELINE' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-white/5">
                      <span>Execution Span / Graph Node</span>
                      <span>Duration & Waterfall Bar</span>
                    </div>

                    {selectedTrace.spans.map((span) => {
                      const isExpanded = expandedSpanIds.has(span.spanId);
                      const widthPercent = Math.max(
                        Math.min(Math.round(((span.durationMs || 10) / maxTraceDuration) * 100), 100),
                        8
                      );
                      const statusColor =
                        span.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : span.status === 'FAILED'
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-400';

                      return (
                        <div
                          key={span.spanId}
                          className="bg-[#161618] border border-[#27272A] rounded-lg overflow-hidden transition-all text-xs"
                        >
                          {/* Header Bar */}
                          <div
                            onClick={() => toggleSpanExpand(span.spanId)}
                            className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#1A1A1D]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="font-mono font-bold text-white truncate">
                                {span.operationName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">
                                {span.component}
                              </span>
                            </div>

                            {/* Waterfall Bar & Latency */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-24 sm:w-36 bg-[#27272A] h-2 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={`h-full rounded-full ${
                                    span.status === 'SUCCESS'
                                      ? 'bg-emerald-500'
                                      : span.status === 'FAILED'
                                      ? 'bg-rose-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${widthPercent}%` }}
                                ></div>
                              </div>
                              <span className="font-mono text-[11px] text-slate-300 min-w-[50px] text-right">
                                {span.durationMs}ms
                              </span>
                              <span
                                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${statusColor}`}
                              >
                                {span.status}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="p-3 bg-[#111113] border-t border-[#27272A] space-y-2.5 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-500">Input Summary: </span>
                                <span className="text-slate-300">{span.inputSummary || 'N/A'}</span>
                              </div>

                              <div>
                                <span className="text-slate-500">Output Summary: </span>
                                <span className="text-slate-300">{span.outputSummary || 'N/A'}</span>
                              </div>

                              {span.error && (
                                <div className="p-2 bg-rose-950/30 border border-rose-500/30 rounded text-rose-300">
                                  <div className="font-bold">Error: [{span.error.code || 'ERR'}]</div>
                                  <div>{span.error.message}</div>
                                </div>
                              )}

                              {span.metadata && Object.keys(span.metadata).length > 0 && (
                                <div>
                                  <span className="text-slate-500">Metadata: </span>
                                  <span className="text-sky-300">
                                    {JSON.stringify(span.metadata)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. DECISIONS & ROUTING CHOICES */}
                {/* ========================================================================= */}
                {activeTab === 'DECISIONS' && (
                  <div className="space-y-3">
                    {selectedTrace.decisions.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-mono">
                        No routing decisions recorded for this trace.
                      </div>
                    ) : (
                      selectedTrace.decisions.map((d) => (
                        <div
                          key={d.decisionId}
                          className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-purple-400">
                              {d.decision}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {d.latencyMs}ms evaluation • {d.component}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                            <div className="bg-[#111113] p-2 rounded border border-white/5">
                              <span className="text-slate-500">Selected Route: </span>
                              <span className="text-emerald-400 font-bold">{d.selectedRoute}</span>
                            </div>
                            <div className="bg-[#111113] p-2 rounded border border-white/5">
                              <span className="text-slate-500">Alternatives: </span>
                              <span className="text-slate-400">
                                {d.alternativeRoutes?.join(', ') || 'None'}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-300 bg-black/30 p-2 rounded border border-white/5 font-mono">
                            <span className="text-slate-500">Rationale: </span>
                            {d.rationale}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 3. TOOL CALLS & LIVE SOURCE QUERIES */}
                {/* ========================================================================= */}
                {activeTab === 'TOOLS' && (
                  <div className="space-y-3">
                    {selectedTrace.toolCalls.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-mono">
                        No live tool calls recorded in this trace.
                      </div>
                    ) : (
                      selectedTrace.toolCalls.map((t) => (
                        <div
                          key={t.id}
                          className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">{t.toolName}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">
                                {t.sourceProvider}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-400">
                                {t.durationMs}ms
                              </span>
                              <span
                                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                                  t.success
                                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                    : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                                }`}
                              >
                                {t.status}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] font-mono text-slate-300">
                            <span className="text-slate-500">Query: </span>
                            <span>"{t.querySummary}"</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                            <span>Results Retrieved: {t.resultCount || 0} items (HTTP {t.httpStatus || 200})</span>
                            {t.errorMessage && <span className="text-rose-400">Error: {t.errorMessage}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 4. ROOT CAUSE DIAGNOSIS & REMEDIATION */}
                {/* ========================================================================= */}
                {activeTab === 'DIAGNOSIS' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        Autonomous Root Cause Diagnosis Engine
                      </h4>
                      <button
                        onClick={handleRunDiagnosis}
                        disabled={isDiagnosing}
                        className="bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs px-3 py-1.5 font-mono font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{isDiagnosing ? 'Diagnosing...' : 'Run Trace Diagnosis'}</span>
                      </button>
                    </div>

                    {diagnosis ? (
                      <div className="space-y-3">
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-amber-400" />
                              COMPONENT: {diagnosis.failedComponent} ({diagnosis.failedOperation})
                            </span>
                            <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                              {diagnosis.failureDetected ? 'FAULT DETECTED' : 'HEALTHY'}
                            </span>
                          </div>

                          <div className="text-xs text-white font-medium">
                            <span className="text-slate-400 font-mono">Probable Root Cause: </span>
                            {diagnosis.probableRootCause}
                          </div>

                          <div className="text-xs text-slate-300 bg-black/40 p-2.5 rounded border border-white/5 font-mono">
                            <div className="text-slate-400 font-bold mb-1">Evidence from Trace:</div>
                            {diagnosis.evidenceFromTrace}
                          </div>

                          <div className="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded border border-emerald-500/30 font-mono">
                            <div className="text-emerald-400 font-bold mb-1">Recommended Remediation:</div>
                            {diagnosis.recommendedRemediation}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#161618] border border-[#27272A] rounded-xl p-8 text-center space-y-3">
                        <Sparkles className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400">
                          Click "Run Trace Diagnosis" above to trigger deterministic root-cause analysis on this trace.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 5. BEFORE VS AFTER CONTROLLED FAILURE BENCHMARK */}
                {/* ========================================================================= */}
                {activeTab === 'BENCHMARK' && (
                  <div className="space-y-4">
                    {benchmarkData ? (
                      <div className="space-y-4">
                        <div className="bg-[#161618] border border-[#27272A] rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              Controlled Failure Benchmark: {benchmarkData.scenarioName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(benchmarkData.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Remediation Applied: {benchmarkData.remediationApplied}
                          </p>
                        </div>

                        {/* Side-by-Side Comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Baseline Card */}
                          <div className="bg-[#141416] border border-rose-500/30 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                              <span className="text-xs font-mono font-bold text-rose-400">
                                BASELINE (Injected Failure / No Fallback)
                              </span>
                              <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30">
                                {benchmarkData.baseline.taskSuccess ? 'SUCCESS' : 'FAILED'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Duration</div>
                                <div className="text-sm font-bold text-slate-300">
                                  {benchmarkData.baseline.durationMs}ms
                                </div>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Tool Calls</div>
                                <div className="text-sm font-bold text-slate-300">
                                  {benchmarkData.baseline.toolCalls} calls
                                </div>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Failed Calls</div>
                                <div className="text-sm font-bold text-rose-400">
                                  {benchmarkData.baseline.failedCalls}
                                </div>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Errors</div>
                                <div className="text-sm font-bold text-rose-400">
                                  {benchmarkData.baseline.errors}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Improved Card */}
                          <div className="bg-[#141416] border border-emerald-500/30 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                IMPROVED (Tracing & Autonomous Remediation)
                              </span>
                              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                                {benchmarkData.improved.taskSuccess ? 'SUCCESS' : 'FAILED'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Duration</div>
                                <div className="text-sm font-bold text-emerald-400">
                                  {benchmarkData.improved.durationMs}ms
                                </div>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Tool Calls</div>
                                <div className="text-sm font-bold text-slate-300">
                                  {benchmarkData.improved.toolCalls} calls
                                </div>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Failed Calls</div>
                                <div className="text-sm font-bold text-emerald-400">
                                  {benchmarkData.improved.failedCalls}
                                </div>
                              </div>
                              <div className="bg-black/30 p-2 rounded">
                                <div className="text-[10px] text-slate-500">Errors</div>
                                <div className="text-sm font-bold text-emerald-400">
                                  {benchmarkData.improved.errors}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Improvements & Delta Summary */}
                        <div className="bg-[#161618] border border-emerald-500/30 rounded-xl p-4 space-y-2">
                          <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            MEASURED IMPROVEMENTS & RESILIENCE GAINS
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono mt-2">
                            <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded text-emerald-300">
                              <span className="text-slate-400">Latency Delta: </span>
                              <span className="font-bold text-emerald-400">
                                {benchmarkData.delta.latencyImprovementPercent}% faster
                              </span>
                            </div>
                            <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded text-emerald-300">
                              <span className="text-slate-400">Error Reduction: </span>
                              <span className="font-bold text-emerald-400">
                                {benchmarkData.delta.errorReductionPercent}% fewer errors
                              </span>
                            </div>
                            <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded text-emerald-300">
                              <span className="text-slate-400">Task Outcome: </span>
                              <span className="font-bold text-emerald-400">
                                {benchmarkData.delta.taskSuccessImprovement ? 'Recovered' : 'Maintained'}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 font-mono bg-black/40 p-3 rounded mt-2">
                            <span className="text-slate-400 font-bold">Summary: </span>
                            {benchmarkData.delta.summary}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#161618] border border-[#27272A] rounded-xl p-8 text-center space-y-3">
                        <Play className="w-8 h-8 text-slate-500 mx-auto" />
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          No benchmark has been executed yet. Click "Run Failure & Remediation Benchmark" above to test the system under controlled upstream failures and observe automatic recovery.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
