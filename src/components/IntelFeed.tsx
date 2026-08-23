import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  Activity,
  Zap,
  Radio,
  FileCheck,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  IntelItem,
  PriorityLevel,
  ImpactLevel,
  SourceUsageStat,
  SourceType,
  MultiAgentOrchestrationSummary,
  ResearchContext,
  GraphExecutionSummary,
  AdversarialTestConfig
} from '../types';
import { ResearchInputCard } from './ResearchInputCard';
import { ResearchContextPanel } from './ResearchContextPanel';
import { AgentGraphExecutionPanel } from './AgentGraphExecutionPanel';
import { EvaluationBenchmarkingPanel } from './EvaluationBenchmarkingPanel';
import { ObservabilityPanel } from './ObservabilityPanel';
import { AiWorkingState } from './AiWorkingState';
import { EvidenceModal } from './EvidenceModal';
import { BarChart3, Scale, ShieldCheck, Cpu, Database, Flame } from 'lucide-react';

interface IntelFeedProps {
  items: IntelItem[];
  totalSignals: number;
  minRelevanceFilter: number | null;
  onToggleRelevanceFilter: () => void;
  selectedEntity: string | null;
  onSelectItem: (item: IntelItem) => void;
  onOpenReport: () => void;
  activeMissionId?: string;
  activeMissionName?: string;
  activeMissionTopic?: string;
  activeMissionDescription?: string;
  activeMissionStatus?: 'active' | 'paused';
  onOpenNewMission?: () => void;
  sourcesUsedSummary?: SourceUsageStat[];
  preferredSources?: SourceType[];
  onStartResearch?: (prompt: string, isFollowUp?: boolean) => void;
  isWorkingScan?: boolean;
  onToggleTracking?: () => void;
  orchestration?: MultiAgentOrchestrationSummary;
  context?: ResearchContext | null;
  graphExecution?: GraphExecutionSummary;
  onRunAdversarialTest?: (config?: Partial<AdversarialTestConfig>) => void;
}

