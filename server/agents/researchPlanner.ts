import { GoogleGenAI, Type } from '@google/genai';
import { AgentHandoff, ResearchContext, ResearchPlan, ToolName } from '../../src/types';
import { store } from '../store';

export interface PlanObjectiveInput {
  name?: string;
  topic?: string;
  description?: string;
  companies?: string[];
  competitors?: string[];
  keywords?: string[];
  researchInterests?: string[];
  preferredSources?: string[];
  objective?: string;
  context?: ResearchContext;
}

/**
 * Checks for negative exclusions (e.g. "do not search github", "no arxiv", "academic only")
 */
function parseExclusionsAndInclusions(text: string): {
  excludeGithub: boolean;
  excludeArxiv: boolean;
  forceGithubOnly: boolean;
  forceArxivOnly: boolean;
} {
  const lower = text.toLowerCase();
  const excludeGithub =
    lower.includes('do not search github') ||
    lower.includes("don't search github") ||
    lower.includes('no github') ||
    lower.includes('without github') ||
    lower.includes('exclude github') ||
    lower.includes('academic only') ||
    lower.includes('papers only') ||
    lower.includes('arxiv only');

  const excludeArxiv =
    lower.includes('do not search arxiv') ||
    lower.includes("don't search arxiv") ||
    lower.includes('no arxiv') ||
    lower.includes('without arxiv') ||
    lower.includes('do not search academic') ||
    lower.includes("don't search academic") ||
    lower.includes('exclude papers') ||
    lower.includes('exclude arxiv') ||
    lower.includes('github only') ||
    lower.includes('code only') ||
    lower.includes('open source only') ||
    lower.includes('open-source only') ||
    lower.includes('repos only');

  const forceGithubOnly =
    (lower.includes('github') || lower.includes('open-source') || lower.includes('implementation') || lower.includes('code')) &&
    !lower.includes('paper') &&
    !lower.includes('arxiv') &&
    !lower.includes('academic') &&
    !lower.includes('compare');

  const forceArxivOnly =
    (lower.includes('arxiv') || lower.includes('paper') || lower.includes('academic') || lower.includes('literature')) &&
    !lower.includes('github') &&
    !lower.includes('code') &&
    !lower.includes('implementation') &&
    !lower.includes('repo') &&
    !lower.includes('compare');

  return {
    excludeGithub,
    excludeArxiv,
    forceGithubOnly: forceGithubOnly || excludeArxiv,
    forceArxivOnly: forceArxivOnly || excludeGithub
  };
}

/**
 * Fallback rule-based planner if Gemini API is unavailable or for deterministic fallbacks.
 * Incorporates short-term/long-term context to resolve pronouns and follow-up references.
 */
