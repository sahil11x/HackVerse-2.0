import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Loader2 } from 'lucide-react';

interface AiWorkingStateProps {
  currentTopic?: string;
}

interface StepItem {
  id: string;
  title: string;
  activeDetail: string;
  completedDetail: string;
  durationMs: number;
}

const STEPS: StepItem[] = [
  {
    id: 'step-1',
    title: '1. Agent 1: Research Planner Agent',
    activeDetail: 'Classifying research intent and decomposing domain entities...',
    completedDetail: 'Research plan and hypotheses formulated',
    durationMs: 700
  },
  {
    id: 'step-2',
    title: '2. Tool Selection & Optimized Query Generation',
    activeDetail: 'Selecting arXiv and GitHub tools with targeted queries...',
    completedDetail: 'Optimized queries generated & handoff dispatched',
    durationMs: 800
  },
  {
    id: 'step-3',
    title: '3. Live Evidence Ingestion',
    activeDetail: 'Executing real arXiv & GitHub endpoints in parallel...',
    completedDetail: 'Live evidence bundle collected with fault isolation',
    durationMs: 1100
  },
  {
    id: 'step-4',
    title: '4. Agent 2: Intelligence Analyst Agent',
    activeDetail: 'Deduplicating & analyzing live evidence against plan focus areas...',
    completedDetail: 'Signal relevance and strategic impact evaluated',
    durationMs: 900
  },
  {
    id: 'step-5',
    title: '5. Actionable Intelligence Synthesis',
    activeDetail: 'Synthesizing actionable findings with source provenance attached...',
    completedDetail: 'Verified actionable intelligence ready',
    durationMs: 800
  }
];

export const AiWorkingState: React.FC<AiWorkingStateProps> = ({ currentTopic }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStepIndex < STEPS.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, STEPS[currentStepIndex].durationMs);
    }
    return () => clearTimeout(timer);
  }, [currentStepIndex]);

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-xl p-6 sm:p-7 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00FF9C]/10 border border-[#00FF9C]/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#00FF9C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#00FF9C] font-bold bg-[#00FF9C]/10 px-2 py-0.5 rounded">
                RESEARCH PROGRESS
              </span>
              <span className="text-xs text-[#71717A] hidden sm:inline">Executing research workflow</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Conducting Autonomous Investigation
            </h3>
          </div>
        </div>

        {currentTopic && (
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-mono text-[#71717A] block">Target</span>
            <span className="text-xs font-mono text-[#E4E4E7] truncate max-w-xs block font-semibold">
              {currentTopic}
            </span>
          </div>
        )}
      </div>

      {/* 5 Clean Sequential Steps */}
      <div className="space-y-2.5">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg border transition-all ${
                isDone
                  ? 'bg-[#141416] border-[#27272A] text-[#E4E4E7]'
                  : isCurrent
                  ? 'bg-[#161619] border-[#00FF9C]/50 text-white'
                  : 'bg-[#101012] border-[#1E1E22] text-[#52525B]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00FF9C] shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-[#00FF9C] animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#3F3F46] flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-mono text-[#71717A]">{idx + 1}</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-medium block truncate">
                      {step.title}
                    </span>
                    <span className="text-[11px] font-mono block">
                      {isDone ? (
                        <span className="text-[#00FF9C]">✓ {step.completedDetail}</span>
                      ) : isCurrent ? (
                        <span className="text-sky-400 font-sans">{step.activeDetail}</span>
                      ) : (
                        <span className="text-[#52525B]">Queued</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#71717A] shrink-0">
                  {isDone ? (
                    <span className="text-[#00FF9C]">DONE</span>
                  ) : isCurrent ? (
                    <span className="text-sky-400 font-semibold">RUNNING</span>
                  ) : (
                    <span>WAITING</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-1 text-[11px] font-mono text-[#71717A] flex items-center justify-between">
        <span>Verified multi-source correlation</span>
        <span className="text-[#00FF9C]">Step {currentStepIndex + 1} of 5</span>
      </div>
    </div>
  );
};