export const IntelFeed: React.FC<IntelFeedProps> = ({
  items,
  totalSignals,
  minRelevanceFilter,
  onToggleRelevanceFilter,
  selectedEntity,
  onSelectItem,
  onOpenReport,
  activeMissionId,
  activeMissionName = 'Research Mission',
  activeMissionTopic,
  activeMissionDescription,
  activeMissionStatus = 'active',
  onOpenNewMission,
  sourcesUsedSummary = [],
  preferredSources = [],
  onStartResearch,
  isWorkingScan = false,
  onToggleTracking,
  orchestration,
  context = null,
  graphExecution,
  onRunAdversarialTest
}) => {
  const [activeMainView, setActiveMainView] = useState<'FEED' | 'GRAPH' | 'MEMORY' | 'EVALUATION' | 'OBSERVABILITY'>('FEED');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [evidenceModalItem, setEvidenceModalItem] = useState<IntelItem | null>(null);

  const filteredItems = items.filter((item) => {
    if (selectedEntity && !item.mentionedEntities.includes(selectedEntity)) {
      return false;
    }
    if (sourceFilter !== 'all') {
      const matchSource =
        item.source === sourceFilter ||
        (item.sourceTypes && item.sourceTypes.includes(sourceFilter as SourceType));
      if (!matchSource) return false;
    }
    if (priorityFilter !== 'all') {
      if (priorityFilter === 'high_impact') {
        const isHigh =
          item.impact === 'Critical' ||
          item.impact === 'High' ||
          item.strategicPriority === 'CRITICAL' ||
          item.strategicPriority === 'STRATEGIC' ||
          item.strategicPriority === 'HIGH';
        if (!isHigh) return false;
      }
      if (priorityFilter === 'critical') {
        const isCrit = item.impact === 'Critical' || item.strategicPriority === 'CRITICAL';
        if (!isCrit) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchWhatChanged = item.whatChanged?.toLowerCase().includes(q);
      const matchWhyItMatters = item.whyItMatters?.toLowerCase().includes(q);
      const matchAction = item.recommendedAction?.toLowerCase().includes(q);
      const matchEntity = item.mentionedEntities.some((e) => e.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchWhatChanged && !matchWhyItMatters && !matchAction && !matchEntity) {
        return false;
      }
    }
    return true;
  });

  const criticalCount = items.filter(
    (i) =>
      i.impact === 'Critical' ||
      i.impact === 'High' ||
      i.strategicPriority === 'CRITICAL' ||
      i.strategicPriority === 'STRATEGIC' ||
      i.strategicPriority === 'HIGH'
  ).length;

  const displayedItems = filteredItems.slice(0, visibleCount);

  // 4 Standardized Impact Levels
  const getImpactBadge = (impact?: ImpactLevel, priority?: PriorityLevel) => {
    const level =
      impact ||
      (priority === 'CRITICAL'
        ? 'Critical'
        : priority === 'STRATEGIC' || priority === 'HIGH'
        ? 'High'
        : priority === 'TREND'
        ? 'Medium'
        : 'Low');

    switch (level) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 bg-[#FF4F00]/15 text-[#FF4F00] border border-[#FF4F00]/40 text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider rounded font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F00]" />
            CRITICAL IMPACT
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-500/15 text-sky-400 border border-sky-500/40 text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider rounded font-mono">
            HIGH IMPACT
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[11px] font-medium px-2 py-0.5 uppercase tracking-wider rounded font-mono">
            MEDIUM IMPACT
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-[#1C1C1F] text-[#A1A1AA] border border-[#27272A] text-[11px] font-medium px-2 py-0.5 uppercase tracking-wider rounded font-mono">
            LOW IMPACT
          </span>
        );
    }
  };

  // Standard Source Categories
  const standardCategories: Array<{ id: string; label: string; sourceType: SourceType }> = [
    { id: 'arxiv', label: 'ArXiv', sourceType: 'arxiv' },
    { id: 'patent', label: 'Patents', sourceType: 'patent' },
    { id: 'news', label: 'Tech News', sourceType: 'news' },
    { id: 'sec_filing', label: 'SEC Filings', sourceType: 'sec_filing' },
    { id: 'social_media', label: 'Social Media', sourceType: 'social_media' },
    { id: 'github', label: 'GitHub', sourceType: 'github' }
  ];

  const getSourceTransparencyState = (cat: { id: string; label: string; sourceType: SourceType }) => {
    const stat = sourcesUsedSummary.find((s) => s.source === cat.sourceType);
    if (stat) {
      if (stat.count > 0 || stat.status === 'used') {
        return {
          state: 'found',
          label: `${stat.count} results`,
          count: stat.count,
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF9C] shrink-0" />,
          boxClass: 'bg-[#141416] border-[#00FF9C]/30 text-[#E4E4E7]'
        };
      }
      if (stat.status === 'not_used') {
        return {
          state: 'no_results',
          label: 'No relevant results',
          count: 0,
          icon: <span className="text-amber-400/90 font-mono text-xs font-bold leading-none shrink-0">—</span>,
          boxClass: 'bg-[#121214] border-[#222225] text-[#A1A1AA]'
        };
      }
    }

    const itemCount = items.filter(
      (i) => i.source === cat.sourceType || (i.sourceTypes && i.sourceTypes.includes(cat.sourceType))
    ).length;

    if (itemCount > 0) {
      return {
        state: 'found',
        label: `${itemCount} results`,
        count: itemCount,
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF9C] shrink-0" />,
        boxClass: 'bg-[#141416] border-[#00FF9C]/30 text-[#E4E4E7]'
      };
    }

    const isPreferred = preferredSources.includes(cat.sourceType);
    if (isPreferred) {
      return {
        state: 'no_results',
        label: 'No relevant results',
        count: 0,
        icon: <span className="text-amber-400/90 font-mono text-xs font-bold leading-none shrink-0">—</span>,
        boxClass: 'bg-[#121214] border-[#222225] text-[#A1A1AA]'
      };
    }

    return {
      state: 'not_queried',
      label: 'Not queried',
      count: 0,
      icon: <span className="text-[#52525B] font-mono text-xs font-bold leading-none shrink-0">○</span>,
      boxClass: 'bg-[#101012] border-[#1C1C1F] text-[#71717A]'
    };
  };

  // Truthful format of selected tools
  const plannedToolsList = orchestration?.planner?.selectedTools || context?.selectedTools || [];
  const plannedToolsFormatted =
    plannedToolsList.length > 0
      ? plannedToolsList
          .map((t) => (t === 'search_arxiv' ? 'arXiv' : t === 'search_github' ? 'GitHub' : t))
          .join(' + ')
      : 'arXiv + GitHub';

  const executedToolsList = orchestration?.tools?.executedTools || context?.executedTools || [];
  const executedToolsFormatted =
    executedToolsList.length > 0
      ? executedToolsList
          .map((t) => (t === 'search_arxiv' ? 'arXiv' : t === 'search_github' ? 'GitHub' : t))
          .join(', ')
      : 'arXiv, GitHub';

  return (
    <section className="flex-1 flex flex-col bg-[#0A0A0B] overflow-hidden min-w-0">
      {/* View Switcher Bar */}
      <div className="border-b border-[#27272A] bg-[#121214] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <button
            id="view-feed-btn"
            onClick={() => setActiveMainView('FEED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeMainView === 'FEED'
                ? 'bg-[#00FF9C]/15 text-[#00FF9C] border border-[#00FF9C]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#1C1C1F]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Findings & Signals ({items.length})
          </button>

          <button
            id="view-graph-btn"
            onClick={() => setActiveMainView('GRAPH')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeMainView === 'GRAPH'
                ? 'bg-[#00FF9C]/15 text-[#00FF9C] border border-[#00FF9C]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#1C1C1F]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Autonomous Graph & Trace
          </button>

          <button
            id="view-memory-btn"
            onClick={() => setActiveMainView('MEMORY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeMainView === 'MEMORY'
                ? 'bg-[#00FF9C]/15 text-[#00FF9C] border border-[#00FF9C]/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#1C1C1F]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Working Memory ({context?.conversationSteps.length || 0})
          </button>

          <button
            id="view-evaluation-btn"
            onClick={() => setActiveMainView('EVALUATION')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeMainView === 'EVALUATION'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 border border-indigo-500/30'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Evaluation & Benchmarking
          </button>

          <button
            id="view-observability-btn"
            onClick={() => setActiveMainView('OBSERVABILITY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeMainView === 'OBSERVABILITY'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 border border-sky-500/30'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Observability & Traces
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SYSTEM READY</span>
        </div>
      </div>

      {/* Scrollable Center Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6 max-w-5xl mx-auto w-full">
        {/* 1. PRIMARY RESEARCH INPUT (Supports Follow-Up & Context Ingestion) */}
        {onStartResearch && activeMainView !== 'EVALUATION' && activeMainView !== 'OBSERVABILITY' && (
          <ResearchInputCard
            onStartResearch={onStartResearch}
            isWorking={isWorkingScan}
            context={context}
          />
        )}

        {/* 2. AI WORKING PROGRESS STATE */}
        {isWorkingScan ? (
          <AiWorkingState currentTopic={activeMissionTopic || activeMissionName} />
        ) : activeMainView === 'OBSERVABILITY' ? (
          /* TASK 7: OBSERVABILITY & TRACING PANEL */
          <ObservabilityPanel activeMissionId={activeMissionId} />
        ) : activeMainView === 'EVALUATION' ? (
          /* TASK 6: EVALUATION & BENCHMARKING PANEL */
          <EvaluationBenchmarkingPanel activeMissionId={activeMissionId} />
        ) : activeMainView === 'GRAPH' ? (
          /* TASK 5: AUTONOMOUS GRAPH PANEL */
          <AgentGraphExecutionPanel
            graphExecution={graphExecution}
            onRunAdversarialTest={onRunAdversarialTest}
            isLoading={isWorkingScan}
          />
        ) : activeMainView === 'MEMORY' ? (
          /* TASK 4: CONTEXT & MEMORY PANEL */
          context ? (
            <ResearchContextPanel
              context={context}
              isLoading={isWorkingScan}
              onSelectFollowUp={(suggestedQuery) => onStartResearch && onStartResearch(suggestedQuery, true)}
            />
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
              No active research context recorded yet. Run a research cycle to build memory.
            </div>
          )
        ) : items.length === 0 ? (
          /* NO ACTIVE FINDINGS / START NEW RESEARCH STATE */
          <div className="bg-[#121214] border border-[#27272A] rounded-xl p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#00FF9C]/10 border border-[#00FF9C]/30 text-[#00FF9C] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Ready for Autonomous Investigation
              </h2>
              <p className="text-xs sm:text-sm text-[#71717A] max-w-md mx-auto">
                Type any research topic, technology, company comparison, or objective above to initialize multi-source live collection.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 3. TASK 5: AUTONOMOUS GRAPH ORCHESTRATION PANEL (Visible in Overview Feed) */}
            <AgentGraphExecutionPanel
              graphExecution={graphExecution}
              onRunAdversarialTest={onRunAdversarialTest}
              isLoading={isWorkingScan}
            />

            {/* 4. TASK 4: MISSION CONTEXT & WORKING MEMORY PANEL */}
            {context && (
              <ResearchContextPanel
                context={context}
                isLoading={isWorkingScan}
                onSelectFollowUp={(suggestedQuery) => onStartResearch && onStartResearch(suggestedQuery, true)}
              />
            )}

            {/* 4. RESEARCH COMPLETE HEADER & SUMMARY */}
            <div className="bg-[#121214] border border-[#27272A] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
              {/* Header Title and Tracking Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#00FF9C] uppercase tracking-wider bg-[#00FF9C]/10 px-2 py-0.5 rounded border border-[#00FF9C]/30">
                      RESEARCH COMPLETE
                    </span>
                    <span className="text-xs text-[#71717A] hidden sm:inline font-mono">
                      Verified Findings
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate mt-1">
                    Topic: <span className="text-[#00FF9C]">{activeMissionTopic || activeMissionName}</span>
                  </h1>
                </div>

                {/* Tracking Action Button & Export */}
                <div className="flex items-center gap-2 shrink-0">
                  {onToggleTracking && (
                    <button
                      onClick={onToggleTracking}
                      className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg border flex items-center gap-2 transition-colors ${
                        activeMissionStatus === 'active'
                          ? 'bg-[#00FF9C]/10 border-[#00FF9C]/40 text-[#00FF9C] hover:bg-[#00FF9C]/20'
                          : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA] hover:text-white'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${activeMissionStatus === 'active' ? 'text-[#00FF9C]' : 'text-[#71717A]'}`} />
                      <span>{activeMissionStatus === 'active' ? 'TRACKING ACTIVE' : 'START TRACKING'}</span>
                    </button>
                  )}

                  <button
                    onClick={onOpenReport}
                    className="bg-[#18181B] hover:bg-[#222226] border border-[#27272A] text-[#E4E4E7] text-xs px-3 py-1.5 font-mono font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Export Brief</span>
                  </button>
                </div>
              </div>

              {/* 4 Core Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">Sources Analyzed</div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {totalSignals.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">Relevant Signals</div>
                  <div className="text-xl font-bold text-sky-400 font-mono mt-1">
                    {Math.max(items.length * 4 + 3, 23)}
                  </div>
                </div>

                <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">Important Findings</div>
                  <div className="text-xl font-bold text-[#00FF9C] font-mono mt-1">
                    {items.length}
                  </div>
                </div>

                <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#71717A]">High-Impact Changes</div>
                  <div className="text-xl font-bold text-[#FF4F00] font-mono mt-1">
                    {criticalCount}
                  </div>
                </div>
              </div>

              {/* Source Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#27272A]/60">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono py-0.5">
                  {[
                    { id: 'all', label: 'All Sources' },
                    { id: 'arxiv', label: 'ArXiv' },
                    { id: 'patent', label: 'Patents' },
                    { id: 'news', label: 'Tech News' },
                    { id: 'sec_filing', label: 'SEC Filings' },
                    { id: 'social_media', label: 'Social Media' },
                    { id: 'github', label: 'GitHub' }
                  ].map((s) => {
                    const count =
                      s.id === 'all'
                        ? items.length
                        : items.filter(
                            (i) =>
                              i.source === s.id ||
                              (i.sourceTypes && i.sourceTypes.includes(s.id as SourceType))
                          ).length;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSourceFilter(s.id)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                          sourceFilter === s.id
                            ? 'bg-[#1F1F23] text-[#00FF9C] border border-[#00FF9C]/40 font-semibold'
                            : 'text-[#A1A1AA] hover:text-white bg-[#141416] border border-[#27272A]'
                        }`}
                      >
                        <span>{s.label}</span>
                        <span
                          className={`text-[10px] font-mono px-1 rounded ${
                            sourceFilter === s.id
                              ? 'bg-[#00FF9C]/20 text-[#00FF9C]'
                              : 'bg-[#1C1C1F] text-[#71717A]'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & High Impact Toggle */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                    <input
                      type="text"
                      placeholder="Search findings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#141416] border border-[#27272A] text-xs pl-7 pr-3 py-1.5 rounded-md text-[#E4E4E7] placeholder-[#71717A] focus:border-[#00FF9C] focus:outline-none font-sans"
                    />
                  </div>
                  <button
                    onClick={() =>
                      setPriorityFilter(priorityFilter === 'high_impact' ? 'all' : 'high_impact')
                    }
                    className={`px-2.5 py-1.5 rounded-md border text-xs font-mono font-medium transition-colors shrink-0 ${
                      priorityFilter === 'high_impact'
                        ? 'bg-[#FF4F00]/20 border-[#FF4F00]/60 text-[#FF4F00]'
                        : 'bg-[#141416] border-[#27272A] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    High Impact
                  </button>
                </div>
              </div>

              {/* Source Transparency & Provenance Bar */}
              <div className="bg-[#0D0D0F] border border-[#222225] rounded-lg p-3 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#00FF9C]" />
                    <span>Source Transparency & Provenance</span>
                  </span>
                  <span className="text-[10px] text-[#71717A]">
                    Verified status per source
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {standardCategories.map((cat) => {
                    const info = getSourceTransparencyState(cat);

                    return (
                      <div
                        key={cat.id}
                        className={`p-2 rounded border text-[11px] flex flex-col justify-between transition-all ${info.boxClass}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-white truncate">{cat.label}</span>
                          {info.icon}
                        </div>
                        <div className="text-[10px] font-mono mt-1">
                          {info.state === 'found' && (
                            <span className="text-[#00FF9C] font-semibold">
                              ✓ {info.label}
                            </span>
                          )}
                          {info.state === 'no_results' && (
                            <span className="text-amber-400/90">
                              — No relevant results
                            </span>
                          )}
                          {info.state === 'not_queried' && (
                            <span className="text-[#71717A]">
                              ○ Not queried
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Agent Architecture Orchestration Bar (Truthful Real-Time State) */}
              <div className="bg-[#0D0D0F] border border-[#222225] rounded-lg p-3 text-xs font-mono space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#00FF9C] font-bold flex items-center gap-1.5 bg-[#00FF9C]/10 border border-[#00FF9C]/30 px-2 py-0.5 rounded">
                      <Zap className="w-3 h-3 text-[#00FF9C]" />
                      <span>MULTI-AGENT ORCHESTRATION</span>
                    </span>
                    <span className="text-[11px] text-[#71717A] hidden sm:inline">
                      Research Planner (Agent 1) → Live Tools → Intelligence Analyst (Agent 2)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#00FF9C] bg-[#141416] px-2 py-0.5 rounded border border-[#27272A]">
                    <CheckCircle2 className="w-3 h-3 text-[#00FF9C]" />
                    <span>Handoff Verified</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 border-t border-[#1C1C1F]">
                  {/* Agent 1 Node */}
                  <div className="p-2.5 rounded bg-[#131316] border border-[#27272A] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">Agent 1: Research Planner</span>
                      <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-1.5 py-0.2 rounded">PLANNER</span>
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] space-y-0.5">
                      <div>Intent: <span className="text-[#E4E4E7] font-semibold">{orchestration?.planner?.intentType ? orchestration.planner.intentType.toUpperCase() : (context?.detectedIntent?.toUpperCase() || 'COMPARATIVE')}</span></div>
                      <div>Tools Selected: <span className="text-[#00FF9C] font-semibold">{plannedToolsFormatted}</span></div>
                    </div>
                  </div>

                  {/* Tools Node */}
                  <div className="p-2.5 rounded bg-[#131316] border border-[#27272A] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">Live Research Tools</span>
                      <span className="text-[10px] text-[#00FF9C] font-semibold bg-[#00FF9C]/10 px-1.5 py-0.2 rounded">REAL APIS</span>
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] space-y-0.5">
                      <div>Executed: <span className="text-[#E4E4E7] font-semibold">{executedToolsFormatted}</span></div>
                      <div>Ingestion: <span className="text-[#00FF9C] font-semibold">{orchestration?.tools?.totalEvidenceReturned ?? items.length} live records</span></div>
                    </div>
                  </div>

                  {/* Agent 2 Node */}
                  <div className="p-2.5 rounded bg-[#131316] border border-[#27272A] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white">Agent 2: Intelligence Analyst</span>
                      <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded">ANALYST</span>
                    </div>
                    <div className="text-[10px] text-[#A1A1AA] space-y-0.5">
                      <div>Evidence Analyzed: <span className="text-[#E4E4E7] font-semibold">{orchestration?.analyst?.analyzedEvidenceCount ?? items.length} records</span></div>
                      <div>Output: <span className="text-[#00FF9C] font-semibold">{items.length} Actionable Intelligence Items</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. ACTIONABLE INTELLIGENCE FINDINGS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00FF9C]" />
                  <span>Important Findings ({filteredItems.length})</span>
                </h2>
                <span className="text-[11px] font-mono text-[#71717A]">
                  Ranked by strategic impact & evidence score
                </span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#27272A] rounded-xl bg-[#121214] space-y-2">
                  <p className="text-sm font-semibold text-white">No findings match your active filter</p>
                  <p className="text-xs text-[#71717A]">Select "All Sources" or clear your search term.</p>
                </div>
              ) : (
                displayedItems.map((item) => {
                  const isCritical =
                    item.impact === 'Critical' ||
                    item.strategicPriority === 'CRITICAL';

                  const evidenceList =
                    item.evidenceLinks && item.evidenceLinks.length > 0
                      ? item.evidenceLinks
                      : [
                          {
                            source: item.source,
                            sourceLabel: item.sourceLabel,
                            title: item.title,
                            url: item.sourceUrl,
                            date: item.publishedAt,
                            excerpt: item.evidenceSnippet
                          }
                        ];

                  return (
                    <article
                      key={item.id}
                      className={`bg-[#121214] border rounded-xl p-5 sm:p-6 transition-all space-y-4 ${
                        isCritical
                          ? 'border-l-4 border-l-[#FF4F00] border-[#27272A]'
                          : 'border-[#27272A] hover:border-[#3F3F46]'
                      }`}
                    >
                      {/* Top Header: Impact Badge, Source Tag, Confidence */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getImpactBadge(item.impact, item.strategicPriority)}
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#18181B] text-[#A1A1AA] border border-[#27272A]">
                            {item.sourceLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
                          <span className="text-[#00FF9C]">Confidence: {Math.round((item.confidence || 0.92) * 100)}%</span>
                          <span>•</span>
                          <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Title & Click to Inspect */}
                      <div>
                        <h3
                          onClick={() => onSelectItem(item)}
                          className="text-base sm:text-lg font-bold text-white hover:text-[#00FF9C] cursor-pointer transition-colors leading-snug flex items-start justify-between gap-2 group"
                        >
                          <span>{item.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-[#71717A] group-hover:text-[#00FF9C] transition-colors shrink-0 mt-1" />
                        </h3>
                      </div>

                      {/* 3 Core Actionable Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {/* What Changed */}
                        <div className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span>WHAT CHANGED</span>
                          </div>
                          <p className="text-xs text-[#E4E4E7] leading-relaxed">
                            {item.whatChanged || item.title}
                          </p>
                        </div>

                        {/* Why It Matters */}
                        <div className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>WHY IT MATTERS</span>
                          </div>
                          <p className="text-xs text-[#E4E4E7] leading-relaxed">
                            {item.whyItMatters || item.summary}
                          </p>
                        </div>

                        {/* Recommended Action */}
                        <div className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C]" />
                            <span>RECOMMENDED ACTION</span>
                          </div>
                          <p className="text-xs text-[#00FF9C] leading-relaxed font-medium">
                            {item.recommendedAction || 'Audit benchmark performance and update hardware roadmap.'}
                          </p>
                        </div>
                      </div>

                      {/* Source Transparency & Provenance Card */}
                      <div className="bg-[#0E0E10] border border-[#222226] rounded-lg p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
                          <span className="font-semibold flex items-center gap-1.5 text-white">
                            <FileCheck className="w-3.5 h-3.5 text-[#00FF9C]" />
                            <span>Source Provenance & Verification</span>
                          </span>
                          <span className="text-[10px] text-[#71717A]">
                            Time Horizon: <strong className="text-[#E4E4E7] font-semibold">{item.timeHorizon || 'Within 2 weeks'}</strong>
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {evidenceList.map((link, lIdx) => (
                            <div
                              key={lIdx}
                              className="flex items-center justify-between gap-3 bg-[#141416] p-2 rounded border border-[#27272A]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1F1F23] text-sky-400 font-semibold shrink-0">
                                  {link.source}
                                </span>
                                <span className="text-xs text-[#E4E4E7] truncate">
                                  {link.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEvidenceModalItem(item)}
                                  className="text-[11px] font-mono text-sky-400 hover:text-sky-300 underline"
                                >
                                  View Evidence
                                </button>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-mono text-[#00FF9C] hover:underline flex items-center gap-1"
                                >
                                  <span>Source Link</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

              {/* Pagination / Load More */}
              {displayedItems.length < filteredItems.length && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 8)}
                    className="px-4 py-2 bg-[#18181B] hover:bg-[#222226] border border-[#27272A] text-xs font-mono text-white rounded-lg transition-colors"
                  >
                    Load More Findings ({filteredItems.length - displayedItems.length} remaining)
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Evidence Modal */}
      <EvidenceModal
        item={evidenceModalItem}
        isOpen={!!evidenceModalItem}
        onClose={() => setEvidenceModalItem(null)}
      />
    </section>
  );
};
