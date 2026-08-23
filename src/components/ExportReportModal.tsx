import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportMarkdown: string;
  missionName: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  reportMarkdown,
  missionName
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${missionName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_briefing.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-2xl max-h-[85vh] flex flex-col rounded shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#27272A] bg-[#161618] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00FF9C]" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Executive Intelligence Briefing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#27272A] rounded text-[#A1A1AA] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Markdown Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#0A0A0B]">
          <pre className="text-xs font-mono text-[#00FF9C]/90 whitespace-pre-wrap leading-relaxed select-text bg-[#050505] p-4 border border-[#27272A] rounded">
            {reportMarkdown || 'Loading intelligence briefing...'}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272A] bg-[#161618] flex justify-between items-center">
          <div className="text-xs font-mono text-[#71717A]">
            Auto-synthesized by Autonomous Pipeline
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-xs font-mono text-white rounded flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00FF9C]" />
                  <span className="text-[#00FF9C]">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY MD</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-[#00FF9C] hover:brightness-110 text-[#0A0A0B] text-xs font-mono font-bold rounded flex items-center gap-1.5 transition-transform"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
