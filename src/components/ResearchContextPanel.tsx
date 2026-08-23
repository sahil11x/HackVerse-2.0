import React, { useState } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  Github,
  Search,
  FilterX,
  History
} from 'lucide-react';
import { ResearchContext, ResearchStep } from '../types';

interface ResearchContextPanelProps {
  context: ResearchContext | null;
  isLoading?: boolean;
  onSelectFollowUp?: (query: string) => void;
}

export const ResearchContextPanel: React.FC<ResearchContextPanelProps> = ({
  context,
  isLoading,
  onSelectFollowUp
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'entities' | 'findings' | 'quality'>('timeline');

  if (!context) return null;

  const totalSteps = context.conversationSteps?.length || 0;
  const recentFindingsCount = context.importantFindings?.length || 0;
  const entitiesCount = context.targetEntities?.length || 0;
  const rejectedCount = context.rejectedFindings?.length || 0;

  return (
    <div
      id="research-context-memory-panel"
      className="bg-white border border-slate-200 rounded-xl shadow-sm transition-all duration-200 mb-6 overflow-hidden"
    >
      {/* Header Bar */}
      <div
        id="context-panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-semibold text-xs shadow-sm">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                Mission Context & Working Memory
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalSteps} {totalSteps === 1 ? 'Step' : 'Steps'} Recorded
              </span>
              {context.detectedIntent && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/80 text-slate-700 uppercase tracking-wider">
                  {context.detectedIntent.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              Active Focus: <span className="text-slate-700 font-medium">{context.currentQuery || context.researchObjective}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
              <Building2 className="w-3 h-3 text-slate-400" />
              {entitiesCount} Entities
            </span>
            <span className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {recentFindingsCount} Key Findings
            </span>
          </div>

          <button
            id="toggle-context-panel-btn"
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label={isExpanded ? 'Collapse context memory' : 'Expand context memory'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div id="context-panel-body" className="p-5">
          {/* Top Quick Bar: Sub-Tabs & Follow-up suggestions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                id="context-tab-timeline"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('timeline');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-white text-slate-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5 text-indigo-500" />
                Step Timeline ({totalSteps})
              </button>
              <button
                id="context-tab-entities"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('entities');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === 'entities'
                    ? 'bg-white text-slate-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                Entities ({entitiesCount})
              </button>
              <button
                id="context-tab-findings"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('findings');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  activeTab === 'findings'
                    ? 'bg-white text-slate-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Key Findings ({recentFindingsCount})
              </button>
              {rejectedCount > 0 && (
                <button
                  id="context-tab-quality"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('quality');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                    activeTab === 'quality'
                      ? 'bg-white text-slate-800 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <FilterX className="w-3.5 h-3.5 text-amber-500" />
                  Filtered ({rejectedCount})
                </button>
              )}
            </div>

            {/* Verified Sources Pill */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Memory Tools:</span>
              <div className="flex items-center gap-1">
                {context.executedTools?.includes('search_arxiv') && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                    <FileText className="w-3 h-3" /> ArXiv
                  </span>
                )}
                {context.executedTools?.includes('search_github') && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
                    <Github className="w-3 h-3" /> GitHub
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TAB 1: Step Timeline */}
          {activeTab === 'timeline' && (
            <div id="context-timeline-view" className="space-y-3">
              {context.conversationSteps && context.conversationSteps.length > 0 ? (
                context.conversationSteps.map((step: ResearchStep, idx: number) => {
                  const isLatest = idx === context.conversationSteps.length - 1;
                  return (
                    <div
                      key={step.runId || idx}
                      id={`timeline-step-${step.stepNumber}`}
                      className={`relative pl-6 pb-3 last:pb-0 border-l-2 transition-all ${
                        isLatest ? 'border-indigo-400' : 'border-slate-200'
                      }`}
                    >
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isLatest
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-50'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {step.stepNumber}
                      </div>

                      <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              Step {step.stepNumber}: {step.query}
                            </span>
                            {step.isFollowUp && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Follow-up
                              </span>
                            )}
                            {step.intentType && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold font-mono uppercase">
                                Intent: {step.intentType.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Step Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                          <div className="bg-white p-2 rounded border border-slate-100">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                              Tools & Evidence
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 flex-wrap">
                              <span>
                                Tools: <strong className="text-slate-800">{step.selectedTools.join(', ')}</strong>
                              </span>
                              {!step.selectedTools.includes('search_github') && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500">
                                    GitHub: <span className="text-slate-700 font-medium">not queried</span>
                                  </span>
                                </>
                              )}
                              {!step.selectedTools.includes('search_arxiv') && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500">
                                    ArXiv: <span className="text-slate-700 font-medium">not queried</span>
                                  </span>
                                </>
                              )}
                              <span className="text-slate-300">•</span>
                              <span>
                                <strong className="text-slate-800">{step.findingsCount}</strong> findings generated
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded border border-slate-100">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                              Analyst Synthesis
                            </div>
                            <p className="text-slate-700 text-xs line-clamp-1">
                              {step.analystSummary || 'Findings cross-correlated and verified.'}
                            </p>
                          </div>
                        </div>

                        {/* Top Findings Snippets */}
                        {step.topFindings && step.topFindings.length > 0 && (
                          <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-slate-400">Captured:</span>
                            {step.topFindings.slice(0, 2).map((title, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-mono text-[11px] line-clamp-1 max-w-[280px]"
                              >
                                {title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  No previous steps logged yet. Start a research query above to begin.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Target Entities */}
          {activeTab === 'entities' && (
            <div id="context-entities-view" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {context.targetEntities && context.targetEntities.length > 0 ? (
                context.targetEntities.map((entity, eIdx) => (
                  <div
                    key={eIdx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-800">{entity.name}</span>
                        {entity.ticker && (
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-mono text-[10px] font-semibold">
                            {entity.ticker}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{entity.role || 'Tracked Intelligence Entity'}</p>
                    </div>
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-4 text-xs text-slate-500">
                  No entities extracted for this mission context.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Key Findings */}
          {activeTab === 'findings' && (
            <div id="context-findings-view" className="space-y-2">
              {context.importantFindings && context.importantFindings.length > 0 ? (
                context.importantFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        finding.impact === 'Critical'
                          ? 'bg-rose-500'
                          : finding.impact === 'High'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{finding.title}</h4>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white border border-slate-200 uppercase text-slate-600">
                          {finding.source}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{finding.whyItMatters || finding.whatChanged}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">No key findings established in memory yet.</div>
              )}
            </div>
          )}

          {/* TAB 4: Quality & Filtered Items */}
          {activeTab === 'quality' && (
            <div id="context-quality-view" className="space-y-2">
              <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Relevance & Quality Filter: Irrelevant or noisy raw tool results discarded by Agent 2.</span>
              </div>
              {context.rejectedFindings && context.rejectedFindings.length > 0 ? (
                context.rejectedFindings.map((rej, rIdx) => (
                  <div key={rIdx} className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg text-xs">
                    <div className="font-semibold text-slate-800 line-clamp-1">{rej.title}</div>
                    <div className="text-amber-800 text-[11px] mt-0.5">Filter Reason: {rej.reason}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">No low-relevance items filtered out.</div>
              )}
            </div>
          )}

          {/* Follow-up Context Action Prompts (Part 4) */}
          {context.followUpQueries && context.followUpQueries.length > 0 && onSelectFollowUp && (
            <div id="context-follow-up-suggestions" className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Contextual Follow-Up Suggestions (Uses Step History):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {context.followUpQueries.map((suggestedQuery, sIdx) => (
                  <button
                    key={sIdx}
                    id={`followup-btn-${sIdx}`}
                    type="button"
                    disabled={isLoading}
                    onClick={() => onSelectFollowUp(suggestedQuery)}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 text-xs text-indigo-900 font-medium transition-all text-left"
                  >
                    <span>{suggestedQuery}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