export function generateHeuristicResearchPlan(input: PlanObjectiveInput): { plan: ResearchPlan; handoff: AgentHandoff } {
  const rawText = (input.objective || input.description || input.topic || input.name || 'AI Research').trim();
  const lower = rawText.toLowerCase();
  const ctx = input.context;

  const { excludeGithub, excludeArxiv } = parseExclusionsAndInclusions(rawText);

  // Check if this query is a follow-up referring to previous context
  const isFollowUp =
    lower.includes('these techniques') ||
    lower.includes('this technique') ||
    lower.includes('compare this with') ||
    lower.includes('compare with') ||
    lower.includes('now find') ||
    lower.includes('these models') ||
    lower.includes('the above') ||
    lower.includes('these architectures') ||
    Boolean(ctx && ctx.conversationSteps && ctx.conversationSteps.length > 0 && (lower.startsWith('now ') || lower.startsWith('also ')));

  // Inherit previous entities and key concepts if follow-up
  const previousQuery = ctx?.currentQuery || ctx?.previousQueries?.[ctx.previousQueries.length - 1] || '';
  const previousEntities = ctx?.targetEntities || [];
  const previousFindings = ctx?.importantFindings || [];

  // Determine intent
  const hasAcademicKeyword =
    lower.includes('academic') ||
    lower.includes('paper') ||
    lower.includes('research') ||
    lower.includes('arxiv') ||
    lower.includes('theory') ||
    lower.includes('literature');

  const hasCodeKeyword =
    lower.includes('github') ||
    lower.includes('open-source') ||
    lower.includes('open source') ||
    lower.includes('code') ||
    lower.includes('repo') ||
    lower.includes('implementation') ||
    lower.includes('framework') ||
    lower.includes('library');

  const isExplicitComparison =
    lower.includes('compare') ||
    lower.includes('comparing') ||
    lower.includes('versus') ||
    lower.includes('vs') ||
    lower.includes('benchmark');

  let intentType: ResearchPlan['intentType'] = 'exploratory';
  let selectedTools: ToolName[] = [];

  if (excludeGithub && !excludeArxiv) {
    intentType = 'academic_only';
    selectedTools = ['search_arxiv'];
  } else if (excludeArxiv && !excludeGithub) {
    intentType = 'opensource_only';
    selectedTools = ['search_github'];
  } else if (isExplicitComparison || (hasAcademicKeyword && hasCodeKeyword)) {
    intentType = 'comparative';
    selectedTools = ['search_arxiv', 'search_github'];
  } else if (hasCodeKeyword && !hasAcademicKeyword) {
    intentType = 'opensource_only';
    selectedTools = ['search_github'];
  } else if (hasAcademicKeyword && !hasCodeKeyword) {
    intentType = 'academic_only';
    selectedTools = ['search_arxiv'];
  } else {
    // Default exploratory
    intentType = 'exploratory';
    selectedTools = ['search_arxiv', 'search_github'];
  }

  // Construct search terms incorporating context if follow-up
  let cleanKeywords = rawText
    .replace(/^(research|compare|analyze|investigate|find|look for|track|study|search for|now find|now search|now compare)\s+/i, '')
    .replace(/(by comparing|with|for|recent|latest|academic|research papers|open-source|github implementations|state of the art|do not search github|do not search arxiv|do not search academic papers)\b/gi, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .join(' ')
    .trim();

  // If follow-up mentions "these techniques", blend in the core concepts from previous research
  if (isFollowUp && previousQuery) {
    const prevClean = previousQuery
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['find', 'recent', 'academic', 'research', 'papers', 'about', 'with', 'open-source', 'github'].includes(w.toLowerCase()))
      .slice(0, 4)
      .join(' ');

    if (prevClean && !cleanKeywords.includes(prevClean)) {
      cleanKeywords = `${cleanKeywords} ${prevClean}`.trim();
    }
  }

  if (!cleanKeywords) {
    cleanKeywords = rawText.slice(0, 50).trim() || 'AI Research';
  }

  // Target Entities resolution
  let targetEntities: Array<{ name: string; ticker?: string; role: string; type?: string }> = (input.companies || []).map((c) => ({ name: c, role: 'Target Entity' }));
  if (targetEntities.length === 0 && previousEntities.length > 0 && isFollowUp) {
    targetEntities = previousEntities;
  }
  if (targetEntities.length === 0) {
    if (lower.includes('nvidia') && lower.includes('amd')) {
      targetEntities = [
        { name: 'NVIDIA Corp.', ticker: 'NVDA', role: 'AI Accelerator & GPU Market Leader' },
        { name: 'AMD', ticker: 'AMD', role: 'MI300/MI350 Instinct Accelerators' }
      ];
    } else if (lower.includes('nvidia') || lower.includes('nvda')) {
      targetEntities = [{ name: 'NVIDIA Corp.', ticker: 'NVDA', role: 'AI Accelerator & GPU Market Leader' }];
    } else if (lower.includes('amd')) {
      targetEntities = [{ name: 'AMD', ticker: 'AMD', role: 'MI300/MI350 Instinct Accelerators' }];
    } else if (lower.includes('quantum') || lower.includes('ibm') || lower.includes('google quantum')) {
      targetEntities = [
        { name: 'IBM Quantum', role: 'Superconducting Qubit & Quantum Systems' },
        { name: 'Google Quantum AI', role: 'Sycamore & Surface Code Research' }
      ];
    } else {
      const properWords = rawText
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !/^(the|and|for|with|about|research|find|track|recent|latest|compare|investigate)$/i.test(w))
        .slice(0, 2);
      
      const primaryName = properWords[0] || rawText.slice(0, 30);
      targetEntities = [
        { name: primaryName, role: 'Primary Research Subject' },
        { name: properWords[1] || 'Domain Ecosystem', role: 'Context & Comparative Domain' }
      ];
    }
  }

  const planId = `PLAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const handoffId = `HND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const primaryTopic = targetEntities[0]?.name || rawText.slice(0, 30);

  const plan: ResearchPlan = {
    planId,
    objective: rawText,
    intent: isFollowUp
      ? `Follow-up research: Investigate "${rawText}" using established context from prior research on "${previousQuery || 'prior step'}".`
      : `Investigate and analyze ${rawText}`,
    intentType,
    selectedTools,
    toolQueries: {
      search_arxiv: selectedTools.includes('search_arxiv') ? cleanKeywords : undefined,
      search_github: selectedTools.includes('search_github') ? cleanKeywords : undefined
    },
    researchAreas: [
      `${primaryTopic} Core Principles & Mechanisms`,
      `${primaryTopic} State of the Art & Benchmarks`,
      `${primaryTopic} Emerging Implementations & Trade-Offs`
    ],
    targetEntities,
    searchVectors: ['ArXiv Preprint Repositories', 'GitHub Open Source Commits', 'Technical & Domain Disclosures'],
    hypotheses: [
      `Active research in ${primaryTopic} demonstrates measurable empirical progress and novel methodology.`,
      `Practical implementations and comparative studies reveal strategic trade-offs for ${primaryTopic}.`
    ],
    createdAt: new Date().toISOString()
  };

  const handoff: AgentHandoff = {
    handoffId,
    fromAgent: 'ResearchPlannerAgent',
    toAgent: 'IntelligenceAnalystAgent',
    timestamp: new Date().toISOString(),
    plan,
    instructionsForAnalyst: isFollowUp
      ? `This is a follow-up research task continuing from prior research on "${previousQuery}". Analyze the new live evidence from [${selectedTools.join(', ')}] in conjunction with prior findings, and evaluate cross-step progression.`
      : `Analyze live evidence collected for objective "${rawText}". Cross-correlate findings, identify strategic impact, and synthesize actionable intelligence with source provenance.`,
    status: 'dispatched'
  };

  return { plan, handoff };
}

