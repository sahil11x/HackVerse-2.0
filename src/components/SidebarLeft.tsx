import React, { useState } from 'react';
import {
  Plus,
  Layers,
  Building2,
  Key,
  Globe,
  PauseCircle,
  CheckCircle2,
  Info,
  Target,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Mission } from '../types';

interface SidebarLeftProps {
  missions: Mission[];
  activeMission: Mission | null;
  onSelectMission: (id: string) => void;
  onOpenNewMission: () => void;
  onOpenMissionManager: () => void;
  onOpenMissionDetail: (mission: Mission) => void;
  onToggleStatus: (id: string) => void;
  selectedEntity: string | null;
  onSelectEntity: (entityName: string | null) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  missions,
  activeMission,
  onSelectMission,
  onOpenNewMission,
  onOpenMissionManager,
  onOpenMissionDetail,
  onToggleStatus,
  selectedEntity,
  onSelectEntity
}) => {
  const [showFocus, setShowFocus] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const targetEntities = activeMission?.targetEntities || [];
  const companiesList = activeMission?.companies || [];
  const competitorsList = activeMission?.competitors || [];

  return (
    <aside className="w-64 sm:w-68 border-r border-[#27272A] bg-[#0E0E10] flex flex-col shrink-0 select-none overflow-y-auto">
      {/* 1. Research Mission Selector & Tracking Controls */}
      <div className="p-3.5 border-b border-[#27272A] bg-[#121214] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-mono font-semibold">
            Active Mission
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMissionManager}
              className="text-[#A1A1AA] hover:text-[#00FF9C] flex items-center gap-1 text-[10px] font-mono transition-colors"
              title="Open missions directory"
            >
              <Layers className="w-3 h-3 text-[#00FF9C]" />
              <span>All ({missions.length})</span>
            </button>
            <button
              onClick={onOpenNewMission}
              className="flex items-center gap-0.5 text-[#00FF9C] hover:underline text-[10px] font-mono font-bold"
              title="Create new research topic"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Mission Selector Dropdown */}
        <select
          value={activeMission?.id || ''}
          onChange={(e) => onSelectMission(e.target.value)}
          className="w-full bg-[#18181B] border border-[#27272A] rounded-md text-xs px-2.5 py-1.5 text-[#E4E4E7] focus:border-[#00FF9C] focus:outline-none cursor-pointer font-sans truncate font-medium"
        >
          {missions.length === 0 ? (
            <option value="" disabled>
              No active research missions
            </option>
          ) : (
            <>
              {!activeMission && <option value="">Select a research mission...</option>}
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </>
          )}
        </select>

        {activeMission && (
          <div className="flex items-center justify-between pt-0.5">
            <button
              onClick={() => onToggleStatus(activeMission.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border transition-colors ${
                activeMission.status === 'active'
                  ? 'bg-[#00FF9C]/10 border-[#00FF9C]/40 text-[#00FF9C] hover:bg-[#00FF9C]/20'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Toggle tracking status"
            >
              {activeMission.status === 'active' ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>TRACKING ON</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-2.5 h-2.5" />
                  <span>PAUSED</span>
                </>
              )}
            </button>

            <button
              onClick={() => onOpenMissionDetail(activeMission)}
              className="text-[#A1A1AA] hover:text-white flex items-center gap-1 text-[10px] font-mono hover:underline"
              title="View full research specifications"
            >
              <Info className="w-3 h-3 text-[#00FF9C]" />
              <span>Details</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-3.5 space-y-4 flex-1">
        {/* 2. Target Entities Filter */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-mono font-semibold flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-[#00FF9C]" />
              <span>Target Entities ({targetEntities.length || companiesList.length})</span>
            </h3>
            {selectedEntity && (
              <button
                onClick={() => onSelectEntity(null)}
                className="text-[9px] text-[#00FF9C] hover:underline font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {targetEntities.length > 0 ? (
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {targetEntities.map((entity, idx) => {
                const isSelected = selectedEntity === entity.name;
                const isCompetitor = entity.type === 'competitor' || entity.role.toLowerCase().includes('competitor');
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectEntity(isSelected ? null : entity.name)}
                    className={`w-full text-left flex items-center justify-between text-xs p-1.5 rounded transition-all ${
                      isSelected
                        ? 'bg-[#18181B] border border-[#00FF9C] text-white'
                        : 'hover:bg-[#141416] text-[#A1A1AA] border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-1">
                      <span className="font-medium text-[#E4E4E7] text-[11px] truncate">
                        {entity.name}
                      </span>
                      <span className="text-[9px] text-[#71717A] truncate">{entity.role}</span>
                    </div>
                    {isCompetitor ? (
                      <span className="text-[8px] font-mono text-sky-400 bg-sky-500/10 px-1 py-0.5 rounded shrink-0">
                        COMP
                      </span>
                    ) : entity.ticker ? (
                      <span className="text-[9px] font-mono text-[#00FF9C] bg-[#0A0A0B] px-1 py-0.5 rounded shrink-0">
                        {entity.ticker}
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono text-[#71717A] shrink-0">TRACK</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : companiesList.length > 0 ? (
            <div className="space-y-1">
              {companiesList.map((company, idx) => {
                const isSelected = selectedEntity === company;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectEntity(isSelected ? null : company)}
                    className={`w-full text-left flex items-center justify-between text-xs p-1.5 rounded transition-all ${
                      isSelected
                        ? 'bg-[#18181B] border border-[#00FF9C] text-white'
                        : 'hover:bg-[#141416] text-[#A1A1AA]'
                    }`}
                  >
                    <span className="font-medium text-[#E4E4E7] text-[11px]">{company}</span>
                    <span className="text-[8px] font-mono text-[#00FF9C]">PRIMARY</span>
                  </button>
                );
              })}
              {competitorsList.map((comp, idx) => {
                const isSelected = selectedEntity === comp;
                return (
                  <button
                    key={`comp-${idx}`}
                    onClick={() => onSelectEntity(isSelected ? null : comp)}
                    className={`w-full text-left flex items-center justify-between text-xs p-1.5 rounded transition-all ${
                      isSelected
                        ? 'bg-[#18181B] border border-[#00FF9C] text-white'
                        : 'hover:bg-[#141416] text-[#A1A1AA]'
                    }`}
                  >
                    <span className="font-medium text-[#E4E4E7] text-[11px]">{comp}</span>
                    <span className="text-[8px] font-mono text-sky-400">COMP</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-2 bg-[#121214] border border-[#27272A] rounded text-[10px] text-[#71717A]">
              Domain-wide investigation scope.
            </div>
          )}
        </section>

        {/* 3. Keywords Tracked */}
        {activeMission?.keywords && activeMission.keywords.length > 0 && (
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] mb-1.5 font-mono font-semibold flex items-center gap-1.5">
              <Key className="w-3 h-3 text-amber-400" />
              <span>Keywords Tracked</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {activeMission.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-[#141416] rounded text-[10px] text-amber-200/80 border border-[#27272A] font-mono"
                >
                  {kw}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 4. Collapsible Research Focus */}
        {activeMission?.researchInterests && activeMission.researchInterests.length > 0 && (
          <section className="border-t border-[#222225] pt-2">
            <button
              onClick={() => setShowFocus(!showFocus)}
              className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider text-[#71717A] hover:text-[#A1A1AA] font-mono font-semibold py-1"
            >
              <div className="flex items-center gap-1.5">
                <Target className="w-3 h-3 text-sky-400" />
                <span>Research Focus ({activeMission.researchInterests.length})</span>
              </div>
              {showFocus ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {showFocus && (
              <div className="space-y-1 mt-1.5">
                {activeMission.researchInterests.map((interest, idx) => (
                  <div key={idx} className="p-1.5 bg-[#121214] rounded border border-[#222225] text-[10px] text-[#D4D4D8] flex items-start gap-1">
                    <span className="text-[#00FF9C] font-mono">›</span>
                    <span>{interest}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5. Collapsible Configured Sources */}
        <section className="border-t border-[#222225] pt-2">
          <button
            onClick={() => setShowSources(!showSources)}
            className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider text-[#71717A] hover:text-[#A1A1AA] font-mono font-semibold py-1"
          >
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#00FF9C]" />
              <span>Configured Sources</span>
            </div>
            {showSources ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {showSources && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(activeMission?.preferredSources || ['arxiv', 'patent', 'news', 'sec_filing', 'social_media', 'github']).map((src, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-[#121214] rounded text-[9px] text-[#A1A1AA] border border-[#222225] font-mono uppercase"
                >
                  {src.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Clean Status Footer */}
      <div className="p-2.5 border-t border-[#27272A] bg-[#101012] flex items-center justify-between text-[10px] font-mono text-[#71717A]">
        <div className="flex items-center gap-1.5 text-[#00FF9C]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C]" />
          <span>Cadence: {activeMission?.frequencyMinutes || 30}m</span>
        </div>
        <span>{activeMission?.totalSignalsScanned || 1204} signals</span>
      </div>
    </aside>
  );
};

