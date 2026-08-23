import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  ArrowRight,
  Send,
  Building2,
  Key,
  Globe,
  CheckCircle2,
  Zap,
  SlidersHorizontal,
  RotateCw
} from 'lucide-react';
import { StructuredResearchObjective, CreateMissionPayload } from '../services/api';
import { api } from '../services/api';

interface ResearchAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartResearch: (payload: CreateMissionPayload) => Promise<void>;
  onOpenAdvancedForm?: () => void;
}

const EXAMPLE_PROMPTS = [
  'Research quantum error correction and surface codes across Google Quantum AI and IBM.',
  'Investigate Dhurandhar reception, audience sentiment, and box office dynamics.',
  'Research the latest developments in AI semiconductor technology and track NVIDIA and AMD.',
  'Track solid-state battery chemistry, silicon anodes, and manufacturing yields.',
  'Explore climate change carbon capture technologies and industrial absorption papers.'
];

export const ResearchAssistantModal: React.FC<ResearchAssistantModalProps> = ({
  isOpen,
  onClose,
  onStartResearch,
  onOpenAdvancedForm
}) => {
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [structuredResult, setStructuredResult] = useState<StructuredResearchObjective | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyzePrompt = async (promptToUse?: string) => {
    const text = (promptToUse !== undefined ? promptToUse : userInput).trim();
    if (!text) return;

    if (promptToUse !== undefined) {
      setUserInput(promptToUse);
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await api.parseResearchPrompt(text);
      setStructuredResult(result);
    } catch (err: any) {
      console.error('Error parsing research task:', err);
      setError(err.message || 'Failed to process research prompt');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartMission = async () => {
    if (!structuredResult) return;
    setIsStarting(true);
    try {
      const payload: CreateMissionPayload = {
        name: structuredResult.name,
        topic: structuredResult.topic,
        description: structuredResult.description,
        companies: structuredResult.companies,
        competitors: structuredResult.competitors,
        keywords: structuredResult.keywords,
        researchInterests: structuredResult.researchInterests,
        preferredSources: structuredResult.preferredSources,
        objective: structuredResult.trackingObjective,
        frequencyMinutes: 30,
        status: 'active'
      };
      await onStartResearch(payload);
      onClose();
    } catch (err: any) {
      console.error('Error starting research:', err);
      setError(err.message || 'Failed to start research mission');
    } finally {
      setIsStarting(false);
    }
  };

  const handleReset = () => {
    setStructuredResult(null);
    setUserInput('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-2xl flex flex-col rounded shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#27272A] bg-[#161618] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#00FF9C] text-[#0A0A0B] font-black px-2 py-0.5 text-xs tracking-wider rounded-xs font-mono">
              HACKVERSE
            </div>
            <div className="h-4 w-[1px] bg-[#27272A]" />
            <div className="flex items-center gap-1.5 text-white font-bold text-sm">
              <Bot className="w-4 h-4 text-[#00FF9C]" />
              <span>AI Research Assistant</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#27272A] rounded text-[#A1A1AA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Assistant Greeting */}
          <div className="flex items-start gap-3 bg-[#18181B] border border-[#27272A] p-4 rounded">
            <div className="w-8 h-8 rounded bg-[#00FF9C]/10 border border-[#00FF9C]/30 flex items-center justify-center text-[#00FF9C] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight">
                What would you like me to research?
              </h2>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Describe any technology, company, competitor set, or research goal in plain English. The AI will extract key entities, query academic and patent databases, and autonomously track developments.
              </p>
            </div>
          </div>

          {/* 2. Prompt Input & Examples */}
          {!structuredResult && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-mono text-[#71717A] block">
                  Your Research Task
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="e.g., Research the latest developments in AI semiconductor technology and track NVIDIA, AMD and Google."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAnalyzePrompt();
                      }
                    }}
                    className="w-full bg-[#0A0A0B] border border-[#27272A] rounded p-3.5 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:border-[#00FF9C] focus:outline-none leading-relaxed font-mono resize-none"
                  />
                  <button
                    onClick={() => handleAnalyzePrompt()}
                    disabled={isAnalyzing || !userInput.trim()}
                    className={`absolute right-3 bottom-3 px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      isAnalyzing || !userInput.trim()
                        ? 'bg-[#27272A] text-[#71717A] cursor-not-allowed'
                        : 'bg-[#00FF9C] text-[#0A0A0B] hover:bg-[#00FF9C]/90 cursor-pointer shadow-[0_0_8px_rgba(0,255,156,0.3)]'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit</span>
                        <Send className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Example Prompts */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-mono text-[#71717A] block mb-2">
                  Example Research Prompts
                </label>
                <div className="space-y-1.5">
                  {EXAMPLE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnalyzePrompt(prompt)}
                      className="w-full text-left p-2.5 bg-[#161618] hover:bg-[#1C1C1F] border border-[#27272A] hover:border-[#00FF9C] rounded text-xs text-[#D4D4D8] hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="truncate pr-2 font-mono text-[11px]">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#00FF9C] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Structured Response View */}
          {structuredResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Natural Language Confirmation Box */}
              <div className="bg-[#141416] border border-[#00FF9C]/40 rounded p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00FF9C]" />
                    <span className="text-xs font-bold text-[#00FF9C] font-mono uppercase tracking-wider">
                      Research Objective Understood
                    </span>
                  </div>
                  {structuredResult.usedGemini && (
                    <span className="text-[9px] font-mono text-[#00FF9C] bg-[#00FF9C]/10 px-2 py-0.5 rounded border border-[#00FF9C]/30">
                      Gemini 3.7 Flash Grounded
                    </span>
                  )}
                </div>

                {/* Clean Structured Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block">Topic:</span>
                    <p className="font-semibold text-white mt-0.5">{structuredResult.topic}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block">Entities:</span>
                    {structuredResult.companies && structuredResult.companies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {structuredResult.companies.map((company, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[#1C1C1F] text-[#00FF9C] border border-[#00FF9C]/30 rounded text-xs font-mono font-medium"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#71717A] italic mt-0.5">None identified</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block">Competitors:</span>
                    {structuredResult.competitors && structuredResult.competitors.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {structuredResult.competitors.map((comp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[#1C1C1F] text-sky-300 border border-sky-500/30 rounded text-xs font-mono"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#71717A] italic mt-0.5">None identified</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block">Research Areas:</span>
                    <p className="text-[#D4D4D8] mt-0.5">
                      {structuredResult.researchAreas && structuredResult.researchAreas.length > 0
                        ? structuredResult.researchAreas.join(', ')
                        : 'General research'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block">Configured Sources:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(structuredResult.preferredSources || ['arxiv', 'patent', 'news', 'sec_filing', 'social_media', 'github']).map((src, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#18181B] text-[#E4E4E7] border border-[#27272A] rounded text-[11px] font-mono uppercase"
                        >
                          {src.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block">Tracking Objective:</span>
                    <p className="text-[#D4D4D8] mt-0.5">
                      {structuredResult.trackingObjective}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-mono text-[#A1A1AA] hover:text-white bg-[#18181B] border border-[#27272A] rounded hover:border-[#71717A] transition-colors"
                >
                  ← Ask Another Task
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onOpenAdvancedForm && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdvancedForm();
                      }}
                      className="px-3 py-2 text-xs font-mono text-[#D4D4D8] hover:text-white bg-[#18181B] border border-[#27272A] rounded hover:border-[#00FF9C] transition-colors flex items-center gap-1.5"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#00FF9C]" />
                      <span>Edit Parameters</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStartMission}
                    disabled={isStarting}
                    className={`flex-1 sm:flex-initial px-6 py-2.5 bg-[#00FF9C] text-[#0A0A0B] text-xs font-mono font-black rounded flex items-center justify-center gap-2 hover:bg-[#00FF9C]/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,156,0.35)] cursor-pointer ${
                      isStarting ? 'opacity-70 cursor-wait' : ''
                    }`}
                  >
                    {isStarting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>INITIALIZING RESEARCH...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-[#0A0A0B]" />
                        <span>START RESEARCH</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 font-mono">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
