import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Building2, ShieldAlert, Key, BookOpen, Globe, Clock, Cpu } from 'lucide-react';
import { Mission, SourceType } from '../types';
import { CreateMissionPayload } from '../services/api';

interface MissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateMissionPayload, isEditing: boolean, missionId?: string) => Promise<void>;
  initialMission?: Mission | null;
}

const PRESETS: Array<{
  label: string;
  name: string;
  topic: string;
  description: string;
  companies: string[];
  competitors: string[];
  keywords: string[];
  researchInterests: string[];
  preferredSources: SourceType[];
}> = [
  {
    label: 'AI Semiconductor (Standard)',
    name: 'AI Semiconductor Intelligence',
    topic: 'AI accelerator technology',
    description: 'Track cutting-edge AI accelerator hardware, CoWoS substrate packaging yields, and custom silicon architectures across hyperscalers.',
    companies: ['NVIDIA', 'AMD', 'Google'],
    competitors: ['Intel', 'Tenstorrent', 'Cerebras', 'Groq'],
    keywords: ['GPU', 'AI accelerator', 'inference', 'HBM', 'chiplet', 'CoWoS', 'Optical Interconnect'],
    researchInterests: ['Thermal microfluidics', 'CoWoS-L substrate yields', 'HBM4 bandwidth', 'ROCm vs Triton parity'],
    preferredSources: ['arxiv', 'patent', 'news', 'sec_filing', 'github']
  },
  {
    label: 'Quantum Computing',
    name: 'Quantum Hardware Breakthroughs',
    topic: 'Fault-tolerant quantum computing & topological qubits',
    description: 'Track superconducting qubits, neutral atoms, topological error correction across leading quantum labs and research institutions.',
    companies: ['IBM Quantum', 'Google Quantum AI'],
    competitors: ['QuEra Computing', 'IonQ', 'Quantinuum', 'PsiQuantum'],
    keywords: ['Superconducting qubit', 'Surface codes', 'Neutral atoms', 'Cryogenic CMOS', 'Transversal gates'],
    researchInterests: ['Logical qubit thresholds', 'Cryo-CMOS ASIC controllers', 'Topological braiding'],
    preferredSources: ['arxiv', 'patent', 'news', 'web']
  },
  {
    label: 'Autonomous Robotics',
    name: 'Humanoid Robotics & Actuators',
    topic: 'Embodied AI & high-torque humanoid actuation',
    description: 'Monitor high-torque density actuators, end-to-end vision-language-action models, and mass production supply chains.',
    companies: ['Tesla Optimus', 'Figure AI', 'Boston Dynamics'],
    competitors: ['Unitree', 'Agility Robotics', 'Sanctuary AI', '1X Technologies'],
    keywords: ['Humanoid robot', 'Harmonic drive', 'VLA model', 'Tactile sensing', 'Cycloidal gearbox'],
    researchInterests: ['Zero-backlash gearboxes', 'Torque-to-weight ratios', 'Sim-to-real transfer'],
    preferredSources: ['arxiv', 'patent', 'news', 'github']
  }
];

const SOURCE_OPTIONS: Array<{ id: SourceType; label: string; desc: string }> = [
  { id: 'arxiv', label: 'ArXiv Papers', desc: 'Academic preprints & peer-reviewed research' },
  { id: 'patent', label: 'USPTO & Patents', desc: 'Global patent filings, claims, and disclosures' },
  { id: 'news', label: 'Tech & Trade News', desc: 'Reuters, Bloomberg, SemiAnalysis, TechCrunch' },
  { id: 'sec_filing', label: 'SEC Filings', desc: '10-K, 10-Q, and 8-K regulatory disclosures' },
  { id: 'social_media', label: 'Social Media', desc: 'Technical community discussions, X/Twitter, developer feeds' },
  { id: 'github', label: 'GitHub & Benchmarks', desc: 'Open-weights, kernels, and benchmark repos' }
];

