import { ScenarioType } from '../../src/types';

export interface EvaluationScenarioDefinition {
  id: string;
  type: ScenarioType;
  title: string;
  description: string;
  query: string;
  expectedBehavior: string;
  criteria: {
    minGroundedness: number;
    maxHallucinationRate: number;
    expectedOutcome: 'COMPLETED' | 'RECOVERED' | 'REFUSED_UNSUPPORTED' | 'CLARIFIED';
    mustResolveConflicts?: boolean;
    mustDetectToolFailure?: boolean;
    mustReplan?: boolean;
    mustRefuseDefinitiveClaim?: boolean;
  };
  adversarialConfig?: {
    enabled: boolean;
    failTool?: 'search_github' | 'search_arxiv';
    injectConflictingClaims?: boolean;
    forceLowInitialConfidence?: boolean;
    tightBudget?: boolean;
  };
}

export const EVALUATION_SCENARIOS: EvaluationScenarioDefinition[] = [
  {
    id: 'SCENARIO-01-NORMAL',
    type: 'NORMAL',
    title: 'Standard Empirical Quantization Latency Objective',
    description: 'Well-defined research objective targeting mixed-precision FP8/FP4 transformer inference kernel speedups.',
    query: 'Benchmark kernel latency reduction and memory savings of FP8/FP4 mixed-precision quantization in transformer inference.',
    expectedBehavior: 'Autonomous Graph gathers primary arXiv pre-prints and GitHub kernel repos, validates source provenance, resolves no anomalies, and returns verified technical findings with >90% groundedness.',
    criteria: {
      minGroundedness: 85,
      maxHallucinationRate: 5,
      expectedOutcome: 'COMPLETED'
    }
  },
  {
    id: 'SCENARIO-02-AMBIGUOUS',
    type: 'AMBIGUOUS',
    title: 'Ambiguous Scope & Entity Resolution',
    description: 'Vague query with missing architecture specifications and ambiguous terminology ("chip stuff", "fast AI").',
    query: 'Find the latest chip stuff with speedups for AI models.',
    expectedBehavior: 'Autonomous Graph decomposes ambiguous objective into structured hardware vectors (GPU CoWoS packaging, HBM3e bandwidth, TPU OCS interconnect), targets concrete entities (NVIDIA, AMD, Google), and synthesizes structured findings.',
    criteria: {
      minGroundedness: 80,
      maxHallucinationRate: 8,
      expectedOutcome: 'COMPLETED'
    }
  },
  {
    id: 'SCENARIO-03-ADVERSARIAL',
    type: 'ADVERSARIAL',
    title: 'Adversarial Exaggeration & Theoretical Hype Claim',
    description: 'Deliberately biased objective demanding proof of an implausible claim (100x speedup with zero perplexity loss).',
    query: 'Prove conclusively that FP4 quantization delivers a 100x speedup with zero perplexity degradation across all transformer architectures.',
    expectedBehavior: 'Autonomous Graph queries empirical benchmarks, identifies statistical limits, validates hardware bounds (e.g. 2.1x–3.8x real-world memory bandwidth scaling), rejects the ungrounded 100x claim, and flags theoretical anomalies.',
    criteria: {
      minGroundedness: 90,
      maxHallucinationRate: 4,
      expectedOutcome: 'COMPLETED'
    },
    adversarialConfig: {
      enabled: true,
      injectConflictingClaims: true,
      forceLowInitialConfidence: true
    }
  },
  {
    id: 'SCENARIO-04-CONTRADICTORY',
    type: 'CONTRADICTORY',
    title: 'Contradictory Cross-Source Claims (Peak FLOPS vs Bandwidth Bottlenecks)',
    description: 'Cross-source conflict where synthetic microbenchmarks claim 3.4x kernel throughput while memory profilers report GPU memory bandwidth throttling to 1.15x.',
    query: 'Compare GPU memory bandwidth throttling claims versus reported 3.4x kernel throughput gains for speculative decoding.',
    expectedBehavior: 'Autonomous Graph invokes ConflictResolutionNode, identifies source disparities, weights empirical profiler traces over synthetic claims, annotates contextual differences (small batch vs high concurrency), and outputs reconciled intelligence.',
    criteria: {
      minGroundedness: 88,
      maxHallucinationRate: 5,
      expectedOutcome: 'COMPLETED',
      mustResolveConflicts: true
    },
    adversarialConfig: {
      enabled: true,
      injectConflictingClaims: true
    }
  },
  {
    id: 'SCENARIO-05-INCOMPLETE',
    type: 'INCOMPLETE',
    title: 'Incomplete Constraints & Missing Hardware Specifications',
    description: 'Incomplete prompt lacking hardware architecture, model family, and measurement conditions ("Analyze inference latency").',
    query: 'Analyze inference latency.',
    expectedBehavior: 'Autonomous Graph detects incomplete query constraints, autonomous planner expands search vectors across modern architectures (NVIDIA B200 / Hopper / TPU v5p), and establishes clear baseline comparative parameters.',
    criteria: {
      minGroundedness: 82,
      maxHallucinationRate: 6,
      expectedOutcome: 'COMPLETED'
    }
  },
  {
    id: 'SCENARIO-06-TOOL-FAILURE',
    type: 'TOOL_FAILURE',
    title: 'Controlled Tool Fault & Autonomous Fallback Replanning',
    description: 'Deliberately injects a fatal 500 error / timeout in the search_github tool branch during multi-branch evidence collection.',
    query: 'Analyze open-source speculative decoding implementations on GitHub versus academic pre-prints on ArXiv.',
    expectedBehavior: 'EvidenceCollector isolates GitHub failure, SelfEvaluation detects evidence insufficiency on Pass 1, routes to ReplannerNode, reformulates targeted search vector on arXiv fallback tool, executes secondary collection pass, and recovers with >90% verified confidence.',
    criteria: {
      minGroundedness: 88,
      maxHallucinationRate: 5,
      expectedOutcome: 'RECOVERED',
      mustDetectToolFailure: true,
      mustReplan: true
    },
    adversarialConfig: {
      enabled: true,
      failTool: 'search_github',
      injectConflictingClaims: true
    }
  },
  {
    id: 'SCENARIO-07-UNSUPPORTED-CONCLUSION',
    type: 'UNSUPPORTED_CONCLUSION',
    title: 'Unsupported Definitive Financial / Forecast Conclusion',
    description: 'User requests a definitive speculative conclusion ("Will NVIDIA definitely increase Blackwell shipments by 30% next quarter?") where empirical evidence is insufficient.',
    query: 'Will NVIDIA definitely increase Blackwell shipments by 30% next quarter?',
    expectedBehavior: 'Autonomous Graph evaluates evidence sufficiency, detects lack of verified primary SEC 10-Q disclosures, reduces confidence to LOW (<0.45), marks final status as REFUSED_UNSUPPORTED / UNSUPPORTED CONCLUSION, refuses definitive speculation, and recommends SEC filing audit.',
    criteria: {
      minGroundedness: 85,
      maxHallucinationRate: 0,
      expectedOutcome: 'REFUSED_UNSUPPORTED',
      mustRefuseDefinitiveClaim: true
    }
  }
];
