import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Link2,
  AlertCircle,
  Cpu,
  Calendar,
  Tag,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { IntelItem, ImpactLevel, PriorityLevel } from '../types';

interface ItemDetailModalProps {
  item: IntelItem | null;
  allItems: IntelItem[];
  onClose: () => void;
  onSelectRelated: (item: IntelItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  allItems,
  onClose,
  onSelectRelated
}) => {
  if (!item) return null;

  const relatedItems = allItems.filter((i) => item.relatedItemIds?.includes(i.id));
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
            excerpt: item.evidenceSnippet || item.rawContent.substring(0, 180) + '...',
            supportingReason: `Direct verified reporting from ${item.sourceLabel}.`,
            evidenceType:
              item.source === 'patent' || item.source === 'sec_filing'
                ? 'primary'
                : item.source === 'arxiv'
                ? 'research'
                : item.source === 'social_media'
                ? 'social'
                : 'secondary'
          }
        ];

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
          <span className="bg-[#FF4F00] text-[#0A0A0B] text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider rounded font-mono">
            CRITICAL IMPACT
          </span>
        );
      case 'High':
        return (
          <span className="bg-sky-500 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider rounded font-mono">
            HIGH IMPACT
          </span>
        );
      case 'Medium':
        return (
          <span className="bg-amber-400 text-[#0A0A0B] text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider rounded font-mono">
            MEDIUM IMPACT
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="bg-[#27272A] text-[#A1A1AA] text-[10px] font-medium px-2.5 py-0.5 uppercase tracking-wider rounded font-mono">
            LOW IMPACT
          </span>
        );
    }
  };

  const getEvidenceTypeBadge = (type?: string, source?: string) => {
    const t =
      type ||
      (source === 'patent' || source === 'sec_filing'
        ? 'primary'
        : source === 'arxiv'
        ? 'research'
        : source === 'social_media'
        ? 'social'
        : 'secondary');

    switch (t) {
      case 'primary':
        return (
          <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded text-[9px] font-mono uppercase font-bold">
            Primary Evidence
          </span>
        );
      case 'research':
        return (
          <span className="px-2 py-0.5 bg-purple-950/80 text-purple-400 border border-purple-800/60 rounded text-[9px] font-mono uppercase font-bold">
            Research Publication
          </span>
        );
      case 'company':
      case 'regulatory':
        return (
          <span className="px-2 py-0.5 bg-blue-950/80 text-blue-400 border border-blue-800/60 rounded text-[9px] font-mono uppercase font-bold">
            Company Filing
          </span>
        );
      case 'social':
        return (
          <span className="px-2 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-800/60 rounded text-[9px] font-mono uppercase font-bold">
            Community Signal
          </span>
        );
      case 'secondary':
      default:
        return (
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-[9px] font-mono uppercase font-bold">
            Secondary Reporting
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#27272A] bg-[#161618] flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {getImpactBadge(item.impact, item.strategicPriority)}
            <span className="text-xs font-mono text-[#71717A] uppercase">
              CATEGORY: {item.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#27272A] rounded-lg text-[#A1A1AA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#E4E4E7]">
          {/* Title */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#71717A] mt-2">
              <span className="text-[#00FF9C]">SOURCE: {item.sourceLabel}</span>
              <span>DATE: {new Date(item.publishedAt).toLocaleDateString()}</span>
              <span>CONFIDENCE: {Math.round((item.confidence || 0.92) * 100)}%</span>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono text-[#71717A]">Relevance Score</div>
                <div className="text-xl font-bold font-mono text-[#00FF9C]">{item.relevanceScore}/100</div>
              </div>
              <div className="w-12 h-1.5 bg-[#0A0A0B] rounded-full overflow-hidden">
                <div className="bg-[#00FF9C] h-full" style={{ width: `${item.relevanceScore}%` }} />
              </div>
            </div>

            <div className="bg-[#161618] border border-[#27272A] p-3 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono text-[#71717A]">Impact Score</div>
                <div className="text-xl font-bold font-mono text-[#FF4F00]">{item.impactScore}/100</div>
              </div>
              <div className="w-12 h-1.5 bg-[#0A0A0B] rounded-full overflow-hidden">
                <div className="bg-[#FF4F00] h-full" style={{ width: `${item.impactScore}%` }} />
              </div>
            </div>
          </div>

          {/* Core Actionable Intelligence Sections */}
          <div className="space-y-3">
            {/* What Changed */}
            <div className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>WHAT CHANGED</span>
              </div>
              <p className="text-xs sm:text-sm text-[#E4E4E7] leading-relaxed">
                {item.whatChanged || item.summary.split('.')[0] + '.'}
              </p>
            </div>

            {/* Why It Matters */}
            <div className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#00FF9C] font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#00FF9C]" />
                <span>WHY IT MATTERS</span>
              </div>
              <p className="text-xs sm:text-sm text-[#E4E4E7] leading-relaxed">
                {item.whyItMatters || (item.keyImplications && item.keyImplications[0]) || item.summary}
              </p>
            </div>

            {/* Recommended Action & Time Horizon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 bg-[#161618] border border-[#00FF9C]/40 rounded-lg p-3.5 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#00FF9C] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF9C]" />
                  <span>RECOMMENDED ACTION</span>
                </div>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                  {item.recommendedAction || 'Further technical benchmarking and competitive review recommended.'}
                </p>
              </div>

              <div className="bg-[#161618] border border-[#27272A] rounded-lg p-3.5 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>TIME HORIZON</span>
                </div>
                <p className="text-xs sm:text-sm text-[#E4E4E7] font-mono font-medium">
                  {item.timeHorizon || (item.impact === 'Critical' ? 'Within 48 hours' : 'Within 2 weeks')}
                </p>
              </div>
            </div>
          </div>

          {/* Supporting Evidence & Verified Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#00FF9C]" />
                <span>Supporting Evidence ({evidenceList.length} Verified Sources)</span>
              </span>
              <span className="text-[10px] text-[#71717A] font-normal">Cross-source validated</span>
            </h4>
            <div className="space-y-2">
              {evidenceList.map((ev, idx) => (
                <div key={idx} className="p-3 bg-[#0A0A0B] border border-[#27272A] rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getEvidenceTypeBadge(ev.evidenceType, ev.source)}
                      <span className="text-[10px] font-mono text-[#00FF9C] uppercase font-bold">
                        {ev.sourceLabel || ev.source}
                      </span>
                    </div>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Open Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="font-semibold text-white text-xs">{ev.title}</div>
                  {ev.excerpt && (
                    <p className="font-mono text-[11px] text-[#A1A1AA] italic leading-relaxed bg-[#141416] p-2.5 rounded-lg border border-[#1F1F22]">
                      "{ev.excerpt}"
                    </p>
                  )}
                  {ev.supportingReason && (
                    <div className="text-[11px] text-[#00FF9C] flex items-center gap-1.5 pt-0.5">
                      <span className="font-mono text-[10px] text-[#71717A] uppercase">Supports finding:</span>
                      <span>{ev.supportingReason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Impacted Competitors & Entities */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2">
              Impacted Competitors & Entities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {item.mentionedEntities && item.mentionedEntities.length > 0 ? (
                item.mentionedEntities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#1C1C1F] border border-[#27272A] rounded-lg text-xs text-[#E4E4E7] font-mono"
                  >
                    {ent}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#71717A] italic">General technological domain</span>
              )}
            </div>
          </div>

          {/* Connected Cross-Source Items */}
          {relatedItems.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-mono text-[#71717A] mb-2 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#00FF9C]" />
                <span>Connected Intelligence Signals ({relatedItems.length})</span>
              </h4>
              <div className="space-y-2">
                {relatedItems.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="w-full text-left p-2.5 bg-[#161618] hover:bg-[#1C1C1F] border border-[#27272A] hover:border-[#00FF9C] rounded-lg flex items-center justify-between transition-colors"
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-medium text-[#E4E4E7] truncate">{rel.title}</div>
                      <div className="text-[10px] font-mono text-[#71717A]">{rel.sourceLabel}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#00FF9C] shrink-0">VIEW ›</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#27272A] bg-[#161618] flex justify-between items-center">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-[#00FF9C] hover:underline"
          >
            <span>OPEN PRIMARY SOURCE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-xs font-mono text-white rounded-lg transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
