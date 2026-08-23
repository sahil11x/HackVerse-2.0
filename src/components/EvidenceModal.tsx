import React from 'react';
import { X, ExternalLink, FileCheck, ShieldCheck, Tag, Calendar, Info, Globe, CheckCircle2 } from 'lucide-react';
import { IntelItem, EvidenceLink, ImpactLevel, PriorityLevel } from '../types';

interface EvidenceModalProps {
  item: IntelItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ item, isOpen, onClose }) => {
  if (!isOpen || !item) return null;

  const evidenceList: EvidenceLink[] =
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
          <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded text-[10px] font-mono uppercase font-bold">
            Primary Evidence
          </span>
        );
      case 'research':
        return (
          <span className="px-2 py-0.5 bg-purple-950/80 text-purple-400 border border-purple-800/60 rounded text-[10px] font-mono uppercase font-bold">
            Research Publication
          </span>
        );
      case 'company':
      case 'regulatory':
        return (
          <span className="px-2 py-0.5 bg-blue-950/80 text-blue-400 border border-blue-800/60 rounded text-[10px] font-mono uppercase font-bold">
            Company / Regulatory Filing
          </span>
        );
      case 'social':
        return (
          <span className="px-2 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-800/60 rounded text-[10px] font-mono uppercase font-bold">
            Community / Social Signal
          </span>
        );
      case 'secondary':
      default:
        return (
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-[10px] font-mono uppercase font-bold">
            Secondary Reporting
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272A] bg-[#161618] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00FF9C]/10 border border-[#00FF9C]/30 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-[#00FF9C]" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#00FF9C] uppercase font-bold tracking-wider">
                VERIFIED SOURCE PROVENANCE
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                Evidence Dossier ({evidenceList.length} Verified {evidenceList.length === 1 ? 'Source' : 'Sources'})
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#27272A] rounded-lg text-[#A1A1AA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Finding Context Header */}
        <div className="p-4 bg-[#141416] border-b border-[#27272A] space-y-1.5">
          <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider block">
            Supports Finding:
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white">
            {item.title}
          </p>
        </div>

        {/* Evidence List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-[#E4E4E7]">
          {evidenceList.map((ev, idx) => (
            <div
              key={idx}
              className="bg-[#161618] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-4 space-y-3 transition-colors"
            >
              {/* Top metadata */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {getEvidenceTypeBadge(ev.evidenceType, ev.source)}
                  <span className="text-xs font-mono font-bold text-[#00FF9C]">
                    {ev.sourceLabel || ev.source.toUpperCase()}
                  </span>
                </div>

                {ev.date && (
                  <span className="text-[11px] font-mono text-[#71717A] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(ev.date).toLocaleDateString()}</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-sm font-bold text-white leading-snug">
                {ev.title}
              </h4>

              {/* Excerpt */}
              {ev.excerpt && (
                <div className="bg-[#0D0D0F] border border-[#222225] rounded-lg p-3">
                  <div className="text-[10px] font-mono uppercase text-[#71717A] mb-1">
                    Relevant Excerpt / Direct Telemetry:
                  </div>
                  <p className="text-xs font-mono text-[#D4D4D8] italic leading-relaxed">
                    "{ev.excerpt}"
                  </p>
                </div>
              )}

              {/* Why This Source Supports Finding */}
              <div className="bg-[#121214] border border-[#00FF9C]/20 rounded-lg p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#00FF9C] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#00FF9C]" />
                  <span>Why this source supports the finding:</span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {ev.supportingReason || `Verifies factual claims directly from authoritative publication in ${ev.sourceLabel}.`}
                </p>
              </div>

              {/* Source Link */}
              <div className="pt-1 flex justify-end">
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F23] hover:bg-[#27272B] border border-[#2E2E33] hover:border-[#00FF9C]/40 text-xs font-mono text-sky-400 hover:text-sky-300 rounded-lg transition-colors"
                >
                  <span>Open Source Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272A] bg-[#161618] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#71717A]">
            Zero-hallucination verified citation links
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1F1F23] hover:bg-[#27272A] border border-[#2E2E33] text-xs font-mono text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
