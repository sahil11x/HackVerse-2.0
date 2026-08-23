import React from 'react';
import {
  X,
  Play,
  RotateCw,
  Edit,
  Trash2,
  CheckCircle,
  PauseCircle,
  Building2,
  ShieldAlert,
  Key,
  BookOpen,
  Globe,
  Clock,
  Activity,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Mission } from '../types';

interface MissionDetailModalProps {
  mission: Mission | null;
  isActive: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSetActive: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (mission: Mission) => void;
  onDelete: (id: string) => void;
  onRunCycle: (id: string) => void;
}

export const MissionDetailModal: React.FC<MissionDetailModalProps> = ({
  mission,
  isActive,
  isOpen,
  onClose,
  onSetActive,
  onToggleStatus,
  onEdit,
  onDelete,
  onRunCycle
}) => {
  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="mission-detail-modal"
        className="bg-[#121214] border border-[#27272A] rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#E4E4E7]"
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#27272A] flex items-center justify-between bg-[#161618]">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-[#1C1C1F] border border-[#27272A] font-mono text-xs font-bold text-[#00FF9C]">
              {mission.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white">{mission.name}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                    mission.status === 'active'
                      ? 'bg-[#00FF9C]/15 text-[#00FF9C] border border-[#00FF9C]/30 shadow-[0_0_8px_rgba(0,255,156,0.2)]'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {mission.status === 'active' ? '● ACTIVE TRACKING' : '○ PAUSED'}
                </span>
                {isActive && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    DASHBOARD TARGET
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                Created on {new Date(mission.createdAt).toLocaleDateString()} • Ingestion interval:{' '}
                {mission.frequencyMinutes}m
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-white rounded hover:bg-[#27272A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="text-[9px] uppercase font-mono text-[#71717A]">Signals Scanned</div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {mission.totalSignalsScanned.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="text-[9px] uppercase font-mono text-[#71717A]">Actionable Insights</div>
              <div className="text-lg font-mono font-bold text-[#00FF9C] mt-0.5">
                {mission.filteredInsightsCount}
              </div>
            </div>
            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="text-[9px] uppercase font-mono text-[#71717A]">Mean Engine Latency</div>
              <div className="text-lg font-mono font-bold text-sky-400 mt-0.5">
                {mission.meanLatencyMs}ms
              </div>
            </div>
            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="text-[9px] uppercase font-mono text-[#71717A]">Last Ingestion</div>
              <div className="text-xs font-mono text-[#A1A1AA] mt-1 truncate">
                {mission.lastRunAt ? new Date(mission.lastRunAt).toLocaleTimeString() : 'Pending'}
              </div>
            </div>
          </div>

          {/* 1. Main Topic & 2. Description */}
          <div className="p-3.5 bg-[#18181B] border border-[#27272A] rounded space-y-2">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#71717A] tracking-wider block mb-0.5">
                Main Research Topic
              </span>
              <span className="text-sm font-semibold text-white">
                {mission.topic || mission.objective}
              </span>
            </div>
            {mission.description && (
              <div className="pt-2 border-t border-[#27272A]">
                <span className="text-[10px] uppercase font-mono text-[#71717A] tracking-wider block mb-0.5">
                  Detailed Objective
                </span>
                <p className="text-[#A1A1AA] leading-relaxed text-xs">
                  {mission.description}
                </p>
              </div>
            )}
          </div>

          {/* 3. Companies & 4. Competitors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00FF9C] uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Monitored Companies ({mission.companies?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mission.companies && mission.companies.length > 0 ? (
                  mission.companies.map((comp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#00FF9C]/10 border border-[#00FF9C]/30 text-[#00FF9C] rounded font-mono text-[11px]"
                    >
                      {comp}
                    </span>
                  ))
                ) : (
                  <span className="text-[#71717A] italic">No primary companies specified</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Key Competitors ({mission.competitors?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mission.competitors && mission.competitors.length > 0 ? (
                  mission.competitors.map((comp, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 text-sky-300 rounded font-mono text-[11px]"
                    >
                      {comp}
                    </span>
                  ))
                ) : (
                  <span className="text-[#71717A] italic">No competitors configured</span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Target Keywords & 6. Research Interests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-2">
                <Key className="w-3.5 h-3.5" />
                <span>Core Keywords ({mission.keywords?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mission.keywords && mission.keywords.length > 0 ? (
                  mission.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded font-mono text-[10px]"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-[#71717A] italic">No keywords specified</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-400 uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Research Interests ({mission.researchInterests?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mission.researchInterests && mission.researchInterests.length > 0 ? (
                  mission.researchInterests.map((ri, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-200 rounded text-[10px]"
                    >
                      {ri}
                    </span>
                  ))
                ) : (
                  <span className="text-[#71717A] italic">No specific research interests listed</span>
                )}
              </div>
            </div>
          </div>

          {/* 7. Preferred Sources & 8. Search Vectors */}
          <div className="p-3 bg-[#18181B] border border-[#27272A] rounded space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00FF9C] uppercase tracking-wider mb-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Preferred Source Categories</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mission.preferredSources && mission.preferredSources.length > 0 ? (
                  mission.preferredSources.map((src, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-[#222226] border border-[#333338] text-white rounded font-mono text-[10px] uppercase"
                    >
                      {src}
                    </span>
                  ))
                ) : (
                  <span className="text-[#71717A]">Multi-source default</span>
                )}
              </div>
            </div>

            {mission.searchVectors && mission.searchVectors.length > 0 && (
              <div className="pt-2 border-t border-[#27272A]">
                <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-1.5">
                  Synthesized Search Vectors & Ingestion Pipelines
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mission.searchVectors.map((vec, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#141416] border border-[#27272A] text-[#A1A1AA] rounded text-[10px] font-mono"
                    >
                      • {vec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-5 border-t border-[#27272A] bg-[#161618] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(mission.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-900/40 text-xs font-mono transition-colors"
              title="Delete this tracking mission"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE</span>
            </button>

            <button
              onClick={() => onToggleStatus(mission.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                mission.status === 'active'
                  ? 'border-amber-700/50 bg-amber-950/20 text-amber-300 hover:bg-amber-900/40'
                  : 'border-[#00FF9C]/50 bg-[#00FF9C]/10 text-[#00FF9C] hover:bg-[#00FF9C]/20'
              }`}
            >
              {mission.status === 'active' ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>PAUSE TRACKING</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>ACTIVATE TRACKING</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(mission)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222226] border border-[#333338] text-white hover:border-[#00FF9C] text-xs font-mono rounded transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-[#00FF9C]" />
              <span>EDIT MISSION</span>
            </button>

            <button
              onClick={() => onRunCycle(mission.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C1C1F] border border-[#00FF9C]/60 text-[#00FF9C] hover:bg-[#00FF9C]/15 text-xs font-mono font-bold rounded transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>TRIGGER CYCLE</span>
            </button>

            {!isActive && (
              <button
                onClick={() => {
                  onSetActive(mission.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00FF9C] text-[#0A0A0B] text-xs font-mono font-bold rounded hover:bg-[#00FF9C]/90 shadow-[0_0_10px_rgba(0,255,156,0.3)] transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>SET AS ACTIVE</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
