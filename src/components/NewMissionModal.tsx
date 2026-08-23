import React, { useState } from 'react';
import { X, Sparkles, Target, Zap, Bot, ArrowRight } from 'lucide-react';

interface NewMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMission: (objective: string, frequencyMinutes: number) => Promise<void>;
}

const PRESET_MISSIONS = [
  {
    title: 'Quantum Error Correction',
    objective: 'Monitor superconducting qubits, surface codes, and topological error correction across IBM, Google Quantum AI, and QuEra.',
    freq: 60
  },
  {
    title: 'AI Semiconductor & Accelerators',
    objective: 'Track AI semiconductor technology and monitor NVIDIA, AMD and Google TPU architectures.',
    freq: 30
  },
  {
    title: 'Solid-State Battery Chemistry',
    objective: 'Track solid-state electrolyte patents, silicon anode developments, and manufacturing yields for QuantumScape, CATL, and Toyota.',
    freq: 45
  },
  {
    title: 'Climate Tech & Carbon Capture',
    objective: 'Investigate direct air capture sorbents, geological sequestration, and industrial carbon capture scaling papers.',
    freq: 60
  }
];

export const NewMissionModal: React.FC<NewMissionModalProps> = ({
  isOpen,
  onClose,
  onCreateMission
}) => {
  const [objective, setObjective] = useState('');
  const [frequency, setFrequency] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateMission(objective.trim(), frequency);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-xl flex flex-col rounded shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#27272A] bg-[#161618] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#00FF9C] text-[#0A0A0B] font-black px-1.5 py-0.5 text-[10px] tracking-tighter">
              AGENT
            </div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Create Tracking Mission
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#27272A] rounded text-[#A1A1AA] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#71717A] block mb-2">
              Quick Demonstration Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_MISSIONS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setObjective(preset.objective);
                    setFrequency(preset.freq);
                  }}
                  className="text-left p-2.5 bg-[#161618] hover:bg-[#1C1C1F] border border-[#27272A] hover:border-[#00FF9C] rounded transition-all group"
                >
                  <div className="text-xs font-semibold text-[#E4E4E7] group-hover:text-[#00FF9C] flex items-center justify-between">
                    <span>{preset.title}</span>
                    <Zap className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                  </div>
                  <div className="text-[10px] text-[#71717A] truncate mt-0.5">
                    {preset.objective}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tracking Objective Input */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#71717A] block mb-1.5">
              Tracking Objective (Natural Language)
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g., Track AI semiconductor technology and monitor NVIDIA, AMD and Google TPU architectures."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#27272A] rounded p-3 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:border-[#00FF9C] focus:outline-none leading-relaxed font-mono"
            />
            <p className="text-[10px] text-[#71717A] mt-1 font-mono">
              The AI Planner will automatically expand this into ArXiv queries, patent classifications, and trade news vectors.
            </p>
          </div>

          {/* Autonomous Monitoring Interval */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-mono text-[#71717A] block mb-1.5">
              Autonomous Ingestion Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Every 15 mins', val: 15 },
                { label: 'Every 30 mins', val: 30 },
                { label: 'Every 60 mins', val: 60 }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setFrequency(opt.val)}
                  className={`py-2 px-3 text-xs font-mono rounded border transition-all ${
                    frequency === opt.val
                      ? 'bg-[#1C1C1F] border-[#00FF9C] text-[#00FF9C] font-bold'
                      : 'bg-[#161618] border-[#27272A] text-[#A1A1AA] hover:border-[#71717A]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#27272A] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1C1C1F] hover:bg-[#27272A] border border-[#27272A] text-xs font-mono text-[#A1A1AA] rounded"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !objective.trim()}
              className="px-5 py-2 bg-[#00FF9C] hover:brightness-110 text-[#0A0A0B] text-xs font-mono font-bold rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(0,255,156,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>EXPANDING OBJECTIVE...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  <span>INITIALIZE TRACKER</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
