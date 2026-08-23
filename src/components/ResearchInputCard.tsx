import React, { useState } from 'react';
import { Search, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { ResearchContext } from '../types';

interface ResearchInputCardProps {
  onStartResearch: (prompt: string, isFollowUp?: boolean) => void;
  isWorking?: boolean;
  context?: ResearchContext | null;
}

const DEFAULT_EXAMPLES = [
  "Quantum error correction architectures (arXiv only)",
  "Dhurandhar movie reception and audience sentiment",
  "Solid-state battery chemistry breakthroughs",
  "NVIDIA AI chips vs AMD accelerators"
];

const DEFAULT_PLACEHOLDER =
  "Enter any research query or topic (e.g., 'Research quantum error correction', 'Track Dhurandhar reception', 'Compare NVIDIA vs AMD AI accelerators', 'Cake preservation techniques')...";

export const ResearchInputCard: React.FC<ResearchInputCardProps> = ({
  onStartResearch,
  isWorking = false,
  context
}) => {
  const [prompt, setPrompt] = useState('');

  const hasContext = Boolean(context && context.conversationSteps && context.conversationSteps.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = prompt.trim();
    if (!query) return;

    // Detect if this is likely a follow-up
    const lower = query.toLowerCase();
    const isFollowUp =
      hasContext &&
      (lower.startsWith('now ') ||
        lower.startsWith('also ') ||
        lower.includes('these techniques') ||
        lower.includes('compare this with') ||
        lower.includes('the above') ||
        lower.includes('these architectures') ||
        lower.includes('these models') ||
        lower.includes('implementations of this'));

    onStartResearch(query, isFollowUp);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    const lower = suggestion.toLowerCase();
    const isFollowUp =
      hasContext &&
      (lower.startsWith('now ') || lower.includes('these techniques') || lower.includes('compare this with'));
    onStartResearch(suggestion, isFollowUp);
  };

  const currentExamples =
    hasContext && context?.followUpQueries && context.followUpQueries.length > 0
      ? context.followUpQueries.slice(0, 3)
      : DEFAULT_EXAMPLES;

  return (
    <div id="research-input-card" className="bg-[#121214] border border-[#27272A] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2.5">
          <Search className="w-4 h-4 text-[#00FF9C]" />
          <span>{hasContext ? 'Ask a Follow-Up or New Research Objective' : 'What do you want me to research?'}</span>
        </h2>
        <span className="text-[11px] font-mono text-[#71717A] hidden sm:inline-block">
          {hasContext ? `Mission Memory Active (${context?.conversationSteps.length} Steps)` : 'Autonomous Multi-Source Investigation'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <textarea
          id="research-query-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isWorking}
          rows={3}
          placeholder={
            hasContext
              ? `Continue investigation (e.g., "Now find open-source implementations of these techniques" or "Compare this with AMD MI300")...`
              : DEFAULT_PLACEHOLDER
          }
          className="w-full bg-[#161618] border border-[#2A2A2E] focus:border-[#00FF9C] rounded-lg p-3.5 text-sm text-[#E4E4E7] placeholder-[#52525B] focus:outline-none resize-none font-sans leading-relaxed transition-colors disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0.5">
          {/* Curated Suggestions / Contextual Prompts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#71717A] mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00FF9C]" />
              {hasContext ? 'Follow-ups:' : 'Examples:'}
            </span>
            {currentExamples.map((item, idx) => (
              <button
                key={idx}
                id={`example-prompt-btn-${idx}`}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                disabled={isWorking}
                className="px-2.5 py-1 bg-[#18181B] hover:bg-[#222226] text-[#A1A1AA] hover:text-[#00FF9C] border border-[#27272A] hover:border-[#00FF9C]/40 rounded text-xs transition-colors disabled:opacity-50 text-left line-clamp-1 max-w-[280px]"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            id="start-research-submit-btn"
            type="submit"
            disabled={isWorking || !prompt.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#00FF9C] hover:bg-[#00E58C] text-[#0A0A0B] font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 font-mono transition-all transform active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-sm"
          >
            {isWorking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0B]" />
                <span>RESEARCHING...</span>
              </>
            ) : (
              <>
                <span>{hasContext ? 'EXECUTE STEP' : 'START RESEARCH'}</span>
                <ArrowRight className="w-4 h-4 text-[#0A0A0B]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