/**
 * AGENT 1: RESEARCH PLANNER
 * Receives the research objective and optional conversation/mission context, classifies intent,
 * selects research tools truthfully, generates queries tailored to each tool, and outputs
 * a structured ResearchPlan + AgentHandoff payload.
 */
export async function executeResearchPlannerAgent(
  input: PlanObjectiveInput
): Promise<{ plan: ResearchPlan; handoff: AgentHandoff }> {
  const objective = (input.objective || input.description || input.topic || input.name || '').trim();
  const apiKey = process.env.GEMINI_API_KEY;
  const ctx = input.context;

  store.addLog(
    'INFO',
    `AGENT 1 — RESEARCH PLANNER: Initiating research planning for objective: "${objective.slice(0, 100)}..."`,
    'ResearchPlannerAgent'
  );

  const { excludeGithub, excludeArxiv } = parseExclusionsAndInclusions(objective);

  if (!apiKey || !objective) {
    store.addLog('SYSTEM', 'AGENT 1 — RESEARCH PLANNER: Using deterministic heuristic planning engine.', 'ResearchPlannerAgent');
    const result = generateHeuristicResearchPlan(input);
    logPlannerSummary(result.plan, result.handoff);
    return result;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format Context for Gemini
    let contextSummary = 'None (Fresh mission)';
    if (ctx && ctx.conversationSteps && ctx.conversationSteps.length > 0) {
      const stepLines = ctx.conversationSteps
        .slice(-3)
        .map((s, idx) => `  - Step ${s.stepNumber}: "${s.query}" (Tools: ${s.selectedTools.join(', ')}; ${s.findingsCount} findings)`)
        .join('\n');

      const entityNames = ctx.targetEntities.map((e) => e.name).join(', ');
      const topFindings = (ctx.importantFindings || []).slice(0, 3).map((f) => `"${f.title}" (${f.source})`).join('; ');

      contextSummary = `
Active Mission ID: ${ctx.missionId}
Previous Steps:
${stepLines}
Known Entities: ${entityNames || 'None yet'}
Prior Key Findings: ${topFindings || 'None yet'}
`;
    }

    const prompt = `You are AGENT 1: RESEARCH PLANNER for Hackverse Intel, an autonomous AI research & competitive intelligence platform.

Your mission:
1. Parse the user's research objective: "${objective}"
2. Review the historical mission context if available:
${contextSummary}
3. If the user's query refers to previous steps (e.g. "these techniques", "now compare this with AMD", "find implementations of the above"), resolve what "these" / "this" refers to using the prior context.
4. Core Tool Selection Rules:
   - "search_arxiv": Academic papers, scientific preprints, theoretical algorithms, mathematical formulations.
   - "search_github": Open-source repositories, software libraries, code implementations, kernels, benchmarks.
   - STRICT CONSTRAINT: If the user says "do not search github", "no github", "papers only", you MUST NOT select "search_github".
   - STRICT CONSTRAINT: If the user says "do not search arxiv", "no arxiv", "github only", "code only", you MUST NOT select "search_arxiv".
   - If the user asks for both academic and open-source or comparative analysis without exclusions, select BOTH ["search_arxiv", "search_github"].
5. Generate HIGHLY TARGETED, OPTIMIZED queries for each tool:
   - For arXiv: Clean academic terms without conversational filler (e.g., "transformer inference optimization" or "vLLM flashattention kernel").
   - For GitHub: Keyword search query suitable for repository discovery (e.g., "transformer inference optimization" or "vllm tensorrt").
6. Provide specific instructions for AGENT 2 (Intelligence Analyst Agent).

Respond strictly with a valid JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING },
            intentType: {
              type: Type.STRING,
              enum: ['comparative', 'academic_only', 'opensource_only', 'exploratory']
            },
            selectedTools: {
              type: Type.ARRAY,
              items: { type: Type.STRING, enum: ['search_arxiv', 'search_github'] }
            },
            arxivQuery: { type: Type.STRING },
            githubQuery: { type: Type.STRING },
            researchAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            targetEntities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  ticker: { type: Type.STRING },
                  role: { type: Type.STRING }
                },
                required: ['name', 'role']
              }
            },
            hypotheses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            instructionsForAnalyst: { type: Type.STRING }
          },
          required: [
            'intent',
            'intentType',
            'selectedTools',
            'researchAreas',
            'targetEntities',
            'instructionsForAnalyst'
          ]
        }
      }
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    let selectedTools: ToolName[] = Array.isArray(parsed.selectedTools) ? parsed.selectedTools : [];

    // Apply strict negative filter to guarantee truthfulness
    if (excludeGithub) {
      selectedTools = selectedTools.filter((t) => t !== 'search_github');
    }
    if (excludeArxiv) {
      selectedTools = selectedTools.filter((t) => t !== 'search_arxiv');
    }

    // If empty after exclusions, choose the non-excluded one
    if (selectedTools.length === 0) {
      if (!excludeArxiv && excludeGithub) selectedTools = ['search_arxiv'];
      else if (!excludeGithub && excludeArxiv) selectedTools = ['search_github'];
      else selectedTools = ['search_arxiv', 'search_github'];
    }

    // Synchronize intentType with actual selected tools
    let intentType: ResearchPlan['intentType'] = (parsed.intentType as any) || 'exploratory';
    if (selectedTools.includes('search_arxiv') && selectedTools.includes('search_github')) {
      intentType = 'comparative';
    } else if (selectedTools.includes('search_arxiv') && !selectedTools.includes('search_github')) {
      intentType = 'academic_only';
    } else if (selectedTools.includes('search_github') && !selectedTools.includes('search_arxiv')) {
      intentType = 'opensource_only';
    }

    const planId = `PLAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const handoffId = `HND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const plan: ResearchPlan = {
      planId,
      objective,
      intent: parsed.intent || `Investigate ${objective}`,
      intentType,
      selectedTools,
      toolQueries: {
        search_arxiv: selectedTools.includes('search_arxiv') ? (parsed.arxivQuery || parsed.intent || objective) : undefined,
        search_github: selectedTools.includes('search_github') ? (parsed.githubQuery || parsed.intent || objective) : undefined
      },
      researchAreas: Array.isArray(parsed.researchAreas) && parsed.researchAreas.length > 0 ? parsed.researchAreas : [
        'Hardware-Aware Architecture Optimization',
        'Kernel Compilation & Memory Bandwidth',
        'Model Compression & Low-Precision Inference'
      ],
      targetEntities: Array.isArray(parsed.targetEntities) && parsed.targetEntities.length > 0 ? parsed.targetEntities : [
        { name: 'NVIDIA Corp.', ticker: 'NVDA', role: 'AI Accelerator Leader' }
      ],
      searchVectors: ['ArXiv Preprint Repositories', 'GitHub Open Source Commits', 'Industry Disclosures'],
      hypotheses: Array.isArray(parsed.hypotheses) && parsed.hypotheses.length > 0 ? parsed.hypotheses : [
        'Open-source software stacks are rapidly closing efficiency gaps for production LLM serving.'
      ],
      createdAt: new Date().toISOString()
    };

    const handoff: AgentHandoff = {
      handoffId,
      fromAgent: 'ResearchPlannerAgent',
      toAgent: 'IntelligenceAnalystAgent',
      timestamp: new Date().toISOString(),
      plan,
      instructionsForAnalyst: parsed.instructionsForAnalyst || `Evaluate collected evidence against research plan [${planId}] and synthesize actionable intelligence.`,
      status: 'dispatched'
    };

    logPlannerSummary(plan, handoff);
    return { plan, handoff };
  } catch (err: any) {
    store.addLog(
      'WARNING',
      `AGENT 1 — RESEARCH PLANNER: Gemini planning error (${err.message}), falling back to deterministic planning.`,
      'ResearchPlannerAgent'
    );
    const fallback = generateHeuristicResearchPlan(input);
    logPlannerSummary(fallback.plan, fallback.handoff);
    return fallback;
  }
}

function logPlannerSummary(plan: ResearchPlan, handoff: AgentHandoff) {
  store.addLog('SUCCESS', `AGENT 1 — RESEARCH PLANNER: Objective understood: "${plan.objective.slice(0, 80)}"`, 'ResearchPlannerAgent');
  store.addLog('INFO', `AGENT 1 — RESEARCH PLANNER: Intent classified as [${plan.intentType.toUpperCase()}]. Tools selected: [${plan.selectedTools.join(', ')}]`, 'ResearchPlannerAgent');
  if (plan.toolQueries.search_arxiv) {
    store.addLog('INFO', `AGENT 1 — RESEARCH PLANNER: Optimized arXiv query -> "${plan.toolQueries.search_arxiv}"`, 'ResearchPlannerAgent');
  }
  if (plan.toolQueries.search_github) {
    store.addLog('INFO', `AGENT 1 — RESEARCH PLANNER: Optimized GitHub query -> "${plan.toolQueries.search_github}"`, 'ResearchPlannerAgent');
  }
  store.addLog('SUCCESS', `AGENT 1 — RESEARCH PLANNER: Plan [${plan.planId}] generated with ${plan.targetEntities.length} entities and ${plan.researchAreas.length} focus areas.`, 'ResearchPlannerAgent');
  store.addLog('SYSTEM', `AGENT 1 — RESEARCH PLANNER: Dispatched Handoff [${handoff.handoffId}] to Agent 2 (Intelligence Analyst).`, 'ResearchPlannerAgent');
}
