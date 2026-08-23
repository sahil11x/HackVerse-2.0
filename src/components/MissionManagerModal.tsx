import React, { useState } from 'react';
import {
  X,
  Plus,
  Play,
  RotateCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  PauseCircle,
  Building2,
  Search,
  Filter,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';
import { Mission } from '../types';

interface MissionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  activeMissionId: string;
  onSelectMission: (id: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (mission: Mission) => void;
  onOpenView: (mission: Mission) => void;
  onToggleStatus: (id: string) => void;
  onDeleteMission: (id: string) => void;
  onRunCycle: (id: string) => void;
}

export const MissionManagerModal: React.FC<MissionManagerModalProps> = ({
  isOpen,
  onClose,
  missions,
  activeMissionId,
  onSelectMission,
  onOpenCreate,
  onOpenEdit,
  onOpenView,
  onToggleStatus,
  onDeleteMission,
  onRunCycle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');

  if (!isOpen) return null;

  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.companies || []).some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.keywords || []).some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'all' ? true : m.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="mission-manager-modal"
        className="bg-[#121214] border border-[#27272A] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#E4E4E7]"
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#27272A] flex items-center justify-between bg-[#161618]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#00FF9C]/10 text-[#00FF9C] border border-[#00FF9C]/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                TRACKING MISSIONS DIRECTORY ({missions.length})
              </h2>
              <p className="text-[11px] text-[#71717A]">
                Manage autonomous research objectives, monitored entities, and intelligence ingestion cycles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF9C] text-[#0A0A0B] font-mono font-bold text-xs rounded hover:bg-[#00FF9C]/90 shadow-[0_0_10px_rgba(0,255,156,0.3)] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW MISSION</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-[#71717A] hover:text-white rounded hover:bg-[#27272A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-[#27272A] bg-[#141416] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by mission name, topic, company, keyword, or code..."
              className="w-full bg-[#1C1C1F] border border-[#27272A] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:border-[#00FF9C] focus:outline-none font-sans"
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-[#71717A] uppercase">Status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded border transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#27272A] border-[#3F3F46] text-white'
                  : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              ALL ({missions.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-2.5 py-1 rounded border transition-colors ${
                filterStatus === 'active'
                  ? 'bg-[#00FF9C]/15 border-[#00FF9C] text-[#00FF9C]'
                  : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              ACTIVE ({missions.filter((m) => m.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('paused')}
              className={`px-2.5 py-1 rounded border transition-colors ${
                filterStatus === 'paused'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                  : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              PAUSED ({missions.filter((m) => m.status === 'paused').length})
            </button>
          </div>
        </div>

        {/* Missions Grid / List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredMissions.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#27272A] rounded-lg">
              <Cpu className="w-8 h-8 text-[#71717A] mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-white">No Tracking Missions Found</div>
              <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto">
                No missions match your current search or status filter. Create a new tracking mission or adjust your filters.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreate();
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF9C] text-[#0A0A0B] font-mono font-bold text-xs rounded hover:bg-[#00FF9C]/90 shadow-[0_0_10px_rgba(0,255,156,0.2)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>CREATE FIRST MISSION</span>
              </button>
            </div>
          ) : (
            filteredMissions.map((mission) => {
              const isCurrentActive = mission.id === activeMissionId;
              return (
                <div
                  key={mission.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isCurrentActive
                      ? 'bg-[#18181C] border-[#00FF9C]/60 shadow-[0_0_12px_rgba(0,255,156,0.08)]'
                      : 'bg-[#141416] border-[#27272A] hover:border-[#3F3F46]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#00FF9C] bg-[#00FF9C]/10 px-2 py-0.5 rounded border border-[#00FF9C]/20">
                          {mission.code}
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {mission.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                            mission.status === 'active'
                              ? 'bg-[#00FF9C]/15 text-[#00FF9C] border border-[#00FF9C]/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {mission.status === 'active' ? '● ACTIVE' : '○ PAUSED'}
                        </span>
                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            CURRENT DASHBOARD
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#A1A1AA]">
                        <span className="text-[#71717A] font-mono uppercase text-[10px] mr-1">TOPIC:</span>
                        <span className="text-white font-medium">{mission.topic || mission.objective}</span>
                      </div>

                      {/* Companies & Competitors Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {mission.companies && mission.companies.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono text-[#71717A] uppercase">Companies:</span>
                            {mission.companies.slice(0, 3).map((c, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-[#1C1C1F] border border-[#27272A] text-[#00FF9C] rounded text-[10px] font-mono"
                              >
                                {c}
                              </span>
                            ))}
                            {mission.companies.length > 3 && (
                              <span className="text-[9px] text-[#71717A] font-mono">
                                +{mission.companies.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {mission.keywords && mission.keywords.length > 0 && (
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-[9px] font-mono text-[#71717A] uppercase">Keywords:</span>
                            {mission.keywords.slice(0, 3).map((k, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-[#1C1C1F] border border-[#27272A] text-amber-200 rounded text-[10px] font-mono"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Live Stats */}
                      <div className="flex items-center gap-4 text-[10px] font-mono text-[#71717A] pt-1">
                        <span>
                          SIGNALS: <strong className="text-white">{mission.totalSignalsScanned.toLocaleString()}</strong>
                        </span>
                        <span>
                          INSIGHTS: <strong className="text-[#00FF9C]">{mission.filteredInsightsCount}</strong>
                        </span>
                        <span>
                          INTERVAL: <strong className="text-white">{mission.frequencyMinutes}m</strong>
                        </span>
                        <span>
                          LATENCY: <strong className="text-sky-400">{mission.meanLatencyMs}ms</strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center sm:flex-col items-end gap-1.5 shrink-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenView(mission);
                          }}
                          className="p-1.5 bg-[#1C1C1F] border border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#00FF9C] rounded text-xs transition-colors"
                          title="View full mission details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenEdit(mission);
                          }}
                          className="p-1.5 bg-[#1C1C1F] border border-[#27272A] text-[#A1A1AA] hover:text-[#00FF9C] hover:border-[#00FF9C] rounded text-xs transition-colors"
                          title="Edit mission parameters"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(mission.id)}
                          className={`p-1.5 border rounded text-xs transition-colors ${
                            mission.status === 'active'
                              ? 'bg-amber-950/20 border-amber-700/50 text-amber-300 hover:bg-amber-900/30'
                              : 'bg-[#00FF9C]/10 border-[#00FF9C]/40 text-[#00FF9C] hover:bg-[#00FF9C]/20'
                          }`}
                          title={mission.status === 'active' ? 'Pause tracking' : 'Activate tracking'}
                        >
                          {mission.status === 'active' ? (
                            <PauseCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => onRunCycle(mission.id)}
                          className="p-1.5 bg-[#1C1C1F] border border-[#27272A] text-[#00FF9C] hover:bg-[#00FF9C]/10 hover:border-[#00FF9C] rounded text-xs transition-colors"
                          title="Run immediate intelligence cycle"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteMission(mission.id)}
                          className="p-1.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900/40 rounded text-xs transition-colors"
                          title="Delete mission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!isCurrentActive && (
                        <button
                          onClick={() => {
                            onSelectMission(mission.id);
                            onClose();
                          }}
                          className="w-full mt-1 px-3 py-1 bg-[#1C1C1F] hover:bg-[#00FF9C] text-[#A1A1AA] hover:text-[#0A0A0B] border border-[#27272A] hover:border-[#00FF9C] font-mono font-bold text-[10px] rounded transition-all flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>MAKE ACTIVE</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#27272A] bg-[#161618] flex items-center justify-between text-xs text-[#71717A] font-mono">
          <div>
            TOTAL MISSIONS: <strong className="text-white">{missions.length}</strong> | ACTIVE:{' '}
            <strong className="text-[#00FF9C]">{missions.filter((m) => m.status === 'active').length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1C1C1F] border border-[#27272A] text-white hover:border-[#3F3F46] rounded text-xs transition-colors"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