export const MissionFormModal: React.FC<MissionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMission
}) => {
  const isEditing = Boolean(initialMission);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [companiesInput, setCompaniesInput] = useState('');
  const [competitorsInput, setCompetitorsInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [researchInterestsInput, setResearchInterestsInput] = useState('');
  const [preferredSources, setPreferredSources] = useState<SourceType[]>([
    'arxiv',
    'patent',
    'news',
    'sec_filing',
    'github'
  ]);
  const [frequencyMinutes, setFrequencyMinutes] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setTopic(preset.topic);
    setDescription(preset.description);
    setCompaniesInput(preset.companies.join(', '));
    setCompetitorsInput(preset.competitors.join(', '));
    setKeywordsInput(preset.keywords.join(', '));
    setResearchInterestsInput(preset.researchInterests.join(', '));
    setPreferredSources(preset.preferredSources);
  };

  const parseList = (str: string): string[] =>
    str
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const toggleSource = (src: SourceType) => {
    setPreferredSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  useEffect(() => {
    if (initialMission) {
      setName(initialMission.name || '');
      setTopic(initialMission.topic || initialMission.objective || '');
      setDescription(initialMission.description || initialMission.objective || '');
      setCompaniesInput((initialMission.companies || []).join(', '));
      setCompetitorsInput((initialMission.competitors || []).join(', '));
      setKeywordsInput((initialMission.keywords || []).join(', '));
      setResearchInterestsInput((initialMission.researchInterests || []).join(', '));
      setPreferredSources(initialMission.preferredSources || ['arxiv', 'patent', 'news', 'sec_filing', 'github']);
      setFrequencyMinutes(initialMission.frequencyMinutes || 30);
    } else {
      // Default to standard semiconductor tracking template
      loadPreset(PRESETS[0]);
    }
    setError(null);
  }, [initialMission, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a Mission Name.');
      return;
    }
    if (!topic.trim()) {
      setError('Please provide a Main Topic.');
      return;
    }

    const companies = parseList(companiesInput);
    const competitors = parseList(competitorsInput);
    const keywords = parseList(keywordsInput);
    const researchInterests = parseList(researchInterestsInput);

    if (preferredSources.length === 0) {
      setError('Please select at least one preferred source category.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: CreateMissionPayload = {
        name: name.trim(),
        topic: topic.trim(),
        description: description.trim() || topic.trim(),
        companies,
        competitors,
        keywords,
        researchInterests,
        preferredSources,
        frequencyMinutes
      };

      await onSave(payload, isEditing, initialMission?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save mission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        id="mission-form-modal"
        className="bg-[#121214] border border-[#27272A] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#E4E4E7]"
      >
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#27272A] flex items-center justify-between bg-[#161618]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#00FF9C]/10 text-[#00FF9C] border border-[#00FF9C]/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                {isEditing ? 'EDIT TRACKING MISSION' : 'CREATE TRACKING MISSION'}
              </h2>
              <p className="text-[11px] text-[#A1A1AA]">
                {isEditing
                  ? 'Modify parameters, target entities, and automated ingestion vectors'
                  : 'Define tracking objectives, entities, and multi-source research vectors'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-white rounded hover:bg-[#27272A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Quick Presets (Only when creating) */}
          {!isEditing && (
            <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-md">
              <div className="text-[10px] uppercase tracking-wider text-[#71717A] font-mono mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#00FF9C]" />
                <span>Quick-Load Mission Templates</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadPreset(p)}
                    className="px-2.5 py-1 bg-[#222226] hover:bg-[#2A2A2E] text-[#E4E4E7] border border-[#333338] hover:border-[#00FF9C] rounded text-[11px] font-mono transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Mission Name & 2. Main Topic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1">
                1. Mission Name <span className="text-[#00FF9C]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Semiconductor Intelligence"
                className="w-full bg-[#1C1C1F] border border-[#27272A] rounded px-3 py-2 text-white focus:border-[#00FF9C] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1">
                2. Main Topic <span className="text-[#00FF9C]">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. AI accelerator technology"
                className="w-full bg-[#1C1C1F] border border-[#27272A] rounded px-3 py-2 text-white focus:border-[#00FF9C] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 3. Description */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1">
              3. Objective / Detailed Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe the specific technical breakthroughs, market developments, or competitor activities to monitor..."
              className="w-full bg-[#1C1C1F] border border-[#27272A] rounded px-3 py-2 text-white focus:border-[#00FF9C] focus:outline-none resize-none"
            />
          </div>

          {/* 4. Companies & 5. Competitors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#00FF9C]" />
                  4. Monitored Companies
                </span>
                <span className="text-[9px] text-[#71717A]">Comma-separated</span>
              </label>
              <input
                type="text"
                value={companiesInput}
                onChange={(e) => setCompaniesInput(e.target.value)}
                placeholder="e.g. NVIDIA, AMD, Google"
                className="w-full bg-[#1C1C1F] border border-[#27272A] rounded px-3 py-2 text-white focus:border-[#00FF9C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-[#38BDF8]" />
                  5. Key Competitors
                </span>
                <span className="text-[9px] text-[#71717A]">Comma-separated</span>
              </label>
              <input
                type="text"
                value={competitorsInput}
                onChange={(e) => setCompetitorsInput(e.target.value)}
                placeholder="e.g. Intel, Tenstorrent, Cerebras, Groq"
                className="w-full bg-[#1C1C1F] border border-[#27272A] rounded px-3 py-2 text-white focus:border-[#00FF9C] focus:outline-none"
              />
            </div>
          </div>

          {/* 6. Keywords & 7. Research Interests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" />
                  6. Target Keywords
                </span>
                <span className="text-[9px] text-[#71717A]">Comma-separated</span>
              </label>
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="e.g. GPU, AI accelerator, inference, HBM, chiplet"
                className="w-full bg-[#1C1C1F] border border-[#27272A] rounded px-3 py-2 text-white focus:border-[#00FF9C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-purple-400" />
                  7. Research Interests
                </span>
                <span className="text-[9px] text-[#71717A]">Comma-separated</span>
              </label>
              <input
                type="text"
                value={researchInterestsInput}
                onChange={(e) => setResearchInterestsInput(e.target.value)}
                placeholder="e.g. CoWoS packaging yields, optical interconnects, memory wall"
                className="w-full bg-[#1C1C1F] border border-[#27272A] rounded px-3 py-2 text-white focus:border-[#00FF9C] focus:outline-none"
              />
            </div>
          </div>

          {/* 8. Preferred Source Categories */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-[#A1A1AA] mb-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#00FF9C]" />
              8. Preferred Source Categories ({preferredSources.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOURCE_OPTIONS.map((s) => {
                const active = preferredSources.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleSource(s.id)}
                    className={`p-2.5 text-left rounded border transition-all flex flex-col justify-between ${
                      active
                        ? 'bg-[#00FF9C]/10 border-[#00FF9C] text-white shadow-[inset_0_0_8px_rgba(0,255,156,0.15)]'
                        : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:border-[#3F3F46]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] font-semibold">
                      <span className={active ? 'text-[#00FF9C]' : 'text-[#A1A1AA]'}>{s.label}</span>
                      {active && <Check className="w-3 h-3 text-[#00FF9C]" />}
                    </div>
                    <span className="text-[9px] text-[#71717A] mt-1 leading-tight">{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency */}
          <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00FF9C]" />
              <div>
                <div className="font-mono text-xs text-white">Autonomous Ingestion Interval</div>
                <div className="text-[10px] text-[#71717A]">
                  Frequency of automated background crawler and correlation passes
                </div>
              </div>
            </div>
            <select
              value={frequencyMinutes}
              onChange={(e) => setFrequencyMinutes(Number(e.target.value))}
              className="bg-[#222226] border border-[#333338] rounded px-3 py-1 text-xs text-white font-mono focus:border-[#00FF9C] focus:outline-none cursor-pointer"
            >
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every 1 hour</option>
              <option value={120}>Every 2 hours</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 px-5 border-t border-[#27272A] bg-[#161618] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 bg-[#00FF9C] text-[#0A0A0B] font-mono font-bold text-xs rounded hover:bg-[#00FF9C]/90 shadow-[0_0_12px_rgba(0,255,156,0.3)] transition-all ${
              isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? isEditing
                  ? 'SAVING CHANGES...'
                  : 'EXPANDING QUERIES & STARTING...'
                : isEditing
                ? 'SAVE MISSION CHANGES'
                : 'ACTIVATE TRACKING MISSION'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
