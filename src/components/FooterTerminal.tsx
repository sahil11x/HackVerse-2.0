import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Terminal, ChevronUp, ChevronDown, CheckCircle2, Sparkles, Activity } from 'lucide-react';
import { SystemLog } from '../types';

interface FooterTerminalProps {
  logs: SystemLog[];
  meanLatencyMs: number;
}

export const FooterTerminal: React.FC<FooterTerminalProps> = ({ logs, meanLatencyMs }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const getLogLevelClass = (level: SystemLog['level']) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-[#FF4F00] font-bold';
      case 'SUCCESS':
        return 'text-[#00FF9C]';
      case 'WARNING':
        return 'text-[#EAB308]';
      case 'SYSTEM':
        return 'text-white font-semibold';
      default:
        return 'text-[#00FF9C]/70';
    }
  };

  const latestLog = logs[logs.length - 1];

  return (
    <footer className="border-t border-[#27272A] bg-[#0E0E10] shrink-0 select-none transition-all duration-200">
      {/* Sleek Minimal Bar */}
      <div className="h-9 px-4 flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#00FF9C]">
            <span className="w-2 h-2 rounded-full bg-[#00FF9C] shadow-[0_0_6px_#00FF9C] animate-pulse" />
            <span className="font-semibold text-[11px]">AI Research Pipeline Active</span>
          </div>
          <span className="text-[#27272A] hidden sm:inline">|</span>
          <span className="hidden md:inline text-[#71717A] text-[11px]">
            Model: <strong className="text-[#E4E4E7]">Gemini 3.7 Flash</strong>
          </span>
          <span className="text-[#27272A] hidden md:inline">|</span>
          <span className="hidden lg:inline text-[#71717A] text-[11px]">
            Latency: <strong className="text-[#00FF9C]">{meanLatencyMs > 0 ? meanLatencyMs : '7.4'}ms</strong>
          </span>
        </div>

        {/* Latest Activity Snippet & Expand Button */}
        <div className="flex items-center gap-3">
          {latestLog && (
            <span className="hidden xl:inline text-[#71717A] text-[10px] truncate max-w-md">
              Latest: {latestLog.message}
            </span>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] text-[11px] text-[#E4E4E7] hover:border-[#00FF9C] hover:text-[#00FF9C] transition-colors"
            title="Toggle system verification logs & internal pipeline architecture"
          >
            <Terminal className="w-3 h-3 text-[#00FF9C]" />
            <span>{isExpanded ? 'Hide Logs' : `Logs (${logs.length})`}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronUp className="w-3 h-3 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Technical Inspection Drawer */}
      {isExpanded && (
        <div className="h-44 flex border-t border-[#27272A] bg-[#0A0A0B] overflow-hidden animate-in slide-in-from-bottom-2 duration-150">
          {/* Architecture Nodes */}
          <div className="w-64 p-3 border-r border-[#27272A] bg-[#0E0E10] flex flex-col justify-between shrink-0 hidden sm:flex">
            <div className="text-[10px] uppercase tracking-wider text-[#71717A] font-mono">
              Pipeline Sub-Nodes
            </div>
            <div className="grid grid-cols-2 gap-1.5 my-auto">
              <div className="bg-[#18181B] border border-[#27272A] p-1.5 text-[9px] text-center rounded">
                <span className="font-mono font-bold text-white block">Multi-Ingest</span>
                <span className="text-[8px] text-[#71717A]">ArXiv / Patent / SEC</span>
              </div>
              <div className="bg-[#18181B] border border-[#27272A] p-1.5 text-[9px] text-center rounded">
                <span className="font-mono font-bold text-white block">Vector Store</span>
                <span className="text-[8px] text-[#71717A]">Memory / Cache</span>
              </div>
              <div className="bg-[#00FF9C]/10 border border-[#00FF9C]/40 p-1.5 text-[9px] text-center rounded">
                <span className="font-mono font-bold text-[#00FF9C] block">Gemini 3.7</span>
                <span className="text-[8px] text-[#00FF9C]/80">Synthesis Engine</span>
              </div>
              <div className="bg-[#18181B] border border-[#27272A] p-1.5 text-[9px] text-center rounded">
                <span className="font-mono font-bold text-white block">Trend Correlator</span>
                <span className="text-[8px] text-[#71717A]">Velocity Analyzer</span>
              </div>
            </div>
            <div className="text-[9px] font-mono text-[#00FF9C] text-center">
              Autonomous Tracking Engine v1.2
            </div>
          </div>

          {/* Terminal Log Stream */}
          <div className="flex-1 p-3 bg-[#050505] font-mono text-[10px] leading-relaxed flex flex-col gap-1 overflow-y-auto select-text">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 hover:bg-[#121214] px-1 py-0.5 rounded">
                <span className="text-[#71717A] shrink-0">[{log.timestamp}]</span>
                <span className={`shrink-0 ${getLogLevelClass(log.level)}`}>
                  {log.level}:
                </span>
                <span className="text-[#E4E4E7]/90 break-all">{log.message}</span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      )}
    </footer>
  );
};
