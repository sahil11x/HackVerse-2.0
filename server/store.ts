import {
  IntelAlert,
  IntelItem,
  Mission,
  SystemLog,
  TrendSignal,
  ResearchContext,
  ResearchStep,
  SummarizedFinding,
  RejectedFinding,
  ToolName,
  EvaluationReport,
  Trace,
  ControlledFailureBenchmark
} from '../src/types';

// In-memory data store for research missions and intelligence items
class IntelStore {
  private missions: Map<string, Mission> = new Map();
  private intelItems: Map<string, IntelItem[]> = new Map();
  private trends: Map<string, TrendSignal[]> = new Map();
  private alerts: Map<string, IntelAlert[]> = new Map();
  private logs: SystemLog[] = [];
  private contexts: Map<string, ResearchContext> = new Map();
  private evaluationReports: EvaluationReport[] = [];
  private traces: Map<string, Trace> = new Map();
  private latestBenchmark: ControlledFailureBenchmark | null = null;
  private activeMissionId: string | null = null;

  constructor() {
    this.seedSampleData();
  }

  private seedSampleData() {
    // Mission 1: AI Semiconductor Technology (NVIDIA, AMD, Google)
    const m1: Mission = {
      id: 'mission-semicon-01',
      name: 'AI Semiconductor Intelligence',
      code: 'AI_SEMICON_01',
      topic: 'AI accelerator technology',
      description: 'Track AI semiconductor advancements, CoWoS packaging yields, and custom silicon architectures across hyperscalers.',
      companies: ['NVIDIA', 'AMD', 'Google'],
      competitors: ['Intel', 'Tenstorrent', 'Cerebras', 'Groq'],
      keywords: ['GPU', 'AI accelerator', 'inference', 'HBM', 'chiplet', 'CoWoS', 'Optical Interconnect'],
      researchInterests: ['Thermal management & microfluidics', 'CoWoS-L substrate yields', 'Memory wall & HBM4 bandwidth', 'Triton & ROCm kernel parity'],
      preferredSources: ['arxiv', 'patent', 'news', 'sec_filing', 'github'],
      objective: 'Track AI semiconductor technology and monitor NVIDIA, AMD, Google, TSMC and custom silicon architectures.',
      targetEntities: [
        { name: 'NVIDIA Corp.', ticker: 'NVDA', role: 'GPU & Interconnect Market Leader', type: 'company' },
        { name: 'AMD', ticker: 'AMD', role: 'MI300/MI350 Accelerators & ROCm', type: 'company' },
        { name: 'Google / Alphabet', ticker: 'GOOG', role: 'TPU v5p/v6 & Custom AI Silicon', type: 'company' },
        { name: 'TSMC', ticker: 'TSM', role: 'Advanced Foundry 3nm/2nm/CoWoS', type: 'partner' },
        { name: 'Tenstorrent', role: 'RISC-V Chiplet Architecture', type: 'competitor' },
        { name: 'Cerebras', role: 'Wafer-Scale AI Engine', type: 'competitor' }
      ],
      searchVectors: ['ArXiv Labs', 'USPTO Patents', 'Reuters Tech', 'GitHub Trends', 'SEC Filings', 'SemiAnalysis'],
      focusAreas: ['Blackwell Architecture', 'ROCm Open Software', 'HBM3e/HBM4 Stacks', 'Liquid Cooling', 'TPU Optical Circuit Switches', 'CoWoS-L Packaging'],
      frequencyMinutes: 30,
      status: 'active',
      createdAt: '2026-08-20T10:00:00Z',
      lastRunAt: new Date().toISOString(),
      totalSignalsScanned: 1204,
      filteredInsightsCount: 14,
      meanLatencyMs: 7.4,
      sourcesUsedSummary: [
        { source: 'arxiv', label: 'ArXiv', status: 'used', count: 1 },
        { source: 'patent', label: 'Patents', status: 'used', count: 1 },
        { source: 'news', label: 'Tech News', status: 'used', count: 1 },
        { source: 'sec_filing', label: 'SEC Filings', status: 'used', count: 1 },
        { source: 'social_media', label: 'Social Media', status: 'not_used', count: 0 },
        { source: 'github', label: 'GitHub', status: 'used', count: 1 }
      ]
    };

    // Mission 2: Quantum Computing & Topological Qubits
    const m2: Mission = {
      id: 'mission-quantum-02',
      name: 'Quantum Hardware Breakthroughs',
      code: 'QUANTUM_ARCH_02',
      topic: 'Fault-tolerant quantum computing & topological qubits',
      description: 'Monitor superconducting qubits, neutral atoms, topological error correction across IBM, Google Quantum AI, and QuEra.',
      companies: ['IBM Quantum', 'Google Quantum AI'],
      competitors: ['QuEra Computing', 'IonQ', 'Quantinuum', 'PsiQuantum'],
      keywords: ['Superconducting qubit', 'Surface codes', 'Neutral atoms', 'Cryogenic CMOS', 'Transversal gates'],
      researchInterests: ['Logical qubit thresholds', 'Cryo-CMOS ASIC controllers', 'Topological braiding', 'Quantum interconnects'],
      preferredSources: ['arxiv', 'patent', 'news', 'web'],
      objective: 'Monitor superconducting qubits, neutral atoms, topological error correction across IBM, Google Quantum AI, and QuEra.',
      targetEntities: [
        { name: 'IBM Quantum', ticker: 'IBM', role: 'Condor / Heron Processors', type: 'company' },
        { name: 'Google Quantum AI', ticker: 'GOOG', role: 'Willow Chip & Surface Codes', type: 'company' },
        { name: 'QuEra Computing', role: 'Neutral Atom Arrays', type: 'competitor' },
        { name: 'Quantinuum', role: 'Trapped-Ion Quantum Architecture', type: 'competitor' }
      ],
      searchVectors: ['ArXiv quant-ph', 'Nature Physics', 'USPTO Quantum', 'IEEE Quantum'],
      focusAreas: ['Surface Code Thresholds', 'Cryogenic Control ASIC', 'Logical Qubits', 'Fault Tolerant Algorithms'],
      frequencyMinutes: 60,
      status: 'active',
      createdAt: '2026-08-21T02:00:00Z',
      lastRunAt: new Date().toISOString(),
      totalSignalsScanned: 680,
      filteredInsightsCount: 8,
      meanLatencyMs: 8.1,
      sourcesUsedSummary: [
        { source: 'arxiv', label: 'ArXiv', status: 'used', count: 0 },
        { source: 'patent', label: 'Patents', status: 'not_used', count: 0 },
        { source: 'news', label: 'Tech News', status: 'used', count: 0 },
        { source: 'sec_filing', label: 'SEC Filings', status: 'not_required', count: 0 },
        { source: 'social_media', label: 'Social Media', status: 'not_used', count: 0 },
        { source: 'github', label: 'GitHub', status: 'not_required', count: 0 }
      ]
    };

    this.missions.set(m1.id, m1);
    this.missions.set(m2.id, m2);

    // Seed Intel Items for Mission 1
    const itemsM1: IntelItem[] = [
      {
        id: 'item-101',
        missionId: 'mission-semicon-01',
        title: 'NVIDIA B200 Blackwell Yield Analysis - TSMC 4NP Substrate Shift',
        source: 'news',
        sourceLabel: 'Reuters Tech + SemiAnalysis',
        sourceUrl: 'https://www.reuters.com/technology/nvidia-blackwell-packaging-advances-2026',
        publishedAt: '2026-08-21T18:42:00Z',
        rawContent: 'Supply chain inspections in Hsinchu indicate TSMC has finalized packaging revisions on the CoWoS-L bridge for NVIDIA B200 GPUs. Warpage issues resolved with redesigned top substrate metal layers, boosting overall wafer yield by 14.8%.',
        fingerprint: 'fp_nvda_b200_tsmc_yield_2026',
        relevanceScore: 98,
        impactScore: 94,
        strategicPriority: 'CRITICAL',
        category: 'hardware',
        summary: 'Cross-source correlation detected resolved packaging bottlenecks in TSMC CoWoS-L lines for NVIDIA Blackwell B200. Projected compute shipment volume upgraded by 15% for enterprise clusters with thermal management revisions confirmed at USPTO.',
        keyImplications: [
          'Resolves Q3 hyperscaler supply bottlenecks for DGX SuperPOD deployments',
          'Accelerates 72-GPU liquid-cooled rack availability across AWS, GCP, and Azure',
          'Patent #88219 reveals dual-phase cold plate integration direct on silicon interposer'
        ],
        mentionedEntities: ['NVIDIA Corp.', 'TSMC'],
        relatedItemIds: ['item-102', 'item-104'],
        evidenceSnippet: 'Supply chain confirmation from TSMC Fab 18 packaging lines showing yield crossing 88% on revised 4NP reticle masks.',
        confidence: 0.96,
        whatChanged: 'TSMC resolved packaging bottlenecks on the CoWoS-L bridge for NVIDIA B200 GPUs, boosting wafer yield by 14.8%.',
        whyItMatters: 'Unlocks Q3 hyperscaler shipments for DGX SuperPODs and expands liquid-cooled rack compute availability.',
        impact: 'Critical',
        recommendedAction: 'Adjust quarterly GPU capacity forecast and audit liquid cooling facility readiness within 2 weeks.',
        timeHorizon: 'Within 2 weeks',
        evidenceCount: 2,
        sourceTypes: ['news', 'patent'],
        evidenceLinks: [
          {
            source: 'news',
            sourceLabel: 'Reuters Tech + SemiAnalysis',
            title: 'NVIDIA B200 Blackwell Yield Analysis - TSMC 4NP Substrate Shift',
            url: 'https://www.reuters.com/technology/nvidia-blackwell-packaging-advances-2026',
            date: '2026-08-21',
            excerpt: 'Supply chain confirmation from TSMC Fab 18 packaging lines showing yield crossing 88% on revised 4NP reticle masks.',
            supportingReason: 'Direct supply-chain telemetry from packaging facilities confirming yield resolution.',
            evidenceType: 'secondary'
          },
          {
            source: 'patent',
            sourceLabel: 'USPTO Patent #11,948,203',
            title: 'Microfluidic Embedded Cooling for 3D Chiplets',
            url: 'https://patents.google.com/patent/US202601948203A1/en',
            date: '2026-08-20',
            excerpt: 'Direct silicon etching of cooling channels between compute die and HBM stacks.',
            supportingReason: 'Official patent specification establishing structural thermal substrate revisions.',
            evidenceType: 'primary'
          }
        ]
      },
      {
        id: 'item-102',
        missionId: 'mission-semicon-01',
        title: 'AMD MI350 Series Software Stack Expansion & ROCm 6.4 Kernel Benchmarks',
        source: 'github',
        sourceLabel: 'GitHub ROCm + TechCrunch',
        sourceUrl: 'https://github.com/ROCm/ROCm/releases/tag/v6.4.0',
        publishedAt: '2026-08-21T15:10:00Z',
        rawContent: 'ROCm 6.4 introduces native FlashAttention-3 kernels, optimized FP8 matrix multiply primitives, and unified memory abstractions matching CUDA 12.8 throughput on MI300X and next-gen MI350 silicon.',
        fingerprint: 'fp_amd_rocm_64_flashattention',
        relevanceScore: 88,
        impactScore: 82,
        strategicPriority: 'STRATEGIC',
        category: 'software',
        summary: 'New ROCm release brings zero-code PyTorch compatibility for FlashAttention-3 optimizations previously exclusive to CUDA kernels. Deep analysis demonstrates a 1.28x speedup in open-weights LLM inference.',
        keyImplications: [
          'Significantly lowers developer friction migrating workloads away from proprietary CUDA libraries',
          'Direct benchmark parity demonstrated on Llama-3.3 70B and DeepSeek-V3 tokens/sec/dollar',
          'Major cloud providers testing drop-in MI350 container images'
        ],
        mentionedEntities: ['AMD', 'NVIDIA Corp.'],
        relatedItemIds: ['item-101'],
        evidenceSnippet: 'Open-source commit logs verify unified FlashAttention-3 GEMM kernels written in Triton with native CDNA3/CDNA4 assembly emission.',
        confidence: 0.92,
        whatChanged: 'ROCm 6.4 released with native FlashAttention-3 and FP8 GEMM kernels matching CUDA 12.8 throughput on MI300X/MI350.',
        whyItMatters: 'Reduces switching costs for open-weights transformer inference by 1.28x tokens-per-dollar.',
        impact: 'High',
        recommendedAction: 'Benchmark Llama-3.3 on MI300X/MI350 test instances against H100 cost baselines.',
        timeHorizon: 'Within 2 weeks',
        evidenceCount: 1,
        sourceTypes: ['github', 'news'],
        evidenceLinks: [
          {
            source: 'github',
            sourceLabel: 'GitHub ROCm Releases',
            title: 'ROCm 6.4 Release Tag & Triton Kernels',
            url: 'https://github.com/ROCm/ROCm/releases/tag/v6.4.0',
            date: '2026-08-21',
            excerpt: 'Commit logs verify unified FlashAttention-3 GEMM kernels written in Triton with native CDNA assembly.',
            supportingReason: 'Open-source commit repository verifying direct FlashAttention-3 implementation.',
            evidenceType: 'primary'
          }
        ]
      },
      {
        id: 'item-103',
        missionId: 'mission-semicon-01',
        title: 'Google TPU v6 Optical Interconnect & Reconfigurable Switched Fabrics',
        source: 'arxiv',
        sourceLabel: 'ArXiv cs.AR #2608.09421',
        sourceUrl: 'https://arxiv.org/abs/2408.09421',
        publishedAt: '2026-08-21T12:05:00Z',
        rawContent: 'We present the next evolution of Optical Circuit Switching (OCS) deployed across 16,384 custom Google TPU accelerators, delivering dynamic topology reconfiguration in under 12ms and eliminating electrical spine switches.',
        fingerprint: 'fp_goog_tpu_v6_ocs_2026',
        relevanceScore: 91,
        impactScore: 86,
        strategicPriority: 'STRATEGIC',
        category: 'architecture',
        summary: 'Google Research details its 16K-node TPU v6 pod interconnect utilizing MEMS-based Optical Circuit Switches. Provides dynamic mesh-to-torus topology reconfiguration with 40% power reduction vs InfiniBand spine networks.',
        keyImplications: [
          'Enables Google Cloud to train trillion-parameter models with near-zero inter-rack latency jitter',
          'Optical switching bypasses copper reach limits in multi-megawatt datacenter halls',
          'Signals custom silicon independence from proprietary InfiniBand / Ultra Ethernet switches'
        ],
        mentionedEntities: ['Google / Alphabet'],
        relatedItemIds: ['item-104'],
        evidenceSnippet: 'Peer-reviewed hardware telemetry measured 98.4% bisection bandwidth utilization during 405B parameter model training runs.',
        confidence: 0.95,
        whatChanged: 'Google deployed Optical Circuit Switching across 16,384 TPU v6 pods with dynamic sub-12ms topology reconfiguration.',
        whyItMatters: 'Reduces cluster switching power by 40% and bypasses electrical copper reach limits for ultra-large model training.',
        impact: 'High',
        recommendedAction: 'Evaluate optical fabric architectures for next-generation AI datacenter cluster networking.',
        timeHorizon: 'This quarter',
        evidenceCount: 1,
        sourceTypes: ['arxiv'],
        evidenceLinks: [
          {
            source: 'arxiv',
            sourceLabel: 'ArXiv Preprint cs.AR #2608.09421',
            title: 'Optical Circuit Switching for 16K Accelerator Fabrics',
            url: 'https://arxiv.org/abs/2408.09421',
            date: '2026-08-21',
            excerpt: 'Peer-reviewed telemetry showing 98.4% bisection bandwidth during 405B model training.',
            supportingReason: 'Peer-reviewed empirical benchmark data from 16K-node production clusters.',
            evidenceType: 'research'
          }
        ]
      },
      {
        id: 'item-104',
        missionId: 'mission-semicon-01',
        title: 'USPTO Patent #11,948,203: Microfluidic Embedded Cooling for 3D Chiplets',
        source: 'patent',
        sourceLabel: 'USPTO Patent Database',
        sourceUrl: 'https://patents.google.com/patent/US202601948203A1/en',
        publishedAt: '2026-08-20T21:15:00Z',
        rawContent: 'Assigned to NVIDIA Corporation: Direct silicon etching of microscopic helical cooling channels between compute die and 8-high HBM3e stacks to extract up to 1,800 Watts per socket without thermal throttling.',
        fingerprint: 'fp_patent_nvda_microfluidic_2026',
        relevanceScore: 84,
        impactScore: 79,
        strategicPriority: 'TREND',
        category: 'patent',
        summary: 'Patent disclosure outlines in-silicon microfluidic cooling channels targeting 1.8kW+ power envelopes for next-gen Rubin architecture chips, preventing thermal hotspots at the HBM interposer junction.',
        keyImplications: [
          'Validates industry transition from air cooling to direct-to-chip closed loop dielectric cooling',
          'Enables higher clock boosts without degrading HBM memory thermal limits (capped at 85°C)',
          'Requires datacenter facility retrofits with CDUs (Coolant Distribution Units)'
        ],
        mentionedEntities: ['NVIDIA Corp.'],
        relatedItemIds: ['item-101', 'item-103'],
        evidenceSnippet: 'Cross-sectional SEM micrographs and thermodynamic simulation curves show 38% reduction in junction-to-fluid thermal resistance.',
        confidence: 0.89,
        whatChanged: 'NVIDIA patented in-silicon etched helical cooling channels for 1.8kW+ sockets on 3D stacked dies.',
        whyItMatters: 'Overcomes HBM thermal limits (85°C ceiling) allowing continuous peak clock boost in high-density racks.',
        impact: 'Medium',
        recommendedAction: 'Audit facility CDU cooling capacities and verify compliance with direct-to-chip liquid loops.',
        timeHorizon: 'This quarter',
        evidenceCount: 1,
        sourceTypes: ['patent'],
        evidenceLinks: [
          {
            source: 'patent',
            sourceLabel: 'USPTO Patent #11,948,203',
            title: 'Microfluidic Embedded Cooling for 3D Chiplets',
            url: 'https://patents.google.com/patent/US202601948203A1/en',
            date: '2026-08-20',
            excerpt: 'Cross-sectional micrographs showing 38% reduction in junction-to-fluid thermal resistance.',
            supportingReason: 'Official USPTO patent publication with certified thermal diagrams.',
            evidenceType: 'primary'
          }
        ]
      },
      {
        id: 'item-105',
        missionId: 'mission-semicon-01',
        title: 'SEC Form 8-K: Strategic HBM4 Supply Agreement with SK Hynix',
        source: 'sec_filing',
        sourceLabel: 'SEC EDGAR Database',
        sourceUrl: 'https://www.sec.gov/edgar/searchedgar/companysearch',
        publishedAt: '2026-08-20T16:00:00Z',
        rawContent: 'Material definitive agreement securing priority allocation of 16-high HBM4 memory stacks fabricated on advanced 1b-nm nodes with customized logic base dies from TSMC.',
        fingerprint: 'fp_sec_hbm4_skhynix_allocation',
        relevanceScore: 78,
        impactScore: 74,
        strategicPriority: 'HIGH',
        category: 'business',
        summary: 'Multi-billion dollar advance purchase obligation locks in 65% of global 16-high HBM4 memory output for 2026-2027, creating severe capacity constraints for competing accelerator vendors.',
        keyImplications: [
          'High memory barrier to entry for second-tier AI ASIC startups unable to secure base-die capacity',
          'Solidifies 2TB/s+ per-socket memory bandwidth targets for 2027 enterprise roadmaps'
        ],
        mentionedEntities: ['NVIDIA Corp.', 'TSMC'],
        relatedItemIds: ['item-101'],
        evidenceSnippet: 'Item 1.01 Entry into a Material Definitive Agreement filing signed by CFO with delivery schedules starting Q1 2027.',
        confidence: 0.94,
        whatChanged: 'NVIDIA locked in 65% of SK Hynix 16-high HBM4 memory allocation for 2026-2027 via strategic advance agreement.',
        whyItMatters: 'Creates supply tightness for competing accelerator startups seeking custom TSMC base dies.',
        impact: 'High',
        recommendedAction: 'Engage alternative memory suppliers (Samsung, Micron) for 2027 HBM4 allocation reserves.',
        timeHorizon: 'Within 48 hours',
        evidenceCount: 1,
        sourceTypes: ['sec_filing'],
        evidenceLinks: [
          {
            source: 'sec_filing',
            sourceLabel: 'SEC Form 8-K Definitive Agreement',
            title: 'Strategic HBM4 Memory Supply Commitment',
            url: 'https://www.sec.gov/edgar/searchedgar/companysearch',
            date: '2026-08-20',
            excerpt: 'Item 1.01 Entry into Material Agreement signed with delivery schedules starting Q1 2027.',
            supportingReason: 'Legally binding regulatory filing disclosing executed supply agreement.',
            evidenceType: 'primary'
          }
        ]
      }
    ];

    this.intelItems.set(m1.id, itemsM1);
    this.intelItems.set(m2.id, []);

    // Seed Trends for Mission 1
    const trendsM1: TrendSignal[] = [
      {
        id: 'trend-01',
        missionId: 'mission-semicon-01',
        topic: 'Photonic & Optical Interconnects',
        changePercent: '+220%',
        progressPercent: 78,
        summary: 'Massive surge in co-packaged optics (CPO) and optical circuit switching papers to conquer copper reach limits at 200Gbps/lane.',
        velocity: 'accelerating',
        itemCount: 9,
        itemIds: ['item-103'],
        primaryEntities: ['Google / Alphabet', 'NVIDIA Corp.'],
        detectedAt: '2026-08-21T18:00:00Z'
      },
      {
        id: 'trend-02',
        missionId: 'mission-semicon-01',
        topic: 'Microfluidic In-Die Cooling',
        changePercent: '+145%',
        progressPercent: 62,
        summary: 'Direct liquid cooling patent applications up 3x as socket TDP breaches the 1,500W threshold in next-gen AI supercomputers.',
        velocity: 'accelerating',
        itemCount: 6,
        itemIds: ['item-101', 'item-104'],
        primaryEntities: ['NVIDIA Corp.', 'TSMC'],
        detectedAt: '2026-08-21T16:30:00Z'
      },
      {
        id: 'trend-03',
        missionId: 'mission-semicon-01',
        topic: 'ROCm / Open Kernel Ecosystem',
        changePercent: '+45%',
        progressPercent: 38,
        summary: 'Triton-based cross-compilation adoption closing CUDA software moats for open-weights transformer models.',
        velocity: 'emerging',
        itemCount: 4,
        itemIds: ['item-102'],
        primaryEntities: ['AMD'],
        detectedAt: '2026-08-21T14:15:00Z'
      }
    ];

    this.trends.set(m1.id, trendsM1);
    this.trends.set(m2.id, []);

    // Seed Alerts for Mission 1
    const alertsM1: IntelAlert[] = [
      {
        id: 'alert-01',
        missionId: 'mission-semicon-01',
        itemId: 'item-101',
        headline: 'CRITICAL YIELD BREAKTHROUGH: NVIDIA / TSMC',
        reason: 'CoWoS-L substrate redesign boosts Blackwell B200 output by 14.8%, easing Q3-Q4 datacenter shortages.',
        severity: 'critical',
        isRead: false,
        createdAt: '2026-08-21T18:45:00Z',
        source: 'Reuters Tech + SemiAnalysis'
      },
      {
        id: 'alert-02',
        missionId: 'mission-semicon-01',
        itemId: 'item-102',
        headline: 'COMPETITOR ACTIVITY: AMD ROCm 6.4',
        reason: 'FlashAttention-3 parity on MI300X delivers 1.28x token generation speedup on Llama-3.3 models.',
        severity: 'strategic',
        isRead: false,
        createdAt: '2026-08-21T15:15:00Z',
        source: 'GitHub ROCm'
      },
      {
        id: 'alert-03',
        missionId: 'mission-semicon-01',
        itemId: 'item-104',
        headline: 'NEW PATENT FILED: NVIDIA MICROFLUIDICS',
        reason: 'US Patent #11,948,203 reveals direct-on-die liquid microchannels for 1.8kW Rubin accelerators.',
        severity: 'warning',
        isRead: true,
        createdAt: '2026-08-20T21:20:00Z',
        source: 'USPTO Patent Office'
      }
    ];

    this.alerts.set(m1.id, alertsM1);
    this.alerts.set(m2.id, []);

    // Initial System Telemetry Logs
    this.logs = [
      {
        id: 'log-01',
        timestamp: '2026-08-21 14:12:01',
        level: 'INFO',
        message: "Expanding research queries for 'NVIDIA, AMD, Google' -> 12 multi-source sub-vectors generated.",
        stage: 'QueryPlanner'
      },
      {
        id: 'log-02',
        timestamp: '2026-08-21 14:12:03',
        level: 'SUCCESS',
        message: '84 papers & patent abstracts fetched from ArXiv & USPTO APIs. Processing embeddings...',
        stage: 'Ingestion'
      },
      {
        id: 'log-03',
        timestamp: '2026-08-21 14:12:05',
        level: 'WARNING',
        message: 'Duplicate signals detected in News-Feed 3 (Fingerprint collision: 99.1% SimHash). Merged records.',
        stage: 'Dedup'
      },
      {
        id: 'log-04',
        timestamp: '2026-08-21 14:12:08',
        level: 'CRITICAL',
        message: 'Relevance score 0.98 / Impact 0.94 on Blackwell TSMC packaging triggered autonomous alert sequence.',
        stage: 'AlertEngine'
      },
      {
        id: 'log-05',
        timestamp: '2026-08-21 14:12:10',
        level: 'SYSTEM',
        message: 'Calculated Cross-source correlation for Entity: GOOG (ArXiv #2608.09421 linked with OCS cluster).',
        stage: 'TrendCorrelator'
      },
      {
        id: 'log-06',
        timestamp: '2026-08-21 14:12:12',
        level: 'INFO',
        message: 'Autonomous tracker cycle completed. 14 high-value intelligence items indexed. Idle until next cycle.',
        stage: 'Orchestrator'
      }
    ];

    // Seed initial baseline context for Mission 1 (AI Semiconductors)
    this.contexts.set(m1.id, {
      missionId: m1.id,
      currentQuery: m1.objective || m1.name,
      previousQueries: [m1.objective || m1.name],
      researchObjective: m1.objective || m1.name,
      detectedIntent: 'comparative',
      targetEntities: (m1.targetEntities || []).map((e) => ({
        name: e.name,
        ticker: e.ticker,
        role: e.role,
        type: e.type
      })),
      competitors: m1.competitors || [],
      selectedTools: ['search_arxiv', 'search_github'],
      executedTools: ['search_arxiv', 'search_github'],
      relevantKeywords: m1.keywords || [],
      researchAreas: m1.focusAreas || [],
      evidenceSummary: 'Initial intelligence baseline established across academic and open-source ecosystems.',
      verifiedSources: ['arxiv', 'patent', 'news', 'sec_filing', 'github'],
      importantFindings: itemsM1.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        source: item.source,
        whatChanged: item.whatChanged || item.title,
        whyItMatters: item.whyItMatters || item.summary,
        impact: item.impact || 'High',
        publishedAt: item.publishedAt
      })),
      rejectedFindings: [],
      lastResearchTimestamp: m1.lastRunAt || new Date().toISOString(),
      conversationSteps: [
        {
          stepNumber: 1,
          runId: `run-baseline-${m1.id}`,
          query: m1.objective || m1.name,
          timestamp: m1.createdAt || new Date().toISOString(),
          intent: `Initial baseline investigation for ${m1.name}`,
          intentType: 'comparative',
          selectedTools: ['search_arxiv', 'search_github'],
          executedTools: ['search_arxiv', 'search_github'],
          evidenceCount: itemsM1.length,
          findingsCount: itemsM1.length,
          topFindings: itemsM1.slice(0, 3).map((i) => i.title),
          keyEntities: (m1.targetEntities || []).map((e) => e.name),
          planSummary: 'Comparative analysis of TSMC CoWoS packaging and ROCm open-source kernel implementations.',
          analystSummary: 'Synthesized baseline hardware intelligence with cross-source provenance.'
        }
      ],
      followUpQueries: [
        'Find open-source GitHub implementations of ROCm kernels',
        'Compare recent academic benchmarks for Blackwell B200 and MI300X',
        'Analyze memory bandwidth optimization and HBM4 packaging trade-offs'
      ],
      userPreferences: {
        preferredSources: m1.preferredSources,
        focusAreas: m1.focusAreas
      }
    });
  }

  // Getters & Setters
  getMissions(): Mission[] {
    return Array.from(this.missions.values());
  }

  getMission(id: string | null | undefined): Mission | undefined {
    if (!id) return undefined;
    return this.missions.get(id);
  }

  getActiveMissionId(): string | null {
    return this.activeMissionId;
  }

  setActiveMissionId(id: string | null) {
    if (id === null || id === '') {
      this.activeMissionId = null;
    } else if (this.missions.has(id)) {
      this.activeMissionId = id;
    }
  }

  getIntelItems(missionId: string): IntelItem[] {
    return this.intelItems.get(missionId) || [];
  }

  getTrends(missionId: string): TrendSignal[] {
    return this.trends.get(missionId) || [];
  }

  getAlerts(missionId: string): IntelAlert[] {
    return this.alerts.get(missionId) || [];
  }

  getLogs(): SystemLog[] {
    return this.logs.slice(-30);
  }

  addLog(level: SystemLog['level'], message: string, stage?: string) {
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      level,
      message,
      stage
    };
    this.logs.push(newLog);
    if (this.logs.length > 100) {
      this.logs.shift();
    }
    return newLog;
  }

  createMission(mission: Mission): Mission {
    this.missions.set(mission.id, mission);
    if (!this.intelItems.has(mission.id)) this.intelItems.set(mission.id, []);
    if (!this.trends.has(mission.id)) this.trends.set(mission.id, []);
    if (!this.alerts.has(mission.id)) this.alerts.set(mission.id, []);
    this.activeMissionId = mission.id;
    this.addLog('SYSTEM', `New mission instantiated: [${mission.code}] "${mission.name}"`, 'MissionManager');
    return mission;
  }

  updateMission(id: string, updates: Partial<Mission>): Mission | undefined {
    const existing = this.missions.get(id);
    if (!existing) return undefined;

    const updated: Mission = {
      ...existing,
      ...updates,
      id: existing.id, // prevent ID overwrite
      createdAt: existing.createdAt
    };

    this.missions.set(id, updated);
    this.addLog('SYSTEM', `Mission updated: [${updated.code}] "${updated.name}"`, 'MissionManager');
    return updated;
  }

  deleteMission(id: string): boolean {
    if (!this.missions.has(id)) return false;

    const mission = this.missions.get(id);
    this.missions.delete(id);
    this.intelItems.delete(id);
    this.trends.delete(id);
    this.alerts.delete(id);
    this.contexts.delete(id);

    this.addLog('WARNING', `Mission deleted: [${mission?.code || id}] "${mission?.name}"`, 'MissionManager');

    // If active mission was deleted, switch to another available mission
    if (this.activeMissionId === id) {
      const remaining = Array.from(this.missions.keys());
      if (remaining.length > 0) {
        this.activeMissionId = remaining[0];
        const next = this.missions.get(this.activeMissionId);
        this.addLog('SYSTEM', `Switched active mission to: [${next?.code}] "${next?.name}"`, 'MissionManager');
      } else {
        this.activeMissionId = '';
      }
    }

    return true;
  }

  toggleMissionStatus(id: string): Mission | undefined {
    const mission = this.missions.get(id);
    if (!mission) return undefined;

    mission.status = mission.status === 'active' ? 'paused' : 'active';
    this.addLog(
      mission.status === 'active' ? 'SUCCESS' : 'WARNING',
      `Mission status updated: [${mission.code}] is now ${mission.status.toUpperCase()}`,
      'MissionManager'
    );
    return mission;
  }

  addIntelItems(missionId: string, items: IntelItem[]) {
    const existing = this.intelItems.get(missionId) || [];
    // Dedup by fingerprint
    const existingFp = new Set(existing.map((i) => i.fingerprint));
    const newItems = items.filter((i) => !existingFp.has(i.fingerprint));
    const combined = [...newItems, ...existing];
    this.intelItems.set(missionId, combined);

    // Update mission stats
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.totalSignalsScanned += items.length * 15 + Math.floor(Math.random() * 40);
      mission.filteredInsightsCount = combined.length;
      mission.lastRunAt = new Date().toISOString();
    }
  }

  setTrends(missionId: string, trends: TrendSignal[]) {
    this.trends.set(missionId, trends);
  }

  addAlert(alert: IntelAlert) {
    const list = this.alerts.get(alert.missionId) || [];
    list.unshift(alert);
    this.alerts.set(alert.missionId, list);
  }

  markAlertRead(missionId: string, alertId: string): boolean {
    const list = this.alerts.get(missionId) || [];
    const target = list.find((a) => a.id === alertId);
    if (target) {
      target.isRead = true;
      return true;
    }
    return false;
  }

  // =========================================================================
  // TASK 4: RESEARCH CONTEXT & MEMORY STORE
  // =========================================================================

  getContext(missionId: string): ResearchContext {
    let ctx = this.contexts.get(missionId);
    if (!ctx) {
      const mission = this.missions.get(missionId);
      const items = this.intelItems.get(missionId) || [];

      // Accurately derive initial tools from mission preferredSources / objective
      const hasArxiv = !mission?.preferredSources || mission.preferredSources.includes('arxiv');
      const hasGithub = !mission?.preferredSources || mission.preferredSources.includes('github');

      const initialTools: ToolName[] = [];
      if (hasArxiv) initialTools.push('search_arxiv');
      if (hasGithub) initialTools.push('search_github');
      if (initialTools.length === 0) initialTools.push('search_arxiv');

      const initialIntent: ResearchContext['detectedIntent'] =
        initialTools.length > 1
          ? 'comparative'
          : initialTools.includes('search_arxiv')
          ? 'academic_only'
          : 'opensource_only';

      ctx = {
        missionId,
        currentQuery: mission?.objective || mission?.name || '',
        previousQueries: [],
        researchObjective: mission?.objective || mission?.name || '',
        detectedIntent: initialIntent,
        targetEntities: (mission?.targetEntities || []).map((e) => ({
          name: e.name,
          ticker: e.ticker,
          role: e.role,
          type: e.type
        })),
        competitors: mission?.competitors || [],
        selectedTools: initialTools,
        executedTools: initialTools,
        relevantKeywords: mission?.keywords || [],
        researchAreas: mission?.focusAreas || [],
        evidenceSummary: items.length > 0 ? 'Initial intelligence baseline established.' : 'Awaiting initial autonomous research cycle.',
        verifiedSources: (mission?.preferredSources || initialTools.map((t) => (t === 'search_arxiv' ? 'arxiv' : 'github'))) as any,
        importantFindings: items.slice(0, 5).map((item) => ({
          id: item.id,
          title: item.title,
          source: item.source,
          whatChanged: item.whatChanged || item.title,
          whyItMatters: item.whyItMatters || item.summary,
          impact: item.impact || 'High',
          publishedAt: item.publishedAt
        })),
        rejectedFindings: [],
        lastResearchTimestamp: mission?.lastRunAt || new Date().toISOString(),
        conversationSteps: [], // Fresh missions begin with empty step history; execution cycles persist actual validated steps
        followUpQueries: [
          'Find open-source GitHub implementations of these techniques',
          `Compare recent academic benchmarks for ${mission?.targetEntities?.[0]?.name || 'these models'}`,
          'Analyze memory optimization and kernel performance trade-offs'
        ],
        userPreferences: {
          preferredSources: mission?.preferredSources,
          focusAreas: mission?.focusAreas
        }
      };
      this.contexts.set(missionId, ctx);
    }
    return ctx;
  }

  setContext(missionId: string, context: ResearchContext) {
    this.contexts.set(missionId, context);
  }

  updateContext(missionId: string, updates: Partial<ResearchContext>): ResearchContext {
    const existing = this.getContext(missionId);
    const updated: ResearchContext = {
      ...existing,
      ...updates
    };
    this.contexts.set(missionId, updated);
    return updated;
  }

  addConversationStep(missionId: string, step: ResearchStep) {
    const ctx = this.getContext(missionId);
    ctx.conversationSteps.push(step);
    ctx.lastResearchTimestamp = step.timestamp;
    if (step.query && !ctx.previousQueries.includes(step.query)) {
      ctx.previousQueries.push(step.query);
    }
    this.contexts.set(missionId, ctx);
  }

  // Atomically replaces findings for the active mission with the current run findings (preventing stale results)
  replaceIntelItems(missionId: string, items: IntelItem[]) {
    this.intelItems.set(missionId, items);
    const mission = this.missions.get(missionId);
    if (mission) {
      mission.totalSignalsScanned += items.length * 15 + Math.floor(Math.random() * 20);
      mission.filteredInsightsCount = items.length;
      mission.lastRunAt = new Date().toISOString();
    }
  }

  clearIntelItems(missionId: string) {
    this.intelItems.set(missionId, []);
  }

  // ==========================================
  // TASK 6: EVALUATION & BENCHMARKING STORE
  // ==========================================
  saveEvaluationReport(report: EvaluationReport) {
    this.evaluationReports.unshift(report);
    if (this.evaluationReports.length > 20) {
      this.evaluationReports.pop();
    }
  }

  getLatestEvaluation(missionId?: string): EvaluationReport | null {
    if (missionId) {
      const match = this.evaluationReports.find((r) => r.missionId === missionId);
      if (match) return match;
    }
    return this.evaluationReports[0] || null;
  }

  getEvaluationHistory(missionId?: string): EvaluationReport[] {
    if (missionId) {
      return this.evaluationReports.filter((r) => r.missionId === missionId);
    }
    return this.evaluationReports;
  }

  resetEvaluations() {
    this.evaluationReports = [];
  }

  // ==========================================
  // TASK 7: TRACING & OBSERVABILITY STORE
  // ==========================================
  saveTrace(trace: Trace) {
    this.traces.set(trace.traceId, trace);
  }

  getTrace(id: string): Trace | undefined {
    return this.traces.get(id);
  }

  getAllTraces(): Trace[] {
    return Array.from(this.traces.values()).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  getLatestTrace(): Trace | undefined {
    const all = this.getAllTraces();
    return all[0];
  }

  saveBenchmark(benchmark: ControlledFailureBenchmark) {
    this.latestBenchmark = benchmark;
  }

  getLatestBenchmark(): ControlledFailureBenchmark | null {
    return this.latestBenchmark;
  }
}

export const store = new IntelStore();
